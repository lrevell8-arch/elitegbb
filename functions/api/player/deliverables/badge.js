// Player Badge Generation Endpoint
// GET /api/player/deliverables/badge
// Allows players to view their own verified prospect badge

import { verifyJWT } from '../../../utils/jwt.js';

// HWH Brand Colors
const COLORS = {
  primary: '#0134bd',      // HWH Blue
  secondary: '#fb6c1d',    // HWH Orange
  white: '#ffffff',
  black: '#1a1a1a',
  gold: '#ffd700'
};

// Verify player token
async function verifyPlayerToken(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing token' };
  }

  const token = authHeader.substring(7);
  try {
    const payload = await verifyJWT(token, env.JWT_SECRET || 'fallback-secret-key-change-in-production');
    if (payload.role !== 'player') {
      return { valid: false, error: 'Insufficient permissions - player access required' };
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

// Generate SVG badge
function generateBadgeSVG(player) {
  const width = 400;
  const height = 400;
  const playerName = (player.player_name || 'Unknown Player').toUpperCase();
  const year = player.grad_class || new Date().getFullYear();
  const position = player.primary_position || 'BASKETBALL';
  const verified = player.verified === true;

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
    <!-- Gradient definitions -->
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

  <!-- Background circle with gradient -->
  <circle cx="200" cy="200" r="190" fill="url(#primaryGradient)" filter="url(#shadow)"/>
  
  <!-- Star burst background -->
  <polygon points="${starPoints.join(' ')}" fill="${COLORS.primary}" opacity="0.3"/>
  
  <!-- Inner ring -->
  <circle cx="200" cy="200" r="170" fill="none" stroke="url(#goldGradient)" stroke-width="4"/>
  
  <!-- Secondary accent ring -->
  <circle cx="200" cy="200" r="160" fill="none" stroke="${COLORS.secondary}" stroke-width="2" stroke-dasharray="10,5"/>
  
  <!-- Top banner with ELITE text -->
  <path d="M 60 80 Q 200 40 340 80 L 340 120 Q 200 80 60 120 Z" fill="${COLORS.secondary}"/>
  <text x="200" y="108" font-family="Arial Black, sans-serif" font-size="24" font-weight="800" fill="${COLORS.white}" text-anchor="middle" letter-spacing="4">ELITE</text>
  
  <!-- Main content area -->
  <circle cx="200" cy="200" r="130" fill="${COLORS.white}"/>
  
  <!-- Basketball icon -->
  <g transform="translate(200, 155)">
    <circle cx="0" cy="0" r="35" fill="${COLORS.secondary}"/>
    <path d="M -35 0 Q 0 0 35 0" fill="none" stroke="${COLORS.black}" stroke-width="2"/>
    <path d="M 0 -35 Q 0 0 0 35" fill="none" stroke="${COLORS.black}" stroke-width="2"/>
    <path d="M -25 -25 Q 0 0 25 25" fill="none" stroke="${COLORS.black}" stroke-width="2"/>
  </g>
  
  <!-- GBB text -->
  <text x="200" y="195" font-family="Arial Black, sans-serif" font-size="16" font-weight="800" fill="${COLORS.primary}" text-anchor="middle">GBB</text>
  
  <!-- Player name -->
  <text x="200" y="235" font-family="Arial, sans-serif" font-size="${Math.max(12, 18 - playerName.length / 3)}" font-weight="700" fill="${COLORS.black}" text-anchor="middle" letter-spacing="1">
    ${playerName}
  </text>
  
  <!-- Divider line -->
  <line x1="100" y1="255" x2="300" y2="255" stroke="${COLORS.primary}" stroke-width="2"/>
  
  <!-- Position and Year -->
  <text x="200" y="280" font-family="Arial, sans-serif" font-size="12" font-weight="600" fill="${COLORS.gray}" text-anchor="middle" text-transform="uppercase">
    ${position} • CLASS OF ${year}
  </text>
  
  ${verified ? `
  <!-- Verified badge checkmark -->
  <g transform="translate(320, 60)">
    <circle cx="0" cy="0" r="25" fill="${COLORS.gold}" filter="url(#shadow)"/>
    <path d="M -8 2 L -3 7 L 8 -8" fill="none" stroke="${COLORS.primary}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  ` : ''}
  
  <!-- Bottom verification text -->
  <text x="200" y="340" font-family="Arial, sans-serif" font-size="10" font-weight="600" fill="${COLORS.white}" text-anchor="middle" opacity="0.9">
    ${verified ? '✓ VERIFIED PROSPECT' : 'PENDING VERIFICATION'}
  </text>
  
  <!-- Serial number -->
  <text x="200" y="375" font-family="monospace" font-size="9" fill="${COLORS.white}" text-anchor="middle" opacity="0.7">
    ID: ${player.player_key || player.id || 'ELITE-000'}
  </text>
  
  <!-- Decorative corner elements -->
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
  
  const format = url.searchParams.get('format') || 'svg'; // svg, html

  try {
    // Verify player authentication
    const auth = await verifyPlayerToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch player data using their authenticated ID
    const playerId = auth.user.player_id || auth.user.sub;
    const player = await fetchPlayerData(env, playerId);
    if (!player) {
      return new Response(
        JSON.stringify({ detail: 'Player not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
    }

    // Generate badge
    const svg = generateBadgeSVG(player);

    // Return based on requested format
    if (format === 'html') {
      const html = `<!DOCTYPE html>
<html>
<head>
  <title>Your Verified Prospect Badge - ${player.player_name}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #0134bd 0%, #fb6c1d 100%);
    }
    .container {
      text-align: center;
      background: white;
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
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
    .share-section {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    .share-title {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 10px;
    }
    .share-text {
      font-size: 12px;
      color: #6b7280;
      max-width: 300px;
      margin: 0 auto;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Your Verified Prospect Badge</h1>
    <p>${player.player_name} • Class of ${player.grad_class || 'N/A'}</p>
    <div class="badge-container">
      ${svg}
    </div>
    <a href="data:image/svg+xml;base64,${btoa(svg)}" download="${player.player_name?.replace(/\s+/g, '_') || 'Player'}_Badge.svg" class="download-btn">
      Download SVG Badge
    </a>
    <div class="share-section">
      <div class="share-title">Share Your Badge</div>
      <p class="share-text">
        Download this badge and add it to your social media profiles, email signature, 
        or recruiting materials to showcase your verified prospect status!
      </p>
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
