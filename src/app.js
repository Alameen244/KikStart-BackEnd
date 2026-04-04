import express from 'express';
const app = express();
import cors from 'cors';

import './Jobs/cloudinaryCleanup.job.js';
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5100'];

        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS blocked: ${origin} is not allowed`));
        }
    },
    methods: ["GET", "PUT", "POST", "DELETE", "PATCH"],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Rate limiter for OTP endpoints: max 5 requests per 15 minutes per IP

import authRoutes from './routes/authRoutes.js';
import imageRoutes from './routes/imageRoutes.js';
import bannerRoutes from './routes/homeRoutes/bannerRoutes.js';
import whoRoutes from './routes/homeRoutes/whoRoutes.js';
import testimonialRoutes from './routes/homeRoutes/testimonialRoutes.js';
import gymCardSectionRoutes from './routes/homeRoutes/gymCardSectionRoutes.js';
import faqSectionRoutes from './routes/homeRoutes/faqSectionRoutes.js';
import programRoutes from './routes/homeRoutes/programRoutes.js';
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/image', imageRoutes);
app.use('/api/v1/banner', bannerRoutes);
app.use('/api/v1/who', whoRoutes);
app.use('/api/v1/testimonials', testimonialRoutes);
app.use('/api/v1/gym-cards', gymCardSectionRoutes);
app.use('/api/v1/faqs', faqSectionRoutes);
app.use('/api/v1/programs', programRoutes);

export default app;
