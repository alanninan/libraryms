import Link from 'next/link'
import { requireLibrarian } from '@/lib/auth'
import sql from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'

export default async function ReportsPage() {
  await requireLibrarian()

  const [popularBooks, overdueBooks, genrePopularity, memberStats] = await Promise.all([
    sql`
      SELECT bk.book_id, bk.title, COUNT(b.borrowing_id) AS borrow_count,
             STRING_AGG(DISTINCT a.first_name || ' ' || a.last_name, ', ') AS authors
      FROM borrowings b
      JOIN book_copies bc ON bc.copy_id = b.copy_id
      JOIN books bk ON bk.book_id = bc.book_id
      LEFT JOIN book_authors ba ON ba.book_id = bk.book_id
      LEFT JOIN authors a ON a.author_id = ba.author_id
      GROUP BY bk.book_id, bk.title
      ORDER BY borrow_count DESC
      LIMIT 10
    `,
    sql`
      SELECT b.borrowing_id, bk.title, u.first_name || ' ' || u.last_name AS member_name,
             b.due_date, CURRENT_DATE - b.due_date AS days_overdue,
             ROUND((CURRENT_DATE - b.due_date) * 0.5, 2) AS estimated_fine
      FROM borrowings b
      JOIN book_copies bc ON bc.copy_id = b.copy_id
      JOIN books bk ON bk.book_id = bc.book_id
      JOIN users u ON u.user_id = b.user_id
      WHERE b.status IN ('active', 'overdue') AND b.due_date < CURRENT_DATE
      ORDER BY days_overdue DESC
    `,
    sql`
      SELECT g.name AS genre, COUNT(b.borrowing_id) AS borrow_count
      FROM genres g
      JOIN book_genres bg ON bg.genre_id = g.genre_id
      JOIN books bk ON bk.book_id = bg.book_id
      JOIN book_copies bc ON bc.book_id = bk.book_id
      JOIN borrowings b ON b.copy_id = bc.copy_id
      GROUP BY g.name
      ORDER BY borrow_count DESC
      LIMIT 8
    `,
    sql`
      SELECT u.user_id, u.first_name || ' ' || u.last_name AS name, u.membership_type,
             COUNT(b.borrowing_id) FILTER (WHERE b.status IN ('active','overdue','returned')) AS total_borrowed,
             COUNT(b.borrowing_id) FILTER (WHERE b.status IN ('active','overdue')) AS currently_borrowed,
             COALESCE(SUM(f.amount) FILTER (WHERE f.paid = FALSE), 0) AS unpaid_fines
      FROM users u
      LEFT JOIN borrowings b ON b.user_id = u.user_id
      LEFT JOIN fines f ON f.user_id = u.user_id
      WHERE u.role = 'member'
      GROUP BY u.user_id, u.first_name, u.last_name, u.membership_type
      ORDER BY total_borrowed DESC
      LIMIT 10
    `,
  ])

  const maxBookBorrows = Number(popularBooks[0]?.borrow_count ?? 1)
  const maxGenreBorrows = Number(genrePopularity[0]?.borrow_count ?? 1)

  return (
    <div className="p-8 space-y-8">
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-light text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1.5">Library activity overview</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Popular Books */}
        <Card className="shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              Most Borrowed
            </CardTitle>
          </CardHeader>
          <CardContent>
            {popularBooks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data available.</p>
            ) : (
              <ol className="space-y-4">
                {popularBooks.map((book, i) => (
                  <li key={book.book_id} className="flex items-start gap-3">
                    <span
                      className="text-lg font-light text-muted-foreground/50 w-5 pt-0.5 shrink-0 leading-none"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/books/${book.book_id}`}
                        className="text-sm font-medium text-foreground hover:text-primary hover:underline truncate block"
                      >
                        {book.title}
                      </Link>
                      {book.authors && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{book.authors}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 bg-muted rounded-sm h-1.5">
                          <div
                            className="bg-primary rounded-sm h-1.5 transition-all"
                            style={{ width: `${(Number(book.borrow_count) / maxBookBorrows) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">{book.borrow_count}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* Overdue Books */}
        <Card className="shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-medium uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              Overdue
              {overdueBooks.length > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200 normal-case tracking-normal">
                  {overdueBooks.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {overdueBooks.length === 0 ? (
              <p className="px-6 pb-5 text-sm text-muted-foreground">No overdue books — all clear.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-t">
                  <tr>
                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Book</th>
                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Member</th>
                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Days</th>
                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Est. Fine</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueBooks.map((row) => (
                    <tr key={row.borrowing_id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-3 text-foreground font-medium max-w-[140px] truncate">{row.title}</td>
                      <td className="px-5 py-3 text-muted-foreground max-w-[120px] truncate">{row.member_name}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                          {row.days_overdue}d
                        </span>
                      </td>
                      <td className="px-5 py-3 text-foreground font-medium">
                        {formatCurrency(Number(row.estimated_fine))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Genre Popularity */}
        <Card className="shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              Genre Popularity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {genrePopularity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data available.</p>
            ) : (
              <ul className="space-y-3.5">
                {genrePopularity.map((g) => (
                  <li key={g.genre}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-foreground">{g.genre}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{g.borrow_count}</span>
                    </div>
                    <div className="flex-1 bg-muted rounded-sm h-1.5">
                      <div
                        className="bg-accent rounded-sm h-1.5 transition-all"
                        style={{ width: `${(Number(g.borrow_count) / maxGenreBorrows) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Member Activity */}
        <Card className="shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              Top Members
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {memberStats.length === 0 ? (
              <p className="px-6 pb-5 text-sm text-muted-foreground">No data available.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-t">
                  <tr>
                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Member</th>
                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Total</th>
                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Active</th>
                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Fines</th>
                  </tr>
                </thead>
                <tbody>
                  {memberStats.map((m) => (
                    <tr key={m.user_id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-3">
                        <Link href={`/members/${m.user_id}`} className="text-foreground font-medium hover:text-primary hover:underline">
                          {m.name}
                        </Link>
                        <p className="text-xs text-muted-foreground capitalize">{m.membership_type}</p>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground tabular-nums">{m.total_borrowed}</td>
                      <td className="px-5 py-3 text-muted-foreground tabular-nums">{m.currently_borrowed}</td>
                      <td className="px-5 py-3">
                        {Number(m.unpaid_fines) > 0 ? (
                          <span className="text-red-600 font-medium">
                            {formatCurrency(Number(m.unpaid_fines))}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
