import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Implementation Reference — LibraryMS',
  robots: 'noindex, nofollow',
}

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

function Code({ children }: { children: string }) {
  return (
    <pre className="bg-[oklch(0.18_0.02_240)] text-[oklch(0.88_0.015_85)] rounded-md p-5 overflow-x-auto text-[13px] leading-relaxed font-mono whitespace-pre my-4">
      {children.trim()}
    </pre>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-widest text-muted-foreground border-b">{children}</th>
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-2.5 text-sm text-foreground border-b border-border/50">{children}</td>
}

function TdMono({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-2.5 text-[13px] font-mono text-primary border-b border-border/50">{children}</td>
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="text-2xl font-light text-foreground mt-16 mb-6 pb-3 border-b border-border scroll-mt-8"
      style={{ fontFamily: 'var(--font-heading)' }}
    >
      {children}
    </h2>
  )
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-lg font-medium text-foreground mt-8 mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
      {children}
    </h3>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground leading-relaxed mb-3">{children}</p>
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ImplPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-8 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← LibraryMS
          </Link>
          <span
            className="text-base font-light text-muted-foreground"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Implementation Reference
          </span>
          <div />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-12 flex gap-12">
        {/* Sticky TOC */}
        <nav className="hidden lg:block w-52 shrink-0 self-start sticky top-20">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-3">Contents</p>
          <ul className="space-y-1 text-sm">
            {[
              ['#overview',   'Overview'],
              ['#schema',     'Schema'],
              ['#constraints','Constraints'],
              ['#indexes',    'Indexes'],
              ['#views',      'Views'],
              ['#functions',  'Stored Functions'],
              ['#triggers',   'Triggers'],
              ['#queries',    'Application Queries'],
              ['#dashboard',  '↳ Dashboard'],
              ['#books',      '↳ Books'],
              ['#members',    '↳ Members'],
              ['#borrowings', '↳ Borrowings'],
              ['#reservations','↳ Reservations'],
              ['#fines',      '↳ Fines'],
              ['#reports',    '↳ Reports'],
            ].map(([href, label]) => (
              <li key={href}>
                <a
                  href={href}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="mb-12">
            <h1
              className="text-4xl font-light text-foreground mb-3"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Implementation Reference
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
              A technical walkthrough of the Library Management System — covering the database schema, indexes, views, stored functions, triggers, and every SQL query used across the application. Built as a Database Management Systems course project.
            </p>
          </div>

          {/* ── OVERVIEW ───────────────────────────────────────────────── */}
          <H2 id="overview">Overview</H2>

          <P>
            The application is a full-stack web app built with <strong>Next.js 16</strong> (App Router), <strong>React 19</strong>, and <strong>PostgreSQL 16</strong>. All database access uses the <code className="font-mono text-primary text-xs">postgres</code> npm package — a tagged template literal SQL client that parameterises every value automatically, eliminating SQL injection at the driver level. There is no ORM.
          </P>

          <table className="w-full text-sm border border-border rounded-md overflow-hidden mb-6">
            <thead><tr>
              <Th>Layer</Th><Th>Technology</Th><Th>Notes</Th>
            </tr></thead>
            <tbody>
              {[
                ['Runtime',          'Node.js via Bun',         'Bun used as package manager & runtime'],
                ['Framework',        'Next.js 16 App Router',   'Server Components by default; Server Actions for mutations'],
                ['Language',         'TypeScript 5',            'Strict mode throughout'],
                ['Database',         'PostgreSQL 16 (Docker)',  'Port 5433; pgcrypto extension for UUID generation'],
                ['DB Client',        'postgres (npm) ^3.4.9',  'Tagged template literals; connection pool of 10'],
                ['Auth',             'Database-backed sessions','bcryptjs for password hashing; HttpOnly cookie with UUID'],
                ['Styling',          'Tailwind CSS v4',         'OKLCH palette; Cormorant Garamond + DM Sans'],
                ['Edge Auth Guard',  'src/proxy.ts',            'Next.js 16 renamed middleware.ts → proxy.ts'],
              ].map(([layer, tech, note]) => (
                <tr key={layer} className="hover:bg-muted/40">
                  <TdMono>{layer}</TdMono>
                  <Td>{tech}</Td>
                  <Td><span className="text-muted-foreground">{note}</span></Td>
                </tr>
              ))}
            </tbody>
          </table>

          <H3>Authentication Flow</H3>
          <P>Sessions are stored in the <code className="font-mono text-primary text-xs">sessions</code> table. On login, bcryptjs verifies the password hash, a UUID session row is inserted with a 7-day expiry, and the UUID is written to an HttpOnly SameSite=lax cookie. Every authenticated request queries the session table to retrieve the user. The edge proxy (<code className="font-mono text-primary text-xs">proxy.ts</code>) does a cookie-presence check only — no DB query — before a route renders.</P>
          <Code>{`
-- Session lookup on every authenticated request
SELECT s.session_id, u.user_id, u.email, u.first_name, u.last_name,
       u.role, u.is_active
FROM sessions s
JOIN users u ON u.user_id = s.user_id
WHERE s.session_id = $1
  AND s.expires_at > NOW()
  AND u.is_active = TRUE`}
          </Code>

          {/* ── SCHEMA ─────────────────────────────────────────────────── */}
          <H2 id="schema">Schema</H2>

          <P>
            The schema is normalised to <strong>Third Normal Form (3NF)</strong>. Twelve tables cover the full domain. Authors, genres, and publishers are factored into lookup tables. Many-to-many relationships (book↔author, book↔genre) are resolved through explicit junction tables with composite primary keys. Physical copies are tracked separately from title records.
          </P>

          <Code>{`
-- ER summary (crow's foot notation)
publishers ──< books >── book_authors ──> authors
                │
                └──< book_genres >──────── genres
                │
                └──< book_copies
                          │
                          └──< borrowings >── users
                                  │                │
                                  └──> fines ──────┘

books >──── reservations ────< users
sessions ────────────────────< users`}
          </Code>

          <H3>Tables</H3>
          <table className="w-full text-sm border border-border rounded-md overflow-hidden mb-8">
            <thead><tr>
              <Th>Table</Th><Th>Primary Key</Th><Th>Description</Th>
            </tr></thead>
            <tbody>
              {[
                ['genres',        'genre_id SERIAL',        'Lookup — genre classifications'],
                ['publishers',    'publisher_id SERIAL',    'Lookup — publisher reference data'],
                ['authors',       'author_id SERIAL',       'Author biographical records'],
                ['books',         'book_id SERIAL',         'Bibliographic title records (not individual copies)'],
                ['book_authors',  '(book_id, author_id)',   'Junction — many-to-many: books ↔ authors'],
                ['book_genres',   '(book_id, genre_id)',    'Junction — many-to-many: books ↔ genres'],
                ['book_copies',   'copy_id SERIAL',         'Individual physical copies with status & condition'],
                ['users',         'user_id SERIAL',         'Librarians and members — role discriminated'],
                ['sessions',      'session_id UUID',        'Database-backed auth sessions'],
                ['borrowings',    'borrowing_id SERIAL',    'Borrow/return transactions per copy per member'],
                ['fines',         'fine_id SERIAL',         'Monetary penalties; created by trigger on return'],
                ['reservations',  'reservation_id SERIAL',  'Hold queue — member waits for unavailable book'],
              ].map(([table, pk, desc]) => (
                <tr key={table} className="hover:bg-muted/40">
                  <TdMono>{table}</TdMono>
                  <Td><span className="font-mono text-xs">{pk}</span></Td>
                  <Td><span className="text-muted-foreground">{desc}</span></Td>
                </tr>
              ))}
            </tbody>
          </table>

          <H3>DDL — Core Tables</H3>
          <Code>{`
CREATE TABLE books (
    book_id          SERIAL       PRIMARY KEY,
    title            VARCHAR(300) NOT NULL,
    isbn             VARCHAR(13)  NOT NULL UNIQUE,
    publication_year SMALLINT     CHECK (publication_year > 0
                                    AND publication_year <= EXTRACT(YEAR FROM NOW())::SMALLINT + 1),
    edition          VARCHAR(50),
    summary          TEXT,
    publisher_id     INTEGER      REFERENCES publishers(publisher_id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE book_copies (
    copy_id       SERIAL      PRIMARY KEY,
    book_id       INTEGER     NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
    copy_number   SMALLINT    NOT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'available'
                  CHECK (status IN ('available','borrowed','reserved','maintenance','lost')),
    acquired_date DATE        NOT NULL DEFAULT CURRENT_DATE,
    condition     VARCHAR(20) NOT NULL DEFAULT 'good'
                  CHECK (condition IN ('new','good','fair','poor','damaged')),
    UNIQUE (book_id, copy_number)
);

CREATE TABLE users (
    user_id         SERIAL       PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    role            VARCHAR(20)  NOT NULL DEFAULT 'member'
                    CHECK (role IN ('librarian','member')),
    membership_type VARCHAR(20)  NOT NULL DEFAULT 'standard'
                    CHECK (membership_type IN ('standard','premium','student')),
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    max_books       SMALLINT     NOT NULL DEFAULT 3
                    CHECK (max_books >= 1 AND max_books <= 10),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE borrowings (
    borrowing_id  SERIAL      PRIMARY KEY,
    copy_id       INTEGER     NOT NULL REFERENCES book_copies(copy_id),
    user_id       INTEGER     NOT NULL REFERENCES users(user_id),
    borrow_date   DATE        NOT NULL DEFAULT CURRENT_DATE,
    due_date      DATE        NOT NULL,
    return_date   DATE,
    status        VARCHAR(20) NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','returned','overdue','lost')),
    CONSTRAINT chk_return_after_borrow CHECK (return_date IS NULL OR return_date >= borrow_date),
    CONSTRAINT chk_due_after_borrow    CHECK (due_date > borrow_date)
);

CREATE TABLE fines (
    fine_id      SERIAL        PRIMARY KEY,
    borrowing_id INTEGER       NOT NULL REFERENCES borrowings(borrowing_id),
    user_id      INTEGER       NOT NULL REFERENCES users(user_id),
    amount       NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    reason       VARCHAR(20)   NOT NULL DEFAULT 'overdue'
                 CHECK (reason IN ('overdue','damage','lost')),
    paid         BOOLEAN       NOT NULL DEFAULT FALSE,
    paid_date    DATE,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_paid_date CHECK (paid_date IS NULL OR paid = TRUE)
);

CREATE TABLE reservations (
    reservation_id SERIAL      PRIMARY KEY,
    book_id        INTEGER     NOT NULL REFERENCES books(book_id),
    user_id        INTEGER     NOT NULL REFERENCES users(user_id),
    status         VARCHAR(20) NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','ready','fulfilled','cancelled','expired')),
    reserved_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notified_at    TIMESTAMPTZ,
    expires_at     TIMESTAMPTZ,
    -- Prevents duplicate active reservations for the same book per member
    CONSTRAINT uq_active_reservation UNIQUE NULLS NOT DISTINCT (book_id, user_id, status)
);

CREATE TABLE sessions (
    session_id UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    INTEGER     NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`}
          </Code>

          {/* ── CONSTRAINTS ────────────────────────────────────────────── */}
          <H2 id="constraints">Constraints</H2>

          <H3>Foreign Keys & Referential Actions</H3>
          <Code>{`
-- Deleting a book cascades to its copies, author links, and genre links
book_copies.book_id   REFERENCES books(book_id)       ON DELETE CASCADE
book_authors.book_id  REFERENCES books(book_id)       ON DELETE CASCADE
book_genres.book_id   REFERENCES books(book_id)       ON DELETE CASCADE

-- Publisher deletion nullifies the FK — book record is preserved
books.publisher_id    REFERENCES publishers(publisher_id) ON DELETE SET NULL

-- Deleting a user cascades to their sessions
sessions.user_id      REFERENCES users(user_id)       ON DELETE CASCADE`}
          </Code>

          <H3>Notable Constraint: UNIQUE NULLS NOT DISTINCT</H3>
          <P>
            The reservations table uses a PostgreSQL 15+ feature to prevent a member from holding two active reservations on the same book, while still allowing multiple historical (terminal-state) rows. Standard UNIQUE would treat two NULL status values as non-equal and allow unlimited duplicates.
          </P>
          <Code>{`
-- Standard UNIQUE treats NULL != NULL → would allow unlimited active reservations
-- UNIQUE NULLS NOT DISTINCT treats NULL == NULL → blocks duplicates correctly
CONSTRAINT uq_active_reservation
    UNIQUE NULLS NOT DISTINCT (book_id, user_id, status)

-- Effect: a member can have at most ONE row where (book_id, user_id, status)
-- matches. Terminal statuses (fulfilled, cancelled, expired) are all distinct
-- string values so they don't conflict with each other or with 'pending'/'ready'.`}
          </Code>

          {/* ── INDEXES ─────────────────────────────────────────────────── */}
          <H2 id="indexes">Indexes</H2>

          <H3>GIN Index — Full-Text Search</H3>
          <P>
            A Generalised Inverted Index over a <code className="font-mono text-primary text-xs">to_tsvector</code> expression enables fast full-text search on book titles. The application queries it with <code className="font-mono text-primary text-xs">plainto_tsquery</code>, which handles stemming and stop-word removal without exposing tsquery syntax to users.
          </P>
          <Code>{`
CREATE INDEX idx_books_title_fts
    ON books USING GIN (to_tsvector('english', title));

-- Used in the books search query:
WHERE to_tsvector('english', b.title) @@ plainto_tsquery('english', $1)`}
          </Code>

          <H3>Partial Indexes — Filtered Subsets</H3>
          <P>
            Partial indexes only index rows matching a WHERE clause. They are smaller than full-table indexes and used exclusively for the most common query patterns.
          </P>
          <Code>{`
-- Active/overdue borrowings: the common case for the borrowings page and
-- dashboard. Most borrowings are 'returned' — excluding them keeps this index small.
CREATE INDEX idx_borrowings_active
    ON borrowings (user_id, status)
    WHERE status IN ('active', 'overdue');

-- Due-date scanning for overdue detection — only active rows have meaningful due dates
CREATE INDEX idx_borrowings_due_date_active
    ON borrowings (due_date)
    WHERE status = 'active';

-- Unpaid fines: most fine queries filter on paid = FALSE
CREATE INDEX idx_fines_unpaid
    ON fines (user_id, amount)
    WHERE paid = FALSE;

-- Reservation FIFO queue — only pending reservations need fast ordered access
CREATE INDEX idx_reservations_pending_queue
    ON reservations (book_id, reserved_at)
    WHERE status = 'pending';`}
          </Code>

          <H3>Composite Index</H3>
          <Code>{`
-- Covers "find available copies for book X" — both columns used in WHERE
CREATE INDEX idx_book_copies_book_status
    ON book_copies (book_id, status);

-- Used by: SELECT * FROM book_copies WHERE book_id = $1 AND status = 'available'`}
          </Code>

          <H3>FK Join Support</H3>
          <Code>{`
-- Prevents sequential scans on the many-side of foreign key joins
CREATE INDEX idx_books_publisher     ON books (publisher_id);
CREATE INDEX idx_book_authors_author ON book_authors (author_id);
CREATE INDEX idx_book_genres_genre   ON book_genres (genre_id);
CREATE INDEX idx_book_copies_book    ON book_copies (book_id);
CREATE INDEX idx_borrowings_user     ON borrowings (user_id);
CREATE INDEX idx_borrowings_copy     ON borrowings (copy_id);
CREATE INDEX idx_fines_user          ON fines (user_id);
CREATE INDEX idx_fines_borrowing     ON fines (borrowing_id);
CREATE INDEX idx_reservations_user   ON reservations (user_id);
CREATE INDEX idx_sessions_expires    ON sessions (expires_at);
CREATE INDEX idx_sessions_user       ON sessions (user_id);
CREATE INDEX idx_authors_last_name   ON authors (last_name);
CREATE INDEX idx_authors_full_name   ON authors (last_name, first_name);
CREATE INDEX idx_books_isbn          ON books (isbn);`}
          </Code>

          {/* ── VIEWS ──────────────────────────────────────────────────── */}
          <H2 id="views">Views</H2>

          <P>Six views pre-join and pre-aggregate the most frequently needed datasets, keeping application queries shorter and centralising logic in the database.</P>

          <H3>v_active_borrowings</H3>
          <P>4-table INNER JOIN producing one row per active or overdue borrowing. Calculates days_overdue via date arithmetic.</P>
          <Code>{`
CREATE VIEW v_active_borrowings AS
SELECT
    b.borrowing_id,
    b.borrow_date,
    b.due_date,
    b.status,
    CURRENT_DATE - b.due_date   AS days_overdue,
    u.user_id,
    u.first_name || ' ' || u.last_name AS member_name,
    u.email,
    bk.book_id,
    bk.title,
    bc.copy_id,
    bc.copy_number
FROM borrowings b
INNER JOIN users u        ON u.user_id  = b.user_id
INNER JOIN book_copies bc ON bc.copy_id = b.copy_id
INNER JOIN books bk       ON bk.book_id = bc.book_id
WHERE b.status IN ('active', 'overdue');`}
          </Code>

          <H3>v_overdue_books</H3>
          <P>Filters v_active_borrowings to overdue rows and adds estimated_fine.</P>
          <Code>{`
CREATE VIEW v_overdue_books AS
SELECT *,
    days_overdue * 0.50 AS estimated_fine
FROM v_active_borrowings
WHERE due_date < CURRENT_DATE;`}
          </Code>

          <H3>v_book_availability</H3>
          <P>Per-title copy counts by status using FILTER aggregate syntax — all counts computed in a single pass over book_copies.</P>
          <Code>{`
CREATE VIEW v_book_availability AS
SELECT
    bk.book_id,
    bk.title,
    COUNT(bc.copy_id)                               AS total_copies,
    COUNT(bc.copy_id) FILTER (WHERE bc.status = 'available')   AS available_count,
    COUNT(bc.copy_id) FILTER (WHERE bc.status = 'borrowed')    AS borrowed_count,
    COUNT(bc.copy_id) FILTER (WHERE bc.status = 'reserved')    AS reserved_count,
    COUNT(bc.copy_id) FILTER (WHERE bc.status = 'maintenance') AS maintenance_count
FROM books bk
LEFT JOIN book_copies bc ON bc.book_id = bk.book_id
GROUP BY bk.book_id, bk.title;`}
          </Code>

          <H3>v_popular_books</H3>
          <P>Uses a CTE and RANK() window function to rank titles by total borrow count.</P>
          <Code>{`
CREATE VIEW v_popular_books AS
WITH borrow_counts AS (
    SELECT bc.book_id, COUNT(b.borrowing_id) AS total_borrows
    FROM borrowings b
    JOIN book_copies bc ON bc.copy_id = b.copy_id
    GROUP BY bc.book_id
)
SELECT
    bk.book_id,
    bk.title,
    COALESCE(bc.total_borrows, 0) AS total_borrows,
    RANK() OVER (ORDER BY COALESCE(bc.total_borrows, 0) DESC) AS rank
FROM books bk
LEFT JOIN borrow_counts bc ON bc.book_id = bk.book_id;`}
          </Code>

          <H3>v_member_stats</H3>
          <P>Per-member aggregate using LEFT JOINs (members with no activity still appear) and DENSE_RANK() for activity ranking.</P>
          <Code>{`
CREATE VIEW v_member_stats AS
SELECT
    u.user_id,
    u.first_name || ' ' || u.last_name                                          AS name,
    u.email,
    u.membership_type,
    COUNT(b.borrowing_id) FILTER (WHERE b.status IN ('active','overdue','returned')) AS total_borrowed,
    COUNT(b.borrowing_id) FILTER (WHERE b.status IN ('active','overdue'))            AS currently_borrowed,
    COALESCE(SUM(f.amount) FILTER (WHERE f.paid = FALSE), 0)                         AS unpaid_fines,
    DENSE_RANK() OVER (ORDER BY COUNT(b.borrowing_id) DESC) AS activity_rank
FROM users u
LEFT JOIN borrowings b ON b.user_id = u.user_id
LEFT JOIN fines f      ON f.user_id = u.user_id
WHERE u.role = 'member'
GROUP BY u.user_id, u.first_name, u.last_name, u.email, u.membership_type;`}
          </Code>

          <H3>v_genre_popularity</H3>
          <P>Multi-table join across genres → book_genres → books → book_copies → borrowings, grouped by genre and ranked.</P>
          <Code>{`
CREATE VIEW v_genre_popularity AS
SELECT
    g.genre_id,
    g.name AS genre,
    COUNT(b.borrowing_id) AS borrow_count,
    RANK() OVER (ORDER BY COUNT(b.borrowing_id) DESC) AS rank
FROM genres g
JOIN book_genres bg  ON bg.genre_id = g.genre_id
JOIN books bk        ON bk.book_id  = bg.book_id
JOIN book_copies bc  ON bc.book_id  = bk.book_id
JOIN borrowings b    ON b.copy_id   = bc.copy_id
GROUP BY g.genre_id, g.name;`}
          </Code>

          {/* ── FUNCTIONS ──────────────────────────────────────────────── */}
          <H2 id="functions">Stored Functions</H2>

          <P>Five PL/pgSQL functions encapsulate core business logic, executing atomically inside a transaction regardless of how they are called.</P>

          <H3>borrow_book(p_user_id, p_copy_id)</H3>
          <P>Validates all preconditions before writing anything. Raises a named exception if any check fails, rolling back the entire transaction.</P>
          <Code>{`
CREATE OR REPLACE FUNCTION borrow_book(p_user_id INT, p_copy_id INT)
RETURNS VOID AS $$
DECLARE
    v_is_active   BOOLEAN;
    v_active_count INT;
    v_max_books   SMALLINT;
    v_unpaid_fines NUMERIC;
    v_copy_status VARCHAR(20);
BEGIN
    -- Check user is active
    SELECT is_active, max_books INTO v_is_active, v_max_books
    FROM users WHERE user_id = p_user_id;

    IF NOT v_is_active THEN
        RAISE EXCEPTION 'Member account is inactive' USING ERRCODE = 'insufficient_privilege';
    END IF;

    -- Check borrowing limit
    SELECT COUNT(*) INTO v_active_count
    FROM borrowings
    WHERE user_id = p_user_id AND status IN ('active', 'overdue');

    IF v_active_count >= v_max_books THEN
        RAISE EXCEPTION 'Borrowing limit reached (% / %)', v_active_count, v_max_books
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    -- Check unpaid fines threshold
    SELECT COALESCE(SUM(amount), 0) INTO v_unpaid_fines
    FROM fines WHERE user_id = p_user_id AND paid = FALSE;

    IF v_unpaid_fines > 10.00 THEN
        RAISE EXCEPTION 'Unpaid fines exceed limit: $%', v_unpaid_fines
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    -- Check copy availability
    SELECT status INTO v_copy_status
    FROM book_copies WHERE copy_id = p_copy_id;

    IF v_copy_status != 'available' THEN
        RAISE EXCEPTION 'Copy is not available (status: %)', v_copy_status
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    -- All checks passed — insert borrowing and mark copy
    INSERT INTO borrowings (copy_id, user_id, due_date)
    VALUES (p_copy_id, p_user_id, CURRENT_DATE + 14);

    UPDATE book_copies SET status = 'borrowed' WHERE copy_id = p_copy_id;
END;
$$ LANGUAGE plpgsql;`}
          </Code>

          <H3>return_book(p_borrowing_id)</H3>
          <P>Processes a return in four steps: mark returned, free the copy, calculate and insert fine if overdue, notify next reservation.</P>
          <Code>{`
CREATE OR REPLACE FUNCTION return_book(p_borrowing_id INT)
RETURNS VOID AS $$
DECLARE
    v_copy_id INT;
    v_user_id INT;
    v_fine    NUMERIC;
BEGIN
    SELECT copy_id, user_id INTO v_copy_id, v_user_id
    FROM borrowings WHERE borrowing_id = p_borrowing_id;

    -- 1. Mark returned
    UPDATE borrowings
    SET status = 'returned', return_date = CURRENT_DATE
    WHERE borrowing_id = p_borrowing_id;

    -- 2. Free the copy (triggers trg_notify_reservation_on_return)
    UPDATE book_copies SET status = 'available' WHERE copy_id = v_copy_id;

    -- 3. Calculate and record fine (if overdue)
    v_fine := calculate_fine(p_borrowing_id);
    IF v_fine > 0 THEN
        INSERT INTO fines (borrowing_id, user_id, amount, reason)
        VALUES (p_borrowing_id, v_user_id, v_fine, 'overdue');
    END IF;
END;
$$ LANGUAGE plpgsql;`}
          </Code>

          <H3>calculate_fine(p_borrowing_id) → NUMERIC</H3>
          <P>Pure function — no side effects. Returns $0.50 per day overdue, minimum zero.</P>
          <Code>{`
CREATE OR REPLACE FUNCTION calculate_fine(p_borrowing_id INT)
RETURNS NUMERIC AS $$
DECLARE
    v_due_date DATE;
BEGIN
    SELECT due_date INTO v_due_date
    FROM borrowings WHERE borrowing_id = p_borrowing_id;

    RETURN GREATEST(0, CURRENT_DATE - v_due_date) * 0.50;
END;
$$ LANGUAGE plpgsql;`}
          </Code>

          <H3>reserve_book(p_user_id, p_book_id)</H3>
          <P>Inserts a reservation only if no copies are available and the member has no existing active reservation for the same book.</P>
          <Code>{`
CREATE OR REPLACE FUNCTION reserve_book(p_user_id INT, p_book_id INT)
RETURNS VOID AS $$
DECLARE
    v_available_count INT;
    v_existing_count  INT;
BEGIN
    -- Cannot reserve if copies are available
    SELECT COUNT(*) INTO v_available_count
    FROM book_copies WHERE book_id = p_book_id AND status = 'available';

    IF v_available_count > 0 THEN
        RAISE EXCEPTION 'Copies are available — borrow directly'
            USING ERRCODE = 'check_violation';
    END IF;

    -- Cannot have two active reservations for the same book
    SELECT COUNT(*) INTO v_existing_count
    FROM reservations
    WHERE book_id = p_book_id AND user_id = p_user_id
      AND status IN ('pending', 'ready');

    IF v_existing_count > 0 THEN
        RAISE EXCEPTION 'Active reservation already exists for this book'
            USING ERRCODE = 'unique_violation';
    END IF;

    INSERT INTO reservations (book_id, user_id) VALUES (p_book_id, p_user_id);
END;
$$ LANGUAGE plpgsql;`}
          </Code>

          <H3>notify_next_reservation(p_book_id)</H3>
          <P>Advances the FIFO hold queue when a copy becomes available. Uses SELECT FOR UPDATE to lock the oldest pending reservation before transitioning it.</P>
          <Code>{`
CREATE OR REPLACE FUNCTION notify_next_reservation(p_book_id INT)
RETURNS VOID AS $$
DECLARE
    v_reservation_id INT;
BEGIN
    -- Lock the oldest pending reservation for this book (FIFO)
    SELECT reservation_id INTO v_reservation_id
    FROM reservations
    WHERE book_id = p_book_id AND status = 'pending'
    ORDER BY reserved_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF v_reservation_id IS NOT NULL THEN
        UPDATE reservations
        SET status      = 'ready',
            notified_at = NOW(),
            expires_at  = NOW() + INTERVAL '2 days'
        WHERE reservation_id = v_reservation_id;
    END IF;
END;
$$ LANGUAGE plpgsql;`}
          </Code>

          {/* ── TRIGGERS ───────────────────────────────────────────────── */}
          <H2 id="triggers">Triggers</H2>

          <P>Four triggers automate state transitions that must fire consistently regardless of whether the change originates from application code or a direct SQL statement.</P>

          <H3>trg_calculate_fine_on_return</H3>
          <P>Fires after any UPDATE that transitions a borrowing to 'returned'. Calls calculate_fine() and inserts a fine row if the result is positive.</P>
          <Code>{`
CREATE OR REPLACE FUNCTION fn_calculate_fine_on_return()
RETURNS TRIGGER AS $$
DECLARE v_fine NUMERIC;
BEGIN
    IF NEW.status = 'returned' AND OLD.status != 'returned' THEN
        v_fine := calculate_fine(NEW.borrowing_id);
        IF v_fine > 0 THEN
            INSERT INTO fines (borrowing_id, user_id, amount, reason)
            VALUES (NEW.borrowing_id, NEW.user_id, v_fine, 'overdue');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_fine_on_return
    AFTER UPDATE ON borrowings
    FOR EACH ROW
    WHEN (NEW.status = 'returned' AND OLD.status IS DISTINCT FROM 'returned')
    EXECUTE FUNCTION fn_calculate_fine_on_return();`}
          </Code>

          <H3>trg_sync_copy_status_on_borrow</H3>
          <P>Fires after INSERT on borrowings. Sets the copy's status to 'borrowed', keeping book_copies consistent with borrowings without requiring two separate statements from the caller.</P>
          <Code>{`
CREATE OR REPLACE FUNCTION fn_sync_copy_status_on_borrow()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE book_copies SET status = 'borrowed' WHERE copy_id = NEW.copy_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_copy_status_on_borrow
    AFTER INSERT ON borrowings
    FOR EACH ROW
    EXECUTE FUNCTION fn_sync_copy_status_on_borrow();`}
          </Code>

          <H3>trg_notify_reservation_on_return</H3>
          <P>Fires after any UPDATE on book_copies that transitions status to 'available' — including manual SQL updates, not just application code. Calls notify_next_reservation() to advance the hold queue.</P>
          <Code>{`
CREATE OR REPLACE FUNCTION fn_notify_reservation_on_return()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'available' AND OLD.status != 'available' THEN
        PERFORM notify_next_reservation(NEW.book_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_reservation_on_return
    AFTER UPDATE ON book_copies
    FOR EACH ROW
    WHEN (NEW.status = 'available' AND OLD.status IS DISTINCT FROM 'available')
    EXECUTE FUNCTION fn_notify_reservation_on_return();`}
          </Code>

          <H3>trg_set_updated_at</H3>
          <P>Fires before any UPDATE on books or users, setting updated_at = NOW() automatically. Applied to both tables via separate trigger definitions.</P>
          <Code>{`
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_updated_at_books
    BEFORE UPDATE ON books
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_set_updated_at_users
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();`}
          </Code>

          {/* ── APPLICATION QUERIES ─────────────────────────────────────── */}
          <H2 id="queries">Application Queries</H2>

          <P>
            All queries are written as tagged template literals using the <code className="font-mono text-primary text-xs">postgres</code> client. Every interpolated value (<code className="font-mono text-primary text-xs">${'${value}'}</code>) becomes a parameterised placeholder — no string concatenation reaches the SQL layer.
          </P>

          {/* Dashboard */}
          <H2 id="dashboard">Dashboard</H2>

          <H3>Aggregate Stats — Correlated Scalar Subqueries</H3>
          <P>Seven counts are fetched in a single round-trip using correlated scalar subqueries. Each subquery produces exactly one value, making this equivalent to seven independent COUNT queries with one database call.</P>
          <Code>{`
SELECT
  (SELECT COUNT(*) FROM books)                                              AS total_books,
  (SELECT COUNT(*) FROM book_copies WHERE status = 'available')            AS available_copies,
  (SELECT COUNT(*) FROM users WHERE role = 'member' AND is_active)         AS active_members,
  (SELECT COUNT(*) FROM borrowings WHERE status IN ('active', 'overdue'))  AS active_borrowings,
  (SELECT COUNT(*) FROM borrowings WHERE status = 'overdue')               AS overdue_count,
  (SELECT COALESCE(SUM(amount), 0) FROM fines WHERE paid = FALSE)          AS unpaid_fines,
  (SELECT COUNT(*) FROM reservations WHERE status = 'pending')             AS pending_reservations`}
          </Code>

          <H3>Recent Active Borrowings — 5-Table Join</H3>
          <Code>{`
SELECT
    b.borrowing_id,
    u.first_name || ' ' || u.last_name AS member_name,
    bk.title,
    b.borrow_date,
    b.due_date,
    b.status
FROM borrowings b
INNER JOIN users u        ON u.user_id  = b.user_id
INNER JOIN book_copies bc ON bc.copy_id = b.copy_id
INNER JOIN books bk       ON bk.book_id = bc.book_id
WHERE b.status IN ('active', 'overdue')
ORDER BY b.borrow_date DESC
LIMIT 8`}
          </Code>

          {/* Books */}
          <H2 id="books">Books Catalogue</H2>

          <H3>Full-Text Search — GIN Index + ILIKE Fallback</H3>
          <P>Title search uses the GIN index via <code className="font-mono text-primary text-xs">@@</code>. Author search falls back to ILIKE since author names are not in the books FTS vector. Both are ORed together.</P>
          <Code>{`
SELECT
    b.book_id,
    b.title,
    b.publication_year,
    COALESCE(string_agg(DISTINCT a.first_name || ' ' || a.last_name, ', '), '') AS authors,
    COALESCE(string_agg(DISTINCT g.name, ', '), '')                             AS genres,
    COUNT(DISTINCT bc.copy_id)                                                   AS total_copies,
    COUNT(DISTINCT bc.copy_id) FILTER (WHERE bc.status = 'available')           AS available_copies
FROM books b
LEFT JOIN book_authors ba ON ba.book_id  = b.book_id
LEFT JOIN authors a       ON a.author_id = ba.author_id
LEFT JOIN book_genres bg  ON bg.book_id  = b.book_id
LEFT JOIN genres g        ON g.genre_id  = bg.genre_id
LEFT JOIN book_copies bc  ON bc.book_id  = b.book_id
WHERE
    to_tsvector('english', b.title) @@ plainto_tsquery('english', $1)
    OR (a.first_name || ' ' || a.last_name) ILIKE '%' || $1 || '%'
GROUP BY b.book_id, b.title, b.publication_year
ORDER BY b.title`}
          </Code>

          <H3>COUNT DISTINCT FILTER — Conditional Aggregate in One Pass</H3>
          <P>The FILTER clause computes multiple conditional counts in a single scan, avoiding subqueries or CASE expressions. Used in both the search and default listing queries.</P>
          <Code>{`
-- Available and total copies computed in a single GROUP BY pass:
COUNT(DISTINCT bc.copy_id)                                          AS total_copies,
COUNT(DISTINCT bc.copy_id) FILTER (WHERE bc.status = 'available')  AS available_copies`}
          </Code>

          <H3>Book Detail — Multi-Table LEFT JOIN with STRING_AGG</H3>
          <Code>{`
SELECT
    b.book_id, b.title, b.isbn, b.publication_year, b.edition, b.summary,
    p.name AS publisher_name,
    COALESCE(string_agg(DISTINCT a.first_name || ' ' || a.last_name, ', '), '') AS authors,
    COALESCE(string_agg(DISTINCT g.name, ', '), '')                             AS genres
FROM books b
LEFT JOIN publishers p    ON p.publisher_id = b.publisher_id
LEFT JOIN book_authors ba ON ba.book_id     = b.book_id
LEFT JOIN authors a       ON a.author_id    = ba.author_id
LEFT JOIN book_genres bg  ON bg.book_id     = b.book_id
LEFT JOIN genres g        ON g.genre_id     = bg.genre_id
WHERE b.book_id = $1
GROUP BY b.book_id, b.title, b.isbn, b.publication_year, b.edition, b.summary, p.name`}
          </Code>

          <H3>Reserve Book — Validation then Insert</H3>
          <P>The server action checks for an existing pending/ready reservation before inserting, relying on the UNIQUE NULLS NOT DISTINCT constraint as a final safety net.</P>
          <Code>{`
-- Check for existing active reservation
SELECT reservation_id FROM reservations
WHERE book_id = $1 AND user_id = $2 AND status IN ('pending', 'ready');

-- If none found, insert
INSERT INTO reservations (book_id, user_id)
VALUES ($1, $2)
RETURNING reservation_id`}
          </Code>

          <H3>Add Copy — Subquery for Auto-Incrementing copy_number</H3>
          <P>The next copy number is derived within the INSERT using a subquery, avoiding a separate SELECT round-trip and racing with concurrent inserts.</P>
          <Code>{`
INSERT INTO book_copies (book_id, copy_number, status, condition)
VALUES (
    $1,
    (SELECT COALESCE(MAX(copy_number), 0) + 1 FROM book_copies WHERE book_id = $1),
    'available',
    'new'
)
RETURNING copy_id, copy_number`}
          </Code>

          {/* Members */}
          <H2 id="members">Members</H2>

          <H3>Members List — Correlated Subqueries per Row</H3>
          <P>Each member row has two scalar subqueries computing their active borrowings count and unpaid fines total. These run once per member row returned.</P>
          <Code>{`
SELECT
    u.user_id,
    u.first_name, u.last_name, u.email, u.membership_type, u.phone, u.is_active,
    (SELECT COUNT(*)
     FROM borrowings
     WHERE user_id = u.user_id AND status IN ('active','overdue'))  AS active_borrowings,
    (SELECT COALESCE(SUM(amount), 0)
     FROM fines
     WHERE user_id = u.user_id AND paid = FALSE)                    AS unpaid_fines
FROM users u
WHERE role = 'member'
ORDER BY last_name, first_name

-- With search:
-- AND ((first_name || ' ' || last_name) ILIKE '%' || $1 || '%' OR email ILIKE '%' || $1 || '%')`}
          </Code>

          <H3>Member Detail — Three Parallel Queries</H3>
          <P>The detail page runs three queries concurrently via Promise.all(): active borrowings, unpaid fines, and active reservations.</P>
          <Code>{`
-- 1. Active borrowings for this member
SELECT b.borrowing_id, bk.title, bk.book_id, b.borrow_date, b.due_date, b.status
FROM borrowings b
JOIN book_copies bc ON bc.copy_id = b.copy_id
JOIN books bk       ON bk.book_id = bc.book_id
WHERE b.user_id = $1 AND b.status IN ('active','overdue')
ORDER BY b.borrow_date DESC;

-- 2. Unpaid fines for this member
SELECT f.fine_id, f.amount, f.reason, b.borrow_date
FROM fines f
JOIN borrowings b ON b.borrowing_id = f.borrowing_id
WHERE f.user_id = $1 AND f.paid = FALSE
ORDER BY b.borrow_date DESC;

-- 3. Active reservations for this member
SELECT r.reservation_id, bk.title, bk.book_id, r.status, r.reserved_at
FROM reservations r
JOIN books bk ON bk.book_id = r.book_id
WHERE r.user_id = $1 AND r.status IN ('pending','ready')
ORDER BY r.reserved_at DESC`}
          </Code>

          {/* Borrowings */}
          <H2 id="borrowings">Borrowings</H2>

          <H3>Return Book — Multi-Step Transaction</H3>
          <P>The returnBookAction performs four sequential statements: mark returned, free the copy, compute fine in JavaScript, insert fine if overdue, notify next reservation via correlated subquery UPDATE.</P>
          <Code>{`
-- Step 1: Fetch borrowing to verify it's active
SELECT borrowing_id, copy_id, user_id, due_date
FROM borrowings
WHERE borrowing_id = $1 AND status IN ('active','overdue');

-- Step 2: Mark returned
UPDATE borrowings
SET status = 'returned', return_date = CURRENT_DATE
WHERE borrowing_id = $1;

-- Step 3: Free the copy
UPDATE book_copies
SET status = 'available'
WHERE copy_id = $2;

-- Step 4: Insert fine if overdue (fine amount computed in JavaScript)
INSERT INTO fines (borrowing_id, user_id, amount, reason)
VALUES ($1, $3, $4, 'overdue');

-- Step 5: Notify next reservation — correlated subquery UPDATE
UPDATE reservations
SET status      = 'ready',
    notified_at = NOW(),
    expires_at  = NOW() + INTERVAL '2 days'
WHERE reservation_id = (
    SELECT reservation_id
    FROM reservations
    WHERE book_id = (SELECT book_id FROM book_copies WHERE copy_id = $2)
      AND status = 'pending'
    ORDER BY reserved_at ASC
    LIMIT 1
)`}
          </Code>

          <H3>Borrow Book — Guard Checks then Insert</H3>
          <P>The borrowBookAction runs three validation queries before inserting. Each check redirects on failure.</P>
          <Code>{`
-- Guard 1: copy must be available
SELECT status FROM book_copies WHERE copy_id = $1;

-- Guard 2: member must be active and within borrowing limit, with no excessive fines
SELECT is_active, max_books,
    (SELECT COUNT(*) FROM borrowings
     WHERE user_id = u.user_id AND status IN ('active','overdue')) AS active_count,
    (SELECT COALESCE(SUM(amount), 0) FROM fines
     WHERE user_id = u.user_id AND paid = FALSE)                   AS unpaid_fines
FROM users u
WHERE user_id = $2;

-- Insert if all guards pass
INSERT INTO borrowings (copy_id, user_id, due_date)
VALUES ($1, $2, CURRENT_DATE + 14);

UPDATE book_copies SET status = 'borrowed' WHERE copy_id = $1;`}
          </Code>

          {/* Reservations */}
          <H2 id="reservations">Reservations</H2>

          <H3>Filtered Reservation Queries</H3>
          <P>Role-aware queries: librarians see all reservations, members see only their own. Status filter applied via parameterised WHERE clause.</P>
          <Code>{`
-- Librarian — filtered by status (or all)
SELECT r.reservation_id, r.status, r.reserved_at, r.expires_at,
       bk.title, bk.book_id,
       u.first_name || ' ' || u.last_name AS member_name, u.user_id
FROM reservations r
JOIN books bk ON bk.book_id = r.book_id
JOIN users u  ON u.user_id  = r.user_id
WHERE r.status = $1          -- omitted for 'all'
ORDER BY r.reserved_at ASC
LIMIT 200;

-- Member — own reservations only
SELECT ... FROM reservations r
JOIN books bk ON bk.book_id = r.book_id
JOIN users u  ON u.user_id  = r.user_id
WHERE r.user_id = $1
  AND r.status = $2          -- omitted for 'all'
ORDER BY r.reserved_at ASC`}
          </Code>

          {/* Fines */}
          <H2 id="fines">Fines</H2>

          <H3>Fines List — 5-Table Join</H3>
          <P>Each fine row joins fines → users → borrowings → book_copies → books to provide full context. The FILTER aggregate on paid status is used for the unpaid balance calculation in JavaScript after fetching.</P>
          <Code>{`
SELECT f.fine_id, f.amount, f.reason, f.paid, f.paid_date, f.created_at,
       u.first_name || ' ' || u.last_name AS member_name, u.user_id,
       bk.title AS book_title, bk.book_id,
       br.borrow_date, br.due_date
FROM fines f
JOIN users u        ON u.user_id         = f.user_id
JOIN borrowings br  ON br.borrowing_id   = f.borrowing_id
JOIN book_copies bc ON bc.copy_id        = br.copy_id
JOIN books bk       ON bk.book_id        = bc.book_id
WHERE f.paid = $1    -- TRUE/FALSE, or omitted for 'all'
  AND f.user_id = $2 -- member-only, omitted for librarian
ORDER BY f.created_at DESC
LIMIT 200`}
          </Code>

          {/* Reports */}
          <H2 id="reports">Reports</H2>

          <H3>Most Borrowed Books</H3>
          <Code>{`
SELECT bk.book_id, bk.title,
       COUNT(b.borrowing_id) AS borrow_count,
       STRING_AGG(DISTINCT a.first_name || ' ' || a.last_name, ', ') AS authors
FROM borrowings b
JOIN book_copies bc  ON bc.copy_id  = b.copy_id
JOIN books bk        ON bk.book_id  = bc.book_id
LEFT JOIN book_authors ba ON ba.book_id  = bk.book_id
LEFT JOIN authors a       ON a.author_id = ba.author_id
GROUP BY bk.book_id, bk.title
ORDER BY borrow_count DESC
LIMIT 10`}
          </Code>

          <H3>Overdue Books with Estimated Fine</H3>
          <P>Date arithmetic computes days overdue and estimated fine (at $0.50/day) inline. Ordered by most overdue first.</P>
          <Code>{`
SELECT b.borrowing_id, bk.title,
       u.first_name || ' ' || u.last_name AS member_name,
       b.due_date,
       CURRENT_DATE - b.due_date                         AS days_overdue,
       ROUND((CURRENT_DATE - b.due_date) * 0.5, 2)      AS estimated_fine
FROM borrowings b
JOIN book_copies bc ON bc.copy_id = b.copy_id
JOIN books bk       ON bk.book_id = bc.book_id
JOIN users u        ON u.user_id  = b.user_id
WHERE b.status IN ('active', 'overdue')
  AND b.due_date < CURRENT_DATE
ORDER BY days_overdue DESC`}
          </Code>

          <H3>Genre Popularity — Multi-Join + GROUP BY</H3>
          <Code>{`
SELECT g.name AS genre, COUNT(b.borrowing_id) AS borrow_count
FROM genres g
JOIN book_genres bg ON bg.genre_id = g.genre_id
JOIN books bk       ON bk.book_id  = bg.book_id
JOIN book_copies bc ON bc.book_id  = bk.book_id
JOIN borrowings b   ON b.copy_id   = bc.copy_id
GROUP BY g.name
ORDER BY borrow_count DESC
LIMIT 8`}
          </Code>

          <H3>Member Activity — FILTER Aggregates</H3>
          <P>Two separate FILTER expressions on the same borrowings join compute total-ever and currently-active counts in a single pass. LEFT JOINs ensure all members appear even if they have never borrowed.</P>
          <Code>{`
SELECT u.user_id, u.first_name || ' ' || u.last_name AS name, u.membership_type,
    COUNT(b.borrowing_id) FILTER (WHERE b.status IN ('active','overdue','returned')) AS total_borrowed,
    COUNT(b.borrowing_id) FILTER (WHERE b.status IN ('active','overdue'))            AS currently_borrowed,
    COALESCE(SUM(f.amount) FILTER (WHERE f.paid = FALSE), 0)                         AS unpaid_fines
FROM users u
LEFT JOIN borrowings b ON b.user_id = u.user_id
LEFT JOIN fines f      ON f.user_id = u.user_id
WHERE u.role = 'member'
GROUP BY u.user_id, u.first_name, u.last_name, u.membership_type
ORDER BY total_borrowed DESC
LIMIT 10`}
          </Code>

          {/* Footer */}
          <div className="mt-20 pt-8 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground/60">
              Library Management System — DBMS Course Project
            </p>
            <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              ← Back to app
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}
