import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  pageSize: number
  totalCount: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, pageSize, totalCount, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  if (totalCount === 0) return null

  const from = page * pageSize + 1
  const to = Math.min(totalCount, (page + 1) * pageSize)

  return (
    <div className="mt-4 flex items-center justify-between">
      <div className="text-xs text-ink-soft">
        {from}–{to} of {totalCount}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface disabled:opacity-40"
        >
          <ChevronLeft size={14} className="text-ink-soft" />
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface disabled:opacity-40"
        >
          <ChevronRight size={14} className="text-ink-soft" />
        </button>
      </div>
    </div>
  )
}
