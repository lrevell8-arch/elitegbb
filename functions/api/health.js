// Health Check Endpoint
// GET /api/health

import { createClient } from '@supabase/supabase-js';

export async function onRequestGet(context) {
  const { env } = context;
  
  try {
    // Initialize Supabase client
    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_ANON_KEY
    );
    
    // Test database connection by counting users
    const { count: staffCount, error: staffError } = await supabase
      .from('staff_users')
      .select('*', { count: 'exact', head: true });
    
    const { count: coachCount, error: coachError } = await supabase
      .from('coaches')
      .select('*', { count: 'exact', head: true });
    
    const dbStatus = (staffError || coachError) ? 'error' : 'connected';
    const dbError = staffError?.message || coachError?.message;
    
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
