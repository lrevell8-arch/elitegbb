// Admin Coaches Management API Endpoint
// GET /api/admin/coaches - List all coaches
// POST /api/admin/coaches - Create new coach
// PATCH /api/admin/coaches - Update coach
// DELETE /api/admin/coaches - Delete coach

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
  if (params.order) queryParams.append('order', params.order);
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

// Hash password using Web Crypto
async function hashPassword(password) {
  const salt = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(12))));
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hash = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
  return salt + hash;
}

// GET - List all coaches
export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const auth = await verifyAdminToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data: coaches, error } = await supabaseQuery(env, 'coaches', 'GET', {
      select: 'id,email,name,school,title,state,is_active,is_verified,saved_players,created_at,updated_at',
      order: 'created_at.desc'
    });

    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Failed to fetch coaches', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ coaches: coaches || [], total: coaches?.length || 0 }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ detail: 'Error: ' + err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST - Create new coach
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const auth = await verifyAdminToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { email, password, name, school, title, state } = body;

    if (!email || !password || !name || !school) {
      return new Response(
        JSON.stringify({ detail: 'Email, password, name, and school are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const passwordHash = await hashPassword(password);

    const { data, error } = await supabaseQuery(env, 'coaches', 'POST', {
      body: {
        email: email.toLowerCase(),
        password_hash: passwordHash,
        name,
        school,
        title: title || 'Coach',
        state: state || null,
        is_active: true,
        is_verified: true,
        saved_players: []
      }
    });

    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Failed to create coach', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, coach: data[0] }),
      { status: 201, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ detail: 'Error: ' + err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// PATCH - Update coach
export async function onRequestPatch(context) {
  const { request, env } = context;

  try {
    const auth = await verifyAdminToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ detail: 'Coach ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabaseQuery(env, 'coaches', 'PATCH', {
      select: '*',
      eq: { id },
      body: updateData
    });

    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Failed to update coach', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, coach: data?.[0] }),
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
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
