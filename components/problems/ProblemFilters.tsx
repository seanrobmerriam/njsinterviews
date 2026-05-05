"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import type { Difficulty, Category } from "@prisma/client";
import { CATEGORY_LABELS } from "./CategoryTag";

const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

const CATEGORY_GROUPS: { label: string; categories: Category[] }[] = [
  {
    label: "Algorithms",
    categories: [
      "ARRAYS_HASHING",
      "TWO_POINTERS",
      "SLIDING_WINDOW",
      "STACK",
      "BINARY_SEARCH",
      "LINKED_LIST",
      "TREES",
      "TRIES",
      "HEAP",
      "GRAPHS",
      "DYNAMIC_PROGRAMMING",
      "GREEDY",
      "INTERVALS",
      "MATH_GEOMETRY",
      "BIT_MANIPULATION",
      "BACKTRACKING",
    ],
  },
  { label: "Other", categories: ["SYSTEM_DESIGN", "BEHAVIORAL", "SQL", "FRONTEND"] },
  {
    label: "Language Tracks",
    categories: ["GO_TRACK", "RUST_TRACK", "PYTHON_TRACK", "JAVA_TRACK", "CPP_TRACK", "TYPESCRIPT_TRACK"],
  },
];

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  EASY: "text-emerald-600 dark:text-emerald-400",
  MEDIUM: "text-amber-600 dark:text-amber-400",
  HARD: "text-red-600 dark:text-red-400",
};

export function ProblemFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const current = {
    difficulty: searchParams.get("difficulty") as Difficulty | null,
    category: searchParams.get("category") as Category | null,
    status: searchParams.get("status"),
    access: searchParams.get("access"),
    q: searchParams.get("q") ?? "",
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <input
        type="search"
        placeholder="Search problems…"
        aria-label="Search problems"
        defaultValue={current.q}
        onChange={(e) => setParam("q", e.target.value || null)}
        className="h-9 w-56 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />

      {/* Difficulty */}
      <select
        aria-label="Filter by difficulty"
        value={current.difficulty ?? ""}
        onChange={(e) => setParam("difficulty", e.target.value || null)}
        className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      >
        <option value="">All Difficulties</option>
        {DIFFICULTIES.map((d) => (
          <option key={d} value={d} className={DIFFICULTY_COLORS[d]}>
            {d[0] + d.slice(1).toLowerCase()}
          </option>
        ))}
      </select>

      {/* Category */}
      <select
        aria-label="Filter by category"
        value={current.category ?? ""}
        onChange={(e) => setParam("category", e.target.value || null)}
        className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      >
        <option value="">All Categories</option>
        {CATEGORY_GROUPS.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.categories.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {/* Status */}
      <select
        aria-label="Filter by status"
        value={current.status ?? ""}
        onChange={(e) => setParam("status", e.target.value || null)}
        className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      >
        <option value="">All Statuses</option>
        <option value="UNSEEN">Not Started</option>
        <option value="ATTEMPTED">Attempted</option>
        <option value="SOLVED">Solved</option>
      </select>

      {/* Access */}
      <select
        aria-label="Filter by access"
        value={current.access ?? ""}
        onChange={(e) => setParam("access", e.target.value || null)}
        className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      >
        <option value="">All Access</option>
        <option value="free">Free</option>
        <option value="premium">Premium</option>
      </select>

      {/* Clear */}
      {(current.difficulty || current.category || current.status || current.access || current.q) && (
        <button
          onClick={() => router.push(pathname)}
          className="h-9 rounded-lg border border-zinc-200 px-3 text-sm text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
