// Community Reactions API (Likes, Love, Support, etc.)
// POST /api/community/reactions - Add/Remove reaction
// GET /api/community/reactions - Get user's reactions

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
  if (params.and) queryParams.append('and', params.and);

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

// POST - Toggle reaction (add if not exists, remove if exists)
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
    const userId = auth.user.sub || auth.user.id;

    // Validation
    if (!body.post_id && !body.comment_id) {
      return new Response(
        JSON.stringify({ detail: 'Either post_id or comment_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (body.post_id && body.comment_id) {
      return new Response(
        JSON.stringify({ detail: 'Cannot react to both post and comment simultaneously' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Valid reaction types
    const validReactions = ['like', 'love', 'support', 'insightful', 'celebrate'];
    const reactionType = body.reaction_type || 'like';
    
    if (!validReactions.includes(reactionType)) {
      return new Response(
        JSON.stringify({ detail: 'Invalid reaction type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if reaction already exists
    const existingParams = {
      user_id: userId,
      reaction_type: reactionType
    };
    
    if (body.post_id) {
      existingParams.post_id = body.post_id;
    } else {
      existingParams.comment_id = body.comment_id;
    }

    const { data: existingReactions, error: checkError } = await supabaseQuery(env, 'community_reactions', 'GET', {
      select: 'id',
      eq: existingParams
    });

    if (checkError) {
      return new Response(
        JSON.stringify({ detail: 'Failed to check existing reaction', error: checkError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // If reaction exists, remove it (toggle off)
    if (existingReactions && existingReactions.length > 0) {
      const reactionId = existingReactions[0].id;
      
      const { error: deleteError } = await supabaseQuery(env, 'community_reactions', 'DELETE', {
        eq: { id: reactionId }
      });

      if (deleteError) {
        return new Response(
          JSON.stringify({ detail: 'Failed to remove reaction', error: deleteError.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Update author reputation (-1 for removed like)
      const targetId = body.post_id || body.comment_id;
      const targetTable = body.post_id ? 'community_posts' : 'community_comments';
      const targetField = body.post_id ? 'post_id' : 'comment_id';
      
      const { data: targetItems } = await supabaseQuery(env, targetTable, 'GET', {
        select: 'author_id',
        eq: { id: targetId }
      });
      
      if (targetItems && targetItems[0]) {
        await supabaseQuery(env, 'players', 'PATCH', {
          eq: { id: targetItems[0].author_id },
          body: { community_reputation: { decrement: 1 } }
        });
      }

      return new Response(
        JSON.stringify({ success: true, action: 'removed', reaction_type: reactionType }),
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );
    }

    // Check if user has any other reaction on this target (should only have one)
    const otherReactionParams = {
      user_id: userId
    };
    if (body.post_id) {
      otherReactionParams.post_id = body.post_id;
    } else {
      otherReactionParams.comment_id = body.comment_id;
    }

    const { data: otherReactions } = await supabaseQuery(env, 'community_reactions', 'GET', {
      select: 'id',
      eq: otherReactionParams
    });

    // Remove other reactions if switching types
    if (otherReactions && otherReactions.length > 0) {
      for (const reaction of otherReactions) {
        await supabaseQuery(env, 'community_reactions', 'DELETE', {
          eq: { id: reaction.id }
        });
      }
    }

    // Create new reaction
    const reactionData = {
      user_id: userId,
      reaction_type: reactionType
    };
    
    if (body.post_id) {
      reactionData.post_id = body.post_id;
    } else {
      reactionData.comment_id = body.comment_id;
    }

    const { data, error } = await supabaseQuery(env, 'community_reactions', 'POST', {
      body: reactionData,
      select: '*'
    });

    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Failed to create reaction', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update author reputation (+1 for new like)
    const targetId = body.post_id || body.comment_id;
    const targetTable = body.post_id ? 'community_posts' : 'community_comments';
    
    const { data: targetItems } = await supabaseQuery(env, targetTable, 'GET', {
      select: 'author_id',
      eq: { id: targetId }
    });
    
    if (targetItems && targetItems[0]) {
      await supabaseQuery(env, 'players', 'PATCH', {
        eq: { id: targetItems[0].author_id },
        body: { community_reputation: { increment: 1 } }
      });
    }

    return new Response(
      JSON.stringify({ success: true, action: 'added', reaction: data?.[0] }),
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

// GET - Get user's reactions
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  try {
    const auth = await verifyPlayerToken(request, env);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ detail: auth.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const postIds = url.searchParams.get('post_ids');
    const commentIds = url.searchParams.get('comment_ids');

    let params = {
      select: '*',
      eq: { user_id: auth.user.sub || auth.user.id }
    };

    // Filter by specific posts
    if (postIds) {
      const ids = postIds.split(',');
      if (ids.length === 1) {
        params.eq.post_id = ids[0];
      } else {
        params.in = { post_id: ids };
      }
    }

    // Filter by specific comments
    if (commentIds) {
      const ids = commentIds.split(',');
      if (ids.length === 1) {
        params.eq.comment_id = ids[0];
      } else {
        params.in = { comment_id: ids };
      }
    }

    const { data, error } = await supabaseQuery(env, 'community_reactions', 'GET', params);

    if (error) {
      return new Response(
        JSON.stringify({ detail: 'Failed to fetch reactions', error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ reactions: data || [] }),
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
