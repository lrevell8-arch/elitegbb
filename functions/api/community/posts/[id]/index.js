// Community Post Detail API
// GET /api/community/posts/:id - Get single post with comments
// PATCH /api/community/posts/:id - Update post
// DELETE /api/community/posts/:id - Delete/hide post

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

// Verify token (player or admin)
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

// GET - Get single post with comments
export async function onRequestGet(context) {
  const { request, env, params } = context;
  const postId = params.id;

  try {
    // Get post with author info and reactions
    const { data: posts, error: postError } = await supabaseQuery(env, 'community_posts', 'GET', {
      select: `*,
        author:author_id(id, player_name, primary_position, grad_class, school, community_reputation),
        reactions:community_reactions(user_id, reaction_type)`,
      eq: { id: postId, status: 'active' }
    });

    if (postError) {
      return new Response(
        JSON.stringify({ detail: 'Failed to fetch post', error: postError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!posts || posts.length === 0) {
      return new Response(
        JSON.stringify({ detail: 'Post not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const post = posts[0];

    // Get comments with nested replies
    const { data: comments, error: commentsError } = await supabaseQuery(env, 'community_comments', 'GET', {
      select: `*,
        author:author_id(id, player_name, primary_position, grad_class, school, community_reputation),
        reactions:community_reactions(user_id, reaction_type)`,
      eq: { post_id: postId, status: 'active', parent_id: 'is.null' },
      order: 'created_at.desc'
    });

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
    }

    // Get replies for each comment
    const commentsWithReplies = await Promise.all((comments || []).map(async (comment) => {
      const { data: replies } = await supabaseQuery(env, 'community_comments', 'GET', {
        select: `*,
          author:author_id(id, player_name, primary_position, grad_class, school, community_reputation),
          reactions:community_reactions(user_id, reaction_type)`,
        eq: { post_id: postId, status: 'active', parent_id: comment.id },
        order: 'created_at.asc'
      });
      return { ...comment, replies: replies || [] };
    }));

    // Increment view count (async, don't wait)
    supabaseQuery(env, 'community_posts', 'PATCH', {
      eq: { id: postId },
      body: { views_count: (post.views_count || 0) + 1 }
    });

    return new Response(
      JSON.stringify({
        post: {
          ...post,
          comments: commentsWithReplies
        }
      }),
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

// PATCH - Update post
export async function onRequestPatch(context) {
  const { request, env, params } = context;
  const postId = params.id;

  try {
    const auth = await verifyToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get existing post
    const { data: posts, error: postError } = await supabaseQuery(env, 'community_posts', 'GET', {
      select: '*',
      eq: { id: postId }
    });

    if (postError || !posts || posts.length === 0) {
      return new Response(
        JSON.stringify({ detail: 'Post not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const post = posts[0];
    const isAuthor = post.author_id === (auth.user.sub || auth.user.id);
    const isAdmin = auth.user.role === 'admin' || auth.user.role === 'editor';

    if (!isAuthor && !isAdmin) {
      return new Response(
        JSON.stringify({ detail: 'Not authorized to edit this post' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const updateData = {};

    // Authors can edit title, content, category, tags, attachments
    if (isAuthor) {
      if (body.title !== undefined) updateData.title = body.title;
      if (body.content !== undefined) updateData.content = body.content;
      if (body.category !== undefined) updateData.category = body.category;
      if (body.tags !== undefined) updateData.tags = body.tags;
      if (body.attachments !== undefined) updateData.attachments = body.attachments;
    }

    // Only admins can edit these fields
    if (isAdmin) {
      if (body.is_pinned !== undefined) updateData.is_pinned = body.is_pinned;
      if (body.is_featured !== undefined) updateData.is_featured = body.is_featured;
      if (body.status !== undefined) updateData.status = body.status;
    }

    if (Object.keys(updateData).length === 0) {
      return new Response(
        JSON.stringify({ detail: 'No valid fields to update' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseQuery(env, 'community_posts', 'PATCH', {
      select: '*,author:author_id(id,player_name,primary_position,grad_class,school)',
      eq: { id: postId },
      body: updateData
    });

    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Failed to update post', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, post: data?.[0] }),
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

// DELETE - Delete/hide post (soft delete)
export async function onRequestDelete(context) {
  const { request, env, params } = context;
  const postId = params.id;

  try {
    const auth = await verifyToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get existing post
    const { data: posts, error: postError } = await supabaseQuery(env, 'community_posts', 'GET', {
      select: '*',
      eq: { id: postId }
    });

    if (postError || !posts || posts.length === 0) {
      return new Response(
        JSON.stringify({ detail: 'Post not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const post = posts[0];
    const isAuthor = post.author_id === (auth.user.sub || auth.user.id);
    const isAdmin = auth.user.role === 'admin' || auth.user.role === 'editor';

    if (!isAuthor && !isAdmin) {
      return new Response(
        JSON.stringify({ detail: 'Not authorized to delete this post' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Soft delete by setting status to 'deleted'
    const { error } = await supabaseQuery(env, 'community_posts', 'PATCH', {
      eq: { id: postId },
      body: { status: 'deleted' }
    });

    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Failed to delete post', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update player's post count
    await supabaseQuery(env, 'players', 'PATCH', {
      eq: { id: post.author_id },
      body: { 
        community_posts_count: { decrement: 1 },
        community_reputation: { decrement: 5 }
      }
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Post deleted successfully' }),
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
      'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
