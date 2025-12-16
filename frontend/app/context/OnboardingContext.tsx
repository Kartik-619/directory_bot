"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppInfo } from '../types/onboarding';

interface OnboardingContextType {
  isOnboardingComplete: boolean;
  appInfo: AppInfo | null;
  completeOnboarding: (appInfo: AppInfo) => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider = ({ children }: OnboardingProviderProps) => {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load onboarding state from localStorage on mount
  useEffect(() => {
    const savedAppInfo = localStorage.getItem('directoryBot_appInfo');
    const savedOnboardingStatus = localStorage.getItem('directoryBot_onboardingComplete');
    
    if (savedAppInfo && savedOnboardingStatus === 'true') {
      try {
        const parsedAppInfo = JSON.parse(savedAppInfo);
        setAppInfo(parsedAppInfo);
        setIsOnboardingComplete(true);
      } catch (error) {
        console.error('Error parsing saved app info:', error);
        // Clear corrupted data
        localStorage.removeItem('directoryBot_appInfo');
        localStorage.removeItem('directoryBot_onboardingComplete');
      }
    }
    
    setIsInitialized(true);
  }, []);

  const completeOnboarding = (newAppInfo: AppInfo) => {
    setAppInfo(newAppInfo);
    setIsOnboardingComplete(true);
    
    // Save to localStorage
    localStorage.setItem('directoryBot_appInfo', JSON.stringify(newAppInfo));
    localStorage.setItem('directoryBot_onboardingComplete', 'true');
  };

  const resetOnboarding = () => {
    setAppInfo(null);
    setIsOnboardingComplete(false);
    
    // Clear localStorage
    localStorage.removeItem('directoryBot_appInfo');
    localStorage.removeItem('directoryBot_onboardingComplete');
  };

  return (
    <OnboardingContext.Provider value={{
      isOnboardingComplete,
      appInfo,
      completeOnboarding,
      resetOnboarding
    }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};