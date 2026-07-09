import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useMyPayoutAccount, useMyPayouts, useMyEarnings } from '../lib/queries'
import { listBanks, setupPayoutAccount, type Bank } from '../lib/payouts'

const statusStyle: Record<string, string> = {
  pending: 'bg-[#FFF4D9] text-[#E0A100]',
  success: 'bg-success-soft text-success',
  failed: 'bg-danger-soft text-danger',
  reversed: 'bg-danger-soft text-danger',
}

export default function TaskerPayouts() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { account, loading: accountLoading, refresh: refreshAccount } = useMyPayoutAccount(user?.id ?? null)
  const { payouts, loading: payoutsLoading } = useMyPayouts(user?.id ?? null)
  const { balance, loading: balanceLoading } = useMyEarnings(user?.id ?? null)

  const [editing, setEditing] = useState(false)
  const [banks, setBanks] = useState<Bank[]>([])
  const [banksLoading, setBanksLoading] = useState(false)
  const [bankCode, setBankCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resolvedName, setResolvedName] = useState<string | null>(null)

  useEffect(() => {
    if (editing && banks.length === 0) {
      setBanksLoading(true)
      listBanks()
        .then(setBanks)
        .catch((err) => setError(err.message))
        .finally(() => setBanksLoading(false))
    }
  }, [editing, banks.length])

  async function handleSubmit() {
    if (!bankCode || accountNumber.length < 10) {
      setError('Select a bank and enter a valid account number.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const bankName = banks.find((b) => b.code === bankCode)?.name ?? ''
      const result = await setupPayoutAccount(bankCode, bankName, accountNumber)
      setResolvedName(result.accountName)
      refreshAccount()
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not set up payout account.')
    } finally {
      setSubmitting(false)
    }
  }

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
          <div className="font-display text-lg font-bold">Payouts</div>
        </div>

        <div className="mt-4 rounded-2xl bg-primary px-5 py-5 text-white shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide opacity-80">Available balance</div>
          <div className="mt-1 font-display text-3xl font-bold">
            {balanceLoading ? '—' : `$${balance.toFixed(2)}`}
          </div>
          <p className="mt-1 text-xs opacity-80">
            Paid out by an admin once approved. Reflects completed jobs only.
          </p>
        </div>

        <div className="mt-5 font-display text-sm font-bold">Payout account</div>

        {!accountLoading && account && !editing && (
          <div className="mt-2.5 rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <div className="text-sm font-bold">{account.account_name}</div>
            <div className="mt-0.5 text-xs text-ink-soft">
              {account.bank_name} · ••••{account.account_number.slice(-4)}
            </div>
            <button
              onClick={() => setEditing(true)}
              className="mt-3 rounded-xl border border-line bg-canvas px-3 py-1.5 text-xs font-bold text-ink-soft"
            >
              Update bank details
            </button>
          </div>
        )}

        {resolvedName && !editing && (
          <div className="mt-2.5 rounded-xl bg-success-soft px-3 py-2 text-xs font-semibold text-success">
            Verified as {resolvedName} — you're all set to receive payouts.
          </div>
        )}

        {!accountLoading && !account && !editing && (
          <div className="mt-2.5 rounded-2xl border border-dashed border-line bg-surface p-5 text-center">
            <p className="text-sm text-ink-soft">Add your bank details to receive payouts.</p>
            <button
              onClick={() => setEditing(true)}
              className="mt-3 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white"
            >
              Add bank account
            </button>
          </div>
        )}

        {editing && (
          <div className="mt-2.5 space-y-3 rounded-2xl border border-line bg-surface p-4 shadow-sm">
            {error && (
              <div className="rounded-xl bg-danger-soft px-3 py-2 text-xs font-medium text-danger">{error}</div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary">Bank</label>
              <select
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                className="w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm outline-none"
              >
                <option value="">{banksLoading ? 'Loading banks…' : 'Select your bank'}</option>
                {banks.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary">
                Account number
              </label>
              <input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                maxLength={10}
                className="w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm outline-none"
                placeholder="0123456789"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {submitting ? 'Verifying…' : 'Verify & save'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm font-bold text-ink-soft"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 font-display text-sm font-bold">Payout history</div>
        <div className="mt-2.5 space-y-2.5">
          {payoutsLoading && <p className="text-sm text-ink-soft">Loading…</p>}
          {!payoutsLoading && payouts.length === 0 && (
            <p className="text-sm text-ink-soft">No payouts yet.</p>
          )}
          {payouts.map((p) => (
            <div key={p.id} className="rounded-2xl border border-line bg-surface p-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="font-display text-sm font-bold">${p.amount}</div>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${statusStyle[p.status] ?? ''}`}>
                  {p.status}
                </span>
              </div>
              <div className="mt-1 text-xs text-ink-soft">{new Date(p.created_at).toLocaleDateString()}</div>
              {p.failure_reason && <div className="mt-1 text-xs text-danger">{p.failure_reason}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
