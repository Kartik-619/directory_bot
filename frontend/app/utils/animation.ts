import { gsap } from 'gsap';
import { RefObject } from 'react';

export const SiteCardAnimations = {
  handleCardHover: (
    cardRef: RefObject<HTMLElement>, 
    iconRef?: RefObject<HTMLElement>, 
    arrowRef?: RefObject<HTMLElement>
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