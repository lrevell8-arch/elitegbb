// Community Comments API
// POST /api/community/comments - Create new comment or reply

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

// Verify player token
async function verifyPlayerToken(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing token' };
  }

  const token = authHeader.substring(7);
  try {
    const payload = await verifyJWT(token, env.JWT_SECRET || 'fallback-secret-key-change-in-production');
    if (payload.type !== 'player' && payload.role !== 'player') {
      return { valid: false, error: 'Not a player token' };
    }
    return { valid: true, user: payload };
  } catch (err) {
    return { valid: false, error: 'Invalid token' };
  }
}

// POST - Create new comment
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const auth = await verifyPlayerToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();

    // Validation
    if (!body.post_id || !body.content) {
      return new Response(
        JSON.stringify({ detail: 'Post ID and content are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (body.content.length < 1 || body.content.length > 5000) {
      return new Response(
        JSON.stringify({ detail: 'Content must be between 1 and 5000 characters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify post exists and is active
    const { data: posts, error: postError } = await supabaseQuery(env, 'community_posts', 'GET', {
      select: 'id,author_id',
      eq: { id: body.post_id, status: 'active' }
    });

    if (postError || !posts || posts.length === 0) {
      return new Response(
        JSON.stringify({ detail: 'Post not found or inactive' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const post = posts[0];

    // If this is a reply, verify parent comment exists
    if (body.parent_id) {
      const { data: parentComments, error: parentError } = await supabaseQuery(env, 'community_comments', 'GET', {
        select: 'id,author_id',
        eq: { id: body.parent_id, post_id: body.post_id, status: 'active' }
      });

      if (parentError || !parentComments || parentComments.length === 0) {
        return new Response(
          JSON.stringify({ detail: 'Parent comment not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const commentData = {
      post_id: body.post_id,
      author_id: auth.user.sub || auth.user.id,
      parent_id: body.parent_id || null,
      content: body.content,
      attachments: body.attachments || [],
      status: 'active'
    };

    const { data, error } = await supabaseQuery(env, 'community_comments', 'POST', {
      body: commentData,
      select: `*,
        author:author_id(id,player_name,primary_position,grad_class,school,community_reputation),
        reactions:community_reactions(user_id, reaction_type)`
    });

    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Failed to create comment', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update player's reputation (+2 for comment)
    await supabaseQuery(env, 'players', 'PATCH', {
      eq: { id: auth.user.sub || auth.user.id },
      body: { 
        community_reputation: { increment: 2 }
      }
    });

    // If this is a reply to post author, mark as accepted answer for Q&A posts
    if (body.parent_id) {
      const { data: parentComments } = await supabaseQuery(env, 'community_comments', 'GET', {
        select: 'author_id',
        eq: { id: body.parent_id }
      });
      
      if (parentComments && parentComments[0]?.author_id === post.author_id) {
        // Don't automatically mark, but could add logic here
      }
    }

    return new Response(
      JSON.stringify({ success: true, comment: data?.[0] }),
      { 
        status: 201, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
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
