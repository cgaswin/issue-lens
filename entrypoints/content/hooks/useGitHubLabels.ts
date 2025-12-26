import { useState, useEffect } from 'react';
import { Assignee } from '../types';

/**
 * Hook to extract labels and assignees.
 * Includes strict cleaning logic to avoid UI noise and bad data.
 */
export function useGitHubLabels() {
  const [labels, setLabels] = useState<string[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);

  useEffect(() => {
    const extractData = async () => {
      // --- LABELS EXTRACTION ---
      const labelSet = new Set<string>();

      const addLabel = (name: string | null | undefined) => {
        if (!name) return;
        const cleanName = name.trim();
        if (cleanName.length > 0 &&
          cleanName.length < 50 &&
          cleanName !== 'Public' &&
          cleanName !== 'Private' &&
          !cleanName.includes('Issue Lens') &&
          !cleanName.includes('Sort') &&
          !cleanName.includes('Filter')
        ) {
          labelSet.add(cleanName);
        }
      };

      // 1. Fetch from /labels page
      const path = window.location.pathname.split('/');
      if (path.length >= 3) {
        const repoPath = `/${path[1]}/${path[2]}`;
        try {
          const response = await fetch(`${repoPath}/labels`);
          if (response.ok) {
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');

            doc.querySelectorAll('.js-label-link .Label, .js-label-link, span.Label').forEach(el => {
              if (el.closest('.Label--gray')) return;
              addLabel(el.textContent);
            });

            doc.querySelectorAll('[data-name]').forEach(el => {
              addLabel(el.getAttribute('data-name'));
            });
          }
        } catch (e) {
          console.error('[Issue Lens] Failed fetch labels', e);
        }
      }

      // 2. Scrape current page
      document.querySelectorAll('.IssueLabel').forEach(el => addLabel(el.textContent));
      document.querySelectorAll('[data-name]').forEach(el => addLabel(el.getAttribute('data-name')));
      document.querySelectorAll('[data-filter-item-type="label"] [data-filter-item-id]').forEach(el => {
        addLabel(el.getAttribute('data-filter-item-id'));
      });

      setLabels(Array.from(labelSet).sort());


      // --- ASSIGNEES EXTRACTION ---
      const assigneeMap = new Map<string, string>(); // login -> avatarUrl

      const addAssignee = (name: string | null | undefined, avatar?: string | null) => {
        if (!name) return;
        const cleanName = name.trim();
        if (cleanName &&
          /^[a-zA-Z0-9-]+$/.test(cleanName) &&
          !cleanName.includes('/') &&
          cleanName !== 'issue-lens'
        ) {
          // Keep existing avatar if new one is missing, otherwise update
          if (!assigneeMap.has(cleanName) || avatar) {
            assigneeMap.set(cleanName, avatar || assigneeMap.get(cleanName) || '');
          }
        }
      };

      // 1. Avatars (Best source for images)
      document.querySelectorAll('img.avatar').forEach(el => {
        const alt = el.getAttribute('alt');
        const src = el.getAttribute('src');
        if (alt && alt.startsWith('@')) {
          addAssignee(alt.substring(1), src);
        }
      });

      // 2. Filter Dropdown
      document.querySelectorAll('[data-filter-item-type="assignee"] [data-filter-item-id]').forEach(el => {
        const name = el.getAttribute('data-filter-item-id');
        // Try to find avatar inside
        const img = el.querySelector('img');
        addAssignee(name, img?.getAttribute('src'));
      });

      // 3. User links
      document.querySelectorAll('a[data-hovercard-type="user"]').forEach(el => {
        const text = el.textContent?.trim();
        // Try to find avatar img nearby or inside
        const img = el.querySelector('img') || el.closest('div')?.querySelector('img.avatar');

        if (text && !text.includes(' ') && !text.includes('\n')) {
          addAssignee(text, img?.getAttribute('src'));
        } else {
          const href = el.getAttribute('href');
          if (href) {
            try {
              const urlObj = new URL(href, window.location.origin);
              const parts = urlObj.pathname.split('/').filter(Boolean);
              if (parts.length === 1) {
                addAssignee(parts[0], img?.getAttribute('src'));
              }
            } catch (e) { /* ignore */ }
          }
        }
      });

      const assigneesList = Array.from(assigneeMap.entries())
        .map(([login, avatarUrl]) => ({
          login,
          // Fallback to GitHub's public avatar URL if we didn't capture one
          avatarUrl: avatarUrl || `https://github.com/${login}.png?size=60`
        }))
        .sort((a, b) => a.login.localeCompare(b.login));

      setAssignees(assigneesList);
    };

    extractData();

    const handleTurbo = () => setTimeout(extractData, 1000);
    document.addEventListener('turbo:load', handleTurbo);
    document.addEventListener('turbo:render', handleTurbo);

    return () => {
      document.removeEventListener('turbo:load', handleTurbo);
      document.removeEventListener('turbo:render', handleTurbo);
    };
  }, []);

  return { labels, assignees };
}
