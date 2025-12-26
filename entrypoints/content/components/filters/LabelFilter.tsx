import { useState } from 'react';
import { Search, Tag, X, Check } from 'lucide-react';

interface LabelFilterProps {
  labels: string[];
  selectedLabels: string[];
  onChange: (labels: string[]) => void;
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <div className={`
      w-4 h-4 rounded border transition-colors flex items-center justify-center flex-shrink-0
      ${checked
        ? 'bg-primary border-primary'
        : 'bg-card border-border group-hover:border-muted-foreground/50'
      }
    `}>
      {checked && <Check className="w-3 h-3 text-primary-foreground" />}
    </div>
  );
}

export function LabelFilter({ labels, selectedLabels, onChange }: LabelFilterProps) {
  const [search, setSearch] = useState('');

  const filteredLabels = labels.filter((label) =>
    label.toLowerCase().includes(search.toLowerCase())
  );

  const toggleLabel = (label: string) => {
    if (selectedLabels.includes(label)) {
      onChange(selectedLabels.filter((l) => l !== label));
    } else {
      onChange([...selectedLabels, label]);
    }
  };

  const removeLabel = (label: string) => {
    onChange(selectedLabels.filter((l) => l !== label));
  };

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wide">
        <Tag className="h-3 w-3" />
        Labels
      </label>

      {/* Selected labels */}
      {selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedLabels.map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-accent text-foreground rounded-full cursor-pointer hover:bg-accent/80"
              onClick={() => removeLabel(label)}
            >
              {label}
              <X className="h-3 w-3" />
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Filter labels"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="
            w-full h-8 pl-8 pr-3 text-sm
            bg-card border border-border rounded-md
            text-foreground placeholder:text-muted-foreground
            hover:border-muted-foreground/50
            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
            transition-colors
          "
        />
      </div>

      {/* Label list */}
      <div className="max-h-[140px] overflow-y-auto border border-border rounded-md bg-card">
        {filteredLabels.length === 0 ? (
          <div className="text-xs text-muted-foreground py-4 text-center">
            {labels.length === 0 ? 'No labels found' : 'No matching labels'}
          </div>
        ) : (
          <div className="py-1">
            {filteredLabels.map((label) => (
              <div
                key={label}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent cursor-pointer group"
                onClick={() => toggleLabel(label)}
              >
                <Checkbox checked={selectedLabels.includes(label)} />
                <span className="text-sm text-foreground truncate">{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
