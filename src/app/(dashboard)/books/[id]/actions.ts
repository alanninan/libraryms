'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import { requireAuth, requireLibrarian } from '@/lib/auth'

export async function reserveBookAction(formData: FormData) {
  const session = await requireAuth()
  const bookId = parseInt(formData.get('bookId') as string, 10)

  const existing = await sql`
    SELECT reservation_id
    FROM reservations
    WHERE book_id = ${bookId}
      AND user_id = ${session.userId}
      AND status IN ('pending', 'ready')
    LIMIT 1
  `

  if (existing.length > 0) {
    redirect(`/books/${bookId}?error=already_reserved`)
  }

  await sql`
    INSERT INTO reservations (book_id, user_id)
    VALUES (${bookId}, ${session.userId})
  `

  revalidatePath('/books/' + bookId)
  redirect('/reservations')
}

export async function addCopyAction(formData: FormData) {
  await requireLibrarian()
  const bookId = parseInt(formData.get('bookId') as string, 10)

  await sql`
    INSERT INTO book_copies (book_id, copy_number, status, condition)
    VALUES (
      ${bookId},
      (SELECT COALESCE(MAX(copy_number), 0) + 1 FROM book_copies WHERE book_id = ${bookId}),
      'available',
      'new'
    )
  `

  revalidatePath('/books/' + bookId)
}
