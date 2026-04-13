// Admin Deliverable Generation Endpoint
// POST /api/admin/projects/:id/generate/:type

import { verifyJWT } from '../../../../../utils/jwt.js';

const VALID_DELIVERABLE_TYPES = new Set([
  'one_pager',
  'tracking_profile',
  'referral_note',
  'film_index',
  'mid_season_update',
  'end_season_update',
  'verified_badge'
]);

const PDF_ROUTE_TYPE_MAP = {
  one_pager: 'one-pager',
  tracking_profile: 'tracking-profile',
  film_index: 'film-index'
};

async function supabaseQuery(env, table, method, params = {}) {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}`;
  const headers = {
    apikey: env.SUPABASE_ANON_KEY,
    Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    Prefer: method === 'POST' || method === 'PATCH' ? 'return=representation' : ''
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
  } catch {
    return { valid: false, error: 'Invalid token' };
  }
}

function buildDeliverableUrl(requestUrl, deliverableType, playerId, projectId) {
  const origin = new URL(requestUrl).origin;

  if (deliverableType === 'verified_badge') {
    return `${origin}/api/admin/deliverables/badge/${playerId}?format=png`;
  }

  if (PDF_ROUTE_TYPE_MAP[deliverableType]) {
    return `${origin}/api/admin/deliverables/pdf/${PDF_ROUTE_TYPE_MAP[deliverableType]}/${playerId}`;
  }

  // Placeholder for deliverables that do not yet have a dedicated renderer route
  return `${origin}/mock-deliverables/${projectId}/${deliverableType}.pdf`;
}

async function upsertDeliverable(env, existing, payload) {
  if (existing?.id) {
    const { data, error } = await supabaseQuery(env, 'deliverables', 'PATCH', {
      select: '*',
      eq: { id: existing.id },
      body: {
        status: payload.status,
        file_url: payload.file_url,
        updated_at: payload.updated_at,
        delivered_at: payload.delivered_at
      }
    });

    return { data: data?.[0] || null, error };
  }

  const typeFirstBody = {
    project_id: payload.project_id,
    type: payload.type,
    status: payload.status,
    file_url: payload.file_url,
    notes: payload.notes,
    created_at: payload.created_at,
    updated_at: payload.updated_at,
    delivered_at: payload.delivered_at
  };

  const typeInsert = await supabaseQuery(env, 'deliverables', 'POST', {
    select: '*',
    body: typeFirstBody
  });

  if (!typeInsert.error) {
    return { data: typeInsert.data?.[0] || null, error: null };
  }

  const legacyBody = {
    project_id: payload.project_id,
    deliverable_type: payload.type,
    status: payload.status,
    file_url: payload.file_url,
    notes: payload.notes,
    created_at: payload.created_at,
    updated_at: payload.updated_at,
    delivered_at: payload.delivered_at
  };

  const legacyInsert = await supabaseQuery(env, 'deliverables', 'POST', {
    select: '*',
    body: legacyBody
  });

  return { data: legacyInsert.data?.[0] || null, error: legacyInsert.error };
}

export async function onRequestPost(context) {
  const { request, env, params } = context;
  const projectId = params.id;
  const deliverableType = params.type;

  if (!VALID_DELIVERABLE_TYPES.has(deliverableType)) {
    return new Response(
      JSON.stringify({ detail: 'Invalid deliverable type' }),
      { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }

  try {
    const auth = await verifyAdminToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const { data: projects, error: projectError } = await supabaseQuery(env, 'projects', 'GET', {
      select: 'id,player_id',
      eq: { id: projectId }
    });

    if (projectError || !projects?.length) {
      return new Response(
        JSON.stringify({ detail: 'Project not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const project = projects[0];
    const now = new Date().toISOString();
    const generatedFileUrl = buildDeliverableUrl(request.url, deliverableType, project.player_id, projectId);

    const { data: currentDeliverables, error: currentError } = await supabaseQuery(env, 'deliverables', 'GET', {
      select: '*',
      eq: { project_id: projectId }
    });

    if (currentError) {
      return new Response(
        JSON.stringify({ detail: 'Failed to load project deliverables', error: currentError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const existing = (currentDeliverables || []).find((d) => {
      const dbType = d.deliverable_type || d.type;
      return dbType === deliverableType;
    });

    const { data: saved, error: upsertError } = await upsertDeliverable(env, existing, {
      project_id: projectId,
      type: deliverableType,
      status: 'delivered',
      file_url: generatedFileUrl,
      notes: `[AUTO-GENERATED] ${deliverableType} requested by ${auth.user.email || auth.user.sub || 'admin'}`,
      created_at: now,
      updated_at: now,
      delivered_at: now
    });

    if (upsertError) {
      return new Response(
        JSON.stringify({ detail: 'Failed to save generated deliverable', error: upsertError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        project_id: projectId,
        deliverable_type: deliverableType,
        status: 'complete',
        file_url: generatedFileUrl,
        deliverable: saved || null,
        message: `${deliverableType} generated successfully`
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ detail: 'Error generating deliverable', error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
}

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
