// PDF Deliverables Generation Endpoint
// GET /api/admin/deliverables/pdf/{type}/{playerId}
// Types: one-pager, tracking-profile, film-index
// HWH Branding: #0134bd (blue), #fb6c1d (orange)

import { verifyJWT } from '../../../../../utils/jwt.js';

// HWH Brand Colors
const COLORS = {
  primary: '#0134bd',    // HWH Blue
  secondary: '#fb6c1d',  // HWH Orange
  white: '#ffffff',
  black: '#1a1a1a',
  gray: '#6b7280',
  lightGray: '#f3f4f6'
};

const LEVEL_COLORS = {
  gold: '#d4af37',
  silver: '#c0c0c0',
  bronze: '#cd7f32',
  platinum: '#e5e4e2',
  burntOrange: '#c65d2a'
};

const BADGE_LEVELS = {
  prospect: { label: 'Prospect', color: LEVEL_COLORS.bronze },
  rising_star: { label: 'Rising Star', color: LEVEL_COLORS.silver },
  elite: { label: 'Elite', color: LEVEL_COLORS.gold },
  '5ball_recruit': { label: '5Ball Recruit', color: LEVEL_COLORS.platinum }
};

// Verify admin token
async function verifyAdminToken(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing token' };
  }

  const token = authHeader.substring(7);
  try {
    const payload = await verifyJWT(token, env.JWT_SECRET || 'fallback-secret-key-change-in-production');
    if (payload.role !== 'admin' && payload.role !== 'editor') {
      return { valid: false, error: 'Insufficient permissions' };
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

function getBadgeMeta(player) {
  const badgeLevel = normalizeBadgeLevel(player.badge_level || 'prospect');
  const badge = BADGE_LEVELS[badgeLevel] || BADGE_LEVELS.prospect;
  return {
    ...badge,
    textColor: getTextColor(badge.color)
  };
}

// Generate Player One-Pager HTML (for PDF conversion)
function generateOnePagerHTML(player) {
  const stats = {
    ppg: player.ppg || 0,
    rpg: player.rpg || 0,
    apg: player.apg || 0,
    spg: player.spg || 0,
    bpg: player.bpg || 0,
    fg: player.fg_percent || 0,
    three: player.three_p_percent || 0,
    ft: player.ft_percent || 0
  };
  const badgeMeta = getBadgeMeta(player);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: ${COLORS.white};
      color: ${COLORS.black};
      width: 612pt;
      height: 792pt;
      padding: 36pt;
    }
    .header {
      background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primary}dd 100%);
      color: ${COLORS.white};
      padding: 24pt;
      border-radius: 12pt;
      margin-bottom: 20pt;
    }
    .header h1 {
      font-size: 28pt;
      font-weight: 800;
      margin-bottom: 4pt;
    }
    .header .subtitle {
      font-size: 12pt;
      opacity: 0.9;
    }
    .badge {
      display: inline-block;
      background: ${'${badgeMeta.color}'};
      color: ${'${badgeMeta.textColor}'};
      padding: 6pt 14pt;
      border-radius: 20pt;
      font-size: 10pt;
      font-weight: 700;
      margin-top: 8pt;
      letter-spacing: 0.5pt;
      text-transform: uppercase;
    }
    .section {
      margin-bottom: 16pt;
    }
    .section-title {
      font-size: 14pt;
      font-weight: 700;
      color: ${COLORS.primary};
      text-transform: uppercase;
      letter-spacing: 0.5pt;
      margin-bottom: 10pt;
      padding-bottom: 6pt;
      border-bottom: 2pt solid ${COLORS.secondary};
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12pt;
    }
    .info-item {
      background: ${COLORS.lightGray};
      padding: 12pt;
      border-radius: 8pt;
      border-left: 3pt solid ${COLORS.primary};
    }
    .info-label {
      font-size: 9pt;
      color: ${COLORS.gray};
      text-transform: uppercase;
      letter-spacing: 0.5pt;
      margin-bottom: 4pt;
    }
    .info-value {
      font-size: 14pt;
      font-weight: 700;
      color: ${COLORS.black};
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10pt;
    }
    .stat-box {
      background: linear-gradient(145deg, ${COLORS.primary} 0%, ${COLORS.primary}ee 100%);
      color: ${COLORS.white};
      padding: 16pt 10pt;
      border-radius: 10pt;
      text-align: center;
    }
    .stat-value {
      font-size: 24pt;
      font-weight: 800;
      margin-bottom: 4pt;
    }
    .stat-label {
      font-size: 9pt;
      opacity: 0.9;
      text-transform: uppercase;
    }
    .contact-section {
      background: ${COLORS.lightGray};
      padding: 14pt;
      border-radius: 8pt;
      margin-top: 16pt;
    }
    .contact-title {
      font-size: 11pt;
      font-weight: 700;
      color: ${COLORS.primary};
      margin-bottom: 8pt;
    }
    .contact-info {
      font-size: 10pt;
      line-height: 1.6;
    }
    .footer {
      position: absolute;
      bottom: 36pt;
      left: 36pt;
      right: 36pt;
      text-align: center;
      font-size: 9pt;
      color: ${COLORS.gray};
      padding-top: 12pt;
      border-top: 1pt solid ${COLORS.lightGray};
    }
    .hwh-logo {
      font-weight: 800;
      font-size: 16pt;
      color: ${COLORS.primary};
    }
    .verified-stamp {
      position: absolute;
      top: 100pt;
      right: 36pt;
      background: ${'${badgeMeta.color}'};
      color: ${'${badgeMeta.textColor}'};
      padding: 8pt 16pt;
      border-radius: 6pt;
      font-size: 10pt;
      font-weight: 800;
      transform: rotate(-5deg);
      text-transform: uppercase;
      letter-spacing: 0.5pt;
    }
  </style>
