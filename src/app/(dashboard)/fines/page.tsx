import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import sql from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate, formatCurrency } from '@/lib/format'
import { markFineAsPaidAction } from './actions'

type FineFilter = 'unpaid' | 'paid' | 'all'

const FILTER_TABS: { label: string; value: FineFilter }[] = [
  { label: 'Unpaid', value: 'unpaid' },
  { label: 'Paid',   value: 'paid' },
  { label: 'All',    value: 'all' },
]

export default async function FinesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const session = await requireAuth()
  const params = await searchParams
  const filter = (params.filter ?? 'unpaid') as FineFilter
  const isLibrarian = session.role === 'librarian'

  const fines = isLibrarian
    ? filter === 'all'
      ? await sql`
          SELECT f.fine_id, f.amount, f.reason, f.paid, f.paid_date, f.created_at,
                 u.first_name || ' ' || u.last_name AS member_name, u.user_id,
                 bk.title AS book_title, bk.book_id,
                 br.borrow_date, br.due_date
          FROM fines f
          JOIN users u ON u.user_id = f.user_id
          JOIN borrowings br ON br.borrowing_id = f.borrowing_id
          JOIN book_copies bc ON bc.copy_id = br.copy_id
          JOIN books bk ON bk.book_id = bc.book_id
          ORDER BY f.created_at DESC
          LIMIT 200
        `
      : await sql`
          SELECT f.fine_id, f.amount, f.reason, f.paid, f.paid_date, f.created_at,
                 u.first_name || ' ' || u.last_name AS member_name, u.user_id,
                 bk.title AS book_title, bk.book_id,
                 br.borrow_date, br.due_date
          FROM fines f
          JOIN users u ON u.user_id = f.user_id
          JOIN borrowings br ON br.borrowing_id = f.borrowing_id
          JOIN book_copies bc ON bc.copy_id = br.copy_id
          JOIN books bk ON bk.book_id = bc.book_id
          WHERE f.paid = ${filter === 'paid'}
          ORDER BY f.created_at DESC
          LIMIT 200
        `
    : filter === 'all'
      ? await sql`
          SELECT f.fine_id, f.amount, f.reason, f.paid, f.paid_date, f.created_at,
                 u.first_name || ' ' || u.last_name AS member_name, u.user_id,
                 bk.title AS book_title, bk.book_id,
                 br.borrow_date, br.due_date
          FROM fines f
          JOIN users u ON u.user_id = f.user_id
          JOIN borrowings br ON br.borrowing_id = f.borrowing_id
          JOIN book_copies bc ON bc.copy_id = br.copy_id
          JOIN books bk ON bk.book_id = bc.book_id
          WHERE f.user_id = ${session.userId}
          ORDER BY f.created_at DESC
          LIMIT 200
        `
      : await sql`
          SELECT f.fine_id, f.amount, f.reason, f.paid, f.paid_date, f.created_at,
                 u.first_name || ' ' || u.last_name AS member_name, u.user_id,
                 bk.title AS book_title, bk.book_id,
                 br.borrow_date, br.due_date
          FROM fines f
          JOIN users u ON u.user_id = f.user_id
          JOIN borrowings br ON br.borrowing_id = f.borrowing_id
          JOIN book_copies bc ON bc.copy_id = br.copy_id
          JOIN books bk ON bk.book_id = bc.book_id
          WHERE f.user_id = ${session.userId}
            AND f.paid = ${filter === 'paid'}
          ORDER BY f.created_at DESC
          LIMIT 200
        `

  const totalUnpaid = fines
    .filter((f) => !f.paid)
    .reduce((sum, f) => sum + Number(f.amount), 0)

  return (
    <div className="p-8 space-y-8">
      <div className="border-b border-border pb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-light text-foreground">Fines</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            {isLibrarian ? 'All member fines' : 'Your fines'}
          </p>
        </div>
        {/* Unpaid total — always visible, prominent when non-zero */}
        {totalUnpaid > 0 && (
          <div className="text-right">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-1">
              {isLibrarian ? 'Total Unpaid' : 'Outstanding Balance'}
            </p>
            <p
              className="text-3xl font-light text-red-600 leading-none"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {formatCurrency(totalUnpaid)}
            </p>
            {!isLibrarian && (
              <p className="text-xs text-muted-foreground mt-1">Please visit the library to settle.</p>
            )}
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-0 border-b border-border -mt-4">
        {FILTER_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/fines?filter=${tab.value}`}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              filter === tab.value
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
          {fines.length === 0 ? (
            <div className="px-5 py-16 text-center text-muted-foreground">No fines found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                    Book
                    <span className="ml-2 font-normal normal-case tracking-normal text-muted-foreground/60">
                      {fines.length}
                    </span>
                  </th>
                  {isLibrarian && (
                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Member</th>
                  )}
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Amount</th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Reason</th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Date</th>
                  {isLibrarian && (
                    <th className="px-5 py-3"></th>
                  )}
                </tr>
              </thead>
              <tbody>
                {fines.map((f) => (
                  <tr key={f.fine_id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="px-5 py-3 max-w-[200px] truncate">
                      <Link href={`/books/${f.book_id}`} className="font-medium text-foreground hover:text-primary hover:underline">
                        {f.book_title}
                      </Link>
                    </td>
                    {isLibrarian && (
                      <td className="px-5 py-3 text-muted-foreground">
                        <Link href={`/members/${f.user_id}`} className="hover:text-primary hover:underline">
                          {f.member_name}
                        </Link>
                      </td>
                    )}
                    <td className="px-5 py-3 font-medium text-foreground">
                      {formatCurrency(Number(f.amount))}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground capitalize">{f.reason}</td>
                    <td className="px-5 py-3">
                      {f.paid ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">paid</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">unpaid</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDate(f.created_at)}</td>
                    {isLibrarian && (
                      <td className="px-5 py-3">
                        {!f.paid && (
                          <form action={markFineAsPaidAction}>
                            <input type="hidden" name="fineId" value={String(f.fine_id)} />
                            <Button type="submit" variant="outline" size="sm">Mark Paid</Button>
                          </form>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
