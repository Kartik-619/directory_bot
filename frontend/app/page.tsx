"use client";

import { useState, useEffect } from 'react';
import { useOnboarding } from './context/OnboardingContext';
import { useSites } from './hooks/useSites';
import { usePageAnimation } from './hooks/useAnimation';
import { Header } from './component/home/Header';
import { SiteGrid } from './component/home/SiteGrid';
import { LoadingState } from './component/home/LoadingState';
import { ErrorState } from './component/home/ErrorState';
import { HeroSection } from './component/onboarding/HeroSection';
import { AppInfoForm } from './component/onboarding/AppInfoForm';
import { AppInfo } from './types/onboarding';
import { Site } from './types/site';

export default function Home() {
  const { isOnboardingComplete, appInfo, completeOnboarding, resetOnboarding } = useOnboarding();
  const [showForm, setShowForm] = useState(false);
  const [customSites, setCustomSites] = useState<Site[]>([]);
  const { sites, loading, error, refetch } = useSites();
  const { headerRef, gridRef } = usePageAnimation(customSites.length > 0 ? customSites : sites, loading);

  // Create custom sites based on app info
  useEffect(() => {
    if (isOnboardingComplete && appInfo) {
      const userAppSite: Site = {
        url: appInfo.url || `custom-analysis-${appInfo.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: `${appInfo.name} - Custom Analysis`
      };

      // Add some related sites based on app type
      const relatedSites: Site[] = [];
      
      if (appInfo.type === 'saas') {
        relatedSites.push(
          { url: 'https://stripe.com', name: 'Stripe - Payment Processing' },
          { url: 'https://slack.com', name: 'Slack - Team Communication' }
        );
      } else if (appInfo.type === 'ecommerce') {
        relatedSites.push(
          { url: 'https://shopify.com', name: 'Shopify - E-commerce Platform' },
          { url: 'https://amazon.com', name: 'Amazon - Marketplace' }
        );
      } else if (appInfo.type === 'blog') {
        relatedSites.push(
          { url: 'https://medium.com', name: 'Medium - Publishing Platform' },
          { url: 'https://wordpress.com', name: 'WordPress - CMS' }
        );
      }

      setCustomSites([userAppSite, ...relatedSites, ...sites.slice(0, 3)]);
    }
  }, [isOnboardingComplete, appInfo, sites]);

  const handleGetStarted = () => {
    setShowForm(true);
  };

  const handleFormSubmit = (formData: AppInfo) => {
    completeOnboarding(formData);
    setShowForm(false);
  };

  const handleBackToHero = () => {
    setShowForm(false);
  };

  const handleResetOnboarding = () => {
    resetOnboarding();
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

  // Show main directory interface after onboarding
  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="container">
      <Header
        ref={headerRef}
        title={`Directory Bot - ${appInfo?.name || 'Your App'}`}
        subtitle={`AI-powered insights for ${appInfo?.type || 'your'} application. Get personalized recommendations based on your app profile!`}
      />

      {/* Add reset button for testing */}
      <div className="mb-4 text-center">
        <button
          onClick={handleResetOnboarding}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Reset Onboarding (for testing)
        </button>
      </div>

      {error && (
        <ErrorState message={error} onRetry={refetch} />
      )}

      <SiteGrid ref={gridRef} sites={customSites.length > 0 ? customSites : sites} />
    </div>
  );
}