import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { loginAction } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { BookOpen, AlertCircle } from 'lucide-react'

const ERROR_MESSAGES: Record<string, string> = {
  invalid:  'Invalid email or password.',
  missing:  'Please enter your email and password.',
  inactive: 'Your account has been deactivated. Please contact a librarian.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirect?: string }>
}) {
  const session = await getSession()
  if (session) redirect('/')

  const { error } = await searchParams

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 bg-primary p-12">
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-primary-foreground/70" />
          <span
            className="text-xl font-medium tracking-wide text-primary-foreground"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            LibraryMS
          </span>
        </div>

        <blockquote className="space-y-4">
          <p
            className="text-3xl font-light text-primary-foreground/90 leading-snug"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            &ldquo;A library is not a luxury but one of the necessities of life.&rdquo;
          </p>
          <footer className="text-sm text-primary-foreground/45">
            — Henry Ward Beecher
          </footer>
        </blockquote>

        <p className="text-xs text-primary-foreground/25">
          Library Management System
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-8 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex flex-col items-center gap-2 mb-10 text-center">
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1
            className="text-3xl font-light text-foreground"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            LibraryMS
          </h1>
        </div>

        <div className="w-full max-w-sm">
          <h2
            className="text-3xl font-light text-foreground mb-1"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Welcome back
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Sign in to your account to continue.
          </p>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-6">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{ERROR_MESSAGES[error] ?? 'An error occurred. Please try again.'}</span>
            </div>
          )}

          <form action={loginAction} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
