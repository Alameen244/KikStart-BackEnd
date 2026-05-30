import express from "express";
import {
    confirmCheckoutSession,
    createCheckoutSession,
    stripeWebhook,
    getUserTransactions,
    getAdminUsersSummary,
    getAdminUserTransactions
} from "../controllers/SubscriptionControllers.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";
import checkPermission from "../middlewares/checkPermissionMiddleware.js";


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
subscriptionRouter.get(
    "/transactions",
    authMiddleware,
    getUserTransactions
);

subscriptionRouter.get("/admin/users-summary",      authMiddleware, isAdmin,checkPermission("Subscriptions", "read"), getAdminUsersSummary);
subscriptionRouter.get("/admin/user/:userId/transactions", authMiddleware, isAdmin, checkPermission("Subscriptions", "read"), getAdminUserTransactions);
export default  subscriptionRouter ;
