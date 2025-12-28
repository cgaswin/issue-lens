import { useState } from 'react';
import { Search, Users, X, Check } from 'lucide-react';
import { Assignee } from '../../types';

interface AssigneeFilterProps {
  assignees: Assignee[];
  selectedAssignees: string[];
  onChange: (assignees: string[]) => void;
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

export function AssigneeFilter({ assignees, selectedAssignees, onChange }: AssigneeFilterProps) {
  const [search, setSearch] = useState('');

  const filteredAssignees = assignees.filter((assignee) =>
    assignee.login.toLowerCase().includes(search.toLowerCase())
  );

  const toggleAssignee = (login: string) => {
    if (selectedAssignees.includes(login)) {
      onChange(selectedAssignees.filter((a) => a !== login));
    } else {
      onChange([...selectedAssignees, login]);
    }
  };

  const removeAssignee = (login: string) => {
    onChange(selectedAssignees.filter((a) => a !== login));
  };

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wide">
        <Users className="h-3 w-3" />
        Assignees
        <span className="text-muted-foreground font-normal ml-0.5">({assignees.length})</span>
      </label>

      {/* Selected assignees */}
      {selectedAssignees.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedAssignees.map((login) => {
            // Find avatar for selected user, fallback to GitHub's public avatar URL
            const assignee = assignees.find(a => a.login === login);
            const avatarUrl = assignee?.avatarUrl || `https://github.com/${login}.png?size=40`;
            return (
              <span
                key={login}
                className="inline-flex items-center gap-1 pl-1 pr-2 py-0.5 text-xs bg-accent text-foreground rounded-full cursor-pointer hover:bg-accent/80"
                onClick={() => removeAssignee(login)}
                title={`@${login}`}
              >
                <img
                  src={avatarUrl}
                  alt=""
                  className="w-4 h-4 rounded-full"
                  onError={(e) => {
                    // Fallback to initial if image fails to load
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="w-4 h-4 rounded-full bg-muted items-center justify-center text-[8px] font-bold hidden">
                  {login[0].toUpperCase()}
                </div>
                {login}
                <X className="h-3 w-3 ml-0.5 opacity-50" />
              </span>
            );
          })}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Filter assignees"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          // Fix for background typing
          onKeyDown={(e) => e.stopPropagation()}
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

      {/* Assignee list */}
      <div className="max-h-[160px] overflow-y-auto border border-border rounded-md bg-card">
        {filteredAssignees.length === 0 ? (
          <div className="text-xs text-muted-foreground py-4 text-center">
            {assignees.length === 0 ? 'No assignees found' : 'No matching assignees'}
          </div>
        ) : (
          <div className="py-1">
            {filteredAssignees.map((assignee) => (
              <div
                key={assignee.login}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent cursor-pointer group"
                onClick={() => toggleAssignee(assignee.login)}
              >
                <Checkbox checked={selectedAssignees.includes(assignee.login)} />

                <div className="flex items-center gap-2 min-w-0">
                  {assignee.avatarUrl ? (
                    <img
                      src={assignee.avatarUrl}
                      alt={`@${assignee.login}`}
                      className="w-5 h-5 rounded-full bg-muted object-cover"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold uppercase">
                      {assignee.login.slice(0, 2)}
                    </div>
                  )}
                  <span className="text-sm text-foreground truncate">
                    @{assignee.login}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
