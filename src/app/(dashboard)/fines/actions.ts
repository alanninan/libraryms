'use server'

import { revalidatePath } from 'next/cache'
import sql from '@/lib/db'
import { requireLibrarian } from '@/lib/auth'

export async function markFineAsPaidAction(formData: FormData) {
  await requireLibrarian()

  const fineId = formData.get('fineId') as string

  await sql`
    UPDATE fines
    SET paid = TRUE, paid_date = CURRENT_DATE
    WHERE fine_id = ${fineId}
      AND paid = FALSE
  `

  revalidatePath('/fines')
}
