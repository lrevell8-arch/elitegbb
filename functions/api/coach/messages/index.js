// Coach Messages API Endpoint
// GET /api/coach/messages - Get messages for authenticated coach
// POST /api/coach/messages - Send new message

import { verifyJWT } from '../../../utils/jwt.js';

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
  return { data, error: null };
}

// Verify coach token
async function verifyCoachToken(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing token' };
  }

  const token = authHeader.substring(7);
  try {
    const payload = await verifyJWT(token, env.JWT_SECRET || 'fallback-secret-key-change-in-production');
    if (payload.role !== 'coach') {
      return { valid: false, error: 'Coach access required' };
    }
    return { valid: true, user: payload };
  } catch (err) {
    return { valid: false, error: 'Invalid token' };
  }
}

// GET - Get messages for coach
export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const auth = await verifyCoachToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const coachId = auth.user.sub;

    // Get messages for this coach
    const { data: messages, error } = await supabaseQuery(env, 'coach_messages', 'GET', {
      select: '*,players(player_name,player_key)',
      or: `(coach_id.eq.${coachId},recipient_id.eq.${coachId})`,
      order: 'created_at.desc'
    });

    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Failed to fetch messages', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Categorize messages
    const categorized = {
      inbox: messages?.filter(m => m.recipient_id === coachId) || [],
      sent: messages?.filter(m => m.coach_id === coachId) || [],
      unread: messages?.filter(m => m.recipient_id === coachId && !m.read) || []
    };

    return new Response(
      JSON.stringify({
        messages: messages || [],
        categorized,
        total: messages?.length || 0,
        unread_count: categorized.unread.length
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

// POST - Send new message
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const auth = await verifyCoachToken(request, env);
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

// PATCH - Mark message as read
export async function onRequestPatch(context) {
  const { request, env } = context;

  try {
    const auth = await verifyCoachToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { message_id, read } = body;

    if (!message_id) {
      return new Response(
        JSON.stringify({ detail: 'message_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabaseQuery(env, 'coach_messages', 'PATCH', {
      select: '*',
      eq: { id: message_id },
      body: { read: read !== false }
    });

    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Failed to update message', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: data?.[0] }),
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
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
