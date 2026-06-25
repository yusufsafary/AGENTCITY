export const config = { runtime: 'nodejs' };

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Generate a city skyline path that varies by username (deterministic)
function cityPath(seed, width = 1200, groundY = 480) {
  let h = Math.abs(seed) % 100;
  const buildings = [];
  let x = 80;
  const rng = (n) => { h = (h * 1664525 + 1013904223 + n) & 0xffffffff; return (h >>> 0) / 0xffffffff; };

  while (x < width - 80) {
    const w = 40 + Math.floor(rng(x) * 70);
    const height = 60 + Math.floor(rng(x + 1) * 280);
    const y = groundY - height;
    // windows rows
    const winRows = Math.floor(height / 22);
    const winCols = Math.max(1, Math.floor((w - 12) / 18));
    buildings.push({ x, y, w, h: height, winRows, winCols });
    x += w + 6 + Math.floor(rng(x + 2) * 18);
  }
  return buildings;
}

function userSeed(username) {
  let s = 0;
  for (let i = 0; i < username.length; i++) s = (s * 31 + username.charCodeAt(i)) | 0;
  return s;
}

export default async function handler(req, res) {
  const username = (req.query.u || 'github').trim().replace(/[^a-zA-Z0-9_-]/g, '') || 'github';
  const name = esc(req.query.name || username);
  const followers = parseInt(req.query.followers || '0', 10);
  const repos = parseInt(req.query.repos || '0', 10);
  const bio = esc((req.query.bio || '').slice(0, 80));

  const W = 1200, H = 630;
  const GROUND = 490;
  const seed = userSeed(username);
  const buildings = cityPath(seed, W, GROUND);

  // Colour palette derived from username seed
  const PALETTES = [
    { sky1: '#060D1F', sky2: '#0d0720', lime: '#CAFF00', cyan: '#00D4FF', pink: '#FF0090' },
    { sky1: '#060D1F', sky2: '#0a0d20', lime: '#00FF94', cyan: '#00D4FF', pink: '#FF0090' },
    { sky1: '#060D1F', sky2: '#100720', lime: '#CAFF00', cyan: '#FFB700', pink: '#FF0090' },
  ];
  const pal = PALETTES[Math.abs(seed) % PALETTES.length];

  // Build SVG buildings
  const buildingSvg = buildings.map(b => {
    // Randomly lit windows
    const winSvg = [];
    const rng = (n) => { let h = (seed * 1664525 + b.x * 31 + n) >>> 0; return h / 0xffffffff; };
    for (let row = 0; row < b.winRows; row++) {
      for (let col = 0; col < b.winCols; col++) {
        const lit = rng(row * 100 + col) > 0.38;
        if (!lit) continue;
        const wx = b.x + 6 + col * 18;
        const wy = b.y + 8 + row * 22;
        const color = rng(row + col * 7) > 0.7 ? pal.pink : rng(row + col * 13) > 0.5 ? pal.cyan : pal.lime;
        winSvg.push(`<rect x="${wx}" y="${wy}" width="10" height="14" rx="1" fill="${color}" opacity="0.65"/>`);
      }
    }
    // Antenna on tallest buildings
    const antenna = b.h > 200 ? `<rect x="${b.x + b.w / 2 - 1.5}" y="${b.y - 18}" width="3" height="18" fill="${pal.cyan}" opacity="0.8"/>
      <circle cx="${b.x + b.w / 2}" cy="${b.y - 20}" r="4" fill="${pal.lime}" opacity="0.9"/>` : '';
    return `
      <rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="2" fill="#0B1A35" stroke="${pal.cyan}" stroke-width="0.5" stroke-opacity="0.25"/>
      ${winSvg.join('')}
      ${antenna}`;
  }).join('');

  // Ground glow
  const groundSvg = `
    <rect x="0" y="${GROUND}" width="${W}" height="${H - GROUND}" fill="#050C1C"/>
    <rect x="0" y="${GROUND}" width="${W}" height="2" fill="${pal.cyan}" opacity="0.4"/>
    <rect x="0" y="${GROUND + 1}" width="${W}" height="8" fill="url(#groundGlow)"/>`;

  // Stars
  let starsSvg = '';
  for (let i = 0; i < 80; i++) {
    const rng = (n) => { let h = (seed * 9301 + i * 49297 + n) % 233280; return h / 233280; };
    const sx = rng(1) * W;
    const sy = rng(2) * (GROUND - 160);
    const sr = 0.5 + rng(3) * 1.5;
    const so = 0.2 + rng(4) * 0.7;
    starsSvg += `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${sr.toFixed(1)}" fill="white" opacity="${so.toFixed(2)}"/>`;
  }

  // Format numbers
  const fmt = (n) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);

  const svg = `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${pal.sky1}"/>
      <stop offset="100%" stop-color="${pal.sky2}"/>
    </linearGradient>
    <linearGradient id="groundGlow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${pal.cyan}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${pal.cyan}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="limeGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${pal.lime}"/>
      <stop offset="100%" stop-color="${pal.cyan}"/>
    </linearGradient>
    <linearGradient id="panelGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(6,13,31,0.92)"/>
      <stop offset="100%" stop-color="rgba(13,7,32,0.92)"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="textGlow">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <clipPath id="clip"><rect width="${W}" height="${H}" rx="0"/></clipPath>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#skyGrad)"/>

  <!-- Stars -->
  ${starsSvg}

  <!-- City buildings -->
  ${buildingSvg}

  <!-- Ground -->
  ${groundSvg}

  <!-- Bottom fog -->
  <rect x="0" y="${GROUND - 40}" width="${W}" height="80" fill="url(#skyGrad)" opacity="0.35"/>

  <!-- Scanlines overlay -->
  <rect width="${W}" height="${H}" fill="none" stroke="rgba(0,212,255,0.03)" stroke-width="2" stroke-dasharray="1 3"/>

  <!-- Left panel: Agent City info -->
  <rect x="56" y="52" width="340" height="186" rx="18" fill="url(#panelGrad)" stroke="${pal.lime}" stroke-width="1" stroke-opacity="0.35"/>
  <!-- Panel top accent line -->
  <rect x="56" y="52" width="340" height="3" rx="2" fill="${pal.lime}" opacity="0.7"/>

  <!-- Logo icon 48x48 -->
  <g transform="translate(78, 76)">
    <defs>
      <linearGradient id="logoGrad" x1="0" y1="48" x2="48" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${pal.lime}"/>
        <stop offset="100%" stop-color="${pal.pink}"/>
      </linearGradient>
    </defs>
    <path d="M2,42 L2,32 L7,32 L7,26 L11,26 L11,32 L16,32 L16,14 L19,14 L19,9 L24,9 L24,14 L29,14 L29,22 L33,22 L33,26 L37,26 L37,30 L41,30 L41,22 L46,22 L46,42 Z" fill="url(#logoGrad)"/>
    <rect x="22.5" y="5" width="3" height="5" fill="${pal.pink}" rx="1"/>
    <circle cx="24" cy="4" r="3" fill="${pal.lime}"/>
    <circle cx="24" cy="4" r="1.5" fill="${pal.pink}"/>
  </g>

  <!-- Agent City label -->
  <text x="138" y="96" font-family="system-ui,-apple-system,sans-serif" font-size="13" font-weight="600" fill="${pal.lime}" letter-spacing="2" opacity="0.9">AGENT CITY</text>
  <text x="138" y="112" font-family="system-ui,-apple-system,sans-serif" font-size="10" fill="${pal.cyan}" opacity="0.6" letter-spacing="1">agentcity.uk</text>

  <!-- Separator -->
  <rect x="78" y="132" width="300" height="1" fill="${pal.lime}" opacity="0.18"/>

  <!-- Username -->
  <text x="78" y="162" font-family="system-ui,-apple-system,sans-serif" font-size="28" font-weight="700" fill="white" filter="url(#textGlow)">${name}</text>
  <!-- Bio -->
  ${bio ? `<text x="78" y="185" font-family="system-ui,-apple-system,sans-serif" font-size="12" fill="rgba(255,255,255,0.52)" width="300">${bio}</text>` : ''}

  <!-- Stats row -->
  <rect x="78" y="${bio ? 198 : 188}" width="80" height="28" rx="8" fill="rgba(202,255,0,0.08)" stroke="${pal.lime}" stroke-width="0.8" stroke-opacity="0.3"/>
  <text x="118" y="${bio ? 216 : 206}" font-family="system-ui,-apple-system,sans-serif" font-size="11" font-weight="600" fill="${pal.lime}" text-anchor="middle">${fmt(repos)} repos</text>

  <rect x="170" y="${bio ? 198 : 188}" width="88" height="28" rx="8" fill="rgba(0,212,255,0.08)" stroke="${pal.cyan}" stroke-width="0.8" stroke-opacity="0.3"/>
  <text x="214" y="${bio ? 216 : 206}" font-family="system-ui,-apple-system,sans-serif" font-size="11" font-weight="600" fill="${pal.cyan}" text-anchor="middle">${fmt(followers)} followers</text>

  <!-- Right: City built label -->
  <text x="${W - 56}" y="550" font-family="system-ui,-apple-system,sans-serif" font-size="11" fill="rgba(255,255,255,0.3)" text-anchor="end" letter-spacing="1">GITHUB ACTIVITY AS A 3D CITY</text>

  <!-- Bottom-left branding -->
  <text x="60" y="570" font-family="system-ui,-apple-system,sans-serif" font-size="10" fill="${pal.lime}" letter-spacing="1.5" opacity="0.55">AGENTCITY.UK</text>

  <!-- Horizontal neon line at top of city -->
  <rect x="0" y="${GROUND - 1}" width="${W}" height="1" fill="${pal.cyan}" opacity="0.22"/>
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).send(svg);
}
