import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DifficultyBadge } from "@/components/problems/DifficultyBadge";
import { EnrollButton } from "../EnrollButton";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const playlist = await prisma.playlist.findUnique({ where: { slug }, select: { title: true } });
  return { title: playlist ? `${playlist.title} — CodeGauntlet` : "Playlist" };
}

export default async function PlaylistDetailPage({ params }: Props) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { slug } = await params;
  const [playlist, enrollment] = await Promise.all([
    prisma.playlist.findUnique({
      where: { slug },
      include: {
        items: {
          orderBy: { position: "asc" },
          include: { problem: { select: { id: true, slug: true, title: true, difficulty: true, category: true } } },
        },
      },
    }),
    prisma.playlistEnrollment.findFirst({ where: { userId, playlist: { slug } } }),
  ]);

  if (!playlist) notFound();

  // Get user's progress for these problems
  const problemIds = playlist.items.map((i) => i.problem.id);
  const progress = await prisma.userProblemProgress.findMany({
    where: { userId, problemId: { in: problemIds } },
    select: { problemId: true, status: true },
  });
  const progressMap = new Map(progress.map((p) => [p.problemId, p.status]));

  const solvedCount = progress.filter((p) => p.status === "SOLVED").length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link href="/playlists" className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
        ← All playlists
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{playlist.title}</h1>
          <p className="mt-1 text-sm text-zinc-500">{playlist.description}</p>
        </div>
        <EnrollButton playlistId={playlist.id} enrolled={Boolean(enrollment)} />
      </div>

      {/* Progress bar */}
      <div className="mt-6">
        <div className="mb-1 flex justify-between text-xs text-zinc-500">
          <span>Progress</span>
          <span>{solvedCount} / {playlist.items.length} solved</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: playlist.items.length > 0 ? `${(solvedCount / playlist.items.length) * 100}%` : "0%" }}
          />
        </div>
      </div>

      {/* Problem list */}
      <ol className="mt-6 space-y-2">
        {playlist.items.map((item, idx) => {
          const status = progressMap.get(item.problem.id);
          return (
            <li key={item.id} className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
              <span className="w-5 shrink-0 text-center text-xs text-zinc-400">{idx + 1}</span>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                {status === "SOLVED" ? (
                  <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 20 20" fill="currentColor" aria-label="Solved"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                ) : status === "ATTEMPTED" ? (
                  <svg className="h-4 w-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor" aria-label="Attempted"><circle cx="10" cy="10" r="8" /></svg>
                ) : (
                  <span className="h-4 w-4 rounded-full border border-zinc-300 dark:border-zinc-700" aria-label="Not started" />
                )}
              </span>
              <Link href={`/problems/${item.problem.slug}`} className="flex-1 text-sm font-medium text-zinc-900 hover:text-indigo-600 dark:text-zinc-100 dark:hover:text-indigo-400">
                {item.problem.title}
              </Link>
              <DifficultyBadge difficulty={item.problem.difficulty} />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
