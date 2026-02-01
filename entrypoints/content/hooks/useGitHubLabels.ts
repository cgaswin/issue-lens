import { useState, useEffect } from 'react';
import { Assignee, Label } from '../types';

/**
 * Hook to extract labels and assignees.
 * Optimized for fast initial render with background API loading.
 */
export function useGitHubLabels() {
  const [labels, setLabels] = useState<Label[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fast initial extraction from page and cache
    const quickExtract = async () => {
      const labelMap = new Map<string, Label>();
      const assigneeMap = new Map<string, string>();
      
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
        const existing = labelMap.get(cleanName);
        if (!existing || (color && color !== defaultColor)) {
          labelMap.set(cleanName, {
            name: cleanName,
            color: color || existing?.color || defaultColor,
            textColor: textColor || existing?.textColor || defaultTextColor,
          });
        }
      };

      const addAssignee = (login: string | null | undefined, avatar?: string | null) => {
        if (!login) return;
        const cleanLogin = login.trim();
        if (cleanLogin && /^[a-zA-Z0-9-]+$/.test(cleanLogin) && !cleanLogin.includes('/')) {
          if (!assigneeMap.has(cleanLogin) || avatar) {
            assigneeMap.set(cleanLogin, avatar || assigneeMap.get(cleanLogin) || '');
          }
        }
      };

      // 1. Quick scrape from current page
      document.querySelectorAll('[class*="TrailingBadge-module__container"] a').forEach(el => {
        const tokenSpan = el.querySelector('span');
        if (!tokenSpan) return;
        const style = getComputedStyle(tokenSpan);
        const spans = el.querySelectorAll('span');
        for (const span of spans) {
          if (span.children.length === 0) {
            const text = span.textContent?.trim();
            if (text && isValidLabelName(text)) {
              addLabel(text, style.backgroundColor, style.color);
              break;
            }
          }
        }
      });

      document.querySelectorAll('[data-name]').forEach(el => {
        const name = el.getAttribute('data-name');
        if (name) addLabel(name);
      });

      document.querySelectorAll('img.avatar').forEach(el => {
        const alt = el.getAttribute('alt');
        const src = el.getAttribute('src');
        if (alt && alt.startsWith('@')) {
          addAssignee(alt.substring(1), src);
        }
      });

      document.querySelectorAll('[data-filter-item-type="assignee"] [data-filter-item-id]').forEach(el => {
        const login = el.getAttribute('data-filter-item-id');
        const img = el.querySelector('img');
        addAssignee(login, img?.getAttribute('src'));
      });

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
            } catch { /* ignore */ }
          }
        }
      });

      // 2. Load from cache immediately if available
      const path = window.location.pathname.split('/');
      if (path.length >= 3) {
        const owner = path[1];
        const repo = path[2];
        const cacheKeyLabels = `issue-lens:v1:${owner}:${repo}:labels`;
        const cacheKeyAssignees = `issue-lens:v1:${owner}:${repo}:assignees`;
        const CACHE_DURATION = 60 * 60 * 1000;

        try {
          const [labelResult, assigneeResult] = await Promise.all([
            browser.storage.local.get(cacheKeyLabels),
            browser.storage.local.get(cacheKeyAssignees)
          ]);

          const getTextColor = (hex: string) => {
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
            return (yiq >= 128) ? 'black' : 'white';
          };

          const cachedLabels = labelResult[cacheKeyLabels] as { timestamp: number; data: any[] } | undefined;
          if (cachedLabels && Date.now() - cachedLabels.timestamp < CACHE_DURATION) {
            cachedLabels.data.forEach((item: any) => {
              if (item?.name) {
                const textColor = getTextColor(item.color);
                addLabel(item.name, `#${item.color}`, textColor);
              }
            });
          }

          const cachedAssignees = assigneeResult[cacheKeyAssignees] as { timestamp: number; data: any[] } | undefined;
          if (cachedAssignees && Date.now() - cachedAssignees.timestamp < CACHE_DURATION) {
            cachedAssignees.data.forEach((item: any) => {
              if (item?.login) {
                addAssignee(item.login, item.avatar_url);
              }
            });
          }
        } catch (e) {
          console.error('[Issue Lens] Cache read error:', e);
        }
      }

      // Update UI immediately with what we have
      const sortedLabels = Array.from(labelMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      const assigneesList = Array.from(assigneeMap.entries())
        .map(([login, avatarUrl]) => ({
          login,
          avatarUrl: avatarUrl || `https://github.com/${login}.png?size=60`
        }))
        .sort((a, b) => a.login.localeCompare(b.login));

      setLabels(sortedLabels);
      setAssignees(assigneesList);
      setIsLoading(false);
    };

    // Background API fetch for fresh data
    const fetchFromApi = async () => {
      const path = window.location.pathname.split('/');
      if (path.length < 3) return;

      const owner = path[1];
      const repo = path[2];
      const cacheKeyLabels = `issue-lens:v1:${owner}:${repo}:labels`;
      const cacheKeyAssignees = `issue-lens:v1:${owner}:${repo}:assignees`;
      const CACHE_DURATION = 60 * 60 * 1000;

      try {
        const [labelResult, assigneeResult] = await Promise.all([
          browser.storage.local.get(cacheKeyLabels),
          browser.storage.local.get(cacheKeyAssignees)
        ]);

        const cachedLabels = labelResult[cacheKeyLabels] as { timestamp: number; data: any[] } | undefined;
        const cachedAssignees = assigneeResult[cacheKeyAssignees] as { timestamp: number; data: any[] } | undefined;

        // Skip API if we have fresh cache
        if (cachedLabels && cachedAssignees && 
            Date.now() - cachedLabels.timestamp < CACHE_DURATION &&
            Date.now() - cachedAssignees.timestamp < CACHE_DURATION) {
          return;
        }

        const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;

        const fetchAllPages = async (endpoint: string) => {
          let page = 1;
          const maxPages = 20;
          const allItems: any[] = [];

          while (page <= maxPages) {
            try {
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
              if (data.length < 100) break;
              page++;
            } catch (e) {
              console.error(`[Issue Lens] Error fetching ${endpoint}:`, e);
              break;
            }
          }
          return allItems;
        };

        const [labelsData, assigneesData] = await Promise.all([
          fetchAllPages('labels'),
          fetchAllPages('assignees')
        ]);

        if (labelsData.length > 0) {
          await browser.storage.local.set({
            [cacheKeyLabels]: { timestamp: Date.now(), data: labelsData }
          });
        }

        if (assigneesData.length > 0) {
          await browser.storage.local.set({
            [cacheKeyAssignees]: { timestamp: Date.now(), data: assigneesData }
          });
        }

        // Refresh UI with API data if we got new data
        if (labelsData.length > 0 || assigneesData.length > 0) {
          quickExtract();
        }
      } catch (e) {
        console.error('[Issue Lens] API fetch error:', e);
      }
    };

    // Run quick extract immediately
    quickExtract();
    
    // Fetch fresh data in background
    fetchFromApi();

    // Re-extract on page changes
    const handleChange = () => setTimeout(quickExtract, 300);
    document.addEventListener('turbo:load', handleChange);
    document.addEventListener('turbo:render', handleChange);
    window.addEventListener('popstate', handleChange);

    return () => {
      document.removeEventListener('turbo:load', handleChange);
      document.removeEventListener('turbo:render', handleChange);
      window.removeEventListener('popstate', handleChange);
    };
  }, []);

  return { labels, assignees, isLoading };
}