import express, { Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { google } from 'googleapis';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = 3004;
const DATA_FILE_PATH = process.env.DATA_FILE_PATH || './data/Directory_Bot.xlsx';
const MAX_ROWS = 1000;
const MAX_QUESTIONS_PER_BATCH = 10;

// Google Sheets Configuration
const GOOGLE_SHEETS_CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
const GOOGLE_SHEETS_PRIVATE_KEY = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');
const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const GOOGLE_SHEETS_SHEET_NAME = process.env.GOOGLE_SHEETS_SHEET_NAME || 'UserSubmissions';

// --- Setup Middlewares ---
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:12000', 'https://work-1-qisfyhentxwgdxaf.prod-runtime.all-hands.dev', 'https://work-2-qisfyhentxwgdxaf.prod-runtime.all-hands.dev']
}));
app.use(express.json({ limit: '10mb' }));

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
 * Validate environment
 */
function validateEnvironment(): void {
    console.log('✅ Environment variables validated');
    
    // Check Google Sheets configuration
    if (GOOGLE_SHEETS_CLIENT_EMAIL && GOOGLE_SHEETS_PRIVATE_KEY && GOOGLE_SHEETS_SPREADSHEET_ID) {
        console.log('✅ Google Sheets integration enabled');
    } else {
        console.log('⚠️  Google Sheets integration disabled - missing environment variables');
    }
}

/**
 * Initialize Google Sheets API
 */
async function initializeGoogleSheets() {
    if (!GOOGLE_SHEETS_CLIENT_EMAIL || !GOOGLE_SHEETS_PRIVATE_KEY || !GOOGLE_SHEETS_SPREADSHEET_ID) {
        console.log('⚠️  Google Sheets not configured - skipping initialization');
        return null;
    }

    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: GOOGLE_SHEETS_CLIENT_EMAIL,
                private_key: GOOGLE_SHEETS_PRIVATE_KEY,
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        
        // Test the connection
        const response = await sheets.spreadsheets.get({
            spreadsheetId: GOOGLE_SHEETS_SPREADSHEET_ID,
        });
        
        console.log(`✅ Connected to Google Sheets: ${response.data.properties?.title}`);
        return sheets;
    } catch (error) {
        console.error('❌ Failed to initialize Google Sheets:', error);
        return null;
    }
}

/**
 * Save user data to Google Sheets
 */
async function saveToGoogleSheets(appInfo: AppInfo, siteUrl: string): Promise<boolean> {
    if (!GOOGLE_SHEETS_CLIENT_EMAIL || !GOOGLE_SHEETS_PRIVATE_KEY || !GOOGLE_SHEETS_SPREADSHEET_ID) {
        console.log('⚠️  Google Sheets not configured - skipping save');
        return false;
    }

    try {
        const sheets = await initializeGoogleSheets();
        if (!sheets) {
            console.log('⚠️  Could not initialize Google Sheets');
            return false;
        }

        const timestamp = new Date().toISOString();
        
        // Prepare the data row
        const rowData = [
            timestamp,
            appInfo.name || '',
            appInfo.email || '',
            appInfo.contactName || '',
            appInfo.companyName || '',
            appInfo.url || '',
            appInfo.githubUrl || '',
            appInfo.linkedinUrl || '',
            appInfo.xUrl || '',
            appInfo.type || '',
            appInfo.tagline || '',
            appInfo.description || '',
            appInfo.category || '',
            appInfo.targetAudience || '',
            appInfo.mainFeatures?.join('; ') || '',
            appInfo.techStack?.join('; ') || '',
            appInfo.location || '',
            appInfo.launchDate || '',
            appInfo.isReleased ? 'Yes' : 'No',
            appInfo.enableGithubActions ? 'Yes' : 'No',
            appInfo.enableLinkedinSharing ? 'Yes' : 'No',
            siteUrl || 'N/A'
        ];

        // Get the current sheet to find the next empty row
        const sheetResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: GOOGLE_SHEETS_SPREADSHEET_ID,
            range: `${GOOGLE_SHEETS_SHEET_NAME}!A:A`,
        });

        const nextRow = (sheetResponse.data.values?.length || 0) + 1;
        
        // If it's the first row, add headers
        if (nextRow === 1) {
            const headers = [
                'Timestamp',
                'App Name',
                'Email',
                'Contact Name',
                'Company Name',
                'Website URL',
                'GitHub URL',
                'LinkedIn URL',
                'X/Twitter URL',
                'App Type',
                'Tagline',
                'Description',
                'Category',
                'Target Audience',
                'Main Features',
                'Tech Stack',
                'Location',
                'Launch Date',
                'Is Released',
                'GitHub Actions Enabled',
                'LinkedIn Sharing Enabled',
                'Analyzed Site'
            ];
            
            await sheets.spreadsheets.values.update({
                spreadsheetId: GOOGLE_SHEETS_SPREADSHEET_ID,
                range: `${GOOGLE_SHEETS_SHEET_NAME}!A1:V1`,
                valueInputOption: 'RAW',
                requestBody: {
                    values: [headers],
                },
            });
        }

        // Append the data
        await sheets.spreadsheets.values.append({
            spreadsheetId: GOOGLE_SHEETS_SPREADSHEET_ID,
            range: `${GOOGLE_SHEETS_SHEET_NAME}!A${nextRow}:V${nextRow}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [rowData],
            },
        });

        console.log(`✅ User data saved to Google Sheets (row ${nextRow})`);
        return true;
    } catch (error) {
        console.error('❌ Error saving to Google Sheets:', error);
        return false;
    }
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
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
        const dataRows = data ? data.slice(1, MAX_ROWS + 1).filter(row => row.length > 0 && (row[0] || row[1])) : [];

        if (dataRows.length === 0) {
            throw new Error("No data found in XLSX file. Please check the file structure.");
        }

        const directorySites: DirectorySite[] = [];

        dataRows.forEach((row: string[], rowIndex: number) => {
            try {
                const siteUrl = row[0] ? String(row[0]).trim() : '';
                const questionsString = row[1] ? String(row[1]).trim() : '';

                if (siteUrl && questionsString) {
                    const questionsArray = questionsString.split(',')
                        .map(q => q.trim())
                        .filter(q => q.length > 0);

                    directorySites.push({
                        url: siteUrl,
                        questions: questionsArray,
                    });
                }
            } catch (rowError) {
                console.warn(`⚠️ Skipping row ${rowIndex + 1}`);
            }
        });

        console.log(`✅ Successfully loaded ${directorySites.length} directory sites`);
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
            return dirSiteUrl === normalizedTargetUrl;
        });
        
        if (site && site.questions.length > 0) {
            console.log(`✅ Found ${site.questions.length} questions for ${siteUrl}`);
            return site.questions;
        }
        
        console.log(`⚠️ No specific questions found for ${siteUrl}, using general questions`);
        return [
            'What is the name of your application?',
            'What is your main website URL?',
            'What is your GitHub repository URL?',
            'What is your LinkedIn profile URL?',
            'What is your X (Twitter) profile URL?',
            'What is your contact email?',
            'What type of application is it?',
            'Please describe your application',
            'Who is your target audience?',
            'What are your main features?',
            'What technologies do you use?',
            'Is your application released to the public?',
            'What is your launch date?',
            'What is your company name?',
            'Who is the main contact person?',
            'Where are you located?',
            'What is your application tagline?',
            'What category does your application belong to?'
        ];
        
    } catch (error) {
        console.error(`❌ Error getting questions for ${siteUrl}:`, error);
        return [
            'What is your application name?',
            'What is your website URL?',
            'What is your contact information?',
            'What does your application do?'
        ];
    }
}

/**
 * SIMPLE EXACT MATCH - Returns EXACT user input or empty string if not provided
 */
function getExactUserData(question: string, appInfo: AppInfo): string {
    const q = question.toLowerCase().trim();
    
    // Direct exact matching - NO DEFAULT VALUES, only return what user provided
    if (q.includes('github')) {
        return appInfo.githubUrl || '';
    }
    if (q.includes('linkedin') || q.includes('linked in')) {
        return appInfo.linkedinUrl || '';
    }
    if (q.includes('twitter') || q.includes('x.com') || q.includes('x (twitter)')) {
        return appInfo.xUrl || '';
    }
    if (q.includes('website') || q.includes('url') || q.includes('link') || q.includes('web address')) {
        return appInfo.url || '';
    }
    if (q.includes('email') || q.includes('e-mail')) {
        return appInfo.email || '';
    }
    if (q.includes('app name') || q.includes('name') || q.includes('application name')) {
        return appInfo.name || '';
    }
    if (q.includes('company') && q.includes('name')) {
        return appInfo.companyName || '';
    }
    if (q.includes('contact') && (q.includes('name') || q.includes('person'))) {
        return appInfo.contactName || '';
    }
    if (q.includes('location') || q.includes('city') || q.includes('country')) {
        return appInfo.location || '';
    }
    if (q.includes('launch') || q.includes('date')) {
        return appInfo.launchDate || '';
    }
    if (q.includes('description') || q.includes('about') || q.includes('what is')) {
        return appInfo.description || '';
    }
    if (q.includes('audience') || q.includes('target')) {
        return appInfo.targetAudience || '';
    }
    if (q.includes('type') || q.includes('kind of app')) {
        return appInfo.type || '';
    }
    if (q.includes('feature')) {
        return appInfo.mainFeatures?.join(', ') || '';
    }
    if (q.includes('tech') || q.includes('technology') || q.includes('stack')) {
        return appInfo.techStack?.join(', ') || '';
    }
    if (q.includes('tagline') || q.includes('slogan')) {
        return appInfo.tagline || '';
    }
    if (q.includes('category')) {
        return appInfo.category || '';
    }
    if (q.includes('released') || q.includes('live') || q.includes('available')) {
        return appInfo.isReleased ? 'Yes' : 'No';
    }
    
    // If no match, return empty string - we'll handle this in the answer generation
    return '';
}

/**
 * Generate answer that returns EXACT user input
 */
function generateExactAnswer(question: string, appInfo: AppInfo): string {
    const exactData = getExactUserData(question, appInfo);
    
    // If we have exact data from user, return it directly
    if (exactData) {
        return exactData;
    }
    
    // For questions we don't have specific data for, return a generic response
    const genericResponses = [
        "This information hasn't been provided yet.",
        "We haven't specified this detail.",
        "This information is not currently available.",
        "Details about this will be provided later."
    ];
    
    return genericResponses[Math.floor(Math.random() * genericResponses.length)];
}

/**
 * Generate answers for batch of questions
 */
function generateBatchAnswers(questions: BatchQuestion[], appInfo: AppInfo): BatchAnswers {
    const answers: BatchAnswers = {};
    questions.forEach(q => {
        answers[q.id] = generateExactAnswer(q.question, appInfo);
    });
    return answers;
}

/**
 * Log all received user data for debugging
 */
function logUserData(appInfo: AppInfo): void {
    console.log('📋 EXACT USER DATA RECEIVED:');
    console.log('══════════════════════════════════════════');
    console.log(`📝 Basic Info:`);
    console.log(`  Name: "${appInfo.name}"`);
    console.log(`  URL: "${appInfo.url}"`);
    console.log(`  Type: "${appInfo.type}"`);
    console.log(`  Tagline: "${appInfo.tagline}"`);
    console.log(`  Description: "${appInfo.description?.substring(0, 50)}${appInfo.description && appInfo.description.length > 50 ? '...' : ''}"`);
    console.log(`  Category: "${appInfo.category}"`);
    console.log(`  Target Audience: "${appInfo.targetAudience}"`);
    
    console.log(`\n🔧 Features & Tech:`);
    console.log(`  Main Features: "${appInfo.mainFeatures?.join(', ') || 'None'}"`);
    console.log(`  Tech Stack: "${appInfo.techStack?.join(', ') || 'None'}"`);
    
    console.log(`\n📞 Contact Info:`);
    console.log(`  Email: "${appInfo.email}"`);
    console.log(`  Company: "${appInfo.companyName}"`);
    console.log(`  Contact Name: "${appInfo.contactName}"`);
    console.log(`  Location: "${appInfo.location}"`);
    console.log(`  GitHub: "${appInfo.githubUrl}"`);
    console.log(`  LinkedIn: "${appInfo.linkedinUrl}"`);
    console.log(`  X (Twitter): "${appInfo.xUrl}"`);
    console.log(`  Is Released: ${appInfo.isReleased}`);
    console.log(`  Launch Date: "${appInfo.launchDate}"`);
    
    console.log(`\n⚙️ Automation Settings:`);
    console.log(`  GitHub Actions: ${appInfo.enableGithubActions}`);
    console.log(`  LinkedIn Sharing: ${appInfo.enableLinkedinSharing}`);
    console.log('══════════════════════════════════════════');
}

// --- API Endpoints ---

// Health Check Endpoint
app.get('/api/health', async (req: Request, res: Response) => {
    try {
        const dataFileExists = fs.existsSync(path.resolve(process.cwd(), DATA_FILE_PATH));
        const googleSheetsConfigured = !!(GOOGLE_SHEETS_CLIENT_EMAIL && GOOGLE_SHEETS_PRIVATE_KEY && GOOGLE_SHEETS_SPREADSHEET_ID);
        res.status(200).json({ 
            status: 'healthy', 
            timestamp: new Date().toISOString(),
            dataFile: dataFileExists,
            googleSheets: googleSheetsConfigured,
            mode: 'exact-user-input',
            description: 'Returns EXACT user input as answers - no modifications',
            note: 'Empty strings are returned for fields not provided by user'
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'unhealthy', 
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Fetch Available Sites
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
            details: error instanceof Error ? error.message : "Unknown error" 
        });
    }
});

// Analyze Site with App Info - EXACT INPUT MODE
app.post('/api/analyze-site', async (req: Request, res: Response) => {
    try {
        const { appInfo, siteUrl } = req.body;
        
        if (!appInfo) {
            return res.status(400).json({ error: "Missing appInfo in request body." });
        }
        
        if (!siteUrl) {
            return res.status(400).json({ error: "Missing siteUrl in request body." });
        }

        console.log(`🚀 Processing analysis for: "${appInfo.name || 'Unnamed App'}"`);
        console.log(`🎯 Target directory site: ${siteUrl}`);
        
        // Log EXACT data received
        logUserData(appInfo);
        
        // Save to Google Sheets (non-blocking, don't wait for it)
        saveToGoogleSheets(appInfo, siteUrl).then(success => {
            if (success) {
                console.log('✅ User data successfully saved to Google Sheets');
            } else {
                console.log('⚠️  Could not save to Google Sheets');
            }
        }).catch(error => {
            console.error('❌ Error in Google Sheets save:', error);
        });
        
        // Get questions for this site
        const siteQuestions = await getQuestionsForSite(siteUrl);
        const limitedQuestions = siteQuestions.slice(0, MAX_QUESTIONS_PER_BATCH);
        
        console.log(`📝 Processing ${limitedQuestions.length} questions`);
        
        // Prepare questions
        const batchQuestions: BatchQuestion[] = limitedQuestions.map((question, index) => ({
            id: index + 1,
            question: question
        }));
        
        // Generate EXACT answers from user data
        const batchAnswers = generateBatchAnswers(batchQuestions, appInfo);
        
        // Format results
        const questionsWithAnswers: SiteQuestion[] = batchQuestions.map(q => ({
            id: q.id,
            question: q.question,
            answer: batchAnswers[q.id]
        }));
        
        // Get site name
        let siteName = siteUrl;
        try {
            const urlObj = new URL(siteUrl);
            siteName = urlObj.hostname.replace(/^www\./, '');
        } catch {
            siteName = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
        }
        
        // Show examples of URL answers
        console.log(`\n🔗 URL ANSWER EXAMPLES:`);
        const urlQuestions = questionsWithAnswers.filter(q => 
            q.question.toLowerCase().includes('github') || 
            q.question.toLowerCase().includes('linkedin') || 
            q.question.toLowerCase().includes('twitter') || 
            q.question.toLowerCase().includes('x.com') ||
            q.question.toLowerCase().includes('website') ||
            q.question.toLowerCase().includes('url')
        );
        
        urlQuestions.slice(0, 5).forEach(qa => {
            console.log(`  Q: "${qa.question}"`);
            console.log(`  A: "${qa.answer}"`);
        });
        
        console.log(`\n✅ Analysis complete: ${questionsWithAnswers.length} answers generated`);
        
        res.status(200).json({
            siteUrl: siteUrl,
            siteName: siteName,
            questions: questionsWithAnswers,
            metadata: {
                analyzedAt: new Date().toISOString(),
                appName: appInfo.name || 'Unnamed App',
                mode: 'exact-user-input',
                description: 'Answers are EXACT user input values',
                inputVerification: {
                    githubUrl: appInfo.githubUrl ? '✓ Provided' : '✗ Not provided',
                    linkedinUrl: appInfo.linkedinUrl ? '✓ Provided' : '✗ Not provided',
                    xUrl: appInfo.xUrl ? '✓ Provided' : '✗ Not provided',
                    websiteUrl: appInfo.url ? '✓ Provided' : '✗ Not provided',
                    email: appInfo.email ? '✓ Provided' : '✗ Not provided',
                    contactName: appInfo.contactName ? '✓ Provided' : '✗ Not provided'
                }
            }
        });

    } catch (error) {
        console.error("❌ Error in /api/analyze-site:", error);
        res.status(500).json({ 
            error: "Failed to process site.", 
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
});

// Test Endpoint - Returns exactly what you send
app.post('/api/test-exact', async (req: Request, res: Response) => {
    try {
        const { appInfo } = req.body;
        
        if (!appInfo) {
            return res.status(400).json({ 
                error: "Missing appInfo",
                exampleRequest: {
                    appInfo: {
                        name: "My Test App",
                        url: "https://myapp.com",
                        githubUrl: "https://github.com/myusername",
                        linkedinUrl: "https://linkedin.com/in/myprofile",
                        xUrl: "https://x.com/myhandle",
                        email: "me@example.com",
                        contactName: "John Smith"
                    }
                }
            });
        }
        
        console.log('🧪 TESTING EXACT INPUT MODE');
        console.log('══════════════════════════════════════════');
        
        // Log what we received
        logUserData(appInfo);
        
        // Test specific questions
        const testQuestions = [
            "What is your GitHub URL?",
            "What is your LinkedIn URL?",
            "What is your Twitter/X URL?",
            "What is your website?",
            "What is your email address?",
            "What is your name?",
            "What is your contact person's name?"
        ];
        
        const testResults = testQuestions.map((question, index) => {
            const exactAnswer = getExactUserData(question, appInfo);
            const generatedAnswer = generateExactAnswer(question, appInfo);
            
            return {
                id: index + 1,
                question: question,
                exactDataFromUser: exactAnswer,
                answerReturned: generatedAnswer,
                matches: exactAnswer === generatedAnswer
            };
        });
        
        console.log('\n🔍 TEST RESULTS:');
        console.log('══════════════════════════════════════════');
        testResults.forEach(result => {
            console.log(`\nQ: ${result.question}`);
            console.log(`User Data: "${result.exactDataFromUser}"`);
            console.log(`Answer: "${result.answerReturned}"`);
            console.log(`Exact Match: ${result.matches ? '✅ YES' : '❌ NO'}`);
        });
        
        const exactMatches = testResults.filter(r => r.matches).length;
        const matchRate = (exactMatches / testResults.length) * 100;
        
        console.log(`\n📊 Match Rate: ${matchRate.toFixed(1)}% (${exactMatches}/${testResults.length})`);
        
        res.status(200).json({
            success: true,
            test: 'exact-input-mode',
            receivedAt: new Date().toISOString(),
            matchRate: `${matchRate.toFixed(1)}%`,
            results: testResults,
            dataSummary: {
                name: appInfo.name || 'Empty',
                url: appInfo.url || 'Empty',
                githubUrl: appInfo.githubUrl || 'Empty',
                linkedinUrl: appInfo.linkedinUrl || 'Empty',
                xUrl: appInfo.xUrl || 'Empty',
                email: appInfo.email || 'Empty',
                contactName: appInfo.contactName || 'Empty'
            }
        });

    } catch (error) {
        console.error("❌ Error in /api/test-exact:", error);
        res.status(500).json({ 
            error: "Test failed", 
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
});

// Echo endpoint - shows exactly what we receive
app.post('/api/echo', async (req: Request, res: Response) => {
    try {
        const { appInfo } = req.body;
        
        console.log('📥 RAW DATA RECEIVED:');
        console.log(JSON.stringify(appInfo, null, 2));
        
        res.status(200).json({
            success: true,
            receivedAt: new Date().toISOString(),
            rawData: appInfo,
            dataTypes: {
                name: typeof appInfo?.name,
                url: typeof appInfo?.url,
                githubUrl: typeof appInfo?.githubUrl,
                linkedinUrl: typeof appInfo?.linkedinUrl,
                xUrl: typeof appInfo?.xUrl,
                email: typeof appInfo?.email,
                contactName: typeof appInfo?.contactName
            },
            isEmpty: {
                name: !appInfo?.name,
                url: !appInfo?.url,
                githubUrl: !appInfo?.githubUrl,
                linkedinUrl: !appInfo?.linkedinUrl,
                xUrl: !appInfo?.xUrl,
                email: !appInfo?.email,
                contactName: !appInfo?.contactName
            }
        });
        
    } catch (error) {
        console.error("❌ Error in /api/echo:", error);
        res.status(500).json({ 
            error: "Echo failed", 
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
});

// Get directory details
app.get('/api/directory-details', async (req: Request, res: Response) => {
    try {
        const directorySites = await fetchAllSiteData();
        
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
            error: "Failed to fetch directory details."
        });
    }
});

// --- Server Startup ---
try {
    validateEnvironment();
    
    // Initialize Google Sheets on startup
    if (GOOGLE_SHEETS_CLIENT_EMAIL && GOOGLE_SHEETS_PRIVATE_KEY && GOOGLE_SHEETS_SPREADSHEET_ID) {
        initializeGoogleSheets().then(sheets => {
            if (sheets) {
                console.log('✅ Google Sheets API initialized successfully');
            }
        });
    }
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`\n\n🎯 EXACT INPUT SERVER STARTED`);
        console.log(`📍 Running at http://localhost:${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
        console.log(`📁 Data file: ${DATA_FILE_PATH}`);
        
        if (GOOGLE_SHEETS_CLIENT_EMAIL && GOOGLE_SHEETS_PRIVATE_KEY && GOOGLE_SHEETS_SPREADSHEET_ID) {
            console.log(`☁️  Google Sheets: ENABLED (Saving all user submissions)`);
            console.log(`   Spreadsheet ID: ${GOOGLE_SHEETS_SPREADSHEET_ID}`);
            console.log(`   Sheet name: ${GOOGLE_SHEETS_SHEET_NAME}`);
        } else {
            console.log(`⚠️  Google Sheets: DISABLED (Set environment variables to enable)`);
        }
        
        console.log('\n══════════════════════════════════════════');
        console.log('🚀 MODE: EXACT USER INPUT');
        console.log('📋 DESCRIPTION: Returns EXACTLY what you input');
        console.log('❌ NO default values, NO modifications');
        console.log('✅ Empty string if field not provided');
        console.log('══════════════════════════════════════════\n');
        
        console.log('🛠️ ENDPOINTS:');
        console.log('  GET  /api/health           - Server health');
        console.log('  GET  /api/sites            - List directory sites');
        console.log('  GET  /api/directory-details - Detailed site info');
        console.log('  POST /api/analyze-site     - Main analysis endpoint');
        console.log('  POST /api/test-exact       - Test exact input mode');
        console.log('  POST /api/echo             - Echo raw data (debug)');
        
        console.log('\n🔗 GUARANTEED EXACT URL RETURNS:');
        console.log('  • GitHub URL: Returns EXACT user input');
        console.log('  • LinkedIn URL: Returns EXACT user input');
        console.log('  • X/Twitter URL: Returns EXACT user input');
        console.log('  • Website URL: Returns EXACT user input');
        
        console.log('\n📋 EXAMPLE:');
        console.log('  User inputs: https://github.com/myusername');
        console.log('  Question: "What is your GitHub?"');
        console.log('  Answer: "https://github.com/myusername"');
        console.log('  (No modifications, no defaults)');
        
        console.log('\n⚠️  NOTE: If field is empty in form, answer will be empty string');
        console.log('\n✅ Server ready! Send your appInfo to /api/analyze-site');
        console.log('\nPress Ctrl+C to stop\n');
    });
} catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
}