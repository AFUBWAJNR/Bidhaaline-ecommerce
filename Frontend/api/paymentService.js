import apiClient from './apiClient.js';
import API_CONFIG from './config.js';

class PaymentService {
    // Initiate M-Pesa payment
    async initiateMpesaPayment(orderId, phoneNumber, amount) {
        try {
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.PAYMENTS.MPESA_INITIATE, {
                orderId,
                phoneNumber,
                amount
            });

            if (response.status === 'success') {
                return response.data;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Failed to initiate M-Pesa payment');
        }
    }

    // Check M-Pesa payment status
    async checkPaymentStatus(checkoutRequestId) {
        try {
            const endpoint = apiClient.replaceParams(
                API_CONFIG.ENDPOINTS.PAYMENTS.MPESA_STATUS, 
                { checkoutRequestId }
            );
            const response = await apiClient.get(endpoint);

            if (response.status === 'success') {
                return response.data;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Failed to check payment status');
        }
    }

    // Get transaction history
    async getTransactionHistory(page = 1, limit = 10) {
        try {
            const endpoint = `${API_CONFIG.ENDPOINTS.PAYMENTS.TRANSACTIONS}?page=${page}&limit=${limit}`;
            const response = await apiClient.get(endpoint);

            if (response.status === 'success') {
                return response.data.transactions;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Failed to fetch transaction history');
        }
    }

    // Get transaction by order ID
    async getTransactionByOrderId(orderId) {
        try {
            const endpoint = apiClient.replaceParams(
                API_CONFIG.ENDPOINTS.PAYMENTS.TRANSACTION_BY_ORDER, 
                { orderId }
            );
            const response = await apiClient.get(endpoint);

            if (response.status === 'success') {
                return response.data.transaction;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Failed to fetch transaction');
        }
    }

    // Poll payment status (for real-time updates)
    async pollPaymentStatus(checkoutRequestId, maxAttempts = 30, interval = 2000) {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            
            const poll = async () => {
                try {
                    attempts++;
                    const result = await this.checkPaymentStatus(checkoutRequestId);
                    
                    // Check if payment is complete (success or failed)
                    if (result.localTransaction && 
                        (result.localTransaction.status === 'success' || 
                         result.localTransaction.status === 'failed')) {
                        resolve(result);
                        return;
                    }
                    
                    // Continue polling if not complete and under max attempts
                    if (attempts < maxAttempts) {
                        setTimeout(poll, interval);
                    } else {
                        reject(new Error('Payment status check timeout'));
                    }
                } catch (error) {
                    if (attempts < maxAttempts) {
                        setTimeout(poll, interval);
                    } else {
                        reject(error);
                    }
                }
            };
            
            poll();
        });
    }
}

export default new PaymentService();