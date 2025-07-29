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

const localProducts = [
    {
        id: 'PRD001',
        name: 'Samsung Galaxy S23',
        price: 85000,
        category: 'Electronics',
        stock: 15,
        image: 'https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=300',
        description: 'Latest Samsung smartphone with advanced features'
    },
    {
        id: 'PRD002',
        name: 'Nike Air Max',
        price: 12000,
        category: 'Sports',
        stock: 25,
        image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=300',
        description: 'Comfortable running shoes for athletes'
    },
    {
        id: 'PRD003',
        name: 'MacBook Pro',
        price: 180000,
        category: 'Electronics',
        stock: 8,
        image: 'https://images.pexels.com/photos/205421/pexels-photo-205421.jpeg?auto=compress&cs=tinysrgb&w=300',
        description: 'High-performance laptop for professionals'
    },
    {
        id: 'PRD004',
        name: 'Designer Dress',
        price: 8500,
        category: 'Fashion',
        stock: 12,
        image: 'https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg?auto=compress&cs=tinysrgb&w=300',
        description: 'Elegant dress for special occasions'
    },
    {
        id: 'PRD005',
        name: 'Coffee Maker',
        price: 15000,
        category: 'Home',
        stock: 20,
        image: 'https://images.pexels.com/photos/324028/pexels-photo-324028.jpeg?auto=compress&cs=tinysrgb&w=300',
        description: 'Automatic coffee maker for perfect brew'
    },
    {
        id: 'PRD006',
        name: 'Organic Honey',
        price: 1200,
        category: 'Food',
        stock: 50,
        image: 'https://images.pexels.com/photos/1485637/pexels-photo-1485637.jpeg?auto=compress&cs=tinysrgb&w=300',
        description: 'Pure organic honey from local farmers'
    }
];

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
                throw new Error(error.message || 'Failed to fetch order tracking');
            }
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
                showAdminTab('overview'); // default tab
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
        const res = await apiClient.get('/admin/dashboard');
        const { stats, recentOrders } = res.data;

        document.getElementById('totalProducts').textContent = stats.totalProducts;
        document.getElementById('totalOrders').textContent = stats.totalOrders;
        document.getElementById('totalRevenue').textContent = `KSh ${stats.totalRevenue}`;
        document.getElementById('pendingOrders').textContent = stats.pendingOrders;

        const list = document.getElementById('recentOrdersList');
        list.innerHTML = '';
        recentOrders.forEach(order => {
            const div = document.createElement('div');
            div.classList.add('recent-order-item');
            div.innerHTML = `
                <strong>${order.customer_name}</strong><br>
                Order #${order.id} - KSh ${order.total_amount}<br>
                <small>${new Date(order.created_at).toLocaleString()}</small>
            `;
            list.appendChild(div);
        });
    } catch (err) {
        console.error('Dashboard Load Error:', err);
    }
}

async function renderAdminProducts() {
    try {
        // Try to get from API first, fallback to local data
        let products = localProducts;
        
        try {
            const response = await apiServices.products.getAllProducts();
            if (response && response.products) {
                products = response.products;
            }
        } catch (error) {
            console.log('Using local products data');
        }

        const container = document.getElementById('adminProductsList');
        if (!container) return;

        if (products.length === 0) {
            container.innerHTML = '<div class="empty-state">No products found.</div>';
            return;
        }

        container.innerHTML = products.map(product => `
            <div class="admin-product-card">
                <div class="product-image-container">
                    <img src="${product.image_url || product.image}" alt="${product.name}" 
                         onerror="this.src='https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=300'">
                </div>
                <div class="product-details">
                    <div class="product-id">${product.id}</div>
                    <h4 class="product-name">${product.name}</h4>
                    <p class="product-price">${formatPrice(product.price)}</p>
                    <p class="product-category">Category: ${product.category}</p>
                    <p class="product-stock ${getStockStatus(product.stock)}">
                        Stock: ${product.stock} ${getStockStatusText(product.stock)}
                    </p>
                    <div class="product-actions">
                        <button onclick="editProduct('${product.id}')" class="edit-btn">
                            ✏️ Edit
                        </button>
                        <button onclick="deleteProduct('${product.id}')" class="delete-btn">
                            🗑️ Delete
                        </button>
                        <button onclick="viewProductDetails('${product.id}')" class="view-btn">
                            👁️ View
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
        // Try to get from API first, fallback to local data
        let adminOrders = orders;
        
        try {
            const response = await apiClient.get(API_CONFIG.ENDPOINTS.ADMIN.ORDERS);
            if (response && response.data && response.data.orders) {
                adminOrders = response.data.orders;
            }
        } catch (error) {
            console.log('Using local orders data');
        }

        const container = document.getElementById('adminOrdersList');
        if (!container) return;

        if (adminOrders.length === 0) {
            container.innerHTML = '<div class="empty-state">No orders found.</div>';
            return;
        }

        container.innerHTML = adminOrders.map(order => `
            <div class="admin-order-card">
                <div class="order-header">
                    <div class="order-main-info">
                        <span class="order-id" onclick="showOrderDetails('${order.id}')">#${order.id}</span>
                        <span class="order-date">${new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                    <div class="order-status-section">
                        <span class="order-status status-badge status-${order.status.toLowerCase()}">${order.status}</span>
                        <select onchange="updateOrderStatus('${order.id}', this.value)" class="status-select">
                            <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                            <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                            <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                            <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </div>
                </div>
                
                <div class="order-customer-info">
                    <div><strong>Customer:</strong> ${order.customer_name}</div>
                    <div><strong>Email:</strong> ${order.customer_email}</div>
                    <div><strong>Phone:</strong> ${order.customer_phone}</div>
                    <div><strong>Payment:</strong> ${order.payment_method?.toUpperCase()}</div>
                </div>
                
                <div class="order-summary">
                    <div class="order-total"><strong>Total: ${formatPrice(order.total_amount)}</strong></div>
                    <div class="order-items-count">${order.items.length} item(s)</div>
                </div>
                
                <div class="order-actions">
                    <button onclick="showOrderDetails('${order.id}')" class="view-details-btn">
                        📋 View Details
                    </button>
                    <button onclick="adminTrackSpecificOrder('${order.id}')" class="track-btn">
                        📍 Track Order
                    </button>
                    <button onclick="printOrderInvoice('${order.id}')" class="print-btn">
                        🖨️ Print Invoice
                    </button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Failed to load admin orders:', error);
        showNotification('Failed to load orders', 'error');
    }
}
async function renderAdminTracking() {
    try {
        // Display all orders with their tracking status
        const container = document.getElementById('allOrdersTracking');
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = '<div class="empty-state">No orders to track.</div>';
            return;
        }

        container.innerHTML = `
            <div class="tracking-overview-grid">
                ${orders.map(order => `
                    <div class="tracking-overview-card">
                        <div class="tracking-card-header">
                            <span class="order-id">#${order.id}</span>
                            <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span>
                        </div>
                        <div class="tracking-card-details">
                            <div><strong>Customer:</strong> ${order.customer_name}</div>
                            <div><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</div>
                            <div><strong>Total:</strong> ${formatPrice(order.total_amount)}</div>
                        </div>
                        <div class="tracking-card-actions">
                            <button onclick="adminTrackSpecificOrder('${order.id}')" class="track-detail-btn">
                                Track Details
                            </button>
                            <button onclick="updateTrackingStatus('${order.id}')" class="update-tracking-btn">
                                Update Status
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

    } catch (error) {
        console.error('Failed to load tracking overview:', error);
        showNotification('Failed to load tracking data', 'error');
    }
}
async function adminTrackOrder() {
    try {
        const orderId = document.getElementById('adminTrackingOrderId')?.value.trim();
        if (!orderId) {
            showNotification('Please enter an order ID!', 'error');
            return;
        }

        await adminTrackSpecificOrder(orderId);
        
    } catch (error) {
        const container = document.getElementById('adminTrackingResult');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">Order not found. Please check the order ID and try again.</div>
            `;
        }
    }
}
async function adminTrackSpecificOrder(orderId) {
    try {
        const order = orders.find(o => o.id === orderId);
        
        if (!order) {
            showNotification('Order not found', 'error');
            return;
        }

        // Generate mock tracking history
        const trackingHistory = generateTrackingHistory(order);
        
        const container = document.getElementById('adminTrackingResult');
        if (!container) return;

        container.innerHTML = `
            <div class="admin-tracking-details">
                <div class="tracking-order-info">
                    <h4>Order #${order.id} Tracking</h4>
                    <div class="order-quick-info">
                        <span>Customer: ${order.customer_name}</span>
                        <span>Status: <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></span>
                        <span>Total: ${formatPrice(order.total_amount)}</span>
                    </div>
                </div>
                
                <div class="admin-tracking-timeline">
                    <h5>Tracking Timeline</h5>
                    ${trackingHistory.map(track => `
                        <div class="admin-tracking-step ${track.completed ? 'completed' : 'pending'}">
                            <div class="tracking-icon">${track.icon}</div>
                            <div class="tracking-content">
                                <div class="tracking-status">${track.status}</div>
                                <div class="tracking-description">${track.description}</div>
                                <div class="tracking-date">${track.date}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="admin-tracking-actions">
                    <button onclick="updateTrackingStatus('${orderId}')" class="update-status-btn">
                        📝 Update Status
                    </button>
                    <button onclick="addTrackingNote('${orderId}')" class="add-note-btn">
                        📄 Add Note
                    </button>
                    <button onclick="notifyCustomer('${orderId}')" class="notify-btn">
                        📧 Notify Customer
                    </button>
                </div>
            </div>
        `;

    } catch (error) {
        showNotification('Failed to load order tracking', 'error');
    }
}
function generateTrackingHistory(order) {
    const history = [
        {
            status: 'Order Placed',
            description: `Order #${order.id} has been placed successfully`,
            date: new Date(order.created_at).toLocaleDateString(),
            icon: '📝',
            completed: true
        }
    ];

    if (order.status !== 'Cancelled') {
        history.push({
            status: 'Payment Confirmed',
            description: 'Payment has been confirmed and order is being processed',
            date: new Date(order.created_at).toLocaleDateString(),
            icon: '💳',
            completed: true
        });

        if (order.status === 'Processing' || order.status === 'Shipped' || order.status === 'Delivered') {
            history.push({
                status: 'Processing',
                description: 'Order is being prepared for shipment',
                date: new Date(order.created_at).toLocaleDateString(),
                icon: '⚙️',
                completed: true
            });
        }

        if (order.status === 'Shipped' || order.status === 'Delivered') {
            history.push({
                status: 'Shipped',
                description: 'Order has been shipped and is on the way',
                date: new Date(Date.now() - 86400000).toLocaleDateString(),
                icon: '🚚',
                completed: true
            });
        }

        if (order.status === 'Delivered') {
            history.push({
                status: 'Delivered',
                description: 'Order has been delivered successfully',
                date: new Date().toLocaleDateString(),
                icon: '✅',
                completed: true
            });
        }

        // Add pending steps
        if (order.status === 'Processing') {
            history.push({
                status: 'Shipping',
                description: 'Order will be shipped soon',
                date: 'Pending',
                icon: '🚚',
                completed: false
            });
        }
        
        if (order.status !== 'Delivered') {
            history.push({
                status: 'Delivery',
                description: 'Order will be delivered to customer',
                date: 'Pending',
                icon: '✅',
                completed: false
            });
        }
    } else {
        history.push({
            status: 'Cancelled',
            description: 'Order has been cancelled',
            date: new Date().toLocaleDateString(),
            icon: '❌',
            completed: true
        });
    }

    return history;
}
function editProduct(productId) {
    const product = localProducts.find(p => p.id === productId);
    if (!product) {
        showNotification('Product not found', 'error');
        return;
    }

    // Pre-fill the form with product data
    document.getElementById('productName').value = product.name;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productStock').value = product.stock;
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productImage').value = product.image_url || product.image;

    // Change form to edit mode
    const form = document.getElementById('addProductForm');
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Update Product';
    submitBtn.onclick = function(e) {
        e.preventDefault();
        updateProduct(productId);
    };

    // Scroll to form
    document.querySelector('.add-product-section').scrollIntoView({ behavior: 'smooth' });
    showNotification('Product loaded for editing', 'info');
}

function updateProduct(productId) {
    const productIndex = localProducts.findIndex(p => p.id === productId);
    if (productIndex === -1) {
        showNotification('Product not found', 'error');
        return;
    }

    // Update product data
    localProducts[productIndex] = {
        ...localProducts[productIndex],
        name: document.getElementById('productName').value,
        price: parseFloat(document.getElementById('productPrice').value),
        category: document.getElementById('productCategory').value,
        stock: parseInt(document.getElementById('productStock').value),
        description: document.getElementById('productDescription').value,
        image: document.getElementById('productImage').value
    };

    // Reset form
    document.getElementById('addProductForm').reset();
    const submitBtn = document.querySelector('#addProductForm button[type="submit"]');
    submitBtn.textContent = 'Add Product';
    submitBtn.onclick = null;

    // Refresh products display
    renderAdminProducts();
    showNotification('Product updated successfully!', 'success');
}

function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }

    const productIndex = localProducts.findIndex(p => p.id === productId);
    if (productIndex !== -1) {
        localProducts.splice(productIndex, 1);
        renderAdminProducts();
        showNotification('Product deleted successfully!', 'success');
    } else {
        showNotification('Product not found', 'error');
    }
}

function viewProductDetails(productId) {
    const product = localProducts.find(p => p.id === productId);
    if (!product) {
        showNotification('Product not found', 'error');
        return;
    }

    // Create and show product details modal
    const modal = document.createElement('div');
    modal.className = 'payment-modal';
    modal.innerHTML = `
        <div class="payment-content">
            <div class="payment-header">
                <h3>Product Details</h3>
                <button onclick="this.closest('.payment-modal').remove()" class="close-btn">✕</button>
            </div>
            <div class="product-details-content">
                <div class="product-detail-image">
                    <img src="${product.image_url || product.image}" alt="${product.name}" 
                         onerror="this.src='https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=300'">
                </div>
                <div class="product-detail-info">
                    <h4>${product.name}</h4>
                    <p><strong>ID:</strong> ${product.id}</p>
                    <p><strong>Price:</strong> ${formatPrice(product.price)}</p>
                    <p><strong>Category:</strong> ${product.category}</p>
                    <p><strong>Stock:</strong> ${product.stock} items</p>
                    <p><strong>Status:</strong> <span class="${getStockStatus(product.stock)}">${getStockStatusText(product.stock)}</span></p>
                    ${product.description ? `<p><strong>Description:</strong> ${product.description}</p>` : ''}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Order Management Functions
async function updateOrderStatus(orderId, newStatus) {
    try {
        const orderIndex = orders.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
            orders[orderIndex].status = newStatus;
            renderAdminOrders();
            showNotification(`Order ${orderId} status updated to ${newStatus}`, 'success');
        }
    } catch (error) {
        showNotification('Failed to update order status', 'error');
    }
}

function printOrderInvoice(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) {
        showNotification('Order not found', 'error');
        return;
    }

    // Generate and print invoice
    const invoiceWindow = window.open('', '_blank');
    invoiceWindow.document.write(`
        <html>
        <head>
            <title>Invoice - Order #${order.id}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
                .order-details { margin: 20px 0; }
                .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .items-table th, .items-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                .total { text-align: right; font-weight: bold; font-size: 1.2em; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Bidhaaline</h1>
                <h2>Invoice - Order #${order.id}</h2>
            </div>
            <div class="order-details">
                <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
                <p><strong>Customer:</strong> ${order.customer_name}</p>
                <p><strong>Email:</strong> ${order.customer_email}</p>
                <p><strong>Phone:</strong> ${order.customer_phone}</p>
                <p><strong>Status:</strong> ${order.status}</p>
            </div>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items.map(item => `
                        <tr>
                            <td>${item.product_name}</td>
                            <td>${item.quantity}</td>
                            <td>${formatPrice(item.product_price)}</td>
                            <td>${formatPrice(item.total_price)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="total">
                <p>Total: ${formatPrice(order.total_amount)}</p>
            </div>
        </body>
        </html>
    `);
    invoiceWindow.document.close();
    invoiceWindow.print();
}

// Filter Functions
function filterAdminProducts() {
    const searchTerm = document.getElementById('adminProductSearch')?.value.toLowerCase() || '';
    const category = document.getElementById('adminCategoryFilter')?.value || '';
    
    let filteredProducts = [...localProducts];
    
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.id.toLowerCase().includes(searchTerm)
        );
    }
    
    if (category) {
        filteredProducts = filteredProducts.filter(product => product.category === category);
    }
    
    // Update display (you can implement this to show filtered results)
    renderAdminProducts();
}

function filterOrders() {
    const status = document.getElementById('orderStatusFilter')?.value || '';
    const searchTerm = document.getElementById('orderSearchInput')?.value.toLowerCase() || '';
    
    // Filter logic here - you can implement this to show filtered orders
    renderAdminOrders();
}

// Add Product Form Handler
document.addEventListener('DOMContentLoaded', function() {
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        addProductForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const newProduct = {
                id: generateProductId(),
                name: document.getElementById('productName').value,
                price: parseFloat(document.getElementById('productPrice').value),
                category: document.getElementById('productCategory').value,
                stock: parseInt(document.getElementById('productStock').value),
                description: document.getElementById('productDescription').value,
                image: document.getElementById('productImage').value
            };
            
            localProducts.push(newProduct);
            addProductForm.reset();
            renderAdminProducts();
            showNotification('Product added successfully!', 'success');
        });
    }
});

// Additional helper functions for tracking
function updateTrackingStatus(orderId) {
    const newStatus = prompt('Enter new status (Processing, Shipped, Delivered, Cancelled):');
    if (newStatus) {
        updateOrderStatus(orderId, newStatus);
    }
}

function addTrackingNote(orderId) {
    const note = prompt('Add tracking note:');
    if (note) {
        showNotification('Tracking note added', 'success');
    }
}

function notifyCustomer(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (order) {
        showNotification(`Customer ${order.customer_name} has been notified about order ${orderId}`, 'success');
    }
}

async function renderAdminCustomers() {
    try {
        const res = await apiClient.get('/admin/customers');
        const customers = res.data.customers;
        const list = document.getElementById('customersList');
        list.innerHTML = '';

        customers.forEach(customer => {
            const div = document.createElement('div');
            div.classList.add('customer-card');
            div.innerHTML = `
                <h4>${customer.name}</h4>
                <p>Email: ${customer.email}</p>
                <p>Phone: ${customer.phone}</p>
                <p>Total Orders: ${customer.total_orders}</p>
                <p>Total Spent: KSh ${customer.total_spent}</p>
            `;
            list.appendChild(div);
        });
    } catch (err) {
        console.error('Customer Load Error:', err);
    }
}

function showAdminTab(tabName) {
    // Update sidebar buttons
    document.querySelectorAll('.sidebar-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    // Update tab content visibility
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    const activeTab = document.getElementById(tabName + 'Tab');
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
            message: document.getElementById('inquiryMessage').value
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

window.renderAdminProducts = renderAdminProducts;
window.renderAdminOrders = renderAdminOrders;
window.renderAdminTracking = renderAdminTracking;
window.adminTrackOrder = adminTrackOrder;
window.adminTrackSpecificOrder = adminTrackSpecificOrder;
window.editProduct = editProduct;
window.updateProduct = updateProduct;
window.deleteProduct = deleteProduct;
window.viewProductDetails = viewProductDetails;
window.updateOrderStatus = updateOrderStatus;
window.printOrderInvoice = printOrderInvoice;
window.filterAdminProducts = filterAdminProducts;
window.filterOrders = filterOrders;
window.updateTrackingStatus = updateTrackingStatus;
window.addTrackingNote = addTrackingNote;
window.notifyCustomer = notifyCustomer;