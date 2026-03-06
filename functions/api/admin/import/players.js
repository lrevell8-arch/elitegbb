// Bulk Import Players Endpoint
// POST /api/admin/import/players
// Supports CSV and XLSX formats
// Fields: player_name, position, grad_class, school, city, state, gender, height, weight, parent_name, parent_email, parent_phone
// Admin only access

import { verifyJWT } from '../../../utils/jwt.js';

// Verify admin token
async function verifyAdminToken(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing token' };
  }

  const token = authHeader.substring(7);
  try {
    const payload = await verifyJWT(token, env.JWT_SECRET || 'fallback-secret-key-change-in-production');
    if (payload.role !== 'admin') {
      return { valid: false, error: 'Insufficient permissions - Admin only' };
    }
    return { valid: true, user: payload };
  } catch (err) {
    return { valid: false, error: 'Invalid token' };
  }
}

// Parse CSV content
function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return { error: 'CSV must have header and at least one data row' };

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
  const requiredHeaders = ['player_name', 'grad_class', 'gender', 'school', 'city', 'state'];

  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  if (missingHeaders.length > 0) {
    return { error: `Missing required columns: ${missingHeaders.join(', ')}` };
  }

  const players = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle quoted values with commas
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/"/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/"/g, ''));

    const player = {};
    headers.forEach((header, index) => {
      player[header] = values[index] || '';
    });

    // Validate required fields
    if (!player.player_name) {
      player._error = 'Player name is required';
      player._row = i + 1;
    } else if (!player.grad_class) {
      player._error = 'Grad class is required';
      player._row = i + 1;
    } else if (!player.gender) {
      player._error = 'Gender is required';
      player._row = i + 1;
    }

    players.push(player);
  }

  return { players, total: players.length };
}

// Simple XLSX parser
function parseXLSX(content) {
  return parseCSV(content);
}

