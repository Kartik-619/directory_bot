"use client";

import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { AppInfo } from '../../types/onboarding';
import { FormProgress } from './FormProgress';
import './AppInfoForm.css';
import { useRouter } from 'next/navigation';

interface AppInfoFormProps {
  onSubmit: (appInfo: AppInfo) => Promise<void>;
  onBack: () => void;
}

interface SiteAnalysis {
  siteUrl: string;
  siteName: string;
  questions: {
    id: number;
    question: string;
    answer: string;
  }[];
}

const appTypes = [
  { value: 'saas', label: 'SaaS Application', icon: '💼' },
  { value: 'ecommerce', label: 'E-commerce Store', icon: '🛒' },
  { value: 'blog', label: 'Blog/Content Site', icon: '📝' },
  { value: 'portfolio', label: 'Portfolio', icon: '🎨' },
  { value: 'webapp', label: 'Web Application', icon: '⚡' },
  { value: 'other', label: 'Other', icon: '🔧' },
];

const techOptions = [
  'React', 'Vue', 'Angular', 'Next.js', 'Node.js', 'Python', 'PHP', 'Ruby',
  'WordPress', 'Shopify', 'MongoDB', 'PostgreSQL', 'AWS', 'Google Cloud', 'Firebase'
];

export const AppInfoForm = ({ onSubmit, onBack }: AppInfoFormProps) => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<SiteAnalysis[] | null>(null);
  
  // Initialize form data with new fields
  const [formData, setFormData] = useState<AppInfo>({
    // Basic Info
    url: '',
    name: '',
    type: 'webapp',
    description: '',
    targetAudience: '',
    mainFeatures: [],
    techStack: [],
    
    // New Contact Information
    email: '',
    companyName: '',
    contactName: '',
    location: '',
    githubUrl: '',
    launchDate: '',
  });

  const formRef = useRef<HTMLDivElement>(null);
  const stepContentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const analysisStorageKey = 'app_analysis_results';

  // Update steps to include contact info step
  const steps = [
    { id: 1, title: 'Basic Info', description: 'Tell us about your app' },
    { id: 2, title: 'Description', description: 'Describe your app' },
    { id: 3, title: 'Features & Tech', description: 'Key features and technology' },
    { id: 4, title: 'Contact Info', description: 'Your contact information' },
    { id: 5, title: 'Review', description: 'Confirm your details' },
  ];

  // ============ GSAP ANIMATIONS - ADD THESE BACK ============
  
  // Initial container animation
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current,
        {
          opacity: 0,
          scale: 0.9,
          y: 50
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.8,
          ease: "back.out(1.7)"
        }
      );
    }
  }, []);

  // Step content animation on step change
  useEffect(() => {
    if (stepContentRef.current) {
      gsap.fromTo(stepContentRef.current,
        {
          opacity: 0,
          x: currentStep > 1 ? 50 : -50
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          ease: "power2.out"
        }
      );
    }
  }, [currentStep]);

  // Results animation when they appear
  useEffect(() => {
    if (analysisResult && resultsRef.current) {
      gsap.fromTo(resultsRef.current,
        {
          opacity: 0,
          y: 30
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.1
        }
      );
    }
  }, [analysisResult]);

  // ============ REST OF THE CODE ============

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🚀 Submitting app info for analysis:', formData);
      
      // Get sites first
      const sitesResponse = await fetch('http://localhost:3004/api/sites');
      if (!sitesResponse.ok) {
        throw new Error(`Failed to fetch sites: ${sitesResponse.status}`);
      }
      const siteUrls: string[] = await sitesResponse.json();
      
      // LIMIT to only 3-5 sites for now to avoid overloading
      const limitedSiteUrls = siteUrls.slice(0, 5);
      
      console.log('📋 Sites to analyze (limited):', limitedSiteUrls);
      
      const allAnalyses: SiteAnalysis[] = [];
      
      // Process sites ONE BY ONE with delays
      for (let i = 0; i < limitedSiteUrls.length; i++) {
        const siteUrl = limitedSiteUrls[i];
        try {
          console.log(`📍 Analyzing site ${i + 1}/${limitedSiteUrls.length}: ${siteUrl}`);
          
          const analysisResponse = await fetch('http://localhost:3004/api/analyze-site', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              appInfo: formData,
              siteUrl: siteUrl
            }),
          });

          if (!analysisResponse.ok) {
            console.warn(`⚠️ Failed to analyze ${siteUrl}: ${analysisResponse.status}`);
            continue;
          }

          const result = await analysisResponse.json();
          
          // Add site analysis if it has questions
          if (result.questions && result.questions.length > 0) {
            allAnalyses.push({
              siteUrl: siteUrl,
              siteName: getSiteDisplayName(siteUrl),
              questions: result.questions
            });
          }
          
          // Add delay between requests to avoid overloading
          if (i < limitedSiteUrls.length - 1) {
            console.log(`⏳ Waiting 1 second before next site...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
        } catch (siteError) {
          console.warn(`⚠️ Error analyzing ${siteUrl}:`, siteError);
        }
      }
      
      if (allAnalyses.length === 0) {
        throw new Error('No analyses generated for any site');
      }
      
      console.log('✅ All analyses received:', allAnalyses);
      
      // Save to localStorage with more detailed structure
      saveAnalysisToStorage(allAnalyses);
      
      // Call parent onSubmit
      await onSubmit(formData);
      
      // REDIRECT TO RESULTS PAGE IMMEDIATELY
      console.log('🔀 Redirecting to results page...');
      router.push('/results');
      
    } catch (err) {
      console.error('❌ Analysis error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate analysis';
      setError(errorMessage);
      
      // Add error animation
  
    } finally {
      setIsLoading(false);
    }
  };

  const saveAnalysisToStorage = (result: SiteAnalysis[]) => {
    try {
      const timestamp = new Date().toISOString();
      const analysisWithMetadata = {
        analyses: result,
        appInfo: formData,
        timestamp,
        metadata: {
          totalSites: result.length,
          totalQuestions: result.reduce((total, site) => total + site.questions.length, 0),
          generatedAt: timestamp
        }
      };
      
      // Get existing results
      const existingResults = JSON.parse(localStorage.getItem(analysisStorageKey) || '[]');
      
      // Add new result (keep last 5 analyses)
      const updatedResults = [analysisWithMetadata, ...existingResults.slice(0, 4)];
      
      localStorage.setItem(analysisStorageKey, JSON.stringify(updatedResults));
      console.log('✅ Analysis saved to localStorage:', {
        sites: result.length,
        totalQuestions: analysisWithMetadata.metadata.totalQuestions
      });
    } catch (error) {
      console.error('❌ Error saving analysis:', error);
    }
  };

  const getSiteDisplayName = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace(/^www\./, '');
    } catch {
      return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    }
  };

  const updateFormData = (field: keyof AppInfo, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      if (stepContentRef.current) {
        gsap.to(stepContentRef.current, {
          opacity: 0,
          x: -50,
          duration: 0.3,
          ease: "power2.in",
          onComplete: () => {
            setCurrentStep(currentStep + 1);
          }
        });
      } else {
        setCurrentStep(currentStep + 1);
      }
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      if (stepContentRef.current) {
        gsap.to(stepContentRef.current, {
          opacity: 0,
          x: 50,
          duration: 0.3,
          ease: "power2.in",
          onComplete: () => {
            setCurrentStep(currentStep - 1);
            setError(null);
          }
        });
      } else {
        setCurrentStep(currentStep - 1);
        setError(null);
      }
    } else {
      onBack();
    }
  };

  const handleNewAnalysis = () => {
    setAnalysisResult(null);
    setFormData({
      url: '',
      name: '',
      type: 'webapp',
      description: '',
      targetAudience: '',
      mainFeatures: [],
      techStack: [],
      email: '',
      companyName: '',
      contactName: '',
      location: '',
      githubUrl: '',
      launchDate: '',
    });
    setCurrentStep(1);
    setError(null);
  };

  const toggleArrayItem = (array: string[], item: string): string[] => {
    return array.includes(item) 
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  const animateButtonClick = (element: HTMLElement) => {
    gsap.fromTo(element,
      { scale: 1 },
      { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 }
    );
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateUrl = (url: string): boolean => {
    if (!url) return true; // Optional field
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="aif-step-content" ref={stepContentRef}>
            <div className="aif-form-group">
              <label className="aif-label">Website URL</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => updateFormData('url', e.target.value)}
                placeholder="https://yourapp.com"
                className="aif-input"
              />
              {formData.url && !formData.url.startsWith('http') && (
                <div className="aif-validation-hint">
                  Please include http:// or https://
                </div>
              )}
            </div>

            <div className="aif-form-group">
              <label className="aif-label">App Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="My Awesome App"
                className="aif-input"
                required
              />
              {formData.name && formData.name.length < 3 && (
                <div className="aif-validation-error">
                  Name must be at least 3 characters
                </div>
              )}
            </div>

            <div className="aif-form-group">
              <label className="aif-label">App Type *</label>
              <div className="aif-type-grid">
                {appTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={(e) => {
                      updateFormData('type', type.value);
                      animateButtonClick(e.currentTarget);
                    }}
                    className={`aif-type-btn ${
                      formData.type === type.value ? 'aif-type-selected' : ''
                    }`}
                  >
                    <div className="aif-type-icon">{type.icon}</div>
                    <div className="aif-type-label">{type.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="aif-step-content" ref={stepContentRef}>
            <div className="aif-form-group">
              <label className="aif-label">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="Describe what your app does, its main purpose, and what problem it solves..."
                rows={4}
                className="aif-input aif-textarea"
                required
              />
              <div className="aif-char-counter">
                {formData.description.length}/500 characters
              </div>
              {formData.description && formData.description.length < 50 && (
                <div className="aif-validation-hint">
                  Please provide more details (at least 50 characters)
                </div>
              )}
            </div>

            <div className="aif-form-group">
              <label className="aif-label">Target Audience *</label>
              <input
                type="text"
                value={formData.targetAudience}
                onChange={(e) => updateFormData('targetAudience', e.target.value)}
                placeholder="e.g., Small business owners, developers, students..."
                className="aif-input"
                required
              />
              {formData.targetAudience && formData.targetAudience.length < 10 && (
                <div className="aif-validation-hint">
                  Be more specific about your target audience
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="aif-step-content" ref={stepContentRef}>
            <div className="aif-form-group">
              <label className="aif-label">Main Features (Select all that apply)</label>
              <div className="aif-checkbox-group">
                {[
                  'User Authentication', 'Payment Processing', 'Dashboard/Analytics',
                  'Mobile Responsive', 'Social Media Integration', 'API Integration',
                  'Real-time Features', 'Admin Panel', 'Multi-language Support',
                  'E-commerce Functionality', 'Blog/Content Management', 'Search Functionality'
                ].map((feature) => (
                  <label key={feature} className="aif-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.mainFeatures.includes(feature)}
                      onChange={() => updateFormData('mainFeatures', toggleArrayItem(formData.mainFeatures, feature))}
                      className="aif-checkbox-input"
                    />
                    <span>{feature}</span>
                  </label>
                ))}
              </div>
              {formData.mainFeatures.length === 0 && (
                <div className="aif-validation-hint">
                  Select at least one main feature
                </div>
              )}
            </div>

            <div className="aif-form-group">
              <label className="aif-label">Technology Stack (Select technologies you use)</label>
              <div className="aif-tech-grid">
                {techOptions.map((tech) => (
                  <button
                    key={tech}
                    type="button"
                    onClick={(e) => {
                      updateFormData('techStack', toggleArrayItem(formData.techStack, tech));
                      animateButtonClick(e.currentTarget);
                    }}
                    className={`aif-tech-btn ${
                      formData.techStack.includes(tech) ? 'aif-tech-selected' : ''
                    }`}
                  >
                    {tech}
                  </button>
                ))}
              </div>
              <div className="aif-selection-count">
                Selected: {formData.techStack.length} technologies
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="aif-step-content" ref={stepContentRef}>
            <div className="aif-contact-info-header">
              <h3>Contact Information</h3>
              <p className="aif-contact-subtitle">
                We'll use this information to personalize your analysis and for future updates.
              </p>
            </div>

            <div className="aif-form-group">
              <label className="aif-label">Email Address *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                placeholder="your.email@example.com"
                className="aif-input"
                required
              />
              {formData.email && !validateEmail(formData.email) && (
                <div className="aif-validation-error">
                  Please enter a valid email address
                </div>
              )}
            </div>

            <div className="aif-form-group">
              <label className="aif-label">Company Name</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => updateFormData('companyName', e.target.value)}
                placeholder="Your Company Name"
                className="aif-input"
              />
            </div>

            <div className="aif-form-group">
              <label className="aif-label">Contact Name *</label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => updateFormData('contactName', e.target.value)}
                placeholder="Your Full Name"
                className="aif-input"
                required
              />
              {formData.contactName && formData.contactName.length < 2 && (
                <div className="aif-validation-error">
                  Please enter your full name
                </div>
              )}
            </div>

            <div className="aif-form-group">
              <label className="aif-label">Your Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => updateFormData('location', e.target.value)}
                placeholder="City, Country"
                className="aif-input"
              />
            </div>

            <div className="aif-form-group">
              <label className="aif-label">GitHub URL</label>
              <input
                type="url"
                value={formData.githubUrl}
                onChange={(e) => updateFormData('githubUrl', e.target.value)}
                placeholder="https://github.com/yourusername"
                className="aif-input"
              />
              {formData.githubUrl && !validateUrl(formData.githubUrl) && (
                <div className="aif-validation-error">
                  Please enter a valid URL
                </div>
              )}
              {formData.githubUrl && !formData.githubUrl.includes('github.com') && (
                <div className="aif-validation-hint">
                  Make sure this is a GitHub URL
                </div>
              )}
            </div>

            <div className="aif-form-group">
              <label className="aif-label">Launch Date</label>
              <input
                type="date"
                value={formData.launchDate}
                onChange={(e) => updateFormData('launchDate', e.target.value)}
                className="aif-input"
              />
              <div className="aif-validation-hint">
                If your app hasn't launched yet, enter your estimated launch date
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="aif-step-content" ref={stepContentRef}>
            <div className="aif-review-alert">
              <h3>Ready to analyze your app!</h3>
              <p>
                Based on your information, we'll analyze up to 5 directory sites and provide
                specific insights for your app.
              </p>
              <p className="aif-note">
                <small>⏱️ This may take a minute as we analyze each site individually...</small>
              </p>
            </div>

            <div className="aif-review-list">
              <div className="aif-review-section">
                <h4>Basic Information</h4>
                <div className="aif-review-item">
                  <span className="aif-review-label">URL:</span>
                  <span className="aif-review-value">{formData.url || 'Not provided'}</span>
                </div>
                <div className="aif-review-item">
                  <span className="aif-review-label">Name:</span>
                  <span className="aif-review-value">{formData.name}</span>
                </div>
                <div className="aif-review-item">
                  <span className="aif-review-label">Type:</span>
                  <span className="aif-review-value">{appTypes.find(t => t.value === formData.type)?.label}</span>
                </div>
                <div className="aif-review-item">
                  <span className="aif-review-label">Target Audience:</span>
                  <span className="aif-review-value">{formData.targetAudience}</span>
                </div>
              </div>

              <div className="aif-review-section">
                <h4>Contact Information</h4>
                <div className="aif-review-item">
                  <span className="aif-review-label">Email:</span>
                  <span className="aif-review-value">{formData.email}</span>
                </div>
                <div className="aif-review-item">
                  <span className="aif-review-label">Company:</span>
                  <span className="aif-review-value">{formData.companyName || 'Not provided'}</span>
                </div>
                <div className="aif-review-item">
                  <span className="aif-review-label">Contact Name:</span>
                  <span className="aif-review-value">{formData.contactName}</span>
                </div>
                <div className="aif-review-item">
                  <span className="aif-review-label">Location:</span>
                  <span className="aif-review-value">{formData.location || 'Not provided'}</span>
                </div>
                <div className="aif-review-item">
                  <span className="aif-review-label">GitHub:</span>
                  <span className="aif-review-value">{formData.githubUrl || 'Not provided'}</span>
                </div>
                <div className="aif-review-item">
                  <span className="aif-review-label">Launch Date:</span>
                  <span className="aif-review-value">
                    {formData.launchDate 
                      ? new Date(formData.launchDate).toLocaleDateString() 
                      : 'Not specified'}
                  </span>
                </div>
              </div>

              <div className="aif-review-section">
                <h4>Features & Technology</h4>
                <div className="aif-review-item">
                  <span className="aif-review-label">Main Features:</span>
                  <div className="aif-features-list">
                    {formData.mainFeatures.length > 0 ? (
                      formData.mainFeatures.map(feature => (
                        <span key={feature} className="aif-feature-tag">
                          {feature}
                        </span>
                      ))
                    ) : (
                      <span className="aif-no-features">No features selected</span>
                    )}
                  </div>
                </div>
                <div className="aif-review-item">
                  <span className="aif-review-label">Tech Stack:</span>
                  <div className="aif-tech-list">
                    {formData.techStack.length > 0 ? (
                      formData.techStack.map(tech => (
                        <span key={tech} className="aif-tech-tag">
                          {tech}
                        </span>
                      ))
                    ) : (
                      <span className="aif-no-tech">No technologies selected</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderResults = () => {
    if (!analysisResult) return null;

    return (
      <div className="aif-results" ref={resultsRef}>
        <div className="aif-results-header">
          <h2>🎉 Analysis Complete!</h2>
          <p>Redirecting to detailed results page...</p>
          <div className="aif-results-meta">
            <span className="aif-timestamp">
              Generated: {new Date().toLocaleString()}
            </span>
            <span className="aif-sites-count">
              Analyzed {analysisResult.length} sites
            </span>
          </div>
        </div>

        <div className="aif-redirecting">
          <div className="aif-spinner-large"></div>
          <p>Taking you to the results page where you can see all analyzed sites...</p>
          <button 
            onClick={() => router.push('/results')}
            className="aif-btn aif-btn-primary"
          >
            Go to Results Now →
          </button>
        </div>
      </div>
    );
  };

  const isStepValid = () => {
    if (isLoading) return false;
    
    switch (currentStep) {
      case 1:
        return formData.name.trim().length >= 3;
      case 2:
        return formData.description.trim().length >= 50 && 
               formData.targetAudience.trim().length >= 10;
      case 3:
        return true;
      case 4:
        return validateEmail(formData.email) && 
               formData.contactName.trim().length >= 2;
      case 5:
        return true;
      default:
        return false;
    }
  };

  if (analysisResult) {
    return renderResults();
  }

  return (
    <div className="aif-wrapper">
      <div className="aif-container" ref={containerRef}>
        {/* Header */}
        <div className="aif-header">
          <button
            onClick={handleBack}
            className="aif-back-btn"
            disabled={isLoading}
          >
            <span>←</span>
            <span>Back</span>
          </button>
          <h1 className="aif-title">Tell us about your app</h1>
          <p className="aif-subtitle">
            Step {currentStep} of {steps.length}: {steps[currentStep - 1]?.description}
          </p>
        </div>

        {/* Progress Bar */}
        <FormProgress steps={steps} currentStep={currentStep} />

        {/* Form Content */}
        <div className="aif-content" ref={formRef}>
          {error && (
            <div className="aif-error-message">
              <span>⚠️ {error}</span>
              <button onClick={() => setError(null)} className="aif-error-close">×</button>
            </div>
          )}

          {renderStep()}

          {/* Navigation Buttons */}
          <div className="aif-navigation">
            <button
              onClick={handleBack}
              className="aif-btn aif-btn-back"
              disabled={isLoading}
            >
              {currentStep === 1 ? 'Back to Home' : 'Back'}
            </button>
            
            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="aif-btn aif-btn-next"
            >
              {isLoading ? (
                <>
                  <div className="aif-spinner"></div>
                  Analyzing...
                </>
              ) : currentStep === steps.length ? (
                'Get My Analysis →'
              ) : (
                'Continue →'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};