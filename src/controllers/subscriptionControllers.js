import stripe from "../config/stripe.js"
import AuthModel from "../models/authModel.js";
import TransactionModel from "../models/transactionModel.js";


const plans = {
    basic: 19,
    professional: 49,
    advanced: 99
};

const addOneMonthFromNow = () => {
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    return endDate;
};

const getStripeId = (value) => {
    if (!value) return null;
    return typeof value === "string" ? value : value.id || null;
};

const normalizeStripeAmount = (amount) => {
    if (typeof amount !== "number") return 0;
    return amount / 100;
};

const updateUserSubscriptionFromSession = async (session) => {
    const userId = session?.metadata?.userId;
    const plan = session?.metadata?.plan;

    if (!userId || !plan) {
        return null;
    }

    const user = await AuthModel.findById(userId);

    if (!user) {
        return null;
    }

    let subscriptionEndDate = addOneMonthFromNow();

    if (session.subscription) {
        try {
            const stripeSubscription =
                typeof session.subscription === "string"
                    ? await stripe.subscriptions.retrieve(session.subscription)
                    : session.subscription;

            if (stripeSubscription?.current_period_end) {
                subscriptionEndDate = new Date(
                    stripeSubscription.current_period_end * 1000
                );
            }

            if (stripeSubscription?.status === "canceled") {
                user.subscription.status = "cancelled";
            } else {
                user.subscription.status = "active";
            }

            user.subscription.stripeSubscriptionId = stripeSubscription?.id || null;
        } catch (_error) {
            user.subscription.status = "active";
            user.subscription.stripeSubscriptionId =
                typeof session.subscription === "string" ? session.subscription : session.subscription?.id || null;
        }
    } else {
        user.subscription.status = "active";
    }

    user.subscription.plan = plan;
    if (!user.subscription.startDate) {
        user.subscription.startDate = new Date();
    }
    user.subscription.endDate = subscriptionEndDate;
    user.subscription.amount = plans[plan] ?? 0;

    if (session.customer && !user.subscription.stripeCustomerId) {
        user.subscription.stripeCustomerId = getStripeId(session.customer);
    }

    await user.save();
    return user;
};


// ===============================
// SAVE TRANSACTION (internal helper)
// ===============================

const saveTransaction = async (invoice, fallback = {}) => {
    try {
        if (!invoice?.id) return null;

        // avoid duplicate transactions
        const existing = await TransactionModel.findOne({
            stripeInvoiceId: invoice.id
        });

        if (existing) {
            existing.status =
                invoice.status === "paid"
                    ? "paid"
                    : "unpaid";

            await existing.save();
            return existing;
        }

        const stripeCustomerId = getStripeId(invoice.customer) || fallback.stripeCustomerId;
        const invoiceMetadata = invoice.metadata || {};
        const subscriptionMetadata = invoice.subscription_details?.metadata || {};
        const userIdFromMetadata =
            invoiceMetadata.userId ||
            subscriptionMetadata.userId ||
            fallback.userId;

        let user = userIdFromMetadata ? await AuthModel.findById(userIdFromMetadata) : null;

        if (!user && stripeCustomerId) {
            user = await AuthModel.findOne({
                "subscription.stripeCustomerId": stripeCustomerId
            });
        }

        if (!user || !stripeCustomerId) return null;

        const plan =
            invoiceMetadata.plan ||
            subscriptionMetadata.plan ||
            fallback.plan;

        if (!plans[plan]) return null;

        const paidAmount = invoice.amount_paid ?? invoice.total ?? fallback.amount;
        const amount = normalizeStripeAmount(paidAmount);

        return await TransactionModel.create({
            userId: user._id,
            stripeInvoiceId: invoice.id,
            stripeCustomerId,
            plan,
            amount,
            status: invoice.status === "paid" ? "paid" : "unpaid",
            invoicePdfUrl: invoice.invoice_pdf || null,
            billingDate: new Date(invoice.created * 1000)
        });

    } catch (error) {
        console.error("Failed to save transaction:", error.message);
        return null;
    }
};

// ===============================
// CREATE CHECKOUT SESSION
// ===============================

