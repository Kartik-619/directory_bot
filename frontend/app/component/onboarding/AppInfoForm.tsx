"use client";

import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { AppInfo } from '../../types/onboarding';
import { FormProgress } from './FormProgress';
import './AppInfoForm.css';

interface AppInfoFormProps {
  onSubmit: (appInfo: AppInfo) => Promise<void>;
  onBack: () => void;
}

interface AnalysisResult {
  siteUrl: string;
  questions: {
    id: number;
    question: string;
    answer: string;
    sources: { uri: string; title: string }[];
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
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [formData, setFormData] = useState<AppInfo>({
    url: '',
    name: '',
    type: 'webapp',
    description: '',
    targetAudience: '',
    mainFeatures: [],
    techStack: [],
  });

  const formRef = useRef<HTMLDivElement>(null);
  const stepContentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const steps = [
    { id: 1, title: 'Basic Info', description: 'Tell us about your app' },
    { id: 2, title: 'Description', description: 'Describe your app' },
    { id: 3, title: 'Features & Tech', description: 'Key features and technology' },
    { id: 4, title: 'Review', description: 'Confirm your details' },
  ];

  // GSAP Animations
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

  // Animate results when they appear
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

  const updateFormData = (field: keyof AppInfo, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🚀 Submitting app info for analysis:', formData);
      
      const response = await fetch('http://localhost:3003/api/generate-custom-answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appInfo: formData }),
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Analysis received:', result);
      setAnalysisResult(result);
      
    } catch (err) {
      console.error('❌ Analysis error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate analysis';
      setError(errorMessage);
      
      // Show error animation
      if (stepContentRef.current) {
        gsap.fromTo(stepContentRef.current,
          {
            x: 0
          },
          {
            x: [10, -10, 10, -10, 0],
            duration: 0.4,
            ease: "power2.out"
          }
        );
      }
    } finally {
      setIsLoading(false);
    }
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
      {
        scale: 1
      },
      {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1
      }
    );
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
            </div>
          </div>
        );

      case 4:
        return (
          <div className="aif-step-content" ref={stepContentRef}>
            <div className="aif-review-alert">
              <h3>Ready to analyze your app!</h3>
              <p>
                Based on your information, we'll provide personalized insights and recommendations 
                from our database of successful websites.
              </p>
            </div>

            <div className="aif-review-list">
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
          <h2>🎉 Your Analysis is Ready!</h2>
          <p>Personalized insights for <strong>{formData.name}</strong></p>
        </div>

        <div className="aif-analysis-questions">
          {analysisResult.questions.map((item, index) => (
            <div key={item.id} className="aif-analysis-item">
              <div className="aif-question-card">
                <h3>Q{index + 1}: {item.question}</h3>
                <div className="aif-answer">
                  <p>{item.answer}</p>
                </div>
                {item.sources && item.sources.length > 0 && (
                  <div className="aif-sources">
                    <strong>Sources:</strong>
                    <div className="aif-sources-list">
                      {item.sources.map((source, idx) => (
                        <a key={idx} href={source.uri} target="_blank" rel="noopener noreferrer" className="aif-source-link">
                          {source.title || source.uri}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="aif-results-actions">
          <button onClick={handleNewAnalysis} className="aif-btn aif-btn-primary">
            🔄 Analyze Another App
          </button>
        </div>
      </div>
    );
  };

  const isStepValid = () => {
    if (isLoading) return false;
    
    switch (currentStep) {
      case 1:
        return formData.name.trim().length > 0;
      case 2:
        return formData.description.trim().length > 0 && formData.targetAudience.trim().length > 0;
      case 3:
        return true;
      case 4:
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