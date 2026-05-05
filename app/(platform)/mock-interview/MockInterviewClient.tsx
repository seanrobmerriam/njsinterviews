"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import type { Difficulty } from "@prisma/client";

interface MockProblem {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  category: string;
}

type Stage = "config" | "active" | "done";

const DIFFICULTY_OPTIONS: { label: string; value: "" | Difficulty }[] = [
  { label: "Mixed", value: "" },
  { label: "Easy", value: "EASY" },
  { label: "Medium", value: "MEDIUM" },
  { label: "Hard", value: "HARD" },
];

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function MockInterviewClient() {
  const [stage, setStage] = useState<Stage>("config");
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<"" | Difficulty>("");
  const [durationMins, setDurationMins] = useState(45);
  const [problems, setProblems] = useState<MockProblem[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startSession = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ count: String(count) });
      if (difficulty) params.set("difficulty", difficulty);
      const res = await fetch(`/api/mock-interview?${params}`);
      if (!res.ok) {
        const { error } = (await res.json()) as { error: string };
        alert(error);
        return;
      }
      const { problems: fetched } = (await res.json()) as { problems: MockProblem[] };
      setProblems(fetched);
      setTimeLeft(durationMins * 60);
      setStage("active");
    } finally {
      setLoading(false);
    }
  }, [count, difficulty, durationMins]);

  useEffect(() => {
    if (stage !== "active") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setStage("done");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [stage]);

  const endEarly = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStage("done");
  };

  const reset = () => {
    setStage("config");
    setProblems([]);
  };

  const urgent = timeLeft < 300;

  if (stage === "config") {
    return (
      <form
        className="mt-8 space-y-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
        onSubmit={(e) => { e.preventDefault(); void startSession(); }}
      >
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="mock-count">
            Number of problems
          </label>
          <input
            id="mock-count"
            type="number"
            min={1}
            max={10}
            value={count}
            onChange={(e) => setCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        <div>
          <fieldset>
            <legend className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Difficulty</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {DIFFICULTY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    difficulty === opt.value
                      ? "border-indigo-500 bg-indigo-600 text-white"
                      : "border-zinc-300 text-zinc-600 hover:border-indigo-400 dark:border-zinc-700 dark:text-zinc-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="difficulty"
                    value={opt.value}
                    checked={difficulty === opt.value}
                    onChange={() => setDifficulty(opt.value)}
                    className="sr-only"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="mock-duration">
            Time limit (minutes)
          </label>
          <input
            id="mock-duration"
            type="number"
            min={10}
            max={180}
            step={5}
            value={durationMins}
            onChange={(e) => setDurationMins(Math.min(180, Math.max(10, parseInt(e.target.value) || 45)))}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {loading ? "Loading problems…" : "Start interview"}
        </button>
      </form>
    );
  }

  if (stage === "active") {
    return (
      <div className="mt-8">
        {/* Timer */}
        <div className={`mb-6 flex items-center justify-between rounded-xl border px-6 py-4 ${urgent ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30" : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"}`}>
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Time remaining</span>
          <span className={`text-3xl font-mono font-bold tabular-nums ${urgent ? "text-red-600 dark:text-red-400" : "text-zinc-900 dark:text-zinc-100"}`} aria-live="polite" aria-label={`${formatTime(timeLeft)} remaining`}>
            {formatTime(timeLeft)}
          </span>
          <button onClick={endEarly} className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
            End session
          </button>
        </div>

        {/* Problems */}
        <ol className="space-y-3">
          {problems.map((p, i) => (
            <li key={p.id} className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
              <span className="w-5 shrink-0 text-center text-sm text-zinc-400">{i + 1}</span>
              <Link href={`/problems/${p.slug}`} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm font-medium text-zinc-900 hover:text-indigo-600 dark:text-zinc-100 dark:hover:text-indigo-400">
                {p.title}
                <svg className="ml-1 inline h-3 w-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </Link>
              <span className={`text-xs font-medium ${p.difficulty === "EASY" ? "text-emerald-600" : p.difficulty === "MEDIUM" ? "text-amber-500" : "text-red-500"}`}>
                {p.difficulty}
              </span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  // done
  return (
    <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
        <svg className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Session complete!</h2>
      <p className="mt-2 text-sm text-zinc-500">Great work. Review your solutions and check the editorial for each problem.</p>
      <div className="mt-6 flex justify-center gap-3">
        <button onClick={reset} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
          Start new session
        </button>
        <Link href="/problems" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
          Browse problems
        </Link>
      </div>
    </div>
  );
}
