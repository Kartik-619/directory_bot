"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Site {
  url: string;
  name: string;
}

export default function Home() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Fetch available sites on component mount
  useEffect(() => {
    fetchSites();
  }, []);

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
        <div className="loading">Loading sites...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header">
        <h1 className="title">AI Research Assistant</h1>
        <p className="subtitle">Select a website to generate AI-powered answers</p>
      </header>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Sites Grid */}
      <div className="sites-grid">
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

// Site Card Component
function SiteCard({ site }: { site: Site }) {
  return (
    <Link href={`/site/${encodeURIComponent(site.url)}`} className="site-card">
      <div className="card-content">
        <div className="site-icon">
          {getSiteIcon(site.url)}
        </div>
        <h3 className="site-name">{site.name}</h3>
        <p className="site-url">{site.url}</p>
        <div className="card-arrow">→</div>
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