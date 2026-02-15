// Player Profile Management Endpoint
// GET /api/player/profile - Get own profile
// PATCH /api/player/profile - Update own profile
// POST /api/player/profile/password - Change password

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
  if (params.limit) queryParams.append('limit', params.limit);

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

// Hash password with SHA-256 and salt
async function hashPassword(password) {
  const salt = Array.from(crypto.getRandomValues(new Uint8Array(12)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hash = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
  return `${salt}:${hash}`;
}

// Verify password
async function verifyPassword(password, hashedPassword) {
  if (!hashedPassword || !hashedPassword.includes(':')) {
    return false;
  }
  const [salt, storedHash] = hashedPassword.split(':');
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const computedHash = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
  return computedHash === storedHash;
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

// GET - Get player profile
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

    const { data: players, error } = await supabaseQuery(env, 'players', 'GET', {
      select: 'id,player_key,player_name,preferred_name,profile_image_url,dob,grad_class,gender,school,city,state,primary_position,secondary_position,jersey_number,height,weight,parent_name,parent_email,parent_phone,player_email,level,team_names,ppg,apg,rpg,package_selected,verified,payment_status,created_at,updated_at',
      eq: { id: auth.user.user_id },
      limit: 1
    });

    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Failed to fetch profile', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!players || players.length === 0) {
      return new Response(
        JSON.stringify({ detail: 'Player not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(players[0]),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ detail: 'Error: ' + err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// PATCH - Update player profile
export async function onRequestPatch(context) {
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

    // Fields that players can update
    const allowedFields = [
      'player_name', 'preferred_name', 'profile_image_url', 'dob',
      'school', 'city', 'state', 'primary_position', 'secondary_position',
      'jersey_number', 'height', 'weight', 'parent_name', 'parent_email',
      'parent_phone', 'player_email', 'level', 'team_names', 'ppg', 'apg', 'rpg'
    ];

    // Filter only allowed fields
    const updateData = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    if (Object.keys(updateData).length === 0) {
      return new Response(
        JSON.stringify({ detail: 'No valid fields to update' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabaseQuery(env, 'players', 'PATCH', {
      eq: { id: auth.user.user_id },
      body: updateData
    });

    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Failed to update profile', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, player: data[0] }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ detail: 'Error: ' + err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST - Change password
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
    const { current_password, new_password } = body;

    if (!current_password || !new_password) {
      return new Response(
        JSON.stringify({ detail: 'Current password and new password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (new_password.length < 6) {
      return new Response(
        JSON.stringify({ detail: 'New password must be at least 6 characters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get current password hash
    const { data: players, error: fetchError } = await supabaseQuery(env, 'players', 'GET', {
      select: 'password_hash',
      eq: { id: auth.user.user_id },
      limit: 1
    });

    if (fetchError || !players || players.length === 0) {
      return new Response(
        JSON.stringify({ detail: 'Failed to verify current password' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify current password
    const validCurrent = await verifyPassword(current_password, players[0].password_hash);
    if (!validCurrent) {
      return new Response(
        JSON.stringify({ detail: 'Current password is incorrect' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Hash new password
    const newPasswordHash = await hashPassword(new_password);

    // Update password
    const { error: updateError } = await supabaseQuery(env, 'players', 'PATCH', {
      eq: { id: auth.user.user_id },
      body: { password_hash: newPasswordHash }
    });

    if (updateError) {
      return new Response(
        JSON.stringify({ detail: 'Failed to update password', error: updateError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Password updated successfully' }),
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
      'Access-Control-Allow-Methods': 'GET, PATCH, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
