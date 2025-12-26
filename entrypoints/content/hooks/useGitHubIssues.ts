import { useState, useEffect, useCallback, useRef } from 'react';
import { GitHubIssue, parseIssues, extractLabels, extractAssignees } from '../utils/github-dom';

export function useGitHubIssues() {
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [assignees, setAssignees] = useState<string[]>([]);
  const isModifyingRef = useRef(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Track if we're currently modifying the DOM to prevent infinite loops
  const setModifying = useCallback((value: boolean) => {
    isModifyingRef.current = value;
  }, []);

  const refresh = useCallback(() => {
    // Skip if we're currently modifying the DOM
    if (isModifyingRef.current) return;

    const parsedIssues = parseIssues();
    setIssues(parsedIssues);
    setLabels(extractLabels(parsedIssues));
    setAssignees(extractAssignees(parsedIssues));
  }, []);

  useEffect(() => {
    // Initial parse with a small delay to ensure DOM is ready
    setTimeout(refresh, 500);

    // Watch for GitHub's dynamic updates (Turbo navigation, pagination)
    const observer = new MutationObserver((mutations) => {
      // Skip if we're currently modifying the DOM
      if (isModifyingRef.current) return;

      // Check if issue list was modified (not just style changes)
      const issueListChanged = mutations.some((mutation) => {
        // Ignore attribute changes (like style.display)
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          return false;
        }

        const target = mutation.target as HTMLElement;
        return (
          mutation.type === 'childList' &&
          mutation.addedNodes.length > 0 &&
          (target.matches?.('[role="list"]') ||
            target.querySelector?.('a[href*="/issues/"]'))
        );
      });

      if (issueListChanged) {
        // Clear existing debounce
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
        // Debounce refresh
        debounceRef.current = setTimeout(refresh, 300);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false, // Don't observe attribute changes
    });

    // Also listen for GitHub's turbo navigation
    const handleNavigation = () => {
      setTimeout(refresh, 500);
    };
    document.addEventListener('turbo:load', handleNavigation);
    document.addEventListener('turbo:render', handleNavigation);

    return () => {
      observer.disconnect();
      document.removeEventListener('turbo:load', handleNavigation);
      document.removeEventListener('turbo:render', handleNavigation);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [refresh]);

  return {
    issues,
    labels,
    assignees,
    refresh,
    setModifying,
  };
}
