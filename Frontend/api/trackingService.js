import apiClient from './apiClient.js';
import API_CONFIG from './config.js';

class TrackingService {
    // Get order tracking (public - no auth required)
    async getOrderTracking(orderId) {
        try {
            const endpoint = apiClient.replaceParams(API_CONFIG.ENDPOINTS.TRACKING.PUBLIC, { orderId });
            const response = await apiClient.get(endpoint);

            if (response.status === 'success') {
                return response.data;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Failed to fetch order tracking');
        }
    }

    // Get user order tracking (authenticated)
    async getUserOrderTracking(orderId) {
        try {
            const endpoint = apiClient.replaceParams(API_CONFIG.ENDPOINTS.TRACKING.USER, { orderId });
            const response = await apiClient.get(endpoint);

            if (response.status === 'success') {
                return response.data;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Failed to fetch order tracking');
        }
    }

    // Admin: Add tracking update
    async addTrackingUpdate(orderId, status, description) {
        try {
            const endpoint = apiClient.replaceParams(API_CONFIG.ENDPOINTS.TRACKING.PUBLIC, { orderId });
            const response = await apiClient.post(endpoint, { status, description });

            if (response.status === 'success') {
                return response.data.tracking;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Failed to add tracking update');
        }
    }
}

export default new TrackingService();