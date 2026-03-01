'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Lock, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react'
import { signup } from '@/app/auth/actions'

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    setSuccess(null)

    const result = await signup(formData)

    if (result?.error) {
      setError(result.error)
    } else if (result?.success) {
      setSuccess(result.success)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-light">
      <div className="glass p-8 w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-dark">Create account</h1>
          <p className="text-muted">Start your scoliosis management journey</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-[12px] text-red-700">
            <AlertCircle size={20} />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-[12px] text-green-700">
            <CheckCircle size={20} />
            <p className="text-sm">{success}</p>
          </div>
        )}

        {!success && (
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
                  minLength={6}
                  className="input"
                  style={{ paddingLeft: '44px' }}
                  placeholder="At least 6 characters"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full justify-center"
            >
              {loading ? (
                'Creating account...'
              ) : (
                <>
                  Create account
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
