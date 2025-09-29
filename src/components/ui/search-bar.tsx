'use client'

import * as React from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (query: string) => void
  onClear?: () => void
  showClear?: boolean
  loading?: boolean
}

const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, onSearch, onClear, showClear = true, loading = false, ...props }, ref) => {
    const [query, setQuery] = React.useState('')

    const handleSearch = React.useCallback(() => {
      onSearch?.(query)
    }, [query, onSearch])

    const handleClear = React.useCallback(() => {
      setQuery('')
      onClear?.()
    }, [onClear])

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          handleSearch()
        }
      },
      [handleSearch]
    )

    return (
      <div className={cn('relative flex items-center', className)}>
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <Input
          ref={ref}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-12"
          disabled={loading}
          {...props}
        />
        {showClear && query && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 h-8 w-8 p-0"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
        {loading && (
          <div className="absolute right-3 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        )}
      </div>
    )
  }
)

SearchBar.displayName = 'SearchBar'

export { SearchBar }