// Admin Deliverables Update Endpoint
// PATCH /api/admin/deliverables/:id
// Update deliverable status and metadata

import { verifyJWT } from '../../../../utils/jwt.js';

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

export async function onRequestPatch(context) {
  const { request, env, params } = context;
  const deliverableId = params.id;

  try {
    // Verify admin authentication
    const auth = await verifyAdminToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await request.json();
    const { status, file_url, notes } = body;

    // Validate required fields
    if (!status && !file_url && notes === undefined) {
      return new Response(
        JSON.stringify({ detail: 'At least one field (status, file_url, or notes) must be provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate status if provided
    if (status && !['pending', 'processing', 'complete', 'failed'].includes(status)) {
      return new Response(
        JSON.stringify({ detail: 'Invalid status. Must be one of: pending, processing, complete, failed' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build update object
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (status) updateData.status = status;
    if (file_url) updateData.file_url = file_url;
    if (notes !== undefined) updateData.notes = notes;

    // Update deliverable in Supabase
    const { data: updated, error: updateError } = await supabaseQuery(env, 'deliverables', 'PATCH', {
      select: '*',
      eq: { id: deliverableId },
      body: updateData
    });

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return new Response(
        JSON.stringify({
          detail: 'Failed to update deliverable',
          error: updateError.message || 'Database update failed'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!updated || updated.length === 0) {
      return new Response(
        JSON.stringify({ detail: 'Deliverable not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const deliverable = updated[0];

    return new Response(
      JSON.stringify({
        success: true,
        deliverable: {
          id: deliverable.id,
          project_id: deliverable.project_id,
          type: deliverable.type,
          status: deliverable.status,
          file_url: deliverable.file_url,
          notes: deliverable.notes,
          created_at: deliverable.created_at,
          updated_at: deliverable.updated_at
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Deliverable update error:', err);
    return new Response(
      JSON.stringify({
        detail: 'Failed to update deliverable',
        error: err.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

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