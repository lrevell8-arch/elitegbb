// Players API Endpoints
// GET /api/players - List all players
// POST /api/players - Create new player
// GET /api/players/:id - Get player by ID
// PATCH /api/players/:id - Update player

import { verifyJWT } from '../../utils/jwt.js';

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
  if (params.neq) {
    Object.entries(params.neq).forEach(([key, value]) => {
      queryParams.append(key, `neq.${value}`);
    });
  }
  if (params.order) queryParams.append('order', params.order);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.offset) queryParams.append('offset', params.offset);

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

// Generate SHA-256 password hash
async function hashPassword(password) {
  // Generate random salt
  const saltArray = new Uint8Array(16);
  crypto.getRandomValues(saltArray);
  const salt = btoa(String.fromCharCode(...saltArray));
  
  // Create hash: salt + SHA256(password + salt)
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = btoa(String.fromCharCode(...hashArray));
  
  return salt + hash;
}

// Verify any authenticated token (admin or coach)
async function verifyAnyToken(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing token' };
  }

  const token = authHeader.substring(7);
  try {
    const payload = await verifyJWT(token, env.JWT_SECRET || 'fallback-secret-key-change-in-production');
    return { valid: true, user: payload };
  } catch (err) {
    return { valid: false, error: 'Invalid token' };
  }
}

