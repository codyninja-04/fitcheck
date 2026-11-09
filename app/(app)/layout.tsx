import { Header } from '@/components/layout/Header'
import { avatarUrl, displayName, getViewer } from '@/lib/auth'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getViewer()
  return (
    <>
      <Header user={user ? { name: displayName(user), avatar: avatarUrl(user) } : null} />
      <main>{children}</main>
    </>
  )
}
