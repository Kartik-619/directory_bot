"use client";

import { useSites } from './hooks/useSites';
import { usePageAnimation } from './hooks/useAnimation';
import { Header } from './component/home/Header';
import { SiteGrid } from './component/home/SiteGrid';
import { LoadingState } from './component/home/LoadingState';
import { ErrorState } from './component/home/ErrorState';
import { ChatInterface } from './component/home/ChatInterface';

export default function Home() {
  const { sites, loading, error, refetch } = useSites();
  const { headerRef, gridRef } = usePageAnimation(sites, loading);

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="container">
      <Header
        ref={headerRef}
        title="Directory Bot"
        subtitle="Select a website to generate AI-powered answers and ease your startup launch!!"
      />

      {error && (
        <ErrorState message={error} onRetry={refetch} />
      )}

      <SiteGrid sites={sites} ref={gridRef} />

      {/* Global Chat Interface */}
      <ChatInterface />
    </div>
  );
}