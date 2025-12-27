import { RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Drawer,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerContent,
  DrawerFooter
} from './Drawer';
import { FilterState, Label } from '../types';
import { NoPrFilter } from './filters/NoPrFilter';
import { NoAssigneeFilter } from './filters/NoAssigneeFilter';
import { LabelFilter } from './filters/LabelFilter';
import { AssigneeFilter } from './filters/AssigneeFilter';
import { SortOptions } from './filters/SortOptions';

import { Assignee } from '../types';

interface FilterPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterState;
  setFilters: (updates: Partial<FilterState>) => void;
  resetFilters: () => void;
  labels: Label[];
  assignees: Assignee[];
  activeFilterCount: number;
  issueCount: number | null;
  onApply: () => void;
}

export function FilterPanel({
  open,
  onOpenChange,
  filters,
  setFilters,
  resetFilters,
  labels,
  assignees,
  activeFilterCount,
  issueCount,
  onApply,
}: FilterPanelProps) {
  return (
    <Drawer open={open} onClose={() => onOpenChange(false)}>
      {/* Header */}
      <DrawerHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DrawerTitle>Filters</DrawerTitle>
            {activeFilterCount > 0 && (
              <Badge className="bg-primary/10 text-primary border-0 text-xs px-1.5 py-0.5 pointer-events-none">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 px-2 py-1 rounded-md hover:bg-accent cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                Clear all
              </button>
            )}
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DrawerDescription>
            Filter issues by various criteria
          </DrawerDescription>
          {issueCount !== null && (
            <span className="text-xs font-medium text-muted-foreground">
              · {issueCount.toLocaleString()} open
            </span>
          )}
        </div>
      </DrawerHeader>

      {/* Content */}
      <DrawerContent className="overscroll-contain"> {/* Prevent background scroll chaining */}
        <div className="h-full overflow-y-auto overscroll-contain">
          {/* Adjusted padding: pb-14 which is ~3.5rem, enough to clear footer but not huge gap */}
          <div className="p-4 space-y-5 pb-14">
            {/* Quick Filters */}
            <section className="space-y-3">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                Quick Filters
              </label>
              <div className="space-y-1">
                <NoPrFilter
                  checked={filters.noPr}
                  onChange={(noPr: boolean) => setFilters({ noPr })}
                />
                <NoAssigneeFilter
                  checked={filters.noAssignee}
                  onChange={(noAssignee: boolean) => setFilters({ noAssignee })}
                />
              </div>
            </section>

            <hr className="border-border" />

            {/* Sort Options */}
            <section className="space-y-2">
              <SortOptions
                value={filters.sortBy}
                onChange={(sortBy: FilterState['sortBy']) => setFilters({ sortBy })}
              />
            </section>

            <hr className="border-border" />

            {/* Label Filter */}
            <section className="space-y-2">
              <LabelFilter
                labels={labels}
                selectedLabels={filters.labels}
                onChange={(selectedLabels: string[]) => setFilters({ labels: selectedLabels })}
              />
            </section>

            <hr className="border-border" />

            {/* Assignee Filter */}
            <section className="space-y-2">
              <AssigneeFilter
                assignees={assignees}
                selectedAssignees={filters.assignees}
                onChange={(selectedAssignees: string[]) => setFilters({ assignees: selectedAssignees })}
              />
            </section>
          </div>
        </div>
      </DrawerContent>

      {/* Footer */}
      <DrawerFooter>
        <Button
          onClick={onApply}
          className="w-full h-8 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
        >
          Apply filters
        </Button>
      </DrawerFooter>
    </Drawer>
  );
}
