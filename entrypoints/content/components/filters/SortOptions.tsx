import { ArrowUpDown, ChevronDown } from 'lucide-react';
import { FilterState } from '../../types';

interface SortOptionsProps {
  value: FilterState['sortBy'];
  onChange: (value: FilterState['sortBy']) => void;
}

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'most-commented', label: 'Most commented' },
  { value: 'recently-updated', label: 'Recently updated' },
] as const;

export function SortOptions({ value, onChange }: SortOptionsProps) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wide">
        <ArrowUpDown className="h-3 w-3" />
        Sort
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as FilterState['sortBy'])}
          className="
            w-full h-8 px-3 pr-8 text-sm
            appearance-none cursor-pointer
            bg-card border border-border rounded-md
            text-foreground
            hover:border-muted-foreground/50
            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
            transition-colors
          "
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
}
