import express, { Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables from .env file
dotenv.config();

const app = express();

const PORT = 3004;


const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DATA_FILE_PATH = process.env.DATA_FILE_PATH || './data/Directory_Bot.xlsx';
const MAX_ROWS = 1000;

// Initialize Gemini SDK
let genAI: GoogleGenerativeAI | null = null;
const MODEL_NAME = 'gemini-2.5-flash';

// Rate limiting storage
const rateLimit = new Map<string, number>();
// Caching for file data
let cachedSiteData: SiteResult[] | null = null;
let lastModified: number = 0;

// --- Setup Middlewares ---
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:12000', 'https://work-1-qisfyhentxwgdxaf.prod-runtime.all-hands.dev', 'https://work-2-qisfyhentxwgdxaf.prod-runtime.all-hands.dev']
}));
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

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

interface AppInfo {
    url: string;
    name: string;
    type: 'saas' | 'ecommerce' | 'blog' | 'portfolio' | 'webapp' | 'other';
    description: string;
    targetAudience: string;
    mainFeatures: string[];
    techStack: string[];
}

/**
 * Validate all required environment variables and initialize the AI SDK
 */
function validateEnvironment(): void {
    if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here') {
        genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        console.log('✅ Gemini SDK initialized successfully');
    } else {
        console.log('⚠️  GEMINI_API_KEY not set or using placeholder - AI features will be disabled');
        genAI = null;
    }

    console.log('✅ Environment variables validated');
}

/**
 * Validate and sanitize URL input
 */
function validateAndSanitizeUrl(url: string): string {
    const trimmed = url.trim();
    if (!trimmed) {
        throw new Error("URL cannot be empty");
    }
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        return `https://${trimmed}`;
    }
    return trimmed;
}

/**
 * Validate question input
 */
function validateQuestion(question: string): string {
    const trimmed = question.trim();
    if (!trimmed) {
        throw new Error("Question cannot be empty");
    }
    if (trimmed.length > 500) {
        throw new Error("Question too long (max 500 characters)");
    }
    return trimmed;
}

/**
 * Rate limiting to prevent API abuse
 */
function checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const lastCall = rateLimit.get(identifier);
    const RATE_LIMIT_WINDOW = 1000;

    if (lastCall && (now - lastCall) < RATE_LIMIT_WINDOW) {
        return false;
    }
    rateLimit.set(identifier, now);
    return true;
}

/**
 * More robust sheet detection
 */
function getDataSheet(workbook: XLSX.WorkBook): XLSX.WorkSheet {
    const possibleNames = ['Sheet1', 'Data', 'Questions', 'URLs'];
    const sheetName = possibleNames.find(name => workbook.SheetNames.includes(name)) || workbook.SheetNames[0];

    if (!sheetName) {
        throw new Error("No sheets found in XLSX file");
    }

    console.log(`📊 Using sheet: ${sheetName}`);
    return workbook.Sheets[sheetName];
}

/**
 * Reads data from local XLSX file and structures it.
 */
