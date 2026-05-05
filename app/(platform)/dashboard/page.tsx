import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DifficultyBadge } from "@/components/problems/DifficultyBadge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  // Ensure user record exists
  await prisma.user.upsert({
    where: { id: user.id },
    update: { lastActiveAt: new Date() },
    create: {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress ?? "",
      username: user.username ?? null,
      avatarUrl: user.imageUrl ?? null,
    },
  });

  const [dbUser, totalProblems, progress, recentSubmissions, enrollments] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { tier: true, streakDays: true },
    }),
    prisma.problem.count({ where: { isActive: true } }),
    prisma.userProblemProgress.findMany({
      where: { userId: user.id },
      select: { problemId: true, status: true, problem: { select: { difficulty: true } } },
    }),
    prisma.submission.findMany({
      where: { userId: user.id },
      take: 8,
      orderBy: { submittedAt: "desc" },
      include: { problem: { select: { title: true, slug: true, difficulty: true } } },
    }),
    prisma.playlistEnrollment.findMany({
      where: { userId: user.id },
      include: {
        playlist: {
          select: {
            id: true, title: true, slug: true,
            _count: { select: { items: true } },
            items: { select: { problemId: true } },
          },
        },
      },
      take: 3,
    }),
  ]);

  const solved = progress.filter((p) => p.status === "SOLVED");
  const easySolved = solved.filter((p) => p.problem.difficulty === "EASY").length;
  const mediumSolved = solved.filter((p) => p.problem.difficulty === "MEDIUM").length;
  const hardSolved = solved.filter((p) => p.problem.difficulty === "HARD").length;
  const tier = dbUser?.tier ?? "FREE";

  const solvedSet = new Set(
    progress.filter((p) => p.status === "SOLVED").map((p) => p.problemId),
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Welcome back, {user.firstName ?? user.username ?? "Coder"} 👋
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            <span className={`font-semibold ${tier === "BUSINESS" ? "text-violet-500" : tier === "PRO" ? "text-indigo-500" : "text-zinc-400"}`}>
              {tier}
            </span>{" "}
            · 🔥 {dbUser?.streakDays ?? 0} day streak
          </p>
        </div>
        {tier === "FREE" && (
          <Link href="/pricing" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
            Upgrade to Pro
          </Link>
        )}
      </div>

      {/* Stats row */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Solved" value={solved.length} sub={`/ ${totalProblems}`} />
        <StatCard label="Easy" value={easySolved} accent="emerald" />
        <StatCard label="Medium" value={mediumSolved} accent="amber" />
        <StatCard label="Hard" value={hardSolved} accent="red" />
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-zinc-500">
          <span>Overall progress</span>
          <span>{solved.length} / {totalProblems} solved</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{ width: totalProblems > 0 ? `${(solved.length / totalProblems) * 100}%` : "0%" }}
          />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent submissions */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Recent Submissions</h2>
            <Link href="/problems" className="text-xs text-indigo-600 hover:underline dark:text-indigo-400">
              Browse problems →
            </Link>
          </div>
          {recentSubmissions.length === 0 ? (
            <p className="text-sm text-zinc-500">No submissions yet. Start solving!</p>
          ) : (
            <ul className="space-y-2">
              {recentSubmissions.map((s) => (
                <li key={s.id} className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900">
                  <Link href={`/problems/${s.problem.slug}`} className="flex-1 text-sm font-medium text-zinc-900 hover:text-indigo-600 dark:text-zinc-100 dark:hover:text-indigo-400 truncate">
                    {s.problem.title}
                  </Link>
                  <DifficultyBadge difficulty={s.problem.difficulty} />
                  <StatusBadge status={s.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Enrolled playlists */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">My Playlists</h2>
            <Link href="/playlists" className="text-xs text-indigo-600 hover:underline dark:text-indigo-400">
              View all →
            </Link>
          </div>
          {enrollments.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No playlists enrolled.{" "}
              <Link href="/playlists" className="text-indigo-600 hover:underline dark:text-indigo-400">Browse playlists</Link>
            </p>
          ) : (
            <ul className="space-y-3">
              {enrollments.map((e) => {
                const total = e.playlist._count.items;
                const done = e.playlist.items.filter((i) => solvedSet.has(i.problemId)).length;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <li key={e.id} className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
                    <Link href={`/playlists/${e.playlist.slug}`} className="text-sm font-medium text-zinc-900 hover:text-indigo-600 dark:text-zinc-100 dark:hover:text-indigo-400">
                      {e.playlist.title}
                    </Link>
                    <div className="mt-2">
                      <div className="mb-1 flex justify-between text-xs text-zinc-400">
                        <span>{done}/{total}</span><span>{pct}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, accent }: {
  label: string; value: number; sub?: string;
  accent?: "emerald" | "amber" | "red";
}) {
  const color = accent === "emerald" ? "text-emerald-600" : accent === "amber" ? "text-amber-500" : accent === "red" ? "text-red-500" : "text-zinc-900 dark:text-zinc-100";
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>
        {value}<span className="text-sm font-normal text-zinc-400">{sub}</span>
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACCEPTED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    WRONG_ANSWER: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    COMPILE_ERROR: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    RUNTIME_ERROR: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    TIME_LIMIT_EXCEEDED: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    MEMORY_LIMIT_EXCEEDED: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  };
  const label: Record<string, string> = { ACCEPTED: "AC", WRONG_ANSWER: "WA", COMPILE_ERROR: "CE", RUNTIME_ERROR: "RE", TIME_LIMIT_EXCEEDED: "TLE", MEMORY_LIMIT_EXCEEDED: "MLE", PENDING: "…" };
  return (
    <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold ${map[status] ?? "bg-zinc-100 text-zinc-600"}`}>
      {label[status] ?? status}
    </span>
  );
}

