export interface AppInfo {
    url: string;
    name: string;
    type: 'saas' | 'ecommerce' | 'blog' | 'portfolio' | 'webapp' | 'other';
    description: string;
    targetAudience: string;
    mainFeatures: string[];
    techStack: string[];
  }
  
  export interface FormStep {
    id: number;
    title: string;
    description: string;
    fields: string[];
  }