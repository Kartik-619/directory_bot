"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';

interface Site {
  url: string;
  name: string;
}

export default function Home() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Fetch available sites on component mount
  useEffect(() => {
    fetchSites();
  }, []);

  // Animation when component mounts and sites load
  useEffect(() => {
    if (!loading && sites.length > 0) {
      animatePageIn();
    }
  }, [loading, sites]);

  const animatePageIn = () => {
    // Animate header
    if (headerRef.current) {
      gsap.fromTo(headerRef.current, 
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
      );
    }

    // Animate grid items with stagger
    if (gridRef.current) {
      const cards = gridRef.current.querySelectorAll('.site-card');
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
    }
  };

  const fetchSites = async () => {
    try {
      setError('');
      const response = await fetch('http://localhost:3001/api/sites');
      if (!response.ok) {
        throw new Error('Failed to fetch sites');
      }
      const siteUrls = await response.json();
      
      // Convert URLs to site objects with display names
      const siteObjects: Site[] = siteUrls.map((url: string) => ({
        url,
        name: getDisplayName(url)
      }));
      
      setSites(siteObjects);
    } catch (err) {
      setError('Error loading sites. Make sure the backend is running.');
      console.error('Error fetching sites:', err);
    } finally {
      setLoading(false);
    }
  };

  // Extract a clean display name from URL
  const getDisplayName = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      // Remove www. and get the main domain
      return domain.replace(/^www\./, '');
    } catch {
      // If URL parsing fails, return a cleaned-up version
      return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="loading-spinner"></div>
          Loading sites...
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header ref={headerRef} className="header">
        <h1 className="title">Directory Bot</h1>
        <p className="subtitle">Select a website to generate AI-powered answers and ease your startup launch!!</p>
      </header>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Sites Grid */}
      <div ref={gridRef} className="sites-grid">
        {sites.map((site) => (
          <SiteCard key={site.url} site={site} />
        ))}
      </div>

      {/* Empty State */}
      {sites.length === 0 && !error && (
        <div className="empty-state">
          <h3>No sites available</h3>
          <p>Check your data file and make sure it contains valid URLs and questions.</p>
        </div>
      )}
    </div>
  );
}

// Site Card Component with GSAP animations
function SiteCard({ site }: { site: Site }) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        y: -8,
        scale: 1.02,
        duration: 0.3,
        ease: "power2.out"
      });
    }
    
    if (iconRef.current) {
      gsap.to(iconRef.current, {
        rotation: 360,
        duration: 0.6,
        ease: "power2.out"
      });
    }

    if (arrowRef.current) {
      gsap.to(arrowRef.current, {
        x: 8,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        y: 0,
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      });
    }

    if (iconRef.current) {
      gsap.to(iconRef.current, {
        rotation: 0,
        duration: 0.6,
        ease: "power2.out"
      });
    }

    if (arrowRef.current) {
      gsap.to(arrowRef.current, {
        x: 0,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  };

  return (
    <Link 
      href={`/site/${encodeURIComponent(site.url)}`} 
      className="site-card"
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="card-content">
        <div ref={iconRef} className="site-icon">
          {getSiteIcon(site.url)}
        </div>
        <h3 className="site-name">{site.name}</h3>
        <p className="site-url">{site.url}</p>
        <div ref={arrowRef} className="card-arrow">→</div>
      </div>
    </Link>
  );
}

// Helper function to get site icon
function getSiteIcon(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return domain.charAt(0).toUpperCase();
  } catch {
    return '🌐';
  }
}