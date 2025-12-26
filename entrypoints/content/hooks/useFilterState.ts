import { useState, useCallback, useMemo, useEffect } from 'react';
import { FilterState, defaultFilters } from '../types';

export function useFilterState() {
  const [filters, setFiltersState] = useState<FilterState>(defaultFilters);

  // Initialize filters from URL on mount
  useEffect(() => {
    const url = new URL(window.location.href);
    const query = url.searchParams.get('q') || '';

    // Parse the query string
    const newFilters: Partial<FilterState> = { ...defaultFilters };

    // Check for "-linked:pr"
    if (query.includes('-linked:pr')) {
      newFilters.noPr = true;
    }

    // Check for "no:assignee"
    if (query.includes('no:assignee')) {
      newFilters.noAssignee = true;
    }

    // Extract labels: label:bug or label:"high priority"
    const labelMatches = query.match(/label:("[^"]+"|\S+)/g);
    if (labelMatches) {
      newFilters.labels = labelMatches.map(l => {
        const val = l.replace('label:', '');
        return val.startsWith('"') ? val.slice(1, -1) : val;
      });
    }

    // Extract assignees: assignee:username
    const assigneeMatches = query.match(/assignee:(\S+)/g);
    if (assigneeMatches) {
      newFilters.assignees = assigneeMatches.map(a => a.replace('assignee:', ''));
    }

    // Extract sort
    // sort:created-desc (newest), sort:created-asc (oldest),
    // sort:comments-desc (most-commented), sort:updated-desc (recently-updated)
    if (query.includes('sort:created-asc')) {
      newFilters.sortBy = 'oldest';
    } else if (query.includes('sort:comments-desc')) {
      newFilters.sortBy = 'most-commented';
    } else if (query.includes('sort:updated-desc')) {
      newFilters.sortBy = 'recently-updated';
    } else {
      newFilters.sortBy = 'newest'; // Default
    }

    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []); // Run once on mount

  const setFilters = useCallback((updates: Partial<FilterState>) => {
    setFiltersState((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.noPr) count++;
    if (filters.noAssignee) count++;
    count += filters.labels.length;
    count += filters.assignees.length;
    if (filters.sortBy !== 'newest') count++;
    return count;
  }, [filters]);

  return {
    filters,
    setFilters,
    resetFilters,
    activeFilterCount,
  };
}
