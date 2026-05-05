import Link from "next/link";
import type { Difficulty, Category, ProgressStatus } from "@prisma/client";
import { DifficultyBadge } from "./DifficultyBadge";
import { CategoryTag } from "./CategoryTag";

export interface ProblemRow {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  category: Category;
  isFree: boolean;
  isPremium: boolean;
  orderIndex: number;
  progressStatus?: ProgressStatus | null;
  acceptanceRate?: number | null;
}

interface ProblemListProps {
  problems: ProblemRow[];
  userTier: "FREE" | "PRO" | "BUSINESS";
}

const STATUS_ICONS: Record<string, { icon: string; label: string; className: string }> = {
  SOLVED: { icon: "✓", label: "Solved", className: "text-emerald-500" },
  ATTEMPTED: { icon: "○", label: "Attempted", className: "text-amber-500" },
  UNSEEN: { icon: "·", label: "Not started", className: "text-zinc-300 dark:text-zinc-600" },
};

export function ProblemList({ problems, userTier }: ProblemListProps) {
  if (problems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
        <p className="text-lg font-medium">No problems match your filters.</p>
        <p className="mt-1 text-sm">Try adjusting your search or clearing filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 text-left dark:border-zinc-800 dark:bg-zinc-900/50">
            <th className="w-8 px-4 py-3 font-medium text-zinc-500" aria-label="Status" />
            <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Title</th>
            <th className="hidden px-4 py-3 font-medium text-zinc-600 sm:table-cell dark:text-zinc-400">Category</th>
            <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Difficulty</th>
            <th className="hidden px-4 py-3 text-right font-medium text-zinc-600 md:table-cell dark:text-zinc-400">
              Acceptance
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
          {problems.map((problem) => {
            const isLocked = problem.isPremium && userTier === "FREE";
            const statusInfo = STATUS_ICONS[problem.progressStatus ?? "UNSEEN"];

            return (
              <tr
                key={problem.id}
                className="group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/30"
              >
                {/* Status icon */}
                <td className="px-4 py-3">
                  <span
                    aria-label={statusInfo?.label}
                    className={`text-base font-bold ${statusInfo?.className}`}
                  >
                    {statusInfo?.icon}
                  </span>
                </td>

                {/* Title */}
                <td className="px-4 py-3">
                  {isLocked ? (
                    <span className="flex items-center gap-2 text-zinc-400 dark:text-zinc-600">
                      <span>{problem.title}</span>
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        Pro
                      </span>
                    </span>
                  ) : (
                    <Link
                      href={`/problems/${problem.slug}`}
                      className="font-medium text-zinc-900 group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400"
                    >
                      {problem.title}
                    </Link>
                  )}
                </td>

                {/* Category */}
                <td className="hidden px-4 py-3 sm:table-cell">
                  <CategoryTag category={problem.category} />
                </td>

                {/* Difficulty */}
                <td className="px-4 py-3">
                  <DifficultyBadge difficulty={problem.difficulty} />
                </td>

                {/* Acceptance rate */}
                <td className="hidden px-4 py-3 text-right text-zinc-500 md:table-cell dark:text-zinc-400">
                  {problem.acceptanceRate != null ? `${problem.acceptanceRate.toFixed(1)}%` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
