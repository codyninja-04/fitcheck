import type { Metadata } from 'next'
import { Suspense } from 'react'
import { GoogleAuth } from '@/components/layout/GoogleAuth'

export const metadata: Metadata = { title: 'Sign in' }

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <Suspense>
        <GoogleAuth />
      </Suspense>
    </main>
  )
}
