// Tracking Profile Deliverable Endpoint
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
          <div class="timeline-item">
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
