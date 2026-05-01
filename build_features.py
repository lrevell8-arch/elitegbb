import os

base_dir = os.path.join(os.getcwd(), 'build_output')
os.makedirs(base_dir, exist_ok=True)

files = {
    'one_pager.js': """// Player One-Pager Deliverable Endpoint
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
""",
    'tracking_profile.js': """// Tracking Profile Deliverable Endpoint
// GET /api/admin/deliverables/pdf/tracking-profile/{playerId}
// Generates a progress tracking PDF-friendly HTML deliverable.

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

function buildTrackingProfileHtml(player) {
  const name = String(player.player_name || 'Player Name').trim();
  const timeline = player.timeline || [
    { date: '2025-08-14', note: 'Profile created' },
    { date: '2025-09-05', note: 'Verified prospect badge awarded' },
    { date: '2025-10-12', note: 'Film index added' }
  ];

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Inter, Arial, sans-serif; color: #0f172a; background: #ffffff; margin: 0; padding: 28px; }
    .page { width: 792px; min-height: 1122px; border: 1px solid #e2e8f0; border-radius: 18px; padding: 30px; }
    .header { margin-bottom: 28px; }
    .header h1 { margin: 0; font-size: 32px; color: #0134bd; }
    .header p { margin: 8px 0 0; color: #475569; }
    .section { margin-top: 24px; }
    .section-title { font-size: 14px; text-transform: uppercase; letter-spacing: 0.12em; color: #0134bd; font-weight: 800; margin-bottom: 16px; }
    .timeline { border-left: 4px solid #fb6c1d; padding-left: 18px; }
    .timeline-item { margin-bottom: 22px; }
    .timeline-item time { display: block; font-size: 11px; color: #475569; margin-bottom: 6px; }
    .timeline-item p { margin: 0; font-size: 14px; line-height: 1.6; }
    .stat-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-top: 20px; }
    .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; }
    .stat-card strong { display: block; font-size: 12px; color: #475569; margin-bottom: 8px; }
    .stat-card span { font-size: 22px; font-weight: 800; color: #0f172a; }
    .footer { margin-top: 34px; padding: 16px; background: #eff6ff; border-radius: 14px; font-size: 12px; color: #475569; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>Tracking Profile</h1>
      <p>Progress report for ${name} with timeline, completion metrics, and next steps.</p>
    </div>

    <div class="section">
      <div class="section-title">Timeline</div>
      <div class="timeline">
        ${timeline.map(item => `
          <div class=\"timeline-item\">
            <time>${item.date}</time>
            <p>${item.note}</p>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Completion Metrics</div>
      <div class="stat-row">
        <div class="stat-card"><strong>Profile Completion</strong><span>92%</span></div>
        <div class="stat-card"><strong>Verification</strong><span>Verified</span></div>
        <div class="stat-card"><strong>Film Assets</strong><span>4 Links</span></div>
        <div class="stat-card"><strong>Recruiting Score</strong><span>87</span></div>
      </div>
    </div>

    <div class="footer">
      <p>Elite GBB Tracking Profile provides coaches and families with a polished overview of profile updates and recruiting readiness.</p>
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
    player_key: playerId,
    timeline: [
      { date: '2025-08-14', note: 'Profile created and verified' },
      { date: '2025-09-15', note: 'Practice footage added' },
      { date: '2025-10-10', note: 'Recruiting one-pager reviewed' }
    ]
  };

  const html = buildTrackingProfileHtml(player);
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html' } });
}
""",
    'film_index.js': """// Film Index Deliverable Endpoint
// GET /api/admin/deliverables/pdf/film-index/{playerId}
// Generates a film index deliverable with highlight links and notes.

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

function buildFilmIndexHtml(player) {
  const name = String(player.player_name || 'Player Name').trim();
  const videos = player.videos || [
    { title: 'Summer Showcase', type: 'Full Game', duration: '12:34', url: 'https://example.com/video/1', notes: 'High basketball IQ and spacing.' },
    { title: 'Top Plays', type: 'Highlights', duration: '05:22', url: 'https://example.com/video/2', notes: 'Strong finish at the rim and catch-and-shoot looks.' }
  ];

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Inter, Arial, sans-serif; color: #111827; background: #ffffff; margin: 0; padding: 28px; }
    .page { width: 792px; min-height: 1122px; padding: 28px; border: 1px solid #e5e7eb; border-radius: 18px; }
    .header { margin-bottom: 26px; }
    .header h1 { margin: 0; font-size: 32px; color: #0134bd; }
    .header p { margin: 8px 0 0; color: #475569; }
    .section-title { font-size: 14px; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 800; color: #0134bd; margin-bottom: 14px; }
    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td { padding: 14px 12px; border: 1px solid #e2e8f0; }
    .table th { background: #f8fafc; color: #0f172a; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }
    .table td { font-size: 13px; color: #334155; }
    .notes { color: #475569; font-size: 12px; line-height: 1.6; }
    .footer { margin-top: 24px; padding: 16px; border-radius: 14px; background: #f1f5f9; color: #475569; font-size: 12px; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>Film Index</h1>
      <p>Overview of film links, durations, and scouting notes for ${name}.</p>
    </div>

    <div class="section">
      <div class="section-title">Film Library</div>
      <table class="table">
        <thead>
          <tr><th>Title</th><th>Type</th><th>Duration</th><th>Link</th><th>Notes</th></tr>
        </thead>
        <tbody>
          ${videos.map(video => `
            <tr>
              <td>${video.title}</td>
              <td>${video.type}</td>
              <td>${video.duration}</td>
              <td><a href="${video.url}">${video.url}</a></td>
              <td>${video.notes}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <p>Use the film index to share polished video packages with coaches and evaluators.</p>
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
    player_key: playerId,
    videos: [
      { title: 'Summer Showcase', type: 'Full Game', duration: '12:34', url: 'https://example.com/video/1', notes: 'High basketball IQ and spacing.' },
      { title: 'Top Plays', type: 'Highlights', duration: '05:22', url: 'https://example.com/video/2', notes: 'Strong finish at the rim and catch-and-shoot looks.' }
    ]
  };

  const html = buildFilmIndexHtml(player);
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html' } });
}
""",
    'verified_badge.js': """// Verified Prospect Badge Endpoint
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
"""
}

for filename, content in files.items():
    file_path = os.path.join(base_dir, filename)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Created {file_path}')

print('Build output written successfully.')
