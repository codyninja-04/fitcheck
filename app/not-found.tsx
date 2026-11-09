import Link from 'next/link'
import { LogoMark } from '@/components/layout/Logo'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <LogoMark className="h-12 w-12" />
      <h1 className="heading mt-6 text-3xl">Nothing in this mirror</h1>
      <p className="mt-2 text-muted">That page doesn&apos;t exist, or it was deleted.</p>
      <Link href="/" className="btn-primary mt-7">
        Check an outfit
      </Link>
    </main>
  )
}
