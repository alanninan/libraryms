import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireLibrarian } from '@/lib/auth'
import sql from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate, formatCurrency } from '@/lib/format'
import { toggleMemberAction } from '../actions'

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireLibrarian()
  const { id } = await params

  const [member] = await sql`
    SELECT user_id, first_name, last_name, email, phone, address,
           membership_type, is_active, max_books, created_at
    FROM users
    WHERE user_id = ${id} AND role = 'member'
  `

  if (!member) notFound()

  const [activeBorrowings, unpaidFines, reservations] = await Promise.all([
    sql`
      SELECT b.borrowing_id, bk.title, bk.book_id,
             b.borrow_date, b.due_date, b.return_date, b.status
      FROM borrowings b
      JOIN book_copies bc ON bc.copy_id = b.copy_id
      JOIN books bk ON bk.book_id = bc.book_id
      WHERE b.user_id = ${id} AND b.status IN ('active','overdue')
      ORDER BY b.borrow_date DESC
    `,
    sql`
      SELECT f.fine_id, f.amount, f.reason, b.borrow_date
      FROM fines f
      JOIN borrowings b ON b.borrowing_id = f.borrowing_id
      WHERE f.user_id = ${id} AND f.paid = FALSE
      ORDER BY b.borrow_date DESC
    `,
    sql`
      SELECT r.reservation_id, bk.title, bk.book_id, r.status, r.reserved_at
      FROM reservations r
      JOIN books bk ON bk.book_id = r.book_id
      WHERE r.user_id = ${id} AND r.status IN ('pending','ready')
      ORDER BY r.reserved_at DESC
    `,
  ])

  const unpaidTotal = unpaidFines.reduce((sum, f) => sum + Number(f.amount), 0)

  return (
    <div className="p-8 space-y-8">
      <div>
        <Link href="/members" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Members
        </Link>
      </div>

      {/* Profile header */}
      <div className="border-b border-border pb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-light text-foreground">
            {member.first_name} {member.last_name}
          </h1>
          <div className="mt-2 space-y-0.5 text-sm text-muted-foreground">
            <p>{member.email}</p>
            {member.phone && <p>{member.phone}</p>}
            {member.address && <p>{member.address}</p>}
            <p className="capitalize">{member.membership_type} membership · member since {new Date(member.created_at).getFullYear()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium border ${
            member.is_active
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-muted text-muted-foreground border-border'
          }`}>
            {member.is_active ? 'Active' : 'Inactive'}
          </span>
          <form action={toggleMemberAction}>
            <input type="hidden" name="userId" value={String(member.user_id)} />
            <input type="hidden" name="currentStatus" value={JSON.stringify(member.is_active)} />
            <Button type="submit" variant={member.is_active ? 'destructive' : 'outline'} size="sm">
              {member.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </form>
        </div>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="shadow-none">
          <CardContent className="pt-5 pb-4 px-5">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-3">
              Active Borrowings
            </p>
            <p
              className="text-4xl font-light text-foreground leading-none"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {activeBorrowings.length}
              <span className="text-base text-muted-foreground font-sans ml-1">/ {member.max_books}</span>
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent className="pt-5 pb-4 px-5">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-3">
              Unpaid Fines
            </p>
            <p
              className={`text-4xl font-light leading-none ${unpaidTotal > 0 ? 'text-red-600' : 'text-foreground'}`}
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {formatCurrency(unpaidTotal)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent className="pt-5 pb-4 px-5">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-3">
              Reservations
            </p>
            <p
              className="text-4xl font-light text-foreground leading-none"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {reservations.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Borrowings */}
      <div>
        <h2 className="text-xl font-light text-foreground mb-4">Active Borrowings</h2>
        <Card className="shadow-none">
          <CardContent className="p-0">
            {activeBorrowings.length === 0 ? (
              <div className="px-5 py-10 text-center text-muted-foreground">No active borrowings</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Book</th>
                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Borrowed</th>
                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Due</th>
                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeBorrowings.map((b) => {
                    const s = b.status as string
                    return (
                      <tr key={b.borrowing_id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                        <td className="px-5 py-3 text-foreground font-medium max-w-[240px] truncate">{b.title}</td>
                        <td className="px-5 py-3 text-muted-foreground">{formatDate(b.borrow_date)}</td>
                        <td className="px-5 py-3 text-muted-foreground">{formatDate(b.due_date)}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                            s === 'active'  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            s === 'overdue' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-muted text-muted-foreground border-border'
                          }`}>{s}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Unpaid Fines */}
      <div>
        <h2 className="text-xl font-light text-foreground mb-4">Unpaid Fines</h2>
        <Card className="shadow-none">
          <CardContent className="p-0">
            {unpaidFines.length === 0 ? (
              <div className="px-5 py-10 text-center text-muted-foreground">No unpaid fines</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Amount</th>
                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Reason</th>
                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Borrow Date</th>
                  </tr>
                </thead>
                <tbody>
                  {unpaidFines.map((f) => (
                    <tr key={f.fine_id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-3 font-medium text-red-600">{formatCurrency(Number(f.amount))}</td>
                      <td className="px-5 py-3 text-muted-foreground capitalize">{f.reason}</td>
                      <td className="px-5 py-3 text-muted-foreground">{formatDate(f.borrow_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reservations */}
      <div>
        <h2 className="text-xl font-light text-foreground mb-4">Reservations</h2>
        <Card className="shadow-none">
          <CardContent className="p-0">
            {reservations.length === 0 ? (
              <div className="px-5 py-10 text-center text-muted-foreground">No active reservations</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Book</th>
                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Status</th>
                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Reserved</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((r) => {
                    const s = r.status as string
                    return (
                      <tr key={r.reservation_id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                        <td className="px-5 py-3 text-foreground font-medium">{r.title}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                            s === 'ready'   ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            'bg-sky-50 text-sky-700 border-sky-200'
                          }`}>{s}</span>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{formatDate(r.reserved_at)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
