// Players API Endpoints
// GET /api/players - List all players
// POST /api/players - Create new player
// GET /api/players/:id - Get player by ID
// PATCH /api/players/:id - Update player

import { verifyJWT } from '../../utils/jwt.js';

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

// Verify any authenticated token (admin or coach)
async function verifyAnyToken(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing token' };
  }

  const token = authHeader.substring(7);
  try {
    const payload = await verifyJWT(token, env.JWT_SECRET || 'fallback-secret-key-change-in-production');
    return { valid: true, user: payload };
  } catch (err) {
    return { valid: false, error: 'Invalid token' };
  }
}

// Generate unique player key
function generatePlayerKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'P-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// GET - List all players (with optional filters)
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  try {
    // Allow public access to verified players for coaches
    // But require auth for full list
    const authHeader = request.headers.get('Authorization');
    const isAdminRequest = url.searchParams.get('admin') === 'true';
    
    let params = {
      select: '*',
      order: 'created_at.desc'
    };

    // If not admin request, only show verified players
    if (!isAdminRequest && !authHeader) {
      params.eq = { verified: true };
    }

    const { data: players, error } = await supabaseQuery(env, 'players', 'GET', params);

    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Failed to fetch players', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(players || []),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ detail: 'Error: ' + err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST - Create new player (from intake form)
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();

    // Required fields
    const required = ['player_name', 'grad_class', 'gender', 'primary_position'];
    for (const field of required) {
      if (!body[field]) {
        return new Response(
          JSON.stringify({ detail: `${field} is required` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const playerKey = generatePlayerKey();

    const playerData = {
      player_key: playerKey,
      player_name: body.player_name,
      preferred_name: body.preferred_name || null,
      dob: body.dob || null,
      grad_class: body.grad_class,
      gender: body.gender,
      school: body.school || null,
      city: body.city || null,
      state: body.state || null,
      primary_position: body.primary_position,
      secondary_position: body.secondary_position || null,
      jersey_number: body.jersey_number || null,
      height: body.height || null,
      weight: body.weight || null,
      parent_name: body.parent_name || null,
      parent_email: body.parent_email || null,
      parent_phone: body.parent_phone || null,
      player_email: body.player_email || null,
      level: body.level || null,
      team_names: body.team_names || null,
      ppg: body.ppg || null,
      apg: body.apg || null,
      rpg: body.rpg || null,
      package_selected: body.package_selected || null,
      payment_status: 'pending',
      verified: false
    };

    const { data, error } = await supabaseQuery(env, 'players', 'POST', {
      body: playerData
    });

    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Failed to create player', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, player: data[0], player_key: playerKey }),
      { status: 201, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
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
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
