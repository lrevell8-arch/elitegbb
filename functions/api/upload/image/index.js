// Image Upload Endpoint for Profile Pictures
// POST /api/upload/image - Upload player or coach profile image
// Uses Base64 encoding for image storage in Supabase (R2 alternative for Cloudflare Functions)

import { verifyJWT } from '../../../utils/jwt.js';

// Supabase REST API helper
async function supabaseQuery(env, table, method, params = {}) {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}`;
  const headers = {
    'apikey': env.SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': method === 'POST' || method === 'PATCH' ? 'return=representation' : ''
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

// Validate and process image
function validateImage(base64String) {
  // Check if it's a valid base64 image
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const match = base64String.match(/^data:([a-zA-Z0-9\/]+);base64,(.+)$/);

  if (!match) {
    return { valid: false, error: 'Invalid image format. Expected base64 data URI.' };
  }

  const mimeType = match[1];
  const base64Data = match[2];

  if (!validTypes.includes(mimeType)) {
    return { valid: false, error: `Invalid image type. Allowed: ${validTypes.join(', ')}` };
  }

  // Check size (max 2MB = ~2.7M base64 chars)
  if (base64Data.length > 2700000) {
    return { valid: false, error: 'Image too large. Maximum size is 2MB.' };
  }

  return { valid: true, mimeType, base64Data };
}

// POST - Upload image
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
    const { image, type, entity_id } = body;

    if (!image || !type) {
      return new Response(
        JSON.stringify({ detail: 'Image and type are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate image
    const validation = validateImage(image);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ detail: validation.error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Determine entity type and update accordingly
    let table, idField, entityId;

    if (type === 'player') {
      table = 'players';
      idField = 'id';
      entityId = entity_id || auth.user.user_id;

      // Verify ownership
      if (auth.user.role !== 'player' && auth.user.role !== 'admin' && auth.user.role !== 'editor') {
        return new Response(
          JSON.stringify({ detail: 'Insufficient permissions' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // If player, verify they're updating their own profile
      if (auth.user.role === 'player' && entityId !== auth.user.user_id) {
        return new Response(
          JSON.stringify({ detail: 'Can only update own profile' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else if (type === 'coach') {
      table = 'coaches';
      idField = 'id';
      entityId = entity_id || auth.user.user_id;

      // Verify ownership
      if (auth.user.role !== 'coach' && auth.user.role !== 'admin' && auth.user.role !== 'editor') {
        return new Response(
          JSON.stringify({ detail: 'Insufficient permissions' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // If coach, verify they're updating their own profile
      if (auth.user.role === 'coach' && entityId !== auth.user.user_id) {
        return new Response(
          JSON.stringify({ detail: 'Can only update own profile' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ detail: 'Invalid type. Must be "player" or "coach"' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Store image as base64 in database (for Cloudflare Functions without R2)
    // In production with R2, you'd upload to R2 and store the URL
    const imageUrl = image; // Store the full base64 data URI

    // Update entity with new image URL
    const { data, error } = await supabaseQuery(env, table, 'PATCH', {
      eq: { [idField]: entityId },
      body: { profile_image_url: imageUrl, updated_at: new Date().toISOString() }
    });

    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Failed to update profile image', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Image uploaded successfully',
        image_url: imageUrl
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