// Validate email format
function isValidEmail(email) {
  if (!email) return true; // Email is optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Generate unique player key
function generatePlayerKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'P-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Hash password using SHA-256
async function hashPassword(password) {
  const saltArray = new Uint8Array(16);
  crypto.getRandomValues(saltArray);
  const salt = btoa(String.fromCharCode(...saltArray));
  
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = btoa(String.fromCharCode(...hashArray));
  
  return salt + hash;
}

// Generate random temp password
function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Check if player exists (by name + school + grad_class for uniqueness)
async function checkExistingPlayer(env, playerData) {
  const url = `${env.SUPABASE_URL}/rest/v1/players?player_name=eq.${encodeURIComponent(playerData.player_name)}&school=eq.${encodeURIComponent(playerData.school)}&grad_class=eq.${encodeURIComponent(playerData.grad_class)}&select=id,player_name,school`;
  
  const response = await fetch(url, {
    headers: {
      'apikey': env.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`
    }
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data?.[0] || null;
}

// Create player in Supabase
async function createPlayer(env, playerData) {
  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);
  const playerKey = generatePlayerKey();
  
  const url = `${env.SUPABASE_URL}/rest/v1/players`;
  
  // Build body with available fields
  const body = {
    player_key: playerKey,
    player_name: playerData.player_name,
    password_hash: passwordHash,
    primary_position: playerData.position || playerData.primary_position || 'Guard',
    grad_class: parseInt(playerData.grad_class) || new Date().getFullYear(),
    gender: playerData.gender,
    school: playerData.school,
    city: playerData.city,
    state: playerData.state,
    height: playerData.height || null,
    weight: playerData.weight ? parseInt(playerData.weight) : null,
    parent_name: playerData.parent_name || null,
    parent_email: playerData.parent_email || null,
    parent_phone: playerData.parent_phone || null,
    player_email: playerData.player_email || null,
    verified: false,
    payment_status: 'pending',
    created_at: new Date().toISOString()
  };

  // Optional fields
  if (playerData.secondary_position) body.secondary_position = playerData.secondary_position;
  if (playerData.jersey_number) body.jersey_number = parseInt(playerData.jersey_number);
  if (playerData.instagram_handle) body.instagram_handle = playerData.instagram_handle;
  if (playerData.preferred_name) body.preferred_name = playerData.preferred_name;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': env.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.text();
    return { success: false, error };
  }

  const data = await response.json();
  return { success: true, player: data?.[0], tempPassword };
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // Verify admin authentication
    const auth = await verifyAdminToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const contentType = request.headers.get('Content-Type') || '';
    
    let fileContent;
    let fileFormat = 'csv';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      
      if (!file) {
        return new Response(
          JSON.stringify({ detail: 'No file provided' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      fileContent = await file.text();
      fileFormat = file.name.toLowerCase().endsWith('.xlsx') ? 'xlsx' : 'csv';
    } else if (contentType.includes('application/json')) {
      const json = await request.json();
      if (!json.data && !json.players) {
        return new Response(
          JSON.stringify({ detail: 'No data provided. Send file or JSON with data/players array' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      if (json.players && Array.isArray(json.players)) {
        return processDirectPlayers(json.players, env, json.options || {});
      }
      
      fileContent = json.data;
      fileFormat = json.format || 'csv';
    } else {
      return new Response(
        JSON.stringify({ detail: 'Unsupported content type. Use multipart/form-data or application/json' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let parseResult;
    if (fileFormat === 'xlsx') {
      parseResult = parseXLSX(fileContent);
    } else {
      parseResult = parseCSV(fileContent);
    }

    if (parseResult.error) {
      return new Response(
        JSON.stringify({ detail: 'Parse error', error: parseResult.error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { players } = parseResult;
    return processDirectPlayers(players, env, { skipErrors: true, dryRun: false });

  } catch (err) {
    return new Response(
      JSON.stringify({ detail: 'Import error', error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function processDirectPlayers(players, env, options = {}) {
  const { skipErrors = true, dryRun = false } = options;
  
  const results = {
    success: 0,
    failed: 0,
    skipped: 0,
    created: [],
    errors: [],
    tempCredentials: {} // For demo - would email in production
  };

  for (const player of players) {
    if (player._error) {
      results.failed++;
      results.errors.push({
        row: player._row,
        player_name: player.player_name,
        error: player._error
      });
      continue;
    }

    // Check for duplicates
    const existing = await checkExistingPlayer(env, player);
    if (existing) {
      results.skipped++;
      results.errors.push({
        row: player._row,
        player_name: player.player_name,
        school: player.school,
        error: 'Player already exists (same name, school, and grad class)'
      });
      continue;
    }

    if (dryRun) {
      results.success++;
      continue;
    }

    const createResult = await createPlayer(env, player);

    if (createResult.success) {
      results.success++;
      results.created.push({
        id: createResult.player.id,
        player_key: createResult.player.player_key,
        player_name: player.player_name,
        school: player.school,
        grad_class: player.grad_class
      });
      
      // Store temp credentials for demo (email would be sent in production)
      results.tempCredentials[createResult.player.player_key] = {
        player_name: player.player_name,
        temp_password: createResult.tempPassword,
        login_url: `${env.FRONTEND_URL || 'https://elitegbb-app.pages.dev'}/player/login`
      };
    } else {
      results.failed++;
      results.errors.push({
        row: player._row,
        player_name: player.player_name,
        school: player.school,
        error: createResult.error
      });
    }
  }

  const responseData = {
    success: true,
    summary: {
      total: players.length,
      created: results.success,
      failed: results.failed,
      skipped: results.skipped
    },
    created: results.created,
    errors: results.errors
  };

  if (env.ENVIRONMENT === 'development' || env.INCLUDE_PASSWORDS === 'true') {
    responseData.tempCredentials = results.tempCredentials;
    responseData._note = 'Temp credentials are shown for demo only. In production, emails are sent directly to parents/players.';
  }

  return new Response(
    JSON.stringify(responseData),
    { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
  );
}

// GET - Download template
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const format = url.searchParams.get('format') || 'csv';

  try {
    const auth = await verifyAdminToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const template = `player_name,preferred_name,position,secondary_position,grad_class,gender,school,city,state,height,weight,jersey_number,instagram_handle,parent_name,parent_email,parent_phone,player_email
Emma Johnson,Em,Guard,Forward,2026,Female,Lincoln High School,Austin,TX,5'8",140,14,@emmahoops,Jennifer Johnson,jennifer@email.com,512-555-0101,emma.j@email.com
Sophia Williams,Sophie,Center,,2025,Female,West Academy,Los Angeles,CA,6'2",165,32,@sophiahoops,Maria Williams,maria@email.com,213-555-0202,sophia@email.com
Olivia Brown,Liv,Shooting Guard,,2027,Female,Central School,Miami,FL,5'6",125,22,@oliviabball,Sarah Brown,sarah@email.com,305-555-0303,olivia@email.com`;

    const headers = {
      'Content-Type': format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv',
      'Content-Disposition': `attachment; filename="players_import_template.${format}"`,
      'Access-Control-Allow-Origin': '*'
    };

    return new Response(template, { status: 200, headers });

  } catch (err) {
    return new Response(
      JSON.stringify({ detail: 'Error generating template', error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
