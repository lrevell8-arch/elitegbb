// Player/Parent Login Endpoint
// POST /api/player/login - Login with player_key and password

import { generateJWT } from '../../utils/jwt.js';

// Supabase REST API helper
async function supabaseQuery(env, table, method, params = {}) {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}`;
  const headers = {
    'apikey': env.SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': method === 'POST' ? 'return=representation' : ''
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

// Simple password hash verification using SHA-256
async function verifyPassword(password, hashedPassword) {
  // Check if it's a bcrypt hash (starts with $2)
  if (hashedPassword && hashedPassword.startsWith('$2')) {
    // For bcrypt, we'd need a bcrypt library - for now return false
    // In production, use a proper bcrypt implementation
    return false;
  }

  // Try SHA-256 with salt format (salt:hash)
  if (hashedPassword && hashedPassword.includes(':')) {
    const [salt, storedHash] = hashedPassword.split(':');
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const computedHash = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
    return computedHash === storedHash;
  }

  return false;
}

// POST - Player/Parent login
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { player_key, parent_email, password } = body;

    // Validate required fields
    if (!player_key || !password) {
      return new Response(
        JSON.stringify({ detail: 'Player key and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Look up player by player_key
    const { data: players, error } = await supabaseQuery(env, 'players', 'GET', {
      select: 'id,player_key,player_name,preferred_name,parent_email,parent_name,player_email,password_hash,profile_image_url,school,city,state,grad_class,gender,primary_position,secondary_position,height,weight,jersey_number,team_names,level,ppg,apg,rpg,verified,payment_status,created_at',
      eq: { player_key: player_key.toUpperCase() },
      limit: 1
    });

    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Database error', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!players || players.length === 0) {
      return new Response(
        JSON.stringify({ detail: 'Invalid player key or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const player = players[0];

    // Verify password
    const passwordValid = await verifyPassword(password, player.password_hash);
    if (!passwordValid) {
      return new Response(
        JSON.stringify({ detail: 'Invalid player key or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if player is verified
    if (!player.verified) {
      return new Response(
        JSON.stringify({ detail: 'Account pending verification. Please contact support.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate JWT
    const token = await generateJWT(
      {
        user_id: player.id,
        player_key: player.player_key,
        role: 'player',
        name: player.player_name,
        email: player.parent_email || player.player_email
      },
      env.JWT_SECRET || 'fallback-secret-key-change-in-production'
    );

    // Remove sensitive data before returning
    const { password_hash, ...playerData } = player;

    return new Response(
      JSON.stringify({
        success: true,
        token,
        player: playerData
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
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
