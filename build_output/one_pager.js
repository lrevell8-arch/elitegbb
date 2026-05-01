// Player One-Pager Deliverable Endpoint
// GET /api/admin/deliverables/pdf/one-pager/{playerId}
// Generates a print-friendly recruiting one-pager HTML document.

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

function normalizeText(value) {
  return String(value || '').trim();
}

function buildOnePagerHtml(player) {
  const name = normalizeText(player.player_name) || 'Player Name';
  const school = normalizeText(player.school) || 'School Name';
  const position = normalizeText(player.position) || normalizeText(player.primary_position) || 'Guard';
  const gradClass = normalizeText(player.grad_class) || '2026';
  const city = normalizeText(player.city) || 'City';
  const state = normalizeText(player.state) || 'ST';
  const ppg = Number(player.ppg || 0).toFixed(1);
  const rpg = Number(player.rpg || 0).toFixed(1);
  const apg = Number(player.apg || 0).toFixed(1);
  const fg = Number(player.fg_percent || 0).toFixed(1);
  const three = Number(player.three_p_percent || 0).toFixed(1);
  const ft = Number(player.ft_percent || 0).toFixed(1);
  const playerKey = normalizeText(player.player_key) || 'ELITE-000';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Inter, Arial, sans-serif; background: #ffffff; color: #1a1a1a; margin: 0; padding: 24px; }
    .page { width: 792px; min-height: 1122px; padding: 32px; border: 1px solid #e5e7eb; }
    .header { background: linear-gradient(135deg, #0134bd 0%, #0166ff 100%); color: white; padding: 24px; border-radius: 18px; }
    .header h1 { margin: 0; font-size: 32px; letter-spacing: -0.03em; }
    .header p { margin: 8px 0 0; opacity: 0.88; }
    .badge { display: inline-block; margin-top: 14px; padding: 8px 16px; background: #fb6c1d; color: white; border-radius: 999px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; font-size: 11px; }
    .section { margin-top: 24px; }
    .section-title { font-size: 14px; color: #0134bd; margin-bottom: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; }
    .info-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
    .info-card { background: #f8fafc; padding: 18px; border-radius: 14px; border: 1px solid #e2e8f0; }
    .info-card strong { display: block; font-size: 12px; color: #475569; margin-bottom: 6px; }
    .info-card span { font-size: 18px; font-weight: 700; color: #0f172a; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 14px; }
    .stat-block { background: #0134bd; color: white; padding: 16px; border-radius: 14px; text-align: center; }
    .stat-block .value { font-size: 26px; font-weight: 800; margin-bottom: 4px; }
    .stat-block .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.9; }
    .footer { margin-top: 32px; padding: 20px; background: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0; }
    .footer p { margin: 0; font-size: 12px; color: #475569; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="badge">ELITE GBB</div>
      <h1>${name}</h1>
      <p>${position} • Class of ${gradClass} • ${school}</p>
    </div>

    <div class="section">
      <div class="section-title">Player Profile</div>
      <div class="info-grid">
        <div class="info-card"><strong>School</strong><span>${school}</span></div>
        <div class="info-card"><strong>Location</strong><span>${city}, ${state}</span></div>
        <div class="info-card"><strong>Graduation</strong><span>${gradClass}</span></div>
        <div class="info-card"><strong>Player ID</strong><span>${playerKey}</span></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Key Stats</div>
      <div class="stats-grid">
        <div class="stat-block"><div class="value">${ppg}</div><div class="label">PPG</div></div>
        <div class="stat-block"><div class="value">${rpg}</div><div class="label">RPG</div></div>
        <div class="stat-block"><div class="value">${apg}</div><div class="label">APG</div></div>
        <div class="stat-block"><div class="value">${fg}%</div><div class="label">FG%</div></div>
      </div>
      <div class="stats-grid" style="margin-top: 10px;">
        <div class="stat-block"><div class="value">${three}%</div><div class="label">3PT%</div></div>
        <div class="stat-block"><div class="value">${ft}%</div><div class="label">FT%</div></div>
        <div class="stat-block"><div class="value">${position}</div><div class="label">Position</div></div>
        <div class="stat-block"><div class="value">${city}</div><div class="label">City</div></div>
      </div>
    </div>

    <div class="footer">
      <p>Created for Elite GBB deliverables. Use browser print to PDF or server-side conversion for production.</p>
    </div>
  </div>
</body>
</html>`;
}

export async function onRequestGet(context) {
  const { request, env, params } = context;
  const authResponse = verifyAdmin(request, env);
  if (authResponse instanceof Response) return authResponse;

  const playerId = params.playerId || 'demo-player';
  const player = {
    player_name: 'Emma Johnson',
    position: 'Guard',
    grad_class: '2026',
    school: 'Lincoln High School',
    city: 'Austin',
    state: 'TX',
    ppg: 18.4,
    rpg: 6.2,
    apg: 4.1,
    fg_percent: 48.2,
    three_p_percent: 37.5,
    ft_percent: 82.1,
    player_key: playerId
  };

  const html = buildOnePagerHtml(player);
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html' } });
}
