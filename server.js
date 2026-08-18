import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import helmet from 'helmet';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

// Generate a unique nonce per request for CSP
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
});

// Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": [
        "'self'", 
        "'unsafe-inline'", // Ignored by modern browsers due to nonce, acts as fallback
        (req, res) => `'nonce-${res.locals.nonce}'`,
        "https://www.gstatic.com",
        "https://*.googleapis.com",
        "https://*.firebaseio.com",
        "https://cdnjs.cloudflare.com"
      ],
      "script-src-attr": ["'unsafe-inline'"], // Scoped exception to allow inline event handlers (onclick, etc.) without exposing the whole policy
      "style-src": [
        "'self'", 
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com"
      ],
      "style-src-attr": ["'unsafe-inline'"],
      "font-src": ["'self'", "data:", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      "img-src": ["'self'", "data:", "https://firebasestorage.googleapis.com", "https://*.googleapis.com"],
      "connect-src": [
        "'self'", 
        "https://*.googleapis.com", 
        "https://*.firebaseio.com"
      ],
      "frame-src": ["'self'", "https://www.google.com"]
    },
  },
}));

// Permissions-Policy Header
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// Body parser for JSON endpoints
app.use(express.json());

// Lazy-loaded Gemini client setup
let aiClient = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required to run the support chat.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

// System instructions for the Credify Capital Assistant
const systemInstruction = `You are the official smart Customer Support Assistant for Credify Capital (https://www.credifycapital.in). Your job is to help users with loan queries, calculate approximate EMIs, and guide them on eligibility or documentation.

Company Details:
- Office Location: 1107, S3 Tower, Cloud9, Vaishali (GZB), 201010
- Phone: +91 9931372218
- Email: info@credifycapital.in

Loan Offerings & Rates:
1. Personal Loans: Instant disbursal up to ₹25 Lakhs, competitive interest rates starting at 10.5%, flexible tenure (12 to 60 months). Zero collateral, fully paperless/digital application.
2. Business Loans: Working Capital, Retail shop loans, MSME & Proprietorship loans. Collateral-free.
3. Professional Loans: Specially designed for Doctors, Chartered Accountants (CA), and Company Secretaries (CS).
4. Machinery / Medical Equipment Loans: Up to ₹1 Crore for buying new/used machinery or diagnostic medical equipment.
5. Loan Against Property (LAP): Loans up to ₹5 Crores against residential or commercial properties.

Important Website Pages (ALWAYS recommend these as relative paths/links when relevant):
- Check Free Credit Score: /credit-score.html
- Online Loan Calculator: /calculator.html
- Instant Digital Application: /apply.html
- Contact Us: /contact-us.html
- Main Blogs & Resources: /blogs.html

Interaction Guidelines:
- Be extremely polite, professional, and business-focused.
- If the user asks about calculations (e.g., monthly payments, EMIs), provide a helpful estimate if they share the amount and tenure, but ALWAYS encourage them to use the Online Loan Calculator at /calculator.html for exact calculations and PDF exports!
- If they are ready to apply or ask how to proceed, provide a nice link to the digital application: /apply.html.
- Keep responses concise, clear, and perfectly formatted using bold text (**keyword**) for readability and markdown bullet points for structured lists.
- NEVER make up interest rates or features not specified. If unsure, tell them to email info@credifycapital.in or call +91 9931372218.`;

// Map of legacy dummy HTML files to their new redirect targets
const redirects = {
  '/short-term-car-loan.html': '/car-loan.html',
  '/short-term-loan-against-property.html': '/loan-against-property.html',
  '/short-term-machinery-loan.html': '/machinery-loan.html',
  '/short-term-medical-equipment-loan.html': '/medical-equipment-loan.html',
  '/small-business-loan.html': '/business-loan.html',
  '/small-business-loans.html': '/business-loan.html',
  '/small-car-loan.html': '/car-loan.html',
  '/small-loan-against-property.html': '/loan-against-property.html',
  '/small-machinery-loan.html': '/machinery-loan.html',
  '/small-medical-equipment-loan.html': '/medical-equipment-loan.html',
  '/unsecured-business-loan-for-proprietorship.html': '/business-loan-for-proprietorship.html',
  '/unsecured-business-loan-for-retail-shop.html': '/business-loan-for-retail-shop.html',
  '/unsecured-business-loan-for-women.html': '/business-loan-for-women.html',
  '/unsecured-business-loan-for-working-capital.html': '/business-loan-for-working-capital.html',
  '/unsecured-business-loan-scheme-for-msme.html': '/business-loan-scheme-for-msme.html',
  '/urgent-car-loan.html': '/car-loan.html',
  '/urgent-loan-against-property.html': '/loan-against-property.html',
  '/urgent-machinery-loan.html': '/machinery-loan.html',
  '/urgent-medical-equipment-loan.html': '/medical-equipment-loan.html',
  '/working-capital-business-loan.html': '/business-loan-for-working-capital.html'
};

// 1. Secure Static File Serving (Restrict access to public assets only)
app.use('/css', express.static(path.join(process.cwd(), 'css')));
app.use('/img', express.static(path.join(process.cwd(), 'img')));
app.use('/js', express.static(path.join(process.cwd(), 'js')));
app.use('/fonts', express.static(path.join(process.cwd(), 'fonts')));

// 2. Page Router
const pageRouter = express.Router();

const renderPage = (res, viewName, next) => {
  res.render('pages/' + viewName, {}, (err, html) => {
    if (err) {
      if (err.message.includes('Failed to lookup view')) {
        return next();
      }
      return next(err);
    }
    
    let finalData = html;
    if (html.includes('</body>') && !html.includes('chatbot.js')) {
      finalData = html.replace('</body>', '<script src="/js/chatbot.js"></script>\n</body>');
    }
    res.setHeader('Content-Type', 'text/html');
    return res.send(finalData);
  });
};

// Root route
pageRouter.get('/', (req, res, next) => renderPage(res, 'index', next));

// Handle legacy redirects
pageRouter.get('*', (req, res, next) => {
  const reqPath = decodeURIComponent(req.path);
  if (redirects[reqPath]) {
    return res.redirect(301, redirects[reqPath]);
  }
  next();
});

// Dynamic page routing
pageRouter.get('*', (req, res, next) => {
  const reqPath = decodeURIComponent(req.path);
  const ext = path.extname(reqPath);
  if (ext && ext !== '.html') {
    return next();
  }

  const viewName = reqPath.replace(/^\//, '').replace(/\.html$/, '');
  
  // prevent directory traversal
  if (viewName.includes('..') || viewName.includes('\\') || viewName.split('/').some(part => part.startsWith('.'))) {
    return next();
  }
  
  if (!viewName) {
    return next();
  }
  
  renderPage(res, viewName, next);
});

app.use(pageRouter);

// 2. Chat API Proxy for the frontend chatbot
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per `window` (here, per 15 minutes)
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true, 
  legacyHeaders: false, 
});

app.post('/api/chat', chatLimiter, async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const ai = getGeminiClient();

    // Map the conversation history to standard format required by the GoogleGenAI SDK
    const contents = [];
    if (Array.isArray(history)) {
      history.forEach(item => {
        if (item.text && (item.role === 'user' || item.role === 'model')) {
          contents.push({
            role: item.role,
            parts: [{ text: item.text }]
          });
        }
      });
    }

    // Append the current message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Request text response from Gemini 3.5
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7
      }
    });

    const replyText = response.text || "How can I help you with your loan options today?";
    res.json({ text: replyText });
  } catch (err) {
    console.error('Gemini Assistant Error:', err.message);
    res.status(500).json({ error: 'I am unable to answer right now. Please check if the GEMINI_API_KEY secret is configured in the Settings menu.' });
  }
});

// 404 Error Handler
app.use((req, res, next) => {
  res.status(404).render('pages/404', {}, (err, html) => {
    if (err) return res.status(404).send('404 - Page not found');
    let finalData = html;
    if (html.includes('</body>') && !html.includes('chatbot.js')) {
      finalData = html.replace('</body>', '<script src="/js/chatbot.js"></script>\n</body>');
    }
    res.setHeader('Content-Type', 'text/html');
    res.send(finalData);
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Credify Capital server running on http://0.0.0.0:${PORT}`);
  });
}

export default app;

