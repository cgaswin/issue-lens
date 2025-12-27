import { useState } from 'react';
import { Search, Tag, X, Check } from 'lucide-react';
import { Label } from '../../types';

interface LabelFilterProps {
  labels: Label[];
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

function LabelPill({ label, showClose, onClose }: { label: Label; showClose?: boolean; onClose?: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full cursor-pointer transition-opacity hover:opacity-80"
      style={{
        backgroundColor: label.color,
        color: label.textColor,
      }}
      onClick={onClose}
    >
      {label.name}
      {showClose && <X className="h-3 w-3" />}
    </span>
  );
}

export function LabelFilter({ labels, selectedLabels, onChange }: LabelFilterProps) {
  const [search, setSearch] = useState('');

  const filteredLabels = labels.filter((label) =>
    label.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleLabel = (labelName: string) => {
    if (selectedLabels.includes(labelName)) {
      onChange(selectedLabels.filter((l) => l !== labelName));
    } else {
      onChange([...selectedLabels, labelName]);
    }
  };

  const removeLabel = (labelName: string) => {
    onChange(selectedLabels.filter((l) => l !== labelName));
  };

  // Get Label objects for selected labels
  const selectedLabelObjects = selectedLabels
    .map(name => labels.find(l => l.name === name))
    .filter((l): l is Label => l !== undefined);

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wide">
        <Tag className="h-3 w-3" />
        Labels
      </label>

      {/* Selected labels as colored pills */}
      {selectedLabelObjects.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedLabelObjects.map((label) => (
            <LabelPill
              key={label.name}
              label={label}
              showClose
              onClose={() => removeLabel(label.name)}
            />
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

      {/* Label list with colored pills */}
      <div className="max-h-[140px] overflow-y-auto border border-border rounded-md bg-card">
        {filteredLabels.length === 0 ? (
          <div className="text-xs text-muted-foreground py-4 text-center">
            {labels.length === 0 ? 'No labels found' : 'No matching labels'}
          </div>
        ) : (
          <div className="py-1">
            {filteredLabels.map((label) => (
              <div
                key={label.name}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent cursor-pointer group"
                onClick={() => toggleLabel(label.name)}
              >
                <Checkbox checked={selectedLabels.includes(label.name)} />
                <span
                  className="text-xs px-2 py-0.5 rounded-full truncate"
                  style={{
                    backgroundColor: label.color,
                    color: label.textColor,
                  }}
                >
                  {label.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
