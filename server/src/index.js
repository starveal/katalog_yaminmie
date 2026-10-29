import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath} from 'url';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import productRoutes from './routes/products.js';
import storeRoutes from './routes/store.js';
import { time } from 'console';

dotenv.config()

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowwedHeaders : ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//serve static uploaded files
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

//API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/store', storeRoutes);

//Healt check endpoint
app.get('api/healt/', (req, res) => {
    res.json({
        status: 'ok',
        app: 'KatalogWa API Server',
        timestamp: new Date().toISOString() 
    });
});

//Root Route
app.get('/', (req, res) =>{
    res.json({
        messege: 'welcome to katalogWA API Server',
        endpoints: {
            auth: '/api/auth/login',
            categories: '/api/categories',
            products: '/api/products',
            stotre: '/api/store',
            health: '/api/healt'
      }
    });
});

// start server 
app.listen(PORT, () => {
    console.log(`KatalogWa API Server running on http://localhost:${PORT}`);
});