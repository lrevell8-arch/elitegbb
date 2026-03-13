// Community Comment Detail API
// PATCH /api/community/comments/:id - Update comment
// DELETE /api/community/comments/:id - Delete comment

import { verifyJWT } from '../../../../utils/jwt.js';

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

// Verify token
async function verifyToken(request, env) {
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

// PATCH - Update comment
export async function onRequestPatch(context) {
  const { request, env, params } = context;
  const commentId = params.id;

  try {
    const auth = await verifyToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get existing comment
    const { data: comments, error: commentError } = await supabaseQuery(env, 'community_comments', 'GET', {
      select: '*',
      eq: { id: commentId }
    });

    if (commentError || !comments || comments.length === 0) {
      return new Response(
        JSON.stringify({ detail: 'Comment not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const comment = comments[0];
    const isAuthor = comment.author_id === (auth.user.sub || auth.user.id);
    const isAdmin = auth.user.role === 'admin' || auth.user.role === 'editor';

    if (!isAuthor && !isAdmin) {
      return new Response(
        JSON.stringify({ detail: 'Not authorized to edit this comment' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const updateData = {};

    if (isAuthor) {
      if (body.content !== undefined) updateData.content = body.content;
      if (body.attachments !== undefined) updateData.attachments = body.attachments;
    }

    if (isAdmin) {
      if (body.status !== undefined) updateData.status = body.status;
      if (body.is_accepted_answer !== undefined) updateData.is_accepted_answer = body.is_accepted_answer;
    }

    if (Object.keys(updateData).length === 0) {
      return new Response(
        JSON.stringify({ detail: 'No valid fields to update' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseQuery(env, 'community_comments', 'PATCH', {
      select: `*,
        author:author_id(id,player_name,primary_position,grad_class,school,community_reputation)`,
      eq: { id: commentId },
      body: updateData
    });

    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Failed to update comment', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, comment: data?.[0] }),
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
      JSON.stringify({ detail: 'Error: ' + err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// DELETE - Delete comment (soft delete)
export async function onRequestDelete(context) {
  const { request, env, params } = context;
  const commentId = params.id;

  try {
    const auth = await verifyToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get existing comment
    const { data: comments, error: commentError } = await supabaseQuery(env, 'community_comments', 'GET', {
      select: '*',
      eq: { id: commentId }
    });

    if (commentError || !comments || comments.length === 0) {
      return new Response(
        JSON.stringify({ detail: 'Comment not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const comment = comments[0];
    const isAuthor = comment.author_id === (auth.user.sub || auth.user.id);
    const isAdmin = auth.user.role === 'admin' || auth.user.role === 'editor';

    if (!isAuthor && !isAdmin) {
      return new Response(
        JSON.stringify({ detail: 'Not authorized to delete this comment' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Soft delete
    const { error } = await supabaseQuery(env, 'community_comments', 'PATCH', {
      eq: { id: commentId },
      body: { status: 'deleted' }
    });

    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Failed to delete comment', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update author's reputation
    await supabaseQuery(env, 'players', 'PATCH', {
      eq: { id: comment.author_id },
      body: { 
        community_reputation: { decrement: 2 }
      }
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Comment deleted successfully' }),
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
      'Access-Control-Allow-Methods': 'PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
