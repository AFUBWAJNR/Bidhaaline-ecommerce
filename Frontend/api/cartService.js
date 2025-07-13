import apiClient from './apiClient.js';
import API_CONFIG from './config.js';

class CartService {
    // Add item to cart
    async addToCart(productId, quantity = 1) {
        try {
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.CART.BASE, {
                product_id: productId,
                quantity: quantity
            });

            if (response.status === 'success') {
                return response.data.cartItem;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Failed to add item to cart');
        }
    }

    // Get cart items
    async getCart() {
        try {
            const response = await apiClient.get(API_CONFIG.ENDPOINTS.CART.BASE);

            if (response.status === 'success') {
                return response.data;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Failed to fetch cart');
        }
    }

    // Update cart item quantity
    async updateCartItem(cartItemId, quantity) {
        try {
            const endpoint = apiClient.replaceParams(API_CONFIG.ENDPOINTS.CART.ITEM, { id: cartItemId });
            const response = await apiClient.put(endpoint, { quantity });

            if (response.status === 'success') {
                return response.data.cartItem;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Failed to update cart item');
        }
    }

    // Remove item from cart
    async removeFromCart(cartItemId) {
        try {
            const endpoint = apiClient.replaceParams(API_CONFIG.ENDPOINTS.CART.ITEM, { id: cartItemId });
            const response = await apiClient.delete(endpoint);

            if (response.status === 'success') {
                return true;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Failed to remove item from cart');
        }
    }

    // Clear entire cart
    async clearCart() {
        try {
            const response = await apiClient.delete(API_CONFIG.ENDPOINTS.CART.BASE);

            if (response.status === 'success') {
                return true;
            }
            throw new Error(response.message);
        } catch (error) {
            throw new Error(error.message || 'Failed to clear cart');
        }
    }
}

export default new CartService();