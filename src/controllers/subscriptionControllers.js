import stripe from "../config/stripe.js"
import AuthModel from "../models/authModel.js";

const addOneMonthFromNow = () => {
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    return endDate;
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
    user.subscription.startDate = new Date();
    user.subscription.endDate = subscriptionEndDate;

    if (session.customer && !user.subscription.stripeCustomerId) {
        user.subscription.stripeCustomerId =
            typeof session.customer === "string" ? session.customer : session.customer?.id || null;
    }

    await user.save();
    return user;
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


        // PLAN PRICE MAP
        const plans = {
            basic: 1900,
            professional: 4900,
            advanced: 9900
        };


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

                        unit_amount: plans[plan]
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



    // PAYMENT SUCCESS
    if (event.type === "checkout.session.completed") {

        const session = event.data.object;
        await updateUserSubscriptionFromSession(session);
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
            expand: ["subscription"],
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
