
import express from 'express';
import cors from 'cors';
import { uploadsDir } from './utils/uploads.js';

import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import productRoutes from './routes/products.js';
import storeRoutes from './routes/store.js';
import orderRoutes from './routes/orders.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploaded files
app.use('/uploads', express.static(uploadsDir, {
    index: false,
    maxAge: '1d'
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/orders', orderRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        app: 'Katalog Yaminmie API Server',
        timestamp: new Date().toISOString()
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Katalog Yaminmie API Server',
        endpoints: {
            auth: '/api/auth/login',
            categories: '/api/categories',
            products: '/api/products',
            orders: '/api/orders',
            store: '/api/store',
            health: '/api/health'
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Katalog Yaminmie API Server running on http://localhost:${PORT}`);
});
