import express from "express";
import {
    confirmCheckoutSession,
    createCheckoutSession,
    stripeWebhook
} from "../controllers/subscriptionControllers.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";



const subscriptionRouter = express.Router();

subscriptionRouter.post(
    "/create-checkout-session",
    authMiddleware,
    createCheckoutSession
);

subscriptionRouter.post(
    "/confirm-session",
    authMiddleware,
    confirmCheckoutSession
);

subscriptionRouter.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    stripeWebhook
);

export default  subscriptionRouter ;
