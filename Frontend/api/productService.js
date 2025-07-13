import apiClient from './apiClient.js';
import API_CONFIG from './config.js';

class ProductService {
    // Get all products with filters
    async getAllProducts(filters = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            if (filters.category) queryParams.append('category', filters.category);
            if (filters.search) queryParams.append('search', filters.search);
            if (filters.page) queryParams.append('page', filters.page);
            if (filters.limit) queryParams.append('limit', filters.limit);

            const endpoint = `${API_CONFIG.ENDPOINTS.PRODUCTS.ALL}?${queryParams.toString()}`;
            const response = await apiClient.get(endpoint);

            if (response.status === 'success') {
                return response.data;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Failed to fetch products');
        }
    }

    // Get product by ID
    async getProductById(productId) {
        try {
            const endpoint = apiClient.replaceParams(API_CONFIG.ENDPOINTS.PRODUCTS.BY_ID, { id: productId });
            const response = await apiClient.get(endpoint);

            if (response.status === 'success') {
                return response.data.product;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Failed to fetch product');
        }
    }

    // Get featured products
    async getFeaturedProducts() {
        try {
            const response = await apiClient.get(API_CONFIG.ENDPOINTS.PRODUCTS.FEATURED);

            if (response.status === 'success') {
                return response.data.products;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Failed to fetch featured products');
        }
    }

    // Get product categories
    async getCategories() {
        try {
            const response = await apiClient.get(API_CONFIG.ENDPOINTS.PRODUCTS.CATEGORIES);

            if (response.status === 'success') {
                return response.data.categories;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Failed to fetch categories');
        }
    }

    // Admin: Create product
    async createProduct(productData) {
        try {
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.ADMIN.PRODUCTS, productData);

            if (response.status === 'success') {
                return response.data.product;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Failed to create product');
        }
    }

    // Admin: Update product
    async updateProduct(productId, productData) {
        try {
            const endpoint = apiClient.replaceParams(API_CONFIG.ENDPOINTS.ADMIN.PRODUCT_BY_ID, { id: productId });
            const response = await apiClient.put(endpoint, productData);

            if (response.status === 'success') {
                return response.data.product;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Failed to update product');
        }
    }

    // Admin: Delete product
    async deleteProduct(productId) {
        try {
            const endpoint = apiClient.replaceParams(API_CONFIG.ENDPOINTS.ADMIN.PRODUCT_BY_ID, { id: productId });
            const response = await apiClient.delete(endpoint);

            if (response.status === 'success') {
                return true;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Failed to delete product');
        }
    }
}

export default new ProductService();