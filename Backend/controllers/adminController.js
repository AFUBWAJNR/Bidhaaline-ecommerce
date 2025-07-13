const { supabase } = require('../config/supabase');

const generateProductId = () => {
    return 'PRD' + Date.now().toString().slice(-6);
};

// Product Management
const createProduct = async (req, res, next) => {
    try {
        const { name, description, price, category, stock, image_url } = req.body;
        const productId = generateProductId();

        const { data: product, error } = await supabase
            .from('products')
            .insert([{
                id: productId,
                name,
                description,
                price,
                category,
                stock,
                image_url
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            status: 'success',
            message: 'Product created successfully',
            data: { product }
        });
    } catch (error) {
        next(error);
    }
};

const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, price, category, stock, image_url } = req.body;

        const { data: product, error } = await supabase
            .from('products')
            .update({ name, description, price, category, stock, image_url })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!product) return res.status(404).json({ status: 'error', message: 'Product not found' });

        res.status(200).json({
            status: 'success',
            message: 'Product updated successfully',
            data: { product }
        });
    } catch (error) {
        next(error);
    }
};

const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data: product, error } = await supabase
            .from('products')
            .update({ is_active: false })
            .eq('id', id)
            .select('id')
            .single();

        if (error) throw error;

        if (!product) return res.status(404).json({ status: 'error', message: 'Product not found' });

        res.status(200).json({
            status: 'success',
            message: 'Product deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// - getAllOrders

const getAllOrders = async (req, res, next) => {
    try {
        const { status, search, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    id, product_id, product_name, product_price, quantity, total_price
                )`
            )
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) {
            query = query.eq('status', status);
        }

        if (search) {
            query = query.or(`id.ilike.*${search}*,customer_name.ilike.*${search}*,customer_email.ilike.*${search}*`);
        }

        const { data: orders, error } = await query;

        if (error) throw error;

        res.status(200).json({
            status: 'success',
            data: { orders }
        });
    } catch (error) {
        next(error);
    }
};

// - updateOrderStatus
const updateOrderStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const { data: order, error: updateError } = await supabase
            .from('orders')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;
        if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });

        // Add tracking description
        const statusDescriptions = {
            Confirmed: 'Your order has been confirmed and is being prepared',
            Shipped: 'Your order has been shipped and is on its way',
            Delivered: 'Your order has been delivered successfully',
            Cancelled: 'Your order has been cancelled'
        };

        const description = statusDescriptions[status] || `Order status updated to ${status}`;

        const { error: trackingError } = await supabase
            .from('order_tracking')
            .insert([{ order_id: id, status, description }]);

        if (trackingError) throw trackingError;

        res.status(200).json({
            status: 'success',
            message: 'Order status updated successfully',
            data: { order }
        });
    } catch (error) {
        next(error);
    }
};


// - getDashboardStats
const getDashboardStats = async (req, res, next) => {
    try {
        const [{ data: products }, { data: orders }, { data: revenue }, { data: pending }, { data: recent }] =
            await Promise.all([
                supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
                supabase.from('orders').select('id', { count: 'exact', head: true }),
                supabase.from('orders').select('total_amount').neq('status', 'Cancelled'),
                supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'Processing'),
                supabase
                    .from('orders')
                    .select('id, customer_name, total_amount, status, created_at')
                    .order('created_at', { ascending: false })
                    .limit(5)
            ]);

        const totalRevenue = revenue?.reduce((sum, o) => sum + o.total_amount, 0) || 0;

        res.status(200).json({
            status: 'success',
            data: {
                stats: {
                    totalProducts: products.count,
                    totalOrders: orders.count,
                    totalRevenue,
                    pendingOrders: pending.count
                },
                recentOrders: recent
            }
        });
    } catch (error) {
        next(error);
    }
};

// - getAllCustomers
const getAllCustomers = async (req, res, next) => {
    try {
        const { data: customers, error } = await supabase
            .rpc('get_all_customers_with_orders'); // Use a Supabase function (SQL view or RPC) if needed

        if (error) throw error;

        res.status(200).json({
            status: 'success',
            data: { customers }
        });
    } catch (error) {
        next(error);
    }
};

 

module.exports = {
    createProduct,
    updateProduct,
    deleteProduct,
    getAllOrders,
    updateOrderStatus,
    getDashboardStats,
    getAllCustomers
};
