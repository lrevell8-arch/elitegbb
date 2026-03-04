// Debug endpoint for authentication diagnostics
// GET /api/debug/auth?email=admin@hoopwithher.com

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

  try {
    const response = await fetch(fullUrl, { method, headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      return { 
        data: null, 
        error: { 
          message: errorText, 
          status: response.status, 
          statusText: response.statusText 
        },
        headers: Object.fromEntries(response.headers.entries())
      };
    }

    const data = await response.json();
    return { 
      data: data.length === 1 ? data[0] : data, 
      error: null,
      count: data.length,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (fetchError) {
    return { 
      data: null, 
      error: { 
        message: fetchError.message, 
        status: 0, 
        type: 'network_error' 
      } 
    };
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  
  const url = new URL(request.url);
  const email = url.searchParams.get('email') || 'admin@hoopwithher.com';
  
  try {
    // Check environment configuration
    const config = {
      supabase_url_configured: !!env.SUPABASE_URL,
      supabase_url_length: env.SUPABASE_URL ? env.SUPABASE_URL.length : 0,
      supabase_key_configured: !!env.SUPABASE_ANON_KEY,
      supabase_key_length: env.SUPABASE_ANON_KEY ? env.SUPABASE_ANON_KEY.length : 0,
      jwt_secret_configured: !!env.JWT_SECRET
    };
    
    // Test Supabase connection by listing all staff_users (with limit)
    const allUsersResult = await supabaseQuery(env, 'staff_users', 'GET', {
      select: 'id,email,name,role,is_active',
      limit: 5
    });
    
    // Try to find specific user
    const specificUserResult = await supabaseQuery(env, 'staff_users', 'GET', {
      select: '*',
      eq: { email: email.toLowerCase() }
    });
    
    // Safe version of user data (mask password)
    let safeUser = null;
    if (specificUserResult.data) {
      const u = specificUserResult.data;
      safeUser = {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        is_active: u.is_active,
        password_hash_present: !!u.password_hash,
        password_hash_type: u.password_hash ? 
          (u.password_hash.startsWith('PLAIN:') ? 'PLAIN' : 
           u.password_hash.startsWith('$2') ? 'BCRYPT' : 'OTHER') : 'NONE',
        password_hash_preview: u.password_hash ? 
          (u.password_hash.startsWith('PLAIN:') ? 
           `PLAIN:****${u.password_hash.slice(-4)}` : 
           `${u.password_hash.slice(0, 15)}...`) : null
      };
    }
    
    return new Response(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        requested_email: email,
        configuration: config,
        all_users_query: {
          success: !allUsersResult.error,
          error: allUsersResult.error,
          count: allUsersResult.count,
          sample_users: allUsersResult.data
        },
        specific_user_query: {
          success: !specificUserResult.error,
          error: specificUserResult.error,
          user_found: !!specificUserResult.data,
          user: safeUser,
          response_headers: specificUserResult.headers
        }
      }, null, 2),
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
      JSON.stringify({
        error: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      }, null, 2),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
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
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
