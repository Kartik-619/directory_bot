"use client";

import { useState, useEffect } from 'react';

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

export default function Home() {
  const [sites, setSites] = useState<string[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [siteData, setSiteData] = useState<SiteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Fetch available sites on component mount
  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      setError('');
      const response = await fetch('http://localhost:3001/api/sites');
      if (!response.ok) {
        throw new Error('Failed to fetch sites');
      }
      const data = await response.json();
      setSites(data);
    } catch (err) {
      setError('Error loading sites. Make sure the backend is running.');
      console.error('Error fetching sites:', err);
    }
  };

  const generateAnswers = async () => {
    if (!selectedSite) {
      setError('Please select a site first');
      return;
    }

    setLoading(true);
    setError('');
    setSiteData(null);

    try {
      const response = await fetch('http://localhost:3001/api/generate-answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ siteUrl: selectedSite }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate answers');
      }

      const data: SiteResult = await response.json();
      setSiteData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error generating answers:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem', color: '#333' }}>
        AI Research Assistant
      </h1>

      {/* Site Selection */}
      <div style={{ marginBottom: '2rem' }}>
        <label htmlFor="site-select" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Select a Site:
        </label>
        <select
          id="site-select"
          value={selectedSite}
          onChange={(e) => setSelectedSite(e.target.value)}
          style={{
            padding: '0.5rem',
            width: '100%',
            maxWidth: '400px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '1rem',
          }}
          disabled={loading}
        >
          <option value="">Choose a site...</option>
          {sites.map((site) => (
            <option key={site} value={site}>
              {site}
            </option>
          ))}
        </select>
      </div>

      {/* Generate Button */}
      <button
        onClick={generateAnswers}
        disabled={loading || !selectedSite}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: loading ? '#ccc' : '#007acc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '1rem',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '2rem',
        }}
      >
        {loading ? 'Generating Answers...' : 'Generate Answers'}
      </button>

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#ffebee',
          border: '1px solid #f44336',
          borderRadius: '4px',
          color: '#c62828',
          marginBottom: '2rem',
        }}>
          {error}
        </div>
      )}

      {/* Results Display */}
      {siteData && (
        <div>
          <h2 style={{ marginBottom: '1rem', color: '#333' }}>
            Results for: {siteData.siteUrl}
          </h2>
          
          {siteData.questions.map((questionItem) => (
            <div
              key={questionItem.id}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                backgroundColor: '#fafafa',
              }}
            >
              <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>
                Q{questionItem.id}: {questionItem.question}
              </h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <strong>Answer:</strong>
                <p style={{ 
                  margin: '0.5rem 0 0 0', 
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap'
                }}>
                  {questionItem.answer}
                </p>
              </div>

              {/* Sources */}
              {questionItem.sources.length > 0 && (
                <div>
                  <strong>Sources:</strong>
                  <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
                    {questionItem.sources.map((source, index) => (
                      <li key={index} style={{ marginBottom: '0.5rem' }}>
                        <a
                          href={source.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#007acc', textDecoration: 'none' }}
                        >
                          {source.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div>Generating AI answers... This may take a moment.</div>
        </div>
      )}
    </div>
  );
}