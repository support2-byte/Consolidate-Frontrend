import { useState, useEffect } from 'react';
import { Autocomplete, TextField } from '@mui/material'; // Assuming MUI is used

// Inside your AccordionDetails component (replace the existing Stack with this)
<Stack spacing={2}>
  {(() => {
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch customers on mount or search change
    useEffect(() => {
      const fetchCustomers = async () => {
        setLoading(true);
        try {
          const params = new URLSearchParams({ search: searchTerm, limit: 5000 });
          const response = await fetch(`/api/customers?${params}`); // Adjust endpoint as needed
          const data = await response.json();
          setOptions(data);
        } catch (err) {
          console.error('Error fetching customers:', err);
        } finally {
          setLoading(false);
        }
      };

      if (searchTerm.length >= 2 || options.length === 0) { // Debounce: search after 2 chars or initial load
        fetchCustomers();
      }
    }, [searchTerm]);

    const typePrefix = formData.senderType === 'receiver' ? 'Receiver' : 'Sender';
    const fieldPrefix = formData.senderType === 'sender' ? 'sender' : 'receiver';

    const handleSelect = (event, value) => {
      if (value) {
        setFormData(prev => ({
          ...prev,
          [`${fieldPrefix}Name`]: value.contact_name || '',
          [`${fieldPrefix}Contact`]: value.primary_phone || value.contact || '', // Assume primary_phone or fallback
          [`${fieldPrefix}Address`]: value.address || value.billing_address || '',
          [`${fieldPrefix}Email`]: value.email || '',
          [`${fieldPrefix}Ref`]: value.zoho_id || '', // Or custom ref field
          [`${fieldPrefix}Remarks`]: value.zoho_notes || value.system_notes || '',
          selectedSenderOwner: value.zoho_id || value.id, // Use unique ID
        }));
      } else {
        // Clear on deselect
        setFormData(prev => ({
          ...prev,
          [`${fieldPrefix}Name`]: '',
          [`${fieldPrefix}Contact`]: '',
          [`${fieldPrefix}Address`]: '',
          [`${fieldPrefix}Email`]: '',
          [`${fieldPrefix}Ref`]: '',
          [`${fieldPrefix}Remarks`]: '',
          selectedSenderOwner: '',
        }));
      }
    };

    return (
      <>
        <FormControl component="fieldset" error={!!errors.senderType}>
          <Typography variant="subtitle1" fontWeight="bold" color="#f58220" gutterBottom>
            Select Type
          </Typography>
          <RadioGroup
            name="senderType"
            value={formData.senderType}
            onChange={handleChange}
            sx={{ flexDirection: 'row', gap: 3, mb: 1 }}
            defaultValue="sender"
          >
            <FormControlLabel value="sender" control={<Radio />} label="Sender Details" />
            <FormControlLabel value="receiver" control={<Radio />} label="Receiver Details" />
          </RadioGroup>
          {errors.senderType && <Typography variant="caption" color="error">{errors.senderType}</Typography>}
        </FormControl>

        <Autocomplete
          options={options}
          loading={loading}
          getOptionLabel={(option) => option.contact_name || ''}
          isOptionEqualToValue={(option, value) => option.zoho_id === value.zoho_id || option.id === value.id}
          onChange={handleSelect}
          onInputChange={(_, newInputValue) => setSearchTerm(newInputValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label={`Search & Select ${typePrefix}`}
              error={!!errors.selectedSenderOwner}
              helperText={errors.selectedSenderOwner || (loading ? 'Loading...' : '')}
              required
              fullWidth
            />
          )}
          renderOption={(props, option) => (
            <li {...props} key={option.zoho_id || option.id}>
              <div>
                <strong>{option.contact_name}</strong>
                {option.email && <div style={{ fontSize: '0.875em', color: '#666' }}>{option.email}</div>}
                {option.primary_phone && <div style={{ fontSize: '0.875em', color: '#666' }}>{option.primary_phone}</div>}
              </div>
            </li>
          )}
          noOptionsText={searchTerm ? `No ${typePrefix.toLowerCase()}s found for "${searchTerm}"` : `Type to search ${typePrefix.toLowerCase()}s`}
          freeSolo={false} // Prevent free text entry
          clearOnBlur={false}
          selectOnFocus={true}
          fullWidth
        />

        <Stack spacing={2}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
            <CustomTextField
              label={`${typePrefix} Name`}
              name={`${fieldPrefix}Name`}
              value={formData[`${fieldPrefix}Name`] || ""}
              onChange={handleChange}
              error={!!errors[`${fieldPrefix}Name`]}
              helperText={errors[`${fieldPrefix}Name`]}
              required
            />
            <CustomTextField
              label={`${typePrefix} Contact`}
              name={`${fieldPrefix}Contact`}
              value={formData[`${fieldPrefix}Contact`] || ""}
              onChange={handleChange}
              error={!!errors[`${fieldPrefix}Contact`]}
              helperText={errors[`${fieldPrefix}Contact`]}
              required
            />
          </Box>
          <CustomTextField
            label={`${typePrefix} Address`}
            name={`${fieldPrefix}Address`}
            value={formData[`${fieldPrefix}Address`] || ""}
            onChange={handleChange}
            error={!!errors[`${fieldPrefix}Address`]}
            helperText={errors[`${fieldPrefix}Address`]}
            multiline
            rows={2}
            required
          />
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
            <CustomTextField
              label={`${typePrefix} Email`}
              name={`${fieldPrefix}Email`}
              value={formData[`${fieldPrefix}Email`] || ""}
              onChange={handleChange}
              error={!!errors[`${fieldPrefix}Email`]}
              helperText={errors[`${fieldPrefix}Email`]}
            />
            <CustomTextField
              label={`${typePrefix} Ref`}
              name={`${fieldPrefix}Ref`}
              value={formData[`${fieldPrefix}Ref`] || ""}
              onChange={handleChange}
              error={!!errors[`${fieldPrefix}Ref`]}
              helperText={errors[`${fieldPrefix}Ref`]}
            />
          </Box>
          <CustomTextField
            label={`${typePrefix} Remarks`}
            name={`${fieldPrefix}Remarks`}
            value={formData[`${fieldPrefix}Remarks`] || ""}
            onChange={handleChange}
            error={!!errors[`${fieldPrefix}Remarks`]}
            helperText={errors[`${fieldPrefix}Remarks`]}
            multiline
            rows={2}
          />
        </Stack>
      </>
    );
  })()}
</Stack>