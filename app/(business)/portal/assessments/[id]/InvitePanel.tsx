"use client";

import { useState } from "react";

interface Props {
  assessmentId: string;
  assessmentTitle: string;
}

export function InvitePanel({ assessmentId, assessmentTitle }: Props) {
  const [emailsText, setEmailsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: string[] } | null>(null);
  const [error, setError] = useState("");

  async function handleSend() {
    setError("");
    setResult(null);
    const emails = emailsText
      .split(/[\n,]+/)
      .map((e) => e.trim())
      .filter(Boolean);

    if (emails.length === 0) {
      setError("Enter at least one email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/portal/assessments/${assessmentId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      setResult(data as { sent: number; failed: string[] });
      setEmailsText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
      <h2 className="font-semibold mb-3">
        Invite Candidates to &ldquo;{assessmentTitle}&rdquo;
      </h2>
      <p className="text-xs text-gray-500 mb-3">
        Enter one email per line, or separate with commas.
      </p>
      <textarea
        value={emailsText}
        onChange={(e) => setEmailsText(e.target.value)}
        rows={4}
        placeholder="alice@example.com&#10;bob@example.com"
        className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-3"
      />
      {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
      {result && (
        <div className="text-sm mb-3">
          <p className="text-green-400">✓ Sent {result.sent} invite{result.sent !== 1 ? "s" : ""}</p>
          {result.failed.length > 0 && (
            <p className="text-red-400 mt-1">Failed: {result.failed.join(", ")}</p>
          )}
        </div>
      )}
      <button
        onClick={handleSend}
        disabled={loading}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
      >
        {loading ? "Sending..." : "Send Invites"}
      </button>
    </div>
  );
}
