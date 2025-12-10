"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const [selectedSite, setSelectedSite] = useState<SiteAnalysis | null>(null);

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

  const getSiteDomain = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return url.replace(/^https?:\/\//, '').split('/')[0];
    }
  };

  const getSiteInitial = (siteName: string): string => {
    return siteName.charAt(0).toUpperCase();
  };

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
        <button onClick={() => router.push('/')} className="action-btn primary">
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
          Click on any site card to view detailed answers. Each site was analyzed with questions specific to it.
        </p>
        
        <div className="sites-grid-container">
          {analysisResults.map((siteAnalysis) => (
            <div 
              key={siteAnalysis.siteUrl} 
              className={`site-grid-card ${selectedSite?.siteUrl === siteAnalysis.siteUrl ? 'active' : ''}`}
              onClick={() => setSelectedSite(siteAnalysis)}
            >
              <div className="site-icon">
                {getSiteInitial(siteAnalysis.siteName)}
              </div>
              <div className="site-info">
                <h3 className="site-domain">{getSiteDomain(siteAnalysis.siteUrl)}</h3>
                <p className="site-url">{siteAnalysis.siteUrl}</p>
                <span className="questions-badge">
                  {siteAnalysis.questions.length} questions
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Questions Modal */}
      {selectedSite && (
        <div className="questions-modal-overlay" onClick={() => setSelectedSite(null)}>
          <div className="questions-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-content">
                <div className="modal-site-icon">
                  {getSiteInitial(selectedSite.siteName)}
                </div>
                <div className="modal-site-info">
                  <h2>{selectedSite.siteName}</h2>
                  <p className="modal-site-url">{selectedSite.siteUrl}</p>
                  <span className="questions-badge">
                    {selectedSite.questions.length} questions analyzed
                  </span>
                </div>
              </div>
              <button 
                className="close-modal-btn"
                onClick={() => setSelectedSite(null)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="modal-questions-list">
                {selectedSite.questions.map((q) => (
                  <div key={q.id} className="modal-question-item">
                    <h3>
                      <span>Q{q.id}:</span> {q.question}
                    </h3>
                    <div className="modal-answer">
                      <p>{q.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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