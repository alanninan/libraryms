-- =============================================================================
-- Library Management System - Seed Data
-- =============================================================================
-- Run AFTER 01_schema.sql, 02_indexes.sql, 03_views.sql, 04_functions_triggers.sql
-- Passwords: librarian123 | member123
-- =============================================================================

-- ---------------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------------
INSERT INTO users (email, password_hash, first_name, last_name, role, membership_type, phone, address, max_books) VALUES
-- Librarians
('admin@library.com',  '$2b$12$e84WlR4bKg8jYYC/wfDFOe6p8tlUpuFYHTfTSuixLY8YTJ6eAwXMi', 'Alice',   'Morgan',   'librarian', 'standard', '555-0100', '1 Library Lane',        3),
('staff@library.com',  '$2b$12$e84WlR4bKg8jYYC/wfDFOe6p8tlUpuFYHTfTSuixLY8YTJ6eAwXMi', 'Bob',     'Chen',     'librarian', 'standard', '555-0101', '2 Library Lane',        3),
-- Members
('john.doe@email.com', '$2b$12$jE33N6kACcMPxNf4urqVb.S1sA0edWJMHofMzYiY9QjuN8.G2bZyi', 'John',    'Doe',      'member',    'standard', '555-0102', '10 Main St',            3),
('jane.smith@email.com','$2b$12$jE33N6kACcMPxNf4urqVb.S1sA0edWJMHofMzYiY9QjuN8.G2bZyi','Jane',    'Smith',    'member',    'premium',  '555-0103', '22 Oak Ave',            6),
('peter.pan@email.com','$2b$12$jE33N6kACcMPxNf4urqVb.S1sA0edWJMHofMzYiY9QjuN8.G2bZyi', 'Peter',   'Pan',      'member',    'student',  '555-0104', '3 Neverland Rd',        2),
('mary.jones@email.com','$2b$12$jE33N6kACcMPxNf4urqVb.S1sA0edWJMHofMzYiY9QjuN8.G2bZyi','Mary',    'Jones',    'member',    'standard', '555-0105', '45 Elm St',             3),
('carlos.r@email.com', '$2b$12$jE33N6kACcMPxNf4urqVb.S1sA0edWJMHofMzYiY9QjuN8.G2bZyi', 'Carlos',  'Rivera',   'member',    'premium',  '555-0106', '78 Cedar Blvd',         6),
('anna.k@email.com',   '$2b$12$jE33N6kACcMPxNf4urqVb.S1sA0edWJMHofMzYiY9QjuN8.G2bZyi', 'Anna',    'Kim',      'member',    'student',  '555-0107', '5 Maple Dr',            2),
('tom.w@email.com',    '$2b$12$jE33N6kACcMPxNf4urqVb.S1sA0edWJMHofMzYiY9QjuN8.G2bZyi', 'Tom',     'Wilson',   'member',    'standard', '555-0108', '99 Pine St',            3),
('sara.l@email.com',   '$2b$12$jE33N6kACcMPxNf4urqVb.S1sA0edWJMHofMzYiY9QjuN8.G2bZyi', 'Sara',    'Lee',      'member',    'premium',  '555-0109', '12 Birch Ln',           6),
('mike.t@email.com',   '$2b$12$jE33N6kACcMPxNf4urqVb.S1sA0edWJMHofMzYiY9QjuN8.G2bZyi', 'Mike',    'Taylor',   'member',    'standard', '555-0110', '33 Walnut Ave',         3),
('lisa.h@email.com',   '$2b$12$jE33N6kACcMPxNf4urqVb.S1sA0edWJMHofMzYiY9QjuN8.G2bZyi', 'Lisa',    'Harris',   'member',    'student',  '555-0111', '6 Spruce Ct',           2);

-- ---------------------------------------------------------------------------
-- GENRES
-- ---------------------------------------------------------------------------
INSERT INTO genres (name, description) VALUES
('Fiction',        'Novels and stories from imagination'),
('Non-Fiction',    'Factual books and biographies'),
('Science',        'Natural and formal sciences'),
('Technology',     'Computing, engineering, and tech'),
('History',        'Historical accounts and analysis'),
('Philosophy',     'Ethics, logic, and metaphysics'),
('Mystery',        'Crime and detective fiction'),
('Fantasy',        'Magic and mythical worlds'),
('Science Fiction','Speculative fiction with science themes'),
('Self-Help',      'Personal development and motivation'),
('Biography',      'Life stories of notable people'),
('Classic',        'Timeless literary works');

