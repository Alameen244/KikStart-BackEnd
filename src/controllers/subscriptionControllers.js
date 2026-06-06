import mongoose from "mongoose";
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

// ===============================
// ADMIN — GET ALL USERS SUMMARY
// (with filters, sorting, export)
// ===============================

export const getAdminUsersSummary = async (req, res) => {
    try {
        const page        = parseInt(req.query.page)  || 1;
        const limit       = 20;
        const skip        = (page - 1) * limit;
        const exportAll   = req.query.exportAll === "true"; // skip pagination

        // --- Filters ---
        const { plan, subscriptionStatus, transactionStatus } = req.query;

        // --- Sorting ---
        // allowed fields: totalPaid | transactionCount | name
        const allowedSortFields = ["totalPaid", "transactionCount", "name"];
        const sortBy    = allowedSortFields.includes(req.query.sortBy)
                            ? req.query.sortBy
                            : "totalPaid";
        const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

        // ── Stage 1: filter users who have a stripeCustomerId ──
        const matchStage = {
            "subscription.stripeCustomerId": { $ne: null, $exists: true }
        };

        // optional: filter by subscription plan
        if (plan) {
            matchStage["subscription.plan"] = plan.toLowerCase();
        }

        // optional: filter by subscription status
        if (subscriptionStatus) {
            matchStage["subscription.status"] = subscriptionStatus.toLowerCase();
        }

        // ── Stage 2: transaction-level filter for the $lookup ──
        // We filter transactions inside $lookup pipeline so totalPaid reflects
        // the chosen status, but keep all transactions for transactionCount.
        const transactionMatchCond = transactionStatus
            ? { $eq: ["$$tx.status", transactionStatus.toLowerCase()] }
            : { $eq: ["$$tx.status", "paid"] }; // default: only paid

        const result = await AuthModel.aggregate([
            { $match: matchStage },

            // join all transactions for this user
            {
                $lookup: {
                    from: "transactions",
                    localField: "_id",
                    foreignField: "userId",
                    as: "transactions"
                }
            },

            // compute totalPaid (respects transactionStatus filter) + count
            {
                $addFields: {
                    totalPaid: {
                        $sum: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: "$transactions",
                                        as: "tx",
                                        cond: transactionMatchCond
                                    }
                                },
                                as: "tx",
                                in: "$$tx.amount"
                            }
                        }
                    },
                    transactionCount: { $size: "$transactions" }
                }
            },

            {
                $project: {
                    _id: 1,
                    email: 1,
                    name: 1,
                    createdAt: 1,
                    "subscription.plan": 1,
                    "subscription.status": 1,
                    "subscription.stripeCustomerId": 1,
                    totalPaid: 1,
                    transactionCount: 1
                }
            },

            { $sort: { [sortBy]: sortOrder } },

            // ── Facet: paginated data + total count ──
            ...(exportAll
                ? [] // no facet when exporting all — just return flat array
                : [
                    {
                        $facet: {
                            data: [{ $skip: skip }, { $limit: limit }],
                            totalCount: [{ $count: "count" }]
                        }
                    }
                ])
        ]);

        // ── Export-all response ──
        if (exportAll) {
            return res.status(200).json({
                success: true,
                data: { users: result }
            });
        }

        // ── Paginated response ──
        const users      = result[0]?.data       || [];
        const totalCount = result[0]?.totalCount[0]?.count || 0;
        const totalPages = Math.ceil(totalCount / limit);

        return res.status(200).json({
            success: true,
            data: {
                users,
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


// ===============================
// ADMIN — GET ONE USER'S TRANSACTIONS
// (unchanged structure, already solid)
// ===============================

export const getAdminUserTransactions = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ success: false, message: "userId is required" });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: "Invalid userId" });
        }

        const page  = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip  = (page - 1) * limit;

        // exportAll flag — used when admin clicks "Export PDF" on a single user
        const exportAll = req.query.exportAll === "true";

        const query = { userId };

        const totalCount = await TransactionModel.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);

        const findQuery = TransactionModel.find(query)
            .sort({ billingDate: -1 })
            .select("stripeInvoiceId billingDate amount status plan invoicePdfUrl");

        if (!exportAll) {
            findQuery.skip(skip).limit(limit);
        }

        const transactions = await findQuery;

        return res.status(200).json({
            success: true,
            data: {
                transactions,
                ...(!exportAll && {
                    pagination: {
                        currentPage: page,
                        totalPages,
                        totalCount,
                        hasNextPage: page < totalPages,
                        hasPrevPage: page > 1
                    }
                })
            }
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ===============================
// HELPER
// ===============================

const getPeriodBounds = (year, month) => {
    if (month) {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 1);
        return { start, end };
    }
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);
    return { start, end };
};

// ===============================
// OVERVIEW STAT CARDS
// GET /admin/analytics/overview?year=2026&month=5
// ===============================

