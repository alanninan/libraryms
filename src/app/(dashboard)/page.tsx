import { requireAuth } from '@/lib/auth'
import sql from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Users, BookMarked, AlertCircle, DollarSign, Bookmark } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/format'

async function getDashboardStats() {
  const [stats] = await sql`
    SELECT
      (SELECT COUNT(*) FROM books)                                    AS total_books,
      (SELECT COUNT(*) FROM book_copies WHERE status = 'available')  AS available_copies,
      (SELECT COUNT(*) FROM users WHERE role = 'member' AND is_active) AS active_members,
      (SELECT COUNT(*) FROM borrowings WHERE status IN ('active', 'overdue')) AS active_borrowings,
      (SELECT COUNT(*) FROM borrowings WHERE status = 'overdue')      AS overdue_count,
      (SELECT COALESCE(SUM(amount), 0) FROM fines WHERE paid = FALSE) AS unpaid_fines,
      (SELECT COUNT(*) FROM reservations WHERE status = 'pending')    AS pending_reservations
  `
  return stats
}

async function getRecentBorrowings() {
  return sql`
    SELECT
      b.borrowing_id,
      u.first_name || ' ' || u.last_name AS member_name,
      bk.title,
      b.borrow_date,
      b.due_date,
      b.status
    FROM borrowings b
    INNER JOIN users u        ON u.user_id = b.user_id
    INNER JOIN book_copies bc ON bc.copy_id = b.copy_id
    INNER JOIN books bk       ON bk.book_id = bc.book_id
    WHERE b.status IN ('active', 'overdue')
    ORDER BY b.borrow_date DESC
    LIMIT 8
  `
}

export default async function DashboardPage() {
  const session = await requireAuth()
  const [stats, recentBorrowings] = await Promise.all([
    getDashboardStats(),
    getRecentBorrowings(),
  ])

  const statCards = [
    {
      label: 'Total Books',
      value: Number(stats.total_books).toLocaleString(),
      icon: <BookOpen className="h-3.5 w-3.5" />,
      color: 'text-primary',
    },
    {
      label: 'Available Copies',
      value: Number(stats.available_copies).toLocaleString(),
      icon: <BookOpen className="h-3.5 w-3.5" />,
      color: 'text-emerald-600',
    },
    {
      label: 'Active Members',
      value: Number(stats.active_members).toLocaleString(),
      icon: <Users className="h-3.5 w-3.5" />,
      color: 'text-primary',
    },
    {
      label: 'Active Borrowings',
      value: Number(stats.active_borrowings).toLocaleString(),
      icon: <BookMarked className="h-3.5 w-3.5" />,
      color: 'text-amber-600',
    },
    {
      label: 'Overdue',
      value: Number(stats.overdue_count).toLocaleString(),
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      color: 'text-red-600',
    },
    {
      label: 'Unpaid Fines',
      value: formatCurrency(Number(stats.unpaid_fines)),
      icon: <DollarSign className="h-3.5 w-3.5" />,
      color: 'text-amber-600',
    },
    {
      label: 'Pending Reservations',
      value: Number(stats.pending_reservations).toLocaleString(),
      icon: <Bookmark className="h-3.5 w-3.5" />,
      color: 'text-primary',
    },
  ]

  return (
    <div className="p-8 space-y-8">
      <div className="border-b border-border pb-6">
        <h1 className="text-4xl font-light text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Welcome back, {session.firstName}. Here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className="bg-card shadow-none">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                  {card.label}
                </p>
                <span className={card.color}>{card.icon}</span>
              </div>
              <p
                className="text-4xl font-light text-foreground leading-none"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {card.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent active borrowings */}
      <div>
        <h2 className="text-xl font-light text-foreground mb-4">Active Borrowings</h2>
        <Card className="shadow-none">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Member</th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Book</th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Borrowed</th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Due</th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBorrowings.map((row) => (
                  <tr key={row.borrowing_id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="px-5 py-3 text-foreground font-medium">{row.member_name}</td>
                    <td className="px-5 py-3 text-muted-foreground max-w-[200px] truncate">{row.title}</td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDate(row.borrow_date)}</td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDate(row.due_date)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        row.status === 'overdue'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentBorrowings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                      No active borrowings
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
