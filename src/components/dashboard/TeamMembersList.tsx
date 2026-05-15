'use client'

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { Users } from 'lucide-react'
import { useApiQuery } from '@/lib/utils/useApiQuery'
import { ErrorState } from '@/components/ui/ErrorState'
import { ROLE_LABELS, type TeamMember } from '@/types/team'

export interface TeamMembersListHandle {
  refresh: () => void
  updateMember: (updated: TeamMember) => void
}

interface Props {
  onSelect: (member: TeamMember) => void
}

const ROLE_BADGE: Record<string, string> = {
  platform_owner: 'bg-purple-50 text-purple-700 border border-purple-200',
  tenant_admin:   'bg-blue-50 text-blue-700 border border-blue-200',
  office_staff:   'bg-violet-50 text-violet-700 border border-violet-200',
  read_only_owner:'bg-slate-100 text-slate-600 border border-slate-200',
}

export const TeamMembersList = forwardRef<TeamMembersListHandle, Props>(
  function TeamMembersList({ onSelect }, ref) {
    const { data, error, loading, retry } = useApiQuery<TeamMember[]>('/api/team')
    const [rows, setRows] = useState<TeamMember[]>([])

    useEffect(() => { if (data) setRows(data) }, [data])

    useImperativeHandle(ref, () => ({
      refresh: retry,
      updateMember(updated: TeamMember) {
        setRows(prev => prev.map(m => m.id === updated.id ? updated : m))
      },
    }), [retry])

    const sorted = [...rows].sort((a, b) => {
      if (a.is_active === b.is_active) return a.name.localeCompare(b.name)
      return a.is_active ? -1 : 1
    })

    if (error) return <ErrorState message={error} onRetry={retry} />

    if (loading) {
      return (
        <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
          <div className="border-b border-border bg-slate-50/60 px-6 py-3">
            <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-border px-6 py-4 last:border-0">
              <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-36 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-52 animate-pulse rounded bg-slate-200" />
              </div>
              <div className="h-5 w-16 animate-pulse rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      )
    }

    if (sorted.length === 0) {
      return (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-white py-16 text-center shadow-sm">
          <Users className="h-10 w-10 text-slate-200" />
          <p className="text-sm font-medium text-slate-500">No team members yet</p>
          <p className="text-xs text-slate-400">Invite your first team member to get started.</p>
        </div>
      )
    }

    const activeCount = sorted.filter(m => m.is_active).length

    return (
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        {/* Table header */}
        <div className="border-b border-border bg-slate-50/60 px-6 py-3">
          <p className="text-sm text-slate-500">
            <span className="font-medium text-slate-700">{activeCount}</span> active
            {sorted.length > activeCount && (
              <> · <span className="text-slate-400">{sorted.length - activeCount} inactive</span></>
            )}
          </p>
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map(member => (
                <tr
                  key={member.id}
                  onClick={() => onSelect(member)}
                  className={`cursor-pointer transition-colors hover:bg-slate-50 ${!member.is_active ? 'opacity-60' : ''}`}
                >
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{member.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-500">{member.email}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE[member.role] ?? ROLE_BADGE.read_only_owner}`}>
                      {ROLE_LABELS[member.role] ?? member.role}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-400">
                    {new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${member.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-xs text-slate-400 hover:text-brand-600">Edit →</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
        <ul className="sm:hidden divide-y divide-border">
          {sorted.map(member => (
            <li key={member.id} className={!member.is_active ? 'opacity-60' : ''}>
              <button
                type="button"
                onClick={() => onSelect(member)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">{member.email}</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[member.role] ?? ROLE_BADGE.read_only_owner}`}>
                  {ROLE_LABELS[member.role] ?? member.role}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }
)
