// Image Upload Endpoint
// POST /api/upload/image
// Uploads base64 images for players (profile pictures) and coaches (logos)

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

// Verify token and get user info
async function verifyToken(request, env) {
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

// Validate base64 image
function validateBase64Image(base64String) {
  // Check if it's a data URL
  if (base64String.startsWith('data:image/')) {
    const matches = base64String.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,(.+)$/);
    if (!matches) {
      return { valid: false, error: 'Invalid image format. Only PNG, JPEG, GIF, and WebP are allowed.' };
    }
    // Check size (base64 is roughly 4/3 of actual size, so 2MB = ~2.67MB base64)
    const base64Data = matches[2];
    const sizeInBytes = (base64Data.length * 3) / 4;
    if (sizeInBytes > 2 * 1024 * 1024) {
      return { valid: false, error: 'Image too large. Maximum size is 2MB.' };
    }
    return { valid: true, format: matches[1], data: base64Data };
  }
  
  // If it's just base64 without data URL prefix
  if (base64String.length > 100) {
    const sizeInBytes = (base64String.length * 3) / 4;
    if (sizeInBytes > 2 * 1024 * 1024) {
      return { valid: false, error: 'Image too large. Maximum size is 2MB.' };
    }
    return { valid: true, format: 'unknown', data: base64String };
  }
  
  return { valid: false, error: 'Invalid image data' };
}

// POST - Upload image
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const auth = await verifyToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { image, type } = body;

    if (!image) {
      return new Response(
        JSON.stringify({ detail: 'Image is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!type || !['player', 'coach'].includes(type)) {
      return new Response(
        JSON.stringify({ detail: 'Type must be "player" or "coach"' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate image
    const validation = validateBase64Image(image);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ detail: validation.error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Determine user ID and table based on type
    let userId, table, field, role;
    if (type === 'player') {
      userId = auth.user.user_id || auth.user.id;
      table = 'players';
      field = 'profile_image_url';
      role = 'player';
    } else if (type === 'coach') {
      userId = auth.user.id || auth.user.sub;
      table = 'coaches';
      field = 'logo_url';
      role = 'coach';
    }

    // Verify the user has permission (token role matches requested type)
    if (auth.user.role !== role) {
      return new Response(
        JSON.stringify({ detail: 'Token role does not match requested upload type' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update the database with the image URL (base64 data URL)
    const updateData = {
      [field]: image,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseQuery(env, table, 'PATCH', {
      eq: { id: userId },
      body: updateData
    });

    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Failed to save image', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        image_url: image,
        message: 'Image uploaded successfully'
      }),
      { status: 200, headers: { 
        'Content-Type': 'application/json', 
        'Access-Control-Allow-Origin': '*' 
      }}
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
