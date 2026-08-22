# Credify Capital – Modern Financial Services Portal

A fast, modern web application for financial consulting, loan advisory, lead origination, and partner DSA management built for **Credify Capital**.

---

## 🚀 Features

- **Multi-Product Loan Directory**: Business Loans, Personal Loans, Professional Loans, Machinery Loans, Medical Equipment Loans, LAP, and more.
- **Dynamic EMI Calculator**: Interactive rate, tenure, and monthly installment simulation.
- **Online Loan Application (`/apply.html`)**: Instant lead origination with automatic email delivery to the business inbox.
- **Real-Time Application Tracker (`/track-application.html`)**: Live milestone pipeline tracking and document compliance desk.
- **DSA Partner Portal (`/partner-login.html`)**: Partner authentication, lead submission, referral pipeline, and commission tracking.
- **Contact Desk (`/contact-us.html`)**: Interactive customer inquiry and callback request form.
- **Nodemailer Email Integration**: Secure Gmail SMTP integration sending structured lead & contact notifications.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express (ES Modules)
- **Templating**: EJS with CSP Nonce Protection
- **Styling**: Tailwind CSS (Pre-compiled into `css/tailwind-built.css`)
- **Email Delivery**: Nodemailer (STARTTLS / Gmail App Passwords)
- **Security**: Helmet, CSP nonces, express-rate-limit, input validation

---

## ⚙️ Environment Variables Setup

Create a `.env` file in the root directory (refer to `.env.example`):

```env
PORT=3000
NODE_ENV=production

# Email sender configuration (Gmail App Password)
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_16_digit_gmail_app_password

# Official recipient for lead and contact inquiry notifications
NOTIFY_EMAIL=amitkumartrp321@gmail.com
```

> **Note on Gmail App Password**:
> Go to Google Account > Security > 2-Step Verification > App Passwords > Create a password for "Mail". Paste the 16-character code as `EMAIL_PASS`.

---

## 💻 Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Build Tailwind CSS (Optional / If modifying styles)**:
   ```bash
   npm run build:css
   ```

3. **Run Dev Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Run Automated Tests**:
   ```bash
   npm test
   ```

---

## 🌐 Production Deployment

### Option 1: Render / Railway / VPS / Heroku
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- Set Environment Variables in your hosting dashboard:
  - `EMAIL_USER`
  - `EMAIL_PASS`
  - `NOTIFY_EMAIL`

---

## 📄 License
Private & Proprietary – Credify Capital. All rights reserved.
