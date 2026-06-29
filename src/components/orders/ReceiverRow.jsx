import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Card,
  Chip,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import AssignmentForm from "../../pages/Orders/AssignForm";
import { api } from "../../api";

export const ReceiverRow = React.memo(
  ({
    rec,
    globalIndex,
    detailedOrders,
    orders,
    expandedReceivers,
    setExpandedReceivers,
    getDetailKey,
    assignmentQuantities,
    setAssignmentQuantities,
    assignmentWeights,
    setAssignmentWeights,
    selectedContainersPerDetail,
    setSelectedContainersPerDetail,
    loadingDate,
    setLoadingDate,
    availableContainers,
    setSnackbar,
    fetchOrders,
    fetchContainers,
  }) => {
    const fullOrder =
      detailedOrders?.[rec.orderId] ||
      orders?.find((o) => o.id === rec.orderId) ||
      null;

    if (!fullOrder) {
      return (
        <TableRow>
          <TableCell colSpan={13} align="center" sx={{ py: 4 }}>
            <Typography color="text.secondary">
              Loading order {rec.orderId || "—"}...
            </Typography>
          </TableCell>
        </TableRow>
      );
    }

    const fullRec = fullOrder.receivers?.find((r) => r.id === rec.id) || rec;
    const shippingDetails =
      fullRec.shippingdetails || fullRec.shippingDetails || [];

    const [localShippingDetails, setLocalShippingDetails] = useState(() =>
      shippingDetails.map((sd) => ({
        ...sd,
        containerDetails: (sd.containerDetails || []).filter((cd) => {
          const b = Number(cd?.assign_total_box ?? 0);
          const w = Number(cd?.assign_weight ?? 0);
          return b >= 1 && w >= 0.01 && !!cd?.container?.cid;
        }),
        remainingItems: String(
          Math.max(
            0,
            Number(sd.totalNumber ?? 0) -
              (sd.containerDetails || []).reduce(
                (s, c) => s + Number(c.assign_total_box ?? 0),
                0,
              ),
          ),
        ),
      })),
    );

    useEffect(() => {
      setLocalShippingDetails(
        shippingDetails.map((sd) => ({
          ...sd,
          containerDetails: (sd.containerDetails || []).filter((cd) => {
            const b = Number(cd?.assign_total_box ?? 0);
            const w = Number(cd?.assign_weight ?? 0);
            return b >= 1 && w >= 0.01 && !!cd?.container?.cid;
          }),
          remainingItems: String(
            Math.max(
              0,
              Number(sd.totalNumber ?? 0) -
                (sd.containerDetails || []).reduce(
                  (s, c) => s + Number(c.assign_total_box ?? 0),
                  0,
                ),
            ),
          ),
        })),
      );
    }, [shippingDetails]);

    const getRemainingWeight = useCallback((sd) => {
      const assigned = (sd.containerDetails || []).reduce(
        (sum, cd) => sum + Number(cd.assign_weight ?? 0),
        0,
      );
      return Math.max(0, Number(sd.weight ?? 0) - assigned);
    }, []);

    const totalRemainingUnits = localShippingDetails.reduce(
      (sum, sd) => sum + Number(sd.remainingItems ?? 0),
      0,
    );
    const totalRemainingWeight = localShippingDetails.reduce(
      (sum, sd) => sum + getRemainingWeight(sd),
      0,
    );

    const address =
      localShippingDetails
        .map((d) => d.deliveryAddress)
        .filter(Boolean)
        .join(", ") ||
      fullRec.receiverAddress ||
      "N/A";
    const contact = fullRec.receiverContact || "N/A";
    const email = fullRec.receiverEmail || "N/A";

    const existingContainers = localShippingDetails.flatMap((sd) =>
      (sd.containerDetails || [])
        .map((cd) => cd.container?.cid)
        .filter(Boolean),
    );

    const allContainersPreview = [
      ...new Set(
        existingContainers.map(
          (cid) =>
            availableContainers.find((c) => String(c.cid) === String(cid))
              ?.container_number || String(cid),
        ),
      ),
    ];

    const hasShippingDetails = localShippingDetails.length > 0;
    const isExpanded = expandedReceivers.has(`${rec.orderId}-${rec.id}`);

    const handleRemoveAllForReceiver = async () => {
      const totalAssigned = localShippingDetails.reduce(
        (sum, sd) =>
          sum +
          (sd.containerDetails || []).reduce(
            (s, cd) => s + Number(cd.assign_total_box ?? 0),
            0,
          ),
        0,
      );

      if (totalAssigned === 0) return;

      const prevState = [...localShippingDetails];
      setLocalShippingDetails((prev) =>
        prev.map((sd) => ({
          ...sd,
          containerDetails: [],
          remainingItems: String(Number(sd.totalNumber ?? 0)),
        })),
      );

      try {
        const payload = { [rec.orderId]: { [rec.id]: { full: true } } };
        const res = await api.post("/api/orders/remove-assign-container", {
          assignments: payload,
        });

        if (res.data.success) {
          setSnackbar({
            open: true,
            message: "Removed successfully",
            severity: "success",
          });
          fetchOrders?.();
          fetchContainers?.();
        } else throw new Error("Failed");
      } catch (err) {
        setLocalShippingDetails(prevState);
        setSnackbar({
          open: true,
          message: "Failed to remove",
          severity: "error",
        });
      }
    };

    const handleRemoveSingleContainer = async (detail, contDetail) => {
      const cid = contDetail?.container?.cid;
      if (!cid) return;

      const prevState = [...localShippingDetails];

      setLocalShippingDetails((prev) =>
        prev.map((sd) =>
          sd.id === detail.id
            ? {
                ...sd,
                containerDetails: sd.containerDetails.filter(
                  (c) => c.container?.cid !== cid,
                ),
                remainingItems: String(
                  Number(sd.totalNumber ?? 0) -
                    (sd.containerDetails || []).reduce(
                      (s, c) =>
                        s +
                        (c.container?.cid === cid
                          ? 0
                          : Number(c.assign_total_box ?? 0)),
                      0,
                    ),
                ),
              }
            : sd,
        ),
      );

      try {
        const payload = {
          [rec.orderId]: {
            [rec.id]: {
              [detail.id]: {
                orderItemId: detail.id,
                containers: [cid],
                qty: Number(contDetail.assign_total_box ?? 0),
                totalAssignedWeight: Number(contDetail.assign_weight ?? 0),
              },
            },
          },
        };

        const res = await api.post("/api/orders/remove-assign-container", {
          assignments: payload,
        });

        if (res.data.success) {
          setSnackbar({
            open: true,
            message: "Container removed",
            severity: "success",
          });
          fetchOrders?.();
        } else throw new Error();
      } catch (err) {
        console.error("Remove single container failed:", err);
        setLocalShippingDetails(prevState);
        setSnackbar({
          open: true,
          message:
            err?.response?.data?.error ||
            err?.message ||
            "Failed to remove container",
          severity: "error",
        });
      }
    };

    const subRows = useMemo(() => {
      if (!isExpanded || !hasShippingDetails) return null;

      return localShippingDetails.map((detail, idx) => {
        const keyDetail = getDetailKey(rec.orderId, rec.id, idx);
        const remainingUnits = Number(detail.remainingItems ?? 0);
        const totalUnits = Number(detail.totalNumber ?? 0);
        const progress =
          totalUnits > 0
            ? ((totalUnits - remainingUnits) / totalUnits) * 100
            : 0;

        const validContainers = (detail.containerDetails || []).filter((cd) => {
          const b = Number(cd?.assign_total_box ?? 0);
          const w = Number(cd?.assign_weight ?? 0);
          return b >= 1 && w >= 0.01 && !!cd?.container?.cid;
        });

        return (
          <TableRow key={keyDetail} sx={{ bgcolor: "palette.primary.main" }}>
            <TableCell colSpan={13}>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Detail {idx + 1} — {detail.category || "—"} • {totalUnits}{" "}
                    pcs • {detail.weight || "?"} kg
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid
                    container
                    flex={1}
                    flexDirection={"row"}
                    justifyContent={"space-around"}
                    spacing={3}
                  >
                    <Grid item width={600} xs={24} md={12}>
                      <Typography variant="body2" color="primary" gutterBottom>
                        Current Assignments
                      </Typography>
                      <Stack spacing={1.5}>
                        {validContainers.length > 0 ? (
                          validContainers.map((cd, i) => (
                            <Card key={i} variant="outlined" sx={{ p: 1.5 }}>
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Typography fontWeight={600}>
                                  {cd.container?.container_number || "—"}
                                </Typography>
                                <Stack direction="row" spacing={1}>
                                  <Chip
                                    label={`${cd.assign_total_box ?? 0} pcs`}
                                    color="success"
                                    size="small"
                                  />
                                  <Chip
                                    label={`${Number(cd.assign_weight ?? 0).toFixed(2)} kg`}
                                    color="primary"
                                    variant="outlined"
                                    size="small"
                                  />
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() =>
                                      handleRemoveSingleContainer(detail, cd)
                                    }
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Stack>
                              </Stack>
                            </Card>
                          ))
                        ) : (
                          <Typography color="text.secondary">
                            No containers assigned
                          </Typography>
                        )}
                      </Stack>
                    </Grid>
                    <Grid item xs={24} md={12}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Assign New Containers
                      </Typography>

                      <AssignmentForm
                        keyDetail={keyDetail}
                        detailRemaining={remainingUnits}
                        detailRemainingWeight={getRemainingWeight(detail)}
                        assignmentQuantities={assignmentQuantities}
                        setAssignmentQuantities={setAssignmentQuantities}
                        assignmentWeights={assignmentWeights}
                        setAssignmentWeights={setAssignmentWeights}
                        loadingDate={loadingDate}
                        setLoadingDate={setLoadingDate}
                        selectedContainersPerDetail={
                          selectedContainersPerDetail
                        }
                        setSelectedContainersPerDetail={
                          setSelectedContainersPerDetail
                        }
                        availableContainers={availableContainers}
                        onAssignPreview={(previewData) => {}}
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{ height: 8 }}
                    color="primary"
                  />
                  <Typography
                    variant="caption"
                    align="center"
                    display="block"
                    mt={1}
                  >
                    {remainingUnits} remaining / {totalUnits} total
                  </Typography>
                </AccordionDetails>
              </Accordion>
            </TableCell>
          </TableRow>
        );
      });
    }, [
      isExpanded,
      hasShippingDetails,
      localShippingDetails,
      getDetailKey,
      rec.orderId,
      rec.id,
    ]);
    return (
      <>
        <TableRow hover>
          <TableCell>{rec.id || "—"}</TableCell>
          <TableCell>{fullRec.receiver_name || "—"}</TableCell>
          <TableCell>{fullOrder.booking_ref || "—"}</TableCell>
          <TableCell>
            <Tooltip title={address}>
              <span>
                {address.slice(0, 24)}
                {address.length > 24 ? "..." : ""}
              </span>
            </Tooltip>
          </TableCell>
          <TableCell>{fullRec.receiver_contact}</TableCell>
          <TableCell>{fullRec.receiver_email}</TableCell>
          <TableCell>{totalRemainingWeight.toFixed(2)} kg</TableCell>
          <TableCell>{fullRec.total_number ?? "—"}</TableCell>
          <TableCell>
            <Chip
              label={Math.max(
                0,
                (fullRec.total_number ?? 0) - totalRemainingUnits,
              )}
              color="success"
              size="small"
            />
          </TableCell>
          <TableCell>
            <Chip
              label={totalRemainingUnits}
              color={totalRemainingUnits > 0 ? "warning" : "success"}
              variant="outlined"
              size="small"
            />
          </TableCell>
          <TableCell>
            <Typography fontWeight="medium">
              {/* You can show new assignment preview here if needed */}
            </Typography>
          </TableCell>
          <TableCell>
            <Chip
              label={
                allContainersPreview.length
                  ? allContainersPreview.join(", ")
                  : "None"
              }
              color={allContainersPreview.length ? "success" : "default"}
              size="small"
              variant="outlined"
            />
          </TableCell>
          <TableCell>
            <Stack direction="row" spacing={1}>
              {hasShippingDetails && (
                <IconButton
                  size="small"
                  onClick={() => {
                    const key = `${rec.orderId}-${rec.id}`;
                    setExpandedReceivers((prev) => {
                      const next = new Set(prev);
                      if (next.has(key)) next.delete(key);
                      else next.add(key);
                      return next;
                    });
                  }}
                >
                  {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              )}
              {existingContainers.length > 0 && (
                <IconButton
                  size="small"
                  color="error"
                  onClick={handleRemoveAllForReceiver}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Stack>
          </TableCell>
        </TableRow>

        {subRows}
      </>
    );
  },
);
