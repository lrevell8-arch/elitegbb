// Verified Prospect Badge Endpoint
// GET /api/admin/deliverables/badge/{playerId}
// Generates a branded SVG badge for a verified prospect.

import { verifyJWT } from '../utils/jwt.js';

function verifyAdmin(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401 });
  }
  const token = authHeader.slice(7);
  try {
    const payload = verifyJWT(token, env.JWT_SECRET || 'fallback-secret');
    if (payload.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403 });
    }
    return payload;
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
  }
}

function buildBadgeSvg(player) {
  const name = String(player.player_name || 'PLAYER NAME').toUpperCase();
  const level = String(player.badge_level || 'ELITE').toUpperCase();
  const verified = player.verified ? 'VERIFIED' : 'PENDING';
  const badgeText = `${name}`;
  const playerKey = String(player.player_key || player.id || 'ELITE-000');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0134bd"/>
      <stop offset="100%" stop-color="#0254ff"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fb6c1d"/>
      <stop offset="100%" stop-color="#ff8a4c"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" rx="32" ry="32" fill="url(#bg)" />
  <circle cx="200" cy="200" r="160" fill="#ffffff" opacity="0.12" />
  <rect x="40" y="40" width="320" height="320" rx="28" ry="28" fill="#ffffff" opacity="0.08" />

  <text x="200" y="120" fill="#ffffff" font-family="Arial Black, sans-serif" font-size="24" font-weight="800" text-anchor="middle">ELITE GBB</text>
  <text x="200" y="162" fill="#ffffff" font-family="Arial, sans-serif" font-size="16" font-weight="700" text-anchor="middle">Verified Prospect Badge</text>

  <circle cx="200" cy="230" r="96" fill="#ffffff" />
  <circle cx="200" cy="230" r="88" fill="url(#accent)" opacity="0.16" />

  <text x="200" y="210" fill="#0f172a" font-family="Arial Black, sans-serif" font-size="22" font-weight="800" text-anchor="middle">${level}</text>
  <text x="200" y="240" fill="#0f172a" font-family="Arial, sans-serif" font-size="14" font-weight="700" text-anchor="middle">${verified}</text>

  <text x="200" y="290" fill="#0f172a" font-family="Arial Black, sans-serif" font-size="18" font-weight="800" text-anchor="middle">${badgeText}</text>
  <text x="200" y="320" fill="#475569" font-family="Arial, sans-serif" font-size="12" font-weight="600" text-anchor="middle">ID: ${playerKey}</text>

  <path d="M 120 360 C 160 340 240 340 280 360" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.7" />
  <circle cx="320" cy="80" r="28" fill="#ffd700" />
  <path d="M 315 82 L 320 92 L 333 78" fill="none" stroke="#0134bd" stroke-width="4" stroke-linecap="round" />
</svg>`;
}

export async function onRequestGet(context) {
  const { request, env, params } = context;
  const authResponse = verifyAdmin(request, env);
  if (authResponse instanceof Response) return authResponse;

  const playerId = params.playerId || 'demo-player';
  const player = {
    player_name: 'Emma Johnson',
    badge_level: 'Elite',
    verified: true,
    player_key: playerId
  };

  const svg = buildBadgeSvg(player);
  return new Response(svg, { status: 200, headers: { 'Content-Type': 'image/svg+xml' } });
}
