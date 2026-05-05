import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-02-24.acacia",
    });
  }
  return _stripe;
}

export const PLANS = {
  PRO_MONTHLY: () => process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
  PRO_ANNUAL: () => process.env.STRIPE_PRO_ANNUAL_PRICE_ID!,
  BUSINESS_SEAT: () => process.env.STRIPE_BUSINESS_SEAT_PRICE_ID!,
} as const;
