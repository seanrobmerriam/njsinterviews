import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  // Ensure user record exists in DB
  await prisma.user.upsert({
    where: { id: user.id },
    update: { lastActiveAt: new Date() },
    create: {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress ?? "",
      username: user.username ?? null,
      avatarUrl: user.imageUrl ?? null,
    },
  });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { tier: true, streakDays: true },
  });

  const totalSolved = await prisma.userProblemProgress.count({
    where: { userId: user.id, status: "SOLVED" },
  });

  const recentSubmissions = await prisma.submission.findMany({
    where: { userId: user.id },
    take: 5,
    orderBy: { submittedAt: "desc" },
    include: { problem: { select: { title: true, slug: true, difficulty: true } } },
  });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">
        Welcome back, {user.firstName ?? user.username ?? "Coder"} 👋
      </h1>
      <p className="text-gray-400 text-sm mb-8">
        Tier:{" "}
        <span className="font-semibold text-indigo-400">{dbUser?.tier ?? "FREE"}</span>
        {" · "}
        🔥 {dbUser?.streakDays ?? 0} day streak
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Problems Solved" value={totalSolved} />
        <StatCard label="Streak" value={`${dbUser?.streakDays ?? 0} days`} />
        <StatCard label="Tier" value={dbUser?.tier ?? "FREE"} />
      </div>

      {/* Recent Submissions */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Recent Submissions</h2>
        {recentSubmissions.length === 0 ? (
          <p className="text-gray-500 text-sm">No submissions yet. Start solving problems!</p>
        ) : (
          <ul className="space-y-2">
            {recentSubmissions.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between bg-gray-900 rounded-lg px-4 py-3 border border-gray-800"
              >
                <span className="text-sm font-medium">{s.problem.title}</span>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded ${
                    s.status === "ACCEPTED"
                      ? "bg-green-900 text-green-300"
                      : s.status === "PENDING"
                        ? "bg-yellow-900 text-yellow-300"
                        : "bg-red-900 text-red-300"
                  }`}
                >
                  {s.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
