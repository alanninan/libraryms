import Link from 'next/link'
import { requireLibrarian } from '@/lib/auth'
import sql from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/format'

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  await requireLibrarian()
  const params = await searchParams
  const q = params.q?.trim() ?? ''

  const members = q
    ? await sql`
        SELECT
          u.user_id,
          u.first_name,
          u.last_name,
          u.email,
          u.membership_type,
          u.phone,
          u.is_active,
          (SELECT COUNT(*) FROM borrowings WHERE user_id = u.user_id AND status IN ('active','overdue')) AS active_borrowings,
          (SELECT COALESCE(SUM(amount),0) FROM fines WHERE user_id = u.user_id AND paid = FALSE) AS unpaid_fines
        FROM users u
        WHERE role = 'member'
          AND ((first_name || ' ' || last_name) ILIKE ${`%${q}%`} OR email ILIKE ${`%${q}%`})
        ORDER BY last_name, first_name
      `
    : await sql`
        SELECT
          u.user_id,
          u.first_name,
          u.last_name,
          u.email,
          u.membership_type,
          u.phone,
          u.is_active,
          (SELECT COUNT(*) FROM borrowings WHERE user_id = u.user_id AND status IN ('active','overdue')) AS active_borrowings,
          (SELECT COALESCE(SUM(amount),0) FROM fines WHERE user_id = u.user_id AND paid = FALSE) AS unpaid_fines
        FROM users u
        WHERE role = 'member'
        ORDER BY last_name, first_name
      `

  return (
    <div className="p-8 space-y-8">
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-light text-foreground">Members</h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          {q ? `Search results for "${q}"` : 'All library members'}
        </p>
      </div>

      <form method="GET" className="flex gap-2 max-w-md">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search by name or email…"
          className="flex-1"
        />
        <Button type="submit" variant="outline">Search</Button>
        {q && (
          <Link href="/members">
            <Button type="button" variant="ghost">Clear</Button>
          </Link>
        )}
      </form>

      <Card className="shadow-none">
        <CardContent className="p-0">
          {members.length === 0 ? (
            <div className="px-5 py-16 text-center text-muted-foreground">
              No members found{q ? ` for "${q}"` : ''}.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                    Name
                    <span className="ml-2 font-normal normal-case tracking-normal text-muted-foreground/60">
                      {members.length} {members.length === 1 ? 'member' : 'members'}
                    </span>
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Email</th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Membership</th>
                  <th className="px-5 py-3 text-right text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Borrowings</th>
                  <th className="px-5 py-3 text-right text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Unpaid Fines</th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.user_id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="px-5 py-3">
                      <Link
                        href={`/members/${m.user_id}`}
                        className="font-medium text-foreground hover:text-primary hover:underline"
                      >
                        {m.first_name} {m.last_name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{m.email}</td>
                    <td className="px-5 py-3 text-muted-foreground capitalize">{m.membership_type}</td>
                    <td className="px-5 py-3 text-foreground text-right font-medium">{Number(m.active_borrowings)}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={Number(m.unpaid_fines) > 0 ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
                        {formatCurrency(Number(m.unpaid_fines))}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                        m.is_active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-muted text-muted-foreground border-border'
                      }`}>
                        {m.is_active ? 'active' : 'inactive'}
                      </span>
                    </td>
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
