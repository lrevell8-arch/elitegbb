// Admin/Staff Login Endpoint
// POST /api/auth/login

import { createClient } from '@supabase/supabase-js';

// Supabase configuration from environment
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// JWT Secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

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
    
    // Initialize Supabase client
    const supabase = createClient(
      env.SUPABASE_URL || SUPABASE_URL,
      env.SUPABASE_ANON_KEY || SUPABASE_ANON_KEY
    );
    
    // Look up user by email
    const { data: user, error } = await supabase
      .from('staff_users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !user) {
      return new Response(
        JSON.stringify({ detail: 'Invalid email or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if account is active
    if (!user.is_active) {
      return new Response(
        JSON.stringify({ detail: 'Account is disabled' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Verify password using bcrypt (we'll use a simple comparison here)
    // In production, use proper bcrypt verification
    const bcrypt = await import('bcryptjs');
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      return new Response(
        JSON.stringify({ detail: 'Invalid email or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Generate JWT token
    const token = await generateJWT({
      sub: user.id,
      email: user.email,
      role: user.role || 'viewer',
      name: user.name || ''
    }, env.JWT_SECRET || JWT_SECRET);
    
    return new Response(
      JSON.stringify({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role || 'viewer'
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

// Simple JWT generation
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
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(data)
  );
  
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '');
  
  return `${data}.${signatureB64}`;
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
