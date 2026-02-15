// Health Check Endpoint - Native Fetch Version (No Dependencies)
// GET /api/health

export async function onRequestGet(context) {
  const { env } = context;

  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      return new Response(
        JSON.stringify({
          status: 'error',
          timestamp: new Date().toISOString(),
          error: 'Missing Supabase configuration'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Test database connection by counting users
    const baseUrl = `${env.SUPABASE_URL}/rest/v1`;
    const headers = {
      'apikey': env.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
      'Prefer': 'count=exact'
    };

    // Check staff_users
    const staffResponse = await fetch(`${baseUrl}/staff_users?select=id&limit=1`, {
      method: 'HEAD',
      headers
    });

    const staffRange = staffResponse.headers.get('Content-Range');
    const staffCount = staffRange ? parseInt(staffRange.split('/')[1]) : 0;

    // Check coaches
    const coachResponse = await fetch(`${baseUrl}/coaches?select=id&limit=1`, {
      method: 'HEAD',
      headers
    });

    const coachRange = coachResponse.headers.get('Content-Range');
    const coachCount = coachRange ? parseInt(coachRange.split('/')[1]) : 0;

    const dbStatus = (!staffResponse.ok && !coachResponse.ok) ? 'error' : 'connected';
    const dbError = !staffResponse.ok ? staffResponse.statusText : (!coachResponse.ok ? coachResponse.statusText : null);

    return new Response(
      JSON.stringify({
        status: dbStatus === 'connected' ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        database: {
          type: 'supabase',
          status: dbStatus,
          error: dbError || null
        },
        users: {
          staff_users: staffCount || 0,
          coaches: coachCount || 0,
          total: (staffCount || 0) + (coachCount || 0)
        },
        environment: {
          supabase_url_configured: !!env.SUPABASE_URL,
          jwt_secret_configured: !!env.JWT_SECRET
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
      JSON.stringify({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: err.message
      }),
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
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
