
// Global variables
let currentUser = null;
let currentPage = 'home';
let cart = [];
let products = [];
let orders = [];
let isLoggedIn = false;
let userRole = 'customer';

// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Utility Functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease-out;
    `;
    
    // Set background color based on type
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// API Client
class ApiClient {
    constructor() {
        this.baseURL = API_BASE_URL;
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

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
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
}

const apiClient = new ApiClient();

// Authentication Functions
async function login(email, password) {
    try {
        const response = await apiClient.post('/auth/login', { email, password });
        
        if (response.status === 'success') {
            currentUser = response.data.user;
            apiClient.setToken(response.data.token);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            isLoggedIn = true;
            userRole = currentUser.role;
            
            showNotification('Login successful!', 'success');
            
            if (userRole === 'admin') {
                showPage('admin');
            } else {
                showPage('dashboard');
            }
            
            return true;
        }
    } catch (error) {
        showNotification(error.message || 'Login failed', 'error');
        return false;
    }
}

async function register(userData) {
    try {
        const response = await apiClient.post('/auth/register', userData);
        
        if (response.status === 'success') {
            currentUser = response.data.user;
            apiClient.setToken(response.data.token);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            isLoggedIn = true;
            userRole = currentUser.role;
            
            showNotification('Registration successful!', 'success');
            showPage('dashboard');
            return true;
        }
    } catch (error) {
        showNotification(error.message || 'Registration failed', 'error');
        return false;
    }
}

function logout() {
    currentUser = null;
    isLoggedIn = false;
    userRole = 'customer';
    cart = [];
    apiClient.setToken(null);
    localStorage.removeItem('currentUser');
    showNotification('Logged out successfully', 'info');
    showPage('home');
}

// Product Functions
async function loadFeaturedProducts() {
    try {
        const response = await apiClient.get('/products/featured');
        if (response.status === 'success') {
            renderFeaturedProducts(response.data.products);
        }
    } catch (error) {
        console.error('Error loading featured products:', error);
        // Fallback to sample data
        renderFeaturedProducts(getSampleProducts().slice(0, 6));
    }
}

async function loadAllProducts(filters = {}) {
    try {
        const queryParams = new URLSearchParams();
        if (filters.category) queryParams.append('category', filters.category);
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.page) queryParams.append('page', filters.page);
        if (filters.limit) queryParams.append('limit', filters.limit);

        const endpoint = `/products?${queryParams.toString()}`;
        const response = await apiClient.get(endpoint);
        
        if (response.status === 'success') {
            products = response.data.products;
            renderProducts(products);
            return products;
        }
    } catch (error) {
        console.error('Error loading products:', error);
        // Fallback to sample data
        products = getSampleProducts();
        renderProducts(products);
        return products;
    }
}

// Admin Functions
async function loadAdminDashboard() {
    try {
        const response = await apiClient.get('/admin/dashboard');
        if (response.status === 'success') {
            updateAdminStats(response.data.stats);
            renderRecentOrders(response.data.recentOrders);
        }
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        showNotification('Error loading dashboard data', 'error');
    }
}

async function loadAdminProducts() {
    try {
        const response = await apiClient.get('/products?page=1&limit=50');
        if (response.status === 'success') {
            renderAdminProducts(response.data.products);
        }
    } catch (error) {
        console.error('Error loading admin products:', error);
        showNotification('Error loading products', 'error');
    }
}

async function loadAdminOrders() {
    try {
        const response = await apiClient.get('/admin/orders');
        if (response.status === 'success') {
            renderAdminOrders(response.data.orders);
        }
    } catch (error) {
        console.error('Error loading admin orders:', error);
        showNotification('Error loading orders', 'error');
    }
}

async function createProduct(productData) {
    try {
        const response = await apiClient.post('/admin/products', productData);
        if (response.status === 'success') {
            showNotification('Product created successfully!', 'success');
            loadAdminProducts(); // Reload products list
            document.getElementById('addProductForm').reset();
            return true;
        }
    } catch (error) {
        showNotification(error.message || 'Error creating product', 'error');
        return false;
    }
}

async function updateOrderStatus(orderId, status) {
    try {
        const response = await apiClient.patch(`/admin/orders/${orderId}/status`, { status });
        if (response.status === 'success') {
            showNotification('Order status updated successfully!', 'success');
            loadAdminOrders(); // Reload orders list
            return true;
        }
    } catch (error) {
        showNotification(error.message || 'Error updating order status', 'error');
        return false;
    }
}

// Cart Functions
async function addToCart(productId, quantity = 1) {
    if (!isLoggedIn) {
        showNotification('Please login to add items to cart', 'warning');
        return;
    }

    try {
        const response = await apiClient.post('/cart', {
            product_id: productId,
            quantity: quantity
        });
        
        if (response.status === 'success') {
            showNotification('Item added to cart!', 'success');
            await updateCartDisplay();
        }
    } catch (error) {
        showNotification(error.message || 'Error adding to cart', 'error');
    }
}

async function updateCartDisplay() {
    if (!isLoggedIn) return;

    try {
        const response = await apiClient.get('/cart');
        if (response.status === 'success') {
            cart = response.data.cartItems;
            renderCart();
            updateCartCount();
        }
    } catch (error) {
        console.error('Error updating cart:', error);
    }
}

// Page Navigation
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    const targetPage = document.getElementById(pageId + 'Page');
    if (targetPage) {
        targetPage.classList.add('active');
        currentPage = pageId;
    }

    // Update navigation
    updateNavigation();

    // Load page-specific data
    switch (pageId) {
        case 'home':
            loadFeaturedProducts();
            break;
        case 'dashboard':
            if (isLoggedIn) {
                loadAllProducts();
                updateCartDisplay();
            }
            break;
        case 'admin':
            if (isLoggedIn && userRole === 'admin') {
                loadAdminDashboard();
                showAdminTab('overview');
            }
            break;
    }
}

function showLoginForm(type) {
    currentPage = 'login';
    showPage('login');
    
    const subtitle = document.getElementById('loginSubtitle');
    const demoCredentials = document.getElementById('demoCredentials');
    
    if (type === 'admin') {
        subtitle.textContent = 'Admin Access';
        demoCredentials.style.display = 'block';
    } else {
        subtitle.textContent = 'Customer Login';
        demoCredentials.style.display = 'block';
    }
}

function showDashboardTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all sidebar buttons
    document.querySelectorAll('.sidebar-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    const targetTab = document.getElementById(tabName + 'Tab');
    if (targetTab) {
        targetTab.classList.add('active');
    }

    // Add active class to clicked button
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    // Load tab-specific data
    switch (tabName) {
        case 'products':
            loadAllProducts();
            break;
        case 'orders':
            loadUserOrders();
            break;
    }
}

function showAdminTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all sidebar buttons
    document.querySelectorAll('.sidebar-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    const targetTab = document.getElementById(tabName + 'Tab') || document.getElementById('admin' + tabName.charAt(0).toUpperCase() + tabName.slice(1) + 'Tab');
    if (targetTab) {
        targetTab.classList.add('active');
    }

    // Add active class to clicked button
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    // Load tab-specific data
    switch (tabName) {
        case 'overview':
            loadAdminDashboard();
            break;
        case 'products':
            loadAdminProducts();
            break;
        case 'orders':
            loadAdminOrders();
            break;
        case 'tracking':
            loadAllOrdersTracking();
            break;
        case 'customers':
            loadCustomers();
            break;
    }
}

// Render Functions
function renderFeaturedProducts(productList) {
    const container = document.getElementById('featuredProducts');
    if (!container) return;

    if (!productList || productList.length === 0) {
        container.innerHTML = '<div class="empty-state">No featured products available</div>';
        return;
    }

    container.innerHTML = productList.map(product => `
        <div class="product-card">
            <div class="product-id">${product.id}</div>
            <div class="stock-status ${getStockStatus(product.stock)}">${getStockText(product.stock)}</div>
            <img src="${product.image_url}" alt="${product.name}" class="product-image" onerror="this.src='https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=300'">
            <div class="product-info">
                <h4 class="product-name">${product.name}</h4>
                <p class="product-price">KSh ${parseFloat(product.price).toLocaleString()}</p>
                <p class="product-stock">Stock: ${product.stock} units</p>
                <button onclick="addToCart('${product.id}')" class="add-to-cart-btn" ${product.stock <= 0 ? 'disabled' : ''}>
                    ${product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
            </div>
        </div>
    `).join('');
}

function renderProducts(productList) {
    const container = document.getElementById('allProducts');
    if (!container) return;

    if (!productList || productList.length === 0) {
        container.innerHTML = '<div class="empty-state">No products found</div>';
        return;
    }

    container.innerHTML = productList.map(product => `
        <div class="product-card">
            <div class="product-id">${product.id}</div>
            <div class="stock-status ${getStockStatus(product.stock)}">${getStockText(product.stock)}</div>
            <img src="${product.image_url}" alt="${product.name}" class="product-image" onerror="this.src='https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=300'">
            <div class="product-info">
                <h4 class="product-name">${product.name}</h4>
                <p class="product-price">KSh ${parseFloat(product.price).toLocaleString()}</p>
                <p class="product-stock">Stock: ${product.stock} units</p>
                <button onclick="addToCart('${product.id}')" class="add-to-cart-btn" ${product.stock <= 0 ? 'disabled' : ''}>
                    ${product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
            </div>
        </div>
    `).join('');
}

function renderAdminProducts(productList) {
    const container = document.getElementById('adminProductsList');
    if (!container) return;

    if (!productList || productList.length === 0) {
        container.innerHTML = '<div class="empty-state">No products found</div>';
        return;
    }

    container.innerHTML = productList.map(product => `
        <div class="product-card">
            <div class="product-id">${product.id}</div>
            <div class="stock-status ${getStockStatus(product.stock)}">${getStockText(product.stock)}</div>
            <img src="${product.image_url}" alt="${product.name}" class="product-image" onerror="this.src='https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=300'">
            <div class="product-info">
                <h4 class="product-name">${product.name}</h4>
                <p class="product-price">KSh ${parseFloat(product.price).toLocaleString()}</p>
                <p class="product-stock">Stock: ${product.stock} units</p>
                <div class="product-actions" style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                    <button onclick="editProduct('${product.id}')" class="edit-product-btn">Edit</button>
                    <button onclick="deleteProduct('${product.id}')" class="remove-product-btn">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderAdminOrders(orderList) {
    const container = document.getElementById('adminOrdersList');
    if (!container) return;

    if (!orderList || orderList.length === 0) {
        container.innerHTML = '<div class="empty-state">No orders found</div>';
        return;
    }

    container.innerHTML = orderList.map(order => `
        <div class="order-card">
            <div class="order-header">
                <span class="order-id" onclick="viewOrderDetails('${order.id}')">${order.id}</span>
                <span class="order-date">${new Date(order.created_at).toLocaleDateString()}</span>
            </div>
            <div class="order-customer">
                <strong>Customer:</strong> ${order.customer_name} (${order.customer_email})
            </div>
            <div class="order-status">
                <strong>Status:</strong> 
                <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span>
            </div>
            <div class="order-total">
                <strong>Total:</strong> KSh ${parseFloat(order.total_amount).toLocaleString()}
            </div>
            ${order.items && order.items.length > 0 ? `
                <div class="order-items">
                    <strong>Items:</strong>
                    <ul>
                        ${order.items.map(item => `
                            <li>${item.product_name} x${item.quantity} - KSh ${parseFloat(item.total_price).toLocaleString()}</li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
            <div class="order-actions">
                <select onchange="updateOrderStatus('${order.id}', this.value)" class="status-select">
                    <option value="">Change Status</option>
                    <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                    <option value="Confirmed" ${order.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
                <button onclick="trackOrder('${order.id}')" class="track-order-btn">Track</button>
            </div>
        </div>
    `).join('');
}

function updateAdminStats(stats) {
    if (!stats) return;

    const elements = {
        totalProducts: document.getElementById('totalProducts'),
        totalOrders: document.getElementById('totalOrders'),
        totalRevenue: document.getElementById('totalRevenue'),
        pendingOrders: document.getElementById('pendingOrders')
    };

    if (elements.totalProducts) elements.totalProducts.textContent = stats.totalProducts || 0;
    if (elements.totalOrders) elements.totalOrders.textContent = stats.totalOrders || 0;
    if (elements.totalRevenue) elements.totalRevenue.textContent = `KSh ${(stats.totalRevenue || 0).toLocaleString()}`;
    if (elements.pendingOrders) elements.pendingOrders.textContent = stats.pendingOrders || 0;
}

function renderRecentOrders(orderList) {
    const container = document.getElementById('recentOrdersList');
    if (!container) return;

    if (!orderList || orderList.length === 0) {
        container.innerHTML = '<div class="empty-state">No recent orders</div>';
        return;
    }

    container.innerHTML = orderList.map(order => `
        <div class="recent-order-item" style="padding: 1rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong>${order.id}</strong><br>
                <small>${order.customer_name}</small>
            </div>
            <div>
                <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span>
            </div>
            <div>
                <strong>KSh ${parseFloat(order.total_amount).toLocaleString()}</strong>
            </div>
        </div>
    `).join('');
}

// Utility Functions
function getStockStatus(stock) {
    if (stock <= 0) return 'out-of-stock';
    if (stock <= 5) return 'low-stock';
    return 'in-stock';
}

function getStockText(stock) {
    if (stock <= 0) return 'Out of Stock';
    if (stock <= 5) return 'Low Stock';
    return 'In Stock';
}

function getSampleProducts() {
    return [
        {
            id: 'PRD001',
            name: 'Premium Wireless Headphones',
            description: 'High-quality wireless headphones with noise cancellation',
            price: 12500.00,
            category: 'Electronics',
            stock: 15,
            image_url: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=300'
        },
        {
            id: 'PRD002',
            name: 'Smart Fitness Watch',
            description: 'Advanced fitness tracking with heart rate monitor',
            price: 18750.00,
            category: 'Electronics',
            stock: 8,
            image_url: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=300'
        },
        {
            id: 'PRD003',
            name: 'Organic Coffee Beans',
            description: 'Premium organic coffee beans from Kenya',
            price: 1875.00,
            category: 'Food',
            stock: 25,
            image_url: 'https://images.pexels.com/photos/894695/pexels-photo-894695.jpeg?auto=compress&cs=tinysrgb&w=300'
        }
    ];
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
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
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            await login(email, password);
        });
    }

    // Register form handler
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
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
            
            await register(userData);
        });
    }

    // Add product form handler
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        addProductForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const productData = {
                name: document.getElementById('productName').value,
                description: document.getElementById('productDescription').value,
                price: parseFloat(document.getElementById('productPrice').value),
                category: document.getElementById('productCategory').value,
                stock: parseInt(document.getElementById('productStock').value),
                image_url: document.getElementById('productImage').value
            };
            await createProduct(productData);
        });
    }

    // Inquiry form handler
    const inquiryForm = document.getElementById('inquiryForm');
    if (inquiryForm) {
        inquiryForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const inquiryData = {
                name: document.getElementById('inquiryName').value,
                email: document.getElementById('inquiryEmail').value,
                phone: document.getElementById('inquiryPhone').value,
                subject: document.getElementById('inquirySubject').value,
                order_id: document.getElementById('inquiryOrderId').value,
                message: document.getElementById('inquiryMessage').value
            };
            
            try {
                const response = await apiClient.post('/inquiries', inquiryData);
                if (response.status === 'success') {
                    showNotification('Inquiry submitted successfully!', 'success');
                    inquiryForm.reset();
                }
            } catch (error) {
                showNotification(error.message || 'Error submitting inquiry', 'error');
            }
        });
    }
});

// Global functions for HTML onclick handlers
function toggleRegister() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm.classList.contains('hidden')) {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    }
}

function updateNavigation() {
    // Update navigation based on login status
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => btn.classList.remove('active'));
    
    // Add active class to current page button
    const currentBtn = document.querySelector(`[onclick="showPage('${currentPage}')"]`);
    if (currentBtn) {
        currentBtn.classList.add('active');
    }
}

// Additional admin functions
async function loadAllOrdersTracking() {
    try {
        const response = await apiClient.get('/admin/orders');
        if (response.status === 'success') {
            renderAllOrdersTracking(response.data.orders);
        }
    } catch (error) {
        console.error('Error loading orders tracking:', error);
        showNotification('Error loading tracking data', 'error');
    }
}

function renderAllOrdersTracking(orderList) {
    const container = document.getElementById('allOrdersTracking');
    if (!container) return;

    if (!orderList || orderList.length === 0) {
        container.innerHTML = '<div class="empty-state">No orders to track</div>';
        return;
    }

    container.innerHTML = orderList.map(order => `
        <div class="tracking-overview-item">
            <div>
                <strong>${order.id}</strong><br>
                <small>${order.customer_name}</small>
            </div>
            <div>
                <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span>
            </div>
            <div>
                <button onclick="trackOrder('${order.id}')" class="track-order-btn">View Tracking</button>
            </div>
        </div>
    `).join('');
}

async function loadCustomers() {
    try {
        const response = await apiClient.get('/admin/customers');
        if (response.status === 'success') {
            renderCustomers(response.data.customers);
        }
    } catch (error) {
        console.error('Error loading customers:', error);
        showNotification('Error loading customers', 'error');
    }
}

function renderCustomers(customerList) {
    const container = document.getElementById('customersList');
    if (!container) return;

    if (!customerList || customerList.length === 0) {
        container.innerHTML = '<div class="empty-state">No customers found</div>';
        return;
    }

    container.innerHTML = customerList.map(customer => `
        <div class="customer-card">
            <h5>${customer.name}</h5>
            <p><strong>Email:</strong> ${customer.email}</p>
            <p><strong>Phone:</strong> ${customer.phone || 'Not provided'}</p>
            <p><strong>Total Orders:</strong> ${customer.total_orders || 0}</p>
            <p><strong>Total Spent:</strong> KSh ${(customer.total_spent || 0).toLocaleString()}</p>
            <p><strong>Joined:</strong> ${new Date(customer.created_at).toLocaleDateString()}</p>
        </div>
    `).join('');
}

// Cart functions
function renderCart() {
    const container = document.getElementById('cartItems');
    if (!container) return;

    if (!cart || cart.length === 0) {
        container.innerHTML = '<div class="empty-state">Your cart is empty</div>';
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image_url}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">KSh ${parseFloat(item.price).toLocaleString()}</div>
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="updateCartQuantity('${item.id}', ${item.quantity - 1})">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateCartQuantity('${item.id}', ${item.quantity + 1})">+</button>
                    <button class="remove-btn" onclick="removeFromCart('${item.id}')">×</button>
                </div>
            </div>
        </div>
    `).join('');

    updateCartTotals();
}

function updateCartCount() {
    const countElement = document.getElementById('cartCount');
    if (countElement) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        countElement.textContent = totalItems;
        countElement.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

function updateCartTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.16;
    const total = subtotal + tax;

    const subtotalElement = document.getElementById('subtotal');
    const taxElement = document.getElementById('tax');
    const totalElement = document.getElementById('total');

    if (subtotalElement) subtotalElement.textContent = `KSh ${subtotal.toLocaleString()}`;
    if (taxElement) taxElement.textContent = `KSh ${tax.toLocaleString()}`;
    if (totalElement) totalElement.textContent = `KSh ${total.toLocaleString()}`;
}

function toggleCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    if (cartSidebar) {
        cartSidebar.classList.toggle('open');
    }
}

// Additional utility functions
async function trackOrder(orderId) {
    try {
        const response = await apiClient.get(`/tracking/${orderId}`);
        if (response.status === 'success') {
            displayOrderTracking(response.data);
        }
    } catch (error) {
        showNotification('Error loading order tracking', 'error');
    }
}

function displayOrderTracking(trackingData) {
    // This would open a modal or navigate to tracking page
    console.log('Tracking data:', trackingData);
    showNotification('Tracking information loaded', 'info');
}

async function editProduct(productId) {
    // This would open an edit modal
    showNotification('Edit product functionality coming soon', 'info');
}

async function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            const response = await apiClient.delete(`/admin/products/${productId}`);
            if (response.status === 'success') {
                showNotification('Product deleted successfully!', 'success');
                loadAdminProducts();
            }
        } catch (error) {
            showNotification(error.message || 'Error deleting product', 'error');
        }
    }
}

// Filter functions
function filterProducts() {
    const searchTerm = document.getElementById('productSearch')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    
    loadAllProducts({
        search: searchTerm,
        category: categoryFilter,
        page: 1,
        limit: 12
    });
}

function filterAdminProducts() {
    const searchTerm = document.getElementById('adminProductSearch')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('adminCategoryFilter')?.value || '';
    
    loadAllProducts({
        search: searchTerm,
        category: categoryFilter,
        page: 1,
        limit: 50
    }).then(products => {
        if (products) {
            renderAdminProducts(products);
        }
    });
}

function filterOrders() {
    const statusFilter = document.getElementById('orderStatusFilter')?.value || '';
    const searchTerm = document.getElementById('orderSearchInput')?.value || '';
    
    // This would call the API with filters
    loadAdminOrders();
}

// Initialize welcome message
function updateWelcomeMessage() {
    const welcomeElement = document.getElementById('welcomeUser');
    if (welcomeElement && currentUser) {
        welcomeElement.textContent = `Welcome, ${currentUser.name}`;
    }
}

// Call this when user logs in
function onLoginSuccess() {
    updateWelcomeMessage();
    updateCartDisplay();
}

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