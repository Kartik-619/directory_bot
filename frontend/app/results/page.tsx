"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SiteGrid } from '.././component/home/SiteGrid';
import { SiteService } from '../services/siteService';
import './results.css';

// Define the structure for site analysis results
interface SiteAnalysis {
  siteUrl: string;
  siteName: string;
  questions: {
    id: number;
    question: string;
    answer: string;
  }[];
}

export default function ResultsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<SiteAnalysis[]>([]);
  const [appInfo, setAppInfo] = useState<any>(null);

  useEffect(() => {
    loadAnalysisResults();
  }, []);

  const loadAnalysisResults = async () => {
    try {
      setIsLoading(true);
      
      // Get saved analysis from localStorage
      const savedAnalysis = localStorage.getItem('app_analysis_results');
      if (!savedAnalysis) {
        throw new Error('No analysis results found. Please complete the analysis first.');
      }

      const parsed = JSON.parse(savedAnalysis);
      
      // Get the most recent analysis
      const latestAnalysis = parsed[0];
      
      if (!latestAnalysis || !latestAnalysis.analyses) {
        throw new Error('Invalid analysis data format.');
      }

      setAnalysisResults(latestAnalysis.analyses);
      setAppInfo(latestAnalysis.appInfo);
      
    } catch (err) {
      console.error('Error loading analysis:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analysis');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewAnalysis = () => {
    localStorage.removeItem('app_analysis_results');
    router.push('/');
  };

  const formatSiteForGrid = (siteAnalysis: SiteAnalysis) => ({
    url: siteAnalysis.siteUrl,
    name: siteAnalysis.siteName,
    analysis: siteAnalysis // Include the full analysis data
  });

  if (isLoading) {
    return (
      <div className="results-loading">
        <div className="spinner"></div>
        <p>Loading your analysis results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-error">
        <h2>⚠️ Error Loading Results</h2>
        <p>{error}</p>
        <button onClick={() => router.push('/')} className="action-btn">
          Start New Analysis
        </button>
      </div>
    );
  }

  return (
    <div className="results-page">
      <div className="results-header">
        <div className="header-content">
          <h1>🎯 Your Analysis Results</h1>
          <p className="subtitle">
            Insights for <strong>{appInfo?.name || 'Your App'}</strong>
            {appInfo?.targetAudience && ` targeting ${appInfo.targetAudience}`}
          </p>
        </div>
        
        <div className="app-info-summary">
          <div className="info-item">
            <span className="label">App Type:</span>
            <span className="value">{appInfo?.type || 'Not specified'}</span>
          </div>
          <div className="info-item">
            <span className="label">Features:</span>
            <span className="value">
              {appInfo?.mainFeatures?.slice(0, 3).join(', ') || 'None'}
              {appInfo?.mainFeatures?.length > 3 && '...'}
            </span>
          </div>
        </div>
      </div>

      <div className="results-stats">
        <div className="stat-card">
          <div className="stat-number">{analysisResults.length}</div>
          <div className="stat-label">Sites Analyzed</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {analysisResults.reduce((total, site) => total + site.questions.length, 0)}
          </div>
          <div className="stat-label">Questions Answered</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🤖</div>
          <div className="stat-label">AI-Powered Insights</div>
        </div>
      </div>

      <div className="sites-analysis-section">
        <h2>Site-Specific Analysis</h2>
        <p className="section-description">
          Each site was analyzed with questions specific to it. Click on any site to view detailed answers.
        </p>
        
        <div className="sites-grid-container">
          {analysisResults.map((siteAnalysis) => (
            <SiteAnalysisCard 
              key={siteAnalysis.siteUrl} 
              analysis={siteAnalysis} 
            />
          ))}
        </div>
      </div>

      <div className="results-actions">
        <button onClick={handleNewAnalysis} className="action-btn primary">
          🔄 Analyze Another App
        </button>
        <button onClick={() => window.print()} className="action-btn secondary">
          📄 Export Results
        </button>
      </div>
    </div>
  );
}

// Site Analysis Card Component (shows questions and answers)
interface SiteAnalysisCardProps {
  analysis: SiteAnalysis;
}

function SiteAnalysisCard({ analysis }: SiteAnalysisCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className={`site-analysis-card ${expanded ? 'expanded' : ''}`}>
      <div 
        className="card-header"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="site-icon-large">
          {SiteService.getSiteIcon(analysis.siteUrl)}
        </div>
        <div className="site-info">
          <h3>{analysis.siteName}</h3>
          <p className="site-url">{analysis.siteUrl}</p>
          <div className="questions-count">
            {analysis.questions.length} questions analyzed
          </div>
        </div>
        <div className="expand-icon">
          {expanded ? '−' : '+'}
        </div>
      </div>
      
      {expanded && (
        <div className="card-content">
          <div className="questions-list">
            {analysis.questions.map((q) => (
              <div key={q.id} className="question-item">
                <h4>Q{q.id}: {q.question}</h4>
                <div className="answer">
                  <p>{q.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}