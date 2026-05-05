"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type InviteStatus = "PENDING" | "OPENED" | "IN_PROGRESS" | "COMPLETED" | "EXPIRED";

const STATUS_OPTIONS: InviteStatus[] = [
  "PENDING",
  "OPENED",
  "IN_PROGRESS",
  "COMPLETED",
  "EXPIRED",
];

const statusColors: Record<InviteStatus, string> = {
  PENDING: "bg-gray-700 text-gray-300",
  OPENED: "bg-blue-900/60 text-blue-400",
  IN_PROGRESS: "bg-yellow-900/60 text-yellow-400",
  COMPLETED: "bg-green-900/60 text-green-400",
  EXPIRED: "bg-red-900/60 text-red-400",
};

export interface CandidateInvite {
  id: string;
  candidateEmail: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  assessment: { id: string; title: string };
}

interface Props {
  invites: CandidateInvite[];
  assessments: { id: string; title: string }[];
}

export function CandidateTable({ invites, assessments }: Props) {
  const router = useRouter();
  const [assessmentFilter, setAssessmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const filtered = invites.filter((inv) => {
    if (assessmentFilter && inv.assessment.id !== assessmentFilter) return false;
    if (statusFilter && inv.status !== statusFilter) return false;
    if (search && !inv.candidateEmail.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search email..."
          className="bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={assessmentFilter}
          onChange={(e) => setAssessmentFilter(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Filter by assessment"
        >
          <option value="">All Assessments</option>
          {assessments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {(assessmentFilter || statusFilter || search) && (
          <button
            onClick={() => { setAssessmentFilter(""); setStatusFilter(""); setSearch(""); }}
            className="text-sm text-gray-400 hover:text-gray-100 px-2"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        {filtered.length === 0 ? (
          <p className="px-5 py-10 text-center text-gray-500 text-sm">No candidates found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-800">
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Assessment</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Started</th>
                <th className="px-5 py-3">Completed</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => router.push(`/portal/candidates/${inv.id}`)}
                  className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3 font-medium">{inv.candidateEmail}</td>
                  <td className="px-5 py-3 text-gray-400">{inv.assessment.title}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        statusColors[inv.status as InviteStatus] ?? "bg-gray-700 text-gray-300"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400">
                    {inv.startedAt ? new Date(inv.startedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-5 py-3 text-gray-400">
                    {inv.completedAt ? new Date(inv.completedAt).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-600">
        Showing {filtered.length} of {invites.length} candidates
      </p>
    </div>
  );
}
