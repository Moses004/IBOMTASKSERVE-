import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Send } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useMessageThread, sendMessage } from '../lib/chat'

export default function ChatThread() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { messages, loading } = useMessageThread(bookingId ?? null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function handleSend() {
    if (!draft.trim() || !user || !bookingId) return
    setSending(true)
    try {
      await sendMessage(bookingId, user.id, draft.trim())
      setDraft('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not send message.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <div className="flex items-center gap-3 border-b border-line bg-surface px-5 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-canvas"
        >
          <ChevronLeft size={18} className="text-primary" />
        </button>
        <div className="font-display text-base font-bold">Messages</div>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-y-auto px-5 py-4">
        {loading && <p className="text-sm text-ink-soft">Loading…</p>}
        {!loading && messages.length === 0 && (
          <p className="text-center text-sm text-ink-soft">
            No messages yet — say hello to coordinate the job.
          </p>
        )}

        <div className="flex flex-col gap-2.5">
          {messages.map((m) => {
            const isMine = m.sender_id === user?.id
            return (
              <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    isMine ? 'bg-primary text-white' : 'border border-line bg-surface text-ink'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            )
          })}
        </div>
        <div ref={bottomRef} />
      </div>

      <div className="mx-auto w-full max-w-md border-t border-line bg-surface px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message…"
            className="flex-1 rounded-2xl border border-line bg-canvas px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={handleSend}
            disabled={sending || !draft.trim()}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-primary text-white disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
