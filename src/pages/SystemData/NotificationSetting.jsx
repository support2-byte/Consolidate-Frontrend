import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  InputLabel,
  FormHelperText,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { useNavigate } from 'react-router-dom';
import {api} from '../../api'; // your axios instance

const MODULES = [
  { index: 0, code: 'orders', label: 'Orders' },
  { index: 1, code: 'consignments', label: 'Consignments' },
];

const NotificationSettings = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [allNotifications, setAllNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Modal state for adding new notification
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newNotif, setNewNotif] = useState({
    module_code: 'orders',
    type_code: '',
    name: '',
    description: '',
    default_recipients: 'customer',
    enabled: true,
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[NOTIF] Fetching from: auth/admin/notifications');
      const res = await api.get('auth/admin/notifications');
      console.log('[NOTIF] Status:', res.status);
      const payload = res.data;

      if (!payload?.success) {
        throw new Error(payload?.error || 'API error');
      }

      const items = payload.notifications || [];
      console.log('[NOTIF] Loaded count:', items.length);
      setAllNotifications(items);
    } catch (err) {
      console.error('[NOTIF] Fetch failed:', err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const currentModuleCode = MODULES[activeTab]?.code || 'orders';
  const currentList = allNotifications.filter(
    n => n.module_code?.toLowerCase() === currentModuleCode.toLowerCase()
  );

  const handleToggle = (notifId, newEnabled) => {
    // Optimistic update
    setAllNotifications(prev =>
      prev.map(n =>
        n.id === notifId ? { ...n, enabled: newEnabled } : n
      )
    );

    // TODO: Real PATCH
    // api.patch(`/admin/notifications/${notifId}`, { enabled: newEnabled });
  };

  // Add new notification
  const handleAddNew = async () => {
    setAddLoading(true);
    setAddError(null);

    try {
      if (!newNotif.type_code.trim() || !newNotif.name.trim()) {
        throw new Error('Type Code and Name are required');
      }

      const res = await api.post('auth/admin/notifications', newNotif);

      if (res.data.success) {
        alert('New notification created!');
        setAddModalOpen(false);
        setNewNotif({
          module_code: 'orders',
          type_code: '',
          name: '',
          description: '',
          default_recipients: 'customer',
          enabled: true,
        });
        fetchNotifications(); // refresh list
      } else {
        setAddError(res.data.error || 'Failed to create');
      }
    } catch (err) {
      setAddError(err.message || 'Error creating notification');
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', py: 4, px: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Email Notifications
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setAddModalOpen(true)}
        >
          Add New Notification
        </Button>
      </Box>

      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Enable/disable notifications and click Manage to customize subject, template, recipients.
      </Typography>

      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        {MODULES.map(m => (
          <Tab key={m.index} label={m.label} />
        ))}
      </Tabs>

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : currentList.length === 0 ? (
        <Alert severity="info">
          No notification types found for {MODULES[activeTab]?.label}.
        </Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell padding="checkbox" width={60} />
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Description</strong></TableCell>
                <TableCell align="center"><strong>Recipients</strong></TableCell>
                <TableCell align="right" width={140} />
              </TableRow>
            </TableHead>
            <TableBody>
              {currentList.map(notif => (
                <TableRow key={notif.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={notif.enabled}
                      onChange={e => handleToggle(notif.id, e.target.checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium">
                      {notif.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {notif.description}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {notif.default_recipients.split(',').map(r => (
                      <Chip
                        key={r.trim()}
                        label={r.trim()}
                        size="small"
                        color={r.includes('admin') ? 'default' : 'primary'}
                        variant="outlined"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<SettingsOutlinedIcon />}
                      onClick={() => navigate(`/notifications/${notif.id}`)}
                    >
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add New Notification Modal */}
      <Dialog open={addModalOpen} onClose={() => setAddModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Notification Type</DialogTitle>
        <DialogContent>
          {addError && <Alert severity="error" sx={{ mb: 2 }}>{addError}</Alert>}

          <FormControl fullWidth margin="normal">
            <InputLabel>Module</InputLabel>
            <Select
              value={newNotif.module_code}
              label="Module"
              onChange={e => setNewNotif({ ...newNotif, module_code: e.target.value })}
            >
              <MenuItem value="orders">Orders</MenuItem>
              <MenuItem value="consignments">Consignments</MenuItem>
              {/* Add more modules later */}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Type Code (unique identifier)"
            value={newNotif.type_code}
            onChange={e => setNewNotif({ ...newNotif, type_code: e.target.value.trim() })}
            margin="normal"
            helperText="e.g. custom-delivery-update (lowercase, hyphens allowed)"
          />

          <TextField
            fullWidth
            label="Display Name"
            value={newNotif.name}
            onChange={e => setNewNotif({ ...newNotif, name: e.target.value })}
            margin="normal"
            helperText="e.g. Custom Delivery Update"
          />

          <TextField
            fullWidth
            label="Description"
            value={newNotif.description}
            onChange={e => setNewNotif({ ...newNotif, description: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />

          <TextField
            fullWidth
            label="Default Recipients (comma-separated)"
            value={newNotif.default_recipients}
            onChange={e => setNewNotif({ ...newNotif, default_recipients: e.target.value })}
            margin="normal"
            helperText="e.g. customer,admin"
          />

          <FormControlLabel
            control={
              <Switch
                checked={newNotif.enabled}
                onChange={e => setNewNotif({ ...newNotif, enabled: e.target.checked })}
              />
            }
            label="Enabled by default"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddNew}
            disabled={addLoading || !newNotif.type_code.trim() || !newNotif.name.trim()}
            startIcon={addLoading ? <CircularProgress size={20} /> : null}
          >
            Create Notification
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificationSettings;