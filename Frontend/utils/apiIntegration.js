let currentUser = null;
let currentPage = 'home';
let currentLoginType = null;
let cart = [];
let orders = [];
let customers = [];
let selectedPaymentMethod = 'mpesa';
let currentOrderId = null;

// Import all services
import authService from '../api/authService.js';
import productService from '../api/productService.js';
import cartService from '../api/cartService.js';
import orderService from '../api/orderService.js';
import paymentService from '../api/paymentService.js';
import trackingService from '../api/trackingService.js';
import inquiryService from '../api/inquiryService.js';
import adminService from '../api/adminService.js';


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


// Updated global functions to use API services
window.apiServices = {
    auth: authService,
    products: productService,
    cart: cartService,
    orders: orderService,
    payments: paymentService,
    tracking: trackingService,
    inquiries: inquiryService,
    admin: adminService
};


// Updated authentication functions
async function login(email, password) {
    try {
        const userData = await authService.login(email, password);
        currentUser = userData.user;
        
        if (currentUser.role === 'admin') {
            showPage('admin');
        } else {
            showPage('dashboard');
        }
        
        showNotification('Login successful!');
        return true;
    } catch (error) {
        showNotification(error.message, 'error');
        return false;
    }
}

async function register(userData) {
    try {
        const result = await authService.register(userData);
        currentUser = result.user;
        showNotification('Registration successful!');
        return true;
    } catch (error) {
        showNotification(error.message, 'error');
        return false;
    }
}

function logout() {
    authService.logout();
    currentUser = null;
    currentLoginType = null;
    cart = [];
    showPage('home');
    updateCartDisplay();
    showNotification('Logged out successfully!');
}

