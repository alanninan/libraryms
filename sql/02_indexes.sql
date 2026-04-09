-- =============================================================================
-- Library Management System - Indexes
-- =============================================================================
-- Demonstrates: B-tree indexes, GIN full-text search, composite indexes,
-- partial indexes (filtered), and strategic FK join indexes.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Full-text search on books
-- ---------------------------------------------------------------------------

-- GIN index enables fast full-text search on title
CREATE INDEX idx_books_title_fts
    ON books USING GIN (to_tsvector('english', title));

-- Exact ISBN lookup
CREATE INDEX idx_books_isbn
    ON books (isbn);

-- ---------------------------------------------------------------------------
-- Author search
-- ---------------------------------------------------------------------------

CREATE INDEX idx_authors_last_name
    ON authors (last_name);

CREATE INDEX idx_authors_full_name
    ON authors (last_name, first_name);

-- ---------------------------------------------------------------------------
-- FK join support (avoids sequential scans on joins)
-- ---------------------------------------------------------------------------

CREATE INDEX idx_books_publisher
    ON books (publisher_id);

CREATE INDEX idx_book_authors_author
    ON book_authors (author_id);

CREATE INDEX idx_book_genres_genre
    ON book_genres (genre_id);

CREATE INDEX idx_book_copies_book
    ON book_copies (book_id);

-- Composite: enables efficient "find available copies for a book" query
CREATE INDEX idx_book_copies_book_status
    ON book_copies (book_id, status);

-- ---------------------------------------------------------------------------
-- Borrowings
-- ---------------------------------------------------------------------------

CREATE INDEX idx_borrowings_user
    ON borrowings (user_id);

CREATE INDEX idx_borrowings_copy
    ON borrowings (copy_id);

-- Partial index: only active/overdue borrowings need fast status lookups
CREATE INDEX idx_borrowings_active
    ON borrowings (user_id, status)
    WHERE status IN ('active', 'overdue');

-- Partial index: due-date checks for overdue detection (only active rows)
CREATE INDEX idx_borrowings_due_date_active
    ON borrowings (due_date)
    WHERE status = 'active';

-- ---------------------------------------------------------------------------
-- Sessions (expiry cleanup + user lookup)
-- ---------------------------------------------------------------------------

CREATE INDEX idx_sessions_expires
    ON sessions (expires_at);

CREATE INDEX idx_sessions_user
    ON sessions (user_id);

-- ---------------------------------------------------------------------------
-- Fines
-- ---------------------------------------------------------------------------

CREATE INDEX idx_fines_user
    ON fines (user_id);

-- Partial index: only unpaid fines are queried frequently
CREATE INDEX idx_fines_unpaid
    ON fines (user_id, amount)
    WHERE paid = FALSE;

CREATE INDEX idx_fines_borrowing
    ON fines (borrowing_id);

-- ---------------------------------------------------------------------------
-- Reservations
-- ---------------------------------------------------------------------------

CREATE INDEX idx_reservations_user
    ON reservations (user_id);

-- Partial index: reservation queue ordered by arrival time (FIFO)
CREATE INDEX idx_reservations_pending_queue
    ON reservations (book_id, reserved_at)
    WHERE status = 'pending';
