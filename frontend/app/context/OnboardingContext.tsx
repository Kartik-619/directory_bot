// /app/context/OnboardingContext.tsx (FIXED)

"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { AppInfo } from "../types/onboarding";

interface OnboardingContextType {
  isOnboardingComplete: boolean;
  appInfo: AppInfo | null;
  completeOnboarding: (appInfo: AppInfo) => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

interface OnboardingProviderProps {
  children: ReactNode;
}

// Lazy initialization function for state
const getInitialAppInfo = (): AppInfo | null => {
  // FIX: Conditionally access localStorage only if 'window' is defined (i.e., we are on the client).
  if (typeof window === 'undefined') {
    return null; 
  }

  try {
    const savedAppInfo = localStorage.getItem("directoryBot_appInfo");
    const savedStatus = localStorage.getItem("directoryBot_onboardingComplete");
    if (savedAppInfo && savedStatus === "true") {
      // Direct parsing and returning the state value.
      return JSON.parse(savedAppInfo); 
    }
  } catch {
    // These calls are also now protected by the 'if (typeof window...' check
    localStorage.removeItem("directoryBot_appInfo");
    localStorage.removeItem("directoryBot_onboardingComplete");
  }
  return null;
};

export const OnboardingProvider = ({ children }: OnboardingProviderProps) => {
  // State initialization remains correct (lazy)
  const [appInfo, setAppInfo] = useState<AppInfo | null>(getInitialAppInfo);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(
    Boolean(getInitialAppInfo())
  );

  const completeOnboarding = (newAppInfo: AppInfo) => {
    setAppInfo(newAppInfo);
    setIsOnboardingComplete(true);
    // FIX: Add check to all setters if they are called during SSR/Prerendering,
    // though in a client component event handler like this, it's safer but often not strictly necessary.
    // However, for consistency and safety:
    if (typeof window !== 'undefined') {
      localStorage.setItem("directoryBot_appInfo", JSON.stringify(newAppInfo));
      localStorage.setItem("directoryBot_onboardingComplete", "true");
    }
  };

  const resetOnboarding = () => {
    setAppInfo(null);
    setIsOnboardingComplete(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem("directoryBot_appInfo");
      localStorage.removeItem("directoryBot_onboardingComplete");
    }
  };

  return (
    <OnboardingContext.Provider
      value={{ isOnboardingComplete, appInfo, completeOnboarding, resetOnboarding }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};