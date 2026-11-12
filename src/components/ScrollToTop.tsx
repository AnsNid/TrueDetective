import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Restores scroll position to the top whenever the route path changes,
 * so navigating between tall views doesn't keep the old scroll offset.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
