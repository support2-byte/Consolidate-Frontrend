import jsPDF from "jspdf";
import { applyPlugin } from "jspdf-autotable";
import { api } from "../api";
import { BRAND } from "../constants/containers";
import {
  loadImageAsBase64,
  pdfDrawSectionHeader,
  pdfDrawLabelValue,
  pdfDrawDivider,
  pdfAddFooters,
  pdfManifestHeader,
  buildReceiversData,
  buildCategoryRows,
  manifestTableStyles,
} from "../Utlis/containerBuilder";

applyPlugin(jsPDF);

export const usePDFGenerators = ({
  historyCid,
  selectedContainerNo,
  usageHistory,
  getPlaceName,
  showToast,
  setGeneratingPDF,
}) => {
  const renderManifestSection = (
    doc,
    {
      matchedContainerNumber,
      containerSize,
      receiversData,
      margin,
      pageWidth,
      containerIndex,
    },
  ) => {
    const { teal, lightGrey, borderGrey } = BRAND;
    let y = doc.lastAutoTable?.finalY || 50;

    doc.setDrawColor(...teal).setLineWidth(0.4);
    doc.rect(margin, y, pageWidth - 2 * margin, 7, "S");
    doc
      .setFont("helvetica", "bold")
      .setFontSize(9)
      .setTextColor(...teal);
    doc.text(
      `CONTAINER ${containerIndex + 1}: ${matchedContainerNumber} | SIZE: ${containerSize}`,
      margin + 3,
      y + 5,
    );
    y += 12;

    if (!receiversData.length) {
      doc.setFont("helvetica", "italic").setFontSize(9).setTextColor(150, 0, 0);
      doc.text("No receiver details found for this consignment.", margin, y);
      return y + 10;
    }

    const totalPkgs = receiversData.reduce((s, r) => s + r.totalNumber, 0);
    const totalWt = receiversData.reduce((s, r) => s + r.weight, 0);

    y = pdfDrawSectionHeader(
      doc,
      `CONTAINER SUMMARY - ${matchedContainerNumber}`,
      y,
      margin,
    );
    doc.autoTable({
      head: [
        [
          "ORDERS IN CONTAINER",
          "TOTAL PACKAGES",
          "TOTAL WEIGHT (KGS)",
          "GROSS WEIGHT (APPROX.)",
        ],
      ],
      body: [
        [
          receiversData.length.toString(),
          totalPkgs.toString(),
          totalWt.toFixed(2),
          (totalWt * 1.15).toFixed(2),
        ],
      ],
      startY: y,
      ...manifestTableStyles,
      styles: { ...manifestTableStyles.styles, halign: "center" },
      margin: { left: margin, right: margin },
    });
    y = doc.lastAutoTable.finalY + 8;

    y = pdfDrawSectionHeader(
      doc,
      `CONTAINER COMMODITY SUMMARY - ${matchedContainerNumber}`,
      y,
      margin,
    );
    doc
      .setFont("helvetica", "italic")
      .setFontSize(8)
      .setTextColor(120, 120, 120);
    doc.text("Commodity-wise breakdown for this container", margin, y + 1);
    y += 6;

    const { rows: catRows } = buildCategoryRows(receiversData);
    doc.autoTable({
      head: [["COMMODITY", "TOTAL ORDERS", "TOTAL PKGS", "TOTAL WEIGHT (KGS)"]],
      body: catRows,
      startY: y,
      ...manifestTableStyles,
      margin: { left: margin, right: margin },
    });
    y = doc.lastAutoTable.finalY + 8;

    y = pdfDrawSectionHeader(
      doc,
      `ORDER DETAILS - ${matchedContainerNumber}`,
      y,
      margin,
    );

    // FIX: data rows now have all 8 values matching the 8-column header:
    // S.NO | ORDER NO | SENDER | RECEIVER | MARKS & NOS | PKGS | WEIGHT | COMMODITY
    const detailRows = receiversData.map((r, i) => [
      (i + 1).toString(),
      r.bookingRef,
      r.senderName,
      r.receiverName,
      (i + 1).toString(), // Marks & Nos — sequential mark number per line
      r.totalNumber.toString(),
      r.weight.toFixed(2),
      r.category + (r.subcategory !== "N/A" ? ` - ${r.subcategory}` : ""),
    ]);

    // TOTAL row: colSpan 5 covers S.NO → MARKS & NOS, then PKGS, WEIGHT, COMMODITY(blank)
    detailRows.push([
      {
        content: "TOTAL",
        colSpan: 5,
        styles: { halign: "right", fontStyle: "bold" },
      },
      { content: totalPkgs.toString(), styles: { fontStyle: "bold" } },
      { content: totalWt.toFixed(2), styles: { fontStyle: "bold" } },
      { content: "" },
    ]);

    doc.autoTable({
      head: [
        [
          "S.NO",
          "ORDER NO",
          "SENDER",
          "RECEIVER",
          "MARKS & NOS",
          "PKGS",
          "WEIGHT\n(KG)",
          "COMMODITY",
        ],
      ],
      body: detailRows,
      startY: y,
      ...manifestTableStyles,
      styles: {
        ...manifestTableStyles.styles,
        fontSize: 8,
        cellPadding: 2.5,
        overflow: "linebreak",
        valign: "top",
      },
      bodyStyles: { fillColor: [255, 255, 255], textColor: [30, 30, 30] },
      columnStyles: {
        0: { cellWidth: 14, halign: "center" },
        1: { cellWidth: 28 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
        4: { cellWidth: 18, halign: "center" },
        5: { cellWidth: 14, halign: "center" },
        6: { cellWidth: 16, halign: "center" },
        7: { cellWidth: 32 },
      },
      margin: { left: margin, right: margin },
      didParseCell(data) {
        if (data.section === "body" && data.row.index % 2 === 1)
          data.cell.styles.fillColor = BRAND.lightGrey;
      },
    });

    return doc.lastAutoTable.finalY + 10;
  };

  const fetchContainerMeta = async (cid, allOrdersMap) => {
    let matchedContainerNumber = selectedContainerNo || "N/A";

    outer: for (const orderData of Object.values(allOrdersMap)) {
      for (const receiver of orderData.receivers || []) {
        for (const detail of receiver.shippingDetails || []) {
          for (const cd of detail.containerDetails || []) {
            if (cd.container?.cid === cid) {
              matchedContainerNumber = cd.container.container_number;
              break outer;
            }
          }
        }
      }
    }

    let containerSize = "N/A";
    try {
      const res = await api.get(`/api/containers/${cid}`);
      containerSize = res.data?.container_size || "N/A";
      if (!matchedContainerNumber || matchedContainerNumber === "N/A")
        matchedContainerNumber = res.data?.container_number || "N/A";
    } catch (err) {
      console.error("Error fetching container meta:", err);
    }

    return { matchedContainerNumber, containerSize };
  };

  const generateFullManifestPDF = async () => {
    const consignmentGroups = (usageHistory || []).filter(
      (c) => c.orders?.length > 0,
    );
    if (!consignmentGroups.length) {
      showToast("No consignment data available to print", "warning");
      return;
    }

    setGeneratingPDF(true);
    try {
      const uniqueOrderIds = [
        ...new Set(
          consignmentGroups
            .flatMap((c) => c.orders || [])
            .map((e) => e.orderId?.toString())
            .filter(Boolean),
        ),
      ];
      const allOrdersMap = {};
      for (const id of uniqueOrderIds) {
        try {
          const res = await api.get(`/api/orders/${id}`, {
            params: { includeOrders: true },
          });
          if (res.data) allOrdersMap[id] = res.data;
        } catch {}
      }

      const { matchedContainerNumber, containerSize } =
        await fetchContainerMeta(historyCid, allOrdersMap);

      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      let firstPage = true;

      for (let ci = 0; ci < consignmentGroups.length; ci++) {
        const consignment = consignmentGroups[ci];
        const consignmentOrderIds = [
          ...new Set(
            (consignment.orders || [])
              .map((e) => e.orderId?.toString())
              .filter(Boolean),
          ),
        ];
        const receiversData = buildReceiversData(
          consignmentOrderIds,
          allOrdersMap,
        );

        const firstEvent = consignment.orders?.[0] || {};
        const pol = getPlaceName(consignment.pol || firstEvent.pol);
        const pod = getPlaceName(consignment.pod || firstEvent.pod);
        const consignmentNo =
          consignment.consignmentNo || `Consignment ${ci + 1}`;

        if (!firstPage) doc.addPage();
        firstPage = false;

        let y = await pdfManifestHeader(doc, {
          consignmentNo,
          pol,
          pod,
          totalContainers: consignmentOrderIds.length,
          pageWidth,
          margin,
        });
        y += 3;
        pdfDrawLabelValue(
          doc,
          "Shipper",
          firstEvent.shipperName || "N/A",
          margin,
          y,
          22,
        );
        y += 6;
        pdfDrawLabelValue(
          doc,
          "Consignee",
          firstEvent.consigneeName || "N/A",
          margin,
          y,
          22,
        );
        y += 8;
        pdfDrawDivider(doc, y, pageWidth, margin);
        y += 5;

        doc.lastAutoTable = { finalY: y };
        renderManifestSection(doc, {
          matchedContainerNumber,
          containerSize,
          receiversData,
          margin,
          pageWidth,
          containerIndex: ci,
        });
      }

      pdfAddFooters(doc, pageWidth, margin);
      doc.save(
        `Container_Manifest_${new Date().toISOString().split("T")[0]}.pdf`,
      );
      showToast(
        `Full manifest PDF generated for ${consignmentGroups.length} consignment(s)!`,
        "success",
      );
    } catch (err) {
      showToast("Error generating PDF: " + err.message, "error");
    } finally {
      setGeneratingPDF(false);
    }
  };

  const generateJobDetailManifestPDF = async (
    jobNo,
    pol,
    pod,
    linkedOrders,
    jobEvents,
    consignmentNo,
    consignmentDate,
  ) => {
    if (!linkedOrders) {
      showToast("No linked orders found for this job", "warning");
      return;
    }

    setGeneratingPDF(true);
    try {
      const orderIdArray = (
        typeof linkedOrders === "string"
          ? linkedOrders.split(",").map((id) => id.trim())
          : linkedOrders
      ).map((id) => {
        const s = id.toString();
        return s.includes("-") ? s.split("-").slice(1).join("-") : s;
      });

      if (!orderIdArray.length) {
        showToast("No valid order IDs found", "warning");
        return;
      }

      const allOrdersData = [];
      const allReceivers = [];
      for (const orderId of orderIdArray) {
        try {
          const res = await api.get(`/api/orders/${orderId}`, {
            params: { includeOrders: true },
          });
          if (res.data) {
            allOrdersData.push({ orderId, data: res.data });
            (res.data.receivers || []).forEach((r) =>
              allReceivers.push({
                ...r,
                sourceOrderId: orderId,
                sourceOrderData: res.data,
              }),
            );
          }
        } catch {}
      }

      const allOrdersMap = Object.fromEntries(
        allOrdersData.map(({ orderId, data }) => [orderId, data]),
      );
      const { matchedContainerNumber, containerSize } =
        await fetchContainerMeta(historyCid, allOrdersMap);

      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;

      const firstEvent = jobEvents?.[0] || {};
      const resolvedConsignmentNo = consignmentNo || jobNo;

      let y = await pdfManifestHeader(doc, {
        consignmentNo: resolvedConsignmentNo,
        pol: getPlaceName(pol),
        pod: getPlaceName(pod),
        totalContainers: 1,
        pageWidth,
        margin,
      });

      doc
        .setFont("helvetica", "normal")
        .setFontSize(8)
        .setTextColor(60, 60, 60);
      doc.text(`ETA: ${consignmentDate || "N/A"}`, pageWidth - margin, y - 4, {
        align: "right",
      });

      y += 3;
      pdfDrawLabelValue(
        doc,
        "Shipper",
        firstEvent.shipperName || "N/A",
        margin,
        y,
        22,
      );
      y += 6;
      pdfDrawLabelValue(
        doc,
        "Consignee",
        firstEvent.consigneeName || "N/A",
        margin,
        y,
        22,
      );
      y += 8;
      pdfDrawDivider(doc, y, pageWidth, margin);
      y += 5;

      const consignmentGroupsForJob = usageHistory.filter(
        (c) => c.orders?.length && c.consignmentNo === jobNo,
      );
      const groupsToRender =
        consignmentGroupsForJob.length > 0
          ? consignmentGroupsForJob
          : [{ consignmentNo: resolvedConsignmentNo, orders: jobEvents || [] }];

      for (let ci = 0; ci < groupsToRender.length; ci++) {
        const consignment = groupsToRender[ci];
        const consignmentOrderIds = [
          ...new Set(
            (consignment.orders || [])
              .map((e) => e.orderId?.toString())
              .filter(Boolean),
          ),
        ];
        const consignmentReceivers = allReceivers.filter(
          (r) =>
            !consignmentOrderIds.length ||
            consignmentOrderIds.includes(r.sourceOrderId?.toString()),
        );
        const receiversData = [];
        consignmentReceivers.forEach((receiver) => {
          (receiver.shippingDetails || []).forEach((detail) => {
            const od = receiver.sourceOrderData || {};
            receiversData.push({
              receiverName: receiver.receiver_name || "N/A",
              category: detail.category || "N/A",
              subcategory: detail.subcategory || "N/A",
              totalNumber: Number(detail.totalNumber || 0),
              weight: Number(detail.weight || 0),
              bookingRef: od.booking_ref || "N/A",
              senderName: od.sender_name || "N/A",
            });
          });
        });

        if (y > 220) {
          doc.addPage();
          y = 20;
        }
        doc.lastAutoTable = { finalY: y };
        y = renderManifestSection(doc, {
          matchedContainerNumber,
          containerSize,
          receiversData,
          margin,
          pageWidth,
          containerIndex: ci,
        });
      }

      pdfAddFooters(doc, pageWidth, margin);
      doc.save(
        `Job_${jobNo}_Manifest_${new Date().toISOString().split("T")[0]}.pdf`,
      );
      showToast(`Job ${jobNo} manifest generated!`, "success");
    } catch (err) {
      showToast("Error generating PDF: " + err.message, "error");
    } finally {
      setGeneratingPDF(false);
    }
  };

  // ─── Single job manifest PDF ──────────────────────────────────────────────
  const generateSingleJobManifestPDF = async (
    jobEvents,
    containerNumber,
    jobNo,
    pol,
    pod,
    linkedOrders,
    consignmentDate,
  ) => {
    if (!jobEvents?.length) {
      showToast("No data available for this job", "warning");
      return;
    }

    setGeneratingPDF(true);
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      const brandPrimary = [13, 108, 106];
      const brandLight = [220, 245, 243];
      let y = 30;

      const logoBase64 = await loadImageAsBase64("./logo-2.png");
      if (logoBase64) doc.addImage(logoBase64, "PNG", margin, 4, 60, 12);

      doc
        .setFont("helvetica", "bold")
        .setFontSize(16)
        .setTextColor(...brandPrimary);
      doc.text("CONTAINER MANIFEST", pageWidth - margin, 10, {
        align: "right",
      });
      doc.setFont("helvetica", "normal").setFontSize(12);
      doc.text(`Consignment: ${jobNo}`, pageWidth - margin, 18, {
        align: "right",
      });

      const sortedEvents = [...jobEvents].sort(
        (a, b) => new Date(a.eventTime) - new Date(b.eventTime),
      );
      const cards = [
        ["Job Number", jobNo],
        ["Container Number", containerNumber || "N/A"],
        ["Place Of Loading", getPlaceName(pol) || "N/A"],
        ["Place Of Delivery", getPlaceName(pod) || "N/A"],
        ["Linked Orders", linkedOrders || "N/A"],
        ["Consignment Date", consignmentDate || "N/A"],
        [
          "Job Start Date",
          sortedEvents[0]?.eventTime
            ? new Date(sortedEvents[0].eventTime).toLocaleDateString()
            : "N/A",
        ],
        [
          "Job End Date",
          sortedEvents.at(-1)?.eventTime
            ? new Date(sortedEvents.at(-1).eventTime).toLocaleDateString()
            : "N/A",
        ],
        ["Total Events", jobEvents.length.toString()],
      ];

      const cardWidth = (pageWidth - margin * 2 - 12) / 2;
      const cardHeight = 16;
      cards.forEach((item, i) => {
        const col = i % 2,
          row = Math.floor(i / 2);
        const x = margin + col * (cardWidth + 12),
          cardY = y + row * (cardHeight + 3);
        doc.setDrawColor(220, 220, 220).setFillColor(...brandLight);
        doc.roundedRect(x, cardY, cardWidth, cardHeight, 3, 3, "FD");
        doc.setFillColor(...brandPrimary).rect(x, cardY, cardWidth, 5, "F");
        doc
          .setFont("helvetica", "bold")
          .setFontSize(9)
          .setTextColor(255, 255, 255);
        doc.text(item[0], x + 3, cardY + 4);
        doc.setFont("helvetica", "normal").setTextColor(50, 50, 50);
        doc.text(
          doc.splitTextToSize(String(item[1] || "Not Found"), cardWidth - 6),
          x + 3,
          cardY + 11,
        );
      });

      y += (cards.length / 2) * (cardHeight + 3) + 10;

      doc.autoTable({
        head: [
          [
            "S.No",
            "Event Time",
            "Type",
            "Summary",
            "Changed By",
            "Order",
            "Receiver",
          ],
        ],
        body: jobEvents.map((event, idx) => [
          idx + 1,
          event.eventTime ? new Date(event.eventTime).toLocaleString() : "N/A",
          event.eventType || "N/A",
          event.eventSummary || "N/A",
          event.changedBy || "System",
          event.orderId || "N/A",
          event.receiverId || "N/A",
        ]),
        startY: y,
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: "linebreak",
          valign: "top",
          lineWidth: 0.1,
          lineColor: [200, 200, 200],
        },
        headStyles: {
          fillColor: brandPrimary,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 9,
        },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 30 },
          2: { cellWidth: 20 },
          3: { cellWidth: 40 },
          4: { cellWidth: 25 },
          5: { cellWidth: 20 },
          6: { cellWidth: 20 },
        },
        margin: { left: margin, right: margin },
      });

      const totalPages = doc.internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        const footerY = doc.internal.pageSize.getHeight() - 10;
        doc
          .setFont("helvetica", "normal")
          .setFontSize(8)
          .setTextColor(100, 100, 100);
        doc.text(
          `Container: ${containerNumber || "N/A"} | Job: ${jobNo} | Events: ${jobEvents.length}`,
          margin,
          footerY,
        );
        doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, footerY, {
          align: "right",
        });
        doc.text(
          `Generated: ${new Date().toLocaleString()}`,
          pageWidth / 2,
          footerY,
          { align: "center" },
        );
      }

      doc.save(
        `Container_${containerNumber}_Job_${jobNo}_${new Date().toISOString().split("T")[0]}.pdf`,
      );
      showToast(`PDF generated for Job ${jobNo}!`, "success");
    } catch (err) {
      showToast("Error generating PDF: " + err.message, "error");
    } finally {
      setGeneratingPDF(false);
    }
  };

  // ─── Status history PDF ───────────────────────────────────────────────────
  const generateStatusHistoryPDF = async (containerNumber) => {
    if (!historyCid) {
      showToast("Container ID not found", "error");
      return;
    }
    setGeneratingPDF(true);
    try {
      const res = await api.get(`/api/containers/${historyCid}/usage-history`);
      const statusHistory = res.data?.containerStatusHistory?.events;
      const totalRecords = res.data?.containerStatusHistory?.totalRecords;
      if (!statusHistory?.length)
        throw new Error("No status history records found");

      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      const brandPrimary = [13, 108, 106];
      const brandLight = [220, 245, 243];
      let y = 30;

      const logoBase64 = await loadImageAsBase64("./logo-2.png");
      if (logoBase64) doc.addImage(logoBase64, "PNG", margin, 4, 60, 12);

      doc
        .setFont("helvetica", "bold")
        .setFontSize(16)
        .setTextColor(...brandPrimary);
      doc.text("CONTAINER STATUS HISTORY REPORT", pageWidth - margin, 10, {
        align: "right",
      });
      doc.setFont("helvetica", "normal").setFontSize(12);
      doc.text(`Container: ${containerNumber}`, pageWidth - margin, 18, {
        align: "right",
      });

      const sorted = [...statusHistory].sort(
        (a, b) => new Date(b.createdTime) - new Date(a.createdTime),
      );
      const summaryCards = [
        ["Container Number", containerNumber],
        ["Total Status Changes", totalRecords.toString()],
        [
          "First Status Date",
          sorted.at(-1)?.createdTime
            ? new Date(sorted.at(-1).createdTime).toLocaleDateString()
            : "N/A",
        ],
        [
          "Latest Status Date",
          sorted[0]?.createdTime
            ? new Date(sorted[0].createdTime).toLocaleDateString()
            : "N/A",
        ],
        [
          "Status Types",
          [...new Set(statusHistory.map((s) => s.status))].length.toString(),
        ],
        [
          "Locations Used",
          [
            ...new Set(statusHistory.map((s) => s.location).filter(Boolean)),
          ].length.toString(),
        ],
      ];

      const cardWidth = (pageWidth - margin * 2 - 12) / 2;
      const cardHeight = 16;
      summaryCards.forEach((item, i) => {
        const col = i % 2,
          row = Math.floor(i / 2);
        const x = margin + col * (cardWidth + 12),
          cardY = y + row * (cardHeight + 3);
        doc.setDrawColor(220, 220, 220).setFillColor(...brandLight);
        doc.roundedRect(x, cardY, cardWidth, cardHeight, 3, 3, "FD");
        doc.setFillColor(...brandPrimary).rect(x, cardY, cardWidth, 5, "F");
        doc
          .setFont("helvetica", "bold")
          .setFontSize(9)
          .setTextColor(255, 255, 255);
        doc.text(item[0], x + 3, cardY + 4);
        doc.setFont("helvetica", "normal").setTextColor(50, 50, 50);
        doc.text(
          doc.splitTextToSize(String(item[1] || "N/A"), cardWidth - 6),
          x + 3,
          cardY + 11,
        );
      });

      y += (summaryCards.length / 2) * (cardHeight + 3) + 5;

      const chronological = [...statusHistory].sort(
        (a, b) => new Date(a.createdTime) - new Date(b.createdTime),
      );
      doc
        .setFont("helvetica", "bold")
        .setFontSize(12)
        .setTextColor(...brandPrimary);
      doc.text("STATUS CHANGE TIMELINE", margin, y);
      y += 10;

      const maxPerRow = 7;
      const timelineWidth = pageWidth - 2 * margin - 30;
      const rowHeight = 25;
      const rows = Math.ceil(chronological.length / maxPerRow);

      for (let row = 0; row < rows; row++) {
        const slice = chronological.slice(
          row * maxPerRow,
          (row + 1) * maxPerRow,
        );
        const rowY = y + row * rowHeight;
        doc.setDrawColor(...brandPrimary).setLineWidth(0.5);
        doc.line(margin + 15, rowY, margin + 15 + timelineWidth, rowY);
        slice.forEach((event, idx) => {
          const xPos =
            margin + 15 + timelineWidth * (idx / (slice.length - 1 || 1));
          doc.setFillColor(...brandPrimary).circle(xPos, rowY, 2.5, "F");
          const status = event.status || "Unknown";
          doc
            .setFont("helvetica", "bold")
            .setFontSize(8)
            .setTextColor(...brandPrimary);
          doc.text(status, xPos - doc.getTextWidth(status) / 2, rowY - 5);
          doc
            .setFont("helvetica", "normal")
            .setFontSize(7)
            .setTextColor(100, 100, 100);
          const dateStr = new Date(event.createdTime).toLocaleDateString(
            "en-GB",
            { day: "2-digit", month: "short" },
          );
          doc.text(dateStr, xPos - doc.getTextWidth(dateStr) / 2, rowY + 7);
          const timeStr = new Date(event.createdTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          doc.setFontSize(6);
          doc.text(timeStr, xPos - doc.getTextWidth(timeStr) / 2, rowY + 11);
        });
      }
      y += rows * rowHeight;

      doc
        .setFont("helvetica", "bold")
        .setFontSize(12)
        .setTextColor(...brandPrimary);
      doc.text("DETAILED STATUS HISTORY", margin, y);
      y += 5;
      doc.autoTable({
        head: [
          ["S.No", "Date", "Time", "Status", "Location", "Changed By", "Notes"],
        ],
        body: statusHistory.map((event, idx) => {
          const d = new Date(event.createdTime);
          return [
            idx + 1,
            d.toLocaleDateString(),
            d.toLocaleTimeString(),
            event.status || "N/A",
            event.location || "N/A",
            event.createdBy || "System",
            event.notes || "No notes",
          ];
        }),
        startY: y,
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: "linebreak",
          valign: "top",
          lineWidth: 0.1,
          lineColor: [200, 200, 200],
        },
        headStyles: {
          fillColor: brandPrimary,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 9,
        },
        columnStyles: {
          0: { cellWidth: 12 },
          1: { cellWidth: 20 },
          2: { cellWidth: 20 },
          3: { cellWidth: 25, fontStyle: "bold" },
          4: { cellWidth: 25 },
          5: { cellWidth: 20 },
          6: { cellWidth: pageWidth - 2 * margin - 127 },
        },
        margin: { left: margin, right: margin },
        didParseCell(data) {
          if (data.section === "body")
            data.cell.styles.fillColor =
              data.row.index % 2 === 0 ? [245, 245, 245] : [255, 255, 255];
        },
      });

      const totalPages = doc.internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        const footerY = doc.internal.pageSize.getHeight() - 10;
        doc
          .setFont("helvetica", "normal")
          .setFontSize(8)
          .setTextColor(100, 100, 100);
        doc.text(
          `Container: ${containerNumber} | Status Changes: ${totalRecords}`,
          margin,
          footerY,
        );
        doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, footerY, {
          align: "right",
        });
        doc.text(
          `Generated: ${new Date().toLocaleString()}`,
          pageWidth / 2,
          footerY,
          { align: "center" },
        );
      }

      doc.save(
        `Container_${containerNumber}_Status_History_${new Date().toISOString().split("T")[0]}.pdf`,
      );
      showToast(
        `Status history PDF generated for ${containerNumber}! (${totalRecords} records)`,
        "success",
      );
    } catch (err) {
      showToast("Error generating PDF: " + err.message, "error");
    } finally {
      setGeneratingPDF(false);
    }
  };

  const generateUnassignedManifestPDF = async (
    unassignedOrders,
    containerNumber,
  ) => {
    if (!unassignedOrders?.length) {
      showToast("No unassigned orders to print", "warning");
      return;
    }

    setGeneratingPDF(true);
    try {
      const uniqueOrderIds = [
        ...new Set(
          unassignedOrders.map((e) => e.orderId?.toString()).filter(Boolean),
        ),
      ];
      const allOrdersMap = {};
      for (const id of uniqueOrderIds) {
        try {
          const res = await api.get(`/api/orders/${id}`, {
            params: { includeOrders: true },
          });
          if (res.data) allOrdersMap[id] = res.data;
        } catch {}
      }

      const { matchedContainerNumber, containerSize } =
        await fetchContainerMeta(historyCid, allOrdersMap);
      const displayContainerNo =
        containerNumber ||
        matchedContainerNumber ||
        selectedContainerNo ||
        "N/A";

      const receiversData = [];
      unassignedOrders.forEach((event) => {
        const orderData = event.orderId
          ? allOrdersMap[event.orderId.toString()]
          : null;
        if (orderData) {
          (orderData.receivers || []).forEach((receiver) => {
            (receiver.shippingDetails || []).forEach((detail) => {
              receiversData.push({
                receiverName: receiver.receiver_name || "N/A",
                category: detail.category || "N/A",
                subcategory: detail.subcategory || "N/A",
                totalNumber: Number(detail.totalNumber || 0),
                weight: Number(detail.weight || 0),
                bookingRef: orderData.booking_ref || event.bookingRef || "N/A",
                senderName: orderData.sender_name || "N/A",
              });
            });
          });
        } else {
          receiversData.push({
            receiverName: "N/A",
            category: "N/A",
            subcategory: "N/A",
            totalNumber: event.assignedQty || 0,
            weight: event.assignedWeightKg || 0,
            bookingRef: event.bookingRef || event.orderId || "N/A",
            senderName: "N/A",
          });
        }
      });

      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      const { teal, orange, lightGrey, borderGrey } = BRAND;

      const logoBase64 = await loadImageAsBase64("./logo-2.png");
      if (logoBase64) doc.addImage(logoBase64, "PNG", margin, 5, 55, 12);

      doc
        .setFont("helvetica", "bold")
        .setFontSize(10)
        .setTextColor(...orange);
      doc.text("UNASSIGNED ORDERS MANIFEST", pageWidth - margin, 8, {
        align: "right",
      });

      doc
        .setFont("helvetica", "normal")
        .setFontSize(8)
        .setTextColor(60, 60, 60);
      [
        `Container: ${displayContainerNo}`,
        `Size: ${containerSize}`,
        `Total Events: ${unassignedOrders.length}`,
        `Generated: ${new Date().toLocaleString()}`,
      ].forEach((line, i) =>
        doc.text(line, pageWidth - margin, 13 + i * 4, { align: "right" }),
      );

      doc
        .setFont("helvetica", "bold")
        .setFontSize(13)
        .setTextColor(...teal);
      doc.text("ROYAL GULF SHIPPING & LOGISTICS LLC", margin, 24);
      doc
        .setFont("helvetica", "normal")
        .setFontSize(7.5)
        .setTextColor(120, 120, 120);
      doc.text("Dubai - London - Karachi - Shenzhen", margin, 27.5);

      doc
        .setFont("helvetica", "bold")
        .setFontSize(14)
        .setTextColor(...teal);
      doc.text("UNASSIGNED ORDERS - PENDING CONSIGNMENT", margin, 34);
      doc
        .setDrawColor(...teal)
        .setLineWidth(0.6)
        .line(margin, 37, pageWidth - margin, 37);

      let y = 44;

      y = pdfDrawSectionHeader(
        doc,
        `CONTAINER SUMMARY - ${displayContainerNo}`,
        y,
        margin,
      );

      const totalPkgs = receiversData.reduce((s, r) => s + r.totalNumber, 0);
      const totalWt = receiversData.reduce((s, r) => s + r.weight, 0);

      doc.autoTable({
        head: [
          [
            "CONTAINER",
            "SIZE",
            "UNASSIGNED EVENTS",
            "TOTAL PACKAGES",
            "TOTAL WEIGHT (KGS)",
          ],
        ],
        body: [
          [
            displayContainerNo,
            containerSize,
            unassignedOrders.length.toString(),
            totalPkgs.toString(),
            totalWt.toFixed(2),
          ],
        ],
        startY: y,
        ...manifestTableStyles,
        styles: { ...manifestTableStyles.styles, halign: "center" },
        margin: { left: margin, right: margin },
      });
      y = doc.lastAutoTable.finalY + 8;

      doc.lastAutoTable = { finalY: y };
      renderManifestSection(doc, {
        matchedContainerNumber: displayContainerNo,
        containerSize,
        receiversData,
        margin,
        pageWidth,
        containerIndex: 0,
      });

      pdfAddFooters(
        doc,
        pageWidth,
        margin,
        `Container: ${displayContainerNo} | Unassigned Events: ${unassignedOrders.length}`,
      );
      doc.save(
        `Unassigned_Manifest_${displayContainerNo}_${new Date().toISOString().split("T")[0]}.pdf`,
      );
      showToast(
        `Unassigned orders manifest generated! (${unassignedOrders.length} events)`,
        "success",
      );
    } catch (err) {
      showToast("Error generating PDF: " + err.message, "error");
    } finally {
      setGeneratingPDF(false);
    }
  };

  return {
    generateFullManifestPDF,
    generateJobDetailManifestPDF,
    generateSingleJobManifestPDF,
    generateStatusHistoryPDF,
    generateUnassignedManifestPDF,
  };
};
