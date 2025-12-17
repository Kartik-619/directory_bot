"use client";

import { OnboardingProvider } from "./context/OnboardingContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return <OnboardingProvider>{children}</OnboardingProvider>;
}
