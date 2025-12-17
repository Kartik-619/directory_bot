export interface AppInfo {
  url: string;
  name: string;
  type: 'saas' | 'ecommerce' | 'blog' | 'portfolio' | 'webapp' | 'other';
  description: string;
  targetAudience: string;
  mainFeatures: string[];
  techStack: string[];

  email: string;
  companyName: string;
  contactName: string;
  location: string;
  githubUrl: string;
  launchDate: string;

  tagline: string;
  category: string;

  linkedinUrl: string;
  enableGithubActions: boolean;
  enableLinkedinSharing: boolean;
  xUrl: string;
  isReleased: boolean;
}
