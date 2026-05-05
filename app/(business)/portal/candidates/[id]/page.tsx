import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NotesEditor } from "./NotesEditor";
import Link from "next/link";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  PENDING: "bg-gray-700 text-gray-300",
  OPENED: "bg-blue-900/60 text-blue-400",
  IN_PROGRESS: "bg-yellow-900/60 text-yellow-400",
  COMPLETED: "bg-green-900/60 text-green-400",
  EXPIRED: "bg-red-900/60 text-red-400",
};

const difficultyColors: Record<string, string> = {
  EASY: "text-green-400",
  MEDIUM: "text-yellow-400",
  HARD: "text-red-400",
};

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) redirect("/sign-in");

  const { id } = await params;
  const invite = await prisma.assessmentInvite.findUnique({
    where: { id },
    include: {
      assessment: {
        select: {
          id: true,
          title: true,
          orgId: true,
          durationMins: true,
        },
      },
    },
  });

  if (!invite || invite.assessment.orgId !== orgId) notFound();

  const submissions = await prisma.submission.findMany({
    where: { assessmentId: invite.assessmentId },
    include: {
      problem: { select: { title: true, slug: true, difficulty: true } },
    },
    orderBy: { submittedAt: "desc" },
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/portal/candidates" className="text-gray-500 hover:text-gray-300 text-sm">
          ← Candidates
        </Link>
        <h1 className="text-2xl font-bold mt-2">{invite.candidateEmail}</h1>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Assessment", value: invite.assessment.title },
          {
            label: "Status",
            value: invite.status,
            colorClass: statusColors[invite.status] ?? "bg-gray-700 text-gray-300",
            isBadge: true,
          },
          {
            label: "Started",
            value: invite.startedAt ? new Date(invite.startedAt).toLocaleString() : "—",
          },
          {
            label: "Completed",
            value: invite.completedAt ? new Date(invite.completedAt).toLocaleString() : "—",
          },
        ].map((item) => (
          <div key={item.label} className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
            <p className="text-xs text-gray-500 mb-1">{item.label}</p>
            {item.isBadge ? (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.colorClass}`}>
                {item.value}
              </span>
            ) : (
              <p className="text-sm font-medium">{item.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Notes */}
      <NotesEditor inviteId={id} initialNotes={invite.notes ?? ""} />

      {/* Submissions */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="font-semibold">Submissions ({submissions.length})</h2>
        </div>
        {submissions.length === 0 ? (
          <p className="px-5 py-8 text-center text-gray-500 text-sm">No submissions yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-800">
                <th className="px-5 py-3">Problem</th>
                <th className="px-5 py-3">Difficulty</th>
                <th className="px-5 py-3">Language</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Runtime</th>
                <th className="px-5 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub.id} className="border-b border-gray-800 last:border-0">
                  <td className="px-5 py-3 font-medium">{sub.problem.title}</td>
                  <td className={`px-5 py-3 text-xs font-medium ${difficultyColors[sub.problem.difficulty] ?? ""}`}>
                    {sub.problem.difficulty}
                  </td>
                  <td className="px-5 py-3 text-gray-400">{sub.language}</td>
                  <td className="px-5 py-3 text-gray-400">{sub.status}</td>
                  <td className="px-5 py-3 text-gray-400">
                    {sub.runtime != null ? `${sub.runtime}ms` : "—"}
                  </td>
                  <td className="px-5 py-3 text-gray-400">
                    {new Date(sub.submittedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
