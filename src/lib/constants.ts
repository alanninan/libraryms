// Fine calculation
export const FINE_RATE_PER_DAY = 0.5 // $0.50 per day overdue

// Borrowing rules
export const LOAN_DURATION_DAYS = 14

// Maximum books per membership type
export const MAX_BOOKS_BY_MEMBERSHIP: Record<string, number> = {
  standard: 3,
  premium: 6,
  student: 2,
}

// Fine threshold above which borrowing is blocked
export const MAX_UNPAID_FINE = 10.0

// Reservation expiry after notification (days)
export const RESERVATION_EXPIRY_DAYS = 2

// Session duration
export const SESSION_DURATION_DAYS = 7
