import { Check } from 'lucide-react';

interface NoPrFilterProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function NoPrFilter({ checked, onChange }: NoPrFilterProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor="no-pr"
        className="flex items-center gap-2.5 py-1.5 cursor-pointer group"
      >
        {/* Custom checkbox - GitHub style */}
        <div className="relative flex-shrink-0">
          <input
            type="checkbox"
            id="no-pr"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className={`
            w-4 h-4 rounded border transition-colors
            ${checked
              ? 'bg-primary border-primary'
              : 'bg-card border-border hover:border-muted-foreground/50'
            }
          `}>
            {checked && <Check className="w-3 h-3 text-primary-foreground absolute top-0.5 left-0.5" />}
          </div>
        </div>
        <span className="text-sm text-foreground">
          Exclude issues with linked PRs
        </span>
      </label>
    </div>
  );
}
