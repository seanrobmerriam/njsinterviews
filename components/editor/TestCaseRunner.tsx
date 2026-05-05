"use client";

import { useState } from "react";

interface TestCase {
  id: string;
  input: string;
  output: string;
  explanation?: string | null;
}

interface RunResult {
  input: string;
  expected: string;
  actual: string | null;
  passed: boolean;
  stderr?: string | null;
}

interface TestCaseRunnerProps {
  testCases: TestCase[];
  runResults: RunResult[] | null;
  isRunning: boolean;
}

export function TestCaseRunner({ testCases, runResults, isRunning }: TestCaseRunnerProps) {
  const [activeTab, setActiveTab] = useState(0);

  const results = runResults ?? testCases.map(() => null);

  return (
    <div className="flex h-full flex-col">
      {/* Tab header */}
      <div
        className="flex border-b border-zinc-200 dark:border-zinc-800"
        role="tablist"
        aria-label="Test cases"
      >
        {testCases.map((tc, i) => {
          const result = results[i];
          const passed = result?.passed;
          const hasResult = result != null;
          return (
            <button
              key={tc.id}
              role="tab"
              aria-selected={activeTab === i}
              aria-controls={`test-panel-${i}`}
              id={`test-tab-${i}`}
              onClick={() => setActiveTab(i)}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                activeTab === i
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              {hasResult && (
                <span
                  aria-hidden="true"
                  className={passed ? "text-emerald-500" : "text-red-500"}
                >
                  {passed ? "✓" : "✗"}
                </span>
              )}
              Case {i + 1}
            </button>
          );
        })}
      </div>

      {/* Tab panels */}
      {testCases.map((tc, i) => {
        const result = results[i];
        return (
          <div
            key={tc.id}
            id={`test-panel-${i}`}
            role="tabpanel"
            aria-labelledby={`test-tab-${i}`}
            hidden={activeTab !== i}
            className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 text-sm"
          >
            {/* Input */}
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Input</p>
              <pre className="overflow-x-auto rounded-md bg-zinc-100 p-2 font-mono text-xs text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
                {tc.input}
              </pre>
            </div>

            {/* Expected */}
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Expected Output</p>
              <pre className="overflow-x-auto rounded-md bg-zinc-100 p-2 font-mono text-xs text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
                {tc.output}
              </pre>
            </div>

            {/* Actual output from run */}
            {result && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Your Output</p>
                <pre
                  className={`overflow-x-auto rounded-md p-2 font-mono text-xs ${
                    result.passed
                      ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-300"
                      : "bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-300"
                  }`}
                >
                  {result.actual ?? "(no output)"}
                </pre>
                {result.stderr && (
                  <pre className="mt-1 overflow-x-auto rounded-md bg-zinc-100 p-2 font-mono text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                    {result.stderr}
                  </pre>
                )}
              </div>
            )}

            {isRunning && activeTab === i && (
              <p className="text-xs text-zinc-400 animate-pulse">Running test…</p>
            )}

            {tc.explanation && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                <span className="font-medium">Explanation: </span>
                {tc.explanation}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
