"use client";

import Link from "next/link";

interface UpgradePromptProps {
  feature: string;
  requiredTier: "PRO" | "BUSINESS";
}

export function UpgradePrompt({ feature, requiredTier }: UpgradePromptProps) {
  const tierLabel = requiredTier === "PRO" ? "Pro" : "Business";
  const tierColor = requiredTier === "PRO" ? "indigo" : "violet";

  return (
    <div
      role="status"
      aria-label={`Upgrade required to access ${feature}`}
      className={`rounded-xl border border-${tierColor}-200 bg-${tierColor}-50 p-6 text-center dark:border-${tierColor}-900 dark:bg-${tierColor}-950/30`}
    >
      <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-${tierColor}-100 dark:bg-${tierColor}-900/40`}>
        <svg className={`h-6 w-6 text-${tierColor}-600 dark:text-${tierColor}-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{feature}</h3>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        This feature requires a{" "}
        <span className={`font-medium text-${tierColor}-600 dark:text-${tierColor}-400`}>
          {tierLabel}
        </span>{" "}
        subscription.
      </p>
      <Link
        href="/pricing"
        className={`mt-4 inline-flex items-center rounded-lg bg-${tierColor}-600 px-4 py-2 text-sm font-semibold text-white hover:bg-${tierColor}-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-${tierColor}-600`}
      >
        View plans
      </Link>
    </div>
  );
}
