"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOnboarding } from '../../context/OnboardingContext';
import { SiteService } from '../../services/siteService';

// Define the interfaces locally since they might differ from SiteService
interface SiteQuestion {
  id: number;
  question: string;
  answer: string;
  sources: { uri: string; title: string }[];
}

interface SiteResult {
  siteUrl: string;
  questions: SiteQuestion[];
}

// Interface for the custom answers response
interface CustomAnswersResponse {
  appInfo: any; // You might want to define a proper type
  analyses: {
    siteUrl: string;
    siteName: string;
    questions: Array<{
      id: number;
      question: string;
      answer: string;
    }>;
  }[];
  timestamp: string;
}

export default function SitePage() {
  const params = useParams();
  
  const { appInfo } = useOnboarding();
  const [siteData, setSiteData] = useState<SiteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [answersGenerated, setAnswersGenerated] = useState(false);

  // Decode the URL from the route parameter
  const siteUrl = decodeURIComponent(params.url as string);
  
  // Check if this is a custom analysis
  const isCustomAnalysis = siteUrl.startsWith('custom-analysis-') || 
                          (appInfo && siteUrl.includes(appInfo.name.toLowerCase().replace(/\s+/g, '-')));

  const generateAnswers = async () => {
    setLoading(true);
    setError('');

    try {
      let data: SiteResult;
      
      if (isCustomAnalysis && appInfo) {
        // Use custom analysis endpoint - returns multiple sites
        const customResponse = await SiteService.generateCustomAnswers(appInfo);
        
        // Find the site that matches our current URL or use the first one
        // Since custom analysis returns multiple sites, we need to select one
        const matchedSite = customResponse.analyses.find(
          analysis => analysis.siteUrl === siteUrl || 
                     analysis.siteName.toLowerCase().includes(appInfo.name.toLowerCase())
        ) || customResponse.analyses[0]; // Fallback to first site
        
        if (!matchedSite) {
          throw new Error('No site data found in custom analysis response');
        }
        
        // Convert the response format to match SiteResult
        data = {
          siteUrl: matchedSite.siteUrl,
          questions: matchedSite.questions.map(q => ({
            ...q,
            sources: [] // Add empty sources array if not present
          }))
        };
      } else {
        // Use regular site analysis endpoint
        const response = await fetch('http://localhost:3003/api/generate-answers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ siteUrl }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate answers');
        }

        data = await response.json();
      }

      setSiteData(data);
      setAnswersGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error generating answers:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (url: string): string => {
    if (isCustomAnalysis && appInfo) {
      return `${appInfo.name} - Custom Analysis`;
    }
    
    try {
      const domain = new URL(url).hostname;
      return domain.replace(/^www\./, '');
    } catch {
      return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    }
  };

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <Link href="/" className="back-button">
          ← Back to Sites
        </Link>
        <h1 className="title">{getDisplayName(siteUrl)}</h1>
        {isCustomAnalysis && appInfo ? (
          <div className="app-info">
            <p className="app-type">{appInfo.type.toUpperCase()} Application</p>
            <p className="app-description">{appInfo.description}</p>
            <p className="app-audience">Target Audience: {appInfo.targetAudience}</p>
          </div>
        ) : (
          <p className="site-url">{siteUrl}</p>
        )}
      </header>

      {/* Generate Answers Section */}
      {!answersGenerated && (
        <div className="generate-section">
          <div className="generate-card">
            <h2>Generate AI Answers</h2>
            <p>
              {isCustomAnalysis && appInfo 
                ? `Generate personalized insights and recommendations for ${appInfo.name} based on your app profile.`
                : 'Click the button below to generate AI-powered answers for all questions about this site.'
              }
            </p>
            <button
              onClick={generateAnswers}
              disabled={loading}
              className="generate-button"
            >
              {loading ? 'Generating Answers...' : 'Generate Answers'}
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-section">
          <div className="loading-spinner"></div>
          <p>Generating AI answers... This may take a moment.</p>
        </div>
      )}

      {/* Results Display */}
      {siteData && (
        <div className="results-section">
          <div className="results-header">
            <h2>Generated Answers</h2>
            <button 
              onClick={generateAnswers}
              disabled={loading}
              className="regenerate-button"
            >
              Regenerate All
            </button>
          </div>
          
          <div className="questions-grid">
            {siteData.questions.map((questionItem) => (
              <QuestionCard 
                key={questionItem.id} 
                question={questionItem} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Question Card Component
function QuestionCard({ question }: { question: SiteQuestion }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`question-card ${expanded ? 'expanded' : ''}`}>
      <div 
        className="question-header"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="question-text">Q{question.id}: {question.question}</h3>
        <div className="expand-icon">
          {expanded ? '−' : '+'}
        </div>
      </div>
      
      {expanded && (
        <div className="answer-content">
          <div className="answer-section">
            <strong>Answer:</strong>
            <p className="answer-text">{question.answer}</p>
          </div>

          {/* Sources */}
          {question.sources.length > 0 && (
            <div className="sources-section">
              <strong>Sources:</strong>
              <ul className="sources-list">
                {question.sources.map((source, index) => (
                  <li key={index} className="source-item">
                    <a
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="source-link"
                    >
                      {source.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}