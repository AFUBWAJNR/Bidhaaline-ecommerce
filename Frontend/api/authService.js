import apiClient from './apiClient.js';
import API_CONFIG from './config.js';

class AuthService {
    // Login user
    async login(email, password) {
        try {
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
                email,
                password
            });

            if (response.status === 'success') {
                // Store token and user data
                apiClient.setToken(response.data.token);
                localStorage.setItem('currentUser', JSON.stringify(response.data.user));
                return response.data;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Login failed');
        }
    }

    // Register user
    async register(userData) {
        try {
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, userData);

            if (response.status === 'success') {
                // Store token and user data
                apiClient.setToken(response.data.token);
                localStorage.setItem('currentUser', JSON.stringify(response.data.user));
                return response.data;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Registration failed');
        }
    }

    // Get user profile
    async getProfile() {
        try {
            const response = await apiClient.get(API_CONFIG.ENDPOINTS.AUTH.PROFILE);
            if (response.status === 'success') {
                localStorage.setItem('currentUser', JSON.stringify(response.data.user));
                return response.data.user;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Failed to get profile');
        }
    }

    // Update user profile
    async updateProfile(profileData) {
        try {
            const response = await apiClient.put(API_CONFIG.ENDPOINTS.AUTH.PROFILE, profileData);
            if (response.status === 'success') {
                localStorage.setItem('currentUser', JSON.stringify(response.data.user));
                return response.data.user;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Failed to update profile');
        }
    }

    // Logout user
    logout() {
        apiClient.setToken(null);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
    }

    // Get current user from localStorage
    getCurrentUser() {
        const userStr = localStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!localStorage.getItem('authToken');
    }

    // Check if user is admin
    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === 'admin';
    }
}

export default new AuthService();