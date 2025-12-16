import { useCallback, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { SiteCardAnimations } from '../utils/animation';

export const usePageAnimation = (sites: any[], loading: boolean) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && sites.length > 0) {
      animatePageIn();
    }
  }, [loading, sites]);

  const animatePageIn = useCallback(() => {
    if (headerRef.current) {
      gsap.fromTo(headerRef.current, 
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
      );
    }

    if (gridRef.current) {
      SiteCardAnimations.animateGridIn(gridRef.current);
    }
  },[]);

  return { headerRef, gridRef };
};