"use client";

import { useState } from 'react';
import { AppInfo } from '../../types/onboarding';
import { FormProgress } from './FormProgress';

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

  const steps = [
    { id: 1, title: 'Basic Info', description: 'Tell us about your app' },
    { id: 2, title: 'Description', description: 'Describe your app' },
    { id: 3, title: 'Features & Tech', description: 'Key features and technology' },
    { id: 4, title: 'Review', description: 'Confirm your details' },
  ];

  const updateFormData = (field: keyof AppInfo, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      onSubmit(formData);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const toggleArrayItem = (array: string[], item: string): string[] => {
    return array.includes(item) 
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website URL *
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => updateFormData('url', e.target.value)}
                placeholder="https://yourapp.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                App Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="My Awesome App"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                App Type *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {appTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => updateFormData('type', type.value)}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      formData.type === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">{type.icon}</div>
                    <div className="font-medium text-gray-900">{type.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="Describe what your app does, its main purpose, and what problem it solves..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Audience *
              </label>
              <input
                type="text"
                value={formData.targetAudience}
                onChange={(e) => updateFormData('targetAudience', e.target.value)}
                placeholder="e.g., Small business owners, developers, students..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Main Features (Select all that apply)
              </label>
              <div className="space-y-2">
                {[
                  'User Authentication', 'Payment Processing', 'Dashboard/Analytics',
                  'Mobile Responsive', 'Social Media Integration', 'API Integration',
                  'Real-time Features', 'Admin Panel', 'Multi-language Support',
                  'E-commerce Functionality', 'Blog/Content Management', 'Search Functionality'
                ].map((feature) => (
                  <label key={feature} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.mainFeatures.includes(feature)}
                      onChange={() => updateFormData('mainFeatures', toggleArrayItem(formData.mainFeatures, feature))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{feature}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Technology Stack (Select technologies you use)
              </label>
              <div className="flex flex-wrap gap-2">
                {techOptions.map((tech) => (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => updateFormData('techStack', toggleArrayItem(formData.techStack, tech))}
                    className={`px-4 py-2 rounded-full border transition-all ${
                      formData.techStack.includes(tech)
                        ? 'bg-blue-100 border-blue-500 text-blue-700'
                        : 'bg-gray-100 border-gray-200 text-gray-700 hover:border-gray-300'
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
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-semibold text-blue-900 mb-4">Ready to analyze your app!</h3>
              <p className="text-blue-700">
                Based on your information, we'll provide personalized insights and recommendations 
                from our database of successful websites.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b">
                <span className="font-medium">URL:</span>
                <span>{formData.url}</span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span className="font-medium">Name:</span>
                <span>{formData.name}</span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span className="font-medium">Type:</span>
                <span>{appTypes.find(t => t.value === formData.type)?.label}</span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span className="font-medium">Target Audience:</span>
                <span>{formData.targetAudience}</span>
              </div>
              <div className="py-3 border-b">
                <span className="font-medium block mb-2">Main Features:</span>
                <div className="flex flex-wrap gap-1">
                  {formData.mainFeatures.map(feature => (
                    <span key={feature} className="px-2 py-1 bg-gray-100 rounded text-sm">
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
        return true; // Features and tech are optional
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 text-white/80 hover:text-white mb-4"
          >
            <span>←</span>
            <span>Back</span>
          </button>
          <h1 className="text-2xl font-bold">Tell us about your app</h1>
          <p className="text-blue-100 mt-1">
            Step {currentStep} of {steps.length}: {steps[currentStep - 1]?.description}
          </p>
        </div>

        {/* Progress Bar */}
        <FormProgress steps={steps} currentStep={currentStep} />

        {/* Form Content */}
        <div className="p-8">
          {renderStep()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              onClick={handleBack}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
            >
              {currentStep === 1 ? 'Back to Home' : 'Back'}
            </button>
            
            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
            >
              {currentStep === steps.length ? 'Get My Analysis →' : 'Continue →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};