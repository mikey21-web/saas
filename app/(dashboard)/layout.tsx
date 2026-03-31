"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserButton, useAuth } from "@clerk/nextjs";

const sidebarItems = [
  { name: "Your Agents", href: "/dashboard", icon: "🤖" },
  { name: "Agent Store", href: "/store", icon: "🏪" },
  { name: "Workflows", href: "/workflows/task-assignment", icon: "⚙️🔄" },
  { name: "Skills", href: "/skills", icon: "⚡" },
  { name: "Projects", href: "/projects", icon: "📁" },
  { name: "Contacts", href: "/contacts", icon: "👥" },
  { name: "Inbox", href: "/inbox", icon: "📬" },
  { name: "Academy", href: "/academy", icon: "📚" },
  { name: "Analytics", href: "/analytics", icon: "📊" },
  { name: "Billing", href: "/billing", icon: "💳" },
  { name: "Settings", href: "/settings", icon: "⚙️" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: '#0c0c0d' }}>
        <div style={{ color: '#71717a' }}>Loading...</div>
      </div>
    );
  }

  const handlePauseAll = async () => {
    setIsPaused(!isPaused);
    // TODO: Call API to pause/resume all agents
  };

  const getBreadcrumbs = () => {
    const parts = pathname.split("/").filter(Boolean);
    return parts.map((part, index) => {
      const href = "/" + parts.slice(0, index + 1).join("/");
      const name = part.charAt(0).toUpperCase() + part.slice(1);
      return { name, href };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="flex h-screen" style={{ background: '#0c0c0d' }}>
      {/* Sidebar */}
      <div className="w-64 border-r flex flex-col" style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#0c0c0d' }}>
        {/* Logo */}
        <div className="p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="text-2xl font-bold" style={{ color: '#e879f9' }}>diyaa.ai</div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <ul className="space-y-2">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors font-medium`}
                    style={{
                      background: isActive ? 'rgba(232,121,249,0.15)' : 'transparent',
                      color: isActive ? '#e879f9' : '#71717a'
                    }}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between p-2">
            <span className="text-xs font-medium" style={{ color: '#71717a' }}>Account</span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b px-6 py-4" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(22,22,24,0.4)', backdropFilter: 'blur(10px)' }}>
          <div className="flex items-center justify-between">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <Link href="/" style={{ color: '#71717a' }} className="hover:text-gray-300 transition">
                Dashboard
              </Link>
              {breadcrumbs.length > 0 && <span style={{ color: '#71717a' }}>/</span>}
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href} className="flex items-center gap-2">
                  {index > 0 && <span style={{ color: '#71717a' }}>/</span>}
                  <Link href={crumb.href} style={{ color: '#71717a' }} className="hover:text-gray-300 transition">
                    {crumb.name}
                  </Link>
                </div>
              ))}
            </div>

            {/* Kill Switch */}
            <button onClick={handlePauseAll} className="px-4 py-2 rounded-lg hover:opacity-90 font-medium text-sm flex items-center gap-2 transition" style={{ background: '#dc2626', color: '#fff' }}>
              <span>{isPaused ? '▶' : '⏸'}</span>
              {isPaused ? 'Resume All' : 'Pause All'}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto" style={{ background: '#0c0c0d' }}>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
