import { requireAuth } from '@/lib/auth'
import { NavSidebar } from '@/components/nav-sidebar'
import { Toaster } from '@/components/ui/sonner'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireAuth()

  return (
    <div className="flex min-h-screen bg-background">
      <NavSidebar
        role={session.role}
        name={`${session.firstName} ${session.lastName}`}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <Toaster richColors position="top-right" />
    </div>
  )
}
