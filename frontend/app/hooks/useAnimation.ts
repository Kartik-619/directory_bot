// /app/hooks/useAnimation.ts (or similar file)
import { useRef, useEffect, useCallback } from "react"; // Added useCallback
import { Site } from "../types/site";
import { gsap } from "gsap";

export const useAnimation = (sites: Site[], loading: boolean) => {
 const headerRef = useRef<HTMLHeadingElement>(null);
 const gridRef = useRef<HTMLDivElement>(null);

 // FIX: Define the animation logic inside useCallback to memoize the function.
 // This solves the 'react-hooks/immutability' error.
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
 }, [headerRef, gridRef]); // Dependency: Refs (though they won't change)

useEffect(() => {
 if (loading || sites.length === 0) return;

 // FIX: Call the memoized function inside useEffect
 animatePageIn();

 // The useEffect dependencies remain correct to trigger on data changes
 }, [loading, sites, animatePageIn]); 

 return { headerRef, gridRef, animatePageIn }; // You can now optionally return it
};