// Utility function to get status color (add this to a utils file or directly in the component file)
export const getOrderStatusColor = (status) => {
    switch (status) {
        case 'Created':
            return { color: 'default', bgColor: '#e3f2fd' };
        case 'In Transit':
            return { color: 'warning', bgColor: '#fff3e0' };
        case 'Delivered':
            return { color: 'success', bgColor: '#e8f5e8' };
        case 'Cancelled':
            return { color: 'error', bgColor: '#ffebee' };
        default:
            return { color: 'default', bgColor: '#f5f5f5' };
    }
};