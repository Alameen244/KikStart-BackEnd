// models/transactionModel.js
import mongoose, { Schema, model } from "mongoose";

const transactionSchema = new Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "auth",
            required: true
        },
        stripeInvoiceId: {
            type: String,
            required: true,
            unique: true
        },
        stripeCustomerId: {
            type: String,
            required: true
        },
        plan: {
            type: String,
            enum: ["basic", "professional", "advanced"],
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ["paid", "unpaid", "cancelled"],
            default: "unpaid",
            required: true
        },
        invoicePdfUrl: {
            type: String,
            default: null
        },
        billingDate: {
            type: Date,
            required: true
        }
    },
    {
        timestamps: true
    }
);

transactionSchema.index({ userId: 1, billingDate: -1 });

const TransactionModel = model("transaction", transactionSchema);
export default TransactionModel;
