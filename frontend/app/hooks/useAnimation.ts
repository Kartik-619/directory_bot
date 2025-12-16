// /app/hooks/useAnimation.ts
import { useRef, useEffect, useCallback } from "react";
import { Site } from "../types/site";
import { gsap } from "gsap";

export const useAnimation = (sites: Site[], loading: boolean) => {
  const headerRef = useRef<HTMLHeadingElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  /**
   * Memoized animation function
   * Fixes react-hooks/immutability
   */
  const animatePageIn = useCallback(() => {
    // Animate header
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );
    }

    // Animate grid items
    if (gridRef.current) {
      const items = Array.from(
        gridRef.current.children
      ) as HTMLElement[];

      gsap.fromTo(
        items,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.05,
          ease: "power2.out",
          delay: 0.2,
        }
      );
    }
  }, []); // ✅ refs are stable → empty deps is correct

  useEffect(() => {
    if (loading || sites.length === 0) return;

    animatePageIn();
  }, [loading, sites, animatePageIn]); // ✅ stable dependency

  return {
    headerRef,
    gridRef,
    animatePageIn, // optional but safe to expose
  };
};
