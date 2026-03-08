import express from 'express';
const app = express();
import cors from 'cors';


app.use(express.json());

app.use(cors({
    origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5100',
    methods: ["GET", "PUT", "POST", "DELETE", "PATCH"],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiter for OTP endpoints: max 5 requests per 15 minutes per IP

import authRoutes from './routes/authRoutes.js';
app.use('/auth', authRoutes);

export default app;
