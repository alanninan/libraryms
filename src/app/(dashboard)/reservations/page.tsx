import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import sql from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/format'
import { cancelReservationAction } from './actions'

type ReservationStatus = 'pending' | 'ready' | 'fulfilled' | 'cancelled' | 'expired' | 'all'

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'Pending',   value: 'pending' },
  { label: 'Ready',     value: 'ready' },
  { label: 'Fulfilled', value: 'fulfilled' },
  { label: 'Closed',    value: 'cancelled' },
  { label: 'All',       value: 'all' },
]

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const session = await requireAuth()
  const params = await searchParams
  const currentStatus = (params.status ?? 'pending') as ReservationStatus
  const isLibrarian = session.role === 'librarian'

  const reservations = isLibrarian
    ? currentStatus === 'all'
      ? await sql`
          SELECT r.reservation_id, r.status, r.reserved_at, r.expires_at,
                 bk.title, bk.book_id,
                 u.first_name || ' ' || u.last_name AS member_name, u.user_id
          FROM reservations r
          JOIN books bk ON bk.book_id = r.book_id
          JOIN users u ON u.user_id = r.user_id
          ORDER BY r.reserved_at ASC
          LIMIT 200
        `
      : await sql`
          SELECT r.reservation_id, r.status, r.reserved_at, r.expires_at,
                 bk.title, bk.book_id,
                 u.first_name || ' ' || u.last_name AS member_name, u.user_id
          FROM reservations r
          JOIN books bk ON bk.book_id = r.book_id
          JOIN users u ON u.user_id = r.user_id
          WHERE r.status = ${currentStatus}
          ORDER BY r.reserved_at ASC
          LIMIT 200
        `
    : currentStatus === 'all'
      ? await sql`
          SELECT r.reservation_id, r.status, r.reserved_at, r.expires_at,
                 bk.title, bk.book_id,
                 u.first_name || ' ' || u.last_name AS member_name, u.user_id
          FROM reservations r
          JOIN books bk ON bk.book_id = r.book_id
          JOIN users u ON u.user_id = r.user_id
          WHERE r.user_id = ${session.userId}
          ORDER BY r.reserved_at ASC
          LIMIT 200
        `
      : await sql`
          SELECT r.reservation_id, r.status, r.reserved_at, r.expires_at,
                 bk.title, bk.book_id,
                 u.first_name || ' ' || u.last_name AS member_name, u.user_id
          FROM reservations r
          JOIN books bk ON bk.book_id = r.book_id
          JOIN users u ON u.user_id = r.user_id
          WHERE r.user_id = ${session.userId}
            AND r.status = ${currentStatus}
          ORDER BY r.reserved_at ASC
          LIMIT 200
        `

  return (
    <div className="p-8 space-y-8">
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-light text-foreground">Reservations</h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          {isLibrarian ? 'All library reservations' : 'Your reservations'}
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-0 border-b border-border -mt-4">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/reservations?status=${tab.value}`}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              currentStatus === tab.value
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
          {reservations.length === 0 ? (
            <div className="px-5 py-16 text-center text-muted-foreground">No reservations found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                    Book
                    <span className="ml-2 font-normal normal-case tracking-normal text-muted-foreground/60">
                      {reservations.length}
                    </span>
                  </th>
                  {isLibrarian && (
                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Member</th>
                  )}
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Reserved</th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Expires</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => {
                  const s = r.status as string
                  const canCancel =
                    (s === 'pending' || s === 'ready') &&
                    (isLibrarian || r.user_id === session.userId)
                  return (
                    <tr key={r.reservation_id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-3 max-w-[220px] truncate">
                        <Link href={`/books/${r.book_id}`} className="font-medium text-foreground hover:text-primary hover:underline">
                          {r.title}
                        </Link>
                      </td>
                      {isLibrarian && (
                        <td className="px-5 py-3 text-muted-foreground">
                          <Link href={`/members/${r.user_id}`} className="hover:text-primary hover:underline">
                            {r.member_name}
                          </Link>
                        </td>
                      )}
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                          s === 'pending'   ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          s === 'ready'     ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          s === 'fulfilled' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                          'bg-muted text-muted-foreground border-border'
                        }`}>{s}</span>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{formatDate(r.reserved_at)}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {r.expires_at ? formatDate(r.expires_at) : '—'}
                      </td>
                      <td className="px-5 py-3">
                        {canCancel && (
                          <form action={cancelReservationAction}>
                            <input type="hidden" name="reservationId" value={String(r.reservation_id)} />
                            <Button type="submit" variant="outline" size="sm">Cancel</Button>
                          </form>
                        )}
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
  )
}
