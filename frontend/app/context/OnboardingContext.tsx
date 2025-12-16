"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useSyncExternalStore } from 'react';
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

// Create a store for localStorage synchronization
const createOnboardingStore = () => {
  let appInfo: AppInfo | null = null;
  let isOnboardingComplete = false;
  let listeners: (() => void)[] = [];

  const loadFromStorage = () => {
    const savedAppInfo = localStorage.getItem('directoryBot_appInfo');
    const savedOnboardingStatus = localStorage.getItem('directoryBot_onboardingComplete');
    
    if (savedAppInfo && savedOnboardingStatus === 'true') {
      try {
        appInfo = JSON.parse(savedAppInfo);
        isOnboardingComplete = true;
      } catch (error) {
        console.error('Error parsing saved app info:', error);
        localStorage.removeItem('directoryBot_appInfo');
        localStorage.removeItem('directoryBot_onboardingComplete');
        appInfo = null;
        isOnboardingComplete = false;
      }
    }
  };

  // Initial load
  if (typeof window !== 'undefined') {
    loadFromStorage();
  }

  return {
    getAppInfo: () => appInfo,
    getIsOnboardingComplete: () => isOnboardingComplete,
    setAppInfo: (newAppInfo: AppInfo | null) => {
      appInfo = newAppInfo;
      listeners.forEach(listener => listener());
    },
    setIsOnboardingComplete: (complete: boolean) => {
      isOnboardingComplete = complete;
      listeners.forEach(listener => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.push(listener);
      return () => {
        listeners = listeners.filter(l => l !== listener);
      };
    }
  };
};

const onboardingStore = createOnboardingStore();

export const OnboardingProvider = ({ children }: OnboardingProviderProps) => {
  const appInfo = useSyncExternalStore(
    onboardingStore.subscribe,
    onboardingStore.getAppInfo
  );
  
  const isOnboardingComplete = useSyncExternalStore(
    onboardingStore.subscribe,
    onboardingStore.getIsOnboardingComplete
  );

  const completeOnboarding = (newAppInfo: AppInfo) => {
    onboardingStore.setAppInfo(newAppInfo);
    onboardingStore.setIsOnboardingComplete(true);
    
    // Save to localStorage
    localStorage.setItem('directoryBot_appInfo', JSON.stringify(newAppInfo));
    localStorage.setItem('directoryBot_onboardingComplete', 'true');
  };

  const resetOnboarding = () => {
    onboardingStore.setAppInfo(null);
    onboardingStore.setIsOnboardingComplete(false);
    
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