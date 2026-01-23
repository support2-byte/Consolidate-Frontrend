import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Grid, Stack, Card, CardContent, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Button, IconButton, TextField, Select, MenuItem, InputLabel, FormControl,
  Tooltip, Popover, List, ListItem, ListItemText, Checkbox, Divider,
  Alert, AlertTitle, LinearProgress, Collapse, Accordion, AccordionSummary, AccordionDetails,
  CircularProgress,
} from '@mui/material';
import { Snackbar, } from "@mui/material";
import {
  Close as CloseIcon, LocalShipping as LocalShippingIcon, Person as PersonIcon, Inventory as InventoryIcon, Assignment as AssignmentIcon,
  ViewColumn as ViewColumnIcon, Edit as EditIcon, Delete as DeleteIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon,
  Check as CheckIcon, Info as InfoIcon, Save as SaveIcon, Add as AddIcon,
} from '@mui/icons-material';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ExpandLess from '@mui/icons-material/ExpandLess';
import { api } from '../../api';
import AssignmentForm from './AssignForm';

// You can keep these if you use them:
// import StatusChip from './StatusChip';
// import AssignmentForm from './AssignmentForm';

const AssignModal = ({
  openAssignModal,
  setOpenAssignModal,
  selectedOrders,
  orders,
  containers,
  fetchContainers,
  handleAssign,
  fetchOrders,
  // api,
}) => {
  const theme = {
    primary: '#f58220',
    secondary: '#1a9c8f',
    background: '#f8f9fa',
    surface: '#ffffff',
    border: '#e0e0e0',
    textPrimary: '#212121',
    textSecondary: '#757575',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    divider: '#e0e0e0',
  };

  const [detailedOrders, setDetailedOrders] = useState({});
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [expandedReceivers, setExpandedReceivers] = useState(new Set());
const [assignmentQuantities, setAssignmentQuantities] = useState({});
const [assignmentWeights, setAssignmentWeights] = useState({});
const [selectedContainersPerDetail, setSelectedContainersPerDetail] = useState({});
  const availableContainers = useMemo(
    () => containers.filter(c => c.derived_status === 'Available' || c.derived_status === 'Assigned to Job'),
    [containers]
  );

  const getDetailKey = useCallback((orderId, recId, detailIdx) => `${orderId}-${recId}-${detailIdx}`, []);

  // Fetch single order
  const fetchOrder = useCallback(async (id) => {
    try {
      const response = await api.get(`/api/orders/${id}`, { params: { includeContainer: true } });
      return response.data || null;
    } catch (err) {
      console.error(`Failed to fetch order ${id}:`, err);
      return null;
    }
  }, [api]);

  // Fetch all selected orders
  useEffect(() => {
    if (!openAssignModal || !selectedOrders?.length) return;

    let mounted = true;

    const loadOrders = async () => {
      setFetchingDetails(true);
      const updated = { ...detailedOrders };
      let hasChange = false;

      for (const id of selectedOrders) {
        if (!updated[id]) {
          const data = await fetchOrder(id);
          if (data && mounted) {
            updated[id] = data;
            hasChange = true;
          }
        }
      }

      if (hasChange && mounted) {
        setDetailedOrders(updated);
      }
      if (mounted) setFetchingDetails(false);
    };

    loadOrders();

    return () => { mounted = false; };
  }, [openAssignModal, selectedOrders, fetchOrder]);
const enhancedHandleAssign = useCallback(() => {
  if (!selectedOrders?.length) {
    // showToast?.('No orders selected to assign', 'warning');
    return;
  }
console.log('selectedOrdersselectedOrdersselectedOrders',selectedOrders)
  const assignments = selectedOrders.reduce((acc, orderId) => {
    const fullOrder = detailedOrders?.[orderId] || orders?.find(o => o.id === orderId);

    if (!fullOrder?.receivers?.length) {
      console.warn(`No receivers found for order ${orderId}`);
      return acc;
    }

    const orderAssignments = {};

    fullOrder.receivers.forEach(rec => {
      const details = rec.shippingDetails || rec.shippingdetails || [];

      if (!details.length) {
        console.warn(`No shipping details for receiver ${rec.id} in order ${orderId}`);
        return;
      }

      const recAssignments = details.reduce((recAcc, detailItem, idx) => {
        const key = getDetailKey(orderId, rec.id, idx);

        const qty = Number(assignmentQuantities?.[key] ?? 0);
        const weightKg = Number(assignmentWeights?.[key] ?? 0);
        const containers = selectedContainersPerDetail?.[key] || [];

        // Skip if nothing to assign
        if (qty <= 0 || weightKg <= 0 || containers.length === 0) return recAcc;

        // Critical validation: ensure we have real DB ID
        if (!detailItem?.id) {
          console.error(
            `Missing orderItemId in shipping detail for order ${orderId}, receiver ${rec.id}, index ${idx}`,
            detailItem
          );
          // showToast?.(
          //   `Cannot assign: missing item ID in detail ${idx + 1} (receiver ${rec.receiverName || rec.id})`,
          //   'warning'
          // );
          return recAcc;
        }

        recAcc[idx] = {
          orderItemId: detailItem.id,           // Real DB ID from order_items table
          qty,
          totalAssignedWeight: weightKg,
          containers,                           // array of cids
        };

        return recAcc;
      }, {});

      // Only add receiver if it has valid assignments
      if (Object.keys(recAssignments).length > 0) {
        orderAssignments[rec.id] = recAssignments;
      }
    });

    // Only include order if it has any receiver assignments
    if (Object.keys(orderAssignments).length > 0) {
      acc[orderId] = orderAssignments;
    }

    return acc;
  }, {});

  // Debug: show what we're about to send
  if (Object.keys(assignments).length === 0) {
    // showToast?.('No valid assignments to send (check quantities, weights, containers)', 'info');
    console.log('No assignments generated – nothing to send');
    return;
  }

  console.log('Final assignments payload (sending to backend):', JSON.stringify(assignments, null, 2));

  // Safety check: ensure no missing orderItemId
  const missingIds = [];
  Object.values(assignments).forEach(orderAssign => {
    Object.values(orderAssign).forEach(recAssign => {
      Object.values(recAssign).forEach(detail => {
        if (!detail?.orderItemId) missingIds.push(detail);
      });
    });
  });

  if (missingIds.length > 0) {
    console.warn('Some assignment entries missing orderItemId:', missingIds);
    // showToast?.(
    //   `Cannot assign: ${missingIds.length} items missing required ID – check console`,
    //   'error'
    // );
    return;
  }

  // All good – send to backend
  handleAssign(assignments);
  setOpenAssignModal(false);

  // showToast?.(`Assigning ${Object.keys(assignments).length} order(s)...`, 'info');

}, [
  selectedOrders,
  detailedOrders,
  orders,
  assignmentQuantities,
  assignmentWeights,
  selectedContainersPerDetail,
  getDetailKey,
  handleAssign,
  setOpenAssignModal,
  // showToast,
]);
  const needsFetching = selectedOrders.some(id => !detailedOrders[id]);

  if (!openAssignModal) return null;

  if (fetchingDetails || needsFetching) {
    return (
      <Dialog open={openAssignModal} onClose={() => setOpenAssignModal(false)} maxWidth="md" fullWidth>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <CircularProgress size={50} />
          <Box ml={4}>
            <Typography variant="h6">Loading order details...</Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedOrders.length} orders • {selectedOrders.filter(id => !detailedOrders[id]).length} remaining
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  // ────────────────────────────────────────────────
  // ReceiverRow Component
  // ────────────────────────────────────────────────
  const ReceiverRow = React.memo(({ rec, globalIndex }) => {
    const fullOrder = detailedOrders?.[rec.orderId] || orders?.find(o => o.id === rec.orderId) || null;

    if (!fullOrder) {
      return (
        <TableRow>
          <TableCell colSpan={13} align="center" sx={{ py: 4 }}>
            <Typography color="text.secondary">
              Loading order {rec.orderId || '—'}...
            </Typography>
          </TableCell>
        </TableRow>
      );
    }

    const fullRec = fullOrder.receivers?.find(r => r.id === rec.id) || rec;
    const shippingDetails = fullRec.shippingdetails || fullRec.shippingDetails || [];

    const [localShippingDetails, setLocalShippingDetails] = useState(() =>
      shippingDetails.map(sd => ({
        ...sd,
        containerDetails: (sd.containerDetails || []).filter(cd => {
          const b = Number(cd?.assign_total_box ?? 0);
          const w = Number(cd?.assign_weight ?? 0);
          return b >= 1 && w >= 0.01 && !!cd?.container?.cid;
        }),
        remainingItems: String(
          Math.max(0, Number(sd.totalNumber ?? 0) -
            (sd.containerDetails || []).reduce((s, c) => s + Number(c.assign_total_box ?? 0), 0))
        ),
      }))
    );

    useEffect(() => {
      setLocalShippingDetails(
        shippingDetails.map(sd => ({
          ...sd,
          containerDetails: (sd.containerDetails || []).filter(cd => {
            const b = Number(cd?.assign_total_box ?? 0);
            const w = Number(cd?.assign_weight ?? 0);
            return b >= 1 && w >= 0.01 && !!cd?.container?.cid;
          }),
          remainingItems: String(
            Math.max(0, Number(sd.totalNumber ?? 0) -
              (sd.containerDetails || []).reduce((s, c) => s + Number(c.assign_total_box ?? 0), 0))
          ),
        }))
      );
    }, [shippingDetails]);

    const getRemainingWeight = useCallback((sd) => {
      const assigned = (sd.containerDetails || []).reduce((sum, cd) => sum + Number(cd.assign_weight ?? 0), 0);
      return Math.max(0, Number(sd.weight ?? 0) - assigned);
    }, []);

    const totalRemainingUnits = localShippingDetails.reduce((sum, sd) => sum + Number(sd.remainingItems ?? 0), 0);
    const totalRemainingWeight = localShippingDetails.reduce((sum, sd) => sum + getRemainingWeight(sd), 0);

    const address = localShippingDetails.map(d => d.deliveryAddress).filter(Boolean).join(', ') || fullRec.receiverAddress || 'N/A';
    const contact = fullRec.receiverContact || 'N/A';
    const email = fullRec.receiverEmail || 'N/A';

    const existingContainers = localShippingDetails.flatMap(sd => 
      (sd.containerDetails || []).map(cd => cd.container?.cid).filter(Boolean)
    );

    const allContainersPreview = [...new Set(
      existingContainers.map(cid => 
        availableContainers.find(c => String(c.cid) === String(cid))?.container_number || String(cid)
      )
    )];

    const hasShippingDetails = localShippingDetails.length > 0;
    const isExpanded = expandedReceivers.has(`${rec.orderId}-${rec.id}`);

    const handleRemoveAllForReceiver = async () => {
      const totalAssigned = localShippingDetails.reduce(
        (sum, sd) => sum + (sd.containerDetails || []).reduce((s, cd) => s + Number(cd.assign_total_box ?? 0), 0), 0
      );

      if (totalAssigned === 0) return;

      if (!window.confirm(`Remove all ${totalAssigned} units?`)) return;

      const prevState = [...localShippingDetails];
      setLocalShippingDetails(prev => prev.map(sd => ({
        ...sd,
        containerDetails: [],
        remainingItems: String(Number(sd.totalNumber ?? 0)),
      })));

      try {
        const payload = { [rec.orderId]: { [rec.id]: { full: true } } };
        const res = await api.post('/api/orders/remove-assign-container', { assignments: payload });

        if (res.data.success) {
          setSnackbar({ open: true, message: 'Removed successfully', severity: 'success' });
          fetchOrders?.();
          fetchContainers?.();
        } else throw new Error('Failed');
      } catch (err) {
        setLocalShippingDetails(prevState);
        setSnackbar({ open: true, message: 'Failed to remove', severity: 'error' });
      }
    };

    const handleRemoveSingleContainer = async (detail, contDetail) => {
      const cid = contDetail?.container?.cid;
      if (!cid) return;

      if (!window.confirm(`Remove container ${contDetail.container?.container_number || cid}?`)) return;

      const prevState = [...localShippingDetails];

      setLocalShippingDetails(prev => prev.map(sd =>
        sd.id === detail.id
          ? {
              ...sd,
              containerDetails: sd.containerDetails.filter(c => c.container?.cid !== cid),
              remainingItems: String(Number(sd.totalNumber ?? 0) - 
                (sd.containerDetails || []).reduce((s, c) => s + (c.container?.cid === cid ? 0 : Number(c.assign_total_box ?? 0)), 0))
            }
          : sd
      ));

      try {
        const payload = {
          [rec.orderId]: {
            [rec.id]: {
              [detail.id]: {
                orderItemId: detail.id,
                containers: [cid],
                qty: Number(contDetail.assign_total_box ?? 0),
                totalAssignedWeight: Number(contDetail.assign_weight ?? 0),
              }
            }
          }
        };

        const res = await api.post('/api/orders/remove-assign-container', { assignments: payload });

        if (res.data.success) {
          setSnackbar({ open: true, message: 'Container removed', severity: 'success' });
          fetchOrders?.();
        } else throw new Error();
      } catch {
        setLocalShippingDetails(prevState);
        setSnackbar({ open: true, message: 'Failed to remove container', severity: 'error' });
      }
    };

    const subRows = useMemo(() => {
      if (!isExpanded || !hasShippingDetails) return null;

      return localShippingDetails.map((detail, idx) => {
        const keyDetail = getDetailKey(rec.orderId, rec.id, idx);
        const remainingUnits = Number(detail.remainingItems ?? 0);
        const totalUnits = Number(detail.totalNumber ?? 0);
        const progress = totalUnits > 0 ? ((totalUnits - remainingUnits) / totalUnits) * 100 : 0;

        const validContainers = (detail.containerDetails || []).filter(cd => {
          const b = Number(cd?.assign_total_box ?? 0);
          const w = Number(cd?.assign_weight ?? 0);
          return b >= 1 && w >= 0.01 && !!cd?.container?.cid;
        });

        return (
          <TableRow key={keyDetail} sx={{ bgcolor: theme.background }}>
            <TableCell colSpan={13}>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Detail {idx + 1} — {detail.category || '—'} • {totalUnits} pcs • {detail.weight || '?'} kg
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container flex={1} flexDirection={'row'} justifyContent={"space-around"}  spacing={3}>
                    <Grid item width={600} xs={24} md={12}>
                      <Typography variant="body2" color="primary" gutterBottom>Current Assignments</Typography>
                      <Stack spacing={1.5}>
                        {validContainers.length > 0 ? validContainers.map((cd, i) => (
                          <Card key={i} variant="outlined" sx={{ p: 1.5 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography fontWeight={600}>{cd.container?.container_number || '—'}</Typography>
                              <Stack direction="row" spacing={1}>
                                <Chip label={`${cd.assign_total_box ?? 0} pcs`} color="success" size="small" />
                                <Chip label={`${Number(cd.assign_weight ?? 0).toFixed(2)} kg`} color="primary" variant="outlined" size="small" />
                                <IconButton size="small" color="error" onClick={() => handleRemoveSingleContainer(detail, cd)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                            </Stack>
                          </Card>
                        )) : (
                          <Typography color="text.secondary">No containers assigned</Typography>
                        )}
                      </Stack>
                    </Grid>
<Grid item xs={24} md={12}>
  <Typography variant="body2" color="text.secondary" gutterBottom>
    Assign New Containers
  </Typography>
  
  <AssignmentForm
    keyDetail={keyDetail}
    detailRemaining={remainingUnits}
    detailRemainingWeight={getRemainingWeight(detail)}
    
    // Must pass these:
    assignmentQuantities={assignmentQuantities}
    setAssignmentQuantities={setAssignmentQuantities}
    assignmentWeights={assignmentWeights}
    setAssignmentWeights={setAssignmentWeights}
    selectedContainersPerDetail={selectedContainersPerDetail}
    setSelectedContainersPerDetail={setSelectedContainersPerDetail}
    // enhancedHandleAssign={enhancedHandleAssign}
    availableContainers={availableContainers}
    
    // Optional callback when user clicks "Preview Assignment"
    onAssignPreview={(previewData) => {
      console.log('User wants to preview/assign:', previewData);
      // You can show confirmation, or directly call your assign API here
    }}
  />
</Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />
                  <LinearProgress variant="determinate" value={progress} sx={{ height: 8 }} color="primary" />
                  <Typography variant="caption" align="center" display="block" mt={1}>
                    {remainingUnits} remaining / {totalUnits} total
                  </Typography>
                </AccordionDetails>
              </Accordion>
            </TableCell>
          </TableRow>
        );
      });
    }, [isExpanded, hasShippingDetails, localShippingDetails, theme.background, getDetailKey, rec.orderId, rec.id]);
console.log('full rec',fullRec,fullOrder)
    return (
      <>
        <TableRow hover>
          <TableCell>{rec.id || '—'}</TableCell>
          <TableCell>{fullRec.receiver_name || '—'}</TableCell>
          <TableCell>{fullOrder.booking_ref || '—'}</TableCell>
          <TableCell>
            <Tooltip title={address}>
              <span>{address.slice(0, 24)}{address.length > 24 ? '...' : ''}</span>
            </Tooltip>
          </TableCell>
          <TableCell>{fullRec.receiver_contact}</TableCell>
          <TableCell>{fullRec.receiver_email}</TableCell>
          <TableCell>{totalRemainingWeight.toFixed(2)} kg</TableCell>
          <TableCell>{fullRec.total_number ?? '—'}</TableCell>
          <TableCell>
            <Chip
              label={Math.max(0, (fullRec.total_number ?? 0) - totalRemainingUnits)}
              color="success"
              size="small"
            />
          </TableCell>
          <TableCell>
            <Chip
              label={totalRemainingUnits}
              color={totalRemainingUnits > 0 ? 'warning' : 'success'}
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
              label={allContainersPreview.length ? allContainersPreview.join(', ') : 'None'}
              color={allContainersPreview.length ? 'success' : 'default'}
              size="small"
              variant="outlined"
            />
          </TableCell>
          <TableCell>
            <Stack direction="row" spacing={1}>
              {hasShippingDetails && (
                <IconButton size="small" onClick={() => {
                  const key = `${rec.orderId}-${rec.id}`;
                  setExpandedReceivers(prev => {
                    const next = new Set(prev);
                    if (next.has(key)) next.delete(key); else next.add(key);
                    return next;
                  });
                }}>
                  {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              )}
              {existingContainers.length > 0 && (
                <IconButton size="small" color="error" onClick={handleRemoveAllForReceiver}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Stack>
          </TableCell>
        </TableRow>

        {subRows}
      </>
    );
  });

  // Main render
  return (
    <>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog open={openAssignModal} onClose={() => setOpenAssignModal(false)} maxWidth="xl" fullWidth>
        <DialogTitle sx={{ bgcolor: theme.primary, color: 'white', display: 'flex', justifyContent: 'space-between' }}>
          <Stack direction="row" alignItems="center" gap={1.5}>
            <LocalShippingIcon />
            <Typography variant="h5">
              Assign Containers ({selectedOrders.length} orders)
            </Typography>
          </Stack>
          <IconButton onClick={() => setOpenAssignModal(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0, height: '75vh' }}>
          <TableContainer sx={{ height: '100%', overflow: 'auto' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Receiver</TableCell>
                  <TableCell>Booking Ref</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Remaining Weight</TableCell>
                  <TableCell>Total Units</TableCell>
                  <TableCell>Assigned</TableCell>
                  <TableCell>Remaining</TableCell>
                  <TableCell>New Assignment</TableCell>
                  <TableCell>Containers</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedOrders.flatMap(id => {
                  const order = detailedOrders[id] || orders.find(o => o.id === id);
                  return (order?.receivers || []).map((r, idx) => (
                    <ReceiverRow
                      key={`${id}-${r.id || idx}`}
                      rec={{ ...r, orderId: id }}
                      globalIndex={idx}
                    />
                  ));
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenAssignModal(false)} variant="outlined">
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<AssignmentIcon />}
            onClick={enhancedHandleAssign
            }
          >
            Confirm Assignment
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AssignModal;