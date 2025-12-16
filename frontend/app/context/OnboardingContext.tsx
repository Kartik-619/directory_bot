"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
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

export const OnboardingProvider = ({ children }: OnboardingProviderProps) => {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);

  useEffect(() => {
    const savedAppInfo = localStorage.getItem("directoryBot_appInfo");
    const savedOnboardingStatus = localStorage.getItem(
      "directoryBot_onboardingComplete"
    );

    if (savedAppInfo && savedOnboardingStatus === "true") {
      try {
        setAppInfo(JSON.parse(savedAppInfo));
        setIsOnboardingComplete(true);
      } catch {
        localStorage.removeItem("directoryBot_appInfo");
        localStorage.removeItem("directoryBot_onboardingComplete");
      }
    }
  }, []);

  const completeOnboarding = (newAppInfo: AppInfo) => {
    setAppInfo(newAppInfo);
    setIsOnboardingComplete(true);
    localStorage.setItem(
      "directoryBot_appInfo",
      JSON.stringify(newAppInfo)
    );
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
      value={{
        isOnboardingComplete,
        appInfo,
        completeOnboarding,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error(
      "useOnboarding must be used within an OnboardingProvider"
    );
  }
  return context;
};
