'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  Users,
  BookMarked,
  Bookmark,
  DollarSign,
  BarChart2,
  LayoutDashboard,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logoutAction } from '@/app/logout/actions'

type NavItem = {
  label: string
  href: string
  icon: React.ReactNode
  librarianOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',    href: '/',             icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Books',        href: '/books',         icon: <BookOpen className="h-4 w-4" /> },
  { label: 'Members',      href: '/members',       icon: <Users className="h-4 w-4" />, librarianOnly: true },
  { label: 'Borrowings',   href: '/borrowings',    icon: <BookMarked className="h-4 w-4" /> },
  { label: 'Reservations', href: '/reservations',  icon: <Bookmark className="h-4 w-4" /> },
  { label: 'Fines',        href: '/fines',         icon: <DollarSign className="h-4 w-4" /> },
  { label: 'Reports',      href: '/reports',       icon: <BarChart2 className="h-4 w-4" />, librarianOnly: true },
]

type Props = {
  role: string
  name: string
}

export function NavSidebar({ role, name }: Props) {
  const pathname = usePathname()

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.librarianOnly || role === 'librarian'
  )

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-sidebar shrink-0">
      {/* Wordmark */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-sidebar-border">
        <BookOpen className="h-5 w-5 text-sidebar-primary shrink-0" />
        <span
          className="text-lg font-semibold tracking-wide text-sidebar-foreground leading-none"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          LibraryMS
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        {visibleItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-foreground font-medium border-l-2 border-sidebar-primary'
                  : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
              )}
            >
              <span className={isActive ? 'text-sidebar-primary' : ''}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-sidebar-border px-3 py-4">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="h-7 w-7 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-xs font-semibold text-sidebar-primary shrink-0">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-sidebar-foreground truncate">{name}</p>
            <p className="text-xs text-sidebar-foreground/40 capitalize truncate">{role}</p>
          </div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
