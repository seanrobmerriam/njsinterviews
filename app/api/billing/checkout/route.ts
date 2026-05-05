import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getStripe, PLANS } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

const PRICE_IDS = {
  PRO_MONTHLY: PLANS.PRO_MONTHLY,
  PRO_ANNUAL: PLANS.PRO_ANNUAL,
  BUSINESS: PLANS.BUSINESS_SEAT,
} as const;

type PriceKey = keyof typeof PRICE_IDS;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { priceId: PriceKey };
  const priceKey = body.priceId;
  if (!(priceKey in PRICE_IDS)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress;

  // Get or create Stripe customer ID
  let user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const stripe = getStripe();
  let customerId = user.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({ email, metadata: { clerkId: userId } });
    customerId = customer.id;
    await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: PRICE_IDS[priceKey](), quantity: 1 }],
    success_url: `${appUrl}/dashboard?upgraded=true`,
    cancel_url: `${appUrl}/pricing`,
    allow_promotion_codes: true,
    subscription_data: { trial_period_days: 7 },
    metadata: { clerkUserId: userId, priceKey },
  });

  return NextResponse.json({ url: session.url });
}
