// Catch-all API Handler for Cloudflare Pages Functions
// Routes requests to specific handlers based on path

// Import specific handlers
import * as loginHandler from './auth/login.js';
import * as setupHandler from './auth/setup.js';
import * as meHandler from './auth/me.js';
import * as healthHandler from './health.js';

export async function onRequest(context) {
  const { request, params } = context;
  const path = params.path || '';
  const method = request.method;
  
  // Build full path
  const fullPath = Array.isArray(path) ? path.join('/') : path;
  
  // Route to specific handlers
  if (fullPath === 'auth/login' && method === 'POST') {
    return loginHandler.onRequestPost(context);
  }
  
  if (fullPath === 'auth/login' && method === 'OPTIONS') {
    return loginHandler.onRequestOptions();
  }
  
  if (fullPath === 'auth/setup' && method === 'POST') {
    return setupHandler.onRequestPost(context);
  }
  
  if (fullPath === 'auth/setup' && method === 'OPTIONS') {
    return setupHandler.onRequestOptions();
  }
  
  if (fullPath === 'auth/me' && method === 'GET') {
    return meHandler.onRequestGet(context);
  }
  
  if (fullPath === 'auth/me' && method === 'OPTIONS') {
    return meHandler.onRequestOptions();
  }
  
  if (fullPath === 'health' && method === 'GET') {
    return healthHandler.onRequestGet(context);
  }
  
  if (fullPath === 'health' && method === 'OPTIONS') {
    return healthHandler.onRequestOptions();
  }
  
  // Default 404 response
  return new Response(
    JSON.stringify({ 
      detail: 'Endpoint not implemented in Cloudflare Function',
      path: fullPath,
      method: method,
      note: 'Some endpoints require the full Python backend. This is a lightweight JS implementation for critical auth routes.'
    }),
    { 
      status: 404, 
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      } 
    }
  );
}

// Handle all OPTIONS requests globally
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
