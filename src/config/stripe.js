import "dotenv/config";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is missing from environment variables");
}

if (stripeSecretKey.startsWith("pk_")) {
  throw new Error(
    "STRIPE_SECRET_KEY must be a Stripe secret key starting with sk_, not a publishable key starting with pk_",
  );
}

const stripe = new Stripe(stripeSecretKey);

export default stripe;
