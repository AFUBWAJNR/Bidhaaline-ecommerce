import apiClient from './apiClient.js';
import API_CONFIG from './config.js';

class AdminService {
    // Get dashboard statistics
    async getDashboardStats() {
        try {
            const response = await apiClient.get(API_CONFIG.ENDPOINTS.ADMIN.DASHBOARD);

            if (response.status === 'success') {
                return response.data;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Failed to fetch dashboard stats');
        }
    }

    // Get all customers
    async getAllCustomers() {
        try {
            const response = await apiClient.get(API_CONFIG.ENDPOINTS.ADMIN.CUSTOMERS);

            if (response.status === 'success') {
                return response.data.customers;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Failed to fetch customers');
        }
    }

    // Get all transactions (admin)
    async getAllTransactions(filters = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            if (filters.status) queryParams.append('status', filters.status);
            if (filters.page) queryParams.append('page', filters.page);
            if (filters.limit) queryParams.append('limit', filters.limit);

            const endpoint = `/payments/admin/transactions?${queryParams.toString()}`;
            const response = await apiClient.get(endpoint);

            if (response.status === 'success') {
                return response.data.transactions;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Failed to fetch transactions');
        }
    }
}

export default new AdminService();