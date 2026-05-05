"use client";

import { useState, useRef } from "react";
import { useEffect } from "react";

interface Props {
  assessmentId: string;
  assessmentTitle: string;
  onClose: () => void;
  onSuccess?: (sent: number) => void;
}

export function InviteModal({ assessmentId, assessmentTitle, onClose, onSuccess }: Props) {
  const [emailsText, setEmailsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: string[] } | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on ESC
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function parseCSV(text: string): string[] {
    return text
      .split("\n")
      .map((line) => line.split(",")[0]?.trim() ?? "")
      .filter(Boolean);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const emails = parseCSV(content);
      setEmailsText(emails.join("\n"));
    };
    reader.readAsText(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      if (!res.ok) throw new Error(data.error ?? "Failed to send invites");
      const resultData = data as { sent: number; failed: string[] };
      setResult(resultData);
      onSuccess?.(resultData.sent);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-modal-title"
    >
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 id="invite-modal-title" className="text-lg font-semibold">
            Invite Candidates
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-200 transition-colors text-xl leading-none"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          Inviting to: <span className="font-medium text-gray-200">{assessmentTitle}</span>
        </p>

        {result ? (
          <div className="space-y-4">
            <div className="bg-green-900/30 border border-green-800 rounded-md p-4">
              <p className="text-green-400 font-medium">
                ✓ Sent {result.sent} invite{result.sent !== 1 ? "s" : ""}
              </p>
              {result.failed.length > 0 && (
                <div className="mt-2">
                  <p className="text-red-400 text-sm font-medium">
                    Failed ({result.failed.length}):
                  </p>
                  <ul className="text-red-400 text-xs mt-1 space-y-0.5">
                    {result.failed.map((email) => (
                      <li key={email}>{email}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setResult(null); setEmailsText(""); }}
                className="text-sm text-gray-400 hover:text-gray-100 transition-colors"
              >
                Send More
              </button>
              <button
                onClick={onClose}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-gray-400">
                  Emails (one per line or comma separated)
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Upload CSV
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                  aria-label="Upload CSV file"
                />
              </div>
              <textarea
                value={emailsText}
                onChange={(e) => setEmailsText(e.target.value)}
                rows={6}
                placeholder={"alice@example.com\nbob@example.com"}
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
              >
                {loading ? "Sending..." : "Send Invites"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
