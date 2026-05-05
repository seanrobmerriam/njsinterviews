import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.["userId"];
      const tier = session.metadata?.["tier"] as "PRO" | "BUSINESS" | undefined;
      if (userId && tier) {
        await prisma.user.update({
          where: { id: userId },
          data: { tier, stripeCustomerId: session.customer as string },
        });
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await prisma.user.updateMany({
        where: { stripeCustomerId: sub.customer as string },
        data: { tier: "FREE" },
      });
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const tier = sub.metadata?.["tier"] as "PRO" | "BUSINESS" | undefined;
      if (tier) {
        await prisma.user.updateMany({
          where: { stripeCustomerId: sub.customer as string },
          data: { tier },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
