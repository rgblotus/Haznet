import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i)
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-xl"
      >
        <ChevronLeft size={18} />
      </Button>

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          disabled={page === currentPage}
          className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${
            page === currentPage
              ? 'bg-primary-500 text-white'
              : 'text-text-secondary hover:bg-surface-muted'
          }`}
        >
          {page}
        </button>
      ))}

      <Button
        variant="secondary"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="rounded-xl"
      >
        <ChevronRight size={18} />
      </Button>
    </div>
  )
}
