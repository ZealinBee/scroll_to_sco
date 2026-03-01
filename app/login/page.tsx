'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'
import { login } from '@/app/auth/actions'

function LoginForm() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/journey'
  const errorParam = searchParams.get('error')

  const [error, setError] = useState<string | null>(
    errorParam === 'auth_callback_error' ? 'Authentication failed. Please try again.' : null
  )
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const result = await login(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="glass p-8 w-full max-w-md space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold text-dark">Welcome back</h1>
        <p className="text-muted">Sign in to continue your journey</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-[12px] text-red-700">
          <AlertCircle size={20} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-dark">
            Email
          </label>
          <div className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              id="email"
              name="email"
              type="email"
              required
              className="input"
              style={{ paddingLeft: '44px' }}
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-dark">
            Password
          </label>
          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              id="password"
              name="password"
              type="password"
              required
              className="input"
              style={{ paddingLeft: '44px' }}
              placeholder="Enter your password"
            />
          </div>
        </div>

        <input type="hidden" name="redirectTo" value={redirectTo} />

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full justify-center"
        >
          {loading ? (
            'Signing in...'
          ) : (
            <>
              Sign in
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-primary hover:underline font-medium">
          Sign up
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-light">
      <Suspense fallback={
        <div className="glass p-8 w-full max-w-md flex items-center justify-center">
          <p className="text-muted">Loading...</p>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
