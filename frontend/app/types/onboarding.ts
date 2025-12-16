export interface AppInfo {
  // Basic Info
  url: string;
  name: string;
  type: 'saas' | 'ecommerce' | 'blog' | 'portfolio' | 'webapp' | 'other';
  description: string;
  targetAudience: string;
  mainFeatures: string[];
  techStack: string[];
  
  // New Contact Information Fields
  email: string;
  companyName: string;
  contactName: string;
  location: string;
  githubUrl: string;
  launchDate: string;
  
  // ADDED NEW FIELDS
  tagline: string;
  category: string;
  
  // NEW: Social & Automation Fields
  linkedinUrl: string;
  enableGithubActions: boolean;
  enableLinkedinSharing: boolean;
  xUrl: string;// Add X (Twitter) URL field
  isReleased: boolean; // Add released toggle
}