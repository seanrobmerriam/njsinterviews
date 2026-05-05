import { notFound, redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getUserTier } from "@/lib/tier";
import { CodeWorkspace } from "@/components/editor/CodeWorkspace";
import { DifficultyBadge } from "@/components/problems/DifficultyBadge";
import type { ProblemExample } from "@/types/problems";
import type { Language } from "@prisma/client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProblemPage({ params }: PageProps) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const { slug } = await params;

  const [problem, userTier] = await Promise.all([
    prisma.problem.findUnique({
      where: { slug, isActive: true },
      include: {
        starterCode: { select: { language: true, code: true } },
        testCases: {
          where: { isHidden: false },
          select: { id: true, input: true, output: true, explanation: true },
          orderBy: { id: "asc" },
          take: 5,
        },
      },
    }),
    getUserTier(user.id),
  ]);

  if (!problem) notFound();

  // Gate premium problems to FREE users
  if (problem.isPremium && userTier === "FREE") {
    redirect("/problems?upgrade=1");
  }

  const examples = (problem.examples as unknown as ProblemExample[]) ?? [];

  const defaultLanguage: Language =
    (problem.starterCode.find((s) => s.language === "TYPESCRIPT")?.language ??
      problem.starterCode[0]?.language) as Language;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Problem header */}
      <div className="flex items-center gap-3 border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
        <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{problem.title}</h1>
        <DifficultyBadge difficulty={problem.difficulty} />
      </div>

      {/* Workspace */}
      <div className="flex-1 overflow-hidden">
        <CodeWorkspace
          problemId={problem.id}
          title={problem.title}
          description={problem.description}
          examples={examples}
          hints={problem.hints}
          testCases={problem.testCases}
          starterCode={problem.starterCode}
          defaultLanguage={defaultLanguage}
          userTier={userTier}
        />
      </div>
    </div>
  );
}
