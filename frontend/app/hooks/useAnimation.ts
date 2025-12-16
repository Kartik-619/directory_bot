// app/hooks/useAnimation.ts
import { useRef, useCallback, useEffect } from 'react';
import { Site } from '../types/site';
import { gsap } from 'gsap';

export const useAnimation = (sites: Site[], loading: boolean) => {
  const headerRef = useRef<HTMLHeadingElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const animatePageIn = useCallback(() => {
    // Animate header
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
      );
    }

    // Animate grid items
    if (gridRef.current) {
      // Convert HTMLCollection to an array to satisfy immutability/TypeScript
      const items = Array.from(gridRef.current.children) as HTMLElement[];

      gsap.fromTo(
        items,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.05,
          ease: 'power2.out',
          delay: 0.2,
        }
      );
    }
  }, []);

  useEffect(() => {
    if (!loading && sites.length > 0) {
      animatePageIn();
    }
  }, [loading, sites, animatePageIn]);

  return { headerRef, gridRef, animatePageIn };
};