export const getAnalyticsOverview = async (req, res) => {
    try {
        const year  = parseInt(req.query.year)  || new Date().getFullYear();
        const month = parseInt(req.query.month) || null;

        const { start, end } = getPeriodBounds(year, month);

        // -- current period --
        const [current] = await TransactionModel.aggregate([
            {
                $match: {
                    status: "paid",
                    billingDate: { $gte: start, $lt: end }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue:      { $sum: "$amount" },
                    totalTransactions: { $sum: 1 }
                }
            }
        ]);

        // new subscribers in period (first transaction date falls in period)
        const newSubscribers = await AuthModel.countDocuments({
            "subscription.startDate": { $gte: start, $lt: end },
            "subscription.status": { $in: ["active", "cancelled"] }
        });

        // active subscribers right now
        const activeSubscribers = await AuthModel.countDocuments({
            "subscription.status": "active"
        });

        // -- previous period for MoM / YoY growth --
        let prevStart, prevEnd;
        if (month) {
            prevStart = new Date(year, month - 2, 1);
            prevEnd   = new Date(year, month - 1, 1);
        } else {
            prevStart = new Date(year - 1, 0, 1);
            prevEnd   = new Date(year, 0, 1);
        }

        const [prev] = await TransactionModel.aggregate([
            {
                $match: {
                    status: "paid",
                    billingDate: { $gte: prevStart, $lt: prevEnd }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$amount" }
                }
            }
        ]);

        const currentRevenue = current?.totalRevenue      ?? 0;
        const prevRevenue    = prev?.totalRevenue         ?? 0;

        const revenueGrowth = prevRevenue === 0
            ? null   // can't compute % from zero base — frontend shows "N/A"
            : parseFloat(
                (((currentRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1)
              );

        return res.status(200).json({
            success: true,
            data: {
                totalRevenue:      currentRevenue,
                totalTransactions: current?.totalTransactions ?? 0,
                newSubscribers,
                activeSubscribers,
                revenueGrowth   // null | number (can be negative)
            }
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ===============================
// REVENUE CHART
// GET /admin/analytics/revenue-chart?year=2026&view=monthly
// view = "monthly" (12 bars for a year) | "yearly" (one bar per year)
// ===============================

export const getRevenueChart = async (req, res) => {
    try {
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const view = req.query.view === "yearly" ? "yearly" : "monthly";

        let pipeline;

        if (view === "monthly") {
            pipeline = [
                {
                    $match: {
                        status: "paid",
                        billingDate: {
                            $gte: new Date(year, 0, 1),
                            $lt:  new Date(year + 1, 0, 1)
                        }
                    }
                },
                {
                    $group: {
                        _id: { $month: "$billingDate" },
                        revenue:      { $sum: "$amount" },
                        transactions: { $sum: 1 }
                    }
                },
                { $sort: { "_id": 1 } }
            ];

            const raw = await TransactionModel.aggregate(pipeline);

            // fill all 12 months, even if no data
            const months = [
                "Jan","Feb","Mar","Apr","May","Jun",
                "Jul","Aug","Sep","Oct","Nov","Dec"
            ];

            const data = months.map((label, i) => {
                const found = raw.find(r => r._id === i + 1);
                return {
                    month: label,
                    revenue:      found?.revenue      ?? 0,
                    transactions: found?.transactions ?? 0
                };
            });

            return res.status(200).json({ success: true, data, view, year });

        } else {
            // yearly: group by year, from 2026 onward
            pipeline = [
                {
                    $match: { status: "paid" }
                },
                {
                    $group: {
                        _id: { $year: "$billingDate" },
                        revenue:      { $sum: "$amount" },
                        transactions: { $sum: 1 }
                    }
                },
                { $sort: { "_id": 1 } }
            ];

            const raw = await TransactionModel.aggregate(pipeline);

            const data = raw.map(r => ({
                year:         r._id,
                revenue:      r.revenue,
                transactions: r.transactions
            }));

            return res.status(200).json({ success: true, data, view });
        }

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ===============================
// PLAN DISTRIBUTION (donut)
// GET /admin/analytics/plan-distribution?year=2026&month=5
// ===============================

export const getPlanDistribution = async (req, res) => {
    try {
        const year  = parseInt(req.query.year)  || new Date().getFullYear();
        const month = parseInt(req.query.month) || null;

        const { start, end } = getPeriodBounds(year, month);

        const raw = await TransactionModel.aggregate([
            {
                $match: {
                    status: "paid",
                    billingDate: { $gte: start, $lt: end }
                }
            },
            {
                $group: {
                    _id:     "$plan",
                    revenue: { $sum: "$amount" },
                    count:   { $sum: 1 }
                }
            }
        ]);

        const total = raw.reduce((sum, r) => sum + r.count, 0);

        const plans = ["basic", "professional", "advanced"];

        const data = plans.map(plan => {
            const found = raw.find(r => r._id === plan);
            return {
                plan,
                count:      found?.count   ?? 0,
                revenue:    found?.revenue ?? 0,
                percentage: total === 0
                    ? 0
                    : parseFloat(((( found?.count ?? 0) / total) * 100).toFixed(1))
            };
        });

        return res.status(200).json({ success: true, data, total });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ===============================
// ADMIN — REVENUE BREAKDOWN
// GET /api/subscriptions/admin/revenue-breakdown?year=2025&status=paid
// ===============================

export const getRevenueBreakdown = async (req, res) => {
  try {
    const year        = parseInt(req.query.year)   || new Date().getFullYear();
    const statusParam = req.query.status || "paid"; // "paid" | "all"

    // ── Match stage ──────────────────────────────────────────────────────
    const matchStage = {
      billingDate: {
        $gte: new Date(`${year}-01-01T00:00:00.000Z`),
        $lte: new Date(`${year}-12-31T23:59:59.999Z`),
      },
    };

    if (statusParam === "paid") {
      matchStage.status = "paid";
    }
    // "all" → no status filter added (includes paid + unpaid + cancelled)

    // ── Aggregation pipeline ─────────────────────────────────────────────
    // Step 1: group by month + plan → get revenue + transaction count
    // Step 2: reshape into one doc per month with a plans array
    const raw = await TransactionModel.aggregate([
      { $match: matchStage },

      {
        $group: {
          _id: {
            month: { $month: "$billingDate" },
            plan:  "$plan",
          },
          totalRevenue: { $sum: "$amount" }, // amount already in dollars (see saveTransaction)
          transactions: { $sum: 1 },
        },
      },

      {
        $group: {
          _id: "$_id.month",
          plans: {
            $push: {
              plan:         "$_id.plan",
              totalRevenue: "$totalRevenue",
              transactions: "$transactions",
            },
          },
        },
      },

      { $sort: { _id: 1 } },
    ]);

    // ── Normalize to 12 fixed monthly rows ───────────────────────────────
    const MONTH_NAMES = [
      "Jan","Feb","Mar","Apr","May",
      "Jun","Jul","Aug","Sep","Oct","Nov","Dec",
    ];

    // Build lookup: monthNumber (1-12) → { basic, professional, advanced }
    const monthMap = {};
    raw.forEach(({ _id: monthNum, plans }) => {
      monthMap[monthNum] = {};
      plans.forEach(({ plan, totalRevenue, transactions }) => {
        monthMap[monthNum][plan] = { totalRevenue, transactions };
      });
    });

    const EMPTY_PLAN = { totalRevenue: 0, transactions: 0, avgPerSubscriber: 0 };

    const buildPlanStats = (data) => {
      if (!data || data.transactions === 0) return { ...EMPTY_PLAN };
      return {
        totalRevenue:    +data.totalRevenue.toFixed(2),
        transactions:    data.transactions,
        avgPerSubscriber: +(data.totalRevenue / data.transactions).toFixed(2),
      };
    };

    const rows = Array.from({ length: 12 }, (_, i) => {
      const monthNum  = i + 1;
      const planData  = monthMap[monthNum] || {};

      const basic        = buildPlanStats(planData["basic"]);
      const professional = buildPlanStats(planData["professional"]);
      const advanced     = buildPlanStats(planData["advanced"]);

      const totalRevenue = basic.totalRevenue + professional.totalRevenue + advanced.totalRevenue;
      const transactions = basic.transactions + professional.transactions + advanced.transactions;

      return {
        month:           MONTH_NAMES[i],
        monthNum,
        basic,
        professional,
        advanced,
        totalRevenue:    +totalRevenue.toFixed(2),
        transactions,
        avgPerSubscriber: transactions > 0
          ? +(totalRevenue / transactions).toFixed(2)
          : 0,
      };
    });

    // ── Yearly summary (footer totals) ───────────────────────────────────
    const summary = {
      basic:        { totalRevenue: 0, transactions: 0 },
      professional: { totalRevenue: 0, transactions: 0 },
      advanced:     { totalRevenue: 0, transactions: 0 },
      totalRevenue: 0,
      transactions: 0,
    };

    rows.forEach((r) => {
      ["basic", "professional", "advanced"].forEach((p) => {
        summary[p].totalRevenue += r[p].totalRevenue;
        summary[p].transactions += r[p].transactions;
      });
      summary.totalRevenue += r.totalRevenue;
      summary.transactions += r.transactions;
    });

    // Round & compute avg for summary row
    ["basic", "professional", "advanced"].forEach((p) => {
      summary[p].totalRevenue     = +summary[p].totalRevenue.toFixed(2);
      summary[p].avgPerSubscriber = summary[p].transactions > 0
        ? +(summary[p].totalRevenue / summary[p].transactions).toFixed(2)
        : 0;
    });
    summary.totalRevenue     = +summary.totalRevenue.toFixed(2);
    summary.avgPerSubscriber = summary.transactions > 0
      ? +(summary.totalRevenue / summary.transactions).toFixed(2)
      : 0;

    return res.status(200).json({
      success: true,
      year,
      statusFilter: statusParam,
      rows,     // Array[12] — one per month, always present even if all zeros
      summary,  // yearly totals + per-plan totals
    });

  } catch (error) {
    console.error("getRevenueBreakdown error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch revenue breakdown",
    });
  }
};
