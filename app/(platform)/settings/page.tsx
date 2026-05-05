import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ManageBillingButton } from "./ManageBillingButton";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings — CodeGauntlet",
};

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [clerkUser, dbUser] = await Promise.all([
    currentUser(),
    prisma.user.findUnique({ where: { id: userId }, select: { tier: true, stripeCustomerId: true, email: true } }),
  ]);

  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? dbUser?.email ?? "";
  const tier = dbUser?.tier ?? "FREE";
  const hasBilling = Boolean(dbUser?.stripeCustomerId);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Settings</h1>

      <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Account</h2>
        <dl className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex justify-between">
            <dt className="font-medium text-zinc-700 dark:text-zinc-300">Email</dt>
            <dd>{email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium text-zinc-700 dark:text-zinc-300">Plan</dt>
            <dd>
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  tier === "BUSINESS"
                    ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                    : tier === "PRO"
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {tier}
              </span>
            </dd>
          </div>
        </dl>
      </section>

      {hasBilling && (
        <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Billing</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Manage your subscription, invoices, and payment methods.
          </p>
          <ManageBillingButton />
        </section>
      )}
    </main>
  );
}
