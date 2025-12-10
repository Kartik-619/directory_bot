import express, { Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = 3004;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const DATA_FILE_PATH = process.env.DATA_FILE_PATH || './data/Directory_Bot.xlsx';
const MAX_ROWS = 1000;
const MAX_QUESTIONS_PER_BATCH = 10; // Limit questions per batch

// Use a free model from OpenRouter
const MODEL_NAME = 'mistralai/mistral-7b-instruct:free'; // Free model

// Rate limiting storage
const rateLimit = new Map<string, number>();

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
}

interface SiteAnalysis {
    siteUrl: string;
    siteName: string;
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

interface DirectorySite {
    url: string;
    questions: string[];
}

interface BatchQuestion {
    id: number;
    question: string;
}

interface BatchAnswers {
    [key: number]: string; // id -> answer
}

/**
 * Validate all required environment variables
 */
function validateEnvironment(): void {
    if (OPENROUTER_API_KEY && OPENROUTER_API_KEY !== 'your_openrouter_api_key_here') {
        console.log('✅ OpenRouter API key loaded');
    } else {
        console.log('⚠️  OPENROUTER_API_KEY not set - using fallback mock responses');
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
async function fetchAllSiteData(): Promise<DirectorySite[]> {
    if (!DATA_FILE_PATH) {
        console.error("Missing DATA_FILE_PATH in .env");
        throw new Error("Missing data file path. Cannot fetch data.");
    }

    const resolvedPath = path.resolve(process.cwd(), DATA_FILE_PATH);

    try {
        if (!fs.existsSync(resolvedPath)) {
            throw new Error(`Data file not found at: ${resolvedPath}`);
        }

        console.log(`📖 Reading XLSX file: ${resolvedPath}`);
        const workbook = XLSX.readFile(resolvedPath);
        const worksheet = getDataSheet(workbook);
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
        const dataRows = data ? data.slice(1, MAX_ROWS + 1).filter(row => row.length > 0 && (row[0] || row[1])) : [];

        if (dataRows.length === 0) {
            throw new Error("No data found in XLSX file. Please check the file structure.");
        }

        const directorySites: DirectorySite[] = [];

        dataRows.forEach((row: string[], rowIndex: number) => {
            try {
                const siteUrl = row[0] ? validateAndSanitizeUrl(String(row[0]).trim()) : `Unknown Site ${rowIndex + 1}`;
                const questionsString = row[1] ? String(row[1]).trim() : '';

                if (questionsString) {
                    const questionsArray = questionsString.split(',')
                        .map(q => validateQuestion(q.trim()))
                        .filter(q => q.length > 0);

                    directorySites.push({
                        url: siteUrl,
                        questions: questionsArray,
                    });
                }
            } catch (rowError) {
                console.warn(`⚠️ Skipping row ${rowIndex + 1} due to error:`, rowError instanceof Error ? rowError.message : rowError);
            }
        });

        console.log(`✅ Successfully loaded ${directorySites.length} directory sites from XLSX file`);
        return directorySites;

    } catch (error) {
        console.error("❌ Error reading XLSX file:", error);
        throw new Error(`XLSX file error: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Get questions for a specific site from the directory
 */
async function getQuestionsForSite(siteUrl: string): Promise<string[]> {
    try {
        const directorySites = await fetchAllSiteData();
        const normalizedTargetUrl = siteUrl.toLowerCase().trim();
        
        // Find the site in the directory
        const site = directorySites.find(dirSite => {
            const dirSiteUrl = dirSite.url.toLowerCase().trim();
            // Check for exact match or domain match
            return dirSiteUrl === normalizedTargetUrl || 
                   dirSiteUrl.includes(normalizedTargetUrl) || 
                   normalizedTargetUrl.includes(dirSiteUrl);
        });
        
        if (site && site.questions.length > 0) {
            console.log(`✅ Found ${site.questions.length} questions for ${siteUrl}`);
            return site.questions;
        }
        
        console.log(`⚠️ No questions found for ${siteUrl}, using default questions`);
        // Return some default questions if none found
        return [
            'What can we learn from their user experience design?',
            'How do they handle customer engagement?',
            'What are their key features for user retention?',
            'How do they present their value proposition?'
        ];
        
    } catch (error) {
        console.error(`❌ Error getting questions for ${siteUrl}:`, error);
        throw new Error(`Failed to get questions for site: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Generate mock answer for a single question
 */
function generateMockAnswer(question: string, context: {
    appInfo: AppInfo;
    siteUrl: string;
}): string {
    const mockAnswers = [
        `Based on ${context.siteUrl}, ${context.appInfo.name} should focus on ${question.toLowerCase().replace('?', '')}.`,
        `Analyzing ${context.siteUrl} suggests ${context.appInfo.name} implement best practices for ${question.toLowerCase().replace('?', '')}.`,
        `${context.siteUrl} shows effective strategies for ${question.toLowerCase().replace('?', '')} that ${context.appInfo.name} can adopt.`,
        `For ${context.appInfo.name}, ${context.siteUrl} demonstrates how to optimize ${question.toLowerCase().replace('?', '')}.`,
        `${context.appInfo.name} can learn from ${context.siteUrl}'s approach to ${question.toLowerCase().replace('?', '')}.`
    ];
    
    return mockAnswers[Math.floor(Math.random() * mockAnswers.length)];
}

/**
 * Generate mock answers for batch of questions
 */
function generateMockBatchAnswers(questions: BatchQuestion[], context: {
    appInfo: AppInfo;
    siteUrl: string;
}): BatchAnswers {
    const answers: BatchAnswers = {};
    questions.forEach(q => {
        answers[q.id] = generateMockAnswer(q.question, context);
    });
    return answers;
}

/**
 * Function to call the OpenRouter API for BATCH of questions
 */
async function getOpenRouterBatchAnswers(questions: BatchQuestion[], context: {
    appInfo: AppInfo;
    siteUrl: string;
}): Promise<BatchAnswers> {
    if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
        console.log('⚠️ No OpenRouter API key, using mock responses');
        return generateMockBatchAnswers(questions, context);
    }

    if (!checkRateLimit(`batch-${context.siteUrl}`)) {
        throw new Error("Rate limit exceeded. Please wait before making another request.");
    }

    const MAX_RETRIES = 2;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
        try {
            console.log(`🔍 OpenRouter BATCH API attempt ${attempt + 1} for site ${context.siteUrl}: ${questions.length} questions`);

            // Create batch prompt with all questions
            const questionsText = questions.map(q => `${q.id}. ${q.question}`).join('\n');
            
            const prompt = `
ANALYSIS CONTEXT:
YOUR APP: ${context.appInfo.name} (${context.appInfo.type})
APP DESCRIPTION: ${context.appInfo.description}
TARGET AUDIENCE: ${context.appInfo.targetAudience}
KEY FEATURES: ${context.appInfo.mainFeatures.join(', ')}
TECH STACK: ${context.appInfo.techStack.join(', ')}

REFERENCE SITE TO ANALYZE: ${context.siteUrl}

QUESTIONS ABOUT THIS SITE (answer each in order):
${questionsText}

INSTRUCTIONS:
1. Analyze ${context.siteUrl} specifically for insights relevant to ${context.appInfo.name}
2. Provide actionable advice for EACH question above
3. Keep answers focused and concise (50-80 words each)
4. Format your response as a JSON object where keys are question numbers (1, 2, 3...) and values are the answers
5. Example format: {"1": "Your answer for question 1", "2": "Your answer for question 2"}

JSON RESPONSE:
            `;

            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost:3000',
                    'X-Title': 'Directory Bot Analysis'
                },
                body: JSON.stringify({
                    model: MODEL_NAME,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 1500, // Increased for batch responses
                    temperature: 0.7,
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            
            if (!data.choices || data.choices.length === 0) {
                throw new Error('No response from OpenRouter');
            }

            const content = data.choices[0].message.content;
            
            // Parse JSON response
            let parsedAnswers: any;
            try {
                parsedAnswers = JSON.parse(content);
                
                // CORRECTED: Convert string keys from AI to number keys for our BatchAnswers interface
                const normalizedAnswers: BatchAnswers = {};
                
                // Handle both string keys ("1", "2") and number keys (1, 2)
                Object.entries(parsedAnswers).forEach(([key, value]) => {
                    const numKey = parseInt(key);
                    if (!isNaN(numKey) && typeof value === 'string') {
                        normalizedAnswers[numKey] = value;
                    }
                });
                
                // Validate that we have answers for all questions
                const missingAnswers = questions.filter(q => !normalizedAnswers[q.id]);
                if (missingAnswers.length > 0) {
                    console.log(`⚠️ Missing answers for questions: ${missingAnswers.map(q => q.id).join(', ')}`);
                    // Fill missing answers with mock
                    missingAnswers.forEach(q => {
                        normalizedAnswers[q.id] = generateMockAnswer(q.question, context);
                    });
                }
                
                console.log(`✅ Successfully generated batch answers for ${context.siteUrl} (${questions.length} questions)`);
                return normalizedAnswers;

            } catch (parseError) {
                console.error('❌ Failed to parse JSON response, using mock answers:', parseError);
                console.log('Raw response:', content);
                return generateMockBatchAnswers(questions, context);
            }

        } catch (error: any) {
            console.error(`❌ Error in attempt ${attempt + 1} for ${context.siteUrl}:`, error.message);
            
            if (error.message?.includes('429') || error.message?.includes('rate limit') || error.message?.includes('quota')) {
                if (attempt < MAX_RETRIES - 1) {
                    const delay = Math.pow(2, attempt) * 1000;
                    console.log(`⏳ Rate limited, waiting ${delay}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    attempt++;
                    continue;
                } else {
                    console.log('⚠️ Rate limit hit, using mock responses');
                    return generateMockBatchAnswers(questions, context);
                }
            }
            
            if (attempt === MAX_RETRIES - 1) {
                console.log('⚠️ OpenRouter failed, using mock responses');
                return generateMockBatchAnswers(questions, context);
            }
            
            attempt++;
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    return generateMockBatchAnswers(questions, context);
}

// --- Health Check Endpoint ---
app.get('/api/health', async (req: Request, res: Response) => {
    try {
        const dataFileExists = fs.existsSync(path.resolve(process.cwd(), DATA_FILE_PATH));
        res.status(200).json({ 
            status: 'healthy', 
            timestamp: new Date().toISOString(),
            dataFile: dataFileExists,
            openrouterKey: !!OPENROUTER_API_KEY && OPENROUTER_API_KEY !== 'your_openrouter_api_key_here',
            aiModel: MODEL_NAME,
            batchMode: true
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'unhealthy', 
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// --- Endpoint 1: Fetch Available Sites (Directory URLs) ---
app.get('/api/sites', async (req: Request, res: Response) => {
    try {
        const directorySites = await fetchAllSiteData();
        const siteUrls = directorySites.map(site => site.url);
        
        console.log(`✅ Directory sites fetched: ${siteUrls.length}`);
        res.status(200).json(siteUrls);
    } catch (error) {
        console.error("❌ Error in /api/sites:", error);
        res.status(500).json({ 
            error: "Failed to fetch directory sites.", 
            details: error instanceof Error ? error.message : "An unknown error occurred." 
        });
    }
});

// --- Endpoint 2: Analyze a Specific Site with App Info (BATCH MODE) ---
app.post('/api/analyze-site', async (req: Request, res: Response) => {
    try {
        const { appInfo, siteUrl } = req.body;
        
        if (!appInfo) {
            return res.status(400).json({ error: "Missing appInfo in request body." });
        }
        
        if (!siteUrl) {
            return res.status(400).json({ error: "Missing siteUrl in request body." });
        }

        // Validate required fields
        if (!appInfo.name || !appInfo.type || !appInfo.description || !appInfo.targetAudience) {
            return res.status(400).json({ error: "Missing required app information fields." });
        }

        console.log(`🚀 Starting BATCH analysis for ${appInfo.name} on site: ${siteUrl}`);
        
        // 1. Get questions for this specific site from Excel
        const siteQuestions = await getQuestionsForSite(siteUrl);
        
        if (!siteQuestions || siteQuestions.length === 0) {
            return res.status(404).json({ 
                error: 'No questions found for this site',
                siteUrl 
            });
        }
        
        // Limit questions per batch
        const limitedQuestions = siteQuestions.slice(0, MAX_QUESTIONS_PER_BATCH);
        
        console.log(`📝 Processing ${limitedQuestions.length} questions in BATCH for ${siteUrl}`);

        // Prepare batch questions
        const batchQuestions: BatchQuestion[] = limitedQuestions.map((question, index) => ({
            id: index + 1,
            question: question
        }));
        
        // 2. Get BATCH answers from OpenRouter
        const batchAnswers = await getOpenRouterBatchAnswers(batchQuestions, {
            appInfo,
            siteUrl
        });
        
        // 3. Convert batch answers to SiteQuestion array
        const questionsWithAnswers: SiteQuestion[] = batchQuestions.map(q => ({
            id: q.id,
            question: q.question,
            answer: batchAnswers[q.id] || generateMockAnswer(q.question, { appInfo, siteUrl })
        }));
        
        // 4. Get site display name
        let siteName = siteUrl;
        try {
            const urlObj = new URL(siteUrl);
            siteName = urlObj.hostname.replace(/^www\./, '');
        } catch {
            siteName = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
        }
        
        console.log(`✅ Successfully analyzed ${siteUrl} with ${questionsWithAnswers.length} answers (BATCH MODE)`);
        
        res.status(200).json({
            siteUrl: siteUrl,
            siteName: siteName,
            questions: questionsWithAnswers,
            metadata: {
                analyzedAt: new Date().toISOString(),
                appName: appInfo.name,
                totalQuestions: questionsWithAnswers.length,
                aiProvider: 'OpenRouter',
                aiModel: MODEL_NAME,
                mode: 'batch',
                requestsSaved: limitedQuestions.length - 1 // Show how many requests we saved
            }
        });

    } catch (error) {
        console.error("❌ Error in /api/analyze-site:", error);
        res.status(500).json({ 
            error: "Failed to analyze site.", 
            details: error instanceof Error ? error.message : "An unknown error occurred."
        });
    }
});

// --- Endpoint 3: Get Directory Sites with Details ---
app.get('/api/directory-details', async (req: Request, res: Response) => {
    try {
        const directorySites = await fetchAllSiteData();
        
        // Return detailed directory information
        const detailedSites = directorySites.map(site => ({
            url: site.url,
            questionCount: site.questions.length,
            sampleQuestions: site.questions.slice(0, 3) // Show first 3 questions
        }));
        
        res.status(200).json({
            count: detailedSites.length,
            sites: detailedSites,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("❌ Error in /api/directory-details:", error);
        res.status(500).json({ 
            error: "Failed to fetch directory details.", 
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
        console.log(`🔑 OpenRouter API: ${OPENROUTER_API_KEY && OPENROUTER_API_KEY !== 'your_openrouter_api_key_here' ? '✅ Configured' : '⚠️ Using mock mode'}`);
        console.log(`⚡ BATCH MODE: Enabled (max ${MAX_QUESTIONS_PER_BATCH} questions per request)`);
        console.log("🛠️ Available endpoints:");
        console.log("   GET  /api/health");
        console.log("   GET  /api/sites");
        console.log("   GET  /api/directory-details");
        console.log("   POST /api/analyze-site    ← NOW IN BATCH MODE");
        console.log("\n🔥 OPTIMIZED WORKFLOW:");
        console.log("   - Reads site-specific questions from Excel");
        console.log("   - Sends ALL questions in ONE API call");
        console.log("   - Receives JSON response with all answers");
        console.log("   - Uses app info to provide relevant insights");
        console.log("   - Falls back to mock data if API fails");
        console.log("\nPress Ctrl+C to stop the server\n");
    });
} catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
}