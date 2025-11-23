import express, { Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import axios from 'axios';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DATA_FILE_PATH = process.env.DATA_FILE_PATH || './data/Directory_Bot.xlsx'; // Path to your XLSX file
const SHEETS_RANGE = 'Sheet1!A:B'; // For reference, but we'll read the entire sheet

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
 * Reads data from local XLSX file and structures it.
 * This is used internally by both the /sites and /generate-answers endpoints.
 */
async function fetchAllSiteData(): Promise<SiteResult[]> {
    if (!DATA_FILE_PATH) {
        console.error("Missing DATA_FILE_PATH in .env");
        throw new Error("Missing data file path. Cannot fetch data.");
    }

    // Resolve the file path (handles relative and absolute paths)
    const resolvedPath = path.resolve(process.cwd(), DATA_FILE_PATH);
    
    try {
        // Check if file exists
        if (!fs.existsSync(resolvedPath)) {
            throw new Error(`Data file not found at: ${resolvedPath}`);
        }

        // Read the XLSX file
        const workbook = XLSX.readFile(resolvedPath);
        
        // Get the first sheet (you can modify this to use a specific sheet name)
        const sheetName = workbook.SheetNames[0]; // Use first sheet
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert sheet to JSON
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
        
        // Skip header row and filter out empty rows
        const dataRows = data ? data.slice(1).filter(row => row.length > 0 && (row[0] || row[1])) : [];
        
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

                siteData.push({
                    siteUrl: siteUrl,
                    questions: newQuestions,
                });
            }
        });

        console.log(`Successfully loaded ${siteData.length} sites from XLSX file`);
        return siteData;

    } catch (error) {
        console.error("Error reading XLSX file:", error);
        throw new Error(`XLSX file error: ${error instanceof Error ? error.message : String(error)}`);
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
            return res.status(404).json({ error: `Site '${siteUrl}' not found in data file.` });
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
    console.log("🛠️  Remember to set GEMINI_API_KEY in your '.env' file.");
    console.log("🛠️  Ensure your XLSX file has URL in column A and comma-separated questions in column B.");
    console.log(`🛠️  Using data file: ${DATA_FILE_PATH}`);
});