// Updated product functions
async function renderFeaturedProducts() {
    try {
        const products = await productService.getFeaturedProducts();
        const container = document.getElementById('featuredProducts');
        if (!container) return;
        
        container.innerHTML = products.map(product => `
            <div class="product-card fade-in">
                <div class="product-id">${product.id}</div>
                <div class="stock-status ${getStockStatus(product.stock)}">${getStockStatusText(product.stock)}</div>
                <img src="${product.image_url}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <h4 class="product-name">${product.name}</h4>
                    <p class="product-price">${formatPrice(product.price)}</p>
                    <p class="product-stock">Stock: ${product.stock} items</p>
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
        
        const data = await productService.getAllProducts({
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
                <img src="${product.image_url}" alt="${product.name}" class="product-image">
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

// Updated cart functions
async function addToCart(productId) {
    try {
        if (!authService.isAuthenticated()) {
            showNotification('Please login to add items to cart', 'error');
            return;
        }
        
        await cartService.addToCart(productId, 1);
        await updateCartDisplay();
        showNotification('Product added to cart!');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function updateCartDisplay() {
    try {
        if (!authService.isAuthenticated()) {
            const cartCount = document.getElementById('cartCount');
            if (cartCount) {
                cartCount.textContent = '0';
                cartCount.style.display = 'none';
            }
            return;
        }

        const cartData = await cartService.getCart();
        const cartCount = document.getElementById('cartCount');

        if (cartCount) {
            cartCount.textContent = cartData.summary.itemCount;
            cartCount.style.display = cartData.summary.itemCount > 0 ? 'flex' : 'none';
        }

        
        window.cart = cartData.cartItems.map(item => ({
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

 
async function renderCartItems() {
    try {
        if (!authService.isAuthenticated()) {
            const container = document.getElementById('cartItems');
            if (container) {
                container.innerHTML = '<div class="empty-state">Please login to view cart</div>';
            }
            return;
        }
        
        const cartData = await cartService.getCart();
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
        
        await cartService.updateCartItem(cartItemId, quantity);
        await updateCartDisplay();
        await renderCartItems();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function removeFromCart(cartItemId) {
    try {
        await cartService.removeFromCart(cartItemId);
        await updateCartDisplay();
        await renderCartItems();
        showNotification('Item removed from cart');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Updated order functions
async function confirmPayment() {
    try {
        const customerPhone = document.getElementById('customerPhone')?.value;
        if (!customerPhone) {
            showNotification('Please enter your phone number!', 'error');
            return;
        }
        
        // Get current cart
        const cartData = await cartService.getCart();
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
        
        const order = await orderService.createOrder(orderData);
        
        // If M-Pesa payment, initiate STK push
        if (selectedPaymentMethod === 'mpesa') {
            try {
                const paymentResult = await paymentService.initiateMpesaPayment(
                    order.id,
                    customerPhone,
                    cartData.summary.total
                );
                
                showNotification('M-Pesa payment request sent to your phone. Please enter your PIN to complete payment.');
                
                // Poll for payment status
                paymentService.pollPaymentStatus(paymentResult.checkoutRequestId)
                    .then(result => {
                        if (result.localTransaction.status === 'success') {
                            showNotification('Payment successful! Your order has been confirmed.');
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
        
        showNotification(`Order placed successfully! Order ID: ${order.id}`);
        await renderOrders();
        
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function renderOrders() {
    try {
        if (!authService.isAuthenticated()) return;
        
        const orders = await orderService.getUserOrders();
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
            await orderService.cancelOrder(orderId);
            showNotification('Order cancelled successfully!');
            await renderOrders();
            await renderAllProducts(); // Refresh products to show updated stock
        }
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Updated tracking functions
async function trackOrderById() {
    try {
        const orderId = document.getElementById('trackingOrderId').value.trim();
        if (!orderId) {
            showNotification('Please enter an order ID!', 'error');
            return;
        }
        
        const trackingData = await trackingService.getOrderTracking(orderId);
        displayOrderTracking(trackingData);
        
    } catch (error) {
        document.getElementById('trackingResult').innerHTML = `
            <div class="empty-state">Order not found. Please check the order ID and try again.</div>
        `;
    }
}

async function trackOrderDetails(orderId) {
    try {
        const trackingData = await trackingService.getUserOrderTracking(orderId);
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

// Updated inquiry function
async function submitInquiry(inquiryData) {
    try {
        await inquiryService.submitInquiry(inquiryData);
        showNotification('Inquiry submitted successfully! We will get back to you soon.');
        
        // Clear form
        document.getElementById('inquiryForm').reset();
        
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Initialize API integration when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    if (authService.isAuthenticated()) {
        currentUser = authService.getCurrentUser();
        updateCartDisplay();
    }
    
    // Update existing form handlers to use API
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        await login(email, password);
        
        // Clear form
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
    });
    
    document.getElementById('registerForm').addEventListener('submit', async function(e) {
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
    
    document.getElementById('inquiryForm').addEventListener('submit', async function(e) {
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
    
    document.getElementById('profileForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        try {
            const profileData = {
                name: document.getElementById('profileName').value,
                phone: document.getElementById('profilePhone').value,
                address: document.getElementById('profileAddress').value
            };
            
            const updatedUser = await authService.updateProfile(profileData);
            currentUser = updatedUser;
            showNotification('Profile updated successfully!');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });
    showPage('home');
});

// Export functions for global use
window.login = login;
window.register = register;
window.logout = logout;
window.renderFeaturedProducts = renderFeaturedProducts;
window.renderAllProducts = renderAllProducts;
window.addToCart = addToCart;
window.updateCartDisplay = updateCartDisplay;
window.renderCartItems = renderCartItems;
window.updateCartQuantity = updateCartQuantity;
window.removeFromCart = removeFromCart;
window.confirmPayment = confirmPayment;
window.renderOrders = renderOrders;
window.cancelOrder = cancelOrder;
window.trackOrderById = trackOrderById;
window.trackOrderDetails = trackOrderDetails;
window.submitInquiry = submitInquiry;