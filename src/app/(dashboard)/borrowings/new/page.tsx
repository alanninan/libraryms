import Link from 'next/link'
import { requireLibrarian } from '@/lib/auth'
import sql from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'
import { borrowBookAction } from '../actions'

export default async function NewBorrowingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  await requireLibrarian()
  const params = await searchParams
  const error = params.error

  const [availableCopies, activeMembers] = await Promise.all([
    sql`
      SELECT bc.copy_id, bc.copy_number, bc.condition, bk.title, bk.book_id
      FROM book_copies bc
      JOIN books bk ON bk.book_id = bc.book_id
      WHERE bc.status = 'available'
      ORDER BY bk.title, bc.copy_number
    `,
    sql`
      SELECT u.user_id,
             u.first_name || ' ' || u.last_name AS name,
             u.membership_type,
             (SELECT COUNT(*) FROM borrowings WHERE user_id = u.user_id AND status IN ('active','overdue')) AS active_count,
             u.max_books
      FROM users u
      WHERE role = 'member' AND is_active = TRUE
      ORDER BY u.last_name
    `,
  ])

  const errorMessages: Record<string, string> = {
    unavailable: 'That copy is no longer available.',
    inactive:    'That member account is inactive.',
    limit:       'Member has reached their borrowing limit.',
    fines:       'Member has unpaid fines exceeding the limit.',
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <Link href="/borrowings" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Borrowings
        </Link>
      </div>

      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-light text-foreground">Borrow Book</h1>
        <p className="text-sm text-muted-foreground mt-1.5">Issue a book copy to a library member</p>
      </div>

      {error && errorMessages[error] && (
        <div className="flex items-center gap-2.5 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 max-w-lg">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMessages[error]}
        </div>
      )}

      <Card className="shadow-none max-w-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium">New Borrowing</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={borrowBookAction} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="userId">Member</Label>
              <select
                id="userId"
                name="userId"
                required
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              >
                <option value="">Select a member…</option>
                {activeMembers.map((m) => (
                  <option key={m.user_id} value={String(m.user_id)}>
                    {m.name} — {Number(m.active_count)}/{Number(m.max_books)} books ({m.membership_type})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="copyId">Book Copy</Label>
              <select
                id="copyId"
                name="copyId"
                required
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              >
                <option value="">Select a book copy…</option>
                {availableCopies.map((c) => (
                  <option key={c.copy_id} value={String(c.copy_id)}>
                    {c.title} — Copy #{c.copy_number}{c.condition ? ` (${c.condition})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1">Confirm Borrowing</Button>
              <Link href="/borrowings">
                <Button type="button" variant="ghost">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
