// API Configuration
const API_CONFIG = {
    BASE_URL: 'http://localhost:3000/api',
    ENDPOINTS: {
        // Authentication
        AUTH: {
            LOGIN: '/auth/login',
            REGISTER: '/auth/register',
            PROFILE: '/auth/profile'
        },
        // Products
        PRODUCTS: {
            ALL: '/products',
            BY_ID: '/products/:id',
            FEATURED: '/products/featured',
            CATEGORIES: '/products/categories'
        },
        // Cart
        CART: {
            BASE: '/cart',
            ITEM: '/cart/:id'
        },
        // Orders
        ORDERS: {
            BASE: '/orders',
            BY_ID: '/orders/:id',
            CANCEL: '/orders/:id/cancel'
        },
        // Payments
        PAYMENTS: {
            MPESA_INITIATE: '/payments/mpesa/initiate',
            MPESA_STATUS: '/payments/mpesa/status/:checkoutRequestId',
            TRANSACTIONS: '/payments/transactions',
            TRANSACTION_BY_ORDER: '/payments/transactions/order/:orderId'
        },
        // Tracking
        TRACKING: {
            PUBLIC: '/tracking/:orderId',
            USER: '/tracking/user/:orderId'
        },
        // Inquiries
        INQUIRIES: {
            BASE: '/inquiries'
        },
        // Admin
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

export default API_CONFIG;