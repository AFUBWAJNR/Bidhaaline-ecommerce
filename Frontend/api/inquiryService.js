import apiClient from './apiClient.js';
import API_CONFIG from './config.js';

class InquiryService {
    // Submit inquiry (public)
    async submitInquiry(inquiryData) {
        try {
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.INQUIRIES.BASE, inquiryData);

            if (response.status === 'success') {
                return response.data.inquiry;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Failed to submit inquiry');
        }
    }

    // Admin: Get all inquiries
    async getAllInquiries(filters = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            if (filters.status) queryParams.append('status', filters.status);
            if (filters.page) queryParams.append('page', filters.page);
            if (filters.limit) queryParams.append('limit', filters.limit);

            const endpoint = `${API_CONFIG.ENDPOINTS.INQUIRIES.BASE}?${queryParams.toString()}`;
            const response = await apiClient.get(endpoint);

            if (response.status === 'success') {
                return response.data.inquiries;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Failed to fetch inquiries');
        }
    }

    // Admin: Get inquiry by ID
    async getInquiryById(inquiryId) {
        try {
            const endpoint = `${API_CONFIG.ENDPOINTS.INQUIRIES.BASE}/${inquiryId}`;
            const response = await apiClient.get(endpoint);

            if (response.status === 'success') {
                return response.data.inquiry;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Failed to fetch inquiry');
        }
    }

    // Admin: Update inquiry status
    async updateInquiryStatus(inquiryId, status, adminResponse = '') {
        try {
            const endpoint = `${API_CONFIG.ENDPOINTS.INQUIRIES.BASE}/${inquiryId}`;
            const response = await apiClient.patch(endpoint, { status, admin_response: adminResponse });

            if (response.status === 'success') {
                return response.data.inquiry;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Failed to update inquiry');
        }
    }
}

export default new InquiryService();