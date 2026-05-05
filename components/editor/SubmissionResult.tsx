"use client";

import type { SubmissionStatus } from "@prisma/client";

interface SubmissionResultProps {
  status: SubmissionStatus;
  runtime: number | null;
  memory: number | null;
  errorMessage: string | null;
  testsPassed: number;
  testsTotal: number;
}

const STATUS_CONFIG: Record<
  SubmissionStatus,
  { label: string; className: string; icon: string }
> = {
  PENDING: {
    label: "Running…",
    className: "text-zinc-500 bg-zinc-100 dark:bg-zinc-800",
    icon: "⏳",
  },
  ACCEPTED: {
    label: "Accepted",
    className: "text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400",
    icon: "✓",
  },
  WRONG_ANSWER: {
    label: "Wrong Answer",
    className: "text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
    icon: "✗",
  },
  TIME_LIMIT_EXCEEDED: {
    label: "Time Limit Exceeded",
    className: "text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400",
    icon: "⏱",
  },
  MEMORY_LIMIT_EXCEEDED: {
    label: "Memory Limit Exceeded",
    className: "text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400",
    icon: "💾",
  },
  RUNTIME_ERROR: {
    label: "Runtime Error",
    className: "text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
    icon: "⚠",
  },
  COMPILE_ERROR: {
    label: "Compile Error",
    className: "text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
    icon: "⚠",
  },
};

export function SubmissionResult({
  status,
  runtime,
  memory,
  errorMessage,
  testsPassed,
  testsTotal,
}: SubmissionResultProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div className={`rounded-lg px-4 py-3 ${config.className}`}>
      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden="true">{config.icon}</span>
        <span className="font-semibold">{config.label}</span>
        {testsTotal > 0 && (
          <span className="ml-auto text-sm opacity-75">
            {testsPassed} / {testsTotal} test cases passed
          </span>
        )}
      </div>

      {(runtime != null || memory != null) && (
        <div className="mt-1 flex gap-4 text-xs opacity-75">
          {runtime != null && <span>Runtime: {runtime} ms</span>}
          {memory != null && <span>Memory: {(memory / 1024).toFixed(1)} MB</span>}
        </div>
      )}

      {errorMessage && (
        <pre className="mt-2 overflow-x-auto rounded bg-black/10 p-2 text-xs whitespace-pre-wrap dark:bg-black/30">
          {errorMessage}
        </pre>
      )}
    </div>
  );
}
