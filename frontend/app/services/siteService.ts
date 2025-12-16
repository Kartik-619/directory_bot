import { Site } from '../types/site';  // Changed from '@/types/site'
import { AppInfo } from '../types/onboarding';

// Define the structure for custom answers response
interface CustomAnswer {
  id: number;
  question: string;
  answer: string;
}

interface SiteCustomAnswers {
  siteUrl: string;
  siteName: string;
  questions: CustomAnswer[];
}

interface GenerateCustomAnswersResponse {
  appInfo: AppInfo;
  analyses: SiteCustomAnswers[];
  timestamp: string;
}

export class SiteService {
  private static readonly API_BASE_URL = 'https://directory-bot.onrender.com/api';

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

  static async generateCustomAnswers(appInfo: AppInfo): Promise<GenerateCustomAnswersResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/generate-custom-answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appInfo }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: GenerateCustomAnswersResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error generating custom answers:', error);
      throw new Error('Failed to generate custom answers. Make sure the backend is running.');
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