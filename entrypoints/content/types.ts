export interface FilterState {
  noPr: boolean;
  noAssignee: boolean;
  labels: string[];
  assignees: string[];
  sortBy: 'newest' | 'oldest' | 'most-commented' | 'recently-updated';
}

export const defaultFilters: FilterState = {
  noPr: false,
  noAssignee: false,
  labels: [],
  assignees: [],
  sortBy: 'newest',
};

export interface Assignee {
  login: string;
  avatarUrl?: string;
}
