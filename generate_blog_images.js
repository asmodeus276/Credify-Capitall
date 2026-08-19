

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const blogTitles = {
  'all-about-personal-loan-disbursement-process.jpg': { category: 'DISBURSAL', title1: 'Personal Loan', title2: 'Disbursement Guide' },
  'how-to-get-a-personal-loan-in-five-easy-steps.jpg': { category: 'LOAN GUIDE', title1: 'Personal Loan in', title2: '5 Easy Steps' },
  'how-to-use-personal-loan-for-financial-investment.jpg': { category: 'INVESTMENT', title1: 'Personal Loan for', title2: 'Wealth and Investments' },
  'top-advantages-of-applying-online-for-personal-loan.jpg': { category: 'DIGITAL LENDING', title1: 'Top Advantages of', title2: 'Online Applications' },
  'top-benefits-of-using-car-loan-emi-calculator.jpg': { category: 'PLANNING', title1: 'Car Loan EMI', title2: 'Calculator Benefits' },
  'top-benefits-of-using-loan-against-property-emi-calculator.jpg': { category: 'PLANNING', title1: 'Property Loan EMI', title2: 'Calculator Guide' },
  'top-benefits-of-using-machinery-loan-emi-calculator.jpg': { category: 'BUSINESS', title1: 'Machinery Loan EMI', title2: 'Estimation Tips' },
  'top-benefits-of-using-medical-equipment-loan-emi-calculator.jpg': { category: 'HEALTHCARE', title1: 'Medical Equipment', title2: 'Loan Calculator' },
  'top-benefits-of-using-personal-loan-emi-calculator.jpg': { category: 'PLANNING', title1: 'Personal Loan EMI', title2: 'Calculator Tips' },
  'what-happens-if-you-miss-to-pay-personal-loan-emi.jpg': { category: 'CREDIT HEALTH', title1: 'What Happens If You', title2: 'Miss an EMI?' },
  'where-can-i-get-car-loan-online.jpg': { category: 'CAR LOAN', title1: 'Best Platforms for', title2: 'Online Car Loans' },
  'where-can-i-get-loan-against-property-online.jpg': { category: 'PROPERTY LOAN', title1: 'Where to Get LAP', title2: 'Loans Online' },
  'where-can-i-get-machinery-loan-online.jpg': { category: 'BUSINESS LOAN', title1: 'Get Machinery Loans', title2: 'Fast Online' },
  'where-can-i-get-medical-equipment-loan-online.jpg': { category: 'MEDICAL LOAN', title1: 'Medical Equipment', title2: 'Financing Online' },
  'where-can-i-get-personal-loan-online.jpg': { category: 'PERSONAL LOAN', title1: 'Best Online Personal', title2: 'Loan Providers' }
};

const gradients = [
  ['#1F3164', '#253A71'],
  ['#162447', '#1F4068'],
  ['#0F4C81', '#1B6CA8'],
  ['#1B262C', '#0F4C81'],
  ['#222831', '#393E46']
];

async function generate() {
  const dir = './img/blog';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const entries = Object.entries(blogTitles);
  for (let i = 0; i < entries.length; i++) {
    const [fileName, meta] = entries[i];
    const grad = gradients[i % gradients.length];

    const svg = `
    <svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg-${i}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${grad[0]}" />
          <stop offset="100%" stop-color="${grad[1]}" />
        </linearGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#C81E1E" />
          <stop offset="100%" stop-color="#E53E3E" />
        </linearGradient>
      </defs>

      <!-- Background -->
      <rect width="100%" height="100%" fill="url(#bg-${i})" />

      <!-- Decorative Shapes -->
      <circle cx="720" cy="90" r="220" fill="#ffffff" opacity="0.04" />
      <circle cx="680" cy="380" r="140" fill="#C81E1E" opacity="0.1" />
      <path d="M 0 350 Q 200 300 400 450 L 0 450 Z" fill="#ffffff" opacity="0.02" />

      <!-- Category Pill -->
      <rect x="60" y="55" width="140" height="34" rx="17" fill="url(#accent)" />
      <text x="130" y="77" font-family="'Inter', system-ui, sans-serif" font-size="12" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">${meta.category}</text>

      <!-- Main Title Lines -->
      <text x="60" y="160" font-family="'Inter', system-ui, sans-serif" font-size="34" font-weight="800" fill="#ffffff">${meta.title1}</text>
      <text x="60" y="208" font-family="'Inter', system-ui, sans-serif" font-size="34" font-weight="800" fill="#ffffff">${meta.title2}</text>

      <!-- Subtitle/Brand Bar -->
      <line x1="60" y1="360" x2="740" y2="360" stroke="#ffffff" stroke-opacity="0.15" stroke-width="1" />
      
      <!-- Brand Logo Mark -->
      <circle cx="75" cy="395" r="12" fill="#C81E1E" />
      <text x="95" y="401" font-family="'Inter', system-ui, sans-serif" font-size="16" font-weight="800" fill="#ffffff" letter-spacing="0.5">Credify <tspan fill="#C81E1E">Capital</tspan></text>
      <text x="740" y="401" font-family="'Inter', system-ui, sans-serif" font-size="13" font-weight="600" fill="#ffffff" opacity="0.6" text-anchor="end">Financial Guide and Insights</text>
    </svg>`;

    const targetPath = path.join(dir, fileName);
    await sharp(Buffer.from(svg))
      .jpeg({ quality: 92 })
      .toFile(targetPath);

    console.log(`Generated ${fileName}`);
  }
}

generate().catch(console.error);
