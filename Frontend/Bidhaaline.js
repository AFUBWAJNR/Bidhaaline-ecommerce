// Global State Management
let currentUser = null;
let currentPage = 'home';
let currentLoginType = null;
let cart = [];
let products = [];
let orders = [];
let customers = [];
let isLoggedIn = false;
let userRole = 'customer';
let selectedPaymentMethod = 'mpesa';
let currentOrderId = null;

// Local Products Data (for offline mode)
const localProducts = [
    {
        id: 'PRD001',
        name: 'Premium Coffee Beans',
        price: 1500,
        stock: 50,
        category: 'Beverages',
        image: 'https://images.pexels.com/photos/894695/pexels-photo-894695.jpeg?auto=compress&cs=tinysrgb&w=300',
        image_url: 'https://images.pexels.com/photos/894695/pexels-photo-894695.jpeg?auto=compress&cs=tinysrgb&w=300'
    },
    {
        id: 'PRD002',
        name: 'Organic Honey',
        price: 800,
        stock: 30,
        category: 'Food',
        image: 'https://images.pexels.com/photos/33783/honey-jar-honey-organic.jpg?auto=compress&cs=tinysrgb&w=300',
        image_url: 'https://images.pexels.com/photos/33783/honey-jar-honey-organic.jpg?auto=compress&cs=tinysrgb&w=300'
    },
    {
        id: 'PRD003',
        name: 'Handmade Soap',
        price: 350,
        stock: 75,
        category: 'Health & Beauty',
        image: 'https://images.pexels.com/photos/6621409/pexels-photo-6621409.jpeg?auto=compress&cs=tinysrgb&w=300',
        image_url: 'https://images.pexels.com/photos/6621409/pexels-photo-6621409.jpeg?auto=compress&cs=tinysrgb&w=300'
    },
    {
        id: 'PRD004',
        name: 'Fresh Vegetables Bundle',
        price: 600,
        stock: 25,
        category: 'Food',
        image: 'https://images.pexels.com/photos/1300972/pexels-photo-1300972.jpeg?auto=compress&cs=tinysrgb&w=300',
        image_url: 'https://images.pexels.com/photos/1300972/pexels-photo-1300972.jpeg?auto=compress&cs=tinysrgb&w=300'
    },
    {
        id: 'PRD005',
        name: 'Traditional Spices Set',
        price: 1200,
        stock: 40,
        category: 'Food',
        image: 'https://images.pexels.com/photos/1630588/pexels-photo-1630588.jpeg?auto=compress&cs=tinysrgb&w=300',
        image_url: 'https://images.pexels.com/photos/1630588/pexels-photo-1630588.jpeg?auto=compress&cs=tinysrgb&w=300'
    },
    {
        id: 'PRD006',
        name: 'Artisan Jewelry',
        price: 2500,
        stock: 15,
        category: 'Fashion',
        image: 'https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg?auto=compress&cs=tinysrgb&w=300',
        image_url: 'https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg?auto=compress&cs=tinysrgb&w=300'
    }
];

// API Configuration
const API_CONFIG = {
    BASE_URL: ' https://bidhaa-backend-2.onrender.com/api',
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/auth/login',
            REGISTER: '/auth/register',
            PROFILE: '/auth/profile'
        },
        PRODUCTS: {
            ALL: '/products',
            BY_ID: '/products/:id',
            FEATURED: '/products/featured',
            CATEGORIES: '/products/categories'
        },
        CART: {
            BASE: '/cart',
            ITEM: '/cart/:id'
        },
        ORDERS: {
            BASE: '/orders',
            BY_ID: '/orders/:id',
            CANCEL: '/orders/:id/cancel'
        },
        PAYMENTS: {
            MPESA_INITIATE: '/payments/mpesa/initiate',
            MPESA_STATUS: '/payments/mpesa/status/:checkoutRequestId',
            TRANSACTIONS: '/payments/transactions',
            TRANSACTION_BY_ORDER: '/payments/transactions/order/:orderId'
        },
        TRACKING: {
            PUBLIC: '/tracking/:orderId',
            USER: '/tracking/user/:orderId'
        },
        INQUIRIES: {
            BASE: '/inquiries'
        },
        ADMIN: {
            DASHBOARD: '/admin/dashboard',
            PRODUCTS: '/admin/products',
            PRODUCT_BY_ID: '/admin/products/:id',
            ORDERS: '/admin/orders',
            ORDER_STATUS: '/admin/orders/:id/status',
            CUSTOMERS: '/admin/customers'
        }
    }
};

// API Client Class
class ApiClient {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
        this.token = localStorage.getItem('authToken');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }

    getHeaders(contentType = 'application/json') {
        const headers = {
            'Content-Type': contentType
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            if (error.message.includes('Failed to fetch')) {
                showNotification('Unable to connect to server. Using offline mode.', 'error');
                return { status: 'error', message: 'Backend not available' };
            }
            throw error;
        }
    }

    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async patch(endpoint, data) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    replaceParams(endpoint, params) {
        let url = endpoint;
        Object.keys(params).forEach(key => {
            url = url.replace(`:${key}`, params[key]);
        });
        return url;
    }
}

// Initialize API Client
const apiClient = new ApiClient();

