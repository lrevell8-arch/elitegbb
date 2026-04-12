// Admin Project Deliverable Generation Endpoint
// POST /api/admin/projects/:id/generate/:type

import { verifyJWT } from '../../../../../utils/jwt.js';

const DELIVERABLE_MAP = {
  one_pager: { kind: 'pdf', type: 'one-pager' },
  tracking_profile: { kind: 'pdf', type: 'tracking-profile' },
  film_index: { kind: 'pdf', type: 'film-index' },
  verified_badge: { kind: 'badge' }
};

// Supabase REST API helper
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

export async function onRequestPost(context) {
  const { request, env, params } = context;
  const projectId = params.id;
  const deliverableType = params.type;

  try {
    const auth = await verifyAdminToken(request, env);
    if (!auth.valid) {
      return new Response(JSON.stringify({ detail: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const config = DELIVERABLE_MAP[deliverableType];
    if (!config) {
      return new Response(
        JSON.stringify({ detail: 'Deliverable type not supported yet.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data: projects, error: projectError } = await supabaseQuery(env, 'projects', 'GET', {
      select: 'id,player_id',
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

    const playerId = projects[0].player_id;
    const origin = new URL(request.url).origin;

    let fileUrl = '';
    if (config.kind === 'pdf') {
      fileUrl = `${origin}/api/admin/deliverables/pdf/${config.type}/${playerId}`;
    } else if (config.kind === 'badge') {
      fileUrl = `${origin}/api/admin/deliverables/badge/${playerId}`;
    }

    const now = new Date().toISOString();
    const { data: updated, error: updateError } = await supabaseQuery(env, 'deliverables', 'PATCH', {
      select: '*',
      eq: { project_id: projectId, deliverable_type: deliverableType },
      body: {
        status: 'complete',
        file_url: fileUrl,
        updated_at: now
      }
    });

    if (updateError) {
      return new Response(
        JSON.stringify({ detail: 'Failed to update deliverable', error: updateError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let deliverable = updated?.[0] || null;

    if (!deliverable) {
      const { data: created, error: createError } = await supabaseQuery(env, 'deliverables', 'POST', {
        select: '*',
        body: {
          project_id: projectId,
          deliverable_type: deliverableType,
          status: 'complete',
          file_url: fileUrl,
          created_at: now,
          updated_at: now
        }
      });

      if (createError) {
        return new Response(
          JSON.stringify({ detail: 'Failed to create deliverable', error: createError.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      deliverable = created?.[0] || null;
    }

    return new Response(
      JSON.stringify({ success: true, file_url: fileUrl, deliverable }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ detail: 'Error: ' + err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
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
