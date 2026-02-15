// Get Current User Endpoint - Native Fetch Version (No Dependencies)
// GET /api/auth/me

// Supabase REST API helper
async function supabaseQuery(env, table, method, params = {}) {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}`;
  const headers = {
    'apikey': env.SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json'
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
  return { data: Array.isArray(data) && data.length === 1 ? data[0] : data, error: null };
}

// Verify JWT token using Web Crypto
async function verifyJWT(token, secret) {
  try {
    const [headerB64, claimsB64, signatureB64] = token.split('.');

    if (!headerB64 || !claimsB64 || !signatureB64) {
      return null;
    }

    // Decode claims
    const claims = JSON.parse(atob(claimsB64));

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (claims.exp && claims.exp < now) {
      return null;
    }

    // Verify signature
    const encoder = new TextEncoder();
    const data = `${headerB64}.${claimsB64}`;

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const expectedSignature = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      encoder.encode(data)
    );

    const expectedSigB64 = btoa(String.fromCharCode(...new Uint8Array(expectedSignature))).replace(/=/g, '');

    if (signatureB64 !== expectedSigB64) {
      return null;
    }

    return claims;
  } catch {
    return null;
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      return new Response(
        JSON.stringify({ detail: 'Server configuration error - missing Supabase credentials' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ detail: 'Missing or invalid authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.substring(7);

    // Verify JWT
    const payload = await verifyJWT(token, env.JWT_SECRET || 'fallback-secret-key-change-in-production');
    if (!payload) {
      return new Response(
        JSON.stringify({ detail: 'Invalid or expired token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get user from database
    const { data: user, error } = await supabaseQuery(env, 'staff_users', 'GET', {
      select: 'id, email, name, role, is_active, is_verified, created_at',
      eq: { id: payload.sub }
    });

    if (error || !user) {
      return new Response(
        JSON.stringify({ detail: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(user),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ detail: 'Authentication failed: ' + err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Handle CORS preflight
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
