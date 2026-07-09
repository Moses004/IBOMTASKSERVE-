import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useAllCategories, createCategory, updateCategory, setCategoryActive } from '../../lib/adminQueries'
import { getCategoryStyle } from '../../lib/categoryIcons'

export default function AdminCategories() {
  const { categories, loading, refresh } = useAllCategories()
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nameDraft, setNameDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function startEdit(id: string, currentName: string) {
    setEditingId(id)
    setNameDraft(currentName)
    setCreating(false)
  }

  async function handleCreate() {
    if (!nameDraft.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      await createCategory(nameDraft.trim(), 'package')
      setNameDraft('')
      setCreating(false)
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create category.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSaveEdit(id: string, icon: string | null) {
    if (!nameDraft.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      await updateCategory(id, nameDraft.trim(), icon ?? 'package')
      setEditingId(null)
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update category.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    try {
      await setCategoryActive(id, !isActive)
      refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not update category.')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-display text-xl font-bold">Categories</div>
          <p className="mt-1 text-sm text-ink-soft">Retiring a category hides it from customers without deleting history.</p>
        </div>
        <button
          onClick={() => {
            setCreating(true)
            setEditingId(null)
            setNameDraft('')
          }}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white"
        >
          <Plus size={14} /> New
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{error}</div>
      )}

      {creating && (
        <div className="mt-4 flex gap-2 rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <input
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            placeholder="Category name"
            className="flex-1 rounded-xl border border-line bg-canvas px-3 py-2 text-sm outline-none"
          />
          <button
            disabled={submitting}
            onClick={handleCreate}
            className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            Create
          </button>
          <button
            onClick={() => setCreating(false)}
            className="rounded-xl border border-line px-3 py-2 text-xs font-bold text-ink-soft"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="mt-4 space-y-2.5">
        {loading && <p className="text-sm text-ink-soft">Loading…</p>}

        {categories.map((c) => {
          const style = getCategoryStyle(c.slug)
          const Icon = style.icon
          return (
            <div
              key={c.id}
              className={`flex items-center gap-3 rounded-2xl border p-4 shadow-sm ${
                c.is_active ? 'border-line bg-surface' : 'border-line bg-canvas opacity-60'
              }`}
            >
              <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${style.bg}`}>
                <Icon size={18} className={style.fg} />
              </div>

              {editingId === c.id ? (
                <div className="flex flex-1 gap-2">
                  <input
                    autoFocus
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    className="flex-1 rounded-xl border border-line bg-canvas px-3 py-1.5 text-sm outline-none"
                  />
                  <button
                    disabled={submitting}
                    onClick={() => handleSaveEdit(c.id, c.icon)}
                    className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-xl border border-line px-3 py-1.5 text-xs font-bold text-ink-soft"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <div className="text-sm font-bold">{c.name}</div>
                    <div className="text-xs text-ink-faint">{c.slug}</div>
                  </div>
                  <button
                    onClick={() => startEdit(c.id, c.name)}
                    className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-ink-soft"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleActive(c.id, c.is_active)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                      c.is_active ? 'bg-danger-soft text-danger' : 'bg-success-soft text-success'
                    }`}
                  >
                    {c.is_active ? 'Retire' : 'Reactivate'}
                  </button>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
