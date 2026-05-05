"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function EnrollButton({ playlistId, enrolled: initial }: { playlistId: string; enrolled: boolean }) {
  const [enrolled, setEnrolled] = useState(initial);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggle = async () => {
    setLoading(true);
    try {
      if (enrolled) {
        await fetch(`/api/playlists/enroll?playlistId=${playlistId}`, { method: "DELETE" });
        setEnrolled(false);
      } else {
        const res = await fetch("/api/playlists/enroll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playlistId }),
        });
        if (res.ok) setEnrolled(true);
        else {
          const { error } = (await res.json()) as { error: string };
          alert(error);
        }
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
        enrolled
          ? "bg-indigo-600 text-white hover:bg-indigo-500"
          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
      }`}
    >
      {loading ? "…" : enrolled ? "Enrolled ✓" : "Enroll"}
    </button>
  );
}
