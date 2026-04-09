# Implementation — Library Management System

A database-driven web application built as a Database Management Systems course project. The system supports two roles — **librarians** and **members** — with distinct access to cataloguing, borrowing, reservations, fines, and reporting.

---

## Technology Stack

### Runtime & Framework

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js (via Bun) | — |
| Package manager | Bun | — |
| Framework | Next.js (App Router) | 16.2.2 |
| Language | TypeScript | ^5 |
| UI library | React | 19.2.4 |

**Next.js 16 App Router** is used exclusively — no Pages Router. Every page is a React Server Component by default. Interactivity is added only where needed via `'use client'` directives (e.g. the navigation sidebar, which calls `usePathname()`). Data mutations go through **Server Actions** (`'use server'`), which are co-located with their routes in `actions.ts` files.

In Next.js 16, the former `middleware.ts` file convention was renamed to `proxy.ts`. The app uses `src/proxy.ts` to enforce authentication at the edge — unauthenticated requests to any protected path are redirected to `/login` before the route ever renders.

### Styling

| Technology | Version | Role |
|---|---|---|
| Tailwind CSS | ^4 | Utility-first styling |
| tw-animate-css | ^1.4.0 | Animation utilities |
| clsx + tailwind-merge | latest | Conditional class composition |
| class-variance-authority | ^0.7.1 | Component variant definitions |

### UI Components

Components are built on **Base UI** (`@base-ui/react` ^1.3.0), a headless, unstyled primitive library from the React team. Styled wrappers live in `src/components/ui/` and cover: Button, Card, Input, Label, Badge, Table, Dialog, Select, Dropdown Menu, Tabs, Separator, Avatar, Textarea, and Sonner (toast notifications). Icons are from **Lucide React** ^1.7.0.

### Database Access

| Technology | Version | Role |
|---|---|---|
| PostgreSQL | 16 (Docker) | Primary database |
| postgres (npm) | ^3.4.9 | SQL client |

The `postgres` package provides a tagged template literal interface (`sql\`...\``) that parameterises all values automatically, eliminating the possibility of SQL injection. There is no ORM — all queries are written in plain SQL, which allows direct use of PostgreSQL-specific features (GIN indexes, partial indexes, window functions, etc.).

The connection is configured in `src/lib/db.ts` with a pool of 10 connections, a 30-second idle timeout, and a 10-second connect timeout.

### Authentication

Sessions are implemented with **database-backed cookies**:

1. On login, credentials are verified with `bcryptjs` against the stored `password_hash`.
2. A row is inserted into the `sessions` table with a UUID primary key and an expiry timestamp 7 days out.
3. The UUID is written to an `HttpOnly`, `SameSite=lax` cookie.
4. On every authenticated request, the session cookie is looked up in the database to retrieve the user record.
5. The edge-level proxy (`src/proxy.ts`) does a fast cookie-presence check (no DB query) to redirect unauthenticated visitors before any page renders.

Auth helpers in `src/lib/auth.ts`:
- `getSession()` — validates cookie and returns the user, or `null`
- `requireAuth()` — redirects to `/login` if no valid session
- `requireLibrarian()` — additionally redirects members to `/` if they reach a librarian-only route
- `destroySession()` — deletes the session row and clears the cookie

---

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # Route group — shares the sidebar layout
│   │   ├── layout.tsx        # Calls requireAuth(), renders NavSidebar
│   │   ├── page.tsx          # Dashboard — aggregate stats + recent borrowings
│   │   ├── books/            # Book catalogue + copy management
│   │   ├── borrowings/       # Borrowing list + issue/return workflow
│   │   ├── fines/            # Fine tracking and payment recording
│   │   ├── members/          # Member management (librarian only)
│   │   ├── reports/          # Analytics dashboard (librarian only)
│   │   └── reservations/     # Hold queue management
│   ├── login/                # Login page + loginAction
│   └── logout/               # logoutAction (server action only)
├── components/
│   ├── nav-sidebar.tsx       # Role-aware sidebar navigation
│   └── ui/                   # Base UI wrappers (Button, Card, Table, …)
├── lib/
│   ├── auth.ts               # Session management helpers
│   ├── constants.ts          # LOAN_DURATION_DAYS, FINE_RATE_PER_DAY, etc.
│   ├── db.ts                 # postgres connection pool
│   ├── format.ts             # formatDate, formatCurrency
│   └── utils.ts              # cn() class utility
└── proxy.ts                  # Edge auth guard (Next.js 16 Proxy)
```

---

## DBMS Section

### Database System

**PostgreSQL 16**, running in a Docker container (image: `postgres:16-alpine`, port `5433`). The `pgcrypto` extension is enabled to provide `gen_random_uuid()` for UUID primary key generation on the `sessions` table.

---

### Schema Design — Third Normal Form (3NF)

The schema is normalised to **Third Normal Form**. Every non-key attribute depends on the whole primary key and nothing but the primary key — there are no transitive dependencies.

Key normalisation decisions:

- **Authors, genres, and publishers** are factored into their own lookup tables rather than stored as strings on `books`. This eliminates redundancy (e.g. "Penguin Random House" appears once, not on every book row) and allows independent querying.
- **Many-to-many relationships** (book↔author, book↔genre) are resolved through explicit junction tables (`book_authors`, `book_genres`) with composite primary keys, rather than comma-separated columns.
- **Copy-level tracking** is separated from title-level records. `books` holds the bibliographic record; `book_copies` holds each physical item, its condition, and its current status. This cleanly separates the concept of "a book" from "a copy of a book."
- **Users and roles** share one table, discriminated by a `role` column. Librarian-specific attributes are minimal, so a separate table would be over-normalised here.
- **Fines** are their own entity, linked to both the borrowing (for context) and the user (for efficient per-member queries), but the `amount` is computed at creation time rather than derived on every read.

#### Entity-Relationship Summary

```
publishers ──< books >─── book_authors ───> authors
                │
                └──< book_genres >──────── genres
                │
                └──< book_copies
                          │
                          └──< borrowings >── users
                                  │                │
                                  └──> fines ──────┘
                                  
books >─── reservations ───< users
sessions ──────────────────< users
```

---

### Tables

| Table | Primary Key | Description |
|---|---|---|
| `genres` | `genre_id` SERIAL | Lookup table for genre classifications |
| `publishers` | `publisher_id` SERIAL | Publisher reference data |
| `authors` | `author_id` SERIAL | Author biographical records |
| `books` | `book_id` SERIAL | Bibliographic title records |
| `book_authors` | (`book_id`, `author_id`) | Many-to-many: books ↔ authors |
| `book_genres` | (`book_id`, `genre_id`) | Many-to-many: books ↔ genres |
| `book_copies` | `copy_id` SERIAL | Individual physical copies |
| `users` | `user_id` SERIAL | Members and librarians |
| `sessions` | `session_id` UUID | Database-backed auth sessions |
| `borrowings` | `borrowing_id` SERIAL | Borrow/return transactions |
| `fines` | `fine_id` SERIAL | Monetary penalties |
| `reservations` | `reservation_id` SERIAL | Hold queue entries |

---

### Constraints

#### Primary Keys
All tables have a surrogate primary key (`SERIAL` or `UUID`). Junction tables (`book_authors`, `book_genres`) use composite primary keys over their two foreign key columns.

#### Foreign Keys with Referential Actions
```sql
-- Deleting a book cascades to its copies, author links, and genre links
book_copies.book_id    REFERENCES books(book_id)     ON DELETE CASCADE
book_authors.book_id   REFERENCES books(book_id)     ON DELETE CASCADE
book_genres.book_id    REFERENCES books(book_id)     ON DELETE CASCADE

-- Deleting a publisher nullifies the reference on books (book record preserved)
books.publisher_id     REFERENCES publishers(publisher_id) ON DELETE SET NULL

-- Session deleted when user is deleted
sessions.user_id       REFERENCES users(user_id)     ON DELETE CASCADE
```

#### CHECK Constraints
Domain integrity is enforced at the database level, independent of application logic:

```sql
-- book_copies: controlled vocabulary for status and condition
status    CHECK (status IN ('available','borrowed','reserved','maintenance','lost'))
condition CHECK (condition IN ('new','good','fair','poor','damaged'))

-- books: publication year must be plausible
publication_year CHECK (publication_year > 0
                    AND publication_year <= EXTRACT(YEAR FROM NOW())::SMALLINT + 1)

-- users: role and membership type enumerations
role            CHECK (role IN ('librarian','member'))
membership_type CHECK (membership_type IN ('standard','premium','student'))
max_books       CHECK (max_books >= 1 AND max_books <= 10)

-- borrowings: temporal ordering
CONSTRAINT chk_return_after_borrow CHECK (return_date IS NULL OR return_date >= borrow_date)
CONSTRAINT chk_due_after_borrow    CHECK (due_date > borrow_date)
status CHECK (status IN ('active','returned','overdue','lost'))

-- fines: paid_date only present when paid = TRUE
CONSTRAINT chk_paid_date CHECK (paid_date IS NULL OR paid = TRUE)
amount CHECK (amount > 0)

-- reservations: status vocabulary
status CHECK (status IN ('pending','ready','fulfilled','cancelled','expired'))
```

#### UNIQUE Constraints
```sql
genres.name                            -- genre names are globally unique
publishers.name                        -- publisher names are globally unique
books.isbn                             -- ISBN uniquely identifies a title
users.email                            -- one account per email address
book_copies(book_id, copy_number)      -- copy numbers are unique per book title

-- Prevents a member from holding two active reservations on the same book:
CONSTRAINT uq_active_reservation
    UNIQUE NULLS NOT DISTINCT (book_id, user_id, status)
```

The `uq_active_reservation` constraint uses **`UNIQUE NULLS NOT DISTINCT`** (PostgreSQL 15+), which treats `NULL` status values as equal for the purpose of uniqueness evaluation. This prevents duplicate pending or ready reservations without blocking rows in terminal states (`fulfilled`, `cancelled`, `expired`).

#### NOT NULL
All columns that must always be present are declared `NOT NULL`. Nullable columns (`return_date`, `paid_date`, `notified_at`, `expires_at`, `summary`, `bio`, etc.) represent genuinely optional data.

---

### Indexes

#### B-tree Indexes (default)
Standard B-tree indexes support equality lookups and range scans on frequently joined or filtered columns.

```sql
-- ISBN exact lookup
CREATE INDEX idx_books_isbn ON books (isbn);

-- Author name search
CREATE INDEX idx_authors_last_name   ON authors (last_name);
CREATE INDEX idx_authors_full_name   ON authors (last_name, first_name);

-- FK join support — prevents sequential scans on the many-side of joins
CREATE INDEX idx_books_publisher     ON books (publisher_id);
CREATE INDEX idx_book_authors_author ON book_authors (author_id);
CREATE INDEX idx_book_genres_genre   ON book_genres (genre_id);
CREATE INDEX idx_book_copies_book    ON book_copies (book_id);
CREATE INDEX idx_borrowings_user     ON borrowings (user_id);
CREATE INDEX idx_borrowings_copy     ON borrowings (copy_id);
CREATE INDEX idx_sessions_expires    ON sessions (expires_at);
CREATE INDEX idx_sessions_user       ON sessions (user_id);
CREATE INDEX idx_fines_user          ON fines (user_id);
CREATE INDEX idx_fines_borrowing     ON fines (borrowing_id);
CREATE INDEX idx_reservations_user   ON reservations (user_id);
```

#### Composite Index
```sql
-- Covers "find available copies for book X" — both columns used in WHERE clause
CREATE INDEX idx_book_copies_book_status ON book_copies (book_id, status);
```

#### GIN Index (Full-Text Search)
```sql
-- Enables fast full-text search on book titles using the @@ operator
CREATE INDEX idx_books_title_fts
    ON books USING GIN (to_tsvector('english', title));
```
The application queries this with `plainto_tsquery('english', ${q})`, which parses user input into a tsquery without requiring users to know tsquery syntax.

#### Partial Indexes (Filtered)
Partial indexes only index rows matching a WHERE clause, making them smaller and faster than full-table indexes for workloads that predominantly access a specific subset of rows.

```sql
-- Active/overdue borrowings: the common case for the borrowings page
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

-- Reservation queue: FIFO ordering of pending reservations per book
CREATE INDEX idx_reservations_pending_queue
    ON reservations (book_id, reserved_at)
    WHERE status = 'pending';
```

---

### Stored Functions

Five PL/pgSQL functions encapsulate the core business logic, ensuring it executes atomically and consistently regardless of how it is invoked.

#### `borrow_book(p_user_id INT, p_copy_id INT)`
Validates the entire borrow precondition before writing anything:
- User account is active
- User has not exceeded their `max_books` borrowing limit
- User has no unpaid fines above the threshold
- Copy status is `'available'`

On success, inserts a `borrowings` row and updates the copy status to `'borrowed'` within the same transaction. Raises a named exception (`insufficient_privilege`) with a descriptive message if any precondition fails.

#### `return_book(p_borrowing_id INT)`
Processes a return:
1. Sets `borrowings.status = 'returned'` and `return_date = CURRENT_DATE`
2. Sets `book_copies.status = 'available'`
3. Calls `calculate_fine()` and inserts a fine row if the result is positive
4. Calls `notify_next_reservation()` to advance the hold queue for the returned book

#### `calculate_fine(p_borrowing_id INT) RETURNS NUMERIC`
Pure function — no side effects. Returns `GREATEST(0, CURRENT_DATE - due_date) * 0.50`. Used by `return_book()` and directly in reporting queries for estimated fine calculation.

#### `reserve_book(p_user_id INT, p_book_id INT)`
Inserts a `reservations` row only if:
- The book has no available copies (otherwise, the member should borrow directly)
- The user has no existing `pending` or `ready` reservation for the same book

#### `notify_next_reservation(p_book_id INT)`
Advances the hold queue for a book when a copy becomes available. Uses `SELECT ... FOR UPDATE` to lock the oldest `pending` reservation row, then transitions it to `ready`, setting `notified_at = NOW()` and `expires_at = NOW() + INTERVAL '2 days'`. This gives the member a 2-day window to collect before the reservation expires.

---

### Triggers

Four triggers automate state transitions that must always fire on specific data events, decoupling them from application code.

#### `trg_calculate_fine_on_return`
```
AFTER UPDATE ON borrowings
WHEN (NEW.status = 'returned' AND OLD.status != 'returned')
```
Calls `calculate_fine()` and inserts a row into `fines` if the overdue amount is greater than zero. Fires automatically on any `UPDATE` that transitions a borrowing to returned, whether from application code or a direct SQL statement.

#### `trg_sync_copy_status_on_borrow`
```
AFTER INSERT ON borrowings
```
Sets `book_copies.status = 'borrowed'` for the copy referenced by the new borrowing row. Keeps copy status consistent with the borrowings table without requiring the caller to issue two separate statements.

#### `trg_notify_reservation_on_return`
```
AFTER UPDATE ON book_copies
WHEN (NEW.status = 'available' AND OLD.status != 'available')
```
Calls `notify_next_reservation()` whenever any copy transitions to available — including manual status updates via SQL, not just returns processed through `return_book()`.

#### `trg_set_updated_at`
```
BEFORE UPDATE ON books, users
```
Sets `updated_at = NOW()` on any row update. Applied to both `books` and `users`, ensuring `updated_at` reflects the actual last-modified time without the application having to track it explicitly.

---

### Views

Six views pre-join and pre-aggregate the most frequently needed datasets. Using views keeps query logic in one place (the database) and makes application queries shorter and more readable.

#### `v_active_borrowings`
Joins `borrowings`, `users`, `book_copies`, and `books` (4× INNER JOIN) to produce one row per active or overdue borrow. Calculates `days_overdue` using date arithmetic (`CURRENT_DATE - due_date`). Used by the dashboard and borrowings page.

#### `v_overdue_books`
Filters `v_active_borrowings` to overdue rows only and adds `estimated_fine` (`days_overdue * 0.50`). Used by the Reports page.

#### `v_book_availability`
Groups `book_copies` by `book_id` and uses `FILTER` aggregate syntax to compute per-status counts in a single pass:
```sql
COUNT(*) FILTER (WHERE status = 'available') AS available_count,
COUNT(*) FILTER (WHERE status = 'borrowed')  AS borrowed_count,
-- …
```

#### `v_popular_books`
Uses a CTE and the `RANK()` window function to rank books by total borrow count:
```sql
WITH borrow_counts AS (
    SELECT book_id, COUNT(*) AS total_borrows FROM ...
)
SELECT *, RANK() OVER (ORDER BY total_borrows DESC) AS rank FROM borrow_counts
```

#### `v_member_stats`
Per-member aggregate using LEFT JOINs (so members with no activity still appear) and `DENSE_RANK()` to rank members by borrow count. Uses `COALESCE` to return 0 instead of NULL for members with no fines.

#### `v_genre_popularity`
Multi-table join across `genres → book_genres → books → book_copies → borrowings`, grouped by genre name, ranked with `RANK() OVER (ORDER BY borrow_count DESC)`.

---

### SQL Features Used in Application Queries

Beyond the schema definitions, the following SQL features are exercised directly in the application's query layer (`src/app/(dashboard)/*/page.tsx` and `actions.ts`):

#### Aggregate Functions with FILTER
The `FILTER (WHERE ...)` clause computes multiple conditional aggregates in a single scan, avoiding subqueries:
```sql
COUNT(DISTINCT bc.copy_id) FILTER (WHERE bc.status = 'available') AS available_copies,
COUNT(b.borrowing_id) FILTER (WHERE b.status IN ('active','overdue'))  AS currently_borrowed,
COALESCE(SUM(f.amount) FILTER (WHERE f.paid = FALSE), 0)               AS unpaid_fines
```

#### STRING_AGG with DISTINCT and ORDER BY
Aggregates multi-row joins into a single comma-separated string per book, with deduplication and ordering:
```sql
STRING_AGG(DISTINCT a.first_name || ' ' || a.last_name, ', '
    ORDER BY a.last_name, a.first_name) AS authors
```

#### Correlated Scalar Subqueries
The dashboard stats query computes seven counts in one round-trip using scalar subqueries:
```sql
SELECT
  (SELECT COUNT(*) FROM books)                                    AS total_books,
  (SELECT COUNT(*) FROM book_copies WHERE status = 'available')  AS available_copies,
  (SELECT COUNT(*) FROM users WHERE role = 'member' AND is_active) AS active_members,
  -- …
```

#### Subquery in INSERT (auto-increment copy_number)
A subquery computes the next copy number within the transaction, avoiding a separate round-trip or application-side logic:
```sql
INSERT INTO book_copies (book_id, copy_number, status, condition)
VALUES (
  ${bookId},
  (SELECT COALESCE(MAX(copy_number), 0) + 1 FROM book_copies WHERE book_id = ${bookId}),
  'available', 'new'
)
```

#### Subquery in UPDATE (FIFO reservation notification)
The `notify_next_reservation` query selects the oldest pending reservation for a book and updates it in one statement using a correlated subquery:
```sql
UPDATE reservations
SET status = 'ready', notified_at = NOW(), expires_at = NOW() + INTERVAL '2 days'
WHERE reservation_id = (
  SELECT reservation_id
  FROM reservations
  WHERE book_id = (SELECT book_id FROM book_copies WHERE copy_id = ${copyId})
    AND status = 'pending'
  ORDER BY reserved_at ASC
  LIMIT 1
)
```

#### Full-Text Search
Book title search uses PostgreSQL's built-in full-text search, taking advantage of the GIN index:
```sql
WHERE to_tsvector('english', b.title) @@ plainto_tsquery('english', ${q})
```
`plainto_tsquery` normalises the user's input (stemming, stop-word removal) without requiring tsquery syntax knowledge.

#### Date Arithmetic
PostgreSQL's native `DATE` arithmetic is used throughout:
```sql
CURRENT_DATE + ${LOAN_DURATION_DAYS}       -- compute due date
CURRENT_DATE - b.due_date                  -- calculate days overdue
NOW() + INTERVAL '2 days'                  -- reservation expiry
ROUND((CURRENT_DATE - b.due_date) * 0.5, 2) AS estimated_fine
```

#### Multi-table JOINs
The most complex queries join 5–6 tables. For example, the fines list joins: `fines → users → borrowings → book_copies → books`. The reports member activity query joins `users → borrowings → fines` with LEFT JOINs so members without any activity still appear in the results.

#### Parameterised Queries
All values passed to the database are parameterised via the `postgres` tagged template literal. No string interpolation reaches the SQL layer, preventing SQL injection at the driver level rather than relying on application-side sanitisation.

---

### Business Rules Enforced at the Database Level

| Rule | Mechanism |
|---|---|
| A member can hold at most `max_books` active borrowings | CHECK in `borrow_book()`, validated in `borrowBookAction` |
| A member with unpaid fines > $10 cannot borrow | Validated in `borrow_book()` and `borrowBookAction` |
| A copy can only be borrowed when its status is `available` | CHECK in `borrow_book()`, CHECK constraint on status vocabulary |
| `return_date` must not precede `borrow_date` | `CONSTRAINT chk_return_after_borrow` |
| `due_date` must be after `borrow_date` | `CONSTRAINT chk_due_after_borrow` |
| `paid_date` cannot be set unless `paid = TRUE` | `CONSTRAINT chk_paid_date` |
| A member cannot have two active reservations on the same book | `CONSTRAINT uq_active_reservation UNIQUE NULLS NOT DISTINCT` |
| ISBN is globally unique | `UNIQUE` constraint on `books.isbn` |
| Overdue fine is created automatically on return | `trg_calculate_fine_on_return` trigger |
| Copy status is kept in sync with borrowing state | `trg_sync_copy_status_on_borrow` trigger |
| Hold queue is advanced when a copy becomes available | `trg_notify_reservation_on_return` trigger |
| `updated_at` is always accurate | `trg_set_updated_at` trigger |
