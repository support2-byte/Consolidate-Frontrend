// src/pages/admin/NotificationManage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  FormControl,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  InputLabel,
  FormHelperText,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Grid,
  Chip,
  OutlinedInput,
} from '@mui/material';
import Editor from '@monaco-editor/react'; // For HTML editing
import { api } from '../../api'; // your axios instance
const placeholdersHelp = [
  '{customer_name}', '{order_number}', '{consignment_id}', '{status}', '{tracking_link}',
  '{eta}', '{sender_city}', '{receiver_city}', '{site_name}', '{site_url}'
];

// List of possible statuses – can be fetched from backend later
const possibleStatuses = [
  { code: 'processing', label: 'Processing Order' },
  { code: 'in-transit', label: 'In Transit' },
  { code: 'customs-hold', label: 'Customs Hold' },
  { code: 'customs-cleared', label: 'Customs Cleared' },
  { code: 'out-for-delivery', label: 'Out for Delivery' },
  { code: 'delivered', label: 'Delivered' },
  { code: 'failed-attempt', label: 'Failed Delivery Attempt' },
  { code: 'returned', label: 'Returned to Sender' },
  { code: 'cancelled', label: 'Cancelled' },
];

function replacePlaceholders(html, data) {
  let result = html;
  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, value || '');
  });
  return result;
}

const NotificationManage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tabValue, setTabValue] = useState(0); // 0 = Edit, 1 = Preview

  const [form, setForm] = useState({
    enabled: true,
    name: '',
    subject: '',
    heading: '',
    template_html: "",
    additional_content: '',
    email_type: 'html',
    recipients: '',
    trigger_statuses: [], // selected status codes
  });

  const [error, setError] = useState(null);
  const [isStatusType, setIsStatusType] = useState(false);

  // Preview data (dummy values)
  const previewData = {
    customer_name: 'Ahmed Khan',
    order_number: 'ORD-987654',
    consignment_id: 'CON-456789',
    status: 'In Transit',
    tracking_link: 'https://track.royalgulfshipping.com/abc123',
    eta: 'March 20, 2026',
    sender_city: 'Karachi',
    receiver_city: 'Dubai',
    site_name: 'Royal Gulf Shipping',
    site_url: 'https://royalgulfshipping.com',
    additional_content: form.additional_content,
  };

