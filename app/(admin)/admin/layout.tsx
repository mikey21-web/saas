'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Layout, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { Users, DollarSign, BarChart3, Shield, Activity, Server } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const adminNav = [
    { icon: BarChart3, label: 'Overview', href: '/admin' },
    { icon: Users, label: 'Users', href: '/admin/users' },
    { icon: DollarSign, label: 'Revenue', href: '/admin/revenue' },
    { icon: Activity, label: 'Agents', href: '/admin/agents' },
    { icon: Server, label: 'System', href: '/admin/system' },
    { icon: Shield, label: 'Settings', href: '/admin/settings' },
  ]

  return (
    <Layout>
      <Sidebar className="border-r bg-gray-900 text-white">
        <SidebarContent className="p-2">
          <div className="px-3 py-4 mb-2">
            <h2 className="text-white font-bold text-lg">diyaa.ai</h2>
            <p className="text-gray-400 text-xs">Super Admin</p>
          </div>
          <SidebarGroup>
            <SidebarGroupLabel className="text-gray-400">Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNav.map(({ icon: Icon, label, href }) => (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={href}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          pathname === href
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <main className="flex-1 p-8 overflow-auto bg-gray-50">
        {children}
      </main>
    </Layout>
  )
}
