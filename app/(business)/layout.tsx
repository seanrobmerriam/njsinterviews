import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const navLinks = [
  { href: "/portal/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/portal/question-sets", label: "Question Sets", icon: "📝" },
  { href: "/portal/assessments", label: "Assessments", icon: "🧪" },
  { href: "/portal/candidates", label: "Candidates", icon: "👥" },
];

export default async function BusinessLayout({ children }: { children: React.ReactNode }) {
  const { userId, orgId } = await auth();

  if (!userId) redirect("/sign-in");
  if (!orgId) redirect("/dashboard");

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) redirect("/dashboard");

  const initials = org.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col fixed inset-y-0 border-r border-gray-800 bg-gray-950 z-10">
        {/* Org header */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-800">
          {org.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={org.logoUrl}
              alt={org.name}
              className="w-9 h-9 rounded-md object-cover"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-md flex items-center justify-center text-sm font-bold text-white"
              style={{ backgroundColor: org.brandColor ?? "#6366f1" }}
            >
              {initials}
            </div>
          )}
          <span className="font-semibold text-sm truncate">{org.name}</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-gray-400 hover:bg-gray-800 hover:text-gray-100 transition-colors text-sm"
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-gray-800 space-y-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-gray-400 hover:bg-gray-800 hover:text-gray-100 transition-colors text-sm"
          >
            <span>←</span>
            <span>Back to Platform</span>
          </Link>
          <div className="px-3">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:pl-60 min-h-screen">{children}</main>
    </div>
  );
}