async function fetchAllSiteData(): Promise<SiteResult[]> {
    if (!DATA_FILE_PATH) {
        console.error("Missing DATA_FILE_PATH in .env");
        throw new Error("Missing data file path. Cannot fetch data.");
    }

    const resolvedPath = path.resolve(process.cwd(), DATA_FILE_PATH);

    try {
        if (!fs.existsSync(resolvedPath)) {
            throw new Error(`Data file not found at: ${resolvedPath}`);
        }

        const stats = fs.statSync(resolvedPath);
        if (cachedSiteData && stats.mtimeMs === lastModified) {
            console.log('🔄 Returning cached site data');
            return cachedSiteData;
        }

        console.log(`📖 Reading XLSX file: ${resolvedPath}`);
        const workbook = XLSX.readFile(resolvedPath);
        const worksheet = getDataSheet(workbook);
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
        const dataRows = data ? data.slice(1, MAX_ROWS + 1).filter(row => row.length > 0 && (row[0] || row[1])) : [];

        if (dataRows.length === 0) {
            throw new Error("No data found in XLSX file. Please check the file structure.");
        }

        const siteData: SiteResult[] = [];

        dataRows.forEach((row: string[], rowIndex: number) => {
            try {
                const siteUrl = row[0] ? validateAndSanitizeUrl(String(row[0]).trim()) : `Unknown Site ${rowIndex + 1}`;
                const questionsString = row[1] ? String(row[1]).trim() : '';

                if (questionsString) {
                    const questionsArray = questionsString.split(',')
                        .map(q => validateQuestion(q.trim()))
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
            } catch (rowError) {
                console.warn(`⚠️ Skipping row ${rowIndex + 1} due to error:`, rowError instanceof Error ? rowError.message : rowError);
            }
        });

        cachedSiteData = siteData;
        lastModified = stats.mtimeMs;

        console.log(`✅ Successfully loaded ${siteData.length} sites from XLSX file`);
        return siteData;

    } catch (error) {
        console.error("❌ Error reading XLSX file:", error);
        throw new Error(`XLSX file error: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Generate custom questions based on app information
 */
function generateCustomQuestions(appInfo: AppInfo): string[] {
    const baseQuestions = [
        `What are the best practices for ${appInfo.type} applications like ${appInfo.name}?`,
        `How can ${appInfo.name} improve user engagement for ${appInfo.targetAudience}?`,
        `What are the key success metrics for ${appInfo.type} applications?`,
        `How can ${appInfo.name} optimize conversion rates?`,
        `What are the latest trends in ${appInfo.type} development?`
    ];

    const featureQuestions = appInfo.mainFeatures.slice(0, 3).map(feature => 
        `How can ${appInfo.name} optimize ${feature.toLowerCase()} for better user experience?`
    );

    const techQuestions = appInfo.techStack.slice(0, 2).map(tech => 
        `What are the best practices for ${tech} in ${appInfo.type} applications?`
    );

    const audienceQuestions = [
        `What are the pain points of ${appInfo.targetAudience} that ${appInfo.name} should address?`,
        `How can ${appInfo.name} better serve ${appInfo.targetAudience}?`
    ];

    return [
        ...baseQuestions,
        ...featureQuestions,
        ...techQuestions,
        ...audienceQuestions
    ].slice(0, 10); // Limit to 10 questions
}

/**
 * Function to call the Gemini API using the official SDK - FIXED VERSION
 */
async function getGeminiAnswer(question: string): Promise<{ answer: string; sources: { uri: string; title: string }[] }> {
    if (!genAI) {
        // Return a mock response when AI is not available
        return {
            answer: "AI service is currently unavailable. Please configure GEMINI_API_KEY to enable AI-powered responses.",
            sources: []
        };
    }

    if (!checkRateLimit(question)) {
        throw new Error("Rate limit exceeded. Please wait before making another request.");
    }

    const MAX_RETRIES = 3;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
        try {
            console.log(`🔍 Gemini API attempt ${attempt + 1} for: "${question.substring(0, 50)}..."`);

            // FIXED: Use the correct model and simplified approach
            const model = genAI.getGenerativeModel({ 
                model: MODEL_NAME
            });

            // FIXED: Simplified content generation without unsupported options
            const prompt = `Act as an expert researcher. Provide a concise, professional, and accurate answer (under 100 words) to the following question: ${question}`;
            
            const result = await model.generateContent(prompt);
            const response = await result.response;
            
            let answer = response.text();
            let sources: { uri: string; title: string }[] = [];

            // FIXED: For now, we'll return empty sources since grounding requires specific setup
            // You can implement source extraction later when you have the proper setup
            console.log(`✅ Successfully generated answer (${answer.length} chars)`);
            return { answer, sources };

        } catch (error: any) {
            console.error(`❌ Error in attempt ${attempt + 1}:`, error.message);
            
            // Handle rate limiting
            if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('rate')) {
                const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                attempt++;
                if (attempt < MAX_RETRIES) {
                    console.log(`⏳ Rate limited, waiting ${delay}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
            }
            
            if (attempt === MAX_RETRIES - 1) {
                return { 
                    answer: `[Error: ${error.message || 'Failed to generate answer'}]`, 
                    sources: [] 
                };
            }
            attempt++;
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    return { answer: `[Unknown Fatal Error during AI generation]`, sources: [] };
}

// --- Health Check Endpoint ---
app.get('/api/health', async (req: Request, res: Response) => {
    try {
        const dataFileExists = fs.existsSync(path.resolve(process.cwd(), DATA_FILE_PATH));
        res.status(200).json({ 
            status: 'healthy', 
            timestamp: new Date().toISOString(),
            dataFile: dataFileExists,
            geminiKey: !!GEMINI_API_KEY,
            geminiInitialized: !!genAI
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'unhealthy', 
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// --- Endpoint 1: Fetch Available Sites ---
app.get('/api/sites', async (req: Request, res: Response) => {
    try {
        const allSiteData = await fetchAllSiteData();
        const siteUrls = allSiteData.map(data => data.siteUrl).filter((url, index, self) => self.indexOf(url) === index);
        
        console.log(`✅ Available sites fetched: ${siteUrls.length}`);
        res.status(200).json(siteUrls);
    } catch (error) {
        console.error("❌ Error in /api/sites:", error);
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

        const validatedSiteUrl = validateAndSanitizeUrl(siteUrl);
        const allSiteData = await fetchAllSiteData();
        const targetSite = allSiteData.find(site => site.siteUrl === validatedSiteUrl);

        if (!targetSite) {
            return res.status(404).json({ error: `Site '${validatedSiteUrl}' not found in data file.` });
        }

        const answeredSite: SiteResult = {
            siteUrl: targetSite.siteUrl,
            questions: []
        };
        
        console.log(`🚀 Processing ${targetSite.questions.length} questions for site: ${targetSite.siteUrl}`);

        for (const [index, questionItem] of targetSite.questions.entries()) {
            console.log(`📝 Processing question ${index + 1}/${targetSite.questions.length}: ${questionItem.question.substring(0, 50)}...`);
            
            const { answer, sources } = await getGeminiAnswer(questionItem.question);
            
            answeredSite.questions.push({
                ...questionItem,
                answer: answer,
                sources: sources
            });
        }
        
        console.log(`🎉 Successfully processed all questions for ${targetSite.siteUrl}`);
        res.status(200).json(answeredSite);

    } catch (error) {
        console.error("❌ Endpoint error:", error);
        res.status(500).json({ 
            error: "Failed to process questions and generate answers.", 
            details: error instanceof Error ? error.message : "An unknown error occurred."
        });
    }
});

// --- Endpoint 3: Generate Custom Answers Based on App Info ---
app.post('/api/generate-custom-answers', async (req: Request, res: Response) => {
    try {
        const { appInfo } = req.body;
        if (!appInfo) {
            return res.status(400).json({ error: "Missing appInfo in request body." });
        }

        // Validate required fields
        if (!appInfo.name || !appInfo.type || !appInfo.description || !appInfo.targetAudience) {
            return res.status(400).json({ error: "Missing required app information fields." });
        }

        const customQuestions = generateCustomQuestions(appInfo);
        
        const answeredSite: SiteResult = {
            siteUrl: appInfo.url || `Custom Analysis for ${appInfo.name}`,
            questions: []
        };
        
        console.log(`🚀 Processing ${customQuestions.length} custom questions for app: ${appInfo.name}`);

        for (const [index, question] of customQuestions.entries()) {
            console.log(`📝 Processing question ${index + 1}/${customQuestions.length}: ${question.substring(0, 50)}...`);
            
            const { answer, sources } = await getGeminiAnswer(question);
            
            answeredSite.questions.push({
                id: index + 1,
                question: question,
                answer: answer,
                sources: sources
            });
        }
        
        console.log(`🎉 Successfully processed all custom questions for ${appInfo.name}`);
        res.status(200).json(answeredSite);

    } catch (error) {
        console.error("❌ Custom endpoint error:", error);
        res.status(500).json({ 
            error: "Failed to process custom questions and generate answers.", 
            details: error instanceof Error ? error.message : "An unknown error occurred."
        });
    }
});

// --- Graceful Shutdown Handlers ---
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    process.exit(0);
});

// --- Server Startup ---
try {
    validateEnvironment();
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`\n\n✅ Backend running at http://localhost:${PORT}`);
        console.log(`📊 Health check available at: http://localhost:${PORT}/api/health`);
        console.log("🌐 CORS enabled for: http://localhost:3000, http://localhost:12000, and external runtime URLs");
        console.log(`📁 Using data file: ${DATA_FILE_PATH}`);
        console.log(`🤖 Using AI model: ${MODEL_NAME}`);
        console.log("🛠️ Available endpoints:");
        console.log("   GET  /api/health");
        console.log("   GET  /api/sites");
        console.log("   POST /api/generate-answers");
        console.log("   POST /api/generate-custom-answers");
        console.log("\nPress Ctrl+C to stop the server\n");
    });
} catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
}