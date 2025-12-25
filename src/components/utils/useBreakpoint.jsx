import { useState, useEffect } from 'react';

const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

/**
 * Custom hook to check if the viewport matches a given breakpoint.
 * @param {'sm' | 'md' | 'lg' | 'xl'} breakpointKey - The breakpoint to check against.
 * @returns {boolean} - True if the viewport width is greater than or equal to the breakpoint.
 */
export const useBreakpoint = (breakpointKey) => {
  const [isMatch, setIsMatch] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
        setIsMatch(false);
        return;
    }

    const query = `(min-width: ${breakpoints[breakpointKey]}px)`;
    const mediaQueryList = window.matchMedia(query);

    const handleResize = (e) => setIsMatch(e.matches);

    handleResize(mediaQueryList);

    mediaQueryList.addEventListener('change', handleResize);
    
    return () => {
      mediaQueryList.removeEventListener('change', handleResize);
    };
  }, [breakpointKey]);

  return isMatch;
};