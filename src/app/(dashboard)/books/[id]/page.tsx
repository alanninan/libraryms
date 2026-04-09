import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import sql from '@/lib/db'
import { formatDate } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { reserveBookAction } from './actions'

const COPY_STATUS_CLASSES: Record<string, string> = {
  available:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  borrowed:    'bg-sky-50 text-sky-700 border border-sky-200',
  reserved:    'bg-amber-50 text-amber-700 border border-amber-200',
  maintenance: 'bg-orange-50 text-orange-700 border border-orange-200',
}

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireAuth()
  const { id } = await params
  const bookId = parseInt(id, 10)

  if (isNaN(bookId)) notFound()

  const [bookRows, copies] = await Promise.all([
    sql`
      SELECT
        b.book_id,
        b.title,
        b.isbn,
        b.publication_year,
        b.edition,
        b.summary,
        p.name AS publisher_name,
        COALESCE(
          string_agg(DISTINCT a.first_name || ' ' || a.last_name, ', '),
          ''
        ) AS authors,
        COALESCE(
          string_agg(DISTINCT g.name, ', '),
          ''
        ) AS genres
      FROM books b
      LEFT JOIN publishers p    ON p.publisher_id = b.publisher_id
      LEFT JOIN book_authors ba ON ba.book_id = b.book_id
      LEFT JOIN authors a       ON a.author_id = ba.author_id
      LEFT JOIN book_genres bg  ON bg.book_id = b.book_id
      LEFT JOIN genres g        ON g.genre_id = bg.genre_id
      WHERE b.book_id = ${bookId}
      GROUP BY b.book_id, b.title, b.isbn, b.publication_year, b.edition, b.summary, p.name
    `,
    sql`
      SELECT
        copy_id,
        copy_number,
        status,
        condition,
        acquired_date
      FROM book_copies
      WHERE book_id = ${bookId}
      ORDER BY copy_number
    `,
  ])

  if (bookRows.length === 0) notFound()

  const book = bookRows[0]
  const hasAvailable = copies.some((c) => c.status === 'available')

  return (
    <div className="p-8 space-y-8">
      <div>
        <Link href="/books" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Books
        </Link>
      </div>

      <Card className="shadow-none">
        <CardHeader className="pb-4">
          <CardTitle
            className="text-2xl font-light text-foreground"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {book.title}
          </CardTitle>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1 uppercase tracking-wide">
            {book.publication_year && <span>Year: {book.publication_year}</span>}
            {book.isbn && <span>ISBN: {book.isbn}</span>}
            {book.edition && <span>Edition: {book.edition}</span>}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm border-t border-border pt-4">
          {book.authors && (
            <div className="flex gap-2">
              <span className="text-[11px] uppercase tracking-widest text-muted-foreground w-20 shrink-0 pt-0.5">Authors</span>
              <span className="text-foreground">{book.authors}</span>
            </div>
          )}
          {book.genres && (
            <div className="flex gap-2">
              <span className="text-[11px] uppercase tracking-widest text-muted-foreground w-20 shrink-0 pt-0.5">Genres</span>
              <span className="text-muted-foreground">{book.genres}</span>
            </div>
          )}
          {book.publisher_name && (
            <div className="flex gap-2">
              <span className="text-[11px] uppercase tracking-widest text-muted-foreground w-20 shrink-0 pt-0.5">Publisher</span>
              <span className="text-muted-foreground">{book.publisher_name}</span>
            </div>
          )}
          {book.summary && (
            <p className="text-muted-foreground leading-relaxed pt-2 border-t border-border mt-3">
              {book.summary}
            </p>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-light text-foreground mb-4">
          Copies
          <span className="ml-2 text-base text-muted-foreground font-normal">({copies.length})</span>
        </h2>
        <Card className="shadow-none">
          <CardContent className="p-0">
            {copies.length === 0 ? (
              <div className="px-5 py-12 text-center text-muted-foreground">No copies on record.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Copy #</th>
                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Status</th>
                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Condition</th>
                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Acquired</th>
                  </tr>
                </thead>
                <tbody>
                  {copies.map((copy) => (
                    <tr key={copy.copy_id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-3 text-foreground font-medium">{copy.copy_number}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          COPY_STATUS_CLASSES[copy.status] ?? 'bg-muted text-muted-foreground border border-border'
                        }`}>
                          {copy.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground capitalize">{copy.condition ?? '—'}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {copy.acquired_date ? formatDate(copy.acquired_date) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {session.role === 'member' && !hasAvailable && (
        <Card className="shadow-none border-amber-200 bg-amber-50/60">
          <CardContent className="py-5 px-5">
            <p className="text-sm text-amber-900 mb-3">
              No copies are currently available. Reserve this book to be notified when one becomes free.
            </p>
            <form action={reserveBookAction}>
              <input type="hidden" name="bookId" value={bookId} />
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Reserve
              </button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
