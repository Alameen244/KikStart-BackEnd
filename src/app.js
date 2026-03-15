import express from 'express';
const app = express();
import cors from 'cors';

import './Jobs/cloudinaryCleanup.job.js';
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5100',
    methods: ["GET", "PUT", "POST", "DELETE", "PATCH"],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiter for OTP endpoints: max 5 requests per 15 minutes per IP

import authRoutes from './routes/authRoutes.js';
import imageRoutes from './routes/imageRoutes.js';
import bannerRoutes from './routes/homeRoutes/bannerRoutes.js';
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/image', imageRoutes);
app.use('/api/v1/banner', bannerRoutes);

export default app;
