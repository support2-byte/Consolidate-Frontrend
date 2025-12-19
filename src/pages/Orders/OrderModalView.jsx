import { useState, useEffect, useRef } from "react";
// import jspdf from 'jspdf';

import html2canvas from 'html2canvas';
import {
    Box,
    Typography,
    Button,
    Stack,
    Chip,
    CardContent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    CircularProgress,
    Alert,
    IconButton,
    Card,
    CardActions,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Fade,
    Grow,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Snackbar,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import InfoIcon from "@mui/icons-material/Info";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PersonIcon from "@mui/icons-material/Person";
import InventoryIcon from "@mui/icons-material/Inventory";
import DriveEtaIcon from "@mui/icons-material/DriveEta";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DownloadIcon from "@mui/icons-material/Download";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { getOrderStatusColor } from "./Utlis";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
applyPlugin(jsPDF);  // Explicitly apply the plugin to jsPDF prototype
function TabPanel(props) {
    const { children, value, index, ...other } = props;
   
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Grow in={value === index} timeout={600}>
                    <Box sx={{ p: 3 }}>
                        {children}
                    </Box>
                </Grow>
            )}
        </div>
    );
}

function a11yProps(index) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}
// Helper function to get place name by ID

// Enhanced View Order Modal Component
const OrderModalView = ({ openModal, handleCloseModal, selectedOrder, modalLoading, modalError,places }) => {
    const [tabValue, setTabValue] = useState(0);
    const navigate = useNavigate();
    const [containers, setContainers] = useState([]);
    const [loadingContainers, setLoadingContainers] = useState(false);
    const [assignmentError, setAssignmentError] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [assignments, setAssignments] = useState({});
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [pdfGenerationMethod, setPdfGenerationMethod] = useState('jsPDF');
    const pdfContentRef = useRef(null);

    // Fetch open containers
    const fetchContainers = async () => {
        if (loadingContainers) return;
        setLoadingContainers(true);
        setAssignmentError(null);
        try {
            const response = await api.get('/api/containers');
            setContainers(response.data.data || []);
        } catch (err) {
            console.error("Error fetching containers:", err);
            setAssignmentError('Failed to fetch containers. Please check backend query for table "cm".');
            setSnackbar({ open: true, message: 'Failed to fetch containers', severity: 'error' });
        } finally {
            setLoadingContainers(false);
        }
    };
const getPlaceName = (placeId) => {
    if (!placeId) return '-';
    const place = places.find(p => p.value === placeId.toString());
    return place ? place.label : placeId;
};
    // Effect: Initialize assignments when modal opens with order
    useEffect(() => {
        if (openModal && selectedOrder) {
            const initialAssignments = {};
            (selectedOrder.receivers || []).forEach(rec => {
                if (rec.container_id) {
                    initialAssignments[rec.id] = rec.container_id;
                }
            });
            setAssignments(initialAssignments);
        }
    }, [openModal, selectedOrder]);

    // Effect: Lazy load containers when Containers tab is selected
    useEffect(() => {
        if (openModal && selectedOrder && tabValue === 6 && containers.length === 0) {
            fetchContainers();
        }
    }, [tabValue, openModal, selectedOrder]);

    const statusColor = getOrderStatusColor(selectedOrder?.overall_status || selectedOrder?.status);

const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};



    const handleEdit = (orderId) => {
        handleCloseModal();
        navigate(`/orders/${orderId}/edit/`, { state: { orderId } });
    };

    // Handle assign container to receiver
    const handleAssignContainer = async (receiverId, containerId) => {
        if (!containerId) return;
        try {
            await api.post(`/api/orders/${selectedOrder.id}/receivers/${receiverId}/assign-container`, { container_id: containerId });
            setSnackbar({ open: true, message: 'Container assigned successfully', severity: 'success' });
            fetchContainers();
        } catch (err) {
            console.error('Error assigning container:', err);
            setAssignmentError(err.response?.data?.error || 'Failed to assign container');
            setSnackbar({ open: true, message: 'Failed to assign container', severity: 'error' });
        }
    };




const getFilesText = (files) => {
    if (!files || files.length === 0) return 'None';
    return files.slice(0, 5).join('\n') + (files.length > 5 ? `\n... and ${files.length - 5} more` : '');
};

const normalizeContainers = (containers) => {
    if (!containers || !Array.isArray(containers)) return [];
    // Flatten nested arrays (e.g., [["CONT1"]] -> ["CONT1"])
    return containers.flat().filter(c => c && typeof c === 'string').map(c => c.trim());
};


const loadImageAsBase64 = (url) =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
  });