// API Services
const apiServices = {
    auth: {
        async login(email, password) {
            try {
                const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
                    email,
                    password
                });

                if (response.status === 'success') {
                    apiClient.setToken(response.data.token);
                    localStorage.setItem('currentUser', JSON.stringify(response.data.user));
                    return response.data;
                }
                throw new Error(response.message);
            } catch (error) {
                if (error.message.includes('Backend not available')) {
                    return this.localLogin(email, password);
                }
                throw new Error(error.message || 'Login failed');
            }
        },

        async register(userData) {
            try {
                const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, userData);

                if (response.status === 'success') {
                    apiClient.setToken(response.data.token);
                    localStorage.setItem('currentUser', JSON.stringify(response.data.user));
                    return response.data;
                }
                throw new Error(response.message);
            } catch (error) {
                if (error.message.includes('Backend not available')) {
                    return this.localRegister(userData);
                }
                throw new Error(error.message || 'Registration failed');
            }
        },

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
        },

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
        },

        logout() {
            apiClient.setToken(null);
            localStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');
        },

        getCurrentUser() {
            const userStr = localStorage.getItem('currentUser');
            return userStr ? JSON.parse(userStr) : null;
        },

        isAuthenticated() {
            return !!localStorage.getItem('authToken');
        },

        isAdmin() {
            const user = this.getCurrentUser();
            return user && user.role === 'admin';
        },

        // Local fallback methods
        localLogin(email, password) {
            if (email === 'admin@bidhaaline.com' && password === 'admin123') {
                const user = { email, role: 'admin', name: 'Admin User', id: 'admin-1' };
                localStorage.setItem('currentUser', JSON.stringify(user));
                return { user, token: 'local-admin-token' };
            } else if (email && password) {
                const user = { email, role: 'customer', name: 'Customer User', id: 'customer-1' };
                localStorage.setItem('currentUser', JSON.stringify(user));
                return { user, token: 'local-customer-token' };
            }
            throw new Error('Invalid credentials');
        },

        localRegister(userData) {
            const user = {
                id: 'customer-' + Date.now(),
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                role: 'customer'
            };
            localStorage.setItem('currentUser', JSON.stringify(user));
            return { user, token: 'local-token-' + Date.now() };
        }
    },

    products: {
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
                if (error.message.includes('Backend not available')) {
                    return this.getLocalProducts(filters);
                }
                throw new Error(error.message || 'Failed to fetch products');
            }
        },

        async getProductById(productId) {
            try {
                const endpoint = apiClient.replaceParams(API_CONFIG.ENDPOINTS.PRODUCTS.BY_ID, { id: productId });
                const response = await apiClient.get(endpoint);

                if (response.status === 'success') {
                    return response.data.product;
                }
                throw new Error(response.message);
            } catch (error) {
                if (error.message.includes('Backend not available')) {
                    return this.getLocalProductById(productId);
                }
                throw new Error(error.message || 'Failed to fetch product');
            }
        },

        async getFeaturedProducts() {
            try {
                const response = await apiClient.get(API_CONFIG.ENDPOINTS.PRODUCTS.FEATURED);

                if (response.status === 'success') {
                    return response.data.products;
                }
                throw new Error(response.message);
            } catch (error) {
                if (error.message.includes('Backend not available')) {
                    return this.getLocalFeaturedProducts();
                }
                throw new Error(error.message || 'Failed to fetch featured products');
            }
        },

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
        },

        // Local fallback methods
        getLocalProducts(filters = {}) {
            let filteredProducts = [...localProducts];

            if (filters.category) {
                filteredProducts = filteredProducts.filter(p => p.category === filters.category);
            }

            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                filteredProducts = filteredProducts.filter(p =>
                    p.name.toLowerCase().includes(searchTerm) ||
                    p.id.toLowerCase().includes(searchTerm)
                );
            }

            return {
                products: filteredProducts,
                pagination: {
                    currentPage: 1,
                    totalPages: 1,
                    totalProducts: filteredProducts.length,
                    hasNextPage: false,
                    hasPreviousPage: false
                }
            };
        },

        getLocalProductById(productId) {
            return localProducts.find(p => p.id === productId);
        },

        getLocalFeaturedProducts() {
            return localProducts.slice(0, 6);
        }
    },

    cart: {
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
                if (error.message.includes('Backend not available')) {
                    return this.addToLocalCart(productId, quantity);
                }
                throw new Error(error.message || 'Failed to add item to cart');
            }
        },

        async getCart() {
            try {
                const response = await apiClient.get(API_CONFIG.ENDPOINTS.CART.BASE);

                if (response.status === 'success') {
                    return response.data;
                }
                throw new Error(response.message);
            } catch (error) {
                if (error.message.includes('Backend not available')) {
                    return this.getLocalCart();
                }
                throw new Error(error.message || 'Failed to fetch cart');
            }
        },

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
        },

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
        },

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
        },

        // Local fallback methods
        addToLocalCart(productId, quantity) {
            const product = localProducts.find(p => p.id === productId);
            if (!product) throw new Error('Product not found');

            const existingItem = cart.find(item => item.id === productId);
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.push({ ...product, quantity });
            }
            return { product_id: productId, quantity };
        },

        getLocalCart() {
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const tax = subtotal * 0.16;
            const total = subtotal + tax;

            return {
                cartItems: cart.map(item => ({
                    id: item.id,
                    product_id: item.id,
                    name: item.name,
                    price: item.price,
                    image_url: item.image,
                    quantity: item.quantity
                })),
                summary: {
                    subtotal,
                    tax,
                    total,
                    itemCount: cart.reduce((sum, item) => sum + item.quantity, 0)
                }
            };
        }
    },

    orders: {
        async createOrder(orderData) {
            try {
                const response = await apiClient.post(API_CONFIG.ENDPOINTS.ORDERS.BASE, orderData);

                if (response.status === 'success') {
                    return response.data.order;
                }
                throw new Error(response.message);
            } catch (error) {
                if (error.message.includes('Backend not available')) {
                    return this.createLocalOrder(orderData);
                }
                throw new Error(error.message || 'Failed to create order');
            }
        },

        async getUserOrders(page = 1, limit = 10) {
            try {
                const endpoint = `${API_CONFIG.ENDPOINTS.ORDERS.BASE}?page=${page}&limit=${limit}`;
                const response = await apiClient.get(endpoint);

                if (response.status === 'success') {
                    return response.data.orders;
                }
                throw new Error(response.message);
            } catch (error) {
                if (error.message.includes('Backend not available')) {
                    return this.getLocalOrders();
                }
                throw new Error(error.message || 'Failed to fetch orders');
            }
        },

        async getOrderById(orderId) {
            try {
                const endpoint = apiClient.replaceParams(API_CONFIG.ENDPOINTS.ORDERS.BY_ID, { id: orderId });
                const response = await apiClient.get(endpoint);

                if (response.status === 'success') {
                    return response.data.order;
                }
                throw new Error(response.message);
            } catch (error) {
                if (error.message.includes('Backend not available')) {
                    return this.getLocalOrderById(orderId);
                }
                throw new Error(error.message || 'Failed to fetch order');
            }
        },

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
        },

        async getAllOrders() {
            try {
                const response = await apiClient.get(API_CONFIG.ENDPOINTS.ADMIN.ORDERS);

                if (response.status === 'success') {
                    return response.data.orders;
                }
                throw new Error(response.message);
            } catch (error) {
                if (error.message.includes('Backend not available')) {
                    return this.getAllLocalOrders();
                }
                throw new Error(error.message || 'Failed to fetch all orders');
            }
        },

        async updateOrderStatus(orderId, status) {
            try {
                const endpoint = apiClient.replaceParams(API_CONFIG.ENDPOINTS.ADMIN.ORDER_STATUS, { id: orderId });
                const response = await apiClient.patch(endpoint, { status });

                if (response.status === 'success') {
                    return response.data.order;
                }
                throw new Error(response.message);
            } catch (error) {
                if (error.message.includes('Backend not available')) {
                    return this.updateLocalOrderStatus(orderId, status);
                }
                throw new Error(error.message || 'Failed to update order status');
            }
        },

        // Local fallback methods
        createLocalOrder(orderData) {
            const orderId = generateOrderId();
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const total = subtotal * 1.16;

            const newOrder = {
                id: orderId,
                items: cart.map(item => ({
                    product_id: item.id,
                    product_name: item.name,
                    product_price: item.price,
                    quantity: item.quantity,
                    total_price: item.price * item.quantity
                })),
                total_amount: total,
                subtotal: subtotal,
                tax_amount: total - subtotal,
                status: 'Processing',
                payment_method: orderData.payment_method,
                customer_name: currentUser?.name || 'Customer',
                customer_email: currentUser?.email || '',
                customer_phone: orderData.customer_phone,
                created_at: new Date().toISOString()
            };

            orders.push(newOrder);
            cart = []; // Clear cart
            return newOrder;
        },

        getLocalOrders() {
            return orders.filter(order =>
                currentUser && (order.customer_email === currentUser.email)
            );
        },

        getLocalOrderById(orderId) {
            return orders.find(order => order.id === orderId);
        },

        getAllLocalOrders() {
            return orders;
        },

        updateLocalOrderStatus(orderId, status) {
            const order = orders.find(o => o.id === orderId);
            if (order) {
                order.status = status;
                return order;
            }
            throw new Error('Order not found');
        }
    },

    payments: {
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
        },

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
        },

        async pollPaymentStatus(checkoutRequestId, maxAttempts = 30, interval = 2000) {
            return new Promise((resolve, reject) => {
                let attempts = 0;

                const poll = async () => {
                    try {
                        attempts++;
                        const result = await this.checkPaymentStatus(checkoutRequestId);

                        if (result.localTransaction &&
                            (result.localTransaction.status === 'success' ||
                                result.localTransaction.status === 'failed')) {
                            resolve(result);
                            return;
                        }

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
    },

    tracking: {
        async getOrderTracking(orderId) {
            try {
                const endpoint = apiClient.replaceParams(API_CONFIG.ENDPOINTS.TRACKING.PUBLIC, { orderId });
                const response = await apiClient.get(endpoint);

                if (response.status === 'success') {
                    return response.data;
                }
                throw new Error(response.message);
            } catch (error) {
                if (error.message.includes('Backend not available')) {
                    return this.getLocalOrderTracking(orderId);
                }
                throw new Error(error.message || 'Failed to fetch order tracking');
            }
        },

        async getUserOrderTracking(orderId) {
            try {
                const endpoint = apiClient.replaceParams(API_CONFIG.ENDPOINTS.TRACKING.USER, { orderId });
                const response = await apiClient.get(endpoint);

                if (response.status === 'success') {
                    return response.data;
                }
                throw new Error(response.message);
            } catch (error) {
                if (error.message.includes('Backend not available')) {
                    return this.getLocalOrderTracking(orderId);
                }
                throw new Error(error.message || 'Failed to fetch order tracking');
            }
        },

        getLocalOrderTracking(orderId) {
            const order = orders.find(o => o.id === orderId);
            if (!order) {
                throw new Error('Order not found');
            }

            // Generate mock tracking history based on order status
            const trackingHistory = [];
            const baseDate = new Date(order.created_at);

            trackingHistory.push({
                status: 'Order Placed',
                description: 'Your order has been successfully placed.',
                created_at: baseDate.toISOString()
            });

            if (order.status !== 'Cancelled') {
                trackingHistory.push({
                    status: 'Processing',
                    description: 'Your order is being prepared.',
                    created_at: new Date(baseDate.getTime() + 30 * 60000).toISOString()
                });

                if (order.status === 'Shipped' || order.status === 'Delivered') {
                    trackingHistory.push({
                        status: 'Shipped',
                        description: 'Your order has been shipped and is on its way.',
                        created_at: new Date(baseDate.getTime() + 24 * 60 * 60000).toISOString()
                    });
                }

                if (order.status === 'Delivered') {
                    trackingHistory.push({
                        status: 'Delivered',
                        description: 'Your order has been delivered successfully.',
                        created_at: new Date(baseDate.getTime() + 72 * 60 * 60000).toISOString()
                    });
                }
            } else {
                trackingHistory.push({
                    status: 'Cancelled',
                    description: 'Your order has been cancelled.',
                    created_at: new Date().toISOString()
                });
            }

            return {
                order,
                trackingHistory
            };
        }
    },

    inquiries: {
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
    },

    admin: {
        async getDashboardStats() {
            try {
                const response = await apiClient.get(API_CONFIG.ENDPOINTS.ADMIN.DASHBOARD);

                if (response.status === 'success') {
                    return response.data;
                }
                throw new Error(response.message);
            } catch (error) {
                if (error.message.includes('Backend not available')) {
                    return this.getLocalDashboardStats();
                }
                throw new Error(error.message || 'Failed to fetch dashboard stats');
            }
        },

        async getAllProducts() {
            try {
                const response = await apiClient.get(API_CONFIG.ENDPOINTS.ADMIN.PRODUCTS);

                if (response.status === 'success') {
                    return response.data.products;
                }
                throw new Error(response.message);
            } catch (error) {
                if (error.message.includes('Backend not available')) {
                    return localProducts;
                }
                throw new Error(error.message || 'Failed to fetch products');
            }
        },

        async getProductById(productId) {
            try {
                const endpoint = apiClient.replaceParams(API_CONFIG.ENDPOINTS.ADMIN.PRODUCT_BY_ID, { id: productId });
                const response = await apiClient.get(endpoint);

                if (response.status === 'success') {
                    return response.data.product;
                }
                throw new Error(response.message);
            } catch (error) {
                if (error.message.includes('Backend not available')) {
                    return localProducts.find(p => p.id === productId);
                }
                throw new Error(error.message || 'Failed to fetch product');
            }
        },

        async createProduct(productData) {
            try {
                const response = await apiClient.post(API_CONFIG.ENDPOINTS.ADMIN.PRODUCTS, productData);

                if (response.status === 'success') {
                    return response.data.product;
                }
                throw new Error(response.message);
            } catch (error) {
                if (error.message.includes('Backend not available')) {
                    const newProduct = {
                        id: generateProductId(),
                        ...productData,
                        created_at: new Date().toISOString()
                    };
                    localProducts.push(newProduct);
                    return newProduct;
                }
                throw new Error(error.message || 'Failed to create product');
            }
        },

        async updateProduct(productId, productData) {
            try {
                const endpoint = apiClient.replaceParams(API_CONFIG.ENDPOINTS.ADMIN.PRODUCT_BY_ID, { id: productId });
                const response = await apiClient.put(endpoint, productData);

                if (response.status === 'success') {
                    return response.data.product;
                }
                throw new Error(response.message);
            } catch (error) {
                if (error.message.includes('Backend not available')) {
                    const productIndex = localProducts.findIndex(p => p.id === productId);
                    if (productIndex !== -1) {
                        localProducts[productIndex] = { ...localProducts[productIndex], ...productData };
                        return localProducts[productIndex];
                    }
                    throw new Error('Product not found');
                }
                throw new Error(error.message || 'Failed to update product');
            }
        },

        async deleteProduct(productId) {
            try {
                const endpoint = apiClient.replaceParams(API_CONFIG.ENDPOINTS.ADMIN.PRODUCT_BY_ID, { id: productId });
                const response = await apiClient.delete(endpoint);

                if (response.status === 'success') {
                    return true;
                }
                throw new Error(response.message);
            } catch (error) {
                if (error.message.includes('Backend not available')) {
                    const productIndex = localProducts.findIndex(p => p.id === productId);
                    if (productIndex !== -1) {
                        localProducts.splice(productIndex, 1);
                        return true;
                    }
                    throw new Error('Product not found');
                }
                throw new Error(error.message || 'Failed to delete product');
            }
        },

        async getAllCustomers() {
            try {
                const response = await apiClient.get(API_CONFIG.ENDPOINTS.ADMIN.CUSTOMERS);

                if (response.status === 'success') {
                    return response.data.customers;
                }
                throw new Error(response.message);
            } catch (error) {
                if (error.message.includes('Backend not available')) {
                    return this.getLocalCustomers();
                }
                throw new Error(error.message || 'Failed to fetch customers');
            }
        },

        getLocalDashboardStats() {
            const totalRevenue = orders.reduce((sum, order) =>
                order.status !== 'Cancelled' ? sum + order.total_amount : sum, 0
            );
            const pendingOrdersCount = orders.filter(order => order.status === 'Processing').length;

            return {
                stats: {
                    totalProducts: localProducts.length,
                    totalOrders: orders.length,
                    totalRevenue: totalRevenue,
                    pendingOrders: pendingOrdersCount
                },
                recentOrders: orders.slice(-5).reverse()
            };
        },

        getLocalCustomers() {
            // Generate mock customer data from orders
            const customerMap = new Map();
            
            orders.forEach(order => {
                if (order.customer_email) {
                    if (!customerMap.has(order.customer_email)) {
                        customerMap.set(order.customer_email, {
                            id: `cust-${order.customer_email.split('@')[0]}`,
                            name: order.customer_name,
                            email: order.customer_email,
                            phone: order.customer_phone,
                            total_orders: 0,
                            total_spent: 0,
                            created_at: order.created_at
                        });
                    }
                    
                    const customer = customerMap.get(order.customer_email);
                    customer.total_orders += 1;
                    if (order.status !== 'Cancelled') {
                        customer.total_spent += order.total_amount;
                    }
                }
            });

            return Array.from(customerMap.values());
        }
    }
};

// Utility Functions
function formatPrice(price) {
    return `KSh ${price.toLocaleString()}`;
}

function generateOrderId() {
    return 'ORD' + Date.now().toString().slice(-6);
}

function generateProductId() {
    return 'PRD' + Date.now().toString().slice(-6);
}

function getStockStatus(stock) {
    if (stock === 0) return 'out-of-stock';
    if (stock <= 5) return 'low-stock';
    return 'in-stock';
}

function getStockStatusText(stock) {
    if (stock === 0) return 'Out of Stock';
    if (stock <= 5) return 'Low Stock';
    return 'In Stock';
}

// Page Navigation Functions
function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    if (pageName.startsWith('admin')) {
        const adminPage = document.getElementById('adminPage');
        if (adminPage) {
            adminPage.classList.add('active');
            currentPage = 'admin';
        }

        switch (pageName) {
            case 'admin':
                showAdminTab('overview');
                break;
            case 'adminProducts':
                showAdminTab('products');
                break;
            case 'adminOrders':
                showAdminTab('orders');
                break;
            case 'adminCustomers':
                showAdminTab('customers');
                break;
            case 'adminTracking':
                showAdminTab('tracking');
                break;
        }
        return;
    }
    
    // Handle normal user pages
    const targetPage = document.getElementById(pageName + 'Page');
    if (targetPage) {
        targetPage.classList.add('active');
        currentPage = pageName;
    }

    // Initialize page-specific content
    switch (pageName) {
        case 'home':
            renderFeaturedProducts();
            break;
        case 'dashboard':
            renderDashboard();
            break;
    }
}

function showLoginForm(type) {
    currentLoginType = type;
    showPage('login');

    // Update login form based on type
    const subtitle = document.getElementById('loginSubtitle');
    const loginCard = document.querySelector('.login-card');
    const registerLink = document.getElementById('registerLink');

    if (type === 'admin') {
        subtitle.textContent = 'Admin Access';
        loginCard.style.borderTop = '4px solid #7c3aed';
        registerLink.style.display = 'none';
    } else {
        subtitle.textContent = 'Welcome Back';
        loginCard.style.borderTop = '4px solid #2563eb';
        registerLink.style.display = 'block';
    }
}

function toggleRegister() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    loginForm.classList.toggle('hidden');
    registerForm.classList.toggle('hidden');
}

// Authentication Functions
async function login(email, password) {
    try {
        const userData = await apiServices.auth.login(email, password);
        currentUser = userData.user;
        isLoggedIn = true;
        userRole = currentUser.role;

        if (currentUser.role === 'admin') {
            showPage('admin');
        } else {
            showPage('dashboard');
        }

        showNotification('Login successful!', 'success');
        return true;
    } catch (error) {
        showNotification(error.message, 'error');
        return false;
    }
}

async function register(userData) {
    try {
        const result = await apiServices.auth.register(userData);
        currentUser = result.user;
        isLoggedIn = true;
        userRole = currentUser.role;
        showNotification('Registration successful!', 'success');
        return true;
    } catch (error) {
        showNotification(error.message, 'error');
        return false;
    }
}

function logout() {
    apiServices.auth.logout();
    currentUser = null;
    currentLoginType = null;
    cart = [];
    isLoggedIn = false;
    userRole = 'customer';
    showPage('home');
    updateCartDisplay();
    showNotification('Logged out successfully!', 'info');
}

// Product Functions
async function renderFeaturedProducts() {
    try {
        const products = await apiServices.products.getFeaturedProducts();
        const container = document.getElementById('featuredProducts');
        if (!container) return;

        container.innerHTML = products.map(product => `
            <div class="product-card fade-in">
                <div class="product-id">${product.id}</div>
                <div class="stock-status ${getStockStatus(product.stock)}">${getStockStatusText(product.stock)}</div>
                <img src="${product.image_url || product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=300'">
                <div class="product-info">
                    <h4 class="product-name">${product.name}</h4>
                    <p class="product-price">${formatPrice(product.price)}</p>
                    <p class="product-stock">Stock: ${product.stock} items</p>
                    <button onclick="addToCart('${product.id}')" class="add-to-cart-btn" ${product.stock === 0 ? 'disabled' : ''}>
                        ${product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        showNotification('Failed to load featured products', 'error');
    }
}

async function renderAllProducts() {
    try {
        const searchTerm = document.getElementById('productSearch')?.value || '';
        const category = document.getElementById('categoryFilter')?.value || '';

        const data = await apiServices.products.getAllProducts({
            search: searchTerm,
            category: category,
            page: 1,
            limit: 12
        });

        const container = document.getElementById('allProducts');
        if (!container) return;

        container.innerHTML = data.products.map(product => `
            <div class="product-card fade-in">
                <div class="product-id">${product.id}</div>
                <div class="stock-status ${getStockStatus(product.stock)}">${getStockStatusText(product.stock)}</div>
                <img src="${product.image_url || product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=300'">
                <div class="product-info">
                    <h4 class="product-name">${product.name}</h4>
                    <p class="product-price">${formatPrice(product.price)}</p>
                    <p class="product-stock">Stock: ${product.stock} items</p>
                    <button onclick="addToCart('${product.id}')" class="add-to-cart-btn" ${product.stock === 0 ? 'disabled' : ''}>
                        ${product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        showNotification('Failed to load products', 'error');
    }
}

function filterProducts() {
    renderAllProducts();
}

// Cart Functions
async function addToCart(productId) {
    try {
        if (!isLoggedIn) {
            showNotification('Please login to add items to cart', 'warning');
            return;
        }

        await apiServices.cart.addToCart(productId, 1);
        await updateCartDisplay();
        showNotification('Product added to cart!', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function updateCartDisplay() {
    try {
        if (!isLoggedIn) {
            const cartCount = document.getElementById('cartCount');
            if (cartCount) {
                cartCount.textContent = '0';
                cartCount.style.display = 'none';
            }
            return;
        }

        const cartData = await apiServices.cart.getCart();
        const cartCount = document.getElementById('cartCount');

        if (cartCount) {
            cartCount.textContent = cartData.summary.itemCount;
            cartCount.style.display = cartData.summary.itemCount > 0 ? 'flex' : 'none';
        }

        // Update global cart variable for compatibility
        cart = cartData.cartItems.map(item => ({
            id: item.product_id,
            name: item.name,
            price: item.price,
            image: item.image_url,
            quantity: item.quantity,
            cartItemId: item.id
        }));

    } catch (error) {
        console.error('Failed to update cart display:', error);
    }
}

function toggleCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    if (cartSidebar) {
        cartSidebar.classList.toggle('open');
        if (cartSidebar.classList.contains('open')) {
            renderCartItems();
        }
    }
}

async function renderCartItems() {
    try {
        if (!isLoggedIn) {
            const container = document.getElementById('cartItems');
            if (container) {
                container.innerHTML = '<div class="empty-state">Please login to view cart</div>';
            }
            return;
        }

        const cartData = await apiServices.cart.getCart();
        const container = document.getElementById('cartItems');
        const footer = document.getElementById('cartFooter');

        if (!container) return;

        if (cartData.cartItems.length === 0) {
            container.innerHTML = '<div class="empty-state">Your cart is empty</div>';
            footer.style.display = 'none';
            return;
        }

        footer.style.display = 'block';

        container.innerHTML = cartData.cartItems.map(item => `
            <div class="cart-item">
                <img src="${item.image_url}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-info">
                    <h4 class="cart-item-name">${item.name}</h4>
                    <p class="cart-item-price">${formatPrice(item.price)}</p>
                    <div class="quantity-controls">
                        <button onclick="updateCartQuantity('${item.id}', ${item.quantity - 1})" class="quantity-btn">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateCartQuantity('${item.id}', ${item.quantity + 1})" class="quantity-btn">+</button>
                    </div>
                </div>
                <button onclick="removeFromCart('${item.id}')" class="remove-btn">✕</button>
            </div>
        `).join('');

        // Update totals
        document.getElementById('subtotal').textContent = formatPrice(cartData.summary.subtotal);
        document.getElementById('tax').textContent = formatPrice(cartData.summary.tax);
        document.getElementById('total').textContent = formatPrice(cartData.summary.total);
        document.getElementById('paymentAmount').textContent = formatPrice(cartData.summary.total);

    } catch (error) {
        showNotification('Failed to load cart items', 'error');
    }
}

async function updateCartQuantity(cartItemId, quantity) {
    try {
        if (quantity <= 0) {
            await removeFromCart(cartItemId);
            return;
        }

        await apiServices.cart.updateCartItem(cartItemId, quantity);
        await updateCartDisplay();
        await renderCartItems();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function removeFromCart(cartItemId) {
    try {
        await apiServices.cart.removeFromCart(cartItemId);
        await updateCartDisplay();
        await renderCartItems();
        showNotification('Item removed from cart', 'info');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Payment Functions
function showPaymentModal() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }

    currentOrderId = generateOrderId();
    document.getElementById('paymentModal').classList.remove('hidden');

    // Pre-fill customer phone if available
    if (currentUser && currentUser.phone) {
        document.getElementById('customerPhone').value = currentUser.phone;
    }
}

function hidePaymentModal() {
    document.getElementById('paymentModal').classList.add('hidden');
}

function selectPaymentMethod(method) {
    selectedPaymentMethod = method;

    // Update UI
    document.querySelectorAll('.payment-method').forEach(el => {
        el.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
}

async function confirmPayment() {
    try {
        const customerPhone = document.getElementById('customerPhone')?.value;
        if (!customerPhone) {
            showNotification('Please enter your phone number!', 'error');
            return;
        }

        // Get current cart
        const cartData = await apiServices.cart.getCart();
        if (cartData.cartItems.length === 0) {
            showNotification('Your cart is empty!', 'error');
            return;
        }

        const orderData = {
            items: cartData.cartItems.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity
            })),
            payment_method: selectedPaymentMethod,
            payment_account: selectedPaymentMethod === 'mpesa' ? '0740204981' : '',
            transaction_code: document.getElementById('transactionCode')?.value || '',
            customer_phone: customerPhone,
            shipping_address: currentUser?.address || '',
            notes: ''
        };

        const order = await apiServices.orders.createOrder(orderData);

        // If M-Pesa payment, initiate STK push
        if (selectedPaymentMethod === 'mpesa') {
            try {
                const paymentResult = await apiServices.payments.initiateMpesaPayment(
                    order.id,
                    customerPhone,
                    cartData.summary.total
                );

                showNotification('M-Pesa payment request sent to your phone. Please enter your PIN to complete payment.');

                // Poll for payment status
                apiServices.payments.pollPaymentStatus(paymentResult.checkoutRequestId)
                    .then(result => {
                        if (result.localTransaction.status === 'success') {
                            showNotification('Payment successful! Your order has been confirmed.', 'success');
                        } else {
                            showNotification('Payment failed. Please try again.', 'error');
                        }
                    })
                    .catch(error => {
                        showNotification('Payment status check failed. Please contact support.', 'error');
                    });

            } catch (paymentError) {
                showNotification('Failed to initiate M-Pesa payment: ' + paymentError.message, 'error');
            }
        }

        await updateCartDisplay();
        hidePaymentModal();
        toggleCart();

        showNotification(`Order placed successfully! Order ID: ${order.id}`, 'success');
        await renderOrders();

    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Order Functions
async function renderOrders() {
    try {
        if (!isLoggedIn) return;

        const orders = await apiServices.orders.getUserOrders();
        const container = document.getElementById('ordersList');
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = '<div class="empty-state">No orders yet.</div>';
            return;
        }

        container.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <span class="order-id" onclick="showOrderDetails('${order.id}')">#${order.id}</span>
                    <span class="order-date">${new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <div class="order-status">Status: <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></div>
                <div class="order-total">Total: ${formatPrice(order.total_amount)}</div>
                <div class="order-items">
                    <strong>Items:</strong>
                    <ul>
                        ${order.items.map(item => `
                            <li>${item.product_name} x ${item.quantity} - ${formatPrice(item.total_price)}</li>
                        `).join('')}
                    </ul>
                </div>
                <div class="order-actions">
                    ${order.status === 'Processing' ? `
                        <button onclick="cancelOrder('${order.id}')" class="cancel-order-btn">Cancel Order</button>
                    ` : ''}
                    <button onclick="trackOrderDetails('${order.id}')" class="track-order-btn">Track Order</button>
                    <button onclick="showOrderDetails('${order.id}')" class="view-details-btn">View Details</button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        showNotification('Failed to load orders', 'error');
    }
}

async function cancelOrder(orderId) {
    try {
        if (confirm('Are you sure you want to cancel this order?')) {
            await apiServices.orders.cancelOrder(orderId);
            showNotification('Order cancelled successfully!', 'success');
            await renderOrders();
            await renderAllProducts(); // Refresh products to show updated stock
        }
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Tracking Functions
async function trackOrderById() {
    try {
        const orderId = document.getElementById('trackingOrderId').value.trim();
        if (!orderId) {
            showNotification('Please enter an order ID!', 'error');
            return;
        }

        const trackingData = await apiServices.tracking.getOrderTracking(orderId);
        displayOrderTracking(trackingData);

    } catch (error) {
        document.getElementById('trackingResult').innerHTML = `
            <div class="empty-state">Order not found. Please check the order ID and try again.</div>
        `;
    }
}

async function trackOrderDetails(orderId) {
    try {
        const trackingData = await apiServices.tracking.getUserOrderTracking(orderId);
        displayOrderTracking(trackingData);
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function displayOrderTracking(trackingData) {
    const container = document.getElementById('trackingResult');
    if (!container) return;

    const order = trackingData.order;
    const trackingHistory = trackingData.trackingHistory;

    container.innerHTML = `
        <div class="tracking-info">
            <h4>Order #${order.id}</h4>
            <p>Status: <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></p>
            <p>Total: ${formatPrice(order.total_amount)}</p>
            <p>Date: ${new Date(order.created_at).toLocaleDateString()}</p>
        </div>
        
        <div class="tracking-timeline">
            ${trackingHistory.map(track => `
                <div class="tracking-step completed">
                    <div class="tracking-info">
                        <div class="tracking-status">${track.status}</div>
                        <div class="tracking-date">${new Date(track.created_at).toLocaleDateString()}</div>
                        <div class="tracking-description">${track.description}</div>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div style="margin-top: 2rem; padding: 1rem; background: #f8fafc; border-radius: 0.5rem;">
            <p><strong>Need help?</strong> Contact us at 0740204981 or email info@bidhaaline.com</p>
        </div>
    `;
}

// Dashboard Functions
function renderDashboard() {
    if (!currentUser || currentUser.role !== 'customer') return;

    document.getElementById('welcomeUser').textContent = `Welcome, ${currentUser.name}`;
    renderAllProducts();
    renderOrders();
    updateCartDisplay();

    // Pre-fill profile form
    if (currentUser) {
        document.getElementById('profileName').value = currentUser.name || '';
        document.getElementById('profileEmail').value = currentUser.email || '';
        document.getElementById('profilePhone').value = currentUser.phone || '';
        document.getElementById('profileAddress').value = currentUser.address || '';
    }
}

function showDashboardTab(tabName) {
    // Update sidebar buttons
    document.querySelectorAll('.sidebar-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabName + 'Tab').classList.add('active');

    // Load tab-specific content
    if (tabName === 'products') {
        renderAllProducts();
    } else if (tabName === 'orders') {
        renderOrders();
    } else if (tabName === 'tracking') {
        document.getElementById('trackingResult').innerHTML = '';
        document.getElementById('trackingOrderId').value = '';
    }
}

// Admin Functions
async function renderAdminDashboard() {
    try {
        const stats = await apiServices.admin.getDashboardStats();

        document.getElementById('totalProducts').textContent = stats.stats.totalProducts;
        document.getElementById('totalOrders').textContent = stats.stats.totalOrders;
        document.getElementById('totalRevenue').textContent = formatPrice(stats.stats.totalRevenue);
        document.getElementById('pendingOrders').textContent = stats.stats.pendingOrders;

        // Render recent orders
        const container = document.getElementById('recentOrdersList');
        if (container && stats.recentOrders) {
            container.innerHTML = stats.recentOrders.map(order => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #e5e7eb;">
                    <div>
                        <span style="font-weight: 600;">#${order.id}</span>
                        <span style="margin-left: 1rem; color: #6b7280;">${order.customer_name}</span>
                    </div>
                    <div style="text-align: right;">
                        <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span>
                        <span style="display: block; margin-top: 0.25rem; font-weight: 600;">${formatPrice(order.total_amount)}</span>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load admin dashboard:', error);
        showNotification('Failed to load dashboard data', 'error');
    }
}

async function renderAdminProducts() {
    try {
        const products = await apiServices.admin.getAllProducts();
        const container = document.getElementById('adminProductsList');
        if (!container) return;

        container.innerHTML = products.map(product => `
            <div class="admin-product-card" style="border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem;">
                <div style="display: flex; gap: 1rem; align-items: flex-start;">
                    <img src="${product.image_url || product.image}" alt="${product.name}" 
                         style="width: 80px; height: 80px; object-fit: cover; border-radius: 0.375rem;" 
                         onerror="this.src='https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=300'">
                    <div style="flex: 1;">
                        <h4 style="margin: 0; font-weight: 600; color: #1f2937;">${product.name}</h4>
                        <p style="margin: 0.25rem 0; color: #6b7280;">ID: ${product.id}</p>
                        <p style="margin: 0.25rem 0; font-weight: 600; color: #059669;">${formatPrice(product.price)}</p>
                        <p style="margin: 0.25rem 0; color: ${product.stock <= 5 ? '#dc2626' : '#059669'};">
                            Stock: ${product.stock} items
                        </p>
                        <p style="margin: 0.25rem 0; color: #6b7280;">Category: ${product.category}</p>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <button onclick="editProduct('${product.id}')" 
                                style="padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 0.375rem; cursor: pointer;">
                            Edit
                        </button>
                        <button onclick="deleteProduct('${product.id}')" 
                                style="padding: 0.5rem 1rem; background: #dc2626; color: white; border: none; border-radius: 0.375rem; cursor: pointer;">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load admin products:', error);
        showNotification('Failed to load products', 'error');
    }
}

async function renderAdminOrders() {
    try {
        const orders = await apiServices.orders.getAllOrders();
        const container = document.getElementById('adminOrdersList');
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = '<div class="empty-state">No orders found.</div>';
            return;
        }

        container.innerHTML = orders.map(order => `
            <div class="admin-order-card" style="border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <div>
                        <h4 style="margin: 0; font-weight: 600; color: #1f2937;">Order #${order.id}</h4>
                        <p style="margin: 0.25rem 0; color: #6b7280;">
                            ${new Date(order.created_at).toLocaleDateString()} at ${new Date(order.created_at).toLocaleTimeString()}
                        </p>
                    </div>
                    <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div>
                        <p style="margin: 0.25rem 0;"><strong>Customer:</strong> ${order.customer_name}</p>
                        <p style="margin: 0.25rem 0;"><strong>Email:</strong> ${order.customer_email}</p>
                        <p style="margin: 0.25rem 0;"><strong>Phone:</strong> ${order.customer_phone}</p>
                    </div>
                    <div>
                        <p style="margin: 0.25rem 0;"><strong>Payment:</strong> ${order.payment_method?.toUpperCase()}</p>
                        <p style="margin: 0.25rem 0;"><strong>Total:</strong> ${formatPrice(order.total_amount)}</p>
                    </div>
                </div>

                <div style="margin-bottom: 1rem;">
                    <strong>Items:</strong>
                    <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                        ${order.items.map(item => `
                            <li>${item.product_name} x ${item.quantity} - ${formatPrice(item.total_price)}</li>
                        `).join('')}
                    </ul>
                </div>

                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button onclick="showOrderDetails('${order.id}')" 
                            style="padding: 0.5rem 1rem; background: #6b7280; color: white; border: none; border-radius: 0.375rem; cursor: pointer;">
                        View Details
                    </button>
                    <select onchange="updateOrderStatus('${order.id}', this.value)" 
                            style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;">
                        <option value="">Change Status</option>
                        <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                        <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                    <button onclick="trackOrderDetails('${order.id}')" 
                            style="padding: 0.5rem 1rem; background: #059669; color: white; border: none; border-radius: 0.375rem; cursor: pointer;">
                        Track Order
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load admin orders:', error);
        showNotification('Failed to load orders', 'error');
    }
}

async function renderAdminCustomers() {
    try {
        const customers = await apiServices.admin.getAllCustomers();
        const container = document.getElementById('customersList');
        if (!container) return;

        if (customers.length === 0) {
            container.innerHTML = '<div class="empty-state">No customers found.</div>';
            return;
        }

        container.innerHTML = customers.map(customer => `
            <div class="customer-card" style="border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h4 style="margin: 0; font-weight: 600; color: #1f2937;">${customer.name}</h4>
                        <p style="margin: 0.25rem 0; color: #6b7280;">
                            <strong>Email:</strong> ${customer.email}
                        </p>
                        <p style="margin: 0.25rem 0; color: #6b7280;">
                            <strong>Phone:</strong> ${customer.phone || 'N/A'}
                        </p>
                        <p style="margin: 0.25rem 0; color: #6b7280;">
                            <strong>Joined:</strong> ${new Date(customer.created_at).toLocaleDateString()}
                        </p>
                    </div>
                    <div style="text-align: right;">
                        <p style="margin: 0.25rem 0; font-weight: 600; color: #059669;">
                            ${customer.total_orders} Orders
                        </p>
                        <p style="margin: 0.25rem 0; font-weight: 600; color: #059669;">
                            ${formatPrice(customer.total_spent)} Spent
                        </p>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load customers:', error);
        showNotification('Failed to load customers', 'error');
    }
}

async function renderAdminTracking() {
    const container = document.getElementById('adminTrackingContent');
    if (!container) return;

    container.innerHTML = `
        <div style="background: white; border-radius: 0.5rem; padding: 1.5rem;">
            <h3 style="margin: 0 0 1rem 0; color: #1f2937;">Order Tracking Management</h3>
            
            <div style="margin-bottom: 2rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #374151;">
                    Search Order by ID:
                </label>
                <div style="display: flex; gap: 0.5rem;">
                    <input type="text" id="adminTrackingOrderId" placeholder="Enter Order ID (e.g., ORD123456)" 
                           style="flex: 1; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem;">
                    <button onclick="adminTrackOrder()" 
                            style="padding: 0.75rem 1.5rem; background: #3b82f6; color: white; border: none; border-radius: 0.375rem; cursor: pointer; white-space: nowrap;">
                        Track Order
                    </button>
                </div>
            </div>

            <div id="adminTrackingResult"></div>

            <div style="margin-top: 2rem; padding: 1rem; background: #f8fafc; border-radius: 0.375rem;">
                <h4 style="margin: 0 0 0.5rem 0; color: #1f2937;">Quick Actions:</h4>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button onclick="showRecentOrders()" 
                            style="padding: 0.5rem 1rem; background: #059669; color: white; border: none; border-radius: 0.375rem; cursor: pointer;">
                        Show Recent Orders
                    </button>
                    <button onclick="showPendingOrders()" 
                            style="padding: 0.5rem 1rem; background: #f59e0b; color: white; border: none; border-radius: 0.375rem; cursor: pointer;">
                        Show Pending Orders
                    </button>
                    <button onclick="showShippedOrders()" 
                            style="padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 0.375rem; cursor: pointer;">
                        Show Shipped Orders
                    </button>
                </div>
            </div>
        </div>
    `;
}

function showAdminTab(tabName) {
  // Update sidebar buttons
  document.querySelectorAll('.sidebar-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

  // Update tab content visibility
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Map the tab names to the correct IDs
  const tabMap = {
    overview: 'overviewTab',
    products: 'adminProductsTab',
    orders: 'adminOrdersTab',
    tracking: 'adminTrackingTab',
    customers: 'customersTab'
  };
  
  const activeTab = document.getElementById(tabMap[tabName]);
  if (activeTab) activeTab.classList.add('active');

  // Load tab-specific content
  switch (tabName) {
    case 'overview':
      renderAdminDashboard();
      break;
    case 'products':
      renderAdminProducts();
      break;
    case 'orders':
      renderAdminOrders();
      break;
    case 'tracking':
      renderAdminTracking();
      break;
    case 'customers':
      renderAdminCustomers();
      break;
  }
}
async function updateAdminStats() {
    try {
        const stats = await apiServices.admin.getDashboardStats();

        document.getElementById('totalProducts').textContent = stats.stats.totalProducts;
        document.getElementById('totalOrders').textContent = stats.stats.totalOrders;
        document.getElementById('totalRevenue').textContent = formatPrice(stats.stats.totalRevenue);
        document.getElementById('pendingOrders').textContent = stats.stats.pendingOrders;

        // Render recent orders
        const container = document.getElementById('recentOrdersList');
        if (container && stats.recentOrders) {
            container.innerHTML = stats.recentOrders.map(order => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #e5e7eb;">
                    <div>
                        <span style="font-weight: 600;">#${order.id}</span>
                        <span style="margin-left: 1rem; color: #6b7280;">${order.customer_name}</span>
                    </div>
                    <div>
                        <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span>
                        <span style="margin-left: 1rem; font-weight: 600;">${formatPrice(order.total_amount)}</span>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to update admin stats:', error);
    }
}

// Admin Product Management Functions
async function editProduct(productId) {
    try {
        const product = await apiServices.admin.getProductById(productId);
        if (!product) {
            showNotification('Product not found', 'error');
            return;
        }

        const newName = prompt('Product Name:', product.name);
        if (!newName) return;

        const newPrice = prompt('Product Price (KSh):', product.price);
        if (!newPrice || isNaN(newPrice)) return;

        const newStock = prompt('Stock Quantity:', product.stock);
        if (!newStock || isNaN(newStock)) return;

        const newCategory = prompt('Category:', product.category);
        if (!newCategory) return;

        const newImageUrl = prompt('Image URL:', product.image_url || product.image);

        const updatedData = {
            name: newName,
            price: parseFloat(newPrice),
            stock: parseInt(newStock),
            category: newCategory,
            image_url: newImageUrl || product.image_url || product.image
        };

        await apiServices.admin.updateProduct(productId, updatedData);
        showNotification('Product updated successfully!', 'success');
        renderAdminProducts();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function deleteProduct(productId) {
    try {
        if (!confirm('Are you sure you want to delete this product?')) return;

        await apiServices.admin.deleteProduct(productId);
        showNotification('Product deleted successfully!', 'success');
        renderAdminProducts();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function addNewProduct() {
    try {
        const name = prompt('Product Name:');
        if (!name) return;

        const price = prompt('Product Price (KSh):');
        if (!price || isNaN(price)) return;

        const stock = prompt('Stock Quantity:');
        if (!stock || isNaN(stock)) return;

        const category = prompt('Category:');
        if (!category) return;

        const imageUrl = prompt('Image URL:', 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=300');

        const productData = {
            name,
            price: parseFloat(price),
            stock: parseInt(stock),
            category,
            image_url: imageUrl
        };

        await apiServices.admin.createProduct(productData);
        showNotification('Product added successfully!', 'success');
        renderAdminProducts();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Admin Order Management Functions
async function updateOrderStatus(orderId, newStatus) {
    try {
        if (!newStatus) return;

        await apiServices.orders.updateOrderStatus(orderId, newStatus);
        showNotification(`Order status updated to ${newStatus}!`, 'success');
        renderAdminOrders();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Admin Tracking Functions
async function adminTrackOrder() {
    try {
        const orderId = document.getElementById('adminTrackingOrderId').value.trim();
        if (!orderId) {
            showNotification('Please enter an order ID!', 'error');
            return;
        }

        const trackingData = await apiServices.tracking.getOrderTracking(orderId);
        displayAdminOrderTracking(trackingData);

    } catch (error) {
        document.getElementById('adminTrackingResult').innerHTML = `
            <div class="empty-state">Order not found. Please check the order ID and try again.</div>
        `;
    }
}

function displayAdminOrderTracking(trackingData) {
    const container = document.getElementById('adminTrackingResult');
    if (!container) return;

    const order = trackingData.order;
    const trackingHistory = trackingData.trackingHistory;

    container.innerHTML = `
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1.5rem; margin-top: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                <div>
                    <h4 style="margin: 0; font-weight: 600; color: #1f2937;">Order #${order.id}</h4>
                    <p style="margin: 0.25rem 0; color: #6b7280;">
                        Customer: ${order.customer_name} (${order.customer_email})
                    </p>
                    <p style="margin: 0.25rem 0; color: #6b7280;">
                        Date: ${new Date(order.created_at).toLocaleDateString()}
                    </p>
                </div>
                <div style="text-align: right;">
                    <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span>
                    <p style="margin: 0.25rem 0; font-weight: 600;">${formatPrice(order.total_amount)}</p>
                </div>
            </div>
            
            <div style="margin-bottom: 1.5rem;">
                <strong>Order Items:</strong>
                <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                    ${order.items.map(item => `
                        <li>${item.product_name} x ${item.quantity} - ${formatPrice(item.total_price)}</li>
                    `).join('')}
                </ul>
            </div>

            <div style="margin-bottom: 1.5rem;">
                <strong>Tracking History:</strong>
                <div style="margin-top: 1rem;">
                    ${trackingHistory.map(track => `
                        <div style="display: flex; gap: 1rem; padding: 0.75rem 0; border-bottom: 1px solid #f3f4f6;">
                            <div style="min-width: 120px; font-weight: 600; color: #059669;">
                                ${track.status}
                            </div>
                            <div style="flex: 1;">
                                <div style="color: #374151;">${track.description}</div>
                                <div style="color: #6b7280; font-size: 0.875rem; margin-top: 0.25rem;">
                                    ${new Date(track.created_at).toLocaleDateString()} at ${new Date(track.created_at).toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div style="display: flex; gap: 0.5rem;">
                <select onchange="updateOrderStatus('${order.id}', this.value)" 
                        style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;">
                    <option value="">Update Status</option>
                    <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                    <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
                <button onclick="showOrderDetails('${order.id}')" 
                        style="padding: 0.5rem 1rem; background: #6b7280; color: white; border: none; border-radius: 0.375rem; cursor: pointer;">
                    View Full Details
                </button>
            </div>
        </div>
    `;
}

async function showRecentOrders() {
    try {
        const orders = await apiServices.orders.getAllOrders();
        const recentOrders = orders.slice(-10).reverse();
        displayOrdersList(recentOrders, 'Recent Orders');
    } catch (error) {
        showNotification('Failed to load recent orders', 'error');
    }
}

async function showPendingOrders() {
    try {
        const orders = await apiServices.orders.getAllOrders();
        const pendingOrders = orders.filter(order => order.status === 'Processing');
        displayOrdersList(pendingOrders, 'Pending Orders');
    } catch (error) {
        showNotification('Failed to load pending orders', 'error');
    }
}

async function showShippedOrders() {
    try {
        const orders = await apiServices.orders.getAllOrders();
        const shippedOrders = orders.filter(order => order.status === 'Shipped');
        displayOrdersList(shippedOrders, 'Shipped Orders');
    } catch (error) {
        showNotification('Failed to load shipped orders', 'error');
    }
}

function displayOrdersList(orders, title) {
    const container = document.getElementById('adminTrackingResult');
    if (!container) return;

    if (orders.length === 0) {
        container.innerHTML = `
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1.5rem; margin-top: 1rem;">
                <h4 style="margin: 0; color: #1f2937;">${title}</h4>
                <div class="empty-state">No orders found.</div>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1.5rem; margin-top: 1rem;">
            <h4 style="margin: 0 0 1rem 0; color: #1f2937;">${title} (${orders.length})</h4>
            ${orders.map(order => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #f3f4f6;">
                    <div>
                        <span style="font-weight: 600; cursor: pointer;" onclick="adminTrackSpecificOrder('${order.id}')">
                            #${order.id}
                        </span>
                        <span style="margin-left: 1rem; color: #6b7280;">${order.customer_name}</span>
                        <span style="margin-left: 1rem; font-size: 0.875rem; color: #9ca3af;">
                            ${new Date(order.created_at).toLocaleDateString()}
                        </span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span>
                        <span style="font-weight: 600;">${formatPrice(order.total_amount)}</span>
                        <button onclick="adminTrackSpecificOrder('${order.id}')" 
                                style="padding: 0.25rem 0.75rem; background: #3b82f6; color: white; border: none; border-radius: 0.25rem; cursor: pointer; font-size: 0.875rem;">
                            Track
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

async function adminTrackSpecificOrder(orderId) {
    document.getElementById('adminTrackingOrderId').value = orderId;
    await adminTrackOrder();
}

// Inquiry Functions
async function submitInquiry(inquiryData) {
    try {
        await apiServices.inquiries.submitInquiry(inquiryData);
        showNotification('Inquiry submitted successfully! We will get back to you soon.', 'success');

        // Clear form
        document.getElementById('inquiryForm').reset();

    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Order Details Modal
function showOrderDetails(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const modal = document.getElementById('orderDetailsModal');
    const content = document.getElementById('orderDetailsContent');

    content.innerHTML = `
        <div class="order-details">
            <h4>Order #${order.id}</h4>
            <div style="margin: 1rem 0;">
                <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></p>
                <p><strong>Customer:</strong> ${order.customer_name}</p>
                <p><strong>Email:</strong> ${order.customer_email}</p>
                <p><strong>Phone:</strong> ${order.customer_phone}</p>
                <p><strong>Payment Method:</strong> ${order.payment_method?.toUpperCase()}</p>
            </div>
            
            <h5>Order Items:</h5>
            <div style="margin: 1rem 0;">
                ${order.items.map(item => `
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e5e7eb;">
                        <span>${item.product_name}</span>
                        <span>${item.quantity} x ${formatPrice(item.product_price)} = ${formatPrice(item.total_price)}</span>
                    </div>
                `).join('')}
            </div>
            
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid #e5e7eb;">
                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.1rem;">
                    <span>Total:</span>
                    <span>${formatPrice(order.total_amount)}</span>
                </div>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
}

function hideOrderDetailsModal() {
    document.getElementById('orderDetailsModal').classList.add('hidden');
}

// Notification System
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ef4444' : 
                     type === 'warning' ? '#f59e0b' : 
                     type === 'info' ? '#3b82f6' : '#10b981'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.75rem;
        box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
        font-weight: 500;
        border: 1px solid ${type === 'error' ? '#dc2626' : 
                           type === 'warning' ? '#d97706' : 
                           type === 'info' ? '#2563eb' : '#059669'};
    `;
    notification.textContent = message;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Remove notification after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function () {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    const savedToken = localStorage.getItem('authToken');
    
    if (savedUser && savedToken) {
        currentUser = JSON.parse(savedUser);
        apiClient.setToken(savedToken);
        isLoggedIn = true;
        userRole = currentUser.role;
    }

    // Initialize the application
    showPage('home');

    // Login form handler
    document.getElementById('loginForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        await login(email, password);

        // Clear form
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
    });

    // Register form handler
    document.getElementById('registerForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        const userData = {
            name: document.getElementById('registerName').value,
            email: document.getElementById('registerEmail').value,
            phone: document.getElementById('registerPhone').value,
            password: document.getElementById('registerPassword').value
        };

        const confirmPassword = document.getElementById('confirmPassword').value;

        if (userData.password !== confirmPassword) {
            showNotification('Passwords do not match', 'error');
            return;
        }

        if (await register(userData)) {
            toggleRegister();
            document.getElementById('registerForm').reset();
        }
    });

    // Inquiry form handler
    document.getElementById('inquiryForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        const inquiryData = {
            name: document.getElementById('inquiryName').value,
            email: document.getElementById('inquiryEmail').value,
            phone: document.getElementById('inquiryPhone').value,
            subject: document.getElementById('inquirySubject').value,
            order_id: document.getElementById('inquiryOrderId').value || null,
            message:document.getElementById('inquiryMessage').value
        };

        await submitInquiry(inquiryData);
    });

    // Profile form handler
    document.getElementById('profileForm').addEventListener('submit', async function (e) {
        e.preventDefault();

        try {
            const profileData = {
                name: document.getElementById('profileName').value,
                phone: document.getElementById('profilePhone').value,
                address: document.getElementById('profileAddress').value
            };

            const updatedUser = await apiServices.auth.updateProfile(profileData);
            currentUser = updatedUser;
            showNotification('Profile updated successfully!', 'success');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });

    // Close cart when clicking outside
    document.addEventListener('click', function (e) {
        const cartSidebar = document.getElementById('cartSidebar');
        const cartBtn = document.querySelector('.cart-btn');

        if (cartSidebar && cartSidebar.classList.contains('open') &&
            !cartSidebar.contains(e.target) && !cartBtn.contains(e.target)) {
            toggleCart();
        }
    });

    // Close payment modal when clicking outside
    document.addEventListener('click', function (e) {
        const paymentModal = document.getElementById('paymentModal');
        const paymentContent = document.querySelector('.payment-content');

        if (paymentModal && !paymentModal.classList.contains('hidden') &&
            !paymentContent.contains(e.target) && e.target === paymentModal) {
            hidePaymentModal();
        }
    });

    // Close order details modal when clicking outside
    document.addEventListener('click', function (e) {
        const orderModal = document.getElementById('orderDetailsModal');
        const orderContent = orderModal?.querySelector('.payment-content');

        if (orderModal && !orderModal.classList.contains('hidden') &&
            !orderContent?.contains(e.target) && e.target === orderModal) {
            hideOrderDetailsModal();
        }
    });
});

// Make functions globally available
window.showPage = showPage;
window.showLoginForm = showLoginForm;
window.toggleRegister = toggleRegister;
window.logout = logout;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.toggleCart = toggleCart;
window.showPaymentModal = showPaymentModal;
window.hidePaymentModal = hidePaymentModal;
window.selectPaymentMethod = selectPaymentMethod;
window.confirmPayment = confirmPayment;
window.showDashboardTab = showDashboardTab;
window.showAdminTab = showAdminTab;
window.cancelOrder = cancelOrder;
window.trackOrderDetails = trackOrderDetails;
window.trackOrderById = trackOrderById;
window.showOrderDetails = showOrderDetails;
window.hideOrderDetailsModal = hideOrderDetailsModal;
window.filterProducts = filterProducts;
window.submitInquiry = submitInquiry;