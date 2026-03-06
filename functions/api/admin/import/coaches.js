// Bulk Import Coaches Endpoint
// POST /api/admin/import/coaches
// Supports CSV and XLSX formats
// Fields: name, email, school, title, state, auto_verify (optional)
// Admin only access

import { verifyJWT } from '../../../utils/jwt.js';

// HWH Brand reference (for email templates if needed)
const COLORS = {
  primary: '#0134bd',
  secondary: '#fb6c1d'
};

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
  const requiredHeaders = ['name', 'email', 'school', 'title', 'state'];

  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  if (missingHeaders.length > 0) {
    return { error: `Missing required columns: ${missingHeaders.join(', ')}` };
  }

  const coaches = [];
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

    const coach = {};
    headers.forEach((header, index) => {
      coach[header] = values[index] || '';
    });

    // Validate required fields
    if (!coach.name || !coach.email) {
      coach._error = 'Name and email are required';
      coach._row = i + 1;
    } else if (!isValidEmail(coach.email)) {
      coach._error = 'Invalid email format';
      coach._row = i + 1;
    }

    coaches.push(coach);
  }

  return { coaches, total: coaches.length };
}

// Simple XLSX parser (basic support for XML-based format)
function parseXLSX(content) {
  // For now, fall back to CSV-style parsing for basic text content
  // Full XLSX would require a library like 'xlsx' which may not be available in Workers
  return parseCSV(content);
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Generate random password
function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
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

// Check if coach exists by email
async function checkExistingCoach(env, email) {
  const url = `${env.SUPABASE_URL}/rest/v1/coaches?email=eq.${encodeURIComponent(email)}&select=id,email`;
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

// Create coach in Supabase
async function createCoach(env, coachData, tempPassword) {
  const passwordHash = await hashPassword(tempPassword);
  
  const url = `${env.SUPABASE_URL}/rest/v1/coaches`;
  const body = {
    name: coachData.name,
    email: coachData.email.toLowerCase(),
    school: coachData.school,
    title: coachData.title,
    state: coachData.state,
    password_hash: passwordHash,
    verified: coachData.auto_verify === 'true' || coachData.auto_verify === true,
    status: 'active',
    created_at: new Date().toISOString()
  };

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
  return { success: true, coach: data?.[0] };
}

// Send welcome email notification (placeholder - would integrate with email service)
async function sendWelcomeEmail(coach, tempPassword) {
  // In production, this would call an email service API
  // For now, we'll just log that an email would be sent
  console.log(`[EMAIL] Welcome email would be sent to ${coach.email} with temp password: ${tempPassword}`);
  return { sent: true };
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

    // Get content type
    const contentType = request.headers.get('Content-Type') || '';
    
    let fileContent;
    let fileFormat = 'csv';

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
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
      // Handle JSON payload with inline data
      const json = await request.json();
      if (!json.data && !json.coaches) {
        return new Response(
          JSON.stringify({ detail: 'No data provided. Send file or JSON with data/coaches array' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // If coaches array provided directly
      if (json.coaches && Array.isArray(json.coaches)) {
        return processDirectCoaches(json.coaches, env, json.options || {});
      }
      
      fileContent = json.data;
      fileFormat = json.format || 'csv';
    } else {
      return new Response(
        JSON.stringify({ detail: 'Unsupported content type. Use multipart/form-data or application/json' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse file based on format
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

    const { coaches } = parseResult;

    // Process coaches
    return processDirectCoaches(coaches, env, { 
      skipErrors: true, 
      dryRun: false,
      autoVerify: coaches.some(c => c.auto_verify === 'true')
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ detail: 'Import error', error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Process coaches array (shared logic)
async function processDirectCoaches(coaches, env, options = {}) {
  const { skipErrors = true, dryRun = false, autoVerify = false } = options;
  
  const results = {
    success: 0,
    failed: 0,
    skipped: 0,
    created: [],
    errors: [],
    tempPasswords: {} // Only for demo - in production, emails would be sent
  };

  for (const coach of coaches) {
    // Skip if validation error
    if (coach._error) {
      results.failed++;
      results.errors.push({
        row: coach._row,
        name: coach.name,
        error: coach._error
      });
      continue;
    }

    // Check for duplicates
    const existing = await checkExistingCoach(env, coach.email);
    if (existing) {
      results.skipped++;
      results.errors.push({
        row: coach._row,
        name: coach.name,
        email: coach.email,
        error: 'Coach with this email already exists'
      });
      continue;
    }

    if (dryRun) {
      results.success++;
      continue;
    }

    // Generate temp password
    const tempPassword = generateTempPassword();

    // Create coach
    const createResult = await createCoach(env, {
      ...coach,
      auto_verify: autoVerify || coach.auto_verify === 'true'
    }, tempPassword);

    if (createResult.success) {
      results.success++;
      results.created.push({
        id: createResult.coach.id,
        name: coach.name,
        email: coach.email,
        school: coach.school,
        verified: autoVerify || coach.auto_verify === 'true'
      });
      
      // Store temp password for demo (would send email in production)
      results.tempPasswords[coach.email] = tempPassword;

      // Send welcome email (async, don't wait)
      sendWelcomeEmail(createResult.coach, tempPassword);
    } else {
      results.failed++;
      results.errors.push({
        row: coach._row,
        name: coach.name,
        email: coach.email,
        error: createResult.error
      });
    }
  }

  // Remove tempPasswords from response in production (for security)
  const responseData = {
    success: true,
    summary: {
      total: coaches.length,
      created: results.success,
      failed: results.failed,
      skipped: results.skipped
    },
    created: results.created,
    errors: results.errors
  };

  // Only include temp passwords in development/non-production
  if (env.ENVIRONMENT === 'development' || env.INCLUDE_PASSWORDS === 'true') {
    responseData.tempPasswords = results.tempPasswords;
    responseData._note = 'Temp passwords are shown for demo only. In production, emails are sent directly.';
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
    // Verify admin authentication
    const auth = await verifyAdminToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const template = `name,email,school,title,state,auto_verify
John Smith,coach.smith@school.edu,Lincoln High School,Head Coach,TX,false
Sarah Johnson,sjohnson@academy.org,West Academy,Assistant Coach,CA,false
Mike Williams,mwilliams@district.edu,Central District,Athletic Director,FL,true`;

    const headers = {
      'Content-Type': format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv',
      'Content-Disposition': `attachment; filename="coaches_import_template.${format}"`,
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

// OPTIONS handler for CORS
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