-- ---------------------------------------------------------------------------
-- PUBLISHERS
-- ---------------------------------------------------------------------------
INSERT INTO publishers (name, address, phone, email) VALUES
('Penguin Random House', '1745 Broadway, New York, NY', '212-782-9000', 'info@penguinrandomhouse.com'),
('HarperCollins',        '195 Broadway, New York, NY',  '212-207-7000', 'info@harpercollins.com'),
('Simon & Schuster',     '1230 Avenue of the Americas, NY', '212-698-7000', 'info@simonandschuster.com'),
('Oxford University Press','Great Clarendon Street, Oxford', '+44-1865-556767', 'info@oup.com'),
('MIT Press',            '1 Rogers Street, Cambridge, MA',  '617-253-5235', 'info@mitpress.mit.edu'),
('Tor Books',            '120 Broadway, New York, NY',   '212-388-0100', 'info@tor.com'),
('Vintage Books',        '1745 Broadway, New York, NY',  '212-782-9000', 'vintage@penguinrandomhouse.com');

-- ---------------------------------------------------------------------------
-- AUTHORS
-- ---------------------------------------------------------------------------
INSERT INTO authors (first_name, last_name, bio) VALUES
('George',      'Orwell',       'English novelist known for political commentary. Author of 1984 and Animal Farm.'),
('J.R.R.',      'Tolkien',      'English author, philologist, and professor. Creator of Middle-earth.'),
('Yuval Noah',  'Harari',       'Israeli historian and author of the Sapiens trilogy.'),
('Frank',       'Herbert',      'American science fiction author best known for Dune.'),
('Agatha',      'Christie',     'English mystery writer, best-selling fiction writer of all time.'),
('J.K.',        'Rowling',      'British author of the Harry Potter fantasy series.'),
('Gabriel',     'García Márquez','Colombian novelist, Nobel Prize laureate. Father of magical realism.'),
('Fyodor',      'Dostoevsky',   'Russian novelist, widely regarded as one of the greatest writers ever.'),
('Ursula K.',   'Le Guin',      'American author of science fiction and fantasy. Known for Earthsea and The Left Hand of Darkness.'),
('Douglas',     'Adams',        'English author and humourist. Author of The Hitchhiker''s Guide to the Galaxy.'),
('Isaac',       'Asimov',       'American author and biochemistry professor. Master of science fiction.'),
('Toni',        'Morrison',     'American novelist and Nobel Prize laureate. Author of Beloved.'),
('Thomas',      'Kuhn',         'American physicist and philosopher. Wrote The Structure of Scientific Revolutions.'),
('Donald',      'Knuth',        'American mathematician and computer scientist. Author of The Art of Computer Programming.'),
('C.S.',        'Lewis',        'British author and theologian. Author of The Chronicles of Narnia.');

-- ---------------------------------------------------------------------------
-- BOOKS
-- ---------------------------------------------------------------------------
INSERT INTO books (title, isbn, publication_year, edition, summary, publisher_id) VALUES
('1984',                            '9780451524935', 1949, '1st',  'Dystopian novel about a totalitarian society.',                            1),
('Animal Farm',                     '9780451526342', 1945, '1st',  'Allegorical novella about a farm animal rebellion.',                       1),
('The Lord of the Rings',           '9780544003415', 1954, '50th', 'Epic fantasy trilogy set in Middle-earth.',                                2),
('The Hobbit',                      '9780547928227', 1937, '75th', 'A hobbit''s journey to reclaim a dragon''s treasure.',                     2),
('Sapiens: A Brief History',        '9780062316097', 2011, '1st',  'Survey of the history of humankind.',                                      2),
('Homo Deus',                       '9780062464316', 2015, '1st',  'A brief history of tomorrow.',                                             2),
('Dune',                            '9780441013593', 1965, '1st',  'Epic science fiction novel set in a desert world.',                        1),
('Murder on the Orient Express',    '9780062693662', 1934, '1st',  'Hercule Poirot investigates a murder on a luxury train.',                  2),
('And Then There Were None',        '9780062073488', 1939, '1st',  'Ten strangers are lured to an island and begin to die one by one.',        2),
('Harry Potter and the Sorcerer''s Stone','9780439708180',1997,'1st','A boy discovers he is a famous wizard.',                                 3),
('One Hundred Years of Solitude',   '9780060883287', 1967, '1st',  'Multi-generational story of the Buendía family.',                          2),
('Crime and Punishment',            '9780486454115', 1866, '1st',  'A student commits a crime and struggles with guilt.',                      1),
('The Left Hand of Darkness',       '9780441478125', 1969, '1st',  'A human envoy visits an alien world without gender.',                      1),
('The Hitchhiker''s Guide to the Galaxy','9780345391803',1979,'1st','Comic science fiction following Arthur Dent through space.',              1),
('Foundation',                      '9780553293357', 1951, '1st',  'A mathematician predicts the fall of galactic civilization.',              1),
('Beloved',                         '9781400033416', 1987, '1st',  'A former enslaved woman is haunted by the ghost of her baby daughter.',    1),
('The Structure of Scientific Revolutions','9780226458120',1962,'4th','How scientific revolutions happen.',                                   4),
('The Art of Computer Programming Vol.1','9780201896831',1968,'3rd','Fundamental algorithms for computer science.',                            5),
('The Chronicles of Narnia',        '9780066238500', 1950, '1st',  'Seven fantasy novels set in the world of Narnia.',                         2),
('21 Lessons for the 21st Century', '9780525512172', 2018, '1st',  'An exploration of today''s most urgent issues.',                           1),
('Dune Messiah',                    '9780593099148', 1969, '1st',  'The sequel to Dune, following Paul Atreides as ruler.',                    1),
('The Silmarillion',                '9780547928197', 1977, '1st',  'The myths and legends of the First Age of Middle-earth.',                  2),
('The Robots of Dawn',              '9780553299496', 1983, '1st',  'Elijah Baley investigates a roboticide on Aurora.',                        1),
('Atomic Habits',                   '9780735211292', 2018, '1st',  'A practical guide to building good habits and breaking bad ones.',         3);

