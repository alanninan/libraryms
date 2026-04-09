'use server'

import { compare } from 'bcryptjs'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import { createSession } from '@/lib/auth'

export async function loginAction(formData: FormData) {
  const email = (formData.get('email') as string | null)?.trim().toLowerCase()
  const password = formData.get('password') as string | null

  if (!email || !password) {
    redirect('/login?error=missing')
  }

  const rows = await sql`
    SELECT user_id, password_hash, is_active
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `

  if (rows.length === 0) {
    redirect('/login?error=invalid')
  }

  const user = rows[0]

  if (!user.is_active) {
    redirect('/login?error=inactive')
  }

  const passwordMatch = await compare(password, user.password_hash)
  if (!passwordMatch) {
    redirect('/login?error=invalid')
  }

  await createSession(user.user_id)
  redirect('/')
}
