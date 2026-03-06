// Admin Impersonate Player API Endpoint
// POST /api/admin/players/:id/impersonate
// Allows admin to generate a temporary token to login as a player

import { verifyJWT, generateJWT } from '../../../../utils/jwt.js';

// Supabase REST API helper
async function supabaseQuery(env, table, method, params = {}) {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}`;
  const headers = {
    'apikey': env.SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': method === 'POST' ? 'return=representation' : method === 'PATCH' ? 'return=representation' : ''
  };

  const queryParams = new URLSearchParams();
  if (params.select) queryParams.append('select', params.select);
  if (params.eq) {
    Object.entries(params.eq).forEach(([key, value]) => {
      queryParams.append(key, `eq.${value}`);
    });
  }

  const fullUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url;

  const response = await fetch(fullUrl, {
    method,
    headers,
    body: params.body ? JSON.stringify(params.body) : undefined
  });

  if (!response.ok) {
    const error = await response.text();
    return { data: null, error: { message: error, status: response.status } };
  }

  const data = await response.json();
  return { data: Array.isArray(data) ? data : [data], error: null };
}

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

// POST - Generate impersonation token for a player
export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const playerId = pathParts[pathParts.length - 2]; // Get ID from /api/admin/players/:id/impersonate

  try {
    // Verify admin token
    const auth = await verifyAdminToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!playerId) {
      return new Response(
        JSON.stringify({ detail: 'Player ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch player data
    const { data: players, error } = await supabaseQuery(env, 'players', 'GET', {
      select: '*',
      eq: { id: playerId }
    });

    if (error || !players || players.length === 0) {
      return new Response(
        JSON.stringify({ detail: 'Player not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const player = players[0];

    // Generate impersonation token
    // This token will have the player's identity but marked as an impersonation session
    // IMPORTANT: Must use 'user_id' to match regular player login token structure
    const impersonationPayload = {
      user_id: player.id,
      id: player.id,
      email: player.email || player.player_key,
      player_key: player.player_key,
      player_name: player.player_name,
      role: 'player',
      impersonated_by: auth.user.id,
      impersonated_by_email: auth.user.email,
      is_impersonation: true,
      exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60) // 8 hour expiry for impersonation sessions
    };

    const impersonationToken = await generateJWT(impersonationPayload, env.JWT_SECRET || 'fallback-secret-key-change-in-production');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Impersonation token generated successfully',
        token: impersonationToken,
        player: {
          id: player.id,
          player_name: player.player_name,
          email: player.email,
          player_key: player.player_key
        },
        redirect_url: '/portal'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ detail: 'Error: ' + err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// OPTIONS - CORS
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
