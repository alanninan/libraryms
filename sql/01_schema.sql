-- =============================================================================
-- Library Management System - Schema (DDL)
-- Database Management Systems Course Project
-- =============================================================================
-- Tables are created in dependency order (referenced before referencing).
-- Demonstrates: 3NF normalization, PK/FK constraints, CHECK constraints,
-- UNIQUE constraints, NOT NULL, DEFAULT values, CASCADE actions.
-- =============================================================================

-- Enable pgcrypto for gen_random_uuid() on older Postgres versions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- LOOKUP / REFERENCE TABLES
-- =============================================================================

CREATE TABLE genres (
    genre_id    SERIAL          PRIMARY KEY,
    name        VARCHAR(50)     NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE publishers (
    publisher_id SERIAL          PRIMARY KEY,
    name         VARCHAR(200)    NOT NULL UNIQUE,
    address      TEXT,
    phone        VARCHAR(20),
    email        VARCHAR(100)
);

CREATE TABLE authors (
    author_id   SERIAL          PRIMARY KEY,
    first_name  VARCHAR(100)    NOT NULL,
    last_name   VARCHAR(100)    NOT NULL,
    bio         TEXT,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- BOOKS (title-level record; individual copies tracked in book_copies)
-- =============================================================================

CREATE TABLE books (
    book_id          SERIAL          PRIMARY KEY,
    title            VARCHAR(300)    NOT NULL,
    isbn             VARCHAR(13)     NOT NULL UNIQUE,
    publication_year SMALLINT        CHECK (publication_year > 0 AND publication_year <= EXTRACT(YEAR FROM NOW())::SMALLINT + 1),
    edition          VARCHAR(50),
    summary          TEXT,
    publisher_id     INTEGER         REFERENCES publishers(publisher_id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Many-to-many: a book can have multiple authors; an author can write multiple books
CREATE TABLE book_authors (
    book_id    INTEGER NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
    author_id  INTEGER NOT NULL REFERENCES authors(author_id) ON DELETE CASCADE,
    PRIMARY KEY (book_id, author_id)
);

-- Many-to-many: a book can belong to multiple genres
CREATE TABLE book_genres (
    book_id   INTEGER NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
    genre_id  INTEGER NOT NULL REFERENCES genres(genre_id) ON DELETE CASCADE,
    PRIMARY KEY (book_id, genre_id)
);

-- Individual physical copies of a book title
CREATE TABLE book_copies (
    copy_id       SERIAL      PRIMARY KEY,
    book_id       INTEGER     NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
    copy_number   SMALLINT    NOT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'available'
                  CHECK (status IN ('available', 'borrowed', 'reserved', 'maintenance', 'lost')),
    acquired_date DATE        NOT NULL DEFAULT CURRENT_DATE,
    condition     VARCHAR(20) NOT NULL DEFAULT 'good'
                  CHECK (condition IN ('new', 'good', 'fair', 'poor', 'damaged')),
    UNIQUE (book_id, copy_number)
);

-- =============================================================================
-- USERS (both librarians and members share this table, discriminated by role)
-- =============================================================================

CREATE TABLE users (
    user_id         SERIAL          PRIMARY KEY,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    password_hash   VARCHAR(255)    NOT NULL,
    first_name      VARCHAR(100)    NOT NULL,
    last_name       VARCHAR(100)    NOT NULL,
    role            VARCHAR(20)     NOT NULL DEFAULT 'member'
                    CHECK (role IN ('librarian', 'member')),
    membership_type VARCHAR(20)     NOT NULL DEFAULT 'standard'
                    CHECK (membership_type IN ('standard', 'premium', 'student')),
    phone           VARCHAR(20),
    address         TEXT,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    max_books       SMALLINT        NOT NULL DEFAULT 3
                    CHECK (max_books >= 1 AND max_books <= 10),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- SESSIONS (database-backed cookie sessions)
-- =============================================================================

CREATE TABLE sessions (
    session_id  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     INTEGER         NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    expires_at  TIMESTAMPTZ     NOT NULL,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- BORROWINGS (tracks which copy was borrowed by which member)
-- =============================================================================

CREATE TABLE borrowings (
    borrowing_id  SERIAL      PRIMARY KEY,
    copy_id       INTEGER     NOT NULL REFERENCES book_copies(copy_id),
    user_id       INTEGER     NOT NULL REFERENCES users(user_id),
    borrow_date   DATE        NOT NULL DEFAULT CURRENT_DATE,
    due_date      DATE        NOT NULL,
    return_date   DATE,
    status        VARCHAR(20) NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'returned', 'overdue', 'lost')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_return_after_borrow
        CHECK (return_date IS NULL OR return_date >= borrow_date),
    CONSTRAINT chk_due_after_borrow
        CHECK (due_date > borrow_date)
);

-- =============================================================================
-- FINES (monetary penalties; created automatically by trigger on return)
-- =============================================================================

CREATE TABLE fines (
    fine_id      SERIAL          PRIMARY KEY,
    borrowing_id INTEGER         NOT NULL REFERENCES borrowings(borrowing_id),
    user_id      INTEGER         NOT NULL REFERENCES users(user_id),
    amount       NUMERIC(10,2)   NOT NULL CHECK (amount > 0),
    reason       VARCHAR(20)     NOT NULL DEFAULT 'overdue'
                 CHECK (reason IN ('overdue', 'damage', 'lost')),
    paid         BOOLEAN         NOT NULL DEFAULT FALSE,
    paid_date    DATE,
    created_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_paid_date CHECK (paid_date IS NULL OR paid = TRUE)
);

-- =============================================================================
-- RESERVATIONS (hold queue when all copies are borrowed)
-- =============================================================================

CREATE TABLE reservations (
    reservation_id  SERIAL          PRIMARY KEY,
    book_id         INTEGER         NOT NULL REFERENCES books(book_id),
    user_id         INTEGER         NOT NULL REFERENCES users(user_id),
    status          VARCHAR(20)     NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'ready', 'fulfilled', 'cancelled', 'expired')),
    reserved_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    notified_at     TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    -- Prevent a member from having two active (pending/ready) reservations for the same book
    CONSTRAINT uq_active_reservation UNIQUE NULLS NOT DISTINCT (book_id, user_id, status)
);
