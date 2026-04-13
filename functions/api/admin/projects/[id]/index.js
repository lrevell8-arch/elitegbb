// Admin Project Detail API Endpoint
// GET /api/admin/projects/:id - Get detailed project info
// PATCH /api/admin/projects/:id - Update project

import { verifyJWT } from '../../../../utils/jwt.js';

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

// GET - Get detailed project info
export async function onRequestGet(context) {
  const { request, env, params } = context;
  const projectId = params.id;

  try {
    const auth = await verifyAdminToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get project with player info
    const { data: projects, error: projectError } = await supabaseQuery(env, 'projects', 'GET', {
      select: '*,players(*)',
      eq: { id: projectId }
    });

    if (projectError) {
      return new Response(
        JSON.stringify({ detail: 'Failed to fetch project', error: projectError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!projects || projects.length === 0) {
      return new Response(
        JSON.stringify({ detail: 'Project not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const project = projects[0];
    const playerId = project.player_id;

    // Get intake submission for this player
    const { data: intakeSubmissions, error: intakeError } = await supabaseQuery(env, 'intake_submissions', 'GET', {
      select: '*',
      eq: { player_id: playerId },
      order: 'created_at.desc'
    });

    // Get deliverables for this project
    const { data: deliverables, error: deliverablesError } = await supabaseQuery(env, 'deliverables', 'GET', {
      select: '*',
      eq: { project_id: projectId },
      order: 'created_at.desc'
    });

    // Get reminders for this project
    const { data: reminders, error: remindersError } = await supabaseQuery(env, 'reminders', 'GET', {
      select: '*',
      eq: { project_id: projectId },
      order: 'scheduled_date.asc'
    });

    const normalizedDeliverables = (deliverables || []).map((d) => {
      const normalizedType = d.deliverable_type || d.type || null;
      const rawStatus = d.status || 'pending';
      const normalizedStatus = rawStatus === 'delivered' ? 'complete' : rawStatus;

      return {
        ...d,
        deliverable_type: normalizedType,
        type: d.type || normalizedType,
        status: normalizedStatus
      };
    });

    // Build the complete response
    const response = {
      id: project.id,
      player_id: project.player_id,
      package_type: project.package_type,
      status: project.status,
      payment_status: project.payment_status,
      amount_paid: project.amount_paid,
      notes: project.notes,
      created_at: project.created_at,
      updated_at: project.updated_at,
      completed_at: project.completed_at,
      player: project.players || null,
      intake_submission: intakeSubmissions && intakeSubmissions.length > 0 ? intakeSubmissions[0] : null,
      deliverables: normalizedDeliverables,
      reminders: reminders || []
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ detail: 'Error: ' + err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// PATCH - Update project
export async function onRequestPatch(context) {
  const { request, env, params } = context;
  const projectId = params.id;

  try {
    const auth = await verifyAdminToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const updateData = {};

    // Only allow updating certain fields
    if (body.status !== undefined) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.payment_status !== undefined) updateData.payment_status = body.payment_status;

    if (Object.keys(updateData).length === 0) {
      return new Response(
        JSON.stringify({ detail: 'No valid fields to update' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    updateData.updated_at = new Date().toISOString();
    if (body.status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabaseQuery(env, 'projects', 'PATCH', {
      select: '*',
      eq: { id: projectId },
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
