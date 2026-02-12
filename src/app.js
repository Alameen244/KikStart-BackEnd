import express from 'express';
const app = express();
import cors from 'cors';

app.use(express.json());

app.use(cors({
    origin: '*',
    methods: ["GET", "PUT", "POST", "DELETE", "PATCH"],
    allowedHeaders: ['Content-Type', 'Authorization']
}));


export default app;
