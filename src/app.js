import express from 'express';
const app = express();
import cors from 'cors';
import rateLimit from 'express-rate-limit';

app.use(express.json());

app.use(cors({
    origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
    methods: ["GET", "PUT", "POST", "DELETE", "PATCH"],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiter for OTP endpoints: max 3 requests per 15 minutes per IP
export const otpRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many OTP requests. Please try again after 15 minutes."
    }
});

import authRoutes from './routes/authRoutes.js';
app.use('/auth', authRoutes);

export default app;
