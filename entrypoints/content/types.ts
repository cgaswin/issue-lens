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

export interface Label {
  name: string;
  color: string;      // Background color (e.g., "rgba(215, 58, 74, 0.18)")
  textColor: string;  // Text color (e.g., "rgb(236, 161, 168)")
}
