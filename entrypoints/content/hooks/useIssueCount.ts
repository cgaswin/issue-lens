import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to extract issue counts from GitHub's UI
 * Re-extracts on URL changes and DOM updates
 */
export function useIssueCount() {
  const [openCount, setOpenCount] = useState<number | null>(null);
  const [closedCount, setClosedCount] = useState<number | null>(null);

  const extractCounts = useCallback(() => {
    let foundOpen: number | null = null;
    let foundClosed: number | null = null;

    // Method 1: Look for the Open/Closed tabs with counts (e.g., "Open 258")
    document.querySelectorAll('a').forEach(el => {
      const text = el.textContent?.trim() || '';
      // Match patterns like "Open 258" or "Open  123" (with extra spaces)
      const openMatch = text.match(/^Open\s+(\d{1,6})$/i);
      const closedMatch = text.match(/^Closed\s+(\d{1,6})$/i);

      if (openMatch) {
        foundOpen = parseInt(openMatch[1], 10);
      }
      if (closedMatch) {
        foundClosed = parseInt(closedMatch[1], 10);
      }
    });

    // Method 2: Look for issue count in specific elements
    document.querySelectorAll('[class*="Counter"], .Counter, [data-component="counter"]').forEach(el => {
      const parent = el.closest('a');
      if (parent) {
        const parentText = parent.textContent?.toLowerCase() || '';
        const countText = el.textContent?.trim().replace(/,/g, '') || '';
        const count = parseInt(countText, 10);

        if (!isNaN(count)) {
          if (parentText.includes('open') && foundOpen === null) {
            foundOpen = count;
          } else if (parentText.includes('closed') && foundClosed === null) {
            foundClosed = count;
          }
        }
      }
    });

    // Method 3: Look for state tabs (GitHub's issue list tabs)
    document.querySelectorAll('[role="tab"], [data-tab-item]').forEach(el => {
      const text = el.textContent?.trim() || '';
      const openMatch = text.match(/Open\s*(\d{1,6})/i);
      const closedMatch = text.match(/Closed\s*(\d{1,6})/i);

      if (openMatch && foundOpen === null) {
        foundOpen = parseInt(openMatch[1], 10);
      }
      if (closedMatch && foundClosed === null) {
        foundClosed = parseInt(closedMatch[1], 10);
      }
    });

    // Method 4: Regex scan of visible text near the top of the page
    const issueHeader = document.querySelector('[class*="TableHeader"], [class*="IssueList"]');
    if (issueHeader) {
      const headerText = issueHeader.textContent || '';
      const openMatch = headerText.match(/Open\s+(\d{1,6})/i);
      const closedMatch = headerText.match(/Closed\s+(\d{1,6})/i);

      if (openMatch && foundOpen === null) {
        foundOpen = parseInt(openMatch[1], 10);
      }
      if (closedMatch && foundClosed === null) {
        foundClosed = parseInt(closedMatch[1], 10);
      }
    }

    // Update state only if we found values
    if (foundOpen !== null) setOpenCount(foundOpen);
    if (foundClosed !== null) setClosedCount(foundClosed);
  }, []);

  useEffect(() => {
    // Initial extraction with multiple attempts
    const attempts = [100, 500, 1000, 2000];
    const timeouts = attempts.map(delay => setTimeout(extractCounts, delay));

    // Watch for DOM changes that might indicate count updates
    const observer = new MutationObserver(() => {
      // Debounce the extraction
      setTimeout(extractCounts, 200);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Re-extract on navigation events
    const handleNavigation = () => {
      setOpenCount(null);
      setClosedCount(null);
      setTimeout(extractCounts, 500);
      setTimeout(extractCounts, 1500);
    };

    document.addEventListener('turbo:load', handleNavigation);
    document.addEventListener('turbo:render', handleNavigation);
    window.addEventListener('popstate', handleNavigation);

    return () => {
      timeouts.forEach(clearTimeout);
      observer.disconnect();
      document.removeEventListener('turbo:load', handleNavigation);
      document.removeEventListener('turbo:render', handleNavigation);
      window.removeEventListener('popstate', handleNavigation);
    };
  }, [extractCounts]);

  return { openCount, closedCount };
}
