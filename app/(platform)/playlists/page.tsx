import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getUserTier } from "@/lib/tier";
import { UpgradePrompt } from "@/components/billing/UpgradePrompt";
import { EnrollButton } from "./EnrollButton";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Playlists — CodeGauntlet" };

export default async function PlaylistsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [playlists, enrollments, tier] = await Promise.all([
    prisma.playlist.findMany({
      orderBy: { orderIndex: "asc" },
      include: { _count: { select: { items: true } } },
    }),
    prisma.playlistEnrollment.findMany({
      where: { userId },
      select: { playlistId: true },
    }),
    getUserTier(userId),
  ]);

  const enrolledIds = new Set(enrollments.map((e) => e.playlistId));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Study Playlists</h1>
      <p className="mt-1 text-sm text-zinc-500">Curated learning paths to ace your interviews.</p>

      {tier === "FREE" && (
        <div className="mt-6">
          <UpgradePrompt feature="Pro Playlists" requiredTier="PRO" />
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {playlists.map((playlist) => {
          const locked = playlist.isPro && tier === "FREE";
          const enrolled = enrolledIds.has(playlist.id);
          return (
            <div
              key={playlist.id}
              className={`relative rounded-xl border p-5 transition-shadow ${
                locked
                  ? "border-zinc-200 bg-zinc-50 opacity-70 dark:border-zinc-800 dark:bg-zinc-900"
                  : "border-zinc-200 bg-white shadow-sm hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              }`}
            >
              {playlist.isPro && (
                <span className="absolute right-3 top-3 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                  PRO
                </span>
              )}
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{playlist.title}</h2>
              <p className="mt-1 text-sm text-zinc-500 line-clamp-2">{playlist.description}</p>
              <p className="mt-2 text-xs text-zinc-400">{playlist._count.items} problems</p>
              <div className="mt-4 flex gap-2">
                {!locked && (
                  <Link
                    href={`/playlists/${playlist.slug}`}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    View
                  </Link>
                )}
                {!locked && <EnrollButton playlistId={playlist.id} enrolled={enrolled} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