const generateOrderPDF = async (order) => {
  if (!order) return;

  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const brandPrimary = [13, 108, 106]; // #0d6c6a
  const brandLight = [220, 245, 243];
  let y = 30;

  // -------- HEADER --------
  const logoBase64 = await loadImageAsBase64("./logo-2.png");
  if (logoBase64) doc.addImage(logoBase64, "PNG", margin, 4, 60, 12);

  doc.setFont("helvetica", "bold").setFontSize(16);
  doc.setTextColor(...brandPrimary);
  doc.text("ORDER DETAILS REPORT", pageWidth - margin, 10, { align: "right" });

  doc.setFont("helvetica", "normal").setFontSize(9);
  doc.text(`Booking Ref: ${order.booking_ref}`, pageWidth - margin, 17, { align: "right" });
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin, 22, { align: "right" });

  // -------- SUMMARY CARDS --------
  const cards = [
    ["Order ID", order.id],
    ["Status", order.status],
    ["Drop Method", order.drop_method],
    ["Point of Origin", order.point_of_origin],
    ["Total Assigned Qty", order.total_assigned_qty],
    ["Collection Scope", order.collection_scope],
  ];
  const cardWidth = (pageWidth - margin * 2 - 6) / 2;
  const cardHeight = 16;

  cards.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = margin + col * (cardWidth + 6);
    const cardY = y + row * (cardHeight + 6);

    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(...brandLight);
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 2, 2, "FD");

    doc.setFillColor(...brandPrimary);
    doc.rect(x, cardY, cardWidth, 5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(item[0], x + 2, cardY + 4);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    doc.text(String(item[1]), x + 3, cardY + 11);
  });

  y += Math.ceil(cards.length / 2) * (cardHeight + 6) + 5;

  // -------- ORDER DETAILS --------
  const orderDetails = [
    ["Booking Ref", order.booking_ref],
    ["RGL Booking #", order.rgl_booking_number],
    ["Place of Loading", order.place_of_loading],
    ["Final Destination", order.final_destination],
    ["Place of Delivery", order.place_of_delivery],
    ["ETA", order.eta || "N/A"],
    ["ETD", order.etd || "N/A"],
    ["Shipping Line", order.shipping_line || "N/A"],
    ["Plate No", order.plate_no],
    ["Drop Off CNIC", order.drop_off_cnic],
    ["Drop Off Mobile", order.drop_off_mobile],
    ["Drop Date", order.drop_date ? new Date(order.drop_date).toLocaleString() : "N/A"],
  ];

  const drawKeyValueSection = (y, title, details) => {
    doc.setFont("helvetica", "bold").setFontSize(14);
    doc.setTextColor(...brandPrimary);
    doc.text(title, margin, y);
    y += 4;

    doc.setDrawColor(...brandPrimary);
    doc.setLineWidth(0.6);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    const colWidth = (pageWidth - margin * 2 - 10) / 2;
    const rowHeight = 8;

    details.forEach((pair, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = margin + col * (colWidth + 10);
      const dy = y + row * rowHeight;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...brandPrimary);
      doc.text(pair[0], x, dy);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      doc.text(String(pair[1] || "N/A"), x, dy + 4);
    });

    return y + Math.ceil(details.length / 2) * rowHeight + 6;
  };

  y = drawKeyValueSection(y, "ORDER INFORMATION", orderDetails);

  // -------- SENDER DETAILS --------
  const senderDetails = [
    ["Sender Name", order.sender_name],
    ["Contact Number", order.sender_contact],
    ["Email", order.sender_email],
    ["Address", order.sender_address],
    ["Sender Ref", order.sender_ref],
    ["Sender Remarks", order.order_remarks], // Note: Fixed to use order.order_remarks if sender_remarks not present
    ["Selected Sender Owner", order.selected_sender_owner],
  ];
  y = drawKeyValueSection(y, "SENDER INFORMATION", senderDetails);

  // -------- RECEIVERS TABLE --------
  if (order.receivers?.length) {
    doc.setFont("helvetica", "bold").setFontSize(14);
    doc.setTextColor(...brandPrimary);
    doc.text("RECEIVERS", margin, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [["Receiver", "Status", "Consignment", "Qty", "Weight", "Contact", "Address",]],
      body: order.receivers.map((r) => [
        r.receiver_name,
        r.status,
        r.consignment_number,
        r.total_number,
        r.total_weight,
        r.receiver_contact,
        r.receiver_address,
        // r.containers ? r.containers.join(", ") : "N/A",
      ]),
      headStyles: { fillColor: brandPrimary, textColor: 255 },
      bodyStyles: { fontSize: 9, cellPadding: 2 },
      margin: { left: margin, right: margin },
    });

    y = doc.lastAutoTable.finalY + 6;

    // -------- RECEIVER SHIPPING DETAILS WITH CONTAINER DETAILS --------
    for (const receiver of order.receivers) {
      if (!receiver.shippingdetails?.length) continue; // Note: Fixed property name to 'shippingdetails' as per JSON

      doc.setFont("helvetica", "normal").setFontSize(9);
      doc.setTextColor(...brandPrimary);
      doc.text(`Products Details for: ${receiver.receiver_name}`, margin, y);
      y += 6;

      // Shipping Details Table
      autoTable(doc, {
        startY: y,
        head: [["Category", "Subcategory", "Type", "Total", "Weight", "Pickup", "Delivery", "Item Ref", "Status"]],
        body: receiver.shippingdetails.map((s) => [
          s.category,
          s.subcategory,
          s.type,
          s.totalNumber,
          s.weight,
          s.pickupLocation,
          s.deliveryAddress,
          s.itemRef,
          s.consignmentStatus,
        ]),
        headStyles: { fillColor: brandPrimary, textColor: 255 },
        bodyStyles: { fontSize: 8, cellPadding: 2 },
        margin: { left: margin, right: margin },
      });

      y = doc.lastAutoTable.finalY + 6;

      // Container Details Sub-Table for each Shipping Detail
      receiver.shippingdetails.forEach((shippingDetail, detailIndex) => {
        if (!shippingDetail.containerDetails?.length) return;

        doc.setFont("helvetica", "normal").setFontSize(9);
        doc.setTextColor(...brandPrimary);
        doc.text(`Container Assignments for Item ${detailIndex + 1}: ${shippingDetail.itemRef}`, margin, y);
        y += 4;

        autoTable(doc, {
          startY: y,
          head: [["Status", "Container #", "Size", "Type", "Assigned Weight", "Assigned Boxes", "Remaining Items"]],
          body: shippingDetail.containerDetails.map((contDetail) => {
            const container = contDetail.container || {};
            return [
              contDetail.status || "N/A",
              container.container_number || contDetail.container_number || "N/A",
              container.container_size || "N/A",
              container.container_type || "N/A",
              contDetail.assign_weight || "N/A",
              contDetail.assign_total_box || "N/A",
              contDetail.remaining_items || "N/A",
            ];
          }),
          headStyles: { fillColor: brandPrimary, textColor: 255 }, // Teal header for sub-table
          bodyStyles: { fontSize: 8, cellPadding: 2 },
          margin: { left: margin, right: margin },
          theme: 'grid',
        });

        y = doc.lastAutoTable.finalY + 6;
      });
    }
  }

  // -------- REMARKS --------
  const drawBoxText = (y, title, text) => {
    if (!text) return y;

    const boxHeight = 20;
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(margin, y, pageWidth - margin * 2, boxHeight, 2, 2, "F");

    doc.setFont("helvetica", "bold").setFontSize(10);
    doc.setTextColor(...brandPrimary);
    doc.text(title, margin + 3, y + 6);

    doc.setFont("helvetica", "normal").setFontSize(9);
    doc.setTextColor(50, 50, 50);
    const wrapped = doc.splitTextToSize(text, pageWidth - margin * 2 - 6);
    doc.text(wrapped, margin + 3, y + 11);

    return y + boxHeight + 6;
  };

  y = drawBoxText(y, "Order Remarks", order.order_remarks);

  // -------- ATTACHMENTS --------
  const attachmentsText = order.attachments?.length ? order.attachments.join(", ") : "None";
  y = drawBoxText(y, "Attachments", attachmentsText);

  // -------- FOOTER --------
  const footerY = 275;
  doc.setDrawColor(...brandPrimary);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  doc.setFont("helvetica", "normal").setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, footerY + 6);
  doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, pageWidth - margin, footerY + 6, { align: "right" });

  // -------- SAVE PDF --------
  doc.save(`Order_${order.booking_ref || "Unknown"}.pdf`);
};



