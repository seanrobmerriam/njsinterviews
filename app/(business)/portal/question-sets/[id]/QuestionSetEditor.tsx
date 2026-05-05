"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Difficulty = "EASY" | "MEDIUM" | "HARD";

interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
}

interface QuestionSetItem {
  id: string;
  problemId: string;
  position: number;
  timeLimitMins: number | null;
  problem: Problem;
}

interface QuestionSet {
  id: string;
  title: string;
  description: string | null;
  isArchived: boolean;
  items: QuestionSetItem[];
}

const difficultyColors: Record<Difficulty, string> = {
  EASY: "text-green-400",
  MEDIUM: "text-yellow-400",
  HARD: "text-red-400",
};

export function QuestionSetEditor({ questionSet }: { questionSet: QuestionSet }) {
  const router = useRouter();
  const [title, setTitle] = useState(questionSet.title);
  const [description, setDescription] = useState(questionSet.description ?? "");
  const [items, setItems] = useState<QuestionSetItem[]>(questionSet.items);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Problem search
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Problem[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchProblems = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/portal/problems/search?q=${encodeURIComponent(q)}&limit=10`);
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchProblems(query), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, searchProblems]);

  async function saveDetails() {
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch(`/api/portal/question-sets/${questionSet.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaveMsg("Saved!");
      setTimeout(() => setSaveMsg(""), 2000);
      router.refresh();
    } catch {
      setSaveMsg("Error saving");
    } finally {
      setSaving(false);
    }
  }

  async function addProblem(problem: Problem) {
    setAddingId(problem.id);
    try {
      const res = await fetch(`/api/portal/question-sets/${questionSet.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId: problem.id }),
      });
      if (!res.ok) throw new Error("Failed to add");
      const newItem = await res.json();
      setItems((prev) => [...prev, { ...newItem, problem }]);
      setQuery("");
      setSearchResults([]);
    } catch {
      // ignore
    } finally {
      setAddingId(null);
    }
  }

  async function removeProblem(problemId: string) {
    try {
      await fetch(`/api/portal/question-sets/${questionSet.id}/items`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId }),
      });
      setItems((prev) => prev.filter((item) => item.problemId !== problemId));
    } catch {
      // ignore
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-2xl font-bold bg-transparent border-b border-transparent hover:border-gray-700 focus:border-indigo-500 focus:outline-none px-1 py-0.5 flex-1"
        />
        {questionSet.isArchived && (
          <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded-full">Archived</span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: details + problem list */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional description..."
              className="w-full bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={saveDetails}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
            >
              {saving ? "Saving..." : "Save Details"}
            </button>
            {saveMsg && <span className="text-sm text-green-400">{saveMsg}</span>}
          </div>

          {/* Problem list */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-800 text-sm font-medium">
              Problems ({items.length})
            </div>
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-gray-500 text-sm">No problems yet. Add some →</p>
            ) : (
              <ul className="divide-y divide-gray-800">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-xs text-gray-600 w-5">{item.position}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.problem.title}</p>
                      {item.timeLimitMins && (
                        <p className="text-xs text-gray-500">{item.timeLimitMins} min limit</p>
                      )}
                    </div>
                    <span className={`text-xs font-medium ${difficultyColors[item.problem.difficulty]}`}>
                      {item.problem.difficulty}
                    </span>
                    <button
                      onClick={() => removeProblem(item.problemId)}
                      className="text-gray-600 hover:text-red-400 transition-colors text-xs"
                      aria-label={`Remove ${item.problem.title}`}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right: search */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Add Problem</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title..."
              className="w-full bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {searching && (
            <p className="text-xs text-gray-500">Searching...</p>
          )}

          {searchResults.length > 0 && (
            <ul className="bg-gray-900 border border-gray-800 rounded-lg divide-y divide-gray-800 max-h-80 overflow-y-auto">
              {searchResults.map((problem) => {
                const alreadyAdded = items.some((i) => i.problemId === problem.id);
                return (
                  <li
                    key={problem.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{problem.title}</p>
                      <p className="text-xs text-gray-500">{problem.slug}</p>
                    </div>
                    <span className={`text-xs font-medium ${difficultyColors[problem.difficulty]}`}>
                      {problem.difficulty}
                    </span>
                    <button
                      onClick={() => !alreadyAdded && addProblem(problem)}
                      disabled={alreadyAdded || addingId === problem.id}
                      className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-2 py-1 rounded transition-colors"
                    >
                      {alreadyAdded ? "Added" : addingId === problem.id ? "..." : "Add"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
