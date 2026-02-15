// Player Connections Management Endpoint
// GET /api/player/connections - Get player connections with coaches
// POST /api/player/connections - Add a new connection (follow a coach)
// DELETE /api/player/connections - Remove a connection

import { verifyJWT } from '../../../utils/jwt.js';

// Supabase REST API helper
async function supabaseQuery(env, table, method, params = {}) {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}`;
  const headers = {
    'apikey': env.SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': method === 'POST' || method === 'PATCH' ? 'return=representation' : ''
  };

  const queryParams = new URLSearchParams();
  if (params.select) queryParams.append('select', params.select);
  if (params.eq) {
    Object.entries(params.eq).forEach(([key, value]) => {
      queryParams.append(key, `eq.${value}`);
    });
  }
  if (params.order) queryParams.append('order', params.order);

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
  return { data, error: null };
}

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
      return { valid: false, error: 'Insufficient permissions' };
    }
    return { valid: true, user: payload };
  } catch (err) {
    return { valid: false, error: 'Invalid token' };
  }
}

// GET - Get player connections
export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const auth = await verifyPlayerToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get connections with coach details
    const { data: connections, error } = await supabaseQuery(env, 'player_connections', 'GET', {
      select: '*,coach:coaches(id,name,school,title,state,profile_image_url)',
      eq: { player_id: auth.user.user_id },
      order: 'created_at.desc'
    });

    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Failed to fetch connections', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get saved_by_coaches (coaches who saved this player)
    const { data: savedByCoaches, error: savedError } = await supabaseQuery(env, 'coach_saved_players', 'GET', {
      select: '*,coach:coaches(id,name,school,title,state,profile_image_url)',
      eq: { player_id: auth.user.user_id },
      order: 'created_at.desc'
    });

    return new Response(
      JSON.stringify({
        connections: connections || [],
        saved_by_coaches: savedByCoaches || []
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

// POST - Create new connection (follow a coach)
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const auth = await verifyPlayerToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { coach_id, message } = body;

    if (!coach_id) {
      return new Response(
        JSON.stringify({ detail: 'Coach ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if connection already exists
    const { data: existing, error: checkError } = await supabaseQuery(env, 'player_connections', 'GET', {
      select: 'id',
      eq: { player_id: auth.user.user_id, coach_id: coach_id },
      limit: 1
    });

    if (checkError) {
      return new Response(
        JSON.stringify({ detail: 'Failed to check existing connection', error: checkError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (existing && existing.length > 0) {
      return new Response(
        JSON.stringify({ detail: 'Connection already exists' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create connection
    const connectionData = {
      player_id: auth.user.user_id,
      coach_id: coach_id,
      status: 'pending',
      message: message || null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabaseQuery(env, 'player_connections', 'POST', {
      body: connectionData
    });

    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Failed to create connection', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, connection: data[0] }),
      { status: 201, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ detail: 'Error: ' + err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// DELETE - Remove connection
export async function onRequestDelete(context) {
  const { request, env } = context;

  try {
    const auth = await verifyPlayerToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(request.url);
    const connectionId = url.searchParams.get('id');

    if (!connectionId) {
      return new Response(
        JSON.stringify({ detail: 'Connection ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify the connection belongs to this player
    const { data: connection, error: checkError } = await supabaseQuery(env, 'player_connections', 'GET', {
      select: 'id',
      eq: { id: connectionId, player_id: auth.user.user_id },
      limit: 1
    });

    if (checkError || !connection || connection.length === 0) {
      return new Response(
        JSON.stringify({ detail: 'Connection not found or access denied' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete connection
    const { error } = await supabaseQuery(env, 'player_connections', 'DELETE', {
      eq: { id: connectionId }
    });

    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Failed to remove connection', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Connection removed' }),
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
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
