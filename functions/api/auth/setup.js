// Initial Admin Setup Endpoint
// POST /api/auth/setup - Creates first admin if no users exist

import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
  const { env } = context;
  
  try {
    // Initialize Supabase client
    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_ANON_KEY
    );
    
    // Check if any users exist
    const { count, error: countError } = await supabase
      .from('staff_users')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      return new Response(
        JSON.stringify({ detail: 'Database error: ' + countError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
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
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash('AdminPass123!', 10);
    
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
    
    const { error } = await supabase
      .from('staff_users')
      .insert([adminUser]);
    
    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Failed to create admin: ' + error.message }),
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
