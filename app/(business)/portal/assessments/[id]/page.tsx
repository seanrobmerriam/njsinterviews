import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { InvitePanel } from "./InvitePanel";
import Link from "next/link";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  PENDING: "bg-gray-700 text-gray-300",
  OPENED: "bg-blue-900/60 text-blue-400",
  IN_PROGRESS: "bg-yellow-900/60 text-yellow-400",
  COMPLETED: "bg-green-900/60 text-green-400",
  EXPIRED: "bg-red-900/60 text-red-400",
};

export default async function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) redirect("/sign-in");

  const { id } = await params;
  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      invitations: {
        select: {
          id: true,
          candidateEmail: true,
          status: true,
          startedAt: true,
          completedAt: true,
          expiresAt: true,
          token: true,
        },
        orderBy: { expiresAt: "desc" },
      },
      questionSet: { select: { id: true, title: true } },
    },
  });

  if (!assessment || assessment.orgId !== orgId) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/portal/assessments" className="text-gray-500 hover:text-gray-300 text-sm">
              ← Assessments
            </Link>
          </div>
          <h1 className="text-2xl font-bold">{assessment.title}</h1>
          {assessment.description && (
            <p className="text-gray-400 mt-1 text-sm">{assessment.description}</p>
          )}
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${
            assessment.isActive
              ? "bg-green-900/60 text-green-400"
              : "bg-gray-700 text-gray-400"
          }`}
        >
          {assessment.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Question Set", value: assessment.questionSet.title },
          { label: "Duration", value: `${assessment.durationMins} min` },
          {
            label: "Expires",
            value: assessment.expiresAt
              ? new Date(assessment.expiresAt).toLocaleDateString()
              : "Never",
          },
          { label: "Languages", value: assessment.allowedLanguages.join(", ") || "All" },
        ].map((item) => (
          <div key={item.label} className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
            <p className="text-xs text-gray-500 mb-1">{item.label}</p>
            <p className="text-sm font-medium truncate">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Invite panel */}
      <InvitePanel assessmentId={assessment.id} assessmentTitle={assessment.title} />

      {/* Candidates table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="font-semibold">Candidates ({assessment.invitations.length})</h2>
        </div>
        {assessment.invitations.length === 0 ? (
          <p className="px-5 py-8 text-center text-gray-500 text-sm">No invitations sent yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-800">
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Started</th>
                <th className="px-5 py-3">Completed</th>
                <th className="px-5 py-3">Expires</th>
                <th className="px-5 py-3">Link</th>
              </tr>
            </thead>
            <tbody>
              {assessment.invitations.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-800 last:border-0">
                  <td className="px-5 py-3">
                    <Link
                      href={`/portal/candidates/${inv.id}`}
                      className="hover:text-indigo-400 transition-colors"
                    >
                      {inv.candidateEmail}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[inv.status] ?? "bg-gray-700 text-gray-400"}`}
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
                  <td className="px-5 py-3 text-gray-400">
                    {new Date(inv.expiresAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <a
                      href={`${appUrl}/assess/${inv.token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-400 hover:underline"
                    >
                      Copy link ↗
                    </a>
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
