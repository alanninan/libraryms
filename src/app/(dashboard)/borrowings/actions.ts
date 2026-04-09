'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import { requireLibrarian } from '@/lib/auth'
import { LOAN_DURATION_DAYS, MAX_UNPAID_FINE } from '@/lib/constants'

export async function returnBookAction(formData: FormData) {
  await requireLibrarian()

  const borrowingId = formData.get('borrowingId') as string

  const [borrowing] = await sql`
    SELECT borrowing_id, copy_id, user_id, due_date
    FROM borrowings
    WHERE borrowing_id = ${borrowingId} AND status IN ('active','overdue')
  `

  if (!borrowing) return

  const copyId = borrowing.copy_id
  const userId = borrowing.user_id

  await sql`
    UPDATE borrowings
    SET status = 'returned', return_date = CURRENT_DATE
    WHERE borrowing_id = ${borrowingId}
  `

  await sql`
    UPDATE book_copies
    SET status = 'available'
    WHERE copy_id = ${copyId}
  `

  const dueDate = new Date(borrowing.due_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / 86400000))
  if (daysOverdue > 0) {
    await sql`
      INSERT INTO fines (borrowing_id, user_id, amount, reason)
      VALUES (${borrowingId}, ${userId}, ${daysOverdue * 0.5}, 'overdue')
    `
  }

  await sql`
    UPDATE reservations
    SET status = 'ready',
        notified_at = NOW(),
        expires_at = NOW() + INTERVAL '2 days'
    WHERE reservation_id = (
      SELECT reservation_id
      FROM reservations
      WHERE book_id = (SELECT book_id FROM book_copies WHERE copy_id = ${copyId})
        AND status = 'pending'
      ORDER BY reserved_at ASC
      LIMIT 1
    )
  `

  revalidatePath('/borrowings')
}

export async function borrowBookAction(formData: FormData) {
  await requireLibrarian()

  const copyId = formData.get('copyId') as string
  const userId = formData.get('userId') as string

  const [copy] = await sql`
    SELECT status FROM book_copies WHERE copy_id = ${copyId}
  `

  if (!copy || copy.status !== 'available') {
    redirect('/borrowings/new?error=unavailable')
  }

  const [user] = await sql`
    SELECT is_active, max_books,
           (SELECT COUNT(*) FROM borrowings WHERE user_id = u.user_id AND status IN ('active','overdue')) AS active_count,
           (SELECT COALESCE(SUM(amount), 0) FROM fines WHERE user_id = u.user_id AND paid = FALSE) AS unpaid_fines
    FROM users u
    WHERE user_id = ${userId}
  `

  if (!user || !user.is_active) {
    redirect('/borrowings/new?error=inactive')
  }

  if (Number(user.active_count) >= Number(user.max_books)) {
    redirect('/borrowings/new?error=limit')
  }

  if (Number(user.unpaid_fines) > MAX_UNPAID_FINE) {
    redirect('/borrowings/new?error=fines')
  }

  await sql`
    INSERT INTO borrowings (copy_id, user_id, due_date)
    VALUES (${copyId}, ${userId}, CURRENT_DATE + ${LOAN_DURATION_DAYS}::int)
  `

  await sql`
    UPDATE book_copies SET status = 'borrowed' WHERE copy_id = ${copyId}
  `

  revalidatePath('/borrowings')
  redirect('/borrowings')
}