</head>
<body>
  ${player.verified ? `<div class="verified-stamp">✓ ${badgeMeta.label.toUpperCase()} VERIFIED</div>` : ''}
  
  <div class="header">
    <h1>${player.player_name || 'Unknown Player'}</h1>
    <div class="subtitle">${player.primary_position || 'N/A'} | Class of ${player.grad_class || 'N/A'} | ${player.school || 'N/A'}</div>
    <div class="badge">${badgeMeta.label}</div>
  </div>

  <div class="section">
    <div class="section-title">Player Information</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Height</div>
        <div class="info-value">${player.height || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Weight</div>
        <div class="info-value">${player.weight ? player.weight + ' lbs' : 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Gender</div>
        <div class="info-value">${player.gender || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Location</div>
        <div class="info-value">${player.city || ''}, ${player.state || ''}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Season Statistics</div>
    <div class="stats-grid">
      <div class="stat-box">
        <div class="stat-value">${stats.ppg}</div>
        <div class="stat-label">PPG</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${stats.rpg}</div>
        <div class="stat-label">RPG</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${stats.apg}</div>
        <div class="stat-label">APG</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${stats.spg}</div>
        <div class="stat-label">SPG</div>
      </div>
    </div>
    <div style="margin-top: 10pt; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10pt;">
      <div class="stat-box" style="background: ${COLORS.secondary};">
        <div class="stat-value">${stats.fg}%</div>
        <div class="stat-label">FG%</div>
      </div>
      <div class="stat-box" style="background: ${COLORS.secondary};">
        <div class="stat-value">${stats.three}%</div>
        <div class="stat-label">3PT%</div>
      </div>
      <div class="stat-box" style="background: ${COLORS.secondary};">
        <div class="stat-value">${stats.ft}%</div>
        <div class="stat-label">FT%</div>
      </div>
    </div>
  </div>

  <div class="contact-section">
    <div class="contact-title">Contact Information</div>
    <div class="contact-info">
      <strong>Parent/Guardian:</strong> ${player.parent_name || 'N/A'}<br>
      <strong>Email:</strong> ${player.parent_email || player.player_email || 'N/A'}<br>
      <strong>Phone:</strong> ${player.parent_phone || 'N/A'}<br>
      ${player.instagram_handle ? `<strong>Instagram:</strong> @${player.instagram_handle}<br>` : ''}
    </div>
  </div>

  <div class="footer">
    <div class="hwh-logo">ELITE GBB</div>
    <div>Generated ${new Date().toLocaleDateString()} | Player ID: ${player.player_key || player.id}</div>
  </div>
</body>
</html>`;
}

// Generate Tracking Profile HTML
function generateTrackingProfileHTML(player) {
  const createdDate = new Date(player.created_at).toLocaleDateString();
  const updatedDate = player.updated_at ? new Date(player.updated_at).toLocaleDateString() : createdDate;
  const badgeMeta = getBadgeMeta(player);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: ${COLORS.white};
      color: ${COLORS.black};
      width: 612pt;
      min-height: 792pt;
      padding: 36pt;
    }
    .header {
      background: ${COLORS.primary};
      color: ${COLORS.white};
      padding: 20pt;
      border-radius: 10pt;
      margin-bottom: 16pt;
    }
    .header h1 {
      font-size: 22pt;
      font-weight: 800;
    }
    .tracking-badge {
      background: ${'${badgeMeta.color}'};
      color: ${'${badgeMeta.textColor}'};
      padding: 4pt 10pt;
      border-radius: 4pt;
      font-size: 9pt;
      font-weight: 700;
      display: inline-block;
      margin-top: 6pt;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
    }
    .timeline {
      border-left: 3pt solid ${COLORS.primary};
      padding-left: 16pt;
      margin: 16pt 0;
    }
    .timeline-item {
      position: relative;
      margin-bottom: 16pt;
      padding: 12pt;
      background: ${COLORS.lightGray};
      border-radius: 8pt;
    }
    .timeline-item::before {
      content: '';
      position: absolute;
      left: -22pt;
      top: 14pt;
      width: 10pt;
      height: 10pt;
      background: ${COLORS.secondary};
      border-radius: 50%;
    }
    .timeline-date {
      font-size: 9pt;
      color: ${COLORS.gray};
      font-weight: 600;
    }
    .timeline-title {
      font-size: 12pt;
      font-weight: 700;
      color: ${COLORS.primary};
      margin: 4pt 0;
    }
    .stats-table {
      width: 100%;
      border-collapse: collapse;
      margin: 12pt 0;
    }
    .stats-table th {
      background: ${COLORS.primary};
      color: ${COLORS.white};
      padding: 10pt;
      text-align: left;
      font-size: 10pt;
      text-transform: uppercase;
    }
    .stats-table td {
      padding: 10pt;
      border-bottom: 1pt solid ${COLORS.lightGray};
      font-size: 11pt;
    }
    .stats-table tr:nth-child(even) {
      background: ${COLORS.lightGray};
    }
    .progress-section {
      margin: 16pt 0;
    }
    .progress-bar {
      background: ${COLORS.lightGray};
      height: 20pt;
      border-radius: 10pt;
      overflow: hidden;
      margin: 6pt 0;
    }
    .progress-fill {
      background: linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary});
      height: 100%;
      border-radius: 10pt;
    }
    .progress-label {
      display: flex;
      justify-content: space-between;
      font-size: 10pt;
      font-weight: 600;
    }
    .notes-section {
      background: ${COLORS.lightGray};
      padding: 14pt;
      border-radius: 8pt;
      margin-top: 16pt;
    }
    .notes-title {
      font-size: 12pt;
      font-weight: 700;
      color: ${COLORS.primary};
      margin-bottom: 8pt;
    }
    .footer {
      margin-top: 24pt;
      padding-top: 12pt;
      border-top: 2pt solid ${COLORS.lightGray};
      text-align: center;
      font-size: 9pt;
      color: ${COLORS.gray};
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Tracking Profile: ${player.player_name}</h1>
    <div class="tracking-badge">${badgeMeta.label} • ID: ${player.player_key || player.id}</div>
  </div>

  <div class="timeline">
    <div class="timeline-item">
      <div class="timeline-date">${createdDate}</div>
      <div class="timeline-title">Profile Created</div>
      <div style="font-size: 10pt;">Initial intake form submitted and profile established.</div>
    </div>
    <div class="timeline-item">
      <div class="timeline-date">${updatedDate}</div>
      <div class="timeline-title">Last Updated</div>
      <div style="font-size: 10pt;">Profile information last modified.</div>
    </div>
    ${player.verified ? `
    <div class="timeline-item">
      <div class="timeline-date">${new Date().toLocaleDateString()}</div>
      <div class="timeline-title">${badgeMeta.label} Status</div>
      <div style="font-size: 10pt;">Player has been verified at the ${badgeMeta.label.toLowerCase()} level.</div>
    </div>
    ` : ''}
  </div>

  <h3 style="font-size: 14pt; color: ${COLORS.primary}; margin: 16pt 0 10pt;">Performance Metrics</h3>
  <table class="stats-table">
    <tr>
      <th>Category</th>
      <th>Current</th>
      <th>Target</th>
      <th>Status</th>
    </tr>
    <tr>
      <td>Points Per Game</td>
      <td>${player.ppg || 0}</td>
      <td>20+</td>
      <td style="color: ${(player.ppg || 0) >= 20 ? '#22c55e' : COLORS.secondary};">${(player.ppg || 0) >= 20 ? '✓ Exceeding' : 'Developing'}</td>
    </tr>
    <tr>
      <td>Rebounds Per Game</td>
      <td>${player.rpg || 0}</td>
      <td>8+</td>
      <td style="color: ${(player.rpg || 0) >= 8 ? '#22c55e' : COLORS.secondary};">${(player.rpg || 0) >= 8 ? '✓ Exceeding' : 'Developing'}</td>
    </tr>
    <tr>
      <td>Assists Per Game</td>
      <td>${player.apg || 0}</td>
      <td>5+</td>
      <td style="color: ${(player.apg || 0) >= 5 ? '#22c55e' : COLORS.secondary};">${(player.apg || 0) >= 5 ? '✓ Exceeding' : 'Developing'}</td>
    </tr>
    <tr>
      <td>Field Goal %</td>
      <td>${player.fg_percent || 0}%</td>
      <td>50%+</td>
      <td style="color: ${(player.fg_percent || 0) >= 50 ? '#22c55e' : COLORS.secondary};">${(player.fg_percent || 0) >= 50 ? '✓ Exceeding' : 'Developing'}</td>
    </tr>
  </table>

  <div class="progress-section">
    <h3 style="font-size: 14pt; color: ${COLORS.primary}; margin-bottom: 10pt;">Recruitment Progress</h3>
    
    <div class="progress-label">
      <span>Profile Completion</span>
      <span>85%</span>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" style="width: 85%;"></div>
    </div>
    
    <div class="progress-label">
      <span>Verification Status</span>
      <span>${player.verified ? '100%' : '50%'}</span>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${player.verified ? '100%' : '50%'};"></div>
    </div>
    
    <div class="progress-label">
      <span>Stats Entry</span>
      <span>${player.ppg ? '100%' : '30%'}</span>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${player.ppg ? '100%' : '30%'};"></div>
    </div>
  </div>

  <div class="notes-section">
    <div class="notes-title">Scouting Notes</div>
    <div style="font-size: 10pt; line-height: 1.6;">
      ${player.primary_position || 'Multi-position'} player with ${player.ppg || 'developing'} scoring ability.
      Strong presence from ${player.city || 'local'} area. ${player.verified ? 'Verified prospect with high recruitment potential.' : 'Under evaluation for prospect status.'}
    </div>
  </div>

  <div class="footer">
    Elite GBB Tracking Profile • Generated ${new Date().toLocaleDateString()}<br>
    For internal use only • Confidential
  </div>
</body>
</html>`;
}

// Generate Film Index HTML
function generateFilmIndexHTML(player) {
  const films = player.films || [
    { title: 'Highlight Reel 2024', url: player.highlight_url || 'https://hudl.com/not-set', type: 'Highlights', duration: '3:45' },
    { title: 'Full Game vs. Regional', url: 'https://hudl.com/not-set', type: 'Game Film', duration: '32:00' },
    { title: 'Training Session', url: 'https://hudl.com/not-set', type: 'Training', duration: '8:20' }
  ];
  const badgeMeta = getBadgeMeta(player);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: ${COLORS.white};
      color: ${COLORS.black};
      width: 612pt;
      min-height: 792pt;
      padding: 36pt;
    }
    .header {
      background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%);
      color: ${COLORS.white};
      padding: 24pt;
      border-radius: 12pt;
      margin-bottom: 20pt;
      text-align: center;
    }
    .header h1 {
      font-size: 26pt;
      font-weight: 800;
      margin-bottom: 6pt;
    }
    .header .player-info {
      font-size: 12pt;
      opacity: 0.95;
    }
    .film-grid {
      display: grid;
      gap: 14pt;
    }
    .film-card {
      background: ${COLORS.lightGray};
      border-radius: 10pt;
      padding: 16pt;
      border-left: 4pt solid ${COLORS.primary};
      transition: transform 0.2s;
    }
    .film-card:hover {
      transform: translateX(4pt);
    }
    .film-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10pt;
    }
    .film-title {
      font-size: 14pt;
      font-weight: 700;
      color: ${COLORS.primary};
    }
    .film-type {
      background: ${COLORS.secondary};
      color: ${COLORS.white};
      padding: 4pt 10pt;
      border-radius: 4pt;
      font-size: 9pt;
      font-weight: 600;
    }
    .film-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10pt;
      margin-bottom: 10pt;
    }
    .film-detail {
      font-size: 10pt;
      color: ${COLORS.gray};
    }
    .film-detail strong {
      color: ${COLORS.black};
    }
    .film-url {
      background: ${COLORS.white};
      padding: 10pt;
      border-radius: 6pt;
      font-size: 9pt;
      color: ${COLORS.primary};
      word-break: break-all;
      border: 1pt solid ${COLORS.lightGray};
    }
    .notes-section {
      margin-top: 20pt;
      background: ${COLORS.lightGray};
      padding: 16pt;
      border-radius: 10pt;
    }
    .notes-title {
      font-size: 13pt;
      font-weight: 700;
      color: ${COLORS.primary};
      margin-bottom: 10pt;
    }
    .notes-content {
      font-size: 10pt;
      line-height: 1.6;
      color: ${COLORS.black};
    }
    .stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12pt;
      margin: 20pt 0;
    }
    .stat-pill {
      background: ${COLORS.primary};
      color: ${COLORS.white};
      padding: 12pt;
      border-radius: 8pt;
      text-align: center;
    }
    .stat-pill-value {
      font-size: 20pt;
      font-weight: 800;
    }
    .stat-pill-label {
      font-size: 9pt;
      opacity: 0.9;
      margin-top: 2pt;
    }
    .footer {
      margin-top: 24pt;
      padding-top: 14pt;
      border-top: 2pt solid ${COLORS.lightGray};
      text-align: center;
    }
    .footer-logo {
      font-size: 14pt;
      font-weight: 800;
      color: ${COLORS.primary};
    }
    .footer-text {
      font-size: 9pt;
      color: ${COLORS.gray};
      margin-top: 6pt;
    }
    .qr-placeholder {
      width: 60pt;
      height: 60pt;
      background: ${COLORS.white};
      border: 2pt solid ${COLORS.primary};
      border-radius: 8pt;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8pt;
      color: ${COLORS.gray};
      margin-left: auto;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎬 Film Index</h1>
    <div class="player-info">${player.player_name} • ${player.primary_position || 'N/A'} • Class of ${player.grad_class || 'N/A'} • ${badgeMeta.label}</div>
  </div>

  <div class="stats-row">
    <div class="stat-pill">
      <div class="stat-pill-value">${films.length}</div>
      <div class="stat-pill-label">Total Films</div>
    </div>
    <div class="stat-pill">
      <div class="stat-pill-value">${player.verified ? '✓' : '○'}</div>
      <div class="stat-pill-label">Verified</div>
    </div>
    <div class="stat-pill">
      <div class="stat-pill-value">${player.highlight_url ? '✓' : '○'}</div>
      <div class="stat-pill-label">Has URL</div>
    </div>
  </div>

  <div class="film-grid">
    ${films.map(film => `
    <div class="film-card">
      <div class="film-header">
        <div class="film-title">${film.title}</div>
        <div class="film-type">${film.type}</div>
      </div>
      <div class="film-details">
        <div class="film-detail"><strong>Duration:</strong> ${film.duration}</div>
        <div class="film-detail"><strong>Date Added:</strong> ${new Date().toLocaleDateString()}</div>
      </div>
      <div class="film-url">${film.url}</div>
    </div>
    `).join('')}
  </div>

  <div class="notes-section">
    <div class="notes-title">📋 Film Notes & Coach Feedback</div>
    <div class="notes-content">
      <strong>Strengths to Highlight:</strong><br>
      • ${player.primary_position || 'Position'} skills and court awareness<br>
      • ${player.ppg || 'Scoring'} points per game average<br>
      • Athletic ability and movement<br><br>
      
      <strong>Areas for Improvement:</strong><br>
      • Defensive positioning<br>
      • Off-ball movement<br>
      • Shot selection efficiency<br><br>
      
      <strong>Recruiting Notes:</strong><br>
      ${player.verified ? 'Verified prospect with strong film presence. Multiple college coaches have requested additional footage.' : 'Under evaluation. Recommend additional game film from varsity level competition.'}
    </div>
  </div>

  <div class="footer">
    <div class="footer-logo">ELITE GBB</div>
    <div class="footer-text">
      Complete film library for ${player.player_name}<br>
      Generated ${new Date().toLocaleDateString()} • Player ID: ${player.player_key || player.id}
    </div>
  </div>
</body>
</html>`;
}

// Convert HTML to simple PDF-like structure (using text/html response with print-friendly CSS)
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // Parse path parameters from URL
  const pathMatch = url.pathname.match(/\/pdf\/([^/]+)\/([^/]+)/);
  if (!pathMatch) {
    return new Response(
      JSON.stringify({ detail: 'Invalid URL format. Use: /api/admin/deliverables/pdf/{type}/{playerId}' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const [, type, playerId] = pathMatch;

  // Validate deliverable type
  const validTypes = ['one-pager', 'tracking-profile', 'film-index'];
  if (!validTypes.includes(type)) {
    return new Response(
      JSON.stringify({ detail: `Invalid type. Must be one of: ${validTypes.join(', ')}` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Verify admin authentication
    const auth = await verifyAdminToken(request, env);
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

    // Generate appropriate HTML based on type
    let html;
    let filename;
    switch (type) {
      case 'one-pager':
        html = generateOnePagerHTML(player);
        filename = `${player.player_name?.replace(/\s+/g, '_') || 'Player'}_OnePager.pdf`;
        break;
      case 'tracking-profile':
        html = generateTrackingProfileHTML(player);
        filename = `${player.player_name?.replace(/\s+/g, '_') || 'Player'}_TrackingProfile.pdf`;
        break;
      case 'film-index':
        html = generateFilmIndexHTML(player);
        filename = `${player.player_name?.replace(/\s+/g, '_') || 'Player'}_FilmIndex.pdf`;
        break;
    }

    // Return HTML with PDF print headers
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': `inline; filename="${filename.replace('.pdf', '.html')}"`,
        'X-Filename': filename
      }
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ detail: 'Error generating deliverable', error: err.message }),
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
