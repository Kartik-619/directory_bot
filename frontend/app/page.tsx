'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, LinkIcon, AlertTriangle, Globe, ChevronDown } from 'lucide-react';

// Type definitions for the structured data
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

/**
 * Main component for the Next.js frontend page.
 */
export default function AnswerFetcherApp() {
    // State to store the available site URLs fetched initially
    const [availableSites, setAvailableSites] = useState<string[]>([]);
    // State for the currently selected site URL
    const [selectedSiteUrl, setSelectedSiteUrl] = useState<string>('');
    // State to hold the results for the selected site
    const [result, setResult] = useState<SiteResult | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isSitesLoading, setIsSitesLoading] = useState<boolean>(true);

    const BACKEND_URL = 'http://localhost:3001';

    // --- EFFECT: Fetch Available Sites on Mount ---
    useEffect(() => {
        const fetchSites = async () => {
            setIsSitesLoading(true);
            try {
                const response = await fetch(`${BACKEND_URL}/api/sites`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch site list from backend.');
                }

                const sites: string[] = await response.json();
                setAvailableSites(sites);
                if (sites.length > 0) {
                    setSelectedSiteUrl(sites[0]); // Auto-select the first site
                }
            } catch (err) {
                console.error('Failed to fetch sites:', err);
                setError(`Failed to load sites: ${err instanceof Error ? err.message : String(err)}. Check backend console.`);
            } finally {
                setIsSitesLoading(false);
            }
        };

        fetchSites();
    }, []);

    /**
     * Handles the button click, calls the Express backend to generate answers 
     * for the currently selected site only.
     */
    const handleGenerateAnswers = async () => {
        if (!selectedSiteUrl) {
            setError("Please select a company/site URL first.");
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch(`${BACKEND_URL}/api/generate-answers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Pass the single selected site URL in the body
                body: JSON.stringify({ siteUrl: selectedSiteUrl })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || errorData.error || 'Failed to fetch answers from backend.');
            }

            const data: SiteResult = await response.json();
            setResult(data);

        } catch (err) {
            console.error('Frontend Fetch Error:', err);
            setError(`Operation failed: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setLoading(false);
        }
    };

    const totalQuestions = result?.questions.length || 0;
    const isReady = !isSitesLoading && availableSites.length > 0;

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <header className="max-w-4xl mx-auto py-6">
                <h1 className="text-4xl font-extrabold text-gray-900 flex items-center">
                    <Sparkles className="w-8 h-8 text-indigo-600 mr-2" />
                    AI Startup Submission Assistant
                </h1>
                <p className="mt-2 text-lg text-gray-500">
                    Select a directory, generate AI-powered answers for its specific questions, and view grounded sources.
                </p>
            </header>

            <main className="max-w-4xl mx-auto bg-white shadow-xl rounded-xl p-6 sm:p-8">
                
                {/* Site Selector and Button */}
                <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                    {/* Site Selector Dropdown */}
                    <div className="relative w-full sm:w-2/3">
                        <select
                            value={selectedSiteUrl}
                            onChange={(e) => setSelectedSiteUrl(e.target.value)}
                            disabled={isSitesLoading || loading}
                            className={`w-full appearance-none border-2 p-3 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${isSitesLoading || availableSites.length === 0 ? 'bg-gray-100 text-gray-500' : 'bg-white border-gray-300'}`}
                        >
                            {isSitesLoading ? (
                                <option>Loading Sites...</option>
                            ) : availableSites.length === 0 ? (
                                <option>No Sites Found in Google Sheet</option>
                            ) : (
                                availableSites.map(url => (
                                    <option key={url} value={url}>{url}</option>
                                ))
                            )}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerateAnswers}
                        disabled={loading || !isReady}
                        className="w-full sm:w-1/3 px-6 py-3 text-lg font-semibold rounded-lg text-white transition-all duration-300
                                bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed
                                flex items-center justify-center shadow-lg hover:shadow-indigo-300/50"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        ) : (
                            <Sparkles className="w-5 h-5 mr-2" />
                        )}
                        {loading ? 'Generating...' : `Generate Answers (${totalQuestions} Qs)`}
                    </button>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="mt-8 text-center p-6 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <p className="text-indigo-700 font-medium">
                            Generating answers for **{selectedSiteUrl}**. Calling AI for each question sequentially...
                        </p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="mt-8 p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-start">
                        <AlertTriangle className="w-5 h-5 mt-1 mr-3 flex-shrink-0" />
                        <div>
                            <h3 className="font-bold text-lg">Error</h3>
                            <p className="text-sm break-all">{error}</p>
                        </div>
                    </div>
                )}

                {/* Results Display */}
                {result && (
                    <div className="mt-8">
                        <h2 className="text-2xl font-bold text-gray-800 border-b pb-3 mb-4">
                            Results for: <a href={`https://${result.siteUrl}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{result.siteUrl}</a>
                            <span className="text-base font-normal text-gray-500 ml-2">({result.questions.length} Questions)</span>
                        </h2>
                        <div className="space-y-6">
                            {result.questions.map((item, index) => (
                                <div key={index} className="p-5 border border-gray-200 rounded-lg shadow-md bg-white">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                                        <span className="text-indigo-600 mr-2">Q{item.id}:</span>
                                        {item.question}
                                    </h4>
                                    
                                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-md">
                                        <p className="text-md text-gray-700 whitespace-pre-wrap">{item.answer}</p>
                                    </div>

                                    {item.sources.length > 0 && (
                                        <div className="mt-3">
                                            <p className="text-xs font-semibold text-gray-500 mb-1">Grounded Sources:</p>
                                            <ul className="space-y-1 list-none p-0 m-0">
                                                {item.sources.map((source, idx) => (
                                                    <li key={idx} className="flex items-center text-xs text-gray-500 hover:text-indigo-600 transition-colors">
                                                        <LinkIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                                                        <a 
                                                            href={source.uri} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="truncate hover:underline"
                                                            title={source.title}
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
                    </div>
                )}

                {/* Initial/Empty State */}
                {!result && !loading && !error && (
                    <div className="mt-8 text-center p-12 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                        <Sparkles className="w-10 h-10 text-gray-400 mx-auto" />
                        <p className="mt-3 text-lg font-medium text-gray-600">
                            Select a site from the dropdown and click "Generate Answers" to begin!
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            The available sites are loaded from your linked Google Sheet.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}