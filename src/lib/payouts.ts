import { supabase } from './supabase'

async function callEdgeFunction(name: string, body: unknown) {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  if (!token) throw new Error('Not authenticated')

  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  const json = await res.json()
  if (!res.ok || !json.success) throw new Error(json.message ?? 'Request failed')
  return json
}

export interface Bank {
  name: string
  code: string
}

export async function listBanks(): Promise<Bank[]> {
  const json = await callEdgeFunction('paystack-list-banks', {})
  return json.banks
}

export async function setupPayoutAccount(bankCode: string, bankName: string, accountNumber: string) {
  return callEdgeFunction('paystack-setup-payout-account', { bankCode, bankName, accountNumber })
}

export async function initiatePayout(taskerId: string, amount: number) {
  return callEdgeFunction('paystack-initiate-payout', { taskerId, amount })
}
