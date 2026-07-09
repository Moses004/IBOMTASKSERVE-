import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getIdDocumentSignedUrl } from '../../lib/storage'
import type { VerificationStatus } from '../../lib/types'

interface PendingTasker {
  id: string
  full_name: string
  bio: string | null
  years_experience: number
  verification_status: VerificationStatus
  document_path: string | null
}

export default function AdminVerifications() {
  const [taskers, setTaskers] = useState<PendingTasker[]>([])
  const [loading, setLoading] = useState(true)
  const [actingOn, setActingOn] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [reasonDraft, setReasonDraft] = useState('')

  async function load() {
    setLoading(true)
    const { data: profiles } = await supabase
      .from('tasker_profiles')
      .select('id, bio, years_experience, verification_status, profiles(full_name)')
      .eq('verification_status', 'pending')

    const { data: docs } = await supabase.from('tasker_documents').select('tasker_id, id_document_path')

    const docMap = new Map((docs ?? []).map((d) => [d.tasker_id, d.id_document_path]))

    setTaskers(
      (profiles ?? []).map((p: any) => ({
        id: p.id,
        full_name: p.profiles?.full_name ?? 'Unknown',
        bio: p.bio,
        years_experience: p.years_experience,
        verification_status: p.verification_status,
        document_path: docMap.get(p.id) ?? null,
      }))
    )
    setLoading(false)
  }

  async function viewDocument(path: string) {
    try {
      const url = await getIdDocumentSignedUrl(path)
      window.open(url, '_blank')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not open document.')
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function decide(taskerId: string, status: Extract<VerificationStatus, 'verified' | 'rejected'>, reason?: string) {
    setActingOn(taskerId)
    const { error } = await supabase.rpc('admin_set_tasker_verification', {
      target_tasker_id: taskerId,
      new_status: status,
      reason: reason ?? null,
    })
    setActingOn(null)
    if (error) {
      alert(error.message)
      return
    }
    setRejectingId(null)
    setReasonDraft('')
    setTaskers((prev) => prev.filter((t) => t.id !== taskerId))
  }

  return (
    <div>
      <div className="font-display text-xl font-bold">Tasker Verifications</div>
      <p className="mt-1 text-sm text-ink-soft">
        {loading ? 'Loading…' : `${taskers.length} pending application${taskers.length === 1 ? '' : 's'}`}
      </p>

      <div className="mt-6 space-y-4">
        {taskers.map((t) => (
          <div key={t.id} className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display font-bold">{t.full_name}</div>
                <div className="text-xs text-ink-soft">{t.years_experience} yrs experience</div>
              </div>
              <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                Pending
              </span>
            </div>

            {t.bio && <p className="mt-3 text-sm text-ink-soft">{t.bio}</p>}

            {t.document_path ? (
              <button
                onClick={() => viewDocument(t.document_path!)}
                className="mt-3 text-sm font-semibold text-primary underline"
              >
                View submitted ID document
              </button>
            ) : (
              <p className="mt-3 text-sm text-danger">No ID document uploaded yet</p>
            )}

            {rejectingId === t.id ? (
              <div className="mt-4 rounded-2xl bg-danger-soft p-3.5">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-danger">
                  Reason for rejection (shown to the tasker)
                </label>
                <textarea
                  autoFocus
                  value={reasonDraft}
                  onChange={(e) => setReasonDraft(e.target.value)}
                  rows={2}
                  placeholder="e.g. ID document is blurry, please re-upload a clear photo"
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none"
                />
                <div className="mt-2.5 flex gap-2">
                  <button
                    disabled={actingOn === t.id || !reasonDraft.trim()}
                    onClick={() => decide(t.id, 'rejected', reasonDraft.trim())}
                    className="flex-1 rounded-xl bg-danger py-2 text-xs font-bold text-white disabled:opacity-50"
                  >
                    Confirm rejection
                  </button>
                  <button
                    onClick={() => {
                      setRejectingId(null)
                      setReasonDraft('')
                    }}
                    className="rounded-xl border border-line bg-surface px-4 py-2 text-xs font-bold text-ink-soft"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex gap-3">
                <button
                  disabled={actingOn === t.id}
                  onClick={() => decide(t.id, 'verified')}
                  className="flex-1 rounded-2xl bg-success py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Approve
                </button>
                <button
                  disabled={actingOn === t.id}
                  onClick={() => setRejectingId(t.id)}
                  className="flex-1 rounded-2xl bg-danger py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}

        {!loading && taskers.length === 0 && (
          <div className="rounded-3xl border border-dashed border-line bg-surface p-8 text-center text-sm text-ink-soft">
            No pending applications right now.
          </div>
        )}
      </div>
    </div>
  )
}
