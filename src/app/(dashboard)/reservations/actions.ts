'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function cancelReservationAction(formData: FormData) {
  const session = await requireAuth()
  const reservationId = formData.get('reservationId') as string

  if (session.role === 'member') {
    const [row] = await sql`
      SELECT user_id FROM reservations WHERE reservation_id = ${reservationId}
    `
    if (!row || row.user_id !== session.userId) {
      redirect('/reservations')
    }
  }

  await sql`
    UPDATE reservations
    SET status = 'cancelled'
    WHERE reservation_id = ${reservationId}
      AND status IN ('pending', 'ready')
  `

  revalidatePath('/reservations')
}
