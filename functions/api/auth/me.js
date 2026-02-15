// Get Current User Endpoint
// GET /api/auth/me

import { createClient } from '@supabase/supabase-js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export async function onRequestGet(context) {
  const { request, env } = context;
  
  try {
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
    const payload = await verifyJWT(token, env.JWT_SECRET || JWT_SECRET);
    if (!payload) {
      return new Response(
        JSON.stringify({ detail: 'Invalid or expired token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Initialize Supabase client
    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_ANON_KEY
    );
    
    // Get user from database
    const { data: user, error } = await supabase
      .from('staff_users')
      .select('id, email, name, role, is_active, is_verified, created_at')
      .eq('id', payload.sub)
      .single();
    
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

// Verify JWT token
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
    
    // Verify signature (simplified - in production, properly verify)
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
