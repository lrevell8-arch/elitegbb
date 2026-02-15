// Coach Messages API Endpoints
// GET /api/messages - Get messages for authenticated coach
// POST /api/messages - Send new message

import { verifyJWT } from '../../utils/jwt.js';

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
  if (params.or) queryParams.append('or', params.or);
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
  return { data: Array.isArray(data) ? data : [data], error: null };
}

// Verify any authenticated token
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

// GET - Get messages for authenticated user
export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const auth = await verifyAnyToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = auth.user.sub;
    const userRole = auth.user.role;

    let params;
    if (userRole === 'coach') {
      // Coach sees messages they sent or received
      params = {
        select: '*,players(player_name)',
        or: `(coach_id.eq.${userId},recipient_id.eq.${userId})`,
        order: 'created_at.desc'
      };
    } else {
      // Admin/staff sees all messages
      params = {
        select: '*,players(player_name),coaches(name,school)',
        order: 'created_at.desc'
      };
    }

    const { data: messages, error } = await supabaseQuery(env, 'coach_messages', 'GET', params);

    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Failed to fetch messages', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(messages || []),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ detail: 'Error: ' + err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST - Send new message
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const auth = await verifyAnyToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { recipient_type, recipient_id, subject, message, player_id } = body;

    if (!recipient_type || !subject || !message) {
      return new Response(
        JSON.stringify({ detail: 'recipient_type, subject, and message are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const coachId = auth.user.sub;
    const userRole = auth.user.role;

    // Only coaches can send messages
    if (userRole !== 'coach') {
      return new Response(
        JSON.stringify({ detail: 'Only coaches can send messages' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabaseQuery(env, 'coach_messages', 'POST', {
      body: {
        coach_id: coachId,
        recipient_type,
        recipient_id: recipient_id || null,
        subject,
        message,
        player_id: player_id || null,
        read: false
      }
    });

    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Failed to send message', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: data[0] }),
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