export const createCheckoutSession = async (req, res) => {

    try {

        const userId = req.jwtPayload?.id;
        const { plan, clientUrl } = req.body;
        const redirectBaseUrl = clientUrl || process.env.CLIENT_URL || "http://localhost:5173";

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }





        // VALIDATION
        if (!plans[plan]) {
            return res.status(400).json({
                success: false,
                message: "Invalid subscription plan"
            });
        }


        // GET USER
        const user = await AuthModel.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }


        // CREATE STRIPE CUSTOMER
        let customerId = user.subscription?.stripeCustomerId;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.name
            });

            customerId = customer.id;
            user.subscription.stripeCustomerId = customerId;
            await user.save();
        }


        // CREATE CHECKOUT SESSION
        const session = await stripe.checkout.sessions.create({

            payment_method_types: ["card"],

            mode: "subscription",

            customer: customerId,

            subscription_data: {
                metadata: {
                    userId: user._id.toString(),
                    plan
                }
            },

            line_items: [
                {
                    price_data: {
                        currency: "usd",

                        product_data: {
                            name: `${plan} Plan`
                        },

                        recurring: {
                            interval: "month"
                        },

                        unit_amount: plans[plan] * 100
                    },

                    quantity: 1
                }
            ],

            success_url: `${redirectBaseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,

            cancel_url: `${redirectBaseUrl}/cancel`,


            metadata: {
                userId: user._id.toString(),
                plan
            }
        });


        res.status(200).json({
            success: true,
            url: session.url
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



// ===============================
// STRIPE WEBHOOK
// ===============================

export const stripeWebhook = async (req, res) => {

    const sig = req.headers["stripe-signature"];

    let event;

    try {

        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

    } catch (err) {

        return res.status(400).send(`Webhook Error: ${err.message}`);
    }


    // checkout completed → update subscription
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        await updateUserSubscriptionFromSession(session);
    }

    // invoice paid → save transaction
    if (event.type === "invoice.payment_succeeded") {
        const invoice = event.data.object;
        await saveTransaction(invoice);
    }

    // invoice payment failed
    if (event.type === "invoice.payment_failed") {
        const invoice = event.data.object;

        const conditionalUser = await AuthModel.findOne({
            "subscription.stripeCustomerId": getStripeId(invoice.customer)
        });

        if (conditionalUser) {
            conditionalUser.subscription.status = "inactive";
            await conditionalUser.save();
        }

        await saveTransaction(invoice);
    }
    res.json({ received: true });
};

export const confirmCheckoutSession = async (req, res) => {
    try {
        const userId = req.jwtPayload?.id;
        const { sessionId } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: "sessionId is required"
            });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ["subscription", "subscription.latest_invoice"],
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Checkout session not found"
            });
        }

        if (session?.metadata?.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: "This session does not belong to the current user"
            });
        }

        if (session.payment_status !== "paid") {
            return res.status(400).json({
                success: false,
                message: "Payment is not completed yet"
            });
        }

        const updatedUser = await updateUserSubscriptionFromSession(session);
        const latestInvoice = session.subscription?.latest_invoice || session.invoice;

        if (latestInvoice) {
            const invoice =
                typeof latestInvoice === "string"
                    ? await stripe.invoices.retrieve(latestInvoice)
                    : latestInvoice;

            await saveTransaction(invoice, {
                userId,
                plan: session.metadata?.plan,
                stripeCustomerId: getStripeId(session.customer)
            });
        }

        return res.status(200).json({
            success: true,
            message: "Subscription updated successfully",
            data: updatedUser?.subscription || null,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to confirm checkout session"
        });
    }
};

// ===============================
// GET USER TRANSACTIONS
// ===============================

export const getUserTransactions = async (req, res) => {
    try {
        const userId = req.jwtPayload?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = 15;
        const skip = (page - 1) * limit;

        const totalCount = await TransactionModel.countDocuments({ userId });
        const totalPages = Math.ceil(totalCount / limit);

        const transactions = await TransactionModel.find({ userId })
            .sort({ billingDate: -1 }) // latest first
            .skip(skip)
            .limit(limit)
            .select("stripeInvoiceId billingDate amount status plan invoicePdfUrl");

        return res.status(200).json({
            success: true,
            data: {
                transactions,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
