import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-gray-800 flex flex-col">
        <div className="px-5 py-4 border-b border-gray-800">
          <Link href="/dashboard" className="text-xl font-bold text-indigo-400 tracking-tight">
            CodeGauntlet
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 text-sm">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/problems">Problems</NavLink>
          <NavLink href="/playlists">Playlists</NavLink>
          <NavLink href="/mock-interview">Mock Interview</NavLink>
          <NavLink href="/settings">Settings</NavLink>
        </nav>
        <div className="px-5 py-4 border-t border-gray-800">
          <UserButton afterSignOutUrl="/" />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-gray-400 hover:bg-gray-800 hover:text-gray-100 transition-colors"
    >
      {children}
    </Link>
  );
}
