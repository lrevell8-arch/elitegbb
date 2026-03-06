// Admin Impersonate Coach API Endpoint
// POST /api/admin/coaches/:coachId/impersonate
// Allows admin to generate a temporary token to login as a coach

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

// POST - Generate impersonation token for a coach
export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const coachId = pathParts[pathParts.length - 2]; // Get ID from /api/admin/coaches/:coachId/impersonate

  try {
    // Verify admin token
    const auth = await verifyAdminToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!coachId) {
      return new Response(
        JSON.stringify({ detail: 'Coach ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch coach data
    const { data: coaches, error } = await supabaseQuery(env, 'coaches', 'GET', {
      select: '*',
      eq: { id: coachId }
    });

    if (error || !coaches || coaches.length === 0) {
      return new Response(
        JSON.stringify({ detail: 'Coach not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const coach = coaches[0];

    // Generate impersonation token
    // This token will have the coach's identity but marked as an impersonation session
    // IMPORTANT: Must use 'sub' to match regular coach login token structure
    const impersonationPayload = {
      sub: coach.id,
      id: coach.id,
      email: coach.email,
      name: coach.name,
      school: coach.school,
      title: coach.title,
      state: coach.state,
      role: 'coach',
      is_verified: coach.is_verified,
      is_active: coach.is_active,
      saved_players: coach.saved_players,
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
        coach: {
          id: coach.id,
          name: coach.name,
          email: coach.email,
          school: coach.school,
          title: coach.title
        },
        redirect_url: '/coach/dashboard'
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
