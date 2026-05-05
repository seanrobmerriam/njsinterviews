import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CandidateTable } from "@/components/business/CandidateTable";

export const dynamic = "force-dynamic";

export default async function CandidatesPage() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) redirect("/sign-in");

  const [invites, assessments] = await Promise.all([
    prisma.assessmentInvite.findMany({
      where: { assessment: { orgId } },
      include: { assessment: { select: { id: true, title: true } } },
      orderBy: { expiresAt: "desc" },
    }),
    prisma.assessment.findMany({
      where: { orgId },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);

  const serialized = invites.map((inv) => ({
    id: inv.id,
    candidateEmail: inv.candidateEmail,
    status: inv.status,
    startedAt: inv.startedAt?.toISOString() ?? null,
    completedAt: inv.completedAt?.toISOString() ?? null,
    assessment: inv.assessment,
  }));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Candidates</h1>
      <CandidateTable invites={serialized} assessments={assessments} />
    </div>
  );
}
