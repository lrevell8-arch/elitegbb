// Admin Pipeline API Endpoint
// GET /api/admin/pipeline - Get pipeline board data (projects with status)

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

// GET - Pipeline board data
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

    // Get all projects with player info
    const { data: projects, error } = await supabaseQuery(env, 'projects', 'GET', {
      select: '*,players(id,player_name,player_key,school,package_selected,payment_status,primary_position,grad_class)',
      order: 'created_at.desc'
    });

    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Failed to fetch pipeline', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Group by status for pipeline board
    const pipeline = {
      pending: [],
      in_progress: [],
      review: [],
      completed: [],
      cancelled: []
    };

    (projects || []).forEach(project => {
      const status = project.status || 'pending';
      const normalizedStatus = status.toLowerCase().replace(' ', '_');
      
      if (pipeline[normalizedStatus]) {
        pipeline[normalizedStatus].push(project);
      } else {
        // Default to pending if unknown status
        pipeline.pending.push(project);
      }
    });

    return new Response(
      JSON.stringify({
        pipeline,
        total: projects?.length || 0,
        columns: [
          { id: 'pending', name: 'Pending', color: '#f59e0b' },
          { id: 'in_progress', name: 'In Progress', color: '#3b82f6' },
          { id: 'review', name: 'Review', color: '#8b5cf6' },
          { id: 'completed', name: 'Completed', color: '#10b981' },
          { id: 'cancelled', name: 'Cancelled', color: '#ef4444' }
        ]
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

// PATCH - Update project status (for drag-and-drop)
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
    const { project_id, status } = body;

    if (!project_id || !status) {
      return new Response(
        JSON.stringify({ detail: 'project_id and status are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updateData = { status };
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabaseQuery(env, 'projects', 'PATCH', {
      select: '*',
      eq: { id: project_id },
      body: updateData
    });

    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Failed to update project', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, project: data?.[0] }),
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
      'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
