'use client'

import { useRef, useState } from 'react'
import { CheckCircle2, UserPlus, X } from 'lucide-react'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { TeamMembersList, type TeamMembersListHandle } from './TeamMembersList'
import { NewTeamMemberModal } from './NewTeamMemberModal'
import { EditTeamMemberPanel } from './EditTeamMemberPanel'
import type { TeamMember } from '@/types/team'

type Toast = { message: string }

export function TeamPageClient() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const listRef = useRef<TeamMembersListHandle>(null)

  function showToast(message: string, ms = 5000) {
    setToast({ message })
    setTimeout(() => setToast(null), ms)
  }

  function handleAddSuccess(name: string) {
    listRef.current?.refresh()
    showToast(`${name} has been added to the team`)
  }

  function handleUpdated(updated: TeamMember) {
    listRef.current?.updateMember(updated)
    setSelectedMember(null)
    showToast(`${updated.name}'s details have been updated`)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Team' }]} className="mb-2" />
          <h2 className="font-display text-2xl font-bold text-slate-900">Manage People</h2>
          <p className="mt-1 text-sm text-slate-500">
            Invite team members and manage their platform access.
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {toast && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>{toast.message}</span>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="ml-1 rounded p-0.5 hover:bg-emerald-100"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
          >
            <UserPlus className="h-4 w-4" />
            Invite Member
          </button>
        </div>
      </div>

      <TeamMembersList ref={listRef} onSelect={setSelectedMember} />

      <NewTeamMemberModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {selectedMember && (
        <EditTeamMemberPanel
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  )
}
