import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Heart, MessageCircle, Share2, MoreHorizontal,
  Send, Loader2, Edit2, Trash2, Flag, Bookmark, ChevronDown,
  CornerDownRight, ThumbsUp, Award
} from 'lucide-react';
import { Button } from '../components/ui/button';
import Navigation from '../components/Navigation';
import { usePlayerAuth } from '../context/PlayerAuthContext';
import { useCommunity } from '../hooks/useCommunity';
import { toast } from 'sonner';

const reactionIcons = {
  like: ThumbsUp,
  love: Heart,
  support: Award,
  insightful: Award,
  celebrate: Award
};

const categoryColors = {
  general: 'bg-gray-500/20 text-gray-300',
  training: 'bg-blue-500/20 text-blue-300',
  recruiting: 'bg-green-500/20 text-green-300',
  game_analysis: 'bg-purple-500/20 text-purple-300',
  motivation: 'bg-orange-500/20 text-orange-300',
  announcements: 'bg-red-500/20 text-red-300',
  q_and_a: 'bg-yellow-500/20 text-yellow-300'
};

const categoryLabels = {
  general: 'General',
  training: 'Training',
  recruiting: 'Recruiting',
  game_analysis: 'Game Analysis',
  motivation: 'Motivation',
  announcements: 'Announcements',
  q_and_a: 'Q&A'
};

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { player, token, isAuthenticated } = usePlayerAuth();
  const community = useCommunity(token);

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [userReactions, setUserReactions] = useState({});
  const [showActions, setShowActions] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch post data
  const fetchPost = useCallback(async () => {
    setLoading(true);
    try {
      const data = await community.fetchPost(postId);
      setPost(data.post);
    } catch (err) {
      toast.error('Failed to load post');
      navigate('/community');
    } finally {
      setLoading(false);
    }
  }, [postId, community, navigate]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  // Fetch user reactions
  useEffect(() => {
    if (!isAuthenticated || !post) return;

    const fetchReactions = async () => {
      try {
        const postIds = [post.id];
        const commentIds = post.comments?.flatMap(c => [c.id, ...(c.replies || []).map(r => r.id)]) || [];
        const data = await community.fetchUserReactions(postIds, commentIds);

        const reactionsMap = {};
        (data.reactions || []).forEach(reaction => {
          if (reaction.post_id) {
            reactionsMap[`post_${reaction.post_id}`] = reaction.reaction_type;
          } else if (reaction.comment_id) {
            reactionsMap[`comment_${reaction.comment_id}`] = reaction.reaction_type;
          }
        });
        setUserReactions(reactionsMap);
      } catch (err) {
        console.error('Failed to fetch reactions:', err);
      }
    };

    fetchReactions();
  }, [post, isAuthenticated, community]);

  const isAuthor = player && post?.author_id === player.id;
  const isAdmin = player?.role === 'admin' || player?.role === 'editor';

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle reaction
  const handleReaction = async (targetId, isComment = false, reactionType = 'like') => {
    if (!isAuthenticated) {
      toast.error('Please login to react');
      return;
    }

    try {
      await community.toggleReaction({
        post_id: isComment ? null : targetId,
        comment_id: isComment ? targetId : null,
        reaction_type: reactionType
      });

      const key = isComment ? `comment_${targetId}` : `post_${targetId}`;
      setUserReactions(prev => ({
        ...prev,
        [key]: prev[key] === reactionType ? null : reactionType
      }));

      if (!isComment && post) {
        const currentReaction = userReactions[key];
        const likesDelta = currentReaction === reactionType ? -1 : (currentReaction ? 0 : 1);
        setPost(prev => ({
          ...prev,
          likes_count: (prev.likes_count || 0) + likesDelta
        }));
      }
    } catch (err) {
      toast.error('Failed to add reaction');
    }
  };

  // Handle add comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    if (!isAuthenticated) {
      toast.error('Please login to comment');
      return;
    }

    setSubmitting(true);
    try {
      await community.createComment({
        post_id: postId,
        content: commentContent.trim()
      });
      setCommentContent('');
      await fetchPost();
      toast.success('Comment added successfully');
    } catch (err) {
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle add reply
  const handleAddReply = async (e, parentId) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    if (!isAuthenticated) {
      toast.error('Please login to reply');
      return;
    }

    setSubmitting(true);
    try {
      await community.createComment({
        post_id: postId,
        content: replyContent.trim(),
        parent_id: parentId
      });
      setReplyContent('');
      setReplyTo(null);
      await fetchPost();
      toast.success('Reply added successfully');
    } catch (err) {
      toast.error('Failed to add reply');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await community.deleteComment(commentId);
      await fetchPost();
      toast.success('Comment deleted');
    } catch (err) {
      toast.error('Failed to delete comment');
    }
  };

  // Handle delete post
  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await community.deletePost(postId);
      toast.success('Post deleted');
      navigate('/community');
    } catch (err) {
      toast.error('Failed to delete post');
    }
  };

  // Handle share
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  // Handle save
  const handleSave = () => {
    setIsSaved(!isSaved);
    toast.success(isSaved ? 'Post unsaved' : 'Post saved');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0b]">
        <Navigation variant="player" user={player} />
        <main className="lg:pl-64 min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#fb6c1d] animate-spin" />
        </main>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#0b0b0b]">
        <Navigation variant="player" user={player} />
        <main className="lg:pl-64 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">Post not found</h2>
            <Button onClick={() => navigate('/community')} variant="outline">
              Back to Community
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      <Navigation variant="player" user={player} />

      <main className="lg:pl-64 min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-[#0b0b0b]/95 backdrop-blur-md border-b border-white/10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/community')}
              className="text-white/60 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Community
            </Button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Post Card */}
          <div className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
            {/* Header */}
            <div className="p-6 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0134bd] to-[#fb6c1d] flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {post.author?.player_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div>
                  <h2 className="font-semibold text-white text-lg">
                    {post.author?.player_name || 'Unknown User'}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-white/50">
                    <span>{post.author?.primary_position}</span>
                    {post.author?.grad_class && (
                      <>
                        <span>•</span>
                        <span>Class of {post.author.grad_class}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${categoryColors[post.category] || categoryColors.general}`}>
                  {categoryLabels[post.category] || 'General'}
                </span>

                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white/50 hover:text-white"
                    onClick={() => setShowActions(!showActions)}
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>

                  {showActions && (
                    <div className="absolute right-0 top-full mt-1 bg-[#242424] rounded-lg border border-white/10 shadow-xl min-w-[160px] z-10">
                      {(isAuthor || isAdmin) && (
                        <>
                          <button
                            onClick={() => { setShowActions(false); }}
                            className="w-full px-4 py-2 text-left text-white/80 hover:bg-white/10 flex items-center gap-2"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => { handleDeletePost(); setShowActions(false); }}
                            className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => { handleSave(); setShowActions(false); }}
                        className="w-full px-4 py-2 text-left text-white/80 hover:bg-white/10 flex items-center gap-2"
                      >
                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#fb6c1d] text-[#fb6c1d]' : ''}`} />
                        {isSaved ? 'Unsave' : 'Save'}
                      </button>
                      <button
                        onClick={() => { handleShare(); setShowActions(false); }}
                        className="w-full px-4 py-2 text-left text-white/80 hover:bg-white/10 flex items-center gap-2"
                      >
                        <Share2 className="w-4 h-4" />
                        Share
                      </button>
                      {!isAuthor && (
                        <button
                          onClick={() => setShowActions(false)}
                          className="w-full px-4 py-2 text-left text-white/80 hover:bg-white/10 flex items-center gap-2"
                        >
                          <Flag className="w-4 h-4" />
                          Report
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="px-6 pb-4 text-2xl font-bold text-white">
              {post.title}
            </h1>

            {/* Content */}
            <div className="px-6 pb-6">
              <p className="text-white/80 whitespace-pre-wrap leading-relaxed">
                {post.content}
              </p>
            </div>

            {/* Attachments */}
            {post.attachments && post.attachments.length > 0 && (
              <div className="px-6 pb-6">
                <div className={`grid gap-4 ${post.attachments.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {post.attachments.map((url, index) => (
                    <div key={index} className="rounded-xl overflow-hidden">
                      <img
                        src={url}
                        alt={`Attachment ${index + 1}`}
                        className="w-full h-auto max-h-96 object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="px-6 pb-6 flex flex-wrap gap-2">
                {post.tags.map((tag, index) => (
                  <span key={index} className="px-3 py-1 bg-white/5 rounded-full text-sm text-white/60">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {Object.entries(reactionIcons).map(([type, Icon]) => {
                    const isActive = userReactions[`post_${post.id}`] === type;
                    return (
                      <button
                        key={type}
                        onClick={() => handleReaction(post.id, false, type)}
                        className={`p-2 rounded-lg transition-all ${
                          isActive
                            ? 'bg-[#fb6c1d]/20 text-[#fb6c1d]'
                            : 'text-white/50 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? 'fill-current' : ''}`} />
                      </button>
                    );
                  })}
                  {post.likes_count > 0 && (
                    <span className="text-white/60 ml-1">{post.likes_count}</span>
                  )}
                </div>

                <span className="text-white/40 text-sm">
                  {post.views_count || 0} views
                </span>
              </div>

              {post.is_featured && (
                <span className="px-3 py-1 bg-[#fb6c1d]/20 text-[#fb6c1d] rounded-full text-sm font-medium">
                  Featured Post
                </span>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="mt-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Comments ({post.comments?.length || 0})
            </h3>

            {/* Add Comment */}
            {isAuthenticated && (
              <form onSubmit={handleAddComment} className="mb-8">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0134bd] to-[#fb6c1d] flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">
                      {player?.player_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      placeholder="Add a comment..."
                      rows={3}
                      className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#fb6c1d] resize-none"
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        type="submit"
                        disabled={!commentContent.trim() || submitting}
                        className="bg-gradient-to-r from-[#0134bd] to-[#012aa3] text-white"
                      >
                        {submitting ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Comment
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* Comments List */}
            <div className="space-y-6">
              {post.comments?.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/50">No comments yet. Be the first to comment!</p>
                </div>
              ) : (
                post.comments?.map(comment => (
                  <div key={comment.id} className="bg-[#1a1a1a] rounded-xl p-4 border border-white/10">
                    {/* Comment Header */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0134bd] to-[#fb6c1d] flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-xs">
                          {comment.author?.player_name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-white">
                            {comment.author?.player_name || 'Unknown User'}
                          </span>
                          <span className="text-xs text-white/40">
                            {formatDate(comment.created_at)}
                          </span>
                          {comment.is_accepted_answer && (
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                              Accepted Answer
                            </span>
                          )}
                        </div>
                        <p className="text-white/80">{comment.content}</p>

                        {/* Comment Actions */}
                        <div className="flex items-center gap-4 mt-3">
                          <button
                            onClick={() => handleReaction(comment.id, true, 'like')}
                            className={`flex items-center gap-1 text-sm ${
                              userReactions[`comment_${comment.id}`]
                                ? 'text-[#fb6c1d]'
                                : 'text-white/50 hover:text-white'
                            }`}
                          >
                            <ThumbsUp className={`w-4 h-4 ${userReactions[`comment_${comment.id}`] ? 'fill-current' : ''}`} />
                            {comment.likes_count || 0}
                          </button>
                          <button
                            onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                            className="text-sm text-white/50 hover:text-white"
                          >
                            Reply
                          </button>
                          {(comment.author_id === player?.id || isAdmin) && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-sm text-red-400 hover:text-red-300"
                            >
                              Delete
                            </button>
                          )}
                        </div>

                        {/* Reply Form */}
                        {replyTo === comment.id && (
                          <form
                            onSubmit={(e) => handleAddReply(e, comment.id)}
                            className="mt-4 flex gap-3"
                          >
                            <CornerDownRight className="w-5 h-5 text-white/40 mt-2" />
                            <div className="flex-1">
                              <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Write a reply..."
                                rows={2}
                                className="w-full px-3 py-2 bg-[#0b0b0b] border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[#fb6c1d] resize-none text-sm"
                              />
                              <div className="flex justify-end gap-2 mt-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setReplyTo(null)}
                                  className="text-white/60"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="submit"
                                  size="sm"
                                  disabled={!replyContent.trim() || submitting}
                                  className="bg-gradient-to-r from-[#0134bd] to-[#012aa3] text-white"
                                >
                                  Reply
                                </Button>
                              </div>
                            </div>
                          </form>
                        )}

                        {/* Replies */}
                        {comment.replies?.length > 0 && (
                          <div className="mt-4 space-y-3 border-l-2 border-white/10 pl-4">
                            {comment.replies.map(reply => (
                              <div key={reply.id} className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#0134bd] to-[#fb6c1d] flex items-center justify-center flex-shrink-0">
                                  <span className="text-white font-bold text-xs">
                                    {reply.author?.player_name?.charAt(0) || 'U'}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-white text-sm">
                                      {reply.author?.player_name || 'Unknown User'}
                                    </span>
                                    <span className="text-xs text-white/40">
                                      {formatDate(reply.created_at)}
                                    </span>
                                  </div>
                                  <p className="text-white/70 text-sm">{reply.content}</p>
                                  <button
                                    onClick={() => handleReaction(reply.id, true, 'like')}
                                    className={`flex items-center gap-1 text-xs mt-2 ${
                                      userReactions[`comment_${reply.id}`]
                                        ? 'text-[#fb6c1d]'
                                        : 'text-white/40 hover:text-white/60'
                                    }`}
                                  >
                                    <ThumbsUp className={`w-3 h-3 ${userReactions[`comment_${reply.id}`] ? 'fill-current' : ''}`} />
                                    {reply.likes_count || 0}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PostDetail;
