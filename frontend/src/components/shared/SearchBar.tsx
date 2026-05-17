import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { LayoutGrid, List } from 'lucide-react'

interface SearchBarProps {
  search: string
  onSearchChange: (value: string) => void
  viewMode?: 'list' | 'grid'
  onViewModeChange?: (mode: 'list' | 'grid') => void
  placeholder?: string
}

export default function SearchAndViewToggle({ search, onSearchChange, viewMode, onViewModeChange, placeholder = 'Search...' }: SearchBarProps) {
  const [localSearch, setLocalSearch] = useState(search)

  useEffect(() => {
    setLocalSearch(search)
  }, [search])

  return (
    <div className="flex gap-4 mb-6">
      <div className="flex-1 flex items-center gap-3 p-4 bg-surface border border-border rounded-2xl focus-within:ring-2 focus-within:ring-primary-500/20 transition-all">
        <Search size={20} className="text-text-muted shrink-0" />
        <Input
          type="text"
          placeholder={placeholder}
          value={localSearch}
          onChange={(e) => {
            setLocalSearch(e.target.value)
            onSearchChange(e.target.value)
          }}
          className="bg-transparent border-none text-base focus:ring-0"
        />
      </div>

      {onViewModeChange && (
        <div className="flex gap-1 bg-surface rounded-xl p-1.5 border border-border">
          <Button
            onClick={() => onViewModeChange('list')}
            variant={viewMode === 'list' ? 'primary' : 'ghost'}
            size="sm"
            className="rounded-lg"
          >
            <List size={18} />
          </Button>
          <Button
            onClick={() => onViewModeChange('grid')}
            variant={viewMode === 'grid' ? 'primary' : 'ghost'}
            size="sm"
            className="rounded-lg"
          >
            <LayoutGrid size={18} />
          </Button>
        </div>
      )}
    </div>
  )
}
