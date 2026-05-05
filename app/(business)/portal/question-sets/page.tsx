import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NewQuestionSetForm } from "./NewQuestionSetForm";

export const dynamic = "force-dynamic";

export default async function QuestionSetsPage() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) redirect("/sign-in");

  const sets = await prisma.questionSet.findMany({
    where: { orgId },
    include: { _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Question Sets</h1>
        <NewQuestionSetForm />
      </div>

      {sets.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
          <p className="text-gray-400">No question sets yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sets.map((set) => (
            <Link
              key={set.id}
              href={`/portal/question-sets/${set.id}`}
              className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-5 py-4 hover:border-indigo-500 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium group-hover:text-indigo-400 transition-colors truncate">
                    {set.title}
                  </p>
                  {set.isArchived && (
                    <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">
                      Archived
                    </span>
                  )}
                </div>
                {set.description && (
                  <p className="text-sm text-gray-400 mt-0.5 truncate">{set.description}</p>
                )}
              </div>
              <div className="flex items-center gap-4 ml-4 text-sm text-gray-400 shrink-0">
                <span>{set._count.items} problems</span>
                <span>{new Date(set.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
