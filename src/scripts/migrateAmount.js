import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../../.env") });

import mongoose from "mongoose";
import AuthModel from "../models/authModel.js";

const PLAN_AMOUNT = {
    basic: 19,
    professional: 49,
    advanced: 99,
};

const migrate = async () => {
    await mongoose.connect(process.env.MONGODB_URI);

    const users = await AuthModel.find({
        "subscription.plan": { $exists: true, $ne: null },
        "subscription.amount": { $in: [null, undefined, 0] }  // only unset ones
    });

    console.log(`Found ${users.length} users to update`);

    for (const user of users) {
        const plan = user.subscription.plan;
        if (PLAN_AMOUNT[plan]) {
            user.subscription.amount = PLAN_AMOUNT[plan];
            await user.save();
            console.log(`Updated ${user.email} → ${plan} → ₹${PLAN_AMOUNT[plan]}`);
        }
    }

    console.log("Migration done ✅");
    process.exit(0);
};

migrate();
