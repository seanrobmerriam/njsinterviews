import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { QuestionSetEditor } from "./QuestionSetEditor";

export const dynamic = "force-dynamic";

export default async function QuestionSetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) redirect("/sign-in");

  const { id } = await params;
  const set = await prisma.questionSet.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          problem: { select: { id: true, title: true, slug: true, difficulty: true } },
        },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!set || set.orgId !== orgId) notFound();

  return <QuestionSetEditor questionSet={set} />;
}
