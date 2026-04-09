'use server'

import { revalidatePath } from 'next/cache'
import sql from '@/lib/db'
import { requireLibrarian } from '@/lib/auth'

export async function toggleMemberAction(formData: FormData) {
  await requireLibrarian()

  const userId = formData.get('userId') as string
  const currentStatus = formData.get('currentStatus') as string
  const isActive = JSON.parse(currentStatus) as boolean

  await sql`
    UPDATE users
    SET is_active = ${!isActive}, updated_at = NOW()
    WHERE user_id = ${userId}
  `

  revalidatePath('/members/' + userId)
  revalidatePath('/members')
}
