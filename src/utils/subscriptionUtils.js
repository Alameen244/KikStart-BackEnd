import { PLAN_LIMITS } from "../constants/subscriptionLimits.js";

export const getChildrenLimit = (plan) => PLAN_LIMITS[plan] || 0;
