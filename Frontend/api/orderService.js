import apiClient from './apiClient.js';
import API_CONFIG from './config.js';

class OrderService {
    // Create new order
    async createOrder(orderData) {
        try {
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.ORDERS.BASE, orderData);

            if (response.status === 'success') {
                return response.data.order;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Failed to create order');
        }
    }

    // Get user orders
    async getUserOrders(page = 1, limit = 10) {
        try {
            const endpoint = `${API_CONFIG.ENDPOINTS.ORDERS.BASE}?page=${page}&limit=${limit}`;
            const response = await apiClient.get(endpoint);

            if (response.status === 'success') {
                return response.data.orders;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Failed to fetch orders');
        }
    }

    // Get order by ID
    async getOrderById(orderId) {
        try {
            const endpoint = apiClient.replaceParams(API_CONFIG.ENDPOINTS.ORDERS.BY_ID, { id: orderId });
            const response = await apiClient.get(endpoint);

            if (response.status === 'success') {
                return response.data.order;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Failed to fetch order');
        }
    }

    // Cancel order
    async cancelOrder(orderId) {
        try {
            const endpoint = apiClient.replaceParams(API_CONFIG.ENDPOINTS.ORDERS.CANCEL, { id: orderId });
            const response = await apiClient.patch(endpoint);

            if (response.status === 'success') {
                return true;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Failed to cancel order');
        }
    }

    // Admin: Get all orders
    async getAllOrders(filters = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            if (filters.status) queryParams.append('status', filters.status);
            if (filters.search) queryParams.append('search', filters.search);
            if (filters.page) queryParams.append('page', filters.page);
            if (filters.limit) queryParams.append('limit', filters.limit);

            const endpoint = `${API_CONFIG.ENDPOINTS.ADMIN.ORDERS}?${queryParams.toString()}`;
            const response = await apiClient.get(endpoint);

            if (response.status === 'success') {
                return response.data.orders;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Failed to fetch orders');
        }
    }

    // Admin: Update order status
    async updateOrderStatus(orderId, status) {
        try {
            const endpoint = apiClient.replaceParams(API_CONFIG.ENDPOINTS.ADMIN.ORDER_STATUS, { id: orderId });
            const response = await apiClient.patch(endpoint, { status });

            if (response.status === 'success') {
                return response.data.order;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Failed to update order status');
        }
    }
}

export default new OrderService();