"use client";

import { useState } from "react";

interface Props {
  inviteId: string;
  initialNotes: string;
}

export function NotesEditor({ inviteId, initialNotes }: Props) {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSave() {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(`/api/portal/candidates/${inviteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setMsg("Saved!");
      setTimeout(() => setMsg(""), 2000);
    } catch {
      setMsg("Error saving");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
      <h2 className="font-semibold mb-3">Notes</h2>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
        placeholder="Add interview notes, observations..."
        className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-3"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
        >
          {saving ? "Saving..." : "Save Notes"}
        </button>
        {msg && (
          <span className={`text-sm ${msg.startsWith("Error") ? "text-red-400" : "text-green-400"}`}>
            {msg}
          </span>
        )}
      </div>
    </div>
  );
}
