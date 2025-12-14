'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Barcode } from 'lucide-react';

interface ProductSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ProductSearchBar({ value, onChange, placeholder }: ProductSearchBarProps) {
  const [localValue, setLocalValue] = useState(value);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [localValue, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Support for barcode scanners (typically end with Enter)
    if (e.key === 'Enter') {
      onChange(localValue);
    }
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder || 'Search products by name, SKU, or scan barcode...'}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="pl-10 pr-10 h-12 text-base"
        autoFocus
      />
      <Barcode className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
    </div>
  );
}
