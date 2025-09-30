'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (query: string) => void;
  onClear?: () => void;
  showClear?: boolean;
  loading?: boolean;
}

const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, onSearch, onClear, showClear = true, loading = false, ...props }, ref) => {
    const [query, setQuery] = React.useState('');

    const handleSearch = React.useCallback(() => {
      onSearch?.(query);
    }, [query, onSearch]);

    const handleClear = React.useCallback(() => {
      setQuery('');
      onClear?.();
    }, [onClear]);

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleSearch();
        }
      },
      [handleSearch]
    );

    return (
      <div className={cn('relative flex items-center', className)}>
        <Search className="absolute left-4 h-5 w-5 text-gray-400 z-10" />
        <Input
          ref={ref}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            'pl-12 pr-12 h-12 border-gray-200 rounded-xl text-base bg-white',
            'focus:border-primary focus:ring-2 focus:ring-primary/10 focus:shadow-lg',
            'placeholder:text-gray-400 placeholder:font-normal',
            'transition-all duration-200 hover:border-gray-300 hover:shadow-md',
            'focus:bg-white focus:outline-none'
          )}
          disabled={loading}
          {...props}
        />
        {showClear && query && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 h-8 w-8 p-0 hover:bg-gray-100 rounded-full z-10 transition-colors"
            onClick={handleClear}
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
        {loading && (
          <div className="absolute right-4 h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent z-10" />
        )}
      </div>
    );
  }
);

SearchBar.displayName = 'SearchBar';

export { SearchBar };
