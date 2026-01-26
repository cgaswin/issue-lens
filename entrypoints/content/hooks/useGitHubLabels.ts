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

      // --- ASSIGNEES MAP ---
      const assigneeMap = new Map<string, string>(); // login -> avatarUrl

      const addAssignee = (login: string | null | undefined, avatar?: string | null) => {
        if (!login) return;
        const cleanLogin = login.trim();
        if (cleanLogin &&
          /^[a-zA-Z0-9-]+$/.test(cleanLogin) &&
          !cleanLogin.includes('/') &&
          cleanLogin !== 'issue-lens'
        ) {
          // Keep existing avatar if new one is missing, otherwise update
          if (!assigneeMap.has(cleanLogin) || avatar) {
            assigneeMap.set(cleanLogin, avatar || assigneeMap.get(cleanLogin) || '');
          }
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

      // 2. Fetch labels from GitHub API
      const path = window.location.pathname.split('/');
      if (path.length >= 3) {
        const owner = path[1];
        const repo = path[2];
        const cacheKeyLabels = `issue-lens:v1:${owner}:${repo}:labels`;
        const cacheKeyAssignees = `issue-lens:v1:${owner}:${repo}:assignees`;
        const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

        // Helper to check cache
        const getCachedData = async (key: string) => {
          try {
            const result = await browser.storage.local.get(key);
            const cached = result[key] as { timestamp: number; data: any[] } | undefined;
            if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
              return cached.data;
            }
          } catch (e) {
            console.error('[Issue Lens] Cache read error:', e);
          }
          return null;
        };

        // Helper to set cache
        const setCachedData = async (key: string, data: any[]) => {
          try {
            await browser.storage.local.set({
              [key]: { timestamp: Date.now(), data }
            });
          } catch (e) {
            console.error('[Issue Lens] Cache write error:', e);
          }
        };

        const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;

        // Helper to fetch all pages from API
        const fetchAllPages = async (endpoint: string, processItem: (item: any) => void) => {
          let page = 1;
          const maxPages = 20;
          const allItems: any[] = [];

          while (page <= maxPages) {
            try {
              // API requests are rate limited (60/hr/IP unauthenticated)
              const response = await fetch(`${apiUrl}/${endpoint}?page=${page}&per_page=100`);

              if (!response.ok) {
                if (response.status === 403 || response.status === 429) {
                  console.warn(`[Issue Lens] API rate limited for ${endpoint}`);
                }
                break;
              }

              const data = await response.json();
              if (!Array.isArray(data) || data.length === 0) break;

              allItems.push(...data);
              data.forEach(processItem);

              // If we got fewer than 100 items, we've reached the end
              if (data.length < 100) break;

              page++;
            } catch (e) {
              console.error(`[Issue Lens] Error fetching ${endpoint}:`, e);
              break;
            }
          }
          return allItems;
        };

        // Helper to determine text color based on background luminance
        const getTextColor = (hex: string) => {
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
          return (yiq >= 128) ? 'black' : 'white';
        };

        // Fetch Labels
        const cachedLabels = await getCachedData(cacheKeyLabels);
        if (cachedLabels) {
          cachedLabels.forEach((item: any) => {
            if (item && item.name) {
              const textColor = getTextColor(item.color);
              addLabel(item.name, `#${item.color}`, textColor);
            }
          });
        } else {
          const allLabels = await fetchAllPages('labels', (item) => {
            if (item && item.name) {
              const textColor = getTextColor(item.color);
              addLabel(item.name, `#${item.color}`, textColor);
            }
          });
          if (allLabels.length > 0) {
            setCachedData(cacheKeyLabels, allLabels);
          }
        }

        // Fetch Assignees
        const cachedAssignees = await getCachedData(cacheKeyAssignees);
        if (cachedAssignees) {
          cachedAssignees.forEach((item: any) => {
            if (item && item.login) {
              addAssignee(item.login, item.avatar_url);
            }
          });
        } else {
          const allAssignees = await fetchAllPages('assignees', (item) => {
            if (item && item.login) {
              addAssignee(item.login, item.avatar_url);
            }
          });
          if (allAssignees.length > 0) {
            setCachedData(cacheKeyAssignees, allAssignees);
          }
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

      // --- ADDITIONAL ASSIGNEE EXTRACTION FROM CURRENT PAGE ---

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
        const login = el.getAttribute('data-filter-item-id');
        const img = el.querySelector('img');
        addAssignee(login, img?.getAttribute('src'));
      });

      // 3. User links with hovercards
      document.querySelectorAll('a[data-hovercard-type="user"]').forEach(el => {
        const text = el.textContent?.trim();
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
