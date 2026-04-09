import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import sql from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const session = await requireAuth()
  const params = await searchParams
  const q = params.q?.trim() ?? ''

  const books = q
    ? await sql`
        SELECT
          b.book_id,
          b.title,
          b.publication_year,
          COALESCE(
            string_agg(DISTINCT a.first_name || ' ' || a.last_name, ', '),
            ''
          ) AS authors,
          COALESCE(
            string_agg(DISTINCT g.name, ', '),
            ''
          ) AS genres,
          COUNT(DISTINCT bc.copy_id)                                               AS total_copies,
          COUNT(DISTINCT bc.copy_id) FILTER (WHERE bc.status = 'available')       AS available_copies
        FROM books b
        LEFT JOIN book_authors ba ON ba.book_id = b.book_id
        LEFT JOIN authors a       ON a.author_id = ba.author_id
        LEFT JOIN book_genres bg  ON bg.book_id = b.book_id
        LEFT JOIN genres g        ON g.genre_id = bg.genre_id
        LEFT JOIN book_copies bc  ON bc.book_id = b.book_id
        WHERE
          to_tsvector('english', b.title) @@ plainto_tsquery('english', ${q})
          OR (a.first_name || ' ' || a.last_name) ILIKE ${'%' + q + '%'}
        GROUP BY b.book_id, b.title, b.publication_year
        ORDER BY b.title
      `
    : await sql`
        SELECT
          b.book_id,
          b.title,
          b.publication_year,
          COALESCE(
            string_agg(DISTINCT a.first_name || ' ' || a.last_name, ', '),
            ''
          ) AS authors,
          COALESCE(
            string_agg(DISTINCT g.name, ', '),
            ''
          ) AS genres,
          COUNT(DISTINCT bc.copy_id)                                               AS total_copies,
          COUNT(DISTINCT bc.copy_id) FILTER (WHERE bc.status = 'available')       AS available_copies
        FROM books b
        LEFT JOIN book_authors ba ON ba.book_id = b.book_id
        LEFT JOIN authors a       ON a.author_id = ba.author_id
        LEFT JOIN book_genres bg  ON bg.book_id = b.book_id
        LEFT JOIN genres g        ON g.genre_id = bg.genre_id
        LEFT JOIN book_copies bc  ON bc.book_id = b.book_id
        GROUP BY b.book_id, b.title, b.publication_year
        ORDER BY b.title
        LIMIT 200
      `

  return (
    <div className="p-8 space-y-8">
      <div className="border-b border-border pb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-light text-foreground">Books</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            {q ? `Search results for "${q}"` : 'Browse the library catalogue'}
          </p>
        </div>
      </div>

      <form method="GET" className="flex gap-2 max-w-md">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search by title or author…"
          className="flex-1"
        />
        <Button type="submit" variant="outline">Search</Button>
        {q && (
          <Link href="/books">
            <Button type="button" variant="ghost">Clear</Button>
          </Link>
        )}
      </form>

      <Card className="shadow-none">
        <CardContent className="p-0">
          {books.length === 0 ? (
            <div className="px-5 py-16 text-center text-muted-foreground">
              No books found{q ? ` for "${q}"` : ''}.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                    Title
                    <span className="ml-2 font-normal normal-case tracking-normal text-muted-foreground/60">
                      {books.length} {books.length === 1 ? 'result' : 'results'}
                    </span>
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Authors</th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Genres</th>
                  <th className="px-5 py-3 text-right text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Year</th>
                  <th className="px-5 py-3 text-right text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Available</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book.book_id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="px-5 py-3">
                      <Link
                        href={`/books/${book.book_id}`}
                        className="font-medium text-foreground hover:text-primary hover:underline"
                      >
                        {book.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{book.authors || '—'}</td>
                    <td className="px-5 py-3 text-muted-foreground/70 text-xs">{book.genres || '—'}</td>
                    <td className="px-5 py-3 text-muted-foreground text-right">{book.publication_year ?? '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={Number(book.available_copies) > 0 ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
                        {Number(book.available_copies)}
                      </span>
                      <span className="text-muted-foreground/60"> / {Number(book.total_copies)}</span>
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
