// Film Index Deliverable Endpoint
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
