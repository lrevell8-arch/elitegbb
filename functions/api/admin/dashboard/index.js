// Admin Dashboard API Endpoint
// GET /api/admin/dashboard - Get dashboard statistics

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
  return { data, error: null };
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

// GET - Dashboard statistics
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

    // Fetch all stats in parallel
    const [
      playersResult,
      coachesResult,
      projectsResult,
      messagesResult
    ] = await Promise.all([
      supabaseQuery(env, 'players', 'GET', { select: 'id,payment_status,verified', limit: 1000 }),
      supabaseQuery(env, 'coaches', 'GET', { select: 'id,is_active', limit: 1000 }),
      supabaseQuery(env, 'projects', 'GET', { select: 'id,status', limit: 1000 }),
      supabaseQuery(env, 'coach_messages', 'GET', { select: 'id,read', limit: 1000 })
    ]);

    const players = playersResult.data || [];
    const coaches = coachesResult.data || [];
    const projects = projectsResult.data || [];
    const messages = messagesResult.data || [];

    // Calculate stats
    const stats = {
      overview: {
        total_players: players.length,
        total_coaches: coaches.length,
        active_projects: projects.filter(p => p.status === 'in_progress').length,
        pending_projects: projects.filter(p => p.status === 'pending').length,
        completed_projects: projects.filter(p => p.status === 'completed').length,
        unread_messages: messages.filter(m => !m.read).length
      },
      players: {
        total: players.length,
        pending_payment: players.filter(p => p.payment_status === 'pending').length,
        paid: players.filter(p => p.payment_status === 'paid').length,
        verified: players.filter(p => p.verified).length,
        unverified: players.filter(p => !p.verified).length
      },
      coaches: {
        total: coaches.length,
        active: coaches.filter(c => c.is_active).length,
        inactive: coaches.filter(c => !c.is_active).length
      },
      projects: {
        total: projects.length,
        pending: projects.filter(p => p.status === 'pending').length,
        in_progress: projects.filter(p => p.status === 'in_progress').length,
        completed: projects.filter(p => p.status === 'completed').length,
        cancelled: projects.filter(p => p.status === 'cancelled').length
      }
    };

    return new Response(
      JSON.stringify(stats),
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
