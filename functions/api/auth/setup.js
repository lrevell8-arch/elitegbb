// Initial Admin Setup Endpoint - Native Fetch Version (No Dependencies)
// POST /api/auth/setup - Creates first admin if no users exist

// Supabase REST API helper
async function supabaseQuery(env, table, method, params = {}) {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}`;
  const headers = {
    'apikey': env.SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': method === 'POST' ? 'return=representation' : 'count=exact'
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
    return { data: null, error: { message: error, status: response.status }, count: 0 };
  }

  // Get count from Content-Range header for HEAD requests
  const contentRange = response.headers.get('Content-Range');
  const count = contentRange ? parseInt(contentRange.split('/')[1]) : 0;

  const data = method === 'HEAD' || params.head ? null : await response.json();
  return { data: Array.isArray(data) && data.length === 1 ? data[0] : data, error: null, count };
}

// Simple password hash using Web Crypto
async function hashPassword(password) {
  const salt = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashB64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
  return salt + hashB64;
}

export async function onRequestPost(context) {
  const { env } = context;

  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      return new Response(
        JSON.stringify({ detail: 'Server configuration error - missing Supabase credentials' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if any users exist using count header
    const url = `${env.SUPABASE_URL}/rest/v1/staff_users?select=id&limit=1`;
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'apikey': env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
        'Prefer': 'count=exact'
      }
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ detail: 'Database error: ' + response.statusText }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const contentRange = response.headers.get('Content-Range');
    const count = contentRange ? parseInt(contentRange.split('/')[1]) : 0;

    if (count > 0) {
      return new Response(
        JSON.stringify({
          message: 'Setup already complete',
          existing_users: count,
          note: 'Admin user already exists. Use /api/auth/login to authenticate.'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create default admin user
    const passwordHash = await hashPassword('AdminPass123!');

    const adminUser = {
      id: crypto.randomUUID(),
      email: 'admin@hoopwithher.com',
      password_hash: passwordHash,
      name: 'System Administrator',
      role: 'admin',
      is_active: true,
      is_verified: true,
      created_at: new Date().toISOString()
    };

    // Insert user
    const insertUrl = `${env.SUPABASE_URL}/rest/v1/staff_users`;
    const insertResponse = await fetch(insertUrl, {
      method: 'POST',
      headers: {
        'apikey': env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(adminUser)
    });

    if (!insertResponse.ok) {
      const error = await insertResponse.text();
      return new Response(
        JSON.stringify({ detail: 'Failed to create admin: ' + error }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        message: 'Initial admin user created successfully',
        admin_email: 'admin@hoopwithher.com',
        admin_password: 'AdminPass123!',
        warning: 'Change this password immediately after first login!'
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ detail: 'Setup failed: ' + err.message }),
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
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
