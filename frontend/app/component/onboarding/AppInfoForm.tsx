"use client";

import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { AppInfo } from '../../types/onboarding';
import { FormProgress } from './FormProgress';
import './AppInfoForm.css';

interface AppInfoFormProps {
  onSubmit: (appInfo: AppInfo) => void;
  onBack: () => void;
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

  const updateFormData = (field: keyof AppInfo, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      // Animate out current step
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
      onSubmit(formData);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      // Animate out current step
      if (stepContentRef.current) {
        gsap.to(stepContentRef.current, {
          opacity: 0,
          x: 50,
          duration: 0.3,
          ease: "power2.in",
          onComplete: () => {
            setCurrentStep(currentStep - 1);
          }
        });
      } else {
        setCurrentStep(currentStep - 1);
      }
    } else {
      onBack();
    }
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
              <label className="aif-label">Website URL *</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => updateFormData('url', e.target.value)}
                placeholder="https://yourapp.com"
                className="aif-input"
                required
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
                <span className="aif-review-value">{formData.url}</span>
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
                  {formData.mainFeatures.map(feature => (
                    <span key={feature} className="aif-feature-tag">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.url && formData.name;
      case 2:
        return formData.description && formData.targetAudience;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="aif-wrapper">
      <div className="aif-container" ref={containerRef}>
        {/* Header */}
        <div className="aif-header">
          <button
            onClick={handleBack}
            className="aif-back-btn"
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
          {renderStep()}

          {/* Navigation Buttons */}
          <div className="aif-navigation">
            <button
              onClick={handleBack}
              className="aif-btn aif-btn-back"
            >
              {currentStep === 1 ? 'Back to Home' : 'Back'}
            </button>
            
            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="aif-btn aif-btn-next"
            >
              {currentStep === steps.length ? 'Get My Analysis →' : 'Continue →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};