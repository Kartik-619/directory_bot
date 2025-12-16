import { useRef, useEffect } from "react";
import { Site } from "../types/site";
import { gsap } from "gsap";

export const useAnimation = (sites: Site[], loading: boolean) => {
  const headerRef = useRef<HTMLHeadingElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading || sites.length === 0) return;

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
      const items = Array.from(gridRef.current.children) as HTMLElement[];
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, sites]); // only run when loading or sites change

  return { headerRef, gridRef };
};
