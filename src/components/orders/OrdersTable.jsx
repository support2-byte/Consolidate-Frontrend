import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
  Checkbox,
  Typography,
  Stack,
  IconButton,
  TablePagination,
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import UpdateIcon from "@mui/icons-material/Update";
import { getPlaceName } from "../../Utlis/placeHelpers";
import {
  StyledTableRow,
  StyledTableCell,
  StyledTableHeadCell,
  StyledTooltip,
} from "../../Utlis/styledComponents";
import { PrettyList } from "./ReceiversTooltip";

const HEADERS = [
  { key: "created", label: "Created At" },
  { key: "ref", label: "Booking Ref" },
  { key: "form_no", label: "Form No" },
  { key: "receivers", label: "Receivers & Containers", width: 200 },
  { key: "dest", label: "POD" },
  { key: "sender", label: "Sender" },
  { key: "total_items", label: "Total Items & Weight", fontSize: 10 },
  { key: "actions", label: "Actions" },
];

const OrdersTable = ({
  orders,
  filterPlaces,
  selectedOrders,
  onToggleOrder,
  onStatusUpdate,
  onDocuments,
  onView,
  onEdit,
  onCopyContainer,
  page,
  rowsPerPage,
  total,
  onChangePage,
  onChangeRowsPerPage,
}) => {
  const isSelected = (id) => selectedOrders.includes(id);

  return (
    <>
      <TableContainer
        sx={{
          borderRadius: 2,
          overflow: "scroll",
          boxShadow: 2,
          width: "100%",
          "&::-webkit-scrollbar": { height: 6, width: 6 },
          "&::-webkit-scrollbar-track": { background: "background.paper" },
          "&::-webkit-scrollbar-thumb": {
            background: "#0d6c6a",
            borderRadius: 3,
            display: "table-cell",
          },
        }}
      >
        <Table stickyHeader size="small" aria-label="Consignments table">
          <TableHead>
            <TableRow sx={{ bgcolor: "#0d6c6a" }}>
              <StyledTableHeadCell
                padding="checkbox"
                sx={{ bgcolor: "#0d6c6a", color: "#fff" }}
              />
              {HEADERS.map((h) => (
                <StyledTableHeadCell
                  key={h.key}
                  sx={{
                    bgcolor: "#0d6c6a",
                    color: "#fff",
                    width: h.width,
                    fontSize: h.fontSize,
                  }}
                >
                  {h.label}
                </StyledTableHeadCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => {
              const isItemSelected = isSelected(order.id);

              const productsSummary = order.receivers.flatMap((receiver) =>
                (receiver.shippingdetails || []).map((detail) => ({
                  total_number: parseInt(detail.totalNumber || 0),
                  weight: parseFloat(detail.weight || 0),
                })),
              );
              const totalItems = productsSummary.reduce(
                (sum, p) => sum + p.total_number,
                0,
              );
              const totalWeight = productsSummary.reduce(
                (sum, p) => sum + p.weight,
                0,
              );

              return (
                <StyledTableRow
                  key={order.id}
                  onClick={() => onToggleOrder(order.id)}
                  role="checkbox"
                  aria-checked={isItemSelected}
                  selected={isItemSelected}
                  sx={{ cursor: "pointer" }}
                >
                  <StyledTableCell
                    padding="checkbox"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={isItemSelected}
                      onChange={() => onToggleOrder(order.id)}
                      inputProps={{
                        "aria-labelledby": `enhanced-table-checkbox-${order.id}`,
                      }}
                    />
                  </StyledTableCell>

                  <StyledTableCell>
                    {new Date(order.created_at).toLocaleDateString()}
                  </StyledTableCell>
                  <StyledTableCell>{order.booking_ref}</StyledTableCell>
                  <StyledTableCell>{order?.rgl_booking_number}</StyledTableCell>

                  <TableCell colSpan={1.5}>
                    <StyledTooltip
                      title={
                        <PrettyList
                          receivers={order.receivers}
                          title="Receivers & Containers"
                          onCopyContainer={onCopyContainer}
                        />
                      }
                      arrow
                      placement="bottom-start"
                      PopperProps={{
                        sx: {
                          "& .MuiTooltip-tooltip": {
                            border: "1px solid #e0e0e0",
                            background: "transparent",
                            width: 600,
                          },
                        },
                      }}
                    >
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{ maxWidth: 150, cursor: "help" }}
                      >
                        {order.receivers.length > 0 ? (
                          <>
                            {order.receivers.length > 1 && (
                              <sup
                                style={{
                                  padding: 4,
                                  borderRadius: 50,
                                  float: "left",
                                  background: "#00695c",
                                  color: "#fff",
                                }}
                              >
                                ({order.receivers.length})
                              </sup>
                            )}
                            <span style={{ padding: 0 }}>
                              {order.receivers.map((r) => r.receiverName || "")}
                            </span>
                          </>
                        ) : (
                          "-"
                        )}
                      </Typography>
                    </StyledTooltip>
                  </TableCell>

                  <StyledTableCell>
                    {getPlaceName(order.place_of_delivery, filterPlaces)}
                  </StyledTableCell>
                  <StyledTableCell colSpan={1.5}>
                    {order.sender_name?.substring(0, 20)}
                  </StyledTableCell>

                  <TableCell
                    sx={{ flexWrap: "wrap", display: "list-item", p: 0 }}
                  >
                    <StyledTableCell
                      sx={{
                        paddingLeft: 0,
                        fontWeight: "bold",
                        color: "#000",
                        border: 0,
                      }}
                    >
                      {totalItems.toFixed()} Packages
                    </StyledTableCell>
                    <StyledTableCell
                      sx={{
                        paddingLeft: 0,
                        fontWeight: "bold",
                        color: "#555",
                        border: 0,
                      }}
                    >
                      {totalWeight.toFixed()} kg
                    </StyledTableCell>
                  </TableCell>

                  <StyledTableCell>
                    <Stack direction="row" spacing={0}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStatusUpdate(order);
                        }}
                        title="Update Status"
                      >
                        <UpdateIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDocuments(order.id);
                        }}
                        title="Documents"
                      >
                        <DescriptionIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onView(order.id);
                        }}
                        title="View Details"
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(order.id);
                        }}
                        title="Edit"
                      >
                        <EditIcon />
                      </IconButton>
                    </Stack>
                  </StyledTableCell>
                </StyledTableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50, 75, 100, 125]}
        component="div"
        count={total}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={onChangePage}
        onRowsPerPageChange={onChangeRowsPerPage}
        labelRowsPerPage="Rows per page:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}–${to} of ${count !== -1 ? count : `more than ${to}`}`
        }
        sx={{
          borderTop: "1px solid rgba(224, 224, 224, 1)",
          "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
            {
              color: "#f58220",
              fontWeight: "medium",
              fontSize: "0.875rem",
            },
          "& .MuiTablePagination-select, & .MuiTablePagination-input": {
            fontSize: "0.875rem",
            borderRadius: 1,
          },
          "& .MuiTablePagination-actions button": {
            color: "#0d6c6a",
            "& svg": { fontSize: "1.125rem" },
            "&:hover": { backgroundColor: "rgba(13, 108, 106, 0.08)" },
          },
        }}
      />
    </>
  );
};

export default OrdersTable;
