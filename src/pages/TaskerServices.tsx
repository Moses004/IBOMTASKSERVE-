import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import {
  useCategories,
  useMyServices,
  useMyTaskerProfile,
  upsertTaskerService,
  removeTaskerService,
  setTaskerAvailability,
  resubmitVerification,
  updateTaskerBio,
} from '../lib/queries'
import { uploadIdDocument } from '../lib/storage'
import { getCategoryStyle } from '../lib/categoryIcons'

const verificationCopy: Record<string, { label: string; className: string }> = {
  pending: { label: 'Verification pending', className: 'bg-primary-soft text-primary' },
  verified: { label: 'Verified', className: 'bg-success-soft text-success' },
  rejected: { label: 'Verification rejected', className: 'bg-danger-soft text-danger' },
}

export default function TaskerServices() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { categories, loading: categoriesLoading } = useCategories()
  const { services, loading: servicesLoading, refresh } = useMyServices(user?.id ?? null)
  const { data: taskerProfile } = useMyTaskerProfile(user?.id ?? null)

  // Local editable state: categoryId -> rate string (empty = not offered)
  const [rates, setRates] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [availabilitySaving, setAvailabilitySaving] = useState(false)

  const [resubmitBio, setResubmitBio] = useState('')
  const [resubmitFile, setResubmitFile] = useState<File | null>(null)
  const [resubmitting, setResubmitting] = useState(false)
  const [resubmitError, setResubmitError] = useState<string | null>(null)
  const [resubmitted, setResubmitted] = useState(false)

  const [bioDraft, setBioDraft] = useState('')
  const [yearsDraft, setYearsDraft] = useState('')
  const [bioSaving, setBioSaving] = useState(false)
  const [bioSaved, setBioSaved] = useState(false)

  useEffect(() => {
    if (taskerProfile?.bio) setBioDraft(taskerProfile.bio)
    if (taskerProfile?.years_experience !== undefined) setYearsDraft(String(taskerProfile.years_experience))
  }, [taskerProfile?.bio, taskerProfile?.years_experience])

  async function handleSaveBio() {
    if (!user) return
    setBioSaving(true)
    setBioSaved(false)
    try {
      await updateTaskerBio(user.id, bioDraft, Number(yearsDraft) || 0)
      setBioSaved(true)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not save changes.')
    } finally {
      setBioSaving(false)
    }
  }

  useEffect(() => {
    if (taskerProfile?.bio) setResubmitBio(taskerProfile.bio)
  }, [taskerProfile?.bio])

  async function handleResubmit() {
    if (!user) return
    if (!resubmitFile) {
      setResubmitError('Please upload a new ID document before resubmitting.')
      return
    }
    setResubmitError(null)
    setResubmitting(true)
    try {
      const docPath = await uploadIdDocument(user.id, resubmitFile)
      await resubmitVerification(user.id, resubmitBio, docPath)
      setResubmitted(true)
    } catch (err) {
      setResubmitError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setResubmitting(false)
    }
  }

  useEffect(() => {
    if (servicesLoading) return
    const initial: Record<string, string> = {}
    services.forEach((s) => {
      initial[s.category_id] = String(s.hourly_rate)
    })
    setRates(initial)
  }, [services, servicesLoading])

  const isOffered = (categoryId: string) => rates[categoryId] !== undefined && rates[categoryId] !== ''

  function handleRateChange(categoryId: string, value: string) {
    setRates((prev) => ({ ...prev, [categoryId]: value }))
  }

  async function handleToggle(categoryId: string) {
    if (!user) return
    if (isOffered(categoryId)) {
      setSavingId(categoryId)
      await removeTaskerService(user.id, categoryId)
      setRates((prev) => {
        const next = { ...prev }
        delete next[categoryId]
        return next
      })
      setSavingId(null)
      refresh()
    } else {
      setRates((prev) => ({ ...prev, [categoryId]: '' }))
    }
  }

  async function handleSaveRate(categoryId: string) {
    if (!user) return
    const rate = Number(rates[categoryId])
    if (!rate || rate <= 0) return
    setSavingId(categoryId)
    await upsertTaskerService(user.id, categoryId, rate)
    setSavingId(null)
    refresh()
  }

  async function handleToggleAvailability() {
    if (!user || !taskerProfile) return
    setAvailabilitySaving(true)
    await setTaskerAvailability(user.id, !taskerProfile.is_available)
    setAvailabilitySaving(false)
    window.location.reload()
  }

  const verification = taskerProfile ? verificationCopy[taskerProfile.verification_status] : null

  return (
    <div className="min-h-screen bg-canvas px-6 pb-10 pt-6">
      <div className="mx-auto max-w-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface shadow-sm"
          >
            <ChevronLeft size={18} className="text-primary" />
          </button>
          <div className="font-display text-lg font-bold">Your services</div>
        </div>

        {verification && (
          <div className={`mt-4 rounded-2xl px-4 py-3 text-sm font-semibold ${verification.className}`}>
            <div className="flex items-center justify-between">
              {verification.label}
              {taskerProfile?.verification_status !== 'verified' && (
                <span className="text-xs font-medium opacity-80">Customers won't see your listing yet</span>
              )}
            </div>
            {taskerProfile?.verification_status === 'rejected' && taskerProfile.rejection_reason && (
              <div className="mt-2 rounded-xl bg-white/60 px-3 py-2 text-xs font-normal text-ink">
                "{taskerProfile.rejection_reason}"
              </div>
            )}
          </div>
        )}

        {taskerProfile?.verification_status === 'rejected' && !resubmitted && (
          <div className="mt-3 space-y-3 rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <div className="text-sm font-bold">Resubmit for verification</div>

            {resubmitError && (
              <div className="rounded-xl bg-danger-soft px-3 py-2 text-xs font-medium text-danger">
                {resubmitError}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary">Bio</label>
              <textarea
                value={resubmitBio}
                onChange={(e) => setResubmitBio(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary">
                New ID document
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setResubmitFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-3 file:py-1.5 file:text-primary"
              />
            </div>

            <button
              onClick={handleResubmit}
              disabled={resubmitting}
              className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {resubmitting ? 'Submitting…' : 'Resubmit for review'}
            </button>
          </div>
        )}

        {resubmitted && (
          <div className="mt-3 rounded-2xl bg-success-soft px-4 py-3 text-sm font-semibold text-success">
            Resubmitted — you're back in the review queue.
          </div>
        )}

        {taskerProfile?.verification_status !== 'rejected' && (
          <div className="mt-3 space-y-3 rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <div className="text-sm font-bold">Bio & experience</div>
            {bioSaved && (
              <div className="rounded-xl bg-success-soft px-3 py-2 text-xs font-semibold text-success">
                Saved.
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary">Bio</label>
              <textarea
                value={bioDraft}
                onChange={(e) => {
                  setBioDraft(e.target.value)
                  setBioSaved(false)
                }}
                rows={3}
                className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary">
                Years of experience
              </label>
              <input
                type="number"
                min={0}
                value={yearsDraft}
                onChange={(e) => {
                  setYearsDraft(e.target.value)
                  setBioSaved(false)
                }}
                className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <button
              onClick={handleSaveBio}
              disabled={bioSaving}
              className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {bioSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}

        {taskerProfile && (
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3.5 shadow-sm">
            <div>
              <div className="text-sm font-bold">Accepting bookings</div>
              <div className="text-xs text-ink-soft">Turn off if you're fully booked</div>
            </div>
            <button
              disabled={availabilitySaving}
              onClick={handleToggleAvailability}
              className={`h-6 w-10 flex-shrink-0 rounded-full transition ${
                taskerProfile.is_available ? 'bg-primary' : 'bg-line'
              }`}
            >
              <div
                className={`h-5 w-5 rounded-full bg-white shadow transition ${
                  taskerProfile.is_available ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        )}

        <p className="mt-6 text-xs font-bold uppercase tracking-wide text-primary">
          Select the categories you offer and set your rate
        </p>

        <div className="mt-3 space-y-2.5">
          {categoriesLoading && <p className="text-sm text-ink-soft">Loading categories…</p>}

          {categories.map((c) => {
            const style = getCategoryStyle(c.slug)
            const Icon = style.icon
            const offered = isOffered(c.id)
            const savedRate = services.find((s) => s.category_id === c.id)?.hourly_rate
            const currentValue = rates[c.id] ?? ''
            const hasUnsavedChange = offered && Number(currentValue) !== savedRate

            return (
              <div
                key={c.id}
                className={`rounded-2xl border p-4 shadow-sm transition ${
                  offered ? 'border-primary bg-primary-soft/40' : 'border-line bg-surface'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${style.bg}`}>
                      <Icon size={17} className={style.fg} />
                    </div>
                    <div className="text-sm font-bold">{c.name}</div>
                  </div>
                  <button
                    onClick={() => handleToggle(c.id)}
                    disabled={savingId === c.id}
                    className={`h-6 w-10 flex-shrink-0 rounded-full transition ${offered ? 'bg-primary' : 'bg-line'}`}
                  >
                    <div
                      className={`h-5 w-5 rounded-full bg-white shadow transition ${
                        offered ? 'translate-x-[22px]' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {offered && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2">
                      <span className="text-sm text-ink-soft">$</span>
                      <input
                        type="number"
                        min={1}
                        value={currentValue}
                        onChange={(e) => handleRateChange(c.id, e.target.value)}
                        placeholder="Hourly rate"
                        className="w-full bg-transparent text-sm font-semibold outline-none"
                      />
                      <span className="text-xs text-ink-soft">/hr</span>
                    </div>
                    <button
                      onClick={() => handleSaveRate(c.id)}
                      disabled={savingId === c.id || !currentValue || Number(currentValue) <= 0}
                      className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
                    >
                      {hasUnsavedChange || savedRate === undefined ? 'Save' : 'Saved'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
