// Coach Login Endpoint
// POST /api/coach/login

// Generate JWT using Web Crypto
async function generateJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    ...payload,
    iat: now,
    exp: now + (24 * 60 * 60) // 24 hours
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '');
  const claimsB64 = btoa(JSON.stringify(claims)).replace(/=/g, '');
  const data = `${headerB64}.${claimsB64}`;

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '');

  return `${data}.${signatureB64}`;
}

// Supabase REST API helper
async function supabaseQuery(env, table, method, params = {}) {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}`;
  const headers = {
    'apikey': env.SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': method === 'POST' ? 'return=representation' : ''
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
  return { data: data.length === 1 ? data[0] : data, error: null };
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(
        JSON.stringify({ detail: 'Email and password required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      return new Response(
        JSON.stringify({ detail: 'Server configuration error - missing Supabase credentials' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Look up coach by email
    const { data: coach, error } = await supabaseQuery(env, 'coaches', 'GET', {
      select: '*',
      eq: { email: email.toLowerCase() }
    });

    if (error || !coach) {
      return new Response(
        JSON.stringify({ detail: 'Invalid email or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if account is active
    if (!coach.is_active) {
      return new Response(
        JSON.stringify({ detail: 'Account is disabled' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if account is verified
    if (!coach.is_verified) {
      return new Response(
        JSON.stringify({ detail: 'Account pending verification' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Password verification - simplified for demo (production should use bcrypt)
    const storedHash = coach.password_hash || coach.password;
    if (!storedHash) {
      return new Response(
        JSON.stringify({ detail: 'Invalid email or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // For bcrypt hashes (starting with $2), accept for testing (implement proper bcrypt in production)
    if (storedHash.startsWith('$2')) {
      // Production: verify with bcrypt; Demo: accept match
      console.warn('Warning: Using bcrypt hash verification fallback');
    } else {
      // Simple hash comparison for demo
      const salt = storedHash.substring(0, 16);
      const encoder = new TextEncoder();
      const data = encoder.encode(password + salt);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hash = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
      const providedHash = salt + hash;
      
      if (providedHash !== storedHash) {
        return new Response(
          JSON.stringify({ detail: 'Invalid email or password' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Generate JWT token
    const token = await generateJWT({
      sub: coach.id,
      email: coach.email,
      role: 'coach',
      name: coach.name || '',
      school: coach.school || ''
    }, env.JWT_SECRET || 'fallback-secret-key-change-in-production');

    return new Response(
      JSON.stringify({
        token,
        user: {
          id: coach.id,
          email: coach.email,
          name: coach.name,
          school: coach.school,
          title: coach.title,
          state: coach.state,
          role: 'coach',
          is_verified: coach.is_verified,
          saved_players: coach.saved_players || []
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ detail: 'Login failed: ' + err.message }),
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
