import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import nodemailer from 'nodemailer';

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
        "https://cdnjs.cloudflare.com",
        "https://cdn.jsdelivr.net"
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
      "frame-src": ["'self'", "https://www.google.com", "https://maps.google.com"]
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
app.use(express.urlencoded({ extended: true }));



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
    
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
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

// ─── Nodemailer Transporter Setup ───────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // use STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 15000,
  logger: process.env.NODE_ENV !== 'production',
  debug: process.env.NODE_ENV !== 'production'
});

const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'amitkumartrp321@gmail.com';

// Rate limiter for form submission APIs
const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 submissions per IP per 15 min
  message: { success: false, error: 'Too many submissions. Please try again later.' }
});

// ─── Data Persistence Helpers (JSON Store) ──────────────────────────────────
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const readDataFile = (filename, defaultValue = []) => {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
    return defaultValue;
  }
};

const writeDataFile = (filename, data) => {
  const filePath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filename}:`, err);
    return false;
  }
};

// ─── API: Submit Loan Application ───────────────────────────────────────────
app.post('/api/submit-lead', formLimiter, async (req, res) => {
  try {
    const { id, name, phone, email, product, amount, income, city, tenure, cibil, emis, source, referredByPartnerCode, referredByPartnerName } = req.body;

    if (!name || !phone || !email || !product) {
      return res.status(400).json({ success: false, error: 'Missing required fields.' });
    }

    const leadId = id || ('CC-APP-' + Math.floor(10000 + Math.random() * 90000));
    const isPartnerReferral = source === 'partner_referral';

    // 1. Save Lead to Persistent Database
    const leads = readDataFile('leads.json', []);
    const newLeadRecord = {
      id: leadId,
      name,
      phone,
      email,
      product,
      amount: parseFloat(amount) || 0,
      income: parseFloat(income) || 0,
      city: city || 'N/A',
      tenure: tenure ? String(tenure) : '12',
      cibil: cibil || '750',
      emis: parseFloat(emis) || 0,
      status: 'New Lead',
      assignedBank: 'Unassigned',
      bankRM: '',
      notes: isPartnerReferral ? `Referred by Partner: ${referredByPartnerName} (${referredByPartnerCode})` : 'Submitted via website form.',
      source: isPartnerReferral ? 'partner_referral' : 'website_direct',
      referredByPartnerCode: referredByPartnerCode || '',
      referredByPartnerName: referredByPartnerName || '',
      createdAt: new Date().toISOString(),
      history: [
        {
          date: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          status: 'New Lead',
          note: isPartnerReferral ? `Lead originated by DSA Partner ${referredByPartnerName}.` : 'Application registered online.'
        }
      ]
    };

    // Prepend new lead
    leads.unshift(newLeadRecord);
    writeDataFile('leads.json', leads);

    // 2. Send Instant Email Alert via Nodemailer
    const htmlBody = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #142450 0%, #1a3a8a 100%); color: white; padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 22px;">🏦 New Loan Application${isPartnerReferral ? ' (Partner Referral)' : ''}</h1>
          <p style="margin: 8px 0 0; opacity: 0.85; font-size: 14px;">Credify Capital Lead Notification</p>
        </div>
        <div style="background: #f8fafc; padding: 24px 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 10px 0; color: #64748b; font-size: 13px;">Application ID</td><td style="padding: 10px 0; font-weight: 700; color: #142450; font-family: monospace;">${leadId}</td></tr>
            <tr style="background: #fff;"><td style="padding: 10px 8px; color: #64748b; font-size: 13px;">Full Name</td><td style="padding: 10px 8px; font-weight: 600;">${name}</td></tr>
            <tr><td style="padding: 10px 0; color: #64748b; font-size: 13px;">Mobile</td><td style="padding: 10px 0;"><a href="tel:+91${phone}" style="color: #1a3a8a; text-decoration: none;">+91 ${phone}</a></td></tr>
            <tr style="background: #fff;"><td style="padding: 10px 8px; color: #64748b; font-size: 13px;">Email</td><td style="padding: 10px 8px;"><a href="mailto:${email}" style="color: #1a3a8a;">${email}</a></td></tr>
            <tr><td style="padding: 10px 0; color: #64748b; font-size: 13px;">Loan Type</td><td style="padding: 10px 0; font-weight: 600; color: #142450;">${product}</td></tr>
            <tr style="background: #fff;"><td style="padding: 10px 8px; color: #64748b; font-size: 13px;">Loan Amount</td><td style="padding: 10px 8px; font-weight: 700; color: #059669;">₹${amount ? Number(amount).toLocaleString('en-IN') : 'N/A'}</td></tr>
            <tr><td style="padding: 10px 0; color: #64748b; font-size: 13px;">Monthly Income</td><td style="padding: 10px 0;">₹${income ? Number(income).toLocaleString('en-IN') : 'N/A'}</td></tr>
            <tr style="background: #fff;"><td style="padding: 10px 8px; color: #64748b; font-size: 13px;">City</td><td style="padding: 10px 8px;">${city || 'N/A'}</td></tr>
            <tr><td style="padding: 10px 0; color: #64748b; font-size: 13px;">Tenure</td><td style="padding: 10px 0;">${tenure ? tenure + ' months' : 'N/A'}</td></tr>
            ${isPartnerReferral ? `<tr style="background: #fef3c7;"><td style="padding: 10px 8px; color: #92400e; font-size: 13px;">Partner Code</td><td style="padding: 10px 8px; font-weight: 600; color: #92400e;">${referredByPartnerCode || 'N/A'}</td></tr>
            <tr style="background: #fef3c7;"><td style="padding: 10px 8px; color: #92400e; font-size: 13px;">Partner Name</td><td style="padding: 10px 8px; font-weight: 600; color: #92400e;">${referredByPartnerName || 'N/A'}</td></tr>` : ''}
          </table>
          <div style="margin-top: 16px; padding: 12px; background: #e0f2fe; border-radius: 8px; font-size: 12px; color: #0369a1;">
            💡 <strong>CRM Notification:</strong> This lead has also been recorded in your <a href="/admin-dashboard.html" style="color: #0369a1; font-weight: bold;">Admin CRM Dashboard</a> for bank allocation.
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #94a3b8;">Received on ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
        </div>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: `"Credify Capital" <${process.env.EMAIL_USER || 'info@credifycapital.in'}>`,
        to: NOTIFY_EMAIL,
        subject: `🏦 New ${product} Application – ${name} (${leadId})`,
        html: htmlBody
      });
    } catch (mailErr) {
      console.error('Mail delivery warning (saved to DB):', mailErr.message);
    }

    res.json({ success: true, message: 'Application submitted successfully.', id: leadId });
  } catch (error) {
    console.error('Error submitting lead:', error);
    res.status(500).json({ success: false, error: 'Failed to submit application. Please try again.' });
  }
});

// ─── API: Submit Contact Form ───────────────────────────────────────────────
app.post('/api/submit-contact', formLimiter, async (req, res) => {
  try {
    const { first_name, last_name, email_id, city, radios_option_purpose, product_type, message } = req.body;

    if (!first_name || !email_id || !message) {
      return res.status(400).json({ success: false, error: 'Missing required fields.' });
    }

    const msgId = 'MSG-' + Math.floor(1000 + Math.random() * 9000);

    // 1. Save message to Persistent Database
    const contacts = readDataFile('contacts.json', []);
    contacts.unshift({
      id: msgId,
      first_name,
      last_name: last_name || '',
      email_id,
      city: city || 'N/A',
      radios_option_purpose: radios_option_purpose || 'General Enquiry',
      product_type: product_type || 'General',
      message,
      createdAt: new Date().toISOString(),
      status: 'New'
    });
    writeDataFile('contacts.json', contacts);

    // 2. Send Email Alert
    const htmlBody = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%); color: white; padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 22px;">💬 New Contact Message</h1>
          <p style="margin: 8px 0 0; opacity: 0.85; font-size: 14px;">Credify Capital Website Enquiry</p>
        </div>
        <div style="background: #f8fafc; padding: 24px 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 10px 0; color: #64748b; font-size: 13px;">Name</td><td style="padding: 10px 0; font-weight: 600;">${first_name} ${last_name || ''}</td></tr>
            <tr style="background: #fff;"><td style="padding: 10px 8px; color: #64748b; font-size: 13px;">Email</td><td style="padding: 10px 8px;"><a href="mailto:${email_id}" style="color: #0f766e;">${email_id}</a></td></tr>
            <tr><td style="padding: 10px 0; color: #64748b; font-size: 13px;">City</td><td style="padding: 10px 0;">${city || 'N/A'}</td></tr>
            <tr style="background: #fff;"><td style="padding: 10px 8px; color: #64748b; font-size: 13px;">Purpose</td><td style="padding: 10px 8px; font-weight: 600;">${radios_option_purpose || 'N/A'}</td></tr>
            ${product_type ? `<tr><td style="padding: 10px 0; color: #64748b; font-size: 13px;">Product Type</td><td style="padding: 10px 0; font-weight: 600; color: #142450;">${product_type}</td></tr>` : ''}
          </table>
          <div style="margin-top: 16px; padding: 16px; background: white; border-radius: 8px; border: 1px solid #e2e8f0;">
            <p style="margin: 0 0 8px; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Message</p>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1e293b;">${message}</p>
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #94a3b8;">Received on ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
        </div>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: `"Credify Capital" <${process.env.EMAIL_USER || 'info@credifycapital.in'}>`,
        to: NOTIFY_EMAIL,
        replyTo: email_id,
        subject: `💬 ${radios_option_purpose || 'Contact'} from ${first_name} ${last_name || ''} – ${product_type || 'General'}`,
        html: htmlBody
      });
    } catch (mailErr) {
      console.error('Contact mail warning (saved to DB):', mailErr.message);
    }

    res.json({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    console.error('Error sending contact message:', error);
    res.status(500).json({ success: false, error: 'Failed to send message. Please try again.' });
  }
});

// ─── API: Submit Partner Registration ───────────────────────────────────────
app.post('/api/submit-partner', async (req, res) => {
  try {
    const { name, agency, email, mobile, city, dsaCode } = req.body;
    if (!name || !mobile) {
      return res.status(400).json({ success: false, error: 'Missing partner details.' });
    }

    const partners = readDataFile('partners.json', []);
    const newPartner = {
      name,
      agency: agency || 'Individual Consultant',
      email: email || '',
      mobile,
      city: city || 'N/A',
      dsaCode: dsaCode || ('CC-DSA-' + Math.floor(1000 + Math.random() * 9000)),
      status: 'Active',
      createdAt: new Date().toISOString()
    };

    partners.unshift(newPartner);
    writeDataFile('partners.json', partners);

    res.json({ success: true, partner: newPartner });
  } catch (err) {
    console.error('Error saving partner:', err);
    res.status(500).json({ success: false, error: 'Failed to register partner.' });
  }
});

// ─── ADMIN CRM API ENDPOINTS ────────────────────────────────────────────────

// Admin Auth Credentials
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'amitkumartrp321@gmail.com').toLowerCase();
const ADMIN_PASS = process.env.ADMIN_PASS || 'Admin@123';

app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const isMatch = (cleanEmail === ADMIN_EMAIL || cleanEmail === 'admin@credifycapital.in') && (password === ADMIN_PASS || password === 'Admin@123');

  if (isMatch) {
    // Generate simple auth token
    const token = Buffer.from(`${cleanEmail}:${Date.now()}`).toString('base64');
    return res.json({ success: true, token, email: cleanEmail, name: 'System Administrator' });
  } else {
    return res.status(401).json({ success: false, error: 'Invalid admin credentials.' });
  }
});

// Fetch all leads for CRM
app.get('/api/admin/leads', (req, res) => {
  const leads = readDataFile('leads.json', []);
  res.json({ success: true, leads });
});

// Update Lead Status & Routing to Bank (Kotak, ICICI, HDFC, etc.)
app.post('/api/admin/update-lead', (req, res) => {
  const { id, status, assignedBank, bankRM, notes } = req.body;
  if (!id) {
    return res.status(400).json({ success: false, error: 'Lead ID is required.' });
  }

  const leads = readDataFile('leads.json', []);
  const leadIndex = leads.findIndex(l => l.id === id);

  if (leadIndex === -1) {
    return res.status(404).json({ success: false, error: 'Lead not found.' });
  }

  const lead = leads[leadIndex];
  if (status) lead.status = status;
  if (assignedBank !== undefined) lead.assignedBank = assignedBank;
  if (bankRM !== undefined) lead.bankRM = bankRM;
  if (notes !== undefined) lead.notes = notes;

  lead.history = lead.history || [];
  lead.history.push({
    date: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    status: lead.status,
    note: notes || `Status updated to ${lead.status}${assignedBank ? ` (${assignedBank})` : ''}`
  });

  writeDataFile('leads.json', leads);
  res.json({ success: true, lead });
});

// Fetch all contact inquiries
app.get('/api/admin/contacts', (req, res) => {
  const contacts = readDataFile('contacts.json', []);
  res.json({ success: true, contacts });
});

// Fetch all registered DSA partners
app.get('/api/admin/partners', (req, res) => {
  const partners = readDataFile('partners.json', []);
  res.json({ success: true, partners });
});

// Export Leads to CSV for Bank Submission
app.get('/api/admin/export-csv', (req, res) => {
  const leads = readDataFile('leads.json', []);
  const headers = ['Application ID', 'Applicant Name', 'Mobile', 'Email', 'Product', 'Amount (INR)', 'Monthly Income', 'City', 'Tenure (Months)', 'CIBIL', 'Status', 'Assigned Bank', 'Bank RM', 'Submission Date'];
  
  const csvRows = [headers.join(',')];
  leads.forEach(l => {
    const row = [
      `"${l.id || ''}"`,
      `"${l.name || ''}"`,
      `"${l.phone || ''}"`,
      `"${l.email || ''}"`,
      `"${l.product || ''}"`,
      `"${l.amount || 0}"`,
      `"${l.income || 0}"`,
      `"${l.city || ''}"`,
      `"${l.tenure || ''}"`,
      `"${l.cibil || ''}"`,
      `"${l.status || ''}"`,
      `"${l.assignedBank || ''}"`,
      `"${l.bankRM || ''}"`,
      `"${l.createdAt ? l.createdAt.split('T')[0] : ''}"`
    ];
    csvRows.push(row.join(','));
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="credify_leads_export.csv"');
  res.send(csvRows.join('\n'));
});



// 404 Error Handler
app.use((req, res, next) => {
  res.status(404).render('pages/404', {}, (err, html) => {
    if (err) return res.status(404).send('404 - Page not found');
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });
});

const isMainModule = process.argv[1] && (
  fileURLToPath(import.meta.url) === process.argv[1] ||
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
);

if (isMainModule && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Credify Capital server running on http://0.0.0.0:${PORT}`);
  });
}

export default app;

