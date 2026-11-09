import Link from 'next/link'
import { ClockIcon } from '../icons'
import { Logo } from './Logo'

export interface HeaderUser {
  name: string
  avatar: string | null
}

export function Header({ user }: { user: HeaderUser | null }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Logo />
        {user ? (
          <div className="flex items-center gap-1.5">
            <Link href="/history" className="btn-quiet px-3.5">
              <ClockIcon className="h-4 w-4" />
              History
            </Link>
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center rounded-full p-0.5 ring-primary/40 transition hover:ring-2 [&::-webkit-details-marker]:hidden" aria-label="Account">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-soft text-sm font-semibold text-primary-ink">{user.name.charAt(0).toUpperCase()}</span>
                )}
              </summary>
              <div className="absolute right-0 mt-2 w-52 animate-rise-in rounded-2xl border border-line bg-surface p-1.5 shadow-lift">
                <p className="px-3 py-2 text-sm text-muted">
                  Signed in as <span className="font-medium text-ink">{user.name}</span>
                </p>
                <form action="/auth/signout" method="post">
                  <button className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-ink hover:bg-sunk">Sign out</button>
                </form>
              </div>
            </details>
          </div>
        ) : (
          <Link href="/login" className="btn-ghost px-4 py-2">
            Sign in
          </Link>
        )}
      </div>
    </header>
  )
}
