// Coach Verification Endpoint
// PATCH /api/admin/coaches/[coachId]/verify - Toggle coach verification status

import { verifyJWT } from '../../../../utils/jwt.js';

// Supabase REST API helper
async function supabaseQuery(env, table, method, params = {}) {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}`;
  const headers = {
    'apikey': env.SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': method === 'PATCH' ? 'return=representation' : ''
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
  return { data: Array.isArray(data) ? data[0] : data, error: null };
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

// PATCH - Toggle coach verification status
export async function onRequestPatch(context) {
  const { request, env, params } = context;
  const coachId = params.coachId;

  try {
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

    // First, get the current coach to check current verification status
    const { data: currentCoach, error: fetchError } = await supabaseQuery(env, 'coaches', 'GET', {
      select: 'id,is_verified',
      eq: { id: coachId }
    });

    if (fetchError || !currentCoach) {
      return new Response(
        JSON.stringify({ detail: 'Coach not found', error: fetchError?.message }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Toggle the verification status
    const newStatus = !currentCoach.is_verified;

    // Update the coach
    const { data: updatedCoach, error: updateError } = await supabaseQuery(env, 'coaches', 'PATCH', {
      select: 'id,email,name,school,title,state,is_active,is_verified,saved_players,created_at,updated_at',
      eq: { id: coachId },
      body: { is_verified: newStatus }
    });

    if (updateError) {
      return new Response(
        JSON.stringify({ detail: 'Failed to update verification status', error: updateError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Coach ${newStatus ? 'verified' : 'unverified'} successfully`,
        is_verified: newStatus,
        coach: updatedCoach
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
      'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
