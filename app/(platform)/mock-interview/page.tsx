import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserTier } from "@/lib/tier";
import { UpgradePrompt } from "@/components/billing/UpgradePrompt";
import { MockInterviewClient } from "./MockInterviewClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Mock Interview — CodeGauntlet" };

export default async function MockInterviewPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const tier = await getUserTier(userId);

  if (tier === "FREE") {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 sm:px-6">
        <UpgradePrompt feature="Mock Interview Mode" requiredTier="PRO" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Mock Interview</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Simulate a real interview with a timed problem set. Results are not saved.
      </p>
      <MockInterviewClient />
    </div>
  );
}