// Enhanced HTML to Canvas method with better styling and layout
const generatePDFWithCanvas = async () => {
    if (!selectedOrder) return;
    
    // Helper function to normalize/format dates
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    // Helper function to get files text
    const getFilesText = (files) => files?.length ? files.join(', ') : 'None';

    // Helper function to normalize containers (simple array join)
    const normalizeContainers = (containers) => Array.isArray(containers) ? containers : [];

    // Create a temporary div element to render content
    const tempElement = document.createElement('div');
    tempElement.style.width = '210mm'; // A4 width
    tempElement.style.padding = '20mm';
    tempElement.style.backgroundColor = 'white';
    tempElement.style.fontFamily = 'Arial, sans-serif';
    tempElement.style.boxSizing = 'border-box';
    
    // Create the content for the PDF with enhanced styling
    tempElement.innerHTML = `
        <style>
            * {
                box-sizing: border-box;
            }
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                color: #333;
                background: white;
            }
            .header {
                background: linear-gradient(135deg, #0a5250 0%, #0d6c6a 100%);
                color: white;
                padding: 15px 0;
                text-align: center;
                border-radius: 8px;
                margin-bottom: 20px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: bold;
            }
            .header p {
                margin: 5px 0 0;
                font-size: 14px;
            }
            .info-box {
                background: #f0f7ff;
                border-left: 4px solid #2196f3;
                padding: 10px 15px;
                margin-bottom: 15px;
                border-radius: 0 4px 4px 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .info-box p {
                margin: 0;
                font-weight: bold;
            }
            .status-badge {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: bold;
                background: #4caf50;
                color: white;
            }
            .section {
                margin-bottom: 25px;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                page-break-inside: avoid;
            }
            .section-header {
                background: linear-gradient(135deg, #0d6c6a 0%, #0a5250 100%);
                color: white;
                padding: 10px 15px;
                font-size: 16px;
                font-weight: bold;
                margin: 0;
            }
            .section-content {
                background: #f9f9f9;
                padding: 15px;
            }
            .receiver-header {
                background: #f0f0f0;
                padding: 10px;
                border-radius: 4px;
                margin-bottom: 10px;
                font-weight: bold;
                color: #0d6c6a;
            }
            .item-header {
                background: #fff8e1;
                padding: 8px;
                border-radius: 4px;
                margin: 10px 0;
                font-weight: bold;
                color: #0a5250;
            }
            .container-subheader {
                background: #e3f2fd;
                padding: 6px;
                border-radius: 4px;
                margin: 8px 0 4px 0;
                font-weight: bold;
                color: #1976d2;
                font-size: 14px;
            }
            .container-table {
                width: 100%;
                border-collapse: collapse;
                margin: 5px 0;
                font-size: 11px;
            }
            .container-table th {
                background: #bbdefb;
                text-align: left;
                padding: 6px;
                font-weight: bold;
                border-bottom: 1px solid #2196f3;
            }
            .container-table td {
                padding: 6px;
                border-bottom: 1px solid #e0e0e0;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 15px;
            }
            table th {
                background: #f1f1f1;
                text-align: left;
                padding: 10px;
                font-weight: bold;
                border-bottom: 2px solid #f58220;
            }
            table td {
                padding: 10px;
                border-bottom: 1px solid #e0e0e0;
            }
            table tr:last-child td {
                border-bottom: none;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 15px;
                border-top: 1px solid #e0e0e0;
                color: #666;
                font-size: 12px;
            }
            .page-break {
                page-break-before: always;
            }
        </style>
        
        <div class="header">
            <h1>ORDER DETAILS</h1>
            <p>Ref: ${selectedOrder.booking_ref || 'N/A'}</p>
            <p>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>
        
        <div class="info-box">
            <p>Status: ${selectedOrder.overall_status || selectedOrder.status || 'N/A'} <span class="status-badge">Active</span></p>
        </div>
        
        <div class="section">
            <h2 class="section-header">ORDER INFORMATION</h2>
            <div class="section-content">
                <table>
                    <tr>
                        <th>Booking Ref</th>
                        <td>${selectedOrder.booking_ref || 'N/A'}</td>
                    </tr>
                    <tr>
                        <th>RGL Booking Number</th>
                        <td>${selectedOrder.rgl_booking_number || 'N/A'}</td>
                    </tr>
                    <tr>
                        <th>Place of Loading</th>
                        <td>${selectedOrder.place_of_loading || 'N/A'}</td>
                    </tr>
                    <tr>
                        <th>Final Destination</th>
                        <td>${selectedOrder.final_destination || 'N/A'}</td>
                    </tr>
                    <tr>
                        <th>Place of Delivery</th>
                        <td>${selectedOrder.place_of_delivery || 'N/A'}</td>
                    </tr>
                    <tr>
                        <th>ETA</th>
                        <td>${formatDate(selectedOrder.eta)}</td>
                    </tr>
                    <tr>
                        <th>ETD</th>
                        <td>${formatDate(selectedOrder.etd)}</td>
                    </tr>
                    <tr>
                        <th>Shipping Line</th>
                        <td>${selectedOrder.shipping_line || 'N/A'}</td>
                    </tr>
                    <tr>
                        <th>Point of Origin</th>
                        <td>${selectedOrder.point_of_origin || 'N/A'}</td>
                    </tr>
                    <tr>
                        <th>Order Remarks</th>
                        <td>${selectedOrder.order_remarks || 'N/A'}</td>
                    </tr>
                    <tr>
                        <th>Consignment Remarks</th>
                        <td>${selectedOrder.consignment_remarks || 'N/A'}</td>
                    </tr>
                    <tr>
                        <th>Created At</th>
                        <td>${new Date(selectedOrder.created_at).toLocaleString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        })}</td>
                    </tr>
                </table>
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-header">SENDER DETAILS</h2>
            <div class="section-content">
                <table>
                    <tr>
                        <th>Name</th>
                        <td>${selectedOrder.sender_name || 'N/A'}</td>
                    </tr>
                    <tr>
                        <th>Contact</th>
                        <td>${selectedOrder.sender_contact || 'N/A'}</td>
                    </tr>
                    <tr>
                        <th>Address</th>
                        <td>${selectedOrder.sender_address || 'N/A'}</td>
                    </tr>
                    <tr>
                        <th>Email</th>
                        <td>${selectedOrder.sender_email || 'N/A'}</td>
                    </tr>
                    <tr>
                        <th>Sender Ref</th>
                        <td>${selectedOrder.sender_ref || 'N/A'}</td>
                    </tr>
                    <tr>
                        <th>Sender Remarks</th>
                        <td>${selectedOrder.order_remarks || 'N/A'}</td> <!-- Note: Using order_remarks if sender_remarks not present -->
                    </tr>
                </table>
            </div>
        </div>
        
        ${selectedOrder.receivers && selectedOrder.receivers.length > 0 ? `
        <div class="section">
            <h2 class="section-header">RECEIVER DETAILS</h2>
            <div class="section-content">
                ${selectedOrder.receivers.map((rec, index) => {
                    const normContainers = normalizeContainers(rec.containers);
                    return `
                    <div class="receiver-header">Receiver ${index + 1}: ${rec.receiver_name || 'N/A'}</div>
                    <table>
                        <tr>
                            <th>Status</th>
                            <td>${rec.status || 'Created'}</td>
                        </tr>
                        <tr>
                            <th>Contact</th>
                            <td>${rec.receiver_contact || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>Address</th>
                            <td>${rec.receiver_address || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>Email</th>
                            <td>${rec.receiver_email || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>Consignment Number</th>
                            <td>${rec.consignment_number || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>Total Number</th>
                            <td>${rec.total_number || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>Total Weight</th>
                            <td>${rec.total_weight ? `${rec.total_weight} kg` : 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>Containers (Summary)</th>
                            <td>${normContainers.join(', ') || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>Assignment</th>
                            <td>${rec.receiver_assignment || 'N/A'}</td> <!-- Note: Fixed to receiver_assignment as per JSON -->
                        </tr>
                        <tr>
                            <th>Item Ref</th>
                            <td>${rec.receiver_item_ref || 'N/A'}</td> <!-- Note: Fixed to receiver_item_ref as per JSON -->
                        </tr>
                        <tr>
                            <th>Receiver Ref</th>
                            <td>${rec.receiver_ref || 'N/A'}</td>
                        </tr>
                    </table>
                    
                    ${rec.shippingdetails && rec.shippingdetails.length > 0 ? ` <!-- Note: Fixed property name to 'shippingdetails' as per JSON -->
                    <div class="item-header">Shipping Details</div>
                    ${rec.shippingdetails.map((item, itemIndex) => `
                        <div style="margin-bottom: 15px; padding: 10px; background: #fafafa; border-radius: 4px;">
                            <h4 style="margin: 0 0 8px 0; color: #0a5250;">Item ${itemIndex + 1}: ${item.itemRef || 'N/A'}</h4>
                            <table>
                                <tr>
                                    <th>Category</th>
                                    <td>${item.category || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Subcategory</th>
                                    <td>${item.subcategory || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Type</th>
                                    <td>${item.type || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Pickup Location</th>
                                    <td>${item.pickupLocation || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Delivery Address</th>
                                    <td>${item.deliveryAddress || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Total Number</th>
                                    <td>${item.totalNumber || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Weight</th>
                                    <td>${item.weight ? `${item.weight} kg` : 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Consignment Status</th>
                                    <td>${item.consignmentStatus || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Remaining Items</th>
                                    <td>${item.remainingItems || 'N/A'}</td>
                                </tr>
                            </table>
                            
                            ${item.containerDetails && item.containerDetails.length > 0 ? `
                            <div class="container-subheader">Container Assignments</div>
                            <table class="container-table">
                                <thead>
                                    <tr>
                                        <th>Status</th>
                                        <th>Container #</th>
                                        <th>Size</th>
                                        <th>Type</th>
                                        <th>Assigned Weight</th>
                                        <th>Assigned Boxes</th>
                                        <th>Remaining Items</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${item.containerDetails.map((contDetail, contIndex) => {
                                        const container = contDetail.container || {};
                                        return `
                                        <tr>
                                            <td>${contDetail.status || 'N/A'}</td>
                                            <td>${container.container_number || contDetail.container_number || 'N/A'}</td>
                                            <td>${container.container_size || 'N/A'}</td>
                                            <td>${container.container_type || 'N/A'}</td>
                                            <td>${contDetail.assign_weight || 'N/A'}</td>
                                            <td>${contDetail.assign_total_box || 'N/A'}</td>
                                            <td>${contDetail.remaining_items || 'N/A'}</td>
                                        </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                            ` : '<p style="color: #666; font-style: italic;">No container assignments.</p>'}
                        </div>
                    `).join('')}
                    ` : ''}
                    `;
                }).join('')}
            </div>
        </div>
        ` : ''}
        
        <div class="section">
            <h2 class="section-header">TRANSPORT DETAILS</h2>
            <div class="section-content">
                <table>
                    <tr>
                        <th>Transport Type</th>
                        <td>${selectedOrder.transport_type || 'N/A'}</td>
                    </tr>
                    <tr>
                        <th>Driver Name</th>
                        <td>${selectedOrder.driver_name || 'N/A'}</td>
                    </tr>
                    <tr>
                        <th>Driver Contact</th>
                        <td>${selectedOrder.driver_contact || 'N/A'}</td>
                    </tr>
                    <tr>
                        <th>Driver NIC</th>
                        <td>${selectedOrder.driver_nic || 'N/A'}</td>
                    </tr>
                    <tr>
                        <th>Driver Pickup Location</th>
                        <td>${selectedOrder.driver_pickup_location || 'N/A'}</td>
                    </tr>
                    <tr>
                        <th>Truck Number</th>
                        <td>${selectedOrder.truck_number || 'N/A'}</td>
                    </tr>
                    <tr>
                        <th>Third Party Transport</th>
                        <td>${selectedOrder.third_party_transport || 'N/A'}</td>
                    </tr>
                </table>
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-header">INBOUND/OUTBOUND DETAILS</h2>
            <div class="section-content">
                <table>
                    <tr>
                        <th>Drop Method</th>
                        <td>${selectedOrder.drop_method || 'N/A'}</td>
                    </tr>
                    <tr>
                        <th>Dropoff Name</th>
                        <td>${selectedOrder.dropoff_name || 'N/A'}</td>
                    </tr>
                    <tr>
                        <th>Drop-Off CNIC/ID</th>
                        <td>${selectedOrder.drop_off_cnic || 'N/A'}</td>
                    </tr>
                    <tr>
                        <th>Drop-Off Mobile</th>
                        <td>${selectedOrder.drop_off_mobile || 'N/A'}</td>
                    </tr>
                    <tr>
                        <th>Plate No</th>
                        <td>${selectedOrder.plate_no || 'N/A'}</td>
                    </tr>
                    <tr>
                        <th>Drop Date</th>
                        <td>${formatDate(selectedOrder.drop_date)}</td>
                    </tr>
                    <tr>
                        <th>Collection Method</th>
                        <td>${selectedOrder.collection_method || 'N/A'}</td>
                    </tr>
                    <tr>
                        <th>Collection Scope</th>
                        <td>${selectedOrder.collection_scope || 'N/A'}</td>
                    </tr>
                    <tr>
                        <th>Full/Partial</th>
                        <td>${selectedOrder.full_partial || 'N/A'}</td>
                    </tr>
                    <tr>
                        <th>Qty Delivered</th>
                        <td>${selectedOrder.qty_delivered || 'N/A'}</td>
                    </tr>
                    <tr>
                        <th>Client Receiver Name</th>
                        <td>${selectedOrder.client_receiver_name || 'N/A'}</td>
                    </tr>
                    <tr>
                        <th>Client Receiver ID</th>
                        <td>${selectedOrder.client_receiver_id || 'N/A'}</td>
                    </tr>
                    <tr>
                        <th>Client Receiver Mobile</th>
                        <td>${selectedOrder.client_receiver_mobile || 'N/A'}</td>
                    </tr>
                    <tr>
                        <th>Delivery Date</th>
                        <td>${formatDate(selectedOrder.delivery_date)}</td>
                    </tr>
                </table>
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-header">FILES</h2>
            <div class="section-content">
                <h3>Attachments:</h3>
                <p>${getFilesText(selectedOrder.attachments)}</p>
                <h3>Gatepass:</h3>
                <p>${getFilesText(selectedOrder.gatepass)}</p>
            </div>
        </div>
        
        <div class="footer">
            <p>This is a computer-generated document and does not require a signature.</p>
            <p>© 2025 Shipping Management System</p>
        </div>
    `;
    
    // Add the temporary element to the body
    document.body.appendChild(tempElement);
    
    // Convert the element to canvas with higher quality and proper dimensions
    const canvas = await html2canvas(tempElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: tempElement.scrollWidth,
        height: tempElement.scrollHeight,
        windowWidth: tempElement.scrollWidth,
        windowHeight: tempElement.scrollHeight
    });
    
    // Remove the temporary element
    document.body.removeChild(tempElement);
    
    // Create PDF from canvas with better quality
    const imgData = canvas.toDataURL('image/jpeg', 0.95); // Use JPEG with 95% quality for smaller file size
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    // Add the image to the PDF
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    // Add new pages if needed
    while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
    }
    
    // Save the PDF
    pdf.save(`Order_${selectedOrder.booking_ref || 'Unknown'}_${Date.now()}.pdf`);
};
    // Enhanced PDF generation function with method selection
    const generatePDF = async () => {
        if (!selectedOrder) return;
        
        setIsGeneratingPDF(true);
        setSnackbar({ open: true, message: 'Generating PDF...', severity: 'info' });
        
        try {
            if (pdfGenerationMethod === 'jsPDF') {
                await generateOrderPDF();
            } else {
                // Use the html2canvas method
                await generatePDFWithCanvas();
            }
            
            setSnackbar({ open: true, message: 'PDF generated successfully', severity: 'success' });
        } catch (error) {
            console.error('Error generating PDF:', error);
            setSnackbar({ open: true, message: 'Failed to generate PDF', severity: 'error' });
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    // Helper to render files
    const renderFiles = (files) => {
        if (!files || files.length === 0) return <Typography variant="body2" color="text.secondary">No attachments</Typography>;
        return (
            <List dense sx={{ py: 0 }}>
                {files.map((file, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32, color: '#f58220' }}>
                            <AttachFileIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                            primary={typeof file === 'string' ? file.split('/').pop() : file.name || 'File'}
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                            secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                        />
                    </ListItem>
                ))}
            </List>
        );
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // Enhanced helper for horizontal key-value pairs in Grid
    const HorizontalKeyValue = ({ data, spacing = 3, highlightKey = null }) => (
        <Grid container spacing={spacing}>
            {Object.entries(data).map(([key, value]) => (
                <Grid item xs={12} sm={6} md={4} key={key}>
                    <Box sx={{ 
                        p: 2, 
                        border: highlightKey === key ? '2px solid #f58220' : '1px solid #e3f2fd', 
                        borderRadius: 2, 
                        bgcolor: highlightKey === key 
                            ? 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)' 
                            : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                        transition: 'all 0.3s ease',
                        '&:hover': { 
                            boxShadow: '0 4px 12px rgba(245, 130, 32, 0.15)',
                            transform: 'translateY(-2px)',
                            borderColor: '#f58220'
                        },
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ 
                            textTransform: 'uppercase', 
                            fontWeight: 'bold',
                            fontSize: '0.75rem',
                            mb: 0.5
                        }}>
                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" color="text.primary" sx={{ fontSize: '1rem' }}>
                            {value || 'N/A'}
                        </Typography>
                    </Box>
                </Grid>
            ))}
        </Grid>
    );

    // Enhanced helper to render receivers list
    const renderReceivers = () => {
        const receivers = selectedOrder?.receivers || [];
        if (receivers?.length === 0) {
            return <Typography variant="body2" color="text.secondary">No receivers</Typography>;
        }
        return (
            <List dense sx={{ py: 0 }}>
                {receivers?.map((rec, index) => {
                    const normContainers = normalizeContainers(rec.containers);
                    return (
                        <Card key={rec.id || index} sx={{ 
                            mb: 2, 
                            border: '1px solid #e3f2fd', 
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            '&:hover': { 
                                boxShadow: '0 6px 16px rgba(245, 130, 32, 0.12)',
                                transform: 'translateY(-2px)'
                            }
                        }}>
                            <CardContent sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="subtitle1" fontWeight="bold" color="#f58220">
                                        Receiver {index + 1}: {rec.receiver_name}
                                    </Typography>
                                    <Chip 
                                        label={rec.status || 'Created'} 
                                        size="small" 
                                        color="primary" 
                                        variant="filled"
                                        sx={{ 
                                            bgcolor: getOrderStatusColor(rec.status || 'Created'),
                                            color: 'white',
                                            fontWeight: 'bold'
                                        }} 
                                    />
                                </Box>
                                <HorizontalKeyValue 
                                    data={{
                                        'Contact': rec.receiver_contact,
                                        'Address': rec.receiver_address,
                                        'Email': rec.receiver_email,
                                        'Consignment Number': rec.consignment_number,
                                        'Total Number': rec.total_number,
                                        'Total Weight': rec.total_weight ? `${rec.total_weight} kg` : 'N/A',
                                        'Assignment': rec.assignment,
                                        'Item Ref': rec.item_ref,
                                        'Receiver Ref': rec.receiver_ref,
                                        'Consignment Vessel': rec.consignment_vessel,
                                        'Consignment Marks': rec.consignment_marks,
                                        'Consignment Voyage': rec.consignment_voyage
                                    }} 
                                    spacing={2}
                                />
                                {normContainers.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" gutterBottom>
                                            Containers:
                                        </Typography>
                                        <Stack direction="row" spacing={1} flexWrap="wrap">
                                            {normContainers.map((cont, cIndex) => (
                                                <Chip 
                                                    key={cIndex} 
                                                    label={cont} 
                                                    variant="outlined" 
                                                    color="info" 
                                                    size="small"
                                                    sx={{ 
                                                        mb: 1,
                                                        transition: 'all 0.2s ease',
                                                        '&:hover': { 
                                                            bgcolor: 'info.main',
                                                            color: 'white'
                                                        }
                                                    }} 
                                                />
                                            ))}
                                        </Stack>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </List>
        );
    };

    // Enhanced helper to render order items
    const renderOrderItems = () => {
        const receivers = selectedOrder?.receivers || [];
        if (receivers?.length === 0) {
            return <Typography variant="body2" color="text.secondary">No order items</Typography>;
        }
        
        return (
            <List dense sx={{ py: 0 }}>
                {receivers?.map((rec, index) => {
                    if (rec.shippingDetails && rec.shippingDetails.length > 0) {
                        return rec.shippingDetails.map((item, itemIndex) => (
                            <Card key={`${index}-${itemIndex}`} sx={{ 
                                mb: 2, 
                                border: '1px solid #e3f2fd', 
                                borderRadius: 2,
                                transition: 'all 0.3s ease',
                                '&:hover': { 
                                    boxShadow: '0 6px 16px rgba(245, 130, 32, 0.12)',
                                    transform: 'translateY(-2px)'
                                }
                            }}>
                                <CardContent sx={{ p: 2 }}>
                                    <Typography variant="subtitle1" fontWeight="bold" color="#f58220" gutterBottom>
                                        Receiver {index + 1} - Item {itemIndex + 1}
                                    </Typography>
                                    <HorizontalKeyValue 
                                        data={{
                                            'Category': item.category,
                                            'Subcategory': item.subcategory,
                                            'Type': item.type,
                                            'Pickup Location': item.pickupLocation,
                                            'Delivery Address': item.deliveryAddress,
                                            'Total Number': item.totalNumber,
                                            'Weight': item.weight ? `${item.weight} kg` : 'N/A',
                                            'Item Ref': item.itemRef
                                        }} 
                                        spacing={2}
                                    />
                                </CardContent>
                            </Card>
                        ));
                    }
                    return null;
                })}
            </List>
        );
    };

    // Enhanced Render Containers Tab
    const renderContainersTab = () => {
        if (!selectedOrder) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                        Order data not available
                    </Typography>
                </Box>
            );
        }
        const receivers = selectedOrder?.receivers || [];
        return (
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Card sx={{ 
                        boxShadow: 3, 
                        borderRadius: 3,
                        border: '1px solid #e3f2fd',
                        transition: 'all 0.3s ease',
                        '&:hover': { boxShadow: '0 8px 25px rgba(245, 130, 32, 0.1)' }
                    }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                <LocalShippingIcon color="primary" sx={{ fontSize: '1.5rem' }} />
                                <Typography variant="h5" fontWeight="bold" color="#0a5250" sx={{ fontSize: '1.5rem' }}>
                                    Assigned Containers
                                </Typography>
                            </Box>
                            {assignmentError && <Alert severity="error" sx={{ mb: 2 }}>{assignmentError}</Alert>}
                            <TableContainer sx={{ mb: 3 }}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Receiver</TableCell>
                                            <TableCell>Assigned Container</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {receivers.map((rec) => {
                                            const normContainers = normalizeContainers(rec.containers);
                                            return (
                                                <TableRow key={rec.id || rec.receiver_name}>
                                                    <TableCell>{rec.receiver_name}</TableCell>
                                                    <TableCell>
                                                        {normContainers.length > 0 ? (
                                                            <Stack direction="row" spacing={1}>
                                                                {normContainers.map((cont, cIndex) => (
                                                                    <Chip key={cIndex} label={cont} variant="outlined" color="info" size="small" />
                                                                ))}
                                                            </Stack>
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary">None</Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip 
                                                            label={rec.status || 'Created'} 
                                                            size="small" 
                                                            color="primary" 
                                                            variant="filled"
                                                            sx={{ 
                                                                bgcolor: getOrderStatusColor(rec.status || 'Created'),
                                                                color: 'white',
                                                                fontWeight: 'bold'
                                                            }} 
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            onClick={() => handleAssignContainer(rec.id, assignments[rec.id])}
                                                            disabled={!assignments[rec.id]}
                                                            sx={{
                                                                borderRadius: 2,
                                                                borderColor: '#f58220',
                                                                color: '#f58220',
                                                                '&:hover': {
                                                                    borderColor: '#e65100',
                                                                    color: '#e65100',
                                                                    bgcolor: 'rgba(245, 130, 32, 0.04)'
                                                                }
                                                            }}
                                                        >
                                                            Reassign
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <Typography variant="h6" sx={{ mb: 2 }}>Assign Container to Receiver</Typography>
                            <Grid container spacing={2}>
                                {receivers.map((rec) => (
                                    <Grid item xs={12} md={6} key={rec.id || rec.receiver_name}>
                                        <Card sx={{ 
                                            p: 2,
                                            transition: 'all 0.3s ease',
                                            '&:hover': { 
                                                boxShadow: '0 4px 12px rgba(245, 130, 32, 0.15)',
                                                transform: 'translateY(-2px)'
                                            }
                                        }}>
                                            <Typography variant="subtitle1" gutterBottom>{rec.receiver_name}</Typography>
                                            <FormControl fullWidth size="small">
                                                <InputLabel>Available Container</InputLabel>
                                                <Select
                                                    value={assignments[rec.id] || ''}
                                                    label="Available Container"
                                                    onChange={(e) => {
                                                        setAssignments(prev => ({ ...prev, [rec.id]: e.target.value }));
                                                        setAssignmentError(null);
                                                    }}
                                                >
                                                    <MenuItem value="">None</MenuItem>
                                                    {containers
                                                        .filter(c => 
                                                            (c.pol || '').toLowerCase() === (selectedOrder.place_of_loading || '').toLowerCase()
                                                        )
                                                        .map((container) => (
                                                            <MenuItem key={container.id} value={container.id}>
                                                                {container.container_number} - {container.owner_type}
                                                            </MenuItem>
                                                        ))}
                                                </Select>
                                            </FormControl>
                                            <Button
                                                variant="contained"
                                                fullWidth
                                                sx={{ 
                                                    mt: 2,
                                                    borderRadius: 2,
                                                    bgcolor: 'linear-gradient(135deg, #f58220 0%, #e65100 100%)',
                                                    '&:hover': {
                                                        bgcolor: 'linear-gradient(135deg, #e65100 0%, #d84315 100%)',
                                                    }
                                                }}
                                                onClick={() => handleAssignContainer(rec.id, assignments[rec.id])}
                                                disabled={!assignments[rec.id]}
                                            >
                                                Assign
                                            </Button>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>

                            <Box sx={{ mt: 3 }}>
                                <Button
                                    variant="outlined"
                                    onClick={fetchContainers}
                                    disabled={loadingContainers}
                                    sx={{ 
                                        mb: 2,
                                        borderRadius: 2,
                                        borderColor: '#f58220',
                                        color: '#f58220',
                                        '&:hover': {
                                            borderColor: '#e65100',
                                            color: '#e65100',
                                            bgcolor: 'rgba(245, 130, 32, 0.04)'
                                        }
                                    }}
                                >
                                    {loadingContainers ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                                    {loadingContainers ? 'Loading...' : 'Retry Fetch Containers'}
                                </Button>
                            </Box>

                            {loadingContainers ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                    <CircularProgress size={24} />
                                </Box>
                            ) : containers.length === 0 ? (
                                <Alert severity="info" sx={{ mt: 2 }}>
                                    No open containers available or fetch failed.
                                </Alert>
                            ) : (
                                <>
                                    <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Open Containers</Typography>
                                    <TableContainer>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Container No</TableCell>
                                                    <TableCell>Shipper</TableCell>
                                                    <TableCell>POL</TableCell>
                                                    <TableCell>POD</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {containers.map((container) => (
                                                    <TableRow key={container.id}>
                                                        <TableCell>{container.container_number}</TableCell>
                                                        <TableCell>{container.owner_type}</TableCell>
                                                        <TableCell>{container.owner_type === 'soc' ? container.available_at : container.place_of_loading}</TableCell>
                                                        <TableCell>{container.owner_type === 'soc' ? container.purchase_from : container.place_of_destination}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        );
    };

    const handleSnackbarClose = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    return (
        <>
            <Dialog 
                open={openModal} 
                onClose={handleCloseModal} 
                maxWidth={1400} 
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        overflow: 'hidden',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                    }
                }}
            >
                <DialogTitle sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    bgcolor: '#0d6c6a', 
                    color: 'white', 
                    py: 3,
                    px: 4,
                    boxShadow: '0 4px 12px rgba(245, 130, 32, 0.3)'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <InfoIcon sx={{ fontSize: '1.8rem' }} />
                        <Typography variant="h5" fontWeight="bold" sx={{ fontSize: '1.75rem' }}>
                            Order Details - {selectedOrder?.booking_ref}
                        </Typography>
                        <Chip 
                            label={selectedOrder?.overall_status || selectedOrder?.status || 'Created'} 
                            size="small" 
                            color="primary" 
                            variant="filled"
                            sx={{ 
                                ml: 1,
                                bgcolor: statusColor,
                                color: 'white',
                                fontWeight: 'bold'
                            }} 
                        />
                        {(selectedOrder?.receivers || []).length > 0 && (
                            <Chip 
                                label={`${selectedOrder?.receivers?.length} Receivers`} 
                                size="small" 
                                color="secondary" 
                                variant="outlined" 
                                sx={{ 
                                    ml: 1,
                                    borderColor: 'rgba(255,255,255,0.5)',
                                    color: 'white'
                                }} 
                            />
                        )}
                    </Box>
                    <IconButton 
                        onClick={handleCloseModal} 
                        sx={{ 
                            color: 'white', 
                            '&:hover': { 
                                bgcolor: 'rgba(255,255,255,0.1)',
                                transform: 'rotate(90deg)'
                            },
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                
                <DialogContent sx={{ p: 0 }}>
                    {modalLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                            <CircularProgress size={40} sx={{ color: '#f58220' }} />
                            <Typography variant="body1" sx={{ ml: 2, color: 'text.secondary' }}>
                                Loading order details...
                            </Typography>
                        </Box>
                    ) : modalError ? (
                        <Alert severity="error" sx={{ m: 3, borderRadius: 2 }}>
                            {modalError}
                        </Alert>
                    ) : selectedOrder ? (
                        <>
                            <Box sx={{ 
                                borderBottom: 1, 
                                borderColor: 'divider', 
                                bgcolor: 'linear-gradient(to right, #fafafa, #f5f5f5)',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                            }}>
                                <Tabs 
                                    value={tabValue} 
                                    onChange={handleTabChange} 
                                    variant="scrollable" 
                                    scrollButtons="auto" 
                                    sx={{ 
                                        px: 2,
                                        '& .MuiTab-root': {
                                            minHeight: 64,
                                            transition: 'all 0.3s ease'
                                        }
                                    }}
                                    TabIndicatorProps={{
                                        style: {
                                            backgroundColor: '#f58220',
                                            height: 3
                                        }
                                    }}
                                >
                                    <Tab 
                                        label="Overview" 
                                        icon={<InfoIcon />} 
                                        iconPosition="start" 
                                        {...a11yProps(0)} 
                                        sx={{ 
                                            color: '#666', 
                                            fontWeight: 'bold',
                                            fontSize: '0.9rem',
                                            '&.Mui-selected': { color: '#f58220' }
                                        }} 
                                    />
                                    <Tab 
                                        label="Parties" 
                                        icon={<PersonIcon />} 
                                        iconPosition="start" 
                                        {...a11yProps(1)} 
                                        sx={{ 
                                            color: '#666', 
                                            fontWeight: 'bold',
                                            fontSize: '0.9rem',
                                            '&.Mui-selected': { color: '#f58220' }
                                        }} 
                                    />
                                    <Tab 
                                        label="Shipping" 
                                        icon={<InventoryIcon />} 
                                        iconPosition="start" 
                                        {...a11yProps(2)} 
                                        sx={{ 
                                            color: '#666', 
                                            fontWeight: 'bold',
                                            fontSize: '0.9rem',
                                            '&.Mui-selected': { color: '#f58220' }
                                        }} 
                                    />
                                    <Tab 
                                        label="Transport" 
                                        icon={<DriveEtaIcon />} 
                                        iconPosition="start" 
                                        {...a11yProps(3)} 
                                        sx={{ 
                                            color: '#666', 
                                            fontWeight: 'bold',
                                            fontSize: '0.9rem',
                                            '&.Mui-selected': { color: '#f58220' }
                                        }} 
                                    />
                                    <Tab 
                                        label="Inbound/Outbound" 
                                        icon={<LocalShippingIcon />} 
                                        iconPosition="start" 
                                        {...a11yProps(4)} 
                                        sx={{ 
                                            color: '#666', 
                                            fontWeight: 'bold',
                                            fontSize: '0.9rem',
                                            '&.Mui-selected': { color: '#f58220' }
                                        }} 
                                    />
                                    <Tab 
                                        label="Files" 
                                        icon={<AttachFileIcon />} 
                                        iconPosition="start" 
                                        {...a11yProps(5)} 
                                        sx={{ 
                                            color: '#666', 
                                            fontWeight: 'bold',
                                            fontSize: '0.9rem',
                                            '&.Mui-selected': { color: '#f58220' }
                                        }} 
                                    />
                                    <Tab 
                                        label="Containers" 
                                        icon={<LocalShippingIcon />} 
                                        iconPosition="start" 
                                        {...a11yProps(6)} 
                                        sx={{ 
                                            color: '#666', 
                                            fontWeight: 'bold',
                                            fontSize: '0.9rem',
                                            '&.Mui-selected': { color: '#f58220' }
                                        }} 
                                    />
                                </Tabs>
                            </Box>
                            
                            <Box sx={{ p: 3, bgcolor: '#fafafa' }}>
                                <TabPanel value={tabValue} index={0}>
                                    <Grid container spacing={3}>
                                        {/* Order Information Card */}
                                        <Grid item xs={12}>
                                            <Card sx={{ 
                                                boxShadow: 3, 
                                                borderRadius: 3,
                                                border: '1px solid #e3f2fd',
                                                transition: 'all 0.3s ease',
                                                '&:hover': { boxShadow: '0 8px 25px rgba(245, 130, 32, 0.1)' }
                                            }}>
                                                <CardContent sx={{ p: 3 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                                        <InfoIcon color="primary" sx={{ fontSize: '1.5rem' }} />
                                                        <Typography variant="h5" fontWeight="bold" color="#f58220" sx={{ fontSize: '1.5rem' }}>
                                                            Order Information
                                                        </Typography>
                                                    </Box>
                                                    <HorizontalKeyValue 
                                                        data={{
                                                            'Status': selectedOrder?.overall_status || selectedOrder?.status || 'Created',
                                                            'RGL Booking Number': selectedOrder?.rgl_booking_number,
                                                            'Place of Loading': getPlaceName(selectedOrder?.place_of_loading),
                                                            'Final Destination': getPlaceName(selectedOrder?.final_destination),
                                                            'Place of Delivery': getPlaceName(selectedOrder?.place_of_delivery),
                                                            'ETA': formatDate(selectedOrder?.eta),
                                                            'ETD': formatDate(selectedOrder?.etd),
                                                            'Consignment Marks': selectedOrder?.consignment_marks,
                                                            'Point of Origin': getPlaceName(selectedOrder?.point_of_origin),
                                                            'Shipping Line': selectedOrder?.shipping_line,
                                                            'Order Remarks': selectedOrder?.order_remarks,
                                                            'Consignment Remarks': selectedOrder?.consignment_remarks,
                                                            'Created At': new Date(selectedOrder?.created_at).toLocaleString('en-US', { 
                                                                year: 'numeric', 
                                                                month: 'short', 
                                                                day: 'numeric', 
                                                                hour: '2-digit', 
                                                                minute: '2-digit' 
                                                            })
                                                        }} 
                                                    />
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    </Grid>
                                </TabPanel>

                                <TabPanel value={tabValue} index={1}>
                                    <Grid container spacing={3}>
                                        {/* Sender Details Card */}
                                        <Grid item xs={12} md={6}>
                                            <Card sx={{ 
                                                boxShadow: 3, 
                                                borderRadius: 3,
                                                border: '1px solid #e3f2fd',
                                                transition: 'all 0.3s ease',
                                                '&:hover': { boxShadow: '0 8px 25px rgba(245, 130, 32, 0.1)' }
                                            }}>
                                                <CardContent sx={{ p: 3 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                                        <PersonIcon color="primary" sx={{ fontSize: '1.5rem' }} />
                                                        <Typography variant="h5" fontWeight="bold" color="#f58220" sx={{ fontSize: '1.5rem' }}>
                                                            Sender Details
                                                        </Typography>
                                                    </Box>
                                                    <HorizontalKeyValue 
                                                        data={{
                                                            'Name': selectedOrder?.sender_name,
                                                            'Contact': selectedOrder?.sender_contact,
                                                            'Address': selectedOrder?.sender_address,
                                                            'Email': selectedOrder?.sender_email,
                                                            'Sender Ref': selectedOrder?.sender_ref,
                                                            'Sender Remarks': selectedOrder?.sender_remarks
                                                        }} 
                                                        spacing={2}
                                                    />
                                                </CardContent>
                                            </Card>
                                        </Grid>

                                        {/* Receivers Details Card */}
                                        <Grid item xs={12} md={6}>
                                            <Card sx={{ 
                                                boxShadow: 3, 
                                                borderRadius: 3,
                                                border: '1px solid #e3f2fd',
                                                transition: 'all 0.3s ease',
                                                '&:hover': { boxShadow: '0 8px 25px rgba(245, 130, 32, 0.1)' }
                                            }}>
                                                <CardContent sx={{ p: 3 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                                        <PersonIcon color="primary" sx={{ fontSize: '1.5rem' }} />
                                                        <Typography variant="h5" fontWeight="bold" color="#f58220" sx={{ fontSize: '1.5rem' }}>
                                                            Receivers ({(selectedOrder?.receivers || []).length})
                                                        </Typography>
                                                    </Box>
                                                    {renderReceivers()}
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    </Grid>
                                </TabPanel>

                                <TabPanel value={tabValue} index={2}>
                                    <Grid container spacing={3}>
                                        {/* Shipping Details Card */}
                                        <Grid item xs={12}>
                                            <Card sx={{ 
                                                boxShadow: 3, 
                                                borderRadius: 3,
                                                border: '1px solid #e3f2fd',
                                                transition: 'all 0.3s ease',
                                                '&:hover': { boxShadow: '0 8px 25px rgba(245, 130, 32, 0.1)' }
                                            }}>
                                                <CardContent sx={{ p: 3 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                                        <InventoryIcon color="primary" sx={{ fontSize: '1.5rem' }} />
                                                        <Typography variant="h5" fontWeight="bold" color="#f58220" sx={{ fontSize: '1.5rem' }}>
                                                            Shipping Details
                                                        </Typography>
                                                    </Box>
                                                    {renderOrderItems()}
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    </Grid>
                                </TabPanel>

                                <TabPanel value={tabValue} index={3}>
                                    <Grid container spacing={3}>
                                        {/* Transport Details Card */}
                                        <Grid item xs={12}>
                                            <Card sx={{ 
                                                boxShadow: 3, 
                                                borderRadius: 3,
                                                border: '1px solid #e3f2fd',
                                                transition: 'all 0.3s ease',
                                                '&:hover': { boxShadow: '0 8px 25px rgba(245, 130, 32, 0.1)' }
                                            }}>
                                                <CardContent sx={{ p: 3 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                                        <DriveEtaIcon color="primary" sx={{ fontSize: '1.5rem' }} />
                                                        <Typography variant="h5" fontWeight="bold" color="#f58220" sx={{ fontSize: '1.5rem' }}>
                                                            Transport Details
                                                        </Typography>
                                                    </Box>
                                                    <HorizontalKeyValue 
                                                        data={{
                                                            'Transport Type': selectedOrder?.transport_type,
                                                            'Driver Name': selectedOrder?.driver_name,
                                                            'Driver Contact': selectedOrder?.driver_contact,
                                                            'Driver NIC': selectedOrder?.driver_nic,
                                                            'Driver Pickup Location': selectedOrder?.driver_pickup_location,
                                                            'Truck Number': selectedOrder?.truck_number,
                                                            'Third Party Transport': selectedOrder?.third_party_transport
                                                        }} 
                                                    />
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    </Grid>
                                </TabPanel>

                                <TabPanel value={tabValue} index={4}>
                                    <Grid container spacing={3}>
                                        {/* Drop-Off / Inbound Details Card */}
                                        <Grid item xs={12} md={6}>
                                            <Card sx={{ 
                                                boxShadow: 3, 
                                                borderRadius: 3,
                                                border: '1px solid #e3f2fd',
                                                transition: 'all 0.3s ease',
                                                '&:hover': { boxShadow: '0 8px 25px rgba(245, 130, 32, 0.1)' }
                                            }}>
                                                <CardContent sx={{ p: 3 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                                        <LocalShippingIcon color="primary" sx={{ fontSize: '1.5rem' }} />
                                                        <Typography variant="h5" fontWeight="bold" color="#f58220" sx={{ fontSize: '1.5rem' }}>
                                                            Drop-Off (Inbound)
                                                        </Typography>
                                                    </Box>
                                                    <HorizontalKeyValue 
                                                        data={{
                                                            'Drop Method': selectedOrder?.drop_method,
                                                            'Dropoff Name': selectedOrder?.dropoff_name,
                                                            'Drop-Off CNIC/ID': selectedOrder?.drop_off_cnic,
                                                            'Drop-Off Mobile': selectedOrder?.drop_off_mobile,
                                                            'Plate No': selectedOrder?.plate_no,
                                                            'Drop Date': formatDate(selectedOrder?.drop_date)
                                                        }} 
                                                        spacing={2}
                                                    />
                                                </CardContent>
                                            </Card>
                                        </Grid>

                                        {/* Collection / Outbound Details Card */}
                                        <Grid item xs={12} md={6}>
                                            <Card sx={{ 
                                                boxShadow: 3, 
                                                borderRadius: 3,
                                                border: '1px solid #e3f2fd',
                                                transition: 'all 0.3s ease',
                                                '&:hover': { boxShadow: '0 8px 25px rgba(245, 130, 32, 0.1)' }
                                            }}>
                                                <CardContent sx={{ p: 3 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                                        <LocalShippingIcon color="primary" sx={{ fontSize: '1.5rem' }} />
                                                        <Typography variant="h5" fontWeight="bold" color="#f58220" sx={{ fontSize: '1.5rem' }}>
                                                            Collection (Outbound)
                                                        </Typography>
                                                    </Box>
                                                    <HorizontalKeyValue 
                                                        data={{
                                                            'Collection Method': selectedOrder?.collection_method,
                                                            'Collection Scope': selectedOrder?.collection_scope,
                                                            'Full/Partial': selectedOrder?.full_partial,
                                                            'Qty Delivered': selectedOrder?.qty_delivered,
                                                            'Client Receiver Name': selectedOrder?.client_receiver_name,
                                                            'Client Receiver ID': selectedOrder?.client_receiver_id,
                                                            'Client Receiver Mobile': selectedOrder?.client_receiver_mobile,
                                                            'Delivery Date': formatDate(selectedOrder?.delivery_date)
                                                        }} 
                                                        spacing={2}
                                                    />
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    </Grid>
                                </TabPanel>

                                <TabPanel value={tabValue} index={5}>
                                    <Grid container spacing={3}>
                                        {/* Attachments Card */}
                                        <Grid item xs={12} md={6}>
                                            <Card sx={{ 
                                                boxShadow: 3, 
                                                borderRadius: 3,
                                                border: '1px solid #e3f2fd',
                                                transition: 'all 0.3s ease',
                                                '&:hover': { boxShadow: '0 8px 25px rgba(245, 130, 32, 0.1)' }
                                            }}>
                                                <CardContent sx={{ p: 3 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                                        <AttachFileIcon color="primary" sx={{ fontSize: '1.5rem' }} />
                                                        <Typography variant="h5" fontWeight="bold" color="#f58220" sx={{ fontSize: '1.5rem' }}>
                                                            Attachments
                                                        </Typography>
                                                    </Box>
                                                    {renderFiles(selectedOrder?.attachments)}
                                                </CardContent>
                                            </Card>
                                        </Grid>

                                        {/* Gatepass Card */}
                                        <Grid item xs={12} md={6}>
                                            <Card sx={{ 
                                                boxShadow: 3, 
                                                borderRadius: 3,
                                                border: '1px solid #e3f2fd',
                                                transition: 'all 0.3s ease',
                                                '&:hover': { boxShadow: '0 8px 25px rgba(245, 130, 32, 0.1)' }
                                            }}>
                                                <CardContent sx={{ p: 3 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                                        <AttachFileIcon color="primary" sx={{ fontSize: '1.5rem' }} />
                                                        <Typography variant="h5" fontWeight="bold" color="#f58220" sx={{ fontSize: '1.5rem' }}>
                                                            Gatepass
                                                        </Typography>
                                                    </Box>
                                                    {renderFiles(selectedOrder?.gatepass)}
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    </Grid>
                                </TabPanel>

                                <TabPanel value={tabValue} index={6}>
                                    {renderContainersTab()}
                                </TabPanel>
                            </Box>
                        </>
                    ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                            <Typography variant="body1" color="text.secondary">
                                No order selected
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                
                <DialogActions sx={{ 
                    p: 3, 
                    bgcolor: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', 
                    borderTop: '1px solid #e0e0e0',
                    justifyContent: 'space-between',
                    boxShadow: '0 -4px 12px rgba(0,0,0,0.05)'
                }}>
                    <Box>
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel id="pdf-method-label">PDF Method</InputLabel>
                            <Select
                                labelId="pdf-method-label"
                                value={pdfGenerationMethod}
                                label="PDF Method"
                                onChange={(e) => setPdfGenerationMethod(e.target.value)}
                                sx={{ borderRadius: 2 }}
                            >
                                <MenuItem value="jsPDF">Standard PDF</MenuItem>
                                <MenuItem value="html2canvas">Visual PDF</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button 
                            onClick={handleCloseModal} 
                            variant="outlined" 
                            sx={{ 
                                borderRadius: 3, 
                                borderColor: '#f58220', 
                                color: '#f58220',
                                px: 4,
                                py: 1,
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                transition: 'all 0.3s ease',
                                '&:hover': { 
                                    borderColor: '#e65100', 
                                    color: '#e65100',
                                    boxShadow: '0 4px 12px rgba(245, 130, 32, 0.2)',
                                    transform: 'translateY(-1px)'
                                }
                            }}
                        >
                            Close
                        </Button>
                        <Button 
                            onClick={() => generateOrderPDF(selectedOrder)} 
                            variant="outlined" 
                            sx={{ 
                                borderRadius: 3, 
                                borderColor: '#f58220', 
                                color: '#f58220',
                                px: 4,
                                py: 1,
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                transition: 'all 0.3s ease',
                                '&:hover': { 
                                    borderColor: '#e65100', 
                                    color: '#e65100',
                                    boxShadow: '0 4px 12px rgba(245, 130, 32, 0.2)',
                                    transform: 'translateY(-1px)'
                                }
                            }}
                            disabled={!selectedOrder || isGeneratingPDF}
                            startIcon={isGeneratingPDF ? <CircularProgress size={20} color="inherit" /> : <PictureAsPdfIcon />}
                        >
                            {isGeneratingPDF ? 'Generating...' : 'Export to PDF'}
                        </Button>
                        <Button 
                            onClick={() => {handleEdit(selectedOrder?.id); }} 
                            variant="contained" 
                            sx={{ 
                                borderRadius: 3, 
                                bgcolor: 'linear-gradient(135deg, #f58220 0%, #e65100 100%)',
                                px: 4,
                                py: 1,
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                transition: 'all 0.3s ease',
                                '&:hover': { 
                                    bgcolor: 'linear-gradient(135deg, #e65100 0%, #d84315 100%)',
                                    boxShadow: '0 6px 20px rgba(245, 130, 32, 0.3)',
                                    transform: 'translateY(-1px)'
                                }
                            }}
                            disabled={!selectedOrder}
                        >
                            Edit Order
                        </Button>
                    </Box>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default OrderModalView;