// Environment diagnostics endpoint (no secret values exposed)
// GET /api/debug/env

export async function onRequestGet(context) {
  const { env } = context;

  const payload = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      supabase_url_configured: !!env.SUPABASE_URL,
      supabase_anon_key_configured: !!env.SUPABASE_ANON_KEY,
      supabase_service_role_key_configured: !!env.SUPABASE_SERVICE_ROLE_KEY,
      jwt_secret_configured: !!env.JWT_SECRET,
      react_app_backend_url_configured: !!env.REACT_APP_BACKEND_URL
    },
    checks: {
      runtime_minimum_ready: !!(env.SUPABASE_URL && env.SUPABASE_ANON_KEY && env.JWT_SECRET)
    },
    required_for_runtime: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'JWT_SECRET']
  };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

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
