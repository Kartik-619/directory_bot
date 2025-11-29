"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChatInterface } from '../../component/home/ChatInterface';

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

export default function SitePage() {
  const params = useParams();
  const router = useRouter();
  const [siteData, setSiteData] = useState<SiteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [answersGenerated, setAnswersGenerated] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Decode the URL from the route parameter
  const siteUrl = decodeURIComponent(params.url as string);

  const generateAnswers = async (isRegenerate = false) => {
    if (isRegenerate) {
      setRegenerating(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/generate-answers', {
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

      const data: SiteResult = await response.json();
      setSiteData(data);
      setAnswersGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error generating answers:', err);
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  };

  const getDisplayName = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace(/^www\./, '').split('.')[0];
    } catch {
      return url.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0];
    }
  };

  const handleRegenerate = () => {
    generateAnswers(true);
  };

  return (
    <div className="site-page">
      {/* Header */}
      <header className="site-header">
        <div className="header-content">
          <Link href="/" className="back-button">
            ← Back to Sites
          </Link>
          <div className="site-info">
            <h1 className="site-title">{getDisplayName(siteUrl)}</h1>
            <p className="site-url-display">{siteUrl}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="site-content">
        {/* Left Side - Generate Answers & Results */}
        <div className="content-main">
          {/* Generate Answers Section */}
          {!answersGenerated && (
            <div className="generate-section">
              <div className="generate-card">
                <div className="generate-icon">🚀</div>
                <h2>Generate AI-Powered Answers</h2>
                <p>Get instant AI-generated answers to common questions about this website. Our AI will analyze the site and provide comprehensive responses.</p>
                <button
                  onClick={() => generateAnswers(false)}
                  disabled={loading}
                  className={`generate-button ${loading ? 'loading' : ''}`}
                >
                  {loading ? (
                    <>
                      <div className="button-spinner"></div>
                      Generating Answers...
                    </>
                  ) : (
                    'Generate Answers'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="error-message">
              <div className="error-icon">⚠️</div>
              <div className="error-content">
                <strong>Error</strong>
                <p>{error}</p>
                <button onClick={() => generateAnswers(false)} className="retry-button">
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="loading-section">
              <div className="loading-content">
                <div className="loading-spinner-large"></div>
                <h3>Generating AI Answers</h3>
                <p>Analyzing the website and generating comprehensive answers...</p>
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          {/* Results Display */}
          {siteData && (
            <div className="results-section">
              <div className="results-header">
                <div className="results-title">
                  <h2>Generated Answers</h2>
                  <span className="results-count">{siteData.questions.length} questions answered</span>
                </div>
                <button 
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className={`regenerate-button ${regenerating ? 'loading' : ''}`}
                >
                  {regenerating ? (
                    <>
                      <div className="button-spinner"></div>
                      Regenerating...
                    </>
                  ) : (
                    '🔄 Regenerate All'
                  )}
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

        {/* Right Side - Chat Interface */}
        <div className="content-sidebar">
          <ChatInterface 
            siteUrl={siteUrl} 
            siteName={getDisplayName(siteUrl)}
          />
        </div>
      </div>
    </div>
  );
}

// Updated Question Card Component
function QuestionCard({ question }: { question: SiteQuestion }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className={`question-card ${expanded ? 'expanded' : ''}`}>
      <div 
        className="question-header"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="question-main">
          <span className="question-id">Q{question.id}</span>
          <h3 className="question-text">{question.question}</h3>
        </div>
        <div className="question-actions">
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(question.answer);
            }}
            className={`copy-button ${copied ? 'copied' : ''}`}
            title="Copy answer"
          >
            {copied ? '✓' : '📋'}
          </button>
          <div className="expand-icon">
            {expanded ? '−' : '+'}
          </div>
        </div>
      </div>
      
      {expanded && (
        <div className="answer-content">
          <div className="answer-section">
            <div className="answer-header">
              <strong>AI Answer:</strong>
              <button
                onClick={() => copyToClipboard(question.answer)}
                className={`copy-answer-button ${copied ? 'copied' : ''}`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="answer-text">{question.answer}</p>
          </div>

          {/* Sources */}
          {question.sources && question.sources.length > 0 && (
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
                      <span className="source-title">{source.title}</span>
                      <span className="source-url">{new URL(source.uri).hostname}</span>
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