import { useState, useEffect, useCallback } from "react";
import { api } from "../api";

export function useContainerAssignment({
  orders,
  selectedOrders,
  setSelectedOrders,
  showSnackbar,
  fetchOrders,
}) {
  const [containers, setContainers] = useState([]);
  const [loadingContainers, setLoadingContainers] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [openAssignModal, setOpenAssignModal] = useState(false);
  const [openDirectAssign, setOpenDirectAssign] = useState(false);
  const [directSelectedContainers, setDirectSelectedContainers] =
    useState(null);
  const [tempOrderId, setTempOrderId] = useState(null);

  const fetchContainers = useCallback(async () => {
    if (loadingContainers) return;
    setLoadingContainers(true);
    try {
      const response = await api.get("/api/containers");
      setContainers(response.data.data || []);
    } catch (err) {
      console.error("Error fetching containers:", err);
      showSnackbar("Failed to fetch containers", "error");
    } finally {
      setLoadingContainers(false);
    }
  }, [loadingContainers, showSnackbar]);

  useEffect(() => {
    fetchContainers();
  }, [openAssignModal]);

  const handleAssign = async (assignments) => {
    if (!assignments || Object.keys(assignments).length === 0) {
      showSnackbar("No valid assignments provided.", "warning");
      return;
    }
    let hasValid = false;
    Object.values(assignments).forEach((orderAssign) =>
      Object.values(orderAssign).forEach((recAssign) =>
        Object.values(recAssign).forEach((detail) => {
          const qty = parseInt(detail.qty, 10);
          const assignedWeight = parseFloat(
            detail.totalAssignedWeight ?? detail.weight ?? 0,
          );
          if (
            qty > 0 &&
            assignedWeight > 0 &&
            Array.isArray(detail.containers) &&
            detail.containers.length > 0 &&
            detail.orderItemId
          ) {
            hasValid = true;
          }
        }),
      ),
    );
    if (!hasValid) {
      showSnackbar(
        "Please assign qty > 0, weight > 0, containers, and orderItemId to at least one detail.",
        "warning",
      );
      return;
    }

    const cleanAssignments = {};
    Object.entries(assignments).forEach(([orderIdStr, orderAssign]) => {
      const cleanOrder = {};
      Object.entries(orderAssign).forEach(([recIdStr, recAssign]) => {
        const cleanRec = {};
        Object.entries(recAssign).forEach(([idxStr, detail]) => {
          if (!detail.orderItemId) return;
          const containerIds = (detail.containers || [])
            .map((cid) => parseInt(cid, 10))
            .filter((cid) => !isNaN(cid));
          const qty = parseInt(detail.qty, 10);
          const weightKg = parseFloat(
            detail.totalAssignedWeight ?? detail.weight ?? 0,
          );
          if (qty > 0 && weightKg > 0 && containerIds.length > 0) {
            cleanRec[idxStr] = {
              orderItemId: parseInt(detail.orderItemId),
              qty,
              totalAssignedWeight: weightKg,
              containers: containerIds,
              loadingDate: detail.loadingDate || null,
            };
          }
        });
        if (Object.keys(cleanRec).length > 0) cleanOrder[recIdStr] = cleanRec;
      });
      if (Object.keys(cleanOrder).length > 0)
        cleanAssignments[orderIdStr] = cleanOrder;
    });

    if (Object.keys(cleanAssignments).length === 0) {
      showSnackbar("No valid assignments after cleaning.", "warning");
      return;
    }

    try {
      const res = await api.post("/api/orders/assign-container", {
        assignments: cleanAssignments,
      });
      const { success, message, tracking } = res.data;
      if (success) {
        showSnackbar(
          message ||
            `Assigned successfully (${tracking?.length || 0} receivers)`,
          "success",
        );
        fetchContainers();
        fetchOrders();
        setSelectedOrders([]);
        setSelectedContainer("");
      } else {
        throw new Error(message || "Assignment failed");
      }
    } catch (err) {
      console.error("Assignment error:", err);
      showSnackbar(
        err.response?.data?.error ||
          err.response?.data?.details ||
          err.message ||
          "Failed to assign containers",
        "error",
      );
    }
  };

  const handleOpenDirectAssign = async (tempData) => {
    setLoadingContainers(true);
    let orderIdRaw;
    if (Array.isArray(tempData) && tempData.length > 0)
      orderIdRaw = tempData[0];
    else if (
      typeof tempData === "number" ||
      (typeof tempData === "string" && !isNaN(Number(tempData)))
    )
      orderIdRaw = tempData;
    else if (tempData && typeof tempData === "object")
      orderIdRaw = tempData?.orderId || tempData?.id || tempData?.order_id;

    const orderId = Number(orderIdRaw);
    if (!orderIdRaw || isNaN(orderId) || orderId <= 0) {
      showSnackbar(
        "Cannot open assignment dialog — no valid order selected",
        "error",
      );
      setLoadingContainers(false);
      return;
    }
    setTempOrderId(orderId);

    try {
      const response = await api.get("/api/containers");
      const available = (response.data.data || []).filter((c) => {
        const status = (c.current_status || "").trim();
        return status === "Available" || status === "Assigned to Job";
      });
      setContainers(available);
    } catch (err) {
      console.error("Error fetching containers:", err);
      showSnackbar("Failed to fetch containers", "error");
    } finally {
      setLoadingContainers(false);
      setOpenDirectAssign(true);
    }
  };

  const handleCloseDirectAssign = () => {
    setOpenDirectAssign(false);
    setDirectSelectedContainers(null);
  };

  const handleDirectAssign = async () => {
    if (!directSelectedContainers || !selectedOrders.length) {
      showSnackbar(
        "Please select a container and at least one order.",
        "warning",
      );
      return;
    }
    setAssigning(true);
    try {
      const status = (directSelectedContainers.current_status || "").trim();
      if (status !== "Available" && status !== "Assigned to Job") {
        throw new Error(
          `Container ${directSelectedContainers.container_number} cannot be assigned. Current status: ${status}`,
        );
      }
      const targets = [];
      console.log(
        "orders for assignment:",
        selectedOrders.map((id) => orders.find((o) => o.id === id)),
      );
      for (const orderId of selectedOrders) {
        const order = orders.find((o) => o.id === orderId);
        if (!order?.receivers?.length) continue;
        const uniqueReceivers = Array.from(
          new Map((order.receivers || []).map((r) => [r.id, r])).values(),
        );
        for (const receiver of uniqueReceivers) {
          if (!receiver?.id) continue;
          const details =
            receiver.shippingdetails || receiver.shippingDetails || [];
          details.forEach((detail, idx) => {
            const assignedSoFar = (detail.containerDetails || []).reduce(
              (sum, cd) => sum + Number(cd.assign_total_box ?? 0),
              0,
            );
            const remaining = parseInt(
              detail.remainingItems ??
                detail.remaining ??
                Number(detail.totalNumber || 0) - assignedSoFar,
              10,
            );

            if (remaining <= 0) return;
            targets.push({
              orderId: String(orderId),
              receiverId: String(receiver.id),
              detailIndex: String(idx),
              remainingQty: remaining,
            });
          });
        }
      }
      if (!targets.length)
        throw new Error(
          "No receivers with remaining quantity found in selected orders",
        );

      const containerId =
        directSelectedContainers.cid ||
        directSelectedContainers.container_number;
      const assignmentList = targets.map((t) => ({
        orderId: t.orderId,
        receiverId: t.receiverId,
        detailIndex: t.detailIndex,
        containerId: String(containerId),
        qty: t.remainingQty,
      }));
      const response = await api.post("/api/orders/assign-containers-batch", {
        assignments: assignmentList,
        requestedOrderIds: selectedOrders.map(String),
        totalContainers: 1,
      });
      if (!response.data?.success)
        throw new Error(response.data?.message || "Server rejected assignment");

      const { skipped = [] } = response.data;
      showSnackbar(
        `Container ${directSelectedContainers.container_number} assigned successfully.`,
        "success",
      );
      if (skipped.length > 0)
        showSnackbar(`${skipped.length} assignment(s) skipped.`, "warning");

      await fetchContainers();
      await fetchOrders();
    } catch (err) {
      console.error("Direct assignment error:", err);
      let msg = err.message || "Failed to assign container";
      if (err.response?.data) {
        const { error, details, message, skipped } = err.response.data;
        msg = details || message || error || msg;
        if (skipped?.length) msg += ` (${skipped.length} skipped)`;
      }
      showSnackbar(msg, "error");
    } finally {
      setAssigning(false);
      setOpenDirectAssign(false);
      setDirectSelectedContainers(null);
    }
  };

  return {
    containers,
    loadingContainers,
    selectedContainer,
    setSelectedContainer,
    assigning,
    openAssignModal,
    setOpenAssignModal,
    openDirectAssign,
    setOpenDirectAssign,
    directSelectedContainers,
    setDirectSelectedContainers,
    tempOrderId,
    fetchContainers,
    handleAssign,
    handleOpenDirectAssign,
    handleCloseDirectAssign,
    handleDirectAssign,
  };
}
