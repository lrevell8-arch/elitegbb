import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle, Heart, ThumbsUp, Award, Bookmark,
  MoreHorizontal, Share2, Flag, Edit2, Trash2, Pin
} from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

const reactionIcons = {
  like: ThumbsUp,
  love: Heart,
  support: Award,
  insightful: Award,
  celebrate: Award
};

const reactionLabels = {
  like: 'Like',
  love: 'Love',
  support: 'Support',
  insightful: 'Insightful',
  celebrate: 'Celebrate'
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

const CommunityPostCard = ({
  post,
  currentUser,
  userReaction,
  onReaction,
  onDelete,
  onEdit,
  onSave,
  isSaved,
  compact = false
}) => {
  const [showActions, setShowActions] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const isAuthor = currentUser && post.author_id === currentUser.id;
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'editor';

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const handleReaction = async (reactionType) => {
    try {
      await onReaction(post.id, null, reactionType);
    } catch (err) {
      toast.error('Failed to add reaction');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await onDelete(post.id);
        toast.success('Post deleted successfully');
      } catch (err) {
        toast.error('Failed to delete post');
      }
    }
    setShowActions(false);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/community/post/${post.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  return (
    <div className={`bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden transition-all hover:border-white/20 ${compact ? 'mb-4' : 'mb-6'}`}>
      {/* Header */}
      <div className="p-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0134bd] to-[#fb6c1d] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">
              {post.author?.player_name?.charAt(0) || 'U'}
            </span>
          </div>
          <div>
            <h3 className="font-medium text-white">
              {post.author?.player_name || 'Unknown User'}
            </h3>
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
          {/* Category Badge */}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[post.category] || categoryColors.general}`}>
            {categoryLabels[post.category] || 'General'}
          </span>

          {/* Pinned Badge */}
          {post.is_pinned && (
            <Pin className="w-4 h-4 text-[#fb6c1d]" />
          )}

          {/* Actions Menu */}
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
                      onClick={() => { onEdit(post); setShowActions(false); }}
                      className="w-full px-4 py-2 text-left text-white/80 hover:bg-white/10 flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </>
                )}
                <button
                  onClick={() => { onSave(post.id); setShowActions(false); }}
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
      <Link to={`/community/post/${post.id}`}>
        <h2 className="px-4 pb-3 text-lg font-semibold text-white hover:text-[#fb6c1d] transition-colors">
          {post.title}
        </h2>
      </Link>

      {/* Content */}
      <div className="px-4 pb-4">
        <p className="text-white/80 whitespace-pre-wrap line-clamp-4">
          {post.content}
        </p>
      </div>

      {/* Attachments */}
      {post.attachments && post.attachments.length > 0 && (
        <div className="px-4 pb-4">
          <div className={`grid gap-2 ${post.attachments.length === 1 ? 'grid-cols-1' : post.attachments.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {post.attachments.map((url, index) => (
              <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-[#0b0b0b]">
                {!imageLoaded && (
                  <div className="absolute inset-0 animate-pulse bg-white/5" />
                )}
                <img
                  src={url}
                  alt={`Attachment ${index + 1}`}
                  className="w-full h-full object-cover"
                  onLoad={() => setImageLoaded(true)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="px-4 pb-4 flex flex-wrap gap-2">
          {post.tags.map((tag, index) => (
            <span key={index} className="px-2 py-1 bg-white/5 rounded text-xs text-white/60">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Reaction Buttons */}
          <div className="flex items-center gap-1">
            {Object.entries(reactionIcons).map(([type, Icon]) => {
              const isActive = userReaction === type;
              return (
                <button
                  key={type}
                  onClick={() => handleReaction(type)}
                  className={`p-2 rounded-lg transition-all ${
                    isActive
                      ? 'bg-[#fb6c1d]/20 text-[#fb6c1d]'
                      : 'text-white/50 hover:bg-white/10 hover:text-white'
                  }`}
                  title={reactionLabels[type]}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'fill-current' : ''}`} />
                </button>
              );
            })}
            {post.likes_count > 0 && (
              <span className="text-sm text-white/60 ml-1">
                {post.likes_count}
              </span>
            )}
          </div>

          {/* Comments */}
          <Link
            to={`/community/post/${post.id}`}
            className="flex items-center gap-1 text-white/50 hover:text-white transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">{post.comments_count || 0}</span>
          </Link>

          {/* Views */}
          <span className="text-sm text-white/40">
            {post.views_count || 0} views
          </span>
        </div>

        {/* Featured Badge */}
        {post.is_featured && (
          <span className="px-2 py-1 bg-[#fb6c1d]/20 text-[#fb6c1d] rounded text-xs font-medium">
            Featured
          </span>
        )}
      </div>
    </div>
  );
};

export default CommunityPostCard;
