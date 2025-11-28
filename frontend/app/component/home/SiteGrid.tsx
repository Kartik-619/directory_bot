"use client";

import { forwardRef } from 'react';
import { Site } from '../../types/site';
import { SiteCard } from './SiteCard';

interface SiteGridProps {
  sites: Site[];
}

export const SiteGrid = forwardRef<HTMLDivElement, SiteGridProps>(
  ({ sites }, ref) => {
    if (sites.length === 0) {
      return (
        <div className="empty-state">
          <h3>No sites available</h3>
          <p>Check your data file and make sure it contains valid URLs and questions.</p>
        </div>
      );
    }

    return (
      <div ref={ref} className="sites-grid">
        {sites.map((site) => (
          <SiteCard key={site.url} site={site} />
        ))}
      </div>
    );
  }
);

SiteGrid.displayName = 'SiteGrid';