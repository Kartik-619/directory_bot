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
  tagline:string;
  category:string;
  companyName: string;
  contactName: string;
  location: string;
  githubUrl: string;
  launchDate: string;
}