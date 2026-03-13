// Community Posts API
// GET /api/community/posts - List posts with filtering
// POST /api/community/posts - Create new post

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
  if (params.neq) {
    Object.entries(params.neq).forEach(([key, value]) => {
      queryParams.append(key, `neq.${value}`);
    });
  }
  if (params.order) queryParams.append('order', params.order);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.offset) queryParams.append('offset', params.offset);
  if (params.or) queryParams.append('or', params.or);
  if (params.in) {
    Object.entries(params.in).forEach(([key, value]) => {
      queryParams.append(key, `in.(${value.join(',')})`);
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

// GET - List posts
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  try {
    const category = url.searchParams.get('category');
    const authorId = url.searchParams.get('author_id');
    const search = url.searchParams.get('search');
    const sortBy = url.searchParams.get('sort_by') || 'last_activity'; // created, activity, popular
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const offset = parseInt(url.searchParams.get('offset')) || 0;

    // Build select with author info
    const select = `*,
      author:author_id(id, player_name, primary_position, grad_class, school),
      reactions:community_reactions(user_id, reaction_type)`;

    const params = {
      select,
      eq: { status: 'active' },
      order: sortBy === 'created' ? 'created_at.desc' : 
             sortBy === 'popular' ? 'likes_count.desc' : 
             'last_activity_at.desc',
      limit,
      offset
    };

    // Add category filter
    if (category && category !== 'all') {
      params.eq.category = category;
    }

    // Add author filter
    if (authorId) {
      params.eq.author_id = authorId;
    }

    // Add search filter (if search param exists, we'll filter client-side for simplicity)

    const { data: posts, error } = await supabaseQuery(env, 'community_posts', 'GET', params);

    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Failed to fetch posts', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get total count
    const { data: countData, error: countError } = await supabaseQuery(env, 'community_posts', 'GET', {
      select: 'count',
      eq: { status: 'active', ...(category && category !== 'all' && { category }) }
    });

    const totalCount = countData ? countData.length : 0;

    // Filter by search if provided
    let filteredPosts = posts || [];
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPosts = filteredPosts.filter(post => 
        post.title?.toLowerCase().includes(searchLower) ||
        post.content?.toLowerCase().includes(searchLower) ||
        post.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    return new Response(
      JSON.stringify({
        posts: filteredPosts,
        total: totalCount,
        limit,
        offset,
        has_more: offset + filteredPosts.length < totalCount
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

// POST - Create new post
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
    if (!body.title || !body.content) {
      return new Response(
        JSON.stringify({ detail: 'Title and content are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (body.title.length < 5 || body.title.length > 200) {
      return new Response(
        JSON.stringify({ detail: 'Title must be between 5 and 200 characters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (body.content.length < 10 || body.content.length > 10000) {
      return new Response(
        JSON.stringify({ detail: 'Content must be between 10 and 10000 characters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Valid categories
    const validCategories = ['general', 'training', 'recruiting', 'game_analysis', 'motivation', 'announcements', 'q_and_a'];
    if (body.category && !validCategories.includes(body.category)) {
      return new Response(
        JSON.stringify({ detail: 'Invalid category' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const postData = {
      author_id: auth.user.sub || auth.user.id,
      title: body.title,
      content: body.content,
      category: body.category || 'general',
      tags: body.tags || [],
      attachments: body.attachments || [],
      status: 'active'
    };

    const { data, error } = await supabaseQuery(env, 'community_posts', 'POST', {
      body: postData,
      select: '*,author:author_id(id,player_name,primary_position,grad_class,school)'
    });

    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Failed to create post', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update player's post count
    await supabaseQuery(env, 'players', 'PATCH', {
      eq: { id: auth.user.sub || auth.user.id },
      body: { 
        community_posts_count: { increment: 1 },
        community_reputation: { increment: 5 } // +5 rep for creating post
      }
    });

    return new Response(
      JSON.stringify({ success: true, post: data?.[0] }),
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
