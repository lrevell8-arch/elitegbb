// Catch-all API Handler for Cloudflare Pages Functions
// Routes requests to specific handlers based on path
// Note: Most routes are now handled by dedicated files using file-based routing
// This file serves as a fallback and handles auth routes

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
  
  // For all other paths, return info about available endpoints
  return new Response(
    JSON.stringify({ 
      status: 'API is running',
      available_endpoints: {
        auth: [
          'POST /api/auth/login - Admin/Staff login',
          'POST /api/auth/setup - Create initial admin user',
          'GET /api/auth/me - Get current user info'
        ],
        admin: [
          'GET /api/admin/dashboard - Admin dashboard stats',
          'GET /api/admin/pipeline - Pipeline board data',
          'GET /api/admin/players - Player directory',
          'GET /api/admin/coaches - Coach management'
        ],
        coach: [
          'POST /api/coach/login - Coach login',
          'GET /api/coach/dashboard - Coach dashboard',
          'GET /api/coach/subscription - Subscription info',
          'GET /api/coach/messages - Messages',
          'GET /api/coach/compare?ids=id1,id2 - Compare players'
        ],
        data: [
          'GET /api/players - List players',
          'POST /api/players - Create player (intake)',
          'GET /api/coaches - List coaches',
          'GET /api/projects - List projects (pipeline)',
          'GET /api/messages - List messages'
        ],
        system: [
          'GET /api/health - Health check'
        ]
      },
      note: 'File-based routing is active. Most endpoints are handled by dedicated files in /functions/api/'
    }),
    { 
      status: 200, 
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
