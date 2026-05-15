import type { Metadata } from 'next'
import { TeamPageClient } from '@/components/dashboard/TeamPageClient'

export const metadata: Metadata = { title: 'Team' }

export default function TeamPage() {
  return <TeamPageClient />
}
