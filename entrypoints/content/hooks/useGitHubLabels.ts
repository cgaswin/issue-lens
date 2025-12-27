import { useState, useEffect } from 'react';
import { Assignee, Label } from '../types';

/**
 * Hook to extract labels and assignees.
 * Includes strict cleaning logic to avoid UI noise and bad data.
 */
export function useGitHubLabels() {
  const [labels, setLabels] = useState<Label[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);

  useEffect(() => {
    const extractData = async () => {
      // --- LABELS EXTRACTION ---
      // Use Map to store labels with colors (keyed by name to dedupe)
      const labelMap = new Map<string, Label>();

      // Default colors for labels without color info
      const defaultColor = 'rgba(128, 128, 128, 0.18)';
      const defaultTextColor = 'rgb(200, 200, 200)';

      const isValidLabelName = (name: string | null | undefined): name is string => {
        if (!name) return false;
        const cleanName = name.trim();
        return cleanName.length > 0 &&
          cleanName.length < 50 &&
          cleanName !== 'Public' &&
          cleanName !== 'Private' &&
          !cleanName.includes('Issue Lens') &&
          !cleanName.includes('Sort') &&
          !cleanName.includes('Filter');
      };

      const addLabel = (name: string, color?: string, textColor?: string) => {
        const cleanName = name.trim();
        if (!isValidLabelName(cleanName)) return;

        // Only update if we don't have this label yet, or if we have better color info
        const existing = labelMap.get(cleanName);
        if (!existing || (color && color !== defaultColor)) {
          labelMap.set(cleanName, {
            name: cleanName,
            color: color || existing?.color || defaultColor,
            textColor: textColor || existing?.textColor || defaultTextColor,
          });
        }
      };

      // 1. Scrape current page FIRST to get colors from TrailingBadge elements
      // GitHub's React/styled-components UI (2024+)
      document.querySelectorAll('[class*="TrailingBadge-module__container"] a').forEach(el => {
        // Find the first span with TokenBase class to get computed styles
        const tokenSpan = el.querySelector('span');
        if (!tokenSpan) return;

        const style = getComputedStyle(tokenSpan);
        const bgColor = style.backgroundColor;
        const txtColor = style.color;

        // Find innermost spans (no children) and take only the first one for the name
        const spans = el.querySelectorAll('span');
        for (const span of spans) {
          if (span.children.length === 0) {
            const text = span.textContent?.trim();
            if (text && isValidLabelName(text)) {
              addLabel(text, bgColor, txtColor);
              break;
            }
          }
        }
      });

      // 2. Fetch from /labels page for additional labels not on current page
      const path = window.location.pathname.split('/');
      if (path.length >= 3) {
        const repoPath = `/${path[1]}/${path[2]}`;
        try {
          const response = await fetch(`${repoPath}/labels`);
          if (response.ok) {
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');

            // Use data-name attribute (contains only label name, no description)
            doc.querySelectorAll('[data-name]').forEach(el => {
              const name = el.getAttribute('data-name');
              if (name) addLabel(name);
            });

            // Extract from href as fallback
            doc.querySelectorAll('a[href*="/labels/"]').forEach(el => {
              const href = el.getAttribute('href');
              if (href) {
                const match = href.match(/\/labels\/([^/?]+)/);
                if (match) {
                  addLabel(decodeURIComponent(match[1]));
                }
              }
            });
          }
        } catch (e) {
          console.error('[Issue Lens] Failed fetch labels', e);
        }
      }

      // 3. Additional page scraping for labels without colors
      document.querySelectorAll('[data-name]').forEach(el => {
        const name = el.getAttribute('data-name');
        if (name) addLabel(name);
      });

      // Convert to sorted array
      const sortedLabels = Array.from(labelMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      setLabels(sortedLabels);


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

    // Multiple extraction attempts to handle timing issues
    const timeouts: NodeJS.Timeout[] = [];
    [100, 500, 1000, 2000, 3000].forEach(delay => {
      timeouts.push(setTimeout(extractData, delay));
    });

    // Watch for DOM changes that might indicate labels loading
    const observer = new MutationObserver((mutations) => {
      const hasRelevantChanges = mutations.some(m =>
        m.type === 'childList' && m.addedNodes.length > 0
      );
      if (hasRelevantChanges) {
        // Debounce extraction
        setTimeout(extractData, 300);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const handleTurbo = () => setTimeout(extractData, 500);
    document.addEventListener('turbo:load', handleTurbo);
    document.addEventListener('turbo:render', handleTurbo);
    window.addEventListener('popstate', () => setTimeout(extractData, 500));

    return () => {
      timeouts.forEach(clearTimeout);
      observer.disconnect();
      document.removeEventListener('turbo:load', handleTurbo);
      document.removeEventListener('turbo:render', handleTurbo);
    };
  }, []);

  return { labels, assignees };
}
