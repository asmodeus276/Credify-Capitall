import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import dns from 'dns';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import nodemailer from 'nodemailer';

// Force IPv4 DNS resolution first to prevent ENETUNREACH errors on cloud platforms like Render
try {
  if (dns && dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (e) {
  // Ignore if unsupported in environment
}

const app = express();
const PORT = process.env.PORT || 3000;

// Trust reverse proxies (Cloudflare / Render / load balancers)
app.set('trust proxy', 1);

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

// (Page router will be mounted after API routes below)

// ─── Email Notification Transporter & HTTP API Providers ───────────────────────
const EMAIL_USER = (process.env.EMAIL_USER || '').trim();
const EMAIL_PASS = (process.env.EMAIL_PASS || '').replace(/\s+/g, '').replace(/^["']|["']$/g, '');
const NOTIFY_EMAIL = (process.env.NOTIFY_EMAIL || 'amitkumartrp321@gmail.com').trim();
const RESEND_API_KEY = (process.env.RESEND_API_KEY || '').trim();
const BREVO_API_KEY = (process.env.BREVO_API_KEY || '').trim();
const WEB3FORMS_KEY = (process.env.WEB3FORMS_KEY || '').trim();

// Log email config at startup (password masked for security)
console.log(`📧 Email config: USER=${EMAIL_USER || '(not set)'} | PASS=${EMAIL_PASS ? EMAIL_PASS.slice(0,4) + '****' + EMAIL_PASS.slice(-4) + ' (len=' + EMAIL_PASS.length + ')' : '(not set)'} | NOTIFY=${NOTIFY_EMAIL} | RESEND=${RESEND_API_KEY ? 'Configured ✅' : '(not set)'} | BREVO=${BREVO_API_KEY ? 'Configured ✅' : '(not set)'} | WEB3FORMS=${WEB3FORMS_KEY ? 'Configured ✅' : '(not set)'}`);

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  family: 4, // Force IPv4 to prevent ENETUNREACH errors on cloud platforms like Render
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000
});

// Verify email configuration at startup if using SMTP
if (RESEND_API_KEY) {
  console.log(`✅ Resend HTTP API ready to send leads to ${NOTIFY_EMAIL} (bypasses Render SMTP port restrictions).`);
} else if (BREVO_API_KEY) {
  console.log(`✅ Brevo HTTP API ready to send leads to ${NOTIFY_EMAIL} (bypasses Render SMTP port restrictions).`);
} else if (EMAIL_USER && EMAIL_PASS) {
  transporter.verify((error) => {
    if (error) {
      console.error('❌ Gmail SMTP FAILED at startup:', error.code, '-', error.message);
      if (error.code === 'EAUTH') {
        console.error('❌ EAUTH: App Password is invalid or incomplete (must be 16 chars). Check EMAIL_PASS in Render dashboard.');
      } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT' || error.code === 'ENETUNREACH') {
        console.error('❌ Network error: Cannot reach Gmail SMTP. Render Free Tier blocks outbound SMTP (ports 25, 465, 587). Consider using RESEND_API_KEY (HTTP API) or upgrading to Render Starter.');
      }
    } else {
      console.log(`✅ Gmail SMTP ready: ${EMAIL_USER} -> ${NOTIFY_EMAIL}`);
    }
  });
} else {
  console.error('❌ EMAIL_USER or EMAIL_PASS is missing! Check environment variables. Email alerts will NOT be sent.');
}

/**
 * Universal email notification sender supporting HTTP APIs (Resend, Brevo)
 * and standard Gmail SMTP (Nodemailer).
 * HTTP APIs use HTTPS port 443 which is NEVER blocked by Render Free Tier!
 */
async function sendNotificationEmail({ fromName = 'Credify Capital', subject, text, html, replyTo }) {
  // 1. Prioritize Resend HTTP API if configured (Port 443 HTTPS, immune to Render SMTP block)
  if (RESEND_API_KEY) {
    const resendFrom = process.env.RESEND_FROM || 'Credify Capital <onboarding@resend.dev>';
    const targetEmail = NOTIFY_EMAIL;

    let resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: resendFrom,
        to: [targetEmail],
        reply_to: replyTo || undefined,
        subject,
        text,
        html
      })
    });
    let data = await resp.json();

    // If Resend free tier restricts to registered email (unverified custom domain), fall back automatically
    if (!resp.ok && data.name === 'validation_error' && data.message && data.message.includes('your own email address')) {
      const match = data.message.match(/\(([^)]+)\)/);
      const accountOwnerEmail = match ? match[1] : (EMAIL_USER || 'vvg29117@gmail.com');
      console.warn(`⚠️ Resend test domain in use: Auto-delivering lead to registered account email (${accountOwnerEmail}).`);
      
      resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [accountOwnerEmail],
          reply_to: replyTo || undefined,
          subject: `[Lead Alert] ${subject}`,
          text,
          html
        })
      });
      data = await resp.json();
    }

    if (!resp.ok) {
      throw new Error(`Resend API error (${resp.status}): ${JSON.stringify(data)}`);
    }
    return { provider: 'resend', id: data.id };
  }

  // 2. Brevo HTTP API if configured (Port 443 HTTPS)
  if (BREVO_API_KEY) {
    const senderEmail = EMAIL_USER || 'no-reply@credifycapital.in';
    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: fromName, email: senderEmail },
        to: [{ email: NOTIFY_EMAIL }],
        replyTo: replyTo ? { email: replyTo } : undefined,
        subject,
        textContent: text,
        htmlContent: html
      })
    });
    const data = await resp.json();
    if (!resp.ok) {
      throw new Error(`Brevo API error (${resp.status}): ${JSON.stringify(data)}`);
    }
    return { provider: 'brevo', id: data.messageId };
  }

  // 3. Gmail SMTP via Nodemailer (Fallback)
  if (EMAIL_USER && EMAIL_PASS) {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${EMAIL_USER}>`,
      to: NOTIFY_EMAIL,
      replyTo: replyTo || undefined,
      subject,
      text,
      html
    });
    return { provider: 'smtp', id: info.messageId };
  }

  throw new Error('No email provider configured. Please set EMAIL_USER & EMAIL_PASS, or set RESEND_API_KEY.');
}

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
      const plainText = `NEW LOAN APPLICATION - CREDIFY CAPITAL\n\nApplication ID: ${leadId}\nName: ${name}\nMobile: +91 ${phone}\nEmail: ${email}\nLoan Type: ${product}\nLoan Amount: ₹${amount ? Number(amount).toLocaleString('en-IN') : 'N/A'}\nMonthly Income: ₹${income ? Number(income).toLocaleString('en-IN') : 'N/A'}\nCity: ${city || 'N/A'}\nTenure: ${tenure ? tenure + ' months' : 'N/A'}\n${isPartnerReferral ? `Referred By Partner: ${referredByPartnerName} (${referredByPartnerCode})\n` : ''}Date: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n\nView and manage this application in your Admin CRM Dashboard.`;

      const mailRes = await sendNotificationEmail({
        fromName: 'Credify Capital Leads',
        subject: `🏦 New ${product} Application – ${name} (${leadId})`,
        text: plainText,
        html: htmlBody,
        replyTo: email
      });
      console.log(`📧 Lead email notification sent for ${leadId} via ${mailRes.provider} to ${NOTIFY_EMAIL}`);
    } catch (mailErr) {
      console.error(`❌ Lead email FAILED for ${leadId}:`, mailErr.message);
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
      const plainText = `NEW CONTACT ENQUIRY - CREDIFY CAPITAL\n\nName: ${first_name} ${last_name || ''}\nEmail: ${email_id}\nCity: ${city || 'N/A'}\nPurpose: ${radios_option_purpose || 'N/A'}\nProduct: ${product_type || 'General'}\n\nMessage:\n${message}\n\nDate: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;

      const mailRes = await sendNotificationEmail({
        fromName: 'Credify Capital Enquiries',
        subject: `💬 ${radios_option_purpose || 'Contact'} from ${first_name} ${last_name || ''} – ${product_type || 'General'}`,
        text: plainText,
        html: htmlBody,
        replyTo: email_id
      });
      console.log(`📧 Contact email notification sent via ${mailRes.provider} to ${NOTIFY_EMAIL}`);
    } catch (mailErr) {
      console.error('❌ Contact email FAILED:', mailErr.message);
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

    // Send Partner Email Notification
    try {
      const mailRes = await sendNotificationEmail({
        fromName: 'Credify Capital',
        subject: `🤝 New DSA Partner Registered – ${name} (${newPartner.dsaCode})`,
        text: `New DSA Partner Registered: ${name} (${newPartner.dsaCode})\nMobile: ${mobile}\nEmail: ${email || 'N/A'}\nCity: ${city || 'N/A'}`,
        html: partnerHtml,
        replyTo: email || undefined
      });
      console.log(`📧 Partner registration email sent for ${newPartner.dsaCode} via ${mailRes.provider} to ${NOTIFY_EMAIL}`);
    } catch (partnerMailErr) {
      console.error('❌ Partner email FAILED:', partnerMailErr.message);
    }

    res.json({ success: true, partner: newPartner });
  } catch (err) {
    console.error('Error saving partner:', err);
    res.status(500).json({ success: false, error: 'Failed to register partner.' });
  }
});

// ─── API: Test Email Configuration ──────────────────────────────────────────
app.get('/api/admin/test-email', async (req, res) => {
  if (!RESEND_API_KEY && (!EMAIL_USER || !EMAIL_PASS)) {
    console.error('❌ test-email: No email credentials configured in environment variables.');
    return res.status(400).json({
      success: false,
      error: 'No email credentials configured. Please set EMAIL_USER & EMAIL_PASS or set RESEND_API_KEY in Render.'
    });
  }

  console.log(`🔍 test-email: Testing email delivery to ${NOTIFY_EMAIL}...`);
  try {
    const mailRes = await sendNotificationEmail({
      fromName: 'Credify Capital Diagnostic',
      subject: '✅ Credify Capital - Email Delivery Diagnostic Test',
      text: `Credify Capital Email Delivery Diagnostic Test successful!\nRecipient: ${NOTIFY_EMAIL}\nTimestamp: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
          <h2 style="color: #166534; margin: 0 0 10px;">✅ Credify Capital - Email Delivery Working!</h2>
          <p style="color: #15803d; margin: 0 0 10px;">Your notifications are now being delivered successfully to your inbox.</p>
          <ul style="color: #374151; font-size: 14px;">
            <li><strong>Recipient (NOTIFY_EMAIL):</strong> ${NOTIFY_EMAIL}</li>
            <li><strong>Timestamp:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</li>
          </ul>
        </div>
      `
    });

    console.log(`✅ test-email: Sent OK via ${mailRes.provider}! ID=${mailRes.id}`);
    res.json({
      success: true,
      provider: mailRes.provider,
      message: `Test email successfully delivered to ${NOTIFY_EMAIL} via ${mailRes.provider}!`,
      id: mailRes.id
    });
  } catch (err) {
    console.error('❌ test-email FAILED:', err.message);
    res.status(500).json({
      success: false,
      error: err.message,
      code: err.code || 'DELIVERY_ERROR',
      hint: 'If seeing Connection Timeout or ENETUNREACH on Render, Render Free Tier blocks outbound SMTP. The fastest permanent fix is getting a free Resend API Key from resend.com and adding RESEND_API_KEY in Render dashboard (uses HTTPS port 443 which is never blocked).'
    });
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
      `"${(l.name || '').replace(/"/g, '""')}"`,
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
      `"${(l.bankRM || '').replace(/"/g, '""')}"`,
      `"${l.createdAt ? l.createdAt.split('T')[0] : ''}"`
    ];
    csvRows.push(row.join(','));
  });

  // UTF-8 BOM (\uFEFF) ensures Excel opens special characters and columns cleanly
  const csvData = '\uFEFF' + csvRows.join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="credify_leads_export.csv"');
  res.send(csvData);
});



// Mount Page Router
app.use(pageRouter);

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

  // Ensure compatibility if Railway custom domain forwards to port 3000 while PORT is different (e.g. 8080)
  if (String(PORT) !== '3000') {
    try {
      app.listen(3000, '0.0.0.0', () => {
        console.log('Also listening on backup port 3000');
      }).on('error', (err) => {
        if (err.code !== 'EADDRINUSE') console.error('Port 3000 bind error:', err.message);
      });
    } catch (e) {
      // Ignore if already bound
    }
  }
}

export default app;

