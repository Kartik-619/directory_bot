// app/services/siteService.ts
import { Site } from '../types/site';
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

// Interface for the raw API response from /sites
interface FetchSitesResponse {
    sites: string[];
    // Add other properties if they exist, e.g., metadata: any;
}


export class SiteService {
 private static readonly API_BASE_URL = 'https://directory-bot.onrender.com/api';

 /** Fetch all sites */
 static async fetchSites(): Promise<Site[]> {
 try {
 const response = await fetch(`${this.API_BASE_URL}/sites`);

if (!response.ok) {
 throw new Error(`HTTP error! status: ${response.status}`);
}

 // Explicitly type the response object
 const data = (await response.json()) as { sites: string[] };
 const siteUrls: string[] = data.sites; // Assuming the actual array is inside a 'sites' property

 return siteUrls.map(url => ({
 url,
 name: this.getDisplayName(url),
 }));
 } catch (error: unknown) { // FIX: Explicitly typing the error as 'unknown'
 console.error('Error fetching sites:', error);
 throw new Error('Failed to fetch sites. Make sure the backend is running.');
 }
 }

 /** Generate custom answers for a given app info */
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

 // Explicitly type the JSON response
 const data: GenerateCustomAnswersResponse = (await response.json()) as GenerateCustomAnswersResponse;

return data;
 } catch (error: unknown) { // FIX: Explicitly typing the error as 'unknown'
 console.error('Error generating custom answers:', error);
 throw new Error('Failed to generate custom answers. Make sure the backend is running.');
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
 } }
}