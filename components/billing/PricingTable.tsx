"use client";

import Link from "next/link";
import { useState } from "react";

interface Plan {
  name: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  description: string;
  cta: string;
  ctaHref?: string;
  priceId?: "PRO_MONTHLY" | "PRO_ANNUAL" | "BUSINESS";
  highlighted?: boolean;
  features: string[];
}

const PLANS: Plan[] = [
  {
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "Get started with 150 curated problems.",
    cta: "Get started",
    ctaHref: "/sign-up",
    features: [
      "150 free problems (rotating)",
      "Arrays, Strings & Basic SQL",
      "10 submissions per day",
      "Community discussions (read-only)",
    ],
  },
  {
    name: "Pro",
    monthlyPrice: 19,
    annualPrice: 149,
    description: "Full access for serious interview prep.",
    cta: "Upgrade to Pro",
    priceId: "PRO_MONTHLY",
    highlighted: true,
    features: [
      "2,000+ problems across all categories",
      "Unlimited submissions",
      "Save & version solutions",
      "AI hints (10/day, Claude-powered)",
      "Interview Playlists & study paths",
      "Mock interview mode (timed)",
      "Progress analytics & streak tracking",
      "Community discussions (full access)",
    ],
  },
  {
    name: "Business",
    monthlyPrice: 99,
    annualPrice: null,
    description: "Assess candidates at scale.",
    cta: "Contact sales",
    ctaHref: "mailto:sales@codegauntlet.dev",
    features: [
      "Everything in Pro",
      "Company portal & custom question sets",
      "Candidate assessment & invite links",
      "Submission review & notes",
      "ATS webhook (Greenhouse, Lever)",
      "SSO via Clerk Organizations",
      "Custom branding on assessment pages",
      "Bulk CSV candidate import",
      "CSV & PDF reporting",
      "Dedicated support SLA",
    ],
  },
];

interface PricingTableProps {
  currentTier?: "FREE" | "PRO" | "BUSINESS";
}

export function PricingTable({ currentTier }: PricingTableProps) {
  const [annual, setAnnual] = useState(false);

  return (
    <div>
      {/* Annual toggle */}
      <div className="mb-8 flex items-center justify-center gap-3">
        <span className={`text-sm font-medium ${!annual ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500"}`}>
          Monthly
        </span>
        <button
          role="switch"
          aria-checked={annual}
          onClick={() => setAnnual((v) => !v)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${annual ? "bg-indigo-600" : "bg-zinc-300 dark:bg-zinc-600"}`}
        >
          <span className="sr-only">Toggle annual billing</span>
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${annual ? "translate-x-5" : "translate-x-0"}`}
          />
        </button>
        <span className={`text-sm font-medium ${annual ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500"}`}>
          Annual{" "}
          <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            Save 35%
          </span>
        </span>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`relative flex flex-col rounded-2xl p-6 ${
              plan.highlighted
                ? "border-2 border-indigo-500 bg-white shadow-lg dark:bg-zinc-900"
                : "border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
            }`}
          >
            {plan.highlighted && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-semibold text-white">
                Most popular
              </span>
            )}

            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{plan.name}</h3>
            <p className="mt-1 text-sm text-zinc-500">{plan.description}</p>

            <div className="mt-4 flex items-baseline gap-1">
              {plan.monthlyPrice === 0 ? (
                <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">Free</span>
              ) : plan.monthlyPrice ? (
                <>
                  <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
                    ${annual && plan.annualPrice ? plan.annualPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-sm text-zinc-500">/{annual ? "yr" : "mo"}</span>
                </>
              ) : (
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Custom</span>
              )}
            </div>

            {/* CTA */}
            {currentTier && plan.name.toUpperCase() === currentTier ? (
              <span className="mt-5 flex h-10 items-center justify-center rounded-lg border border-zinc-300 text-sm font-medium text-zinc-500 dark:border-zinc-700">
                Current plan
              </span>
            ) : plan.ctaHref ? (
              <Link
                href={plan.ctaHref}
                className={`mt-5 flex h-10 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                  plan.highlighted
                    ? "bg-indigo-600 text-white hover:bg-indigo-500"
                    : "border border-zinc-300 text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {plan.cta}
              </Link>
            ) : (
              <CheckoutButton
                priceId={plan.priceId!}
                annual={annual}
                label={plan.cta}
                highlighted={plan.highlighted}
              />
            )}

            {/* Features */}
            <ul className="mt-6 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function CheckoutButton({
  priceId,
  annual,
  label,
  highlighted,
}: {
  priceId: "PRO_MONTHLY" | "PRO_ANNUAL" | "BUSINESS";
  annual: boolean;
  label: string;
  highlighted?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const effectivePriceId = annual && priceId === "PRO_MONTHLY" ? "PRO_ANNUAL" : priceId;
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: effectivePriceId }),
      });
      const { url } = (await res.json()) as { url: string };
      window.location.href = url;
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`mt-5 flex h-10 items-center justify-center rounded-lg text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        highlighted
          ? "bg-indigo-600 text-white hover:bg-indigo-500"
          : "border border-zinc-300 text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
      }`}
    >
      {loading ? "Redirecting…" : label}
    </button>
  );
}
