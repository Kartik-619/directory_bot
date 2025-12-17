// /vercel/path0/frontend/app/component/home/SiteCard.tsx

import { useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Site } from '../../types/site';
import { SiteService } from '../../services/siteService';
import { SiteCardAnimations } from '../../utils/animation';

interface SiteCardProps {
  site: Site;
}

export const SiteCard = ({ site }: SiteCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);

  // The logic is correctly moved into event handlers:
  const handleMouseEnter = useCallback(() => {
    // Refs are accessed here, within the event handler
    if (cardRef.current && iconRef.current && arrowRef.current) {
      SiteCardAnimations.handleCardHover(cardRef, iconRef, arrowRef).enter();
    }
  }, []); // Dependencies are correct

  const handleMouseLeave = useCallback(() => {
    // Refs are accessed here, within the event handler
    if (cardRef.current && iconRef.current && arrowRef.current) {
      SiteCardAnimations.handleCardHover(cardRef, iconRef, arrowRef).leave();
    }
  }, []); // Dependencies are correct

  return (
    <Link href={`/site/${encodeURIComponent(site.url)}`} passHref>
      <div 
        className="site-card"
        ref={cardRef}
        onMouseEnter={handleMouseEnter} // Handlers are used here
        onMouseLeave={handleMouseLeave} // Handlers are used here
        role="link"
        tabIndex={0}
        style={{ cursor: 'pointer' }}
      >
        <div className="card-content">
          <div ref={iconRef} className="site-icon">
            {SiteService.getSiteIcon(site.url)}
          </div>
          <h3 className="site-name">{site.name}</h3>
          <p className="site-url">{site.url}</p>
          <div ref={arrowRef} className="card-arrow">→</div>
        </div>
      </div>
    </Link>
  );
};