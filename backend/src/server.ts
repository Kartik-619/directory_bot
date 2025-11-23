import express, { Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const SHEETS_RANGE = 'Sheet1!A:B'; // Assuming URL in Column A, Questions in Column B

// --- Setup Middlewares ---
app.use(cors({
    origin: 'http://localhost:3000' // Allow Next.js frontend to access
}));
app.use(express.json());

// Type definitions
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
 * Fetches all raw data from Google Sheets (URLs and Questions) and structures it.
 * This is used internally by both the /sites and /generate-answers endpoints.
 */
async function fetchAllSiteData(): Promise<SiteResult[]> {
    if (!GOOGLE_SHEET_ID || !GOOGLE_API_KEY) {
        console.error("Missing GOOGLE_SHEET_ID or GOOGLE_API_KEY in .env");
        throw new Error("Missing Google Sheets credentials. Cannot fetch data.");
    }

    const sheetsApiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${SHEETS_RANGE}?key=${GOOGLE_API_KEY}`;
    
    try {
        const response = await axios.get(sheetsApiUrl);
        
        if (response.status !== 200) {
            throw new Error(`Sheets API call failed: ${response.status} - ${response.statusText}`);
        }
        
        const data = response.data;
        const rawRows = data.values;
        // Skip header row
        const dataRows = rawRows ? rawRows.slice(1) : []; 
        
        const siteData: SiteResult[] = [];

        dataRows.forEach((row: string[], rowIndex: number) => {
            const siteUrl = row[0] ? String(row[0]).trim() : `Unknown Site ${rowIndex + 1}`;
            const questionsString = row[1] ? String(row[1]).trim() : '';

            if (questionsString) {
                const questionsArray = questionsString.split(',')
                    .map(q => q.trim())
                    .filter(q => q.length > 0);

                const newQuestions: SiteQuestion[] = questionsArray.map((q, qIndex) => ({
                    id: qIndex + 1,
                    question: q,
                    answer: '', 
                    sources: [], 
                }));

                // Instead of pushing multiple entries for the same site, this version creates a unique list of site questions.
                // Since the sheet format implies one row per site, this is fine, but we return SiteResult[].
                siteData.push({
                    siteUrl: siteUrl,
                    questions: newQuestions,
                });
            }
        });
        return siteData;

    } catch (error) {
        console.error("Error fetching Google Sheet data:", error);
        if (axios.isAxiosError(error)) {
            throw new Error(`Google Sheets error: ${error.response?.status} - ${error.response?.data}`);
        }
        throw new Error(`Google Sheets error: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Function to call the Gemini API and get a grounded answer.
 */
async function getGeminiAnswer(question: string): Promise<{ answer: string; sources: { uri: string; title: string }[] }> {
    if (!GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not set in .env file.");
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;
    const systemPrompt = `Act as an expert researcher. Provide a concise, professional, and accurate answer (under 100 words) to the following question. Use Google Search grounding to ensure accuracy.`;

    const payload = {
        contents: [{ parts: [{ text: question }] }],
        tools: [{ "google_search": {} }],
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
    };

    const MAX_RETRIES = 3;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
        try {
            const response = await axios.post(apiUrl, payload, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.status === 429) { 
                const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                attempt++;
                if (attempt < MAX_RETRIES) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue; 
                }
                throw new Error("API rate limit exceeded after all retries.");
            }

            if (response.status !== 200) {
                throw new Error(`API call failed with status: ${response.status}`);
            }

            const result = response.data;
            const candidate = result.candidates?.[0];

            let answer = "Could not generate a response.";
            let sources: { uri: string; title: string }[] = [];

            if (candidate && candidate.content?.parts?.[0]?.text) {
                answer = candidate.content.parts[0].text;
                
                const groundingMetadata = candidate.groundingMetadata;
                if (groundingMetadata && groundingMetadata.groundingAttributions) {
                    sources = groundingMetadata.groundingAttributions
                        .map((attribution: any) => ({
                            uri: attribution.web?.uri,
                            title: attribution.web?.title,
                        }))
                        .filter((source: { uri: string; title: string }) => source.uri && source.title)
                        .slice(0, 3);
                }
            }
            
            return { answer, sources };

        } catch (error) {
            if (attempt === MAX_RETRIES - 1) {
                 console.error(`Final API attempt failed for question: "${question}"`, error);
                 return { 
                     answer: `[Error: Failed to fetch AI answer after retries: ${error instanceof Error ? error.message : String(error)}]`, 
                     sources: [] 
                 };
            }
            attempt++;
            const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    return { answer: `[Unknown Fatal Error during AI generation]`, sources: [] };
}

// --- Endpoint 1: Fetch Available Sites ---
app.get('/api/sites', async (req: Request, res: Response) => {
    try {
        const allSiteData = await fetchAllSiteData();
        // Extract unique site URLs to send to the frontend selector
        const siteUrls = allSiteData.map(data => data.siteUrl).filter((url, index, self) => self.indexOf(url) === index);
        
        console.log(`Available sites fetched: ${siteUrls.length}`);
        res.status(200).json(siteUrls);
    } catch (error) {
        console.error("Error in /api/sites:", error);
        res.status(500).json({ 
            error: "Failed to fetch available sites.", 
            details: error instanceof Error ? error.message : "An unknown error occurred." 
        });
    }
});

// --- Endpoint 2: Generate Answers for a Specific Site ---
app.post('/api/generate-answers', async (req: Request, res: Response) => {
    try {
        const { siteUrl } = req.body;
        if (!siteUrl) {
            return res.status(400).json({ error: "Missing siteUrl in request body." });
        }

        // 1. Fetch ALL data, then find the specific site's questions
        const allSiteData = await fetchAllSiteData();
        const targetSite = allSiteData.find(site => site.siteUrl === siteUrl);

        if (!targetSite) {
            return res.status(404).json({ error: `Site '${siteUrl}' not found in Google Sheet data.` });
        }

        const answeredSite: SiteResult = {
            siteUrl: targetSite.siteUrl,
            questions: []
        };
        
        console.log(`Processing ${targetSite.questions.length} questions for site: ${targetSite.siteUrl}`);

        // 2. Generate answer for each question using Gemini API
        for (const questionItem of targetSite.questions) {
            const { answer, sources } = await getGeminiAnswer(questionItem.question);
            
            answeredSite.questions.push({
                ...questionItem,
                answer: answer,
                sources: sources
            });
        }
        
        // 3. Return the single answered site result
        res.status(200).json(answeredSite);

    } catch (error) {
        console.error("Endpoint error:", error);
        res.status(500).json({ 
            error: "Failed to process questions and generate answers.", 
            details: error instanceof Error ? error.message : "An unknown error occurred."
        });
    }
});

// --- Server Startup ---
app.listen(PORT, () => {
    console.log(`\n\n✅ Backend running at http://localhost:${PORT}`);
    console.log("🛠️  Remember to set GEMINI_API_KEY, GOOGLE_SHEET_ID, and GOOGLE_API_KEY in your '.env' file.");
    console.log("🛠️  Ensure your Google Sheet (Sheet1) has URL in column A and comma-separated questions in column B.");
});