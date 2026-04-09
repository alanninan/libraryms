import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import sql from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/format'
import { returnBookAction } from './actions'
import { Button } from '@/components/ui/button'

const STATUS_TABS = [
  { label: 'Active',   value: 'active' },
  { label: 'Overdue',  value: 'overdue' },
  { label: 'Returned', value: 'returned' },
  { label: 'All',      value: 'all' },
]

export default async function BorrowingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const session = await requireAuth()
  const params = await searchParams
  const status = params.status ?? 'active'
  const isLibrarian = session.role === 'librarian'

  const borrowings = isLibrarian
    ? status === 'all'
      ? await sql`
          SELECT b.borrowing_id, b.borrow_date, b.due_date, b.return_date, b.status,
                 bk.title, bk.book_id,
                 u.first_name || ' ' || u.last_name AS member_name,
                 u.user_id
          FROM borrowings b
          JOIN book_copies bc ON bc.copy_id = b.copy_id
          JOIN books bk ON bk.book_id = bc.book_id
          JOIN users u ON u.user_id = b.user_id
          ORDER BY b.borrow_date DESC
          LIMIT 200
        `
      : await sql`
          SELECT b.borrowing_id, b.borrow_date, b.due_date, b.return_date, b.status,
                 bk.title, bk.book_id,
                 u.first_name || ' ' || u.last_name AS member_name,
                 u.user_id
          FROM borrowings b
          JOIN book_copies bc ON bc.copy_id = b.copy_id
          JOIN books bk ON bk.book_id = bc.book_id
          JOIN users u ON u.user_id = b.user_id
          WHERE b.status = ${status}
          ORDER BY b.borrow_date DESC
          LIMIT 200
        `
    : status === 'all'
      ? await sql`
          SELECT b.borrowing_id, b.borrow_date, b.due_date, b.return_date, b.status,
                 bk.title, bk.book_id,
                 u.first_name || ' ' || u.last_name AS member_name,
                 u.user_id
          FROM borrowings b
          JOIN book_copies bc ON bc.copy_id = b.copy_id
          JOIN books bk ON bk.book_id = bc.book_id
          JOIN users u ON u.user_id = b.user_id
          WHERE b.user_id = ${session.userId}
          ORDER BY b.borrow_date DESC
          LIMIT 200
        `
      : await sql`
          SELECT b.borrowing_id, b.borrow_date, b.due_date, b.return_date, b.status,
                 bk.title, bk.book_id,
                 u.first_name || ' ' || u.last_name AS member_name,
                 u.user_id
          FROM borrowings b
          JOIN book_copies bc ON bc.copy_id = b.copy_id
          JOIN books bk ON bk.book_id = bc.book_id
          JOIN users u ON u.user_id = b.user_id
          WHERE b.user_id = ${session.userId}
            AND b.status = ${status}
          ORDER BY b.borrow_date DESC
          LIMIT 200
        `

  return (
    <div className="p-8 space-y-8">
      <div className="border-b border-border pb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-light text-foreground">Borrowings</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            {isLibrarian ? 'All library borrowings' : 'Your borrowing history'}
          </p>
        </div>
        {isLibrarian && (
          <Link
            href="/borrowings/new"
            className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Borrow Book
          </Link>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex gap-0 border-b border-border -mt-4">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/borrowings?status=${tab.value}`}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              status === tab.value
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <Card className="shadow-none">
        <CardContent className="p-0">
          {borrowings.length === 0 ? (
            <div className="px-5 py-16 text-center text-muted-foreground">No borrowings found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                    Book
                    <span className="ml-2 font-normal normal-case tracking-normal text-muted-foreground/60">
                      {borrowings.length}
                    </span>
                  </th>
                  {isLibrarian && (
                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Member</th>
                  )}
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Borrowed</th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Due</th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Status</th>
                  {isLibrarian && (
                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Action</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {borrowings.map((b) => {
                  const s = b.status as string
                  return (
                    <tr key={b.borrowing_id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-3 text-foreground font-medium max-w-[220px] truncate">{b.title}</td>
                      {isLibrarian && (
                        <td className="px-5 py-3 text-muted-foreground">
                          <Link href={`/members/${b.user_id}`} className="hover:text-primary hover:underline">
                            {b.member_name}
                          </Link>
                        </td>
                      )}
                      <td className="px-5 py-3 text-muted-foreground">{formatDate(b.borrow_date)}</td>
                      <td className="px-5 py-3 text-muted-foreground">{formatDate(b.due_date)}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                          s === 'active'   ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          s === 'overdue'  ? 'bg-red-50 text-red-700 border-red-200' :
                          s === 'returned' ? 'bg-muted text-muted-foreground border-border' :
                          'bg-sky-50 text-sky-700 border-sky-200'
                        }`}>{s}</span>
                      </td>
                      {isLibrarian && (
                        <td className="px-5 py-3">
                          {(s === 'active' || s === 'overdue') && !b.return_date && (
                            <form action={returnBookAction}>
                              <input type="hidden" name="borrowingId" value={String(b.borrowing_id)} />
                              <Button type="submit" variant="outline" size="sm">Return</Button>
                            </form>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
