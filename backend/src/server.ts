import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

dotenv.config();

const app = express();
const PORT = 3004;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || 'your_openrouter_api_key_here';
const DATA_FILE_PATH = process.env.DATA_FILE_PATH || './data/Directory_Bot.xlsx';
const MAX_ROWS = 1000;
const MAX_QUESTIONS_PER_BATCH = 10;

// --- Setup Middlewares ---
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:12000', 'https://directory-bot.vercel.app','https://work-1-qisfyhentxwgdxaf.prod-runtime.all-hands.dev', 'https://work-2-qisfyhentxwgdxaf.prod-runtime.all-hands.dev']
}));
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// --- Type Definitions ---
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

// AppInfo interface matching frontend EXACTLY
interface AppInfo {
    // Basic Info
    url: string;
    name: string;
    type: 'saas' | 'ecommerce' | 'blog' | 'portfolio' | 'webapp' | 'other';
    description: string;
    targetAudience: string;
    mainFeatures: string[];
    techStack: string[];
    
    // Contact Information
    email: string;
    companyName: string;
    contactName: string;
    location: string;
    githubUrl: string;
    launchDate: string;
    
    // Marketing & Categorization
    tagline: string;
    category: string;
    
    // Social & Automation Fields
    linkedinUrl: string;
    enableGithubActions: boolean;
    enableLinkedinSharing: boolean;
    xUrl: string;
    isReleased: boolean;
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
    [key: number]: string;
}

// --- Helper Functions ---

/**
 * Validate all required environment variables
 */
function validateEnvironment(): void {
    // Always use simple copy mode
    console.log('✅ Using simple copy responses (OpenRouter disabled)');
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
    try {
        const resolvedPath = path.resolve(process.cwd(), DATA_FILE_PATH);
        if (!fs.existsSync(resolvedPath)) {
            console.error(`❌ Data file not found: ${resolvedPath}`);
            return [];
        }

        console.log(`📖 Reading XLSX file: ${resolvedPath}`);
        const workbook = XLSX.readFile(resolvedPath);
        const worksheet = getDataSheet(workbook);
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
        const dataRows = data ? data.slice(1, MAX_ROWS + 1).filter(row => row.length > 0 && (row[0] || row[1])) : [];

        const directorySites: DirectorySite[] = [];

        console.log(`📊 Processing ${dataRows.length} rows`);

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
                        questions: questionsArray
                    });
                }
            } catch (rowError) {
                console.warn(`⚠️ Skipping row ${rowIndex + 1} due to error:`, rowError instanceof Error ? rowError.message : rowError);
            }
        });

        console.log(`✅ Successfully loaded ${directorySites.length} directory sites from XLSX file`);
        return directorySites;

    } catch (error) {
        console.error(`❌ Error loading XLSX data:`, error);
        return [];
    }
}

/**
 * Get questions for a specific site URL
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
 * Match question to user data and return the exact value
 */
/**
 * Match question to user data and return the exact value
 */
function getExactUserData(question: string, appInfo: AppInfo): string {
    const q = question.toLowerCase().trim();
    
    // GitHub related questions
    if (q.includes('github') || q.includes('repository') || q.includes('repo')) {
        return appInfo.githubUrl || '';
    }
    
    // LinkedIn related questions
    if (q.includes('linkedin') || q.includes('linked in') || q.includes('professional profile')) {
        return appInfo.linkedinUrl || '';
    }
    
    // X/Twitter related questions
    if (q.includes('twitter') || q.includes('x.com') || q.includes('x profile') || q.includes('social media') && q.includes('x')) {
        return appInfo.xUrl || '';
    }
    
    // Product/App website - specific
    if ((q.includes('website') || q.includes('url') || q.includes('link')) && 
        (q.includes('product') || q.includes('app') || q.includes('your') || q.includes('main'))) {
        return appInfo.url || '';
    }
    
    // Generic URL/website - less specific
    if (q.includes('website') || q.includes('url') || q.includes('web address')) {
        // Default to product URL if nothing more specific
        return appInfo.url || '';
    }
    
    // Company name
    if (q.includes('company') && q.includes('name')) {
        return appInfo.companyName || '';
    }
    if (q.includes('company') && !q.includes('name')) {
        return appInfo.companyName || '';
    }
    
    // Contact name
    if (q.includes('contact') && q.includes('name')) {
        return appInfo.contactName || '';
    }
    if (q.includes('contact') && !q.includes('name')) {
        return appInfo.contactName || '';
    }
    
    // App name
    if (q.includes('name') && !q.includes('company') && !q.includes('contact')) {
        return appInfo.name || '';
    }
    
    // Email
    if (q.includes('email') || q.includes('e-mail')) {
        return appInfo.email || '';
    }
    
    // Location
    if (q.includes('location') || q.includes('based') || q.includes('city') || q.includes('country')) {
        return appInfo.location || '';
    }
    
    // Launch date
    if (q.includes('launch') || q.includes('date') || q.includes('released on')) {
        return appInfo.launchDate || '';
    }
    
    // Description
    if (q.includes('description') || q.includes('about') || q.includes('what is') || q.includes('what does')) {
        return appInfo.description || '';
    }
    
    // Target audience
    if (q.includes('audience') || q.includes('target') || q.includes('users') || q.includes('customers')) {
        return appInfo.targetAudience || '';
    }
    
    // App type
    if (q.includes('type') || q.includes('kind of') || q.includes('category') && !q.includes('app')) {
        return appInfo.type || '';
    }
    
    // Features
    if (q.includes('feature') || q.includes('functionality') || q.includes('what can') || q.includes('capabilities')) {
        return appInfo.mainFeatures.join(', ') || '';
    }
    
    // Tech stack
    if (q.includes('tech') || q.includes('technology') || q.includes('stack') || q.includes('built with')) {
        return appInfo.techStack.join(', ') || '';
    }
    
    // Tagline
    if (q.includes('tagline') || q.includes('slogan') || q.includes('catchphrase')) {
        return appInfo.tagline || '';
    }
    
    // Category
    if (q.includes('category') && !q.includes('type')) {
        return appInfo.category || '';
    }
    
    // Released status
    if (q.includes('released') || q.includes('live') || q.includes('available') || q.includes('launched') || q.includes('public')) {
        return appInfo.isReleased ? 'Yes' : 'No';
    }
    
    // Default: return empty string if no match
    return '';
}

/**
 * Generate SIMPLE answer that copies user input
 */
function generateSimpleAnswer(question: string, context: { 
    appInfo: AppInfo;
    siteUrl: string;
}): string {
    const userData = getExactUserData(question, context.appInfo);
    
    // Simple templates that just return the user's data
    const templates = [
        `${userData}`,
        `The answer is: ${userData}`,
        `Based on your input: ${userData}`,
        `Your provided information: ${userData}`,
        `${userData} (as you specified)`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Generate simple answers for batch of questions
 */
function generateSimpleBatchAnswers(questions: BatchQuestion[], context: {
    appInfo: AppInfo;
    siteUrl: string;
}): BatchAnswers {
    const answers: BatchAnswers = {};
    questions.forEach(q => {
        answers[q.id] = generateSimpleAnswer(q.question, context);
    });
    return answers;
}

/**
 * Function to get answers - SIMPLE COPY MODE ONLY
 */
async function getBatchAnswers(questions: BatchQuestion[], context: {
    appInfo: AppInfo;
    siteUrl: string;
}): Promise<BatchAnswers> {
    // Always use simple copy responses
    console.log('📋 Using simple copy mode - returning exact user data');
    return generateSimpleBatchAnswers(questions, context);
}

// --- API Endpoints ---

// Health Check Endpoint
app.get('/api/health', async (req: Request, res: Response) => {
    try {
        const dataFileExists = fs.existsSync(path.resolve(process.cwd(), DATA_FILE_PATH));
        
        res.status(200).json({ 
            status: 'healthy', 
            timestamp: new Date().toISOString(),
            dataFile: dataFileExists,
            openrouterKey: false,
            aiModel: 'NONE - Simple Copy Mode',
            batchMode: true,
            answerStyle: 'exact-user-data',
            description: 'Returns exact user input without AI analysis'
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
});

// Fetch Available Sites
app.get('/api/sites', async (req: Request, res: Response) => {
    try {
        const directorySites = await fetchAllSiteData();
        
        res.status(200).json({
            count: directorySites.length,
            sites: directorySites.map(site => ({ url: site.url, questionCount: site.questions.length })),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("❌ Error in /api/sites:", error);
        res.status(500).json({ 
            error: "Failed to fetch directory sites.", 
            details: error instanceof Error ? error.message : "An unknown error occurred." 
        });
    }
});

// Analyze Site with App Info
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
        if (!appInfo.name) {
            return res.status(400).json({ error: "Missing required app name field." });
        }

        console.log(`🚀 Starting analysis for ${appInfo.name}`);
        console.log(`🎯 Target directory site: ${siteUrl}`);
        
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
        
        console.log(`📝 Processing ${limitedQuestions.length} questions for ${siteUrl}`);

        // Prepare batch questions
        const batchQuestions: BatchQuestion[] = limitedQuestions.map((question, index) => ({
            id: index + 1,
            question: question
        }));
        
        // 2. Get answers (SIMPLE COPY MODE ONLY)
        const batchAnswers = await getBatchAnswers(batchQuestions, {
            appInfo,
            siteUrl
        });
        
        // 3. Convert batch answers to SiteQuestion array
        const questionsWithAnswers: SiteQuestion[] = batchQuestions.map(q => ({
            id: q.id,
            question: q.question,
            answer: batchAnswers[q.id] || generateSimpleAnswer(q.question, { appInfo, siteUrl })
        }));
        
        // 4. Get site display name
        let siteName = siteUrl;
        try {
            const urlObj = new URL(siteUrl);
            siteName = urlObj.hostname.replace(/^www\./, '');
        } catch {
            siteName = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
        }
        
        console.log(`✅ Successfully processed ${siteUrl} with ${questionsWithAnswers.length} responses`);
        console.log(`📊 Sample response: Q: "${questionsWithAnswers[0]?.question}" → A: "${questionsWithAnswers[0]?.answer}"`);
        
        res.status(200).json({
            siteUrl: siteUrl,
            siteName: siteName,
            questions: questionsWithAnswers,
            metadata: {
                analyzedAt: new Date().toISOString(),
                appName: appInfo.name,
                mode: 'simple-copy',
                aiModel: 'NONE',
                description: 'Returns exact user input data'
            }
        });

    } catch (error) {
        console.error("❌ Error in /api/analyze-site:", error);
        res.status(500).json({ 
            error: "Failed to process site.", 
            details: error instanceof Error ? error.message : "An unknown error occurred."
        });
    }
});

// Get directory details
app.get('/api/directory-details', async (req: Request, res: Response) => {
    try {
        const directorySites = await fetchAllSiteData();
        
        // Return detailed directory information
        const detailedSites = directorySites.map(site => ({
            url: site.url,
            questionCount: site.questions.length,
            sampleQuestions: site.questions.slice(0, 3)
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

// Test Endpoint for debugging
app.post('/api/test-analysis', async (req: Request, res: Response) => {
    try {
        const { appInfo, siteUrl } = req.body;
        
        if (!appInfo || !siteUrl) {
            return res.status(400).json({ 
                error: "Missing appInfo or siteUrl",
                example: {
                    appInfo: {
                        name: "MyProduct",
                        email: "contact@myproduct.com",
                        url: "https://myproduct.com",
                        companyName: "MyCompany Inc",
                        contactName: "John Doe",
                        location: "San Francisco, USA",
                        type: "saas",
                        description: "A project management tool",
                        targetAudience: "Remote teams"
                    },
                    siteUrl: "https://trello.com"
                }
            });
        }

        // Test with common questions
        const testQuestions: BatchQuestion[] = [
            { id: 1, question: "Your Name" },
            { id: 2, question: "Your Email" },
            { id: 3, question: "Website URL" },
            { id: 4, question: "Company Name" },
            { id: 5, question: "Location" }
        ];
        
        console.log(`🧪 TEST SIMPLE COPY MODE`);
        console.log(`📤 Product Name: ${appInfo.name}`);
        console.log(`📤 Email: ${appInfo.email}`);
        console.log(`📤 URL: ${appInfo.url}`);
        
        const batchAnswers = await getBatchAnswers(testQuestions, {
            appInfo,
            siteUrl
        });
        
        const results = testQuestions.map(q => ({
            question: q.question,
            answer: batchAnswers[q.id] || "No data",
            expectedData: getExactUserData(q.question, appInfo)
        }));
        
        console.log(`✅ Test results (showing exact user data):`);
        results.forEach(r => {
            console.log(`  Q: "${r.question}"`);
            console.log(`  A: "${r.answer}"`);
            console.log(`  Expected: "${r.expectedData}"`);
        });
        
        res.status(200).json({
            success: true,
            test: {
                productName: appInfo.name,
                siteUrl: siteUrl,
                questions: results,
                generatedAt: new Date().toISOString()
            },
            mode: 'simple-copy',
            description: 'Simple copy of user input data'
        });

    } catch (error) {
        console.error("❌ Error in /api/test-analysis:", error);
        res.status(500).json({ 
            error: "Test failed.", 
            details: error instanceof Error ? error.message : "An unknown error occurred."
        });
    }
});

// Graceful Shutdown Handlers
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
        console.log(`🤖 AI MODEL: NONE (Simple copy mode)`);
        console.log(`🎯 MODE: SIMPLE COPY USER INPUT`);
        console.log(`📋 Description: Returns your exact input data without AI analysis`);
        console.log("🛠️ Available endpoints:");
        console.log("   GET  /api/health");
        console.log("   GET  /api/sites");
        console.log("   GET  /api/directory-details");
        console.log("   POST /api/analyze-site          ← Returns your exact input data");
        console.log("   POST /api/test-analysis         ← Test endpoint");
        console.log("\nExample responses:");
        console.log('  Q: "Your Name" → A: "YourProductName"');
        console.log('  Q: "Your Email" → A: "your@email.com"');
        console.log('  Q: "Website URL" → A: "https://yourwebsite.com"');
        console.log("\nPress Ctrl+C to stop the server\n");
    });
} catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
}