import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NewAssessmentForm } from "./NewAssessmentForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AssessmentsPage() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) redirect("/sign-in");

  const [assessments, questionSets] = await Promise.all([
    prisma.assessment.findMany({
      where: { orgId },
      include: {
        _count: { select: { invitations: true } },
        questionSet: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.questionSet.findMany({
      where: { orgId, isArchived: false },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Assessments</h1>
        <NewAssessmentForm questionSets={questionSets} />
      </div>

      {assessments.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
          <p className="text-gray-400">No assessments yet. Create one to start inviting candidates.</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-800">
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Question Set</th>
                <th className="px-5 py-3">Invites</th>
                <th className="px-5 py-3">Duration</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-gray-800 last:border-0 hover:bg-gray-800/40 transition-colors"
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/portal/assessments/${a.id}`}
                      className="font-medium hover:text-indigo-400 transition-colors"
                    >
                      {a.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-400">{a.questionSet.title}</td>
                  <td className="px-5 py-3 text-gray-400">{a._count.invitations}</td>
                  <td className="px-5 py-3 text-gray-400">{a.durationMins} min</td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        a.isActive
                          ? "bg-green-900/60 text-green-400"
                          : "bg-gray-700 text-gray-400"
                      }`}
                    >
                      {a.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
