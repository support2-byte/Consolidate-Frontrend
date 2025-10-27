import React, { useState } from 'react';
import {
  Box, Typography, Paper, Button, TextField, Card, CardContent
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import IconButton from '@mui/material/IconButton';

const BarcodePrintTest = () => {
  const [barcodeValue, setBarcodeValue] = useState('');
  const [generatedBarcode, setGeneratedBarcode] = useState('');

  const handleGenerate = () => {
    // Mock barcode generation (integrate with a lib like 'jsbarcode' in real app)
    setGeneratedBarcode(barcodeValue || 'TEST-BARCODE-123');
  };

  const handlePrint = () => {
    // Mock print logic (use window.print() or a print lib)
    console.log('Printing barcode:', generatedBarcode);
    window.print();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h3" gutterBottom>Barcode Print Test</Typography>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Enter Barcode Value"
            value={barcodeValue}
            onChange={(e) => setBarcodeValue(e.target.value)}
            fullWidth
          />
          <Button variant="contained" startIcon={<QrCodeScannerIcon />} onClick={handleGenerate}>
            Generate Barcode
          </Button>
          {generatedBarcode && (
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h5">Generated Barcode</Typography>
                <Box sx={{ my: 2, p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
                  <Typography variant="body1">{generatedBarcode}</Typography>
                  {/* In real app, render SVG barcode here */}
                </Box>
                <Button variant="outlined" onClick={handlePrint}>Print</Button>
              </CardContent>
            </Card>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default BarcodePrintTest;