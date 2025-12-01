"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from './context/OnboardingContext';
import { HeroSection } from './component/onboarding/HeroSection';
import { AppInfoForm } from './component/onboarding/AppInfoForm';
import { AppInfo } from './types/onboarding';

export default function Home() {
  const router = useRouter();
  const { isOnboardingComplete, appInfo, completeOnboarding, resetOnboarding } = useOnboarding();
  const [showForm, setShowForm] = useState(false);

  // Redirect to dashboard if onboarding is complete
  useEffect(() => {
    if (isOnboardingComplete && appInfo) {
      router.push('/dashboard');
    }
  }, [isOnboardingComplete, appInfo, router]);

  const handleGetStarted = () => {
    setShowForm(true);
  };

  const handleFormSubmit = (formData: AppInfo) => {
    completeOnboarding(formData);
    setShowForm(false);
    // Redirect will happen automatically via useEffect
  };

  const handleBackToHero = () => {
    setShowForm(false);
  };

  // Show onboarding flow if not completed
  if (!isOnboardingComplete) {
    if (showForm) {
      return (
        <AppInfoForm 
          onSubmit={handleFormSubmit}
          onBack={handleBackToHero}
        />
      );
    }
    
    return <HeroSection onGetStarted={handleGetStarted} />;
  }

  // Show loading while redirecting to dashboard
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="loading-spinner"></div>
        <p className="text-gray-600 mt-4">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}