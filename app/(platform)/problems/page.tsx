import { Suspense } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Difficulty, Category } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserTier } from "@/lib/tier";
import { ProblemFilters } from "@/components/problems/ProblemFilters";
import { ProblemList } from "@/components/problems/ProblemList";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    difficulty?: string;
    category?: string;
    status?: string;
    access?: string;
    q?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 50;

export default async function ProblemsPage({ searchParams }: PageProps) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const params = await searchParams;
  const userTier = await getUserTier(user.id);

  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  // Build Prisma where clause from search params
  const where = {
    isActive: true,
    ...(params.difficulty && { difficulty: params.difficulty as Difficulty }),
    ...(params.category && { category: params.category as Category }),
    ...(params.access === "free" && { isFree: true }),
    ...(params.access === "premium" && { isPremium: true }),
    ...(params.q && {
      title: { contains: params.q, mode: "insensitive" as const },
    }),
  };

  const [problems, totalCount, progressRecords] = await Promise.all([
    prisma.problem.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        difficulty: true,
        category: true,
        isFree: true,
        isPremium: true,
        orderIndex: true,
      },
      orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
      take: PAGE_SIZE,
      skip,
    }),
    prisma.problem.count({ where }),
    prisma.userProblemProgress.findMany({
      where: { userId: user.id },
      select: { problemId: true, status: true },
    }),
  ]);

  const progressMap = new Map(progressRecords.map((p) => [p.problemId, p.status]));

  // Filter by status after fetching (status requires join data)
  const statusFilter = params.status;
  let filteredProblems = problems.map((p) => ({
    ...p,
    progressStatus: progressMap.get(p.id) ?? null,
    acceptanceRate: null as number | null,
  }));

  if (statusFilter) {
    filteredProblems = filteredProblems.filter((p) => {
      const s = p.progressStatus ?? "UNSEEN";
      return s === statusFilter;
    });
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Problems</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {totalCount} problems · {userTier} plan
        </p>
      </div>

      <div className="mb-4">
        <Suspense>
          <ProblemFilters />
        </Suspense>
      </div>

      <ProblemList problems={filteredProblems} userTier={userTier} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm text-zinc-500">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`?${new URLSearchParams({ ...params, page: String(page - 1) })}`}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Previous
              </a>
            )}
            {page < totalPages && (
              <a
                href={`?${new URLSearchParams({ ...params, page: String(page + 1) })}`}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Next
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
