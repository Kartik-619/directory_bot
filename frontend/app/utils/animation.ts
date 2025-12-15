import { gsap } from 'gsap';
import { RefObject } from 'react';

export const SiteCardAnimations = {
  // Add the missing animateGridIn method
  animateGridIn: (gridElement: HTMLElement) => {
    const cards = gridElement.querySelectorAll('.site-card');
    gsap.fromTo(cards,
      { y: 60, opacity: 0, scale: 0.9 },
      { 
        y: 0, 
        opacity: 1, 
        scale: 1, 
        duration: 0.6, 
        stagger: 0.1,
        ease: "back.out(1.7)",
        delay: 0.3
      }
    );
  },

  handleCardHover: (
    cardRef: RefObject<HTMLElement | null>, 
    iconRef?: RefObject<HTMLElement | null>, 
    arrowRef?: RefObject<HTMLElement | null>
  ) => {
    const enter = () => {
      if (cardRef.current) {
        gsap.to(cardRef.current, {
          y: -8,
          scale: 1.02,
          duration: 0.3,
          ease: "power2.out"
        });
      }
      
      if (iconRef?.current) {
        gsap.to(iconRef.current, {
          rotation: 360,
          duration: 0.6,
          ease: "power2.out"
        });
      }

      if (arrowRef?.current) {
        gsap.to(arrowRef.current, {
          x: 8,
          duration: 0.3,
          ease: "power2.out"
        });
      }
    };

    const leave = () => {
      if (cardRef.current) {
        gsap.to(cardRef.current, {
          y: 0,
          scale: 1,
          duration: 0.3,
          ease: "power2.out"
        });
      }

      if (iconRef?.current) {
        gsap.to(iconRef.current, {
          rotation: 0,
          duration: 0.6,
          ease: "power2.out"
        });
      }

      if (arrowRef?.current) {
        gsap.to(arrowRef.current, {
          x: 0,
          duration: 0.3,
          ease: "power2.out"
        });
      }
    };

    return { enter, leave };
  }
};