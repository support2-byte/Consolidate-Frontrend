// validationSchema.js - Yup schema for OrderForm
import * as Yup from 'yup';

const validationSchema = Yup.object({
    bookingRef: Yup.string().trim().required('Booking Ref is required'),
    status: Yup.string().required('Status is required'),
    rglBookingNumber: Yup.string().trim().required('RGL Booking Number is required'),
    consignmentRemarks: Yup.string().trim(),
    placeOfLoading: Yup.string().trim().required('Place of Loading is required'),
    finalDestination: Yup.string().trim().required('Final Destination is required'),
    placeOfDelivery: Yup.string().trim(),
    orderRemarks: Yup.string().trim(),
    associatedContainer: Yup.string().trim(),
    consignmentNumber: Yup.string().trim(),
    consignmentVessel: Yup.string().trim(),
    consignmentVoyage: Yup.string().trim(),
    senderName: Yup.string().trim().required('Sender Name is required'),
    senderContact: Yup.string().trim().matches(/^\+?[\d\s-()]{10,}$/, 'Invalid contact number'),
    senderAddress: Yup.string().trim(),
    senderEmail: Yup.string().email('Invalid sender email').required('Sender Email is required'),
    receiverName: Yup.string().trim().required('Receiver Name is required'),
    receiverContact: Yup.string().trim().matches(/^\+?[\d\s-()]{10,}$/, 'Invalid contact number'),
    receiverAddress: Yup.string().trim(),
    receiverEmail: Yup.string().email('Invalid receiver email').required('Receiver Email is required'),
    eta: Yup.date().nullable().typeError('Invalid ETA date'),
    etd: Yup.date().nullable().typeError('Invalid ETD date'),
    shippingLine: Yup.string().trim(),
    driverName: Yup.string().trim(),
    driverContact: Yup.string().trim().matches(/^\+?[\d\s-()]{10,}$/, 'Invalid driver contact'),
    driverNic: Yup.string().trim().matches(/^[A-Z]{1,2}\d{7}[A-Z\d]$/, 'Invalid NIC format'), // Example for Sri Lankan NIC
    driverPickupLocation: Yup.string().trim(),
    truckNumber: Yup.string().trim().matches(/^[A-Z]{2,3}-\d{4}$/, 'Invalid truck number format'), // Example format
    thirdPartyTransport: Yup.string().trim(),
    attachments: Yup.mixed().optional(),
});

export default validationSchema;