-- ---------------------------------------------------------------------------
-- BOOK_AUTHORS (many-to-many)
-- ---------------------------------------------------------------------------
INSERT INTO book_authors (book_id, author_id) VALUES
(1,  1),  -- 1984 -> Orwell
(2,  1),  -- Animal Farm -> Orwell
(3,  2),  -- LOTR -> Tolkien
(4,  2),  -- Hobbit -> Tolkien
(5,  3),  -- Sapiens -> Harari
(6,  3),  -- Homo Deus -> Harari
(7,  4),  -- Dune -> Herbert
(8,  5),  -- Murder -> Christie
(9,  5),  -- And Then -> Christie
(10, 6),  -- HP -> Rowling
(11, 7),  -- 100 Years -> García Márquez
(12, 8),  -- Crime -> Dostoevsky
(13, 9),  -- Left Hand -> Le Guin
(14, 10), -- Hitchhiker -> Adams
(15, 11), -- Foundation -> Asimov
(16, 12), -- Beloved -> Morrison
(17, 13), -- Scientific Revolutions -> Kuhn
(18, 14), -- Art of Computer Programming -> Knuth
(19, 15), -- Narnia -> Lewis
(20, 3),  -- 21 Lessons -> Harari
(21, 4),  -- Dune Messiah -> Herbert
(22, 2),  -- Silmarillion -> Tolkien
(23, 11), -- Robots of Dawn -> Asimov
(24, 1);  -- Atomic Habits -> author placeholder (assign to Orwell as placeholder)
-- Note: Atomic Habits is by James Clear; using placeholder author for demo

-- Fix author for Atomic Habits (book_id=24)
-- Insert James Clear as author
INSERT INTO authors (first_name, last_name, bio) VALUES
('James', 'Clear', 'American author and speaker known for Atomic Habits.');
-- Re-assign book_authors for Atomic Habits
DELETE FROM book_authors WHERE book_id = 24 AND author_id = 1;
INSERT INTO book_authors (book_id, author_id) VALUES (24, 16);

-- ---------------------------------------------------------------------------
-- BOOK_GENRES
-- ---------------------------------------------------------------------------
INSERT INTO book_genres (book_id, genre_id) VALUES
(1,  1), (1,  9),  -- 1984: Fiction, Sci-Fi
(2,  1),           -- Animal Farm: Fiction
(3,  8), (3,  1),  -- LOTR: Fantasy, Fiction
(4,  8), (4,  1),  -- Hobbit: Fantasy, Fiction
(5,  2), (5,  5),  -- Sapiens: Non-Fiction, History
(6,  2), (6,  9),  -- Homo Deus: Non-Fiction, Sci-Fi
(7,  9), (7,  1),  -- Dune: Sci-Fi, Fiction
(8,  7), (8,  1),  -- Murder: Mystery, Fiction
(9,  7), (9,  1),  -- And Then: Mystery, Fiction
(10, 8), (10, 1),  -- HP: Fantasy, Fiction
(11, 1), (11, 12), -- 100 Years: Fiction, Classic
(12, 1), (12, 12), -- Crime: Fiction, Classic
(13, 9), (13, 1),  -- Left Hand: Sci-Fi, Fiction
(14, 9), (14, 1),  -- Hitchhiker: Sci-Fi, Fiction
(15, 9), (15, 1),  -- Foundation: Sci-Fi, Fiction
(16, 1), (16, 12), -- Beloved: Fiction, Classic
(17, 2), (17, 6),  -- Scientific Rev: Non-Fiction, Philosophy
(18, 4), (18, 2),  -- Art of CS: Technology, Non-Fiction
(19, 8), (19, 1),  -- Narnia: Fantasy, Fiction
(20, 2),           -- 21 Lessons: Non-Fiction
(21, 9), (21, 1),  -- Dune Messiah: Sci-Fi, Fiction
(22, 8), (22, 1),  -- Silmarillion: Fantasy, Fiction
(23, 9), (23, 1),  -- Robots of Dawn: Sci-Fi, Fiction
(24, 2), (24, 10); -- Atomic Habits: Non-Fiction, Self-Help

