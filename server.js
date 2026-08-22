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

// ─── API: Submit Loan Application ───────────────────────────────────────────
app.post('/api/submit-lead', formLimiter, async (req, res) => {
  try {
    const { id, name, phone, email, product, amount, income, city, tenure, source, referredByPartnerCode, referredByPartnerName } = req.body;

    if (!name || !phone || !email || !product) {
      return res.status(400).json({ success: false, error: 'Missing required fields.' });
    }

    const isPartnerReferral = source === 'partner_referral';

    const htmlBody = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #142450 0%, #1a3a8a 100%); color: white; padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 22px;">🏦 New Loan Application${isPartnerReferral ? ' (Partner Referral)' : ''}</h1>
          <p style="margin: 8px 0 0; opacity: 0.85; font-size: 14px;">Credify Capital Lead Notification</p>
        </div>
        <div style="background: #f8fafc; padding: 24px 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 10px 0; color: #64748b; font-size: 13px;">Application ID</td><td style="padding: 10px 0; font-weight: 700; color: #142450; font-family: monospace;">${id || 'N/A'}</td></tr>
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
          <p style="margin-top: 20px; font-size: 12px; color: #94a3b8;">Received on ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Credify Capital" <${process.env.EMAIL_USER || 'info@credifycapital.in'}>`,
      to: NOTIFY_EMAIL,
      subject: `🏦 New ${product} Application – ${name} (${id || 'N/A'})`,
      html: htmlBody
    });

    res.json({ success: true, message: 'Application submitted successfully.' });
  } catch (error) {
    console.error('Error sending lead email:', error);
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

    await transporter.sendMail({
      from: `"Credify Capital" <${process.env.EMAIL_USER || 'info@credifycapital.in'}>`,
      to: NOTIFY_EMAIL,
      replyTo: email_id,
      subject: `💬 ${radios_option_purpose || 'Contact'} from ${first_name} ${last_name || ''} – ${product_type || 'General'}`,
      html: htmlBody
    });

    res.json({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    console.error('Error sending contact email:', error);
    res.status(500).json({ success: false, error: 'Failed to send message. Please try again.' });
  }
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

