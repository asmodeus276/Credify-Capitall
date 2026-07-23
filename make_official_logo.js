import fs from 'fs';
import sharp from 'sharp';

// Precise recreation of the user's logo using custom vector paths:
// - The "C" is drawn as a custom geometric circular arc to match the logo mark exactly, instead of standard text "C".
// - The inner and outer orbit rings and trend arrow are perfectly layered.
// - "REDIFY" and "CAPITAL" are sized and placed with perfect alignment.
const svg = `<svg width="800" height="373" viewBox="0 0 600 280" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .navy-text {
        font-family: -apple-system, BlinkMacSystemFont, "Montserrat", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-weight: 900;
        fill: #1D2D5F;
      }
      .red-text {
        font-family: -apple-system, BlinkMacSystemFont, "Montserrat", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-weight: 900;
        fill: #E22828;
      }
      .tagline-text {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-weight: 700;
        fill: #1D2D5F;
      }
    </style>
  </defs>

  <g transform="translate(10, 15)">
    <!-- 1. Custom Vector "C" Icon (Background Layer) -->
    <g transform="translate(48, 55)">
      <!-- The main thick geometric Navy C -->
      <path d="M 52 -28 A 42 42 0 1 0 52 28" fill="none" stroke="#1D2D5F" stroke-width="17.5" stroke-linecap="round" />
      
      <!-- The inner thin Navy C -->
      <path d="M 32 -18 A 24 24 0 1 0 32 18" fill="none" stroke="#1D2D5F" stroke-width="4.5" stroke-linecap="round" />
    </g>

    <!-- 2. Orbit Rings and Red Arrow Overlay (Foreground Layer) -->
    <g transform="translate(48, 55)">
      <!-- Outer Navy Orbit Ring -->
      <path d="M 50 -36 A 52 52 0 1 0 78 30" fill="none" stroke="#1D2D5F" stroke-width="5.5" stroke-linecap="round" />
      
      <!-- Outer Red Orbit Ring -->
      <path d="M 68 -20 A 52 52 0 0 1 -10 40" fill="none" stroke="#E22828" stroke-width="5.5" stroke-linecap="round" />

      <!-- Red Zigzag Trend Line crossing over the C -->
      <path d="M -42 22 L -18 8 L 0 25 L 115 -74" fill="none" stroke="#E22828" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round" />
      
      <!-- Arrowhead -->
      <polygon points="122,-82 100,-76 112,-58" fill="#E22828" />
    </g>

    <!-- 3. REDIFY Text (Placed next to the custom C icon) -->
    <text x="126" y="112" class="navy-text" font-size="96" letter-spacing="-3px">REDIFY</text>

    <!-- 4. CAPITAL with flanking lines -->
    <line x1="12" y1="172" x2="135" y2="172" stroke="#1D2D5F" stroke-width="9" stroke-linecap="round" />
    <text x="300" y="190" class="red-text" font-size="52" text-anchor="middle" letter-spacing="12px">CAPITAL</text>
    <line x1="465" y1="172" x2="588" y2="172" stroke="#1D2D5F" stroke-width="9" stroke-linecap="round" />

    <!-- 5. Tagline -->
    <text x="300" y="250" class="tagline-text" font-size="26" text-anchor="middle" letter-spacing="0.5px">Smart Solutions. Fast Approvals</text>
  </g>
</svg>`;

fs.writeFileSync('./img/logo-official.svg', svg);
await sharp(Buffer.from(svg))
  .png()
  .toFile('./img/logo-official.png');

console.log('Successfully generated official logo with geometric C!');
