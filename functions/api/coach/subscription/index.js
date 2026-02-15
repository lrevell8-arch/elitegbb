// Coach Subscription API Endpoint
// GET /api/coach/subscription - Get subscription status
// POST /api/coach/subscription - Create/update subscription

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
  return { data, error: null };
}

// Verify coach token
async function verifyCoachToken(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing token' };
  }

  const token = authHeader.substring(7);
  try {
    const payload = await verifyJWT(token, env.JWT_SECRET || 'fallback-secret-key-change-in-production');
    if (payload.role !== 'coach') {
      return { valid: false, error: 'Coach access required' };
    }
    return { valid: true, user: payload };
  } catch (err) {
    return { valid: false, error: 'Invalid token' };
  }
}

// GET - Subscription status
export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const auth = await verifyCoachToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const coachId = auth.user.sub;

    // Fetch coach subscription data
    // Note: This is a mock implementation - in production, integrate with Stripe
    const { data: coach, error } = await supabaseQuery(env, 'coaches', 'GET', {
      select: 'id,subscription_status,subscription_tier,subscription_expires_at,created_at',
      eq: { id: coachId }
    });

    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Failed to fetch subscription', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const subscriptionData = {
      subscription: {
        status: coach?.[0]?.subscription_status || 'inactive',
        tier: coach?.[0]?.subscription_tier || 'free',
        expires_at: coach?.[0]?.subscription_expires_at || null,
        features: getFeaturesForTier(coach?.[0]?.subscription_tier || 'free')
      },
      tiers: [
        {
          id: 'free',
          name: 'Free',
          price: 0,
          features: ['View up to 10 players', 'Basic search', 'Save up to 3 players']
        },
        {
          id: 'basic',
          name: 'Basic',
          price: 29.99,
          features: ['View up to 50 players', 'Advanced search', 'Save up to 20 players', 'Direct messaging']
        },
        {
          id: 'premium',
          name: 'Premium',
          price: 79.99,
          features: ['Unlimited player views', 'Advanced search & filters', 'Unlimited saved players', 'Priority messaging', 'Player comparison tools', 'Export data']
        }
      ]
    };

    return new Response(
      JSON.stringify(subscriptionData),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ detail: 'Error: ' + err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST - Update subscription (mock - would integrate with Stripe)
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const auth = await verifyCoachToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { tier, payment_method } = body;

    if (!tier) {
      return new Response(
        JSON.stringify({ detail: 'Subscription tier is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const coachId = auth.user.sub;

    // Calculate expiration (1 month from now)
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    // Update coach subscription
    const { data, error } = await supabaseQuery(env, 'coaches', 'PATCH', {
      select: 'id,subscription_status,subscription_tier,subscription_expires_at',
      eq: { id: coachId },
      body: {
        subscription_tier: tier,
        subscription_status: 'active',
        subscription_expires_at: expiresAt.toISOString()
      }
    });

    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Failed to update subscription', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        subscription: {
          tier: data?.[0]?.subscription_tier,
          status: data?.[0]?.subscription_status,
          expires_at: data?.[0]?.subscription_expires_at,
          features: getFeaturesForTier(tier)
        },
        message: 'Subscription updated successfully'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ detail: 'Error: ' + err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Helper function to get features for tier
function getFeaturesForTier(tier) {
  const features = {
    free: ['View up to 10 players', 'Basic search', 'Save up to 3 players'],
    basic: ['View up to 50 players', 'Advanced search', 'Save up to 20 players', 'Direct messaging'],
    premium: ['Unlimited player views', 'Advanced search & filters', 'Unlimited saved players', 'Priority messaging', 'Player comparison tools', 'Export data']
  };
  return features[tier] || features.free;
}

// OPTIONS - CORS
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