useEffect(() => {
  const fetchNotif = async () => {
    try {
      const res = await api.get(`/auth/admin/notifications/${id}`);
      console.log('[FETCH] Full response:', res.data);

      if (res.data.success) {
        const settings = res.data.notification || {};
        setForm({
          enabled: settings.enabled ?? true,
          name: settings.name || 'Notification',
          subject: settings.subject || '',
          heading: settings.heading || '',
          template_html: settings.template_html || form.template_html, // ← now loads from DB
          additional_content: settings.additional_content || '',
          email_type: settings.email_type || 'html',
          recipients: settings.recipients || '',
          trigger_statuses: settings.trigger_statuses
            ? settings.trigger_statuses.split(',').map(s => s.trim())
            : [],
        });

        setIsStatusType(
          settings.type_code?.toLowerCase().includes('status-update') ||
          settings.type_code?.toLowerCase().includes('status_updated')
        );
      }
    } catch (err) {
      console.error('[FETCH] Error:', err);
      setError('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };
  fetchNotif();
}, [id]);
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleStatusChange = (event) => {
    const { value } = event.target;
    setForm(prev => ({ ...prev, trigger_statuses: value }));
  };

  const handleEditorChange = (value) => {
    setForm(prev => ({ ...prev, template_html: value }));
  };

const handleSave = async () => {
  setSaving(true);
  setError(null);

  try {
    const payload = {
      ...form,
      trigger_statuses: form.trigger_statuses.join(','),
      template_html: form.template_html,  // ← this is what you edited
    };

    // FIXED: Use PATCH, not GET
    const res = await api.patch(`/auth/admin/notifications/${id}`, payload);

    console.log('Save response:', res.data);

    if (res.data.success) {
      alert('Template and settings saved successfully!');
      // Re-fetch to confirm update
      const refreshRes = await api.get(`/auth/admin/notifications/${id}`);
      if (refreshRes.data.success) {
        const updated = refreshRes.data.notification || {};
        setForm(prev => ({ ...prev, template_html: updated.template_html || prev.template_html }));
      }
      console.log('Refreshed data after save:', refreshRes.data); 
      // navigate('/admin/notifications');
    } else {
      setError(res.data.error || 'Save failed');
    }
  } catch (err) {
    console.error('Save error:', err);
    setError(err.response?.data?.error || 'Failed to save');
  } finally {
    setSaving(false);
  }
};
  // Generate live preview
  const previewHtml = replacePlaceholders(form.template_html, {
    ...previewData,
    subject: form.subject,
    heading: form.heading,
    additional_content: form.additional_content,

  });

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 10 }} />;

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', py: 4, px: { xs: 2, md: 4 } }}>
      <Button onClick={() => navigate(-1)} sx={{ mb: 3 }}>← Back to Notifications</Button>

      <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 3, boxShadow: 3 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Manage Notification: {form.name || 'Untitled'}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <FormControlLabel
          control={<Switch checked={form.enabled} onChange={handleChange} name="enabled" />}
          label="Enable this notification"
        />

        <Grid container spacing={4} sx={{ mt: 2 }}>
          {/* LEFT: Form Controls */}
          <Grid item xs={12} lg={6}>
            <Divider sx={{ my: 3 }} />

            <TextField
              fullWidth
              label="Internal Name (for admin only)"
              name="name"
              value={form.name}
              onChange={handleChange}
              margin="normal"
              helperText="Used to identify this notification in the list"
            />

            <TextField
              fullWidth
              label="Email Subject Line"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              margin="normal"
              helperText="Appears in inbox. Use placeholders: {order_number}, {status}, etc."
            />

            <TextField
              fullWidth
              label="Email Heading (big title)"
              name="heading"
              value={form.heading}
              onChange={handleChange}
              margin="normal"
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Email Format</InputLabel>
              <Select name="email_type" value={form.email_type} label="Email Format" onChange={handleChange}>
                <MenuItem value="html">HTML (Recommended)</MenuItem>
                <MenuItem value="plain">Plain Text</MenuItem>
              </Select>
            </FormControl>

            {form.recipients !== undefined && (
              <TextField
                fullWidth
                label="Custom Recipients (comma-separated)"
                name="recipients"
                value={form.recipients}
                onChange={handleChange}
                margin="normal"
                helperText="For admin/internal notifications only"
              />
            )}

            {/* STATUS SELECTOR - only for status-update notifications */}
            {/* {isStatusType && ( */}
              <FormControl fullWidth sx={{ mt: 4 }}>
                <InputLabel id="status-select-label">Send Email Only When Status Is</InputLabel>
                <Select
                  labelId="status-select-label"
                  multiple
                  value={form.trigger_statuses}
                  onChange={handleStatusChange}
                  input={<OutlinedInput label="Send Email Only When Status Is" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const status = possibleStatuses.find(s => s.code === value);
                        return <Chip key={value} label={status?.label || value} size="small" />;
                      })}
                    </Box>
                  )}
                >
                  {possibleStatuses.map((status) => (
                    <MenuItem key={status.code} value={status.code}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Select one or more statuses that should trigger this email. Leave empty to send on ANY status change.
                </FormHelperText>
              </FormControl>
            {/* )} */}

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Additional Message (Plain Text Fallback)"
              name="additional_content"
              value={form.additional_content}
              onChange={handleChange}
              margin="normal"
              helperText="Shown below the main content in plain-text clients"
            />
          </Grid>

          {/* RIGHT: Editor + Preview */}
          <Grid item xs={12} lg={6}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
                <Tab label="Edit HTML Template" />
                <Tab label="Live Preview" />
              </Tabs>
            </Box>

            {tabValue === 0 ? (
              <Box sx={{ height: '600px', border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden' }}>
                <Editor
                  height="100%"
                  defaultLanguage="html"
                  value={form.template_html}
                  onChange={handleEditorChange}
                  theme="vs-dark" // or "light"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                  }}
                />
              </Box>
            ) : (
              <Box
                sx={{
                  height: '600px',
                  border: '1px solid #ccc',
                  borderRadius: 1,
                  overflow: 'hidden',
                  bgcolor: '#fff',
                }}
              >
                <iframe
  srcDoc={previewHtml}
  title="Email Preview"
  style={{ width: '100%', height: '100%', border: 'none' }}
  sandbox="allow-same-origin allow-scripts allow-popups allow-forms" // safe set for email-like preview
/>
              </Box>
            )}

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Available Placeholders (use in subject or template):
              </Typography>
              <Grid container spacing={1}>
                {placeholdersHelp.map((p) => (
                  <Grid item key={p}>
                    <Chip label={p} size="small" variant="outlined" />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box sx={{ mt: 5, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : null}
          >
            Save Notification
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default NotificationManage;