import { PricingTable } from "@/components/billing/PricingTable";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — CodeGauntlet",
  description: "Simple, transparent pricing for every level of interview prep.",
};

export default async function PricingPage() {
  const clerkUser = await currentUser().catch(() => null);
  let tier: "FREE" | "PRO" | "BUSINESS" | undefined;
  if (clerkUser) {
    const user = await prisma.user
      .findUnique({ where: { id: clerkUser.id }, select: { tier: true } })
      .catch(() => null);
    tier = user?.tier as "FREE" | "PRO" | "BUSINESS" | undefined;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 text-lg text-zinc-500 dark:text-zinc-400">
          Start free. Upgrade when you&apos;re ready.
        </p>
      </div>
      <div className="mt-12">
        <PricingTable currentTier={tier} />
      </div>
      <p className="mt-10 text-center text-xs text-zinc-400">
        All plans include a 7-day free trial. Cancel anytime.
      </p>
    </main>
  );
}
