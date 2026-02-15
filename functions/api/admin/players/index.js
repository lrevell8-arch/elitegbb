// Admin Players API Endpoint
// GET /api/admin/players - List all players with full details
// PATCH /api/admin/players/:id - Update player

import { verifyJWT } from '../../../utils/jwt.js';

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
  if (params.neq) {
    Object.entries(params.neq).forEach(([key, value]) => {
      queryParams.append(key, `neq.${value}`);
    });
  }
  if (params.order) queryParams.append('order', params.order);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.offset) queryParams.append('offset', params.offset);

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

// GET - List all players
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  try {
    const auth = await verifyAdminToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse query parameters
    const status = url.searchParams.get('status');
    const verified = url.searchParams.get('verified');
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit')) || 100;
    const offset = parseInt(url.searchParams.get('offset')) || 0;

    let params = {
      select: '*',
      order: 'created_at.desc',
      limit,
      offset
    };

    // Apply filters
    if (status) {
      params.eq = { ...params.eq, payment_status: status };
    }
    if (verified !== null) {
      params.eq = { ...params.eq, verified: verified === 'true' };
    }

    const { data: players, error } = await supabaseQuery(env, 'players', 'GET', params);

    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Failed to fetch players', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Simple search filter (client-side for now)
    let filteredPlayers = players || [];
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPlayers = filteredPlayers.filter(p => 
        (p.player_name || '').toLowerCase().includes(searchLower) ||
        (p.player_key || '').toLowerCase().includes(searchLower) ||
        (p.school || '').toLowerCase().includes(searchLower)
      );
    }

    return new Response(
      JSON.stringify({
        players: filteredPlayers,
        total: filteredPlayers.length,
        limit,
        offset
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

// PATCH - Update player
export async function onRequestPatch(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const playerId = url.searchParams.get('id');

  try {
    const auth = await verifyAdminToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();

    if (!playerId) {
      return new Response(
        JSON.stringify({ detail: 'Player ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabaseQuery(env, 'players', 'PATCH', {
      select: '*',
      eq: { id: playerId },
      body
    });

    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Failed to update player', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, player: data?.[0] }),
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
      'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
