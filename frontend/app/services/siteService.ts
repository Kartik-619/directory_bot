import { Site } from '../types/site';  // Changed from '@/types/site'

export class SiteService {
  private static readonly API_BASE_URL = 'http://localhost:3001/api';

  static async fetchSites(): Promise<Site[]> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/sites`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const siteUrls: string[] = await response.json();
      return siteUrls.map(url => ({
        url,
        name: this.getDisplayName(url)
      }));
    } catch (error) {
      console.error('Error fetching sites:', error);
      throw new Error('Failed to fetch sites. Make sure the backend is running.');
    }
  }

  static getDisplayName(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.replace(/^www\./, '');
    } catch {
      return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    }
  }

  static getSiteIcon(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.charAt(0).toUpperCase();
    } catch {
      return '🌐';
    }
  }
}