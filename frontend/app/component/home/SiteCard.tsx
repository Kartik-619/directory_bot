import { useRef } from 'react';
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

  const { enter, leave } = SiteCardAnimations.handleCardHover(cardRef, iconRef, arrowRef);

  return (
    <Link href={`/site/${encodeURIComponent(site.url)}`} passHref>
      <div 
        className="site-card"
        ref={cardRef}
        onMouseEnter={enter}
        onMouseLeave={leave}
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