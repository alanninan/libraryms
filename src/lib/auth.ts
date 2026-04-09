import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import sql from './db'
import { SESSION_DURATION_DAYS } from './constants'

export type SessionUser = {
  userId: number
  email: string
  firstName: string
  lastName: string
  role: 'librarian' | 'member'
  membershipType: string
  isActive: boolean
  maxBooks: number
}

// ---------------------------------------------------------------------------
// Session creation (call after verifying credentials)
// ---------------------------------------------------------------------------
export async function createSession(userId: number): Promise<string> {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS)

  const [session] = await sql`
    INSERT INTO sessions (user_id, expires_at)
    VALUES (${userId}, ${expiresAt})
    RETURNING session_id
  `

  const cookieStore = await cookies()
  cookieStore.set('session_id', session.session_id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  })

  return session.session_id
}

// ---------------------------------------------------------------------------
// Session retrieval (validates expiry, returns user or null)
// ---------------------------------------------------------------------------
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('session_id')?.value
  if (!sessionId) return null

  const rows = await sql`
    SELECT
      u.user_id,
      u.email,
      u.first_name,
      u.last_name,
      u.role,
      u.membership_type,
      u.is_active,
      u.max_books
    FROM sessions s
    INNER JOIN users u ON u.user_id = s.user_id
    WHERE s.session_id = ${sessionId}
      AND s.expires_at > NOW()
  `

  if (rows.length === 0) return null

  const row = rows[0]
  return {
    userId: row.user_id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role,
    membershipType: row.membership_type,
    isActive: row.is_active,
    maxBooks: row.max_books,
  }
}

// ---------------------------------------------------------------------------
// Session destruction (logout)
// ---------------------------------------------------------------------------
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('session_id')?.value

  if (sessionId) {
    await sql`DELETE FROM sessions WHERE session_id = ${sessionId}`
  }

  cookieStore.delete('session_id')
}

// ---------------------------------------------------------------------------
// Guards — redirect if not authenticated
// ---------------------------------------------------------------------------
export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!session.isActive) {
    await destroySession()
    redirect('/login?error=inactive')
  }
  return session
}

export async function requireLibrarian(): Promise<SessionUser> {
  const session = await requireAuth()
  if (session.role !== 'librarian') redirect('/')
  return session
}

// ---------------------------------------------------------------------------
// Cleanup expired sessions (call periodically — e.g., in a cron or middleware)
// ---------------------------------------------------------------------------
export async function cleanExpiredSessions(): Promise<void> {
  await sql`DELETE FROM sessions WHERE expires_at < NOW()`
}
