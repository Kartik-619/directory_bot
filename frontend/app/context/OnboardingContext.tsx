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
  try {
    const savedAppInfo = localStorage.getItem("directoryBot_appInfo");
    const savedStatus = localStorage.getItem("directoryBot_onboardingComplete");
    if (savedAppInfo && savedStatus === "true") {
      // Direct parsing and returning the state value.
      return JSON.parse(savedAppInfo); 
    }
  } catch {
    localStorage.removeItem("directoryBot_appInfo");
    localStorage.removeItem("directoryBot_onboardingComplete");
  }
  return null;
};

export const OnboardingProvider = ({ children }: OnboardingProviderProps) => {
  // FIX: State initialization is done lazily here, 
  // so no useEffect is needed, resolving the error.
  const [appInfo, setAppInfo] = useState<AppInfo | null>(getInitialAppInfo);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(
    Boolean(getInitialAppInfo())
  );

  const completeOnboarding = (newAppInfo: AppInfo) => {
    setAppInfo(newAppInfo);
    setIsOnboardingComplete(true);
    localStorage.setItem("directoryBot_appInfo", JSON.stringify(newAppInfo));
    localStorage.setItem("directoryBot_onboardingComplete", "true");
  };

  const resetOnboarding = () => {
    setAppInfo(null);
    setIsOnboardingComplete(false);
    localStorage.removeItem("directoryBot_appInfo");
    localStorage.removeItem("directoryBot_onboardingComplete");
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
