"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

const sidebarItems = [
  { name: "Your Agents", href: "/dashboard", icon: "🤖" },
  { name: "Agent Store", href: "/store", icon: "🏪" },
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
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 bg-white flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="text-2xl font-bold text-brand-600">diyaa.ai</div>
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
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-brand-50 text-brand-600 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
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
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between p-2">
            <span className="text-xs font-medium text-gray-600">Account</span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              {breadcrumbs.length > 0 && <span className="text-gray-400">/</span>}
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href} className="flex items-center gap-2">
                  {index > 0 && <span className="text-gray-400">/</span>}
                  <Link href={crumb.href} className="text-gray-600 hover:text-gray-900">
                    {crumb.name}
                  </Link>
                </div>
              ))}
            </div>

            {/* Kill Switch */}
            <button className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium text-sm flex items-center gap-2">
              <span>⏸</span>
              Pause All
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
