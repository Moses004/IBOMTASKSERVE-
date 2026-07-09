declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: PaystackSetupOptions) => { openIframe: () => void }
    }
  }
}

interface PaystackSetupOptions {
  key: string
  email: string
  amount: number // smallest currency unit (e.g. kobo)
  currency?: string
  ref: string
  onClose: () => void
  callback: (response: { reference: string }) => void
}

let scriptLoadingPromise: Promise<void> | null = null

function loadPaystackScript(): Promise<void> {
  if (window.PaystackPop) return Promise.resolve()
  if (scriptLoadingPromise) return scriptLoadingPromise

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Paystack checkout script'))
    document.body.appendChild(script)
  })

  return scriptLoadingPromise
}

export interface PayWithPaystackParams {
  email: string
  /** Amount in your normal currency unit (e.g. dollars/naira), not kobo. */
  amount: number
  reference: string
  currency?: string
}

/** Opens the Paystack popup. Resolves with the reference on success, or null if the customer closes the popup without paying (not an error). */
export async function payWithPaystack(params: PayWithPaystackParams): Promise<{ reference: string } | null> {
  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY
  if (!publicKey) {
    throw new Error('VITE_PAYSTACK_PUBLIC_KEY is not set. Add it to your .env file.')
  }

  await loadPaystackScript()

  return new Promise((resolve) => {
    const handler = window.PaystackPop!.setup({
      key: publicKey,
      email: params.email,
      amount: Math.round(params.amount * 100),
      currency: params.currency ?? 'NGN',
      ref: params.reference,
      onClose: () => resolve(null),
      callback: (response) => resolve({ reference: response.reference }),
    })
    handler.openIframe()
  })
}

export {}