-- ---------------------------------------------------------------------------
-- BOOK COPIES
-- ---------------------------------------------------------------------------
-- Each book gets 2–3 copies
INSERT INTO book_copies (book_id, copy_number, status, condition) VALUES
(1, 1, 'available', 'good'), (1, 2, 'borrowed',  'fair'), (1, 3, 'available', 'good'),
(2, 1, 'available', 'good'), (2, 2, 'available', 'good'),
(3, 1, 'available', 'good'), (3, 2, 'borrowed',  'good'), (3, 3, 'available', 'new'),
(4, 1, 'borrowed',  'good'), (4, 2, 'available', 'fair'),
(5, 1, 'available', 'new'),  (5, 2, 'available', 'good'), (5, 3, 'borrowed',  'good'),
(6, 1, 'available', 'good'), (6, 2, 'available', 'good'),
(7, 1, 'borrowed',  'good'), (7, 2, 'available', 'good'), (7, 3, 'available', 'new'),
(8, 1, 'available', 'good'), (8, 2, 'available', 'fair'),
(9, 1, 'available', 'good'), (9, 2, 'borrowed',  'good'),
(10,1, 'available', 'new'),  (10,2, 'available', 'good'), (10,3, 'borrowed',  'fair'),
(11,1, 'borrowed',  'good'), (11,2, 'available', 'good'),
(12,1, 'borrowed',  'fair'), (12,2, 'available', 'good'),
(13,1, 'available', 'good'), (13,2, 'borrowed',  'good'),
(14,1, 'available', 'good'), (14,2, 'available', 'new'),  (14,3, 'available', 'good'),
(15,1, 'borrowed',  'good'), (15,2, 'available', 'good'),
(16,1, 'available', 'good'), (16,2, 'available', 'fair'),
(17,1, 'available', 'good'), (17,2, 'available', 'good'),
(18,1, 'borrowed',  'good'), (18,2, 'available', 'good'),
(19,1, 'available', 'good'), (19,2, 'borrowed',  'good'), (19,3, 'available', 'new'),
(20,1, 'borrowed',  'good'), (20,2, 'available', 'good'),
(21,1, 'available', 'good'), (21,2, 'available', 'good'),
(22,1, 'borrowed',  'good'), (22,2, 'available', 'good'),
(23,1, 'available', 'good'), (23,2, 'available', 'good'),
(24,1, 'available', 'new'),  (24,2, 'available', 'good');

-- ---------------------------------------------------------------------------
-- BORROWINGS (mix of returned, active, and overdue)
-- ---------------------------------------------------------------------------
-- Returned borrowings (historical)
INSERT INTO borrowings (copy_id, user_id, borrow_date, due_date, return_date, status) VALUES
-- John Doe
(1,  3, CURRENT_DATE - 60, CURRENT_DATE - 46, CURRENT_DATE - 50, 'returned'),
(5,  3, CURRENT_DATE - 45, CURRENT_DATE - 31, CURRENT_DATE - 35, 'returned'),
(8,  3, CURRENT_DATE - 30, CURRENT_DATE - 16, CURRENT_DATE - 18, 'returned'),
-- Jane Smith
(12, 4, CURRENT_DATE - 90, CURRENT_DATE - 76, CURRENT_DATE - 80, 'returned'),
(14, 4, CURRENT_DATE - 70, CURRENT_DATE - 56, CURRENT_DATE - 60, 'returned'),
(17, 4, CURRENT_DATE - 40, CURRENT_DATE - 26, CURRENT_DATE - 28, 'returned'),
-- Peter Pan
(21, 5, CURRENT_DATE - 50, CURRENT_DATE - 36, CURRENT_DATE - 38, 'returned'),
-- Mary Jones
(24, 6, CURRENT_DATE - 25, CURRENT_DATE - 11, CURRENT_DATE - 12, 'returned'),
-- Carlos Rivera
(33, 7, CURRENT_DATE - 100,CURRENT_DATE - 86, CURRENT_DATE - 88, 'returned'),
(37, 7, CURRENT_DATE - 80, CURRENT_DATE - 66, CURRENT_DATE - 68, 'returned'),
-- Anna Kim
(41, 8, CURRENT_DATE - 35, CURRENT_DATE - 21, CURRENT_DATE - 23, 'returned');

