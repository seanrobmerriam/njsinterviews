"use client";

import { useState, useCallback } from "react";
import type { Language, SubmissionStatus } from "@prisma/client";
import { MonacoEditor } from "./MonacoEditor";
import { TestCaseRunner } from "./TestCaseRunner";
import { SubmissionResult } from "./SubmissionResult";
import type { ProblemExample } from "@/types/problems";

interface TestCase {
  id: string;
  input: string;
  output: string;
  explanation?: string | null;
}

interface StarterCode {
  language: Language;
  code: string;
}

interface RunResult {
  input: string;
  expected: string;
  actual: string | null;
  passed: boolean;
  stderr?: string | null;
}

interface SubmissionState {
  id: string;
  status: SubmissionStatus;
  runtime: number | null;
  memory: number | null;
  errorMessage: string | null;
  testsPassed: number;
  testsTotal: number;
}

interface CodeWorkspaceProps {
  problemId: string;
  title: string;
  description: string;
  examples: ProblemExample[];
  hints: string[];
  testCases: TestCase[];
  starterCode: StarterCode[];
  defaultLanguage: Language;
  userTier: "FREE" | "PRO" | "BUSINESS";
}

const LANGUAGE_LABELS: Record<Language, string> = {
  JAVASCRIPT: "JavaScript",
  TYPESCRIPT: "TypeScript",
  PYTHON: "Python",
  GO: "Go",
  RUST: "Rust",
  JAVA: "Java",
  CPP: "C++",
  SQL: "SQL",
  HTML: "HTML",
};

const BOTTOM_TABS = ["Test Cases", "Results"] as const;
type BottomTab = (typeof BOTTOM_TABS)[number];

export function CodeWorkspace({
  problemId,
  title,
  description,
  examples,
  hints,
  testCases,
  starterCode,
  defaultLanguage,
  userTier,
}: CodeWorkspaceProps) {
  const [language, setLanguage] = useState<Language>(defaultLanguage);
  const [code, setCode] = useState<string>(
    () => starterCode.find((s) => s.language === defaultLanguage)?.code ?? "",
  );
  const [bottomTab, setBottomTab] = useState<BottomTab>("Test Cases");
  const [runResults, setRunResults] = useState<RunResult[] | null>(null);
  const [submission, setSubmission] = useState<SubmissionState | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revealedHints, setRevealedHints] = useState<number[]>([]);
  const [hintError, setHintError] = useState<string | null>(null);
  const [activeDescTab, setActiveDescTab] = useState<"description" | "hints">("description");

  const handleLanguageChange = useCallback(
    (lang: Language) => {
      setLanguage(lang);
      const sc = starterCode.find((s) => s.language === lang);
      if (sc) setCode(sc.code);
    },
    [starterCode],
  );

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setBottomTab("Test Cases");
    setRunResults(null);

    try {
      const res = await fetch("/api/submissions/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId, language, code }),
      });
      const data = (await res.json()) as { results: RunResult[] };
      setRunResults(data.results);
    } catch {
      setRunResults(testCases.map((tc) => ({ input: tc.input, expected: tc.output, actual: null, passed: false })));
    } finally {
      setIsRunning(false);
    }
  }, [problemId, language, code, testCases]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setBottomTab("Results");
    setSubmission(null);

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId, language, code }),
      });
      const { submissionId } = (await res.json()) as { submissionId: string };

      // Poll for results
      const poll = async (): Promise<void> => {
        const r = await fetch(`/api/submissions/${submissionId}`);
        const result = (await r.json()) as SubmissionState;
        setSubmission(result);
        if (result.status === "PENDING") {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          return poll();
        }
      };
      await poll();
    } catch {
      setSubmission({
        id: "",
        status: "RUNTIME_ERROR",
        runtime: null,
        memory: null,
        errorMessage: "Failed to submit. Please try again.",
        testsPassed: 0,
        testsTotal: 0,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [problemId, language, code]);

  const handleRevealHint = useCallback(
    async (index: number) => {
      if (userTier === "FREE") {
        setHintError("Upgrade to Pro to unlock AI hints.");
        return;
      }
      try {
        await fetch("/api/hints", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ problemId, hintIndex: index }),
        });
        setRevealedHints((prev) => [...prev, index]);
        setHintError(null);
      } catch {
        setHintError("Failed to load hint.");
      }
    },
    [problemId, userTier],
  );

  return (
    <div className="flex h-full overflow-hidden">
      {/* LEFT: Problem description */}
      <div className="flex w-[45%] flex-col overflow-hidden border-r border-zinc-200 dark:border-zinc-800">
        {/* Description / Hints tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800" role="tablist">
          {(["description", "hints"] as const).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeDescTab === tab}
              onClick={() => setActiveDescTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 ${
                activeDescTab === tab
                  ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {activeDescTab === "description" && (
            <article className="prose prose-sm prose-zinc max-w-none dark:prose-invert">
              <h2 className="mt-0 text-lg font-bold">{title}</h2>
              <div className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                {description}
              </div>

              {examples.length > 0 && (
                <>
                  <h3>Examples</h3>
                  {examples.map((ex, i) => (
                    <div key={i} className="not-prose my-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                      <p className="mb-1 text-xs font-semibold text-zinc-500">Example {i + 1}</p>
                      <pre className="text-xs text-zinc-800 dark:text-zinc-200">
                        <b>Input:</b> {ex.input}{"\n"}
                        <b>Output:</b> {ex.output}
                        {ex.explanation && `\n\nExplanation: ${ex.explanation}`}
                      </pre>
                    </div>
                  ))}
                </>
              )}
            </article>
          )}

          {activeDescTab === "hints" && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-500">
                {hints.length} hint{hints.length !== 1 ? "s" : ""} available
              </p>
              {hintError && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                  {hintError}
                </p>
              )}
              {hints.map((hint, i) => (
                <div key={i} className="rounded-lg border border-zinc-200 dark:border-zinc-800">
                  {revealedHints.includes(i) ? (
                    <div className="p-3 text-sm text-zinc-700 dark:text-zinc-300">{hint}</div>
                  ) : (
                    <button
                      onClick={() => handleRevealHint(i)}
                      className="w-full px-3 py-2.5 text-left text-sm text-indigo-600 hover:bg-zinc-50 dark:text-indigo-400 dark:hover:bg-zinc-900"
                    >
                      Reveal Hint {i + 1}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Editor + test panel */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Editor toolbar */}
        <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-1.5 dark:border-zinc-800 dark:bg-zinc-900/50">
          <label htmlFor="language-select" className="sr-only">Language</label>
          <select
            id="language-select"
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as Language)}
            className="rounded border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            {starterCode.map((s) => (
              <option key={s.language} value={s.language}>
                {LANGUAGE_LABELS[s.language]}
              </option>
            ))}
          </select>

          <div className="ml-auto flex gap-2">
            <button
              onClick={handleRun}
              disabled={isRunning || isSubmitting}
              aria-label="Run code against visible test cases"
              className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-700 dark:hover:bg-zinc-600"
            >
              {isRunning ? "Running…" : "Run"}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isRunning || isSubmitting}
              aria-label="Submit solution for all test cases"
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Submitting…" : "Submit"}
            </button>
          </div>
        </div>

        {/* Monaco editor (65% height) */}
        <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
          <MonacoEditor language={language} value={code} onChange={setCode} />
        </div>

        {/* Bottom panel: test cases + results (35% height) */}
        <div
          className="flex flex-col border-t border-zinc-200 dark:border-zinc-800"
          style={{ height: "35%" }}
        >
          {/* Bottom tabs */}
          <div
            className="flex border-b border-zinc-200 dark:border-zinc-800"
            role="tablist"
            aria-label="Editor bottom panel"
          >
            {BOTTOM_TABS.map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={bottomTab === tab}
                onClick={() => setBottomTab(tab)}
                className={`px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 ${
                  bottomTab === tab
                    ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden">
            {bottomTab === "Test Cases" && (
              <TestCaseRunner
                testCases={testCases}
                runResults={runResults}
                isRunning={isRunning}
              />
            )}
            {bottomTab === "Results" && (
              <div className="overflow-y-auto p-4">
                {submission ? (
                  <SubmissionResult {...submission} />
                ) : (
                  <p className="text-sm text-zinc-500">
                    {isSubmitting ? "Waiting for results…" : "Submit your solution to see results."}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
