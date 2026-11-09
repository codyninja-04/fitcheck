'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { TrashIcon } from '../icons'

// Two taps to delete: the first arms the button, the second does it. Gentler
// than a browser confirm dialog and just as hard to hit by accident.
function useArmedDelete(run: () => Promise<void>) {
  const [armed, setArmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function click() {
    if (!armed) {
      setArmed(true)
      setTimeout(() => setArmed(false), 4000)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await run()
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
      setArmed(false)
    }
  }

  return { armed, busy, error, click }
}

async function del(url: string) {
  const res = await fetch(url, { method: 'DELETE' })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || "Couldn't delete. Try again.")
  }
}

export function DeleteCheckButton({ id }: { id: string }) {
  const router = useRouter()
  const { armed, busy, error, click } = useArmedDelete(async () => {
    await del(`/api/checks/${id}`)
    router.replace('/history')
    router.refresh()
  })
  return (
    <div>
      <button type="button" onClick={click} disabled={busy} className={armed ? 'btn-danger' : 'btn-ghost'}>
        <TrashIcon className="h-4 w-4" />
        {busy ? 'Deleting…' : armed ? 'Tap again to delete' : 'Delete'}
      </button>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  )
}

export function ClearHistoryButton({ count }: { count: number }) {
  const router = useRouter()
  const { armed, busy, error, click } = useArmedDelete(async () => {
    await del('/api/checks')
    router.refresh()
  })
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-faint">
        {count} saved {count === 1 ? 'check' : 'checks'}. Photos are private to your account.
      </p>
      <button type="button" onClick={click} disabled={busy} className={armed ? 'btn-danger' : 'btn-quiet'}>
        <TrashIcon className="h-4 w-4" />
        {busy ? 'Clearing…' : armed ? 'Tap again to delete everything' : 'Delete all'}
      </button>
      {error && <p className="w-full text-sm text-danger">{error}</p>}
    </div>
  )
}