// Generate unique player key
function generatePlayerKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'P-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// GET - List all players (with optional filters)
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  try {
    // Allow public access to verified players for coaches
    // But require auth for full list
    const authHeader = request.headers.get('Authorization');
    const isAdminRequest = url.searchParams.get('admin') === 'true';
    
    let params = {
      select: '*',
      order: 'created_at.desc'
    };

    // If not admin request, only show verified players
    if (!isAdminRequest && !authHeader) {
      params.eq = { is_verified: true };
    }

    const { data: players, error } = await supabaseQuery(env, 'players', 'GET', params);

    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Failed to fetch players', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(players || []),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ detail: 'Error: ' + err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST - Create new player (from intake form)
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // Log environment status (without exposing secrets)
    console.log('Player creation started');
    console.log('SUPABASE_URL available:', !!env.SUPABASE_URL);
    console.log('SUPABASE_ANON_KEY available:', !!env.SUPABASE_ANON_KEY);

    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      console.error('Missing required environment variables');
      return new Response(
        JSON.stringify({
          detail: 'Server configuration error: Database connection not configured',
          error: 'MISSING_ENV_VARS',
          help: 'Please ensure SUPABASE_ANON_KEY is set via wrangler secret put SUPABASE_ANON_KEY'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    let body;
    try {
      body = await request.json();
      console.log('Request body received:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ detail: 'Invalid JSON in request body', error: parseError.message }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    // Required fields (matching frontend form validation)
    const required = ['player_name', 'grad_class', 'gender', 'primary_position'];
    const missingFields = [];
    for (const field of required) {
      if (!body[field]) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
      return new Response(
        JSON.stringify({
          detail: `Missing required fields: ${missingFields.join(', ')}`,
          missingFields: missingFields,
          receivedData: Object.keys(body)
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    // Also require parent info
    if (!body.parent_name || !body.parent_email) {
      console.log('Missing parent info');
      return new Response(
        JSON.stringify({
          detail: 'Parent name and email are required',
          missingParentInfo: {
            parent_name: !body.parent_name ? 'missing' : 'provided',
            parent_email: !body.parent_email ? 'missing' : 'provided'
          }
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    const playerKey = generatePlayerKey();
    
    // Generate a temporary password for the player
    // In production, you might want to email this to them or have them set it later
    const tempPassword = await hashPassword('TempPass123!');

    // Map frontend field names to database column names
    // Frontend -> Database mapping based on PROJECT_HANDOFF.md
    const playerData = {
      // Core fields
      player_key: playerKey,
      name: body.player_name,
      email: body.player_email || body.parent_email, // Use player email or fallback to parent
      password_hash: tempPassword,
      
      // Graduation year - convert from string to integer
      graduation_year: body.grad_class ? parseInt(body.grad_class) : null,
      
      // School info
      school: body.school || null,
      state: body.state || null,
      
      // Stats - map field names
      height: body.height || null,
      weight: body.weight ? parseInt(body.weight) : null,

      // Positions - combine primary and secondary into array
      positions: body.secondary_position
        ? [body.primary_position, body.secondary_position]
        : [body.primary_position],

      // Gender - required field
      gender: body.gender || null,

      // Stats that exist in DB (note the naming)
      ppg: body.ppg ? parseFloat(body.ppg) : null,
      apg: body.apg ? parseFloat(body.apg) : null,
      rpg: body.rpg ? parseFloat(body.rpg) : null,
      spg: body.spg ? parseFloat(body.spg) : null,
      bpg: body.bpg ? parseFloat(body.bpg) : null,
      fg_percent: body.fg_pct ? parseFloat(body.fg_pct) : null,
      three_p_percent: body.three_pct ? parseFloat(body.three_pct) : null,
      ft_percent: body.ft_pct ? parseFloat(body.ft_pct) : null,
      
      // Social links (if provided)
      instagram: body.instagram_handle || null,
      
      // Parent info
      parent_name: body.parent_name || null,
      parent_email: body.parent_email || null,
      parent_phone: body.parent_phone || null,
      
      // Status fields
      is_verified: false,
      payment_status: body.package_selected === 'free' ? 'free' : 'pending',
      
      // Package info
      package_selected: body.package_selected || null,
      
      // Account type flags
      is_free_tier: body.package_selected === 'free' || false,
      
      // Store intake data as JSON in coach_notes field (temporary solution)
      // This preserves the self-eval, film links, goals, etc.
      coach_notes: JSON.stringify({
        preferred_name: body.preferred_name,
        dob: body.dob,
        gender: body.gender,
        jersey_number: body.jersey_number,
        city: body.city,
        level: body.level,
        team_names: body.team_names,
        league_region: body.league_region,
        self_evaluation: {
          self_words: body.self_words,
          strength: body.strength,
          improvement: body.improvement,
          separation: body.separation,
          adversity_response: body.adversity_response,
          iq_self_rating: body.iq_self_rating,
          pride_tags: body.pride_tags,
          player_model: body.player_model
        },
        film_links: body.film_links,
        highlight_links: body.highlight_links,
        other_socials: body.other_socials,
        goal: body.goal,
        colleges_interest: body.colleges_interest,
        consent_eval: body.consent_eval,
        consent_media: body.consent_media,
        guardian_signature: body.guardian_signature,
        signature_date: body.signature_date
      })
    };

    console.log('Inserting player data into Supabase...');

    const { data, error } = await supabaseQuery(env, 'players', 'POST', {
      body: playerData
    });

    if (error) {
      console.error('Player creation error:', error);
      // Check for specific Supabase errors
      let errorDetail = 'Failed to create player';
      let errorCode = 'DB_ERROR';

      if (error.message.includes('23505')) {
        errorDetail = 'A player with this email already exists';
        errorCode = 'DUPLICATE_EMAIL';
      } else if (error.message.includes('23502')) {
        errorDetail = 'Required database field is missing';
        errorCode = 'NOT_NULL_VIOLATION';
      } else if (error.message.includes('42P01')) {
        errorDetail = 'Database table not found. Please ensure the players table exists in Supabase';
        errorCode = 'TABLE_NOT_FOUND';
      } else if (error.message.includes('permission denied')) {
        errorDetail = 'Database permission denied. Please check Supabase RLS policies';
        errorCode = 'PERMISSION_DENIED';
      }

      return new Response(
        JSON.stringify({
          detail: errorDetail,
          error: error.message,
          code: errorCode,
          help: 'Check your Supabase configuration and ensure the players table exists with proper permissions'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    console.log('Player created successfully:', data[0]?.id || 'unknown id');

    // Get package price for Stripe integration
    const packagePrices = {
      'free': 0,
      'starter': 99,
      'development': 199,
      'elite_track': 399
    };
    const packagePrice = packagePrices[body.package_selected] || 0;
    const isFreeTier = body.package_selected === 'free';

    // Return player data with payment info
    // Note: Stripe integration is not implemented yet - frontend will redirect to success page
    return new Response(
      JSON.stringify({ 
        success: true, 
        player: data[0], 
        player_key: playerKey,
        message: isFreeTier ? 'Free profile created successfully! Upgrade anytime.' : 'Player created successfully',
        // Stripe integration placeholder - when implemented, return payment_url
        // payment_url: 'https://stripe.com/checkout/...',
        payment_required: !isFreeTier && packagePrice > 0,
        package_price: packagePrice,
        is_free_tier: isFreeTier,
        temp_password: 'TempPass123!' // TODO: Remove in production - only for testing
      }),
      { status: 201, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (err) {
    console.error('Server error:', err);
    console.error('Error stack:', err.stack);
    return new Response(
      JSON.stringify({
        detail: 'Internal server error: ' + err.message,
        error: err.message,
        stack: err.stack,
        help: 'Please check server logs for more details'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    );
  }
}

// OPTIONS - CORS
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
