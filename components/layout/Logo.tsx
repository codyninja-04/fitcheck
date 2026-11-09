import Link from 'next/link'

export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="16" fill="#DB2777" />
      <path d="M20 50V27a12 12 0 0 1 24 0v23z" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="m25.5 36.5 4.5 4.5 8.5-9" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2" aria-label="FitCheck home">
      <LogoMark />
      <span className="font-display text-xl font-bold tracking-tight text-ink">
        Fit<span className="text-primary">Check</span>
      </span>
    </Link>
  )
}