-- Active borrowings (within due date)
INSERT INTO borrowings (copy_id, user_id, borrow_date, due_date, status) VALUES
-- copy_id values that have status='borrowed' set above
(7,  4, CURRENT_DATE - 5,  CURRENT_DATE + 9,  'active'),  -- LOTR copy2 -> Jane
(9,  3, CURRENT_DATE - 3,  CURRENT_DATE + 11, 'active'),  -- Hobbit copy1 -> John
(13, 7, CURRENT_DATE - 7,  CURRENT_DATE + 7,  'active'),  -- Sapiens copy3 -> Carlos
(16, 5, CURRENT_DATE - 2,  CURRENT_DATE + 12, 'active'),  -- Dune copy1 -> Peter
(22, 6, CURRENT_DATE - 6,  CURRENT_DATE + 8,  'active'),  -- HP copy3 -> Mary
(26, 8, CURRENT_DATE - 4,  CURRENT_DATE + 10, 'active'),  -- 100 Years copy1 -> Anna
(32, 9, CURRENT_DATE - 8,  CURRENT_DATE + 6,  'active'),  -- Left Hand copy2 -> Tom
(36, 10, CURRENT_DATE - 1, CURRENT_DATE + 13, 'active'), -- Foundation copy1 -> Sara
(42, 11, CURRENT_DATE - 9, CURRENT_DATE + 5,  'active'),  -- Art of CS copy1 -> Mike
(44, 7, CURRENT_DATE - 3,  CURRENT_DATE + 11, 'active');  -- Narnia copy2 -> Carlos

-- Overdue borrowings (past due date, not returned)
INSERT INTO borrowings (copy_id, user_id, borrow_date, due_date, status) VALUES
(2,  6, CURRENT_DATE - 25, CURRENT_DATE - 11, 'overdue'), -- 1984 copy2 -> Mary
(28, 9, CURRENT_DATE - 20, CURRENT_DATE - 6,  'overdue'), -- Foundation copy...
(46, 11,CURRENT_DATE - 30, CURRENT_DATE - 16, 'overdue'); -- Dune Messiah copy1 -> Mike

-- ---------------------------------------------------------------------------
-- FINES (for returned overdue books and open overdue borrowings)
-- ---------------------------------------------------------------------------
INSERT INTO fines (borrowing_id, user_id, amount, reason, paid, paid_date) VALUES
-- Paid fines (historical returned borrowings that were slightly late)
(4,  4, 2.00, 'overdue', TRUE,  CURRENT_DATE - 26),  -- Jane was 2 days late → $1/day
(10, 7, 3.50, 'overdue', TRUE,  CURRENT_DATE - 85),  -- Carlos late on history book
(11, 8, 1.00, 'overdue', TRUE,  CURRENT_DATE - 21),  -- Anna 2 days late
-- Unpaid fines for current overdue borrowings (borrowing IDs 22/23/24 = overdue block)
(22, 6, 5.50, 'overdue', FALSE, NULL),  -- Mary overdue 11 days ($0.50 × 11)
(23, 9, 3.00, 'overdue', FALSE, NULL),  -- Tom overdue 6 days
(24, 11,8.00, 'overdue', FALSE, NULL);  -- Mike overdue 16 days

-- ---------------------------------------------------------------------------
-- RESERVATIONS
-- ---------------------------------------------------------------------------
INSERT INTO reservations (book_id, user_id, status, reserved_at) VALUES
(3,  11, 'pending',   NOW() - INTERVAL '2 days'),   -- Mike wants LOTR (all copies out)
(7,  12, 'pending',   NOW() - INTERVAL '1 day'),    -- Lisa wants Dune
(10, 9,  'pending',   NOW() - INTERVAL '3 hours'),  -- Tom wants HP
(4,  6,  'pending',   NOW() - INTERVAL '5 hours'),  -- Mary wants Hobbit (copy1 borrowed)
(15, 8,  'fulfilled', NOW() - INTERVAL '10 days');  -- Anna's previous reservation fulfilled
