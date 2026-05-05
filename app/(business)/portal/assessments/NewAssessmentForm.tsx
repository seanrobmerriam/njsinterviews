"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Language =
  | "JAVASCRIPT"
  | "TYPESCRIPT"
  | "PYTHON"
  | "GO"
  | "RUST"
  | "JAVA"
  | "CPP"
  | "SQL"
  | "HTML";

const ALL_LANGUAGES: Language[] = [
  "JAVASCRIPT",
  "TYPESCRIPT",
  "PYTHON",
  "GO",
  "RUST",
  "JAVA",
  "CPP",
  "SQL",
  "HTML",
];

interface QuestionSetOption {
  id: string;
  title: string;
}

export function NewAssessmentForm({ questionSets }: { questionSets: QuestionSetOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questionSetId, setQuestionSetId] = useState("");
  const [durationMins, setDurationMins] = useState(90);
  const [expiresAt, setExpiresAt] = useState("");
  const [allowedLanguages, setAllowedLanguages] = useState<Language[]>([
    "JAVASCRIPT",
    "TYPESCRIPT",
    "PYTHON",
  ]);

  function toggleLanguage(lang: Language) {
    setAllowedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/portal/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          questionSetId,
          durationMins,
          expiresAt: expiresAt || undefined,
          allowedLanguages,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create");
      }
      setOpen(false);
      setTitle("");
      setDescription("");
      setQuestionSetId("");
      setDurationMins(90);
      setExpiresAt("");
      setAllowedLanguages(["JAVASCRIPT", "TYPESCRIPT", "PYTHON"]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
      >
        + New Assessment
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 overflow-y-auto py-8">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-lg mx-4">
        <h2 className="text-lg font-semibold mb-4">New Assessment</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Backend Engineer Technical Screen"
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Question Set *</label>
            <select
              value={questionSetId}
              onChange={(e) => setQuestionSetId(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a question set...</option>
              {questionSets.map((qs) => (
                <option key={qs.id} value={qs.id}>
                  {qs.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Duration (minutes)</label>
            <input
              type="number"
              value={durationMins}
              onChange={(e) => setDurationMins(parseInt(e.target.value, 10))}
              min={15}
              max={480}
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Expiry Date (optional)</label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Allowed Languages</label>
            <div className="grid grid-cols-3 gap-2">
              {ALL_LANGUAGES.map((lang) => (
                <label key={lang} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowedLanguages.includes(lang)}
                    onChange={() => toggleLanguage(lang)}
                    className="rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-gray-300">{lang}</span>
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => { setOpen(false); setError(""); }}
              className="px-4 py-2 text-sm text-gray-400 hover:text-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
