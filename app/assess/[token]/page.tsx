"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";

type InviteStatus = "PENDING" | "OPENED" | "IN_PROGRESS" | "COMPLETED" | "EXPIRED";
type Difficulty = "EASY" | "MEDIUM" | "HARD";

interface Problem {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: Difficulty;
  examples: unknown;
}

interface QuestionSetItem {
  id: string;
  position: number;
  problem: Problem;
}

interface Assessment {
  title: string;
  description: string | null;
  durationMins: number;
  allowedLanguages: string[];
  questionSet: {
    items: QuestionSetItem[];
  };
}

interface Invite {
  id: string;
  status: InviteStatus;
  startedAt: string | null;
  completedAt: string | null;
  expiresAt: string;
  assessment: Assessment;
}

const STORAGE_KEY_PREFIX = "assess-start-";

const difficultyColors: Record<Difficulty, string> = {
  EASY: "text-green-400",
  MEDIUM: "text-yellow-400",
  HARD: "text-red-400",
};

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function AssessPage() {
  const { token } = useParams<{ token: string }>();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProblemIndex, setSelectedProblemIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [finished, setFinished] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const patchStatus = useCallback(
    async (status: InviteStatus) => {
      await fetch(`/api/assessments/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    },
    [token],
  );

  const finishAssessment = useCallback(async () => {
    if (finishing || finished) return;
    setFinishing(true);
    try {
      await patchStatus("COMPLETED");
      if (timerRef.current) clearInterval(timerRef.current);
      sessionStorage.removeItem(`${STORAGE_KEY_PREFIX}${token}`);
      setFinished(true);
    } finally {
      setFinishing(false);
    }
  }, [patchStatus, token, finishing, finished]);

  // Load invite on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/assessments/${token}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Assessment not found");
          return;
        }
        const data: Invite = await res.json();
        setInvite(data);

        if (data.status === "COMPLETED") {
          setFinished(true);
          return;
        }

        // Patch to OPENED if PENDING
        if (data.status === "PENDING") {
          await patchStatus("OPENED");
        }

        // Set up timer
        const storageKey = `${STORAGE_KEY_PREFIX}${token}`;
        const stored = sessionStorage.getItem(storageKey);
        let startTs: number;
        if (stored) {
          startTs = parseInt(stored, 10);
        } else {
          startTs = Date.now();
          sessionStorage.setItem(storageKey, String(startTs));
        }

        const totalSecs = data.assessment.durationMins * 60;
        const elapsed = Math.floor((Date.now() - startTs) / 1000);
        const remaining = Math.max(0, totalSecs - elapsed);
        setTimeLeft(remaining);

        if (remaining <= 0) {
          finishAssessment();
          return;
        }

        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              if (timerRef.current) clearInterval(timerRef.current);
              finishAssessment();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } catch {
        setError("Failed to load assessment");
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Loading assessment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <h1 className="text-2xl font-bold text-red-400 mb-3">Assessment Unavailable</h1>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold mb-3">Assessment Complete!</h1>
          <p className="text-gray-400">
            Thank you for completing the assessment. Your responses have been recorded. You may
            close this window.
          </p>
        </div>
      </div>
    );
  }

  if (!invite) return null;

  const problems = invite.assessment.questionSet.items.map((item) => item.problem);
  const selectedProblem = problems[selectedProblemIndex];
  const timerColor = timeLeft < 300 ? "text-red-400" : timeLeft < 600 ? "text-yellow-400" : "text-green-400";

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-sm">{invite.assessment.title}</h1>
          {invite.assessment.description && (
            <p className="text-xs text-gray-400">{invite.assessment.description}</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className={`font-mono font-bold text-lg ${timerColor}`} aria-label="Time remaining">
            {formatTime(timeLeft)}
          </span>
          <button
            onClick={finishAssessment}
            disabled={finishing}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
          >
            {finishing ? "Submitting..." : "Finish Assessment"}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Problem list sidebar */}
        <aside className="w-56 border-r border-gray-800 bg-gray-900 shrink-0 overflow-y-auto">
          <div className="px-3 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">
            Problems
          </div>
          <ul className="space-y-0.5 px-2">
            {problems.map((problem, idx) => {
              const hasAnswer = Boolean(answers[problem.id]?.trim());
              return (
                <li key={problem.id}>
                  <button
                    onClick={() => setSelectedProblemIndex(idx)}
                    className={`w-full text-left flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                      idx === selectedProblemIndex
                        ? "bg-indigo-600 text-white"
                        : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${hasAnswer ? "bg-green-400" : "bg-gray-600"}`}
                    />
                    <span className="truncate">{problem.title}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Problem content */}
        {selectedProblem && (
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold">{selectedProblem.title}</h2>
                <span className={`text-sm font-medium ${difficultyColors[selectedProblem.difficulty]}`}>
                  {selectedProblem.difficulty}
                </span>
              </div>

              {/* Description */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-5">
                <pre className="whitespace-pre-wrap text-sm text-gray-300 font-sans leading-relaxed">
                  {selectedProblem.description}
                </pre>
              </div>

              {/* Examples */}
              {Array.isArray(selectedProblem.examples) && (selectedProblem.examples as unknown[]).length > 0 && (
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">Examples</h3>
                  <div className="space-y-2">
                    {(selectedProblem.examples as { input?: string; output?: string; explanation?: string }[]).map(
                      (ex, i) => (
                        <div
                          key={i}
                          className="bg-gray-900 border border-gray-800 rounded-md px-4 py-3 text-sm font-mono"
                        >
                          {ex.input !== undefined && (
                            <p className="text-gray-400">
                              <span className="text-gray-500">Input: </span>
                              {String(ex.input)}
                            </p>
                          )}
                          {ex.output !== undefined && (
                            <p className="text-gray-400">
                              <span className="text-gray-500">Output: </span>
                              {String(ex.output)}
                            </p>
                          )}
                          {ex.explanation && (
                            <p className="text-gray-500 mt-1 text-xs">{ex.explanation}</p>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              {/* Code area */}
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">
                  Your Solution
                </label>
                <textarea
                  value={answers[selectedProblem.id] ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [selectedProblem.id]: e.target.value }))
                  }
                  rows={18}
                  placeholder="Write your solution here..."
                  spellCheck={false}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-sm font-mono text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                />
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
