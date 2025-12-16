// app/services/siteService.ts
import { Site } from '../types/site';
import { AppInfo } from '../types/onboarding';

/* ---------- Types ---------- */

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

interface FetchSitesResponse {
  sites: string[];
}

/* ---------- Service ---------- */

export class SiteService {
  private static readonly API_BASE_URL =
    'https://directory-bot.onrender.com/api';

  /** Fetch all sites */
  static async fetchSites(): Promise<Site[]> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/sites`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as FetchSitesResponse;

      return data.sites.map((url) => ({
        url,
        name: this.getDisplayName(url),
      }));
    } catch (error: unknown) {
      // ✅ FIX: no implicit `any`
      console.error('Error fetching sites:', error);
      throw new Error(
        'Failed to fetch sites. Make sure the backend is running.'
      );
    }
  }

  /** Generate custom answers for a given app info */
  static async generateCustomAnswers(
    appInfo: AppInfo
  ): Promise<GenerateCustomAnswersResponse> {
    try {
      const response = await fetch(
        `${this.API_BASE_URL}/generate-custom-answers`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ appInfo }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return (await response.json()) as GenerateCustomAnswersResponse;
    } catch (error: unknown) {
      // ✅ FIX: no implicit `any`
      console.error('Error generating custom answers:', error);
      throw new Error(
        'Failed to generate custom answers. Make sure the backend is running.'
      );
    }
  }

  /** Get display name for a site URL */
  static getDisplayName(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.replace(/^www\./, '');
    } catch {
      return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    }
  }

  /** Get icon (first letter) for a site URL */
  static getSiteIcon(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.charAt(0).toUpperCase();
    } catch {
      return '🌐';
    }
  }
}
