import { useState, useEffect } from 'react';
import { Site } from '../types/site';
import { SiteService } from '../services/siteService';

export const useSites = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchSites = async () => {
    try {
      setError('');
      setLoading(true);
      const siteData = await SiteService.fetchSites();
      setSites(siteData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  return {
    sites,
    loading,
    error,
    refetch: fetchSites
  };
};