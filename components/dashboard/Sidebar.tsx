'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bot,
  Store,
  Workflow,
  Zap,
  FolderKanban,
  Users,
  Inbox,
  GraduationCap,
  CreditCard,
  Settings,
  Building2,
  Activity,
  Plus,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { clearStoredSession, useAuthSession } from '@/lib/auth/client'
import { useRouter } from 'next/navigation'

// Section structure matching ActionAgents pattern
const sidebarSections = [
  {
    label: 'AGENTS',
    items: [
      { name: 'Your Agents', href: '/agents', icon: Bot },
      { name: 'Agent Store', href: '/store', icon: Store },
      { name: 'Skills', href: '/skills', icon: Zap },
    ],
  },
  {
    label: 'COMPANY',
    items: [
      { name: 'Office', href: '/office', icon: Building2 },
      { name: 'Projects', href: '/projects', icon: FolderKanban },
      { name: 'Contacts', href: '/contacts', icon: Users },
      { name: 'Analytics', href: '/analytics', icon: Activity },
    ],
  },
  {
    label: 'WORK',
    items: [
      { name: 'Inbox', href: '/inbox', icon: Inbox },
      { name: 'Workflows', href: '/workflows/task-assignment', icon: Workflow },
    ],
  },
]

const footerItems = [
  { name: 'Academy', href: '/academy', icon: GraduationCap },
  { name: 'Billing', href: '/billing', icon: CreditCard },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuthSession()

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">
            <span className="text-gray-900">DIYAA</span>
            <span className="text-coral-500">.AI</span>
          </span>
        </Link>
      </div>

      {/* Create Agent CTA */}
      <div className="px-4 py-4">
        <Link
          href="/create-agent"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 
                     bg-coral-500 hover:bg-coral-600 text-white rounded-lg 
                     font-semibold text-sm transition-all duration-150
                     shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          Create Agent
        </Link>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {sidebarSections.map((section) => (
          <div key={section.label} className="mb-6">
            {/* Section Label */}
            <div className="px-3 mb-2">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                {section.label}
              </span>
            </div>

            {/* Section Items */}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-lg
                        text-sm font-medium transition-all duration-150
                        ${
                          active
                            ? 'bg-coral-50 text-gray-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                    >
                      <Icon
                        className={`w-[18px] h-[18px] ${
                          active ? 'text-coral-500' : 'text-gray-400'
                        }`}
                        strokeWidth={1.75}
                      />
                      <span>{item.name}</span>
                      {active && (
                        <ChevronRight className="w-4 h-4 ml-auto text-coral-400" />
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer Items */}
      <div className="px-3 py-2 border-t border-gray-100">
        <ul className="space-y-0.5">
          {footerItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg
                    text-sm font-medium transition-all duration-150
                    ${
                      active
                        ? 'bg-coral-50 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon
                    className={`w-[18px] h-[18px] ${
                      active ? 'text-coral-500' : 'text-gray-400'
                    }`}
                    strokeWidth={1.75}
                  />
                  <span>{item.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      {/* User Profile */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-coral-400 to-coral-600 flex items-center justify-center text-white text-sm font-semibold">
            {(user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || 'Account'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email || ''}
            </p>
          </div>

          {/* Sign Out */}
          <button
            onClick={() => {
              clearStoredSession()
              router.push('/login')
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
