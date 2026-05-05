import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PortalDashboardPage() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) redirect("/sign-in");

  const [
    questionSetCount,
    totalAssessments,
    activeAssessments,
    totalInvited,
    totalCompleted,
    recent5Completed,
  ] = await Promise.all([
    prisma.questionSet.count({ where: { orgId, isArchived: false } }),
    prisma.assessment.count({ where: { orgId } }),
    prisma.assessment.count({ where: { orgId, isActive: true } }),
    prisma.assessmentInvite.count({ where: { assessment: { orgId } } }),
    prisma.assessmentInvite.count({ where: { assessment: { orgId }, status: "COMPLETED" } }),
    prisma.assessmentInvite.findMany({
      where: { assessment: { orgId }, status: "COMPLETED" },
      include: { assessment: { select: { title: true } } },
      orderBy: { completedAt: "desc" },
      take: 5,
    }),
  ]);

  const stats = [
    { label: "Question Sets", value: questionSetCount, color: "text-indigo-400" },
    { label: "Active Assessments", value: activeAssessments, color: "text-green-400" },
    { label: "Candidates Invited", value: totalInvited, color: "text-blue-400" },
    { label: "Completed", value: totalCompleted, color: "text-yellow-400" },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Portal Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-lg p-5">
            <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link
          href="/portal/question-sets"
          className="bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-indigo-500 transition-colors group"
        >
          <p className="text-lg font-semibold group-hover:text-indigo-400 transition-colors">
            Create Question Set →
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Build curated sets of problems for your assessments.
          </p>
        </Link>
        <Link
          href="/portal/assessments"
          className="bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-indigo-500 transition-colors group"
        >
          <p className="text-lg font-semibold group-hover:text-indigo-400 transition-colors">
            Send Assessment →
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Invite candidates and track their progress.
          </p>
        </Link>
      </div>

      {/* Recent completions */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="font-semibold">Recent Completions</h2>
        </div>
        {recent5Completed.length === 0 ? (
          <p className="px-5 py-8 text-center text-gray-500 text-sm">No completions yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-800">
                <th className="px-5 py-3">Candidate</th>
                <th className="px-5 py-3">Assessment</th>
                <th className="px-5 py-3">Completed</th>
              </tr>
            </thead>
            <tbody>
              {recent5Completed.map((invite) => (
                <tr key={invite.id} className="border-b border-gray-800 last:border-0">
                  <td className="px-5 py-3 text-gray-200">{invite.candidateEmail}</td>
                  <td className="px-5 py-3 text-gray-400">{invite.assessment.title}</td>
                  <td className="px-5 py-3 text-gray-400">
                    {invite.completedAt
                      ? new Date(invite.completedAt).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Totals footer */}
      <p className="text-xs text-gray-600 mt-4">
        Total assessments created: {totalAssessments}
      </p>
    </div>
  );
}
