// Admin Export API
// POST /api/admin/export - Export players, coaches, or submissions as CSV/JSON

import { verifyJWT } from '../../../utils/jwt.js';

// Supabase REST API helper
async function supabaseQuery(env, table, method, params = {}) {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}`;
  const headers = {
    'apikey': env.SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': method === 'POST' ? 'return=representation' : method === 'PATCH' ? 'return=representation' : ''
  };

  const queryParams = new URLSearchParams();
  if (params.select) queryParams.append('select', params.select);
  if (params.eq) {
    Object.entries(params.eq).forEach(([key, value]) => {
      queryParams.append(key, `eq.${value}`);
    });
  }
  if (params.order) queryParams.append('order', params.order);

  const fullUrl = queryParams.toString() ? `${url}?${queryParams.toString()}` : url;

  const response = await fetch(fullUrl, {
    method,
    headers,
    body: params.body ? JSON.stringify(params.body) : undefined
  });

  if (!response.ok) {
    const error = await response.text();
    return { data: null, error: { message: error, status: response.status } };
  }

  const data = await response.json();
  return { data: Array.isArray(data) ? data : [data], error: null };
}

// Verify admin token
async function verifyAdminToken(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing token' };
  }

  const token = authHeader.substring(7);
  try {
    const payload = await verifyJWT(token, env.JWT_SECRET || 'fallback-secret-key-change-in-production');
    if (payload.role !== 'admin' && payload.role !== 'editor') {
      return { valid: false, error: 'Insufficient permissions' };
    }
    return { valid: true, user: payload };
  } catch (err) {
    return { valid: false, error: 'Invalid token' };
  }
}

// Convert data to CSV
function convertToCSV(data, exportType) {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header] ?? '';
      // Escape values with commas or quotes
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

// POST - Export data
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const auth = await verifyAdminToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { export_type, format } = body;

    if (!export_type || !['players', 'coaches', 'submissions'].includes(export_type)) {
      return new Response(
        JSON.stringify({ detail: 'Invalid export_type. Must be one of: players, coaches, submissions' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch data based on export type
    let table, select;
    switch (export_type) {
      case 'players':
        table = 'players';
        select = '*';
        break;
      case 'coaches':
        table = 'coaches';
        select = '*';
        break;
      case 'submissions':
        table = 'projects'; // Using projects as submissions
        select = '*';
        break;
    }

    const { data, error } = await supabaseQuery(env, table, 'GET', {
      select,
      order: 'created_at.desc'
    });

    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Failed to fetch data', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const records = data || [];

    // Return in requested format
    if (format === 'csv') {
      const csv_content = convertToCSV(records, export_type);
      return new Response(
        JSON.stringify({
          success: true,
          export_type,
          format: 'csv',
          count: records.length,
          csv_content
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    } else {
      // JSON format
      return new Response(
        JSON.stringify({
          success: true,
          export_type,
          format: 'json',
          count: records.length,
          data: records
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ detail: 'Error: ' + err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// OPTIONS - CORS
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
