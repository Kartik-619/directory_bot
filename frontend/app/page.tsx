"use client";

import { useState, useEffect } from 'react';
import { useOnboarding } from './context/OnboardingContext';
import { useSites } from './hooks/useSites';
import { HeroSection } from './component/onboarding/HeroSection';
import { AppInfoForm } from './component/onboarding/AppInfoForm';
import { AppInfo } from './types/onboarding';
import { Site } from './types/site';
 // Create this file for styles

export default function Home() {
  const { isOnboardingComplete, appInfo, completeOnboarding, resetOnboarding } = useOnboarding();
  const [showForm, setShowForm] = useState(false);
  const { sites, loading, error, refetch } = useSites();

  // Create custom analysis based on app info - no hardcoded sites
  useEffect(() => {
    if (isOnboardingComplete && appInfo) {
      console.log('Onboarding complete with app:', appInfo);
      // You can use this to show results later
    }
  }, [isOnboardingComplete, appInfo]);

  const handleGetStarted = () => {
    setShowForm(true);
  };

  const handleFormSubmit = async (formData: AppInfo) => {
    await completeOnboarding(formData);
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
        <div className="app-info-form-container">
          <AppInfoForm 
            onSubmit={handleFormSubmit}
            onBack={handleBackToHero}
          />
        </div>
      );
    }
    
    return (
      <div className="hero-container">
        <HeroSection onGetStarted={handleGetStarted} />
      </div>
    );
  }

  // Show main directory interface after onboarding
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your analysis...</p>
      </div>
    );
  }

  // After onboarding, show results page
  return (
    <div className="results-page">
      <div className="results-container">
        <div className="results-header">
          <h1>🎉 Analysis Complete!</h1>
          <p className="subtitle">Your personalized insights for <strong>{appInfo?.name}</strong></p>
          
          <div className="app-info-card">
            <div className="app-info-header">
              <h3>Your App Info</h3>
              <button 
                onClick={handleResetOnboarding}
                className="edit-btn"
              >
                Edit
              </button>
            </div>
            
            <div className="app-details">
              <div className="detail-row">
                <span className="label">Type:</span>
                <span className="value">{appInfo?.type}</span>
              </div>
              <div className="detail-row">
                <span className="label">Audience:</span>
                <span className="value">{appInfo?.targetAudience}</span>
              </div>
              {appInfo?.url && (
                <div className="detail-row">
                  <span className="label">URL:</span>
                  <a href={appInfo.url} target="_blank" rel="noopener noreferrer" className="value link">
                    {appInfo.url}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="results-actions">
          <button 
            onClick={() => console.log('View analysis')}
            className="action-btn primary"
          >
            View Your AI Analysis
          </button>
          
          <button 
            onClick={handleResetOnboarding}
            className="action-btn secondary"
          >
            Analyze Another App
          </button>
        </div>

        <div className="features-preview">
          <h3>What's next?</h3>
          <div className="features-grid">
            <div className="feature-preview">
              <div className="feature-icon">📊</div>
              <h4>Personalized Insights</h4>
              <p>Get AI-powered recommendations specific to your app</p>
            </div>
            <div className="feature-preview">
              <div className="feature-icon">🎯</div>
              <h4>Growth Strategies</h4>
              <p>Actionable tips to improve your application</p>
            </div>
            <div className="feature-preview">
              <div className="feature-icon">🔍</div>
              <h4>Competitive Analysis</h4>
              <p>Learn from similar successful websites</p>
            </div>
          </div>
        </div>

        <div className="back-to-landing">
          <button 
            onClick={handleResetOnboarding}
            className="back-btn"
          >
            ← Start Over
          </button>
        </div>
      </div>
    </div>
  );
}