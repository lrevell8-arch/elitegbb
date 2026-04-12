// Coach Badge Generation Endpoint
// GET /api/coach/deliverables/badge/{playerId}
// Allows coaches to view verified prospect badges for players they have access to

import { verifyJWT } from '../../../../utils/jwt.js';

// HWH Brand Colors
const COLORS = {
  primary: '#0134bd',      // HWH Blue
  secondary: '#fb6c1d',    // HWH Orange
  white: '#ffffff',
  black: '#1a1a1a',
  gold: '#ffd700'
};

const LEVEL_COLORS = {
  gold: '#d4af37',
  silver: '#c0c0c0',
  bronze: '#cd7f32',
  platinum: '#e5e4e2',
  burntOrange: '#c65d2a'
};

const BADGE_LEVELS = {
  prospect: {
    label: 'Prospect',
    color: LEVEL_COLORS.bronze
  },
  rising_star: {
    label: 'Rising Star',
    color: LEVEL_COLORS.silver
  },
  elite: {
    label: 'Elite',
    color: LEVEL_COLORS.gold
  },
  '5ball_recruit': {
    label: '5Ball Recruit',
    color: LEVEL_COLORS.platinum
  }
};

// Verify coach token
async function verifyCoachToken(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing token' };
  }

  const token = authHeader.substring(7);
  try {
    const payload = await verifyJWT(token, env.JWT_SECRET || 'fallback-secret-key-change-in-production');
    if (payload.role !== 'coach') {
      return { valid: false, error: 'Insufficient permissions - coach access required' };
    }
    return { valid: true, user: payload };
  } catch (err) {
    return { valid: false, error: 'Invalid token' };
  }
}

// Fetch player data from Supabase
async function fetchPlayerData(env, playerId) {
  const url = `${env.SUPABASE_URL}/rest/v1/players?id=eq.${playerId}&select=*`;
  const response = await fetch(url, {
    headers: {
      'apikey': env.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`
    }
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data?.[0] || null;
}

// Check if coach has access to this player
async function checkCoachAccess(env, coachId, playerId) {
  // First check if the player is saved by this coach
  const savedUrl = `${env.SUPABASE_URL}/rest/v1/coach_saved_players?coach_id=eq.${coachId}&player_id=eq.${playerId}&select=*`;
  const savedResponse = await fetch(savedUrl, {
    headers: {
      'apikey': env.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`
    }
  });

  if (savedResponse.ok) {
    const savedData = await savedResponse.json();
    if (savedData && savedData.length > 0) {
      return true;
    }
  }

  // For now, allow access to all verified players
  return true;
}

function normalizeBadgeLevel(level) {
  if (!level) return 'prospect';
  const normalized = level.toString().trim().toLowerCase().replace(/\s+/g, '_');
  if (normalized === '5ball' || normalized === 'fiveball' || normalized === '5_ball') {
    return '5ball_recruit';
  }
  if (normalized === 'risingstar') {
    return 'rising_star';
  }
  return normalized;
}

function getTextColor(hex) {
  const sanitized = hex.replace('#', '');
  const r = parseInt(sanitized.substring(0, 2), 16);
  const g = parseInt(sanitized.substring(2, 4), 16);
  const b = parseInt(sanitized.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.7 ? COLORS.black : COLORS.white;
}

// Generate SVG badge
function generateBadgeSVG(player, badgeMeta) {
  const width = 400;
  const height = 400;
  const playerName = (player.player_name || 'Unknown Player').toUpperCase();
  const year = player.grad_class || new Date().getFullYear();
  const position = player.primary_position || 'BASKETBALL';
  const verified = player.verified === true;
  const levelLabel = (badgeMeta?.label || 'Prospect').toUpperCase();
  const levelColor = badgeMeta?.color || LEVEL_COLORS.bronze;
  const levelTextColor = getTextColor(levelColor);

  // Create star burst path for background
  const starPoints = [];
  const outerRadius = 180;
  const innerRadius = 150;
  const centerX = 200;
  const centerY = 200;
  const numPoints = 16;

  for (let i = 0; i < numPoints * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / numPoints - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    starPoints.push(`${x},${y}`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${COLORS.primary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0254ff;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="secondaryGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${COLORS.secondary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ff8a4c;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffd700;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#ffed4a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ffd700;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.3)"/>
    </filter>
  </defs>

  <circle cx="200" cy="200" r="190" fill="url(#primaryGradient)" filter="url(#shadow)"/>
  <polygon points="${starPoints.join(' ')}" fill="${COLORS.primary}" opacity="0.3"/>
  <circle cx="200" cy="200" r="170" fill="none" stroke="url(#goldGradient)" stroke-width="4"/>
  <circle cx="200" cy="200" r="160" fill="none" stroke="${COLORS.secondary}" stroke-width="2" stroke-dasharray="10,5"/>
  
  <path d="M 60 80 Q 200 40 340 80 L 340 120 Q 200 80 60 120 Z" fill="${levelColor}"/>
  <text x="200" y="108" font-family="Arial Black, sans-serif" font-size="22" font-weight="800" fill="${levelTextColor}" text-anchor="middle" letter-spacing="2">${levelLabel}</text>
  <line x1="110" y1="130" x2="290" y2="130" stroke="${levelColor}" stroke-width="2" opacity="0.8" />
  <text x="200" y="150" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="${levelTextColor}" text-anchor="middle" letter-spacing="3">${year}</text>
  
  <circle cx="200" cy="200" r="130" fill="${COLORS.white}"/>
  
  <g transform="translate(200, 155)">
    <circle cx="0" cy="0" r="35" fill="${COLORS.secondary}"/>
    <path d="M -35 0 Q 0 0 35 0" fill="none" stroke="${COLORS.black}" stroke-width="2"/>
    <path d="M 0 -35 Q 0 0 0 35" fill="none" stroke="${COLORS.black}" stroke-width="2"/>
    <path d="M -25 -25 Q 0 0 25 25" fill="none" stroke="${COLORS.black}" stroke-width="2"/>
  </g>
  
  <text x="200" y="195" font-family="Arial Black, sans-serif" font-size="16" font-weight="800" fill="${COLORS.primary}" text-anchor="middle">GBB</text>
  
  <text x="200" y="235" font-family="Arial, sans-serif" font-size="${Math.max(12, 18 - playerName.length / 3)}" font-weight="700" fill="${COLORS.black}" text-anchor="middle" letter-spacing="1">
    ${playerName}
  </text>
  
  <line x1="100" y1="255" x2="300" y2="255" stroke="${COLORS.primary}" stroke-width="2"/>
  
  <text x="200" y="280" font-family="Arial, sans-serif" font-size="12" font-weight="600" fill="${COLORS.gray}" text-anchor="middle" text-transform="uppercase">
    ${position} • CLASS OF ${year}
  </text>
  
  ${verified ? `
  <g transform="translate(320, 60)">
    <circle cx="0" cy="0" r="25" fill="${COLORS.gold}" filter="url(#shadow)"/>
    <path d="M -8 2 L -3 7 L 8 -8" fill="none" stroke="${COLORS.primary}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  ` : ''}
  
  <text x="200" y="340" font-family="Arial, sans-serif" font-size="10" font-weight="600" fill="${COLORS.white}" text-anchor="middle" opacity="0.9">
    ${verified ? `✓ ${levelLabel} VERIFIED` : `${levelLabel} LEVEL`}
  </text>
  
  <text x="200" y="375" font-family="monospace" font-size="9" fill="${COLORS.white}" text-anchor="middle" opacity="0.7">
    ID: ${player.player_key || player.id || 'ELITE-000'}
  </text>
  
  <g opacity="0.2">
    <circle cx="40" cy="40" r="8" fill="${COLORS.secondary}"/>
    <circle cx="360" cy="40" r="8" fill="${COLORS.secondary}"/>
    <circle cx="40" cy="360" r="8" fill="${COLORS.secondary}"/>
    <circle cx="360" cy="360" r="8" fill="${COLORS.secondary}"/>
  </g>
</svg>`;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // Parse player ID from URL
  const pathMatch = url.pathname.match(/\/badge\/([^/]+)/);
  if (!pathMatch) {
    return new Response(
      JSON.stringify({ detail: 'Invalid URL format. Use: /api/coach/deliverables/badge/{playerId}' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const [, playerId] = pathMatch;
  const format = url.searchParams.get('format') || 'svg'; // svg, html

  try {
    // Verify coach authentication
    const auth = await verifyCoachToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch player data
    const player = await fetchPlayerData(env, playerId);
    if (!player) {
      return new Response(
        JSON.stringify({ detail: 'Player not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if coach has access
    const coachId = auth.user.coach_id || auth.user.sub;
    const hasAccess = await checkCoachAccess(env, coachId, playerId);
    if (!hasAccess) {
      return new Response(
        JSON.stringify({ detail: 'You do not have access to view this player\'s badge' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const levelParam = url.searchParams.get('level');
    const badgeLevel = normalizeBadgeLevel(levelParam || player.badge_level || 'prospect');
    const badgeMeta = BADGE_LEVELS[badgeLevel] || BADGE_LEVELS.prospect;

    // Generate badge
    const svg = generateBadgeSVG(player, badgeMeta);

    // Return based on requested format
    if (format === 'html') {
      const html = `<!DOCTYPE html>
<html>
<head>
  <title>${badgeMeta.label} Badge - ${player.player_name}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: #f3f4f6;
    }
    .container {
      text-align: center;
      background: white;
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .badge-container {
      margin: 20px 0;
    }
    .download-btn {
      display: inline-block;
      margin-top: 20px;
      padding: 12px 24px;
      background: #0134bd;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
    }
    .download-btn:hover {
      background: #0254ff;
    }
    h1 {
      color: #1a1a1a;
      margin-bottom: 8px;
    }
    p {
      color: #6b7280;
      margin-bottom: 20px;
    }
    .coach-info {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      background: #eff6ff;
      padding: 15px;
      border-radius: 8px;
    }
    .coach-info-title {
      font-size: 14px;
      font-weight: 600;
      color: #1e40af;
      margin-bottom: 8px;
    }
    .coach-info-text {
      font-size: 12px;
      color: #1e3a8a;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${badgeMeta.label} Badge</h1>
    <p>${player.player_name} • ${badgeMeta.label} • Class of ${player.grad_class || 'N/A'}</p>
    <div class="badge-container">
      ${svg}
    </div>
    <a href="data:image/svg+xml;base64,${btoa(svg)}" download="${player.player_name?.replace(/\s+/g, '_') || 'Player'}_Badge.svg" class="download-btn">
      Download SVG Badge
    </a>
    <div class="coach-info">
      <div class="coach-info-title">Coach Information</div>
      <div class="coach-info-text">
        This player is a ${badgeMeta.label.toLowerCase()} level prospect in the Elite GBB network.<br>
        Contact HWH at coaches@hoopwithher.com for referrals.
      </div>
    </div>
  </div>
</body>
</html>`;

      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Default: return raw SVG
    return new Response(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Access-Control-Allow-Origin': '*',
        'Content-Disposition': `inline; filename="${player.player_name?.replace(/\s+/g, '_') || 'Player'}_Badge.svg"`,
        'Cache-Control': 'private, max-age=3600'
      }
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ detail: 'Error generating badge', error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// OPTIONS handler for CORS
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
