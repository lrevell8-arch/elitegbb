import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, TrendingUp, Clock, MessageSquare, Filter,
  Flame, Award, ChevronDown, Loader2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import Navigation from '../components/Navigation';
import CommunityPostCard from '../components/CommunityPostCard';
import CreatePostModal from '../components/CreatePostModal';
import { usePlayerAuth } from '../context/PlayerAuthContext';
import { useCommunity } from '../hooks/useCommunity';
import { toast } from 'sonner';

const categories = [
  { value: 'all', label: 'All Posts', icon: MessageSquare },
  { value: 'general', label: 'General', icon: MessageSquare },
  { value: 'training', label: 'Training', icon: Award },
  { value: 'recruiting', label: 'Recruiting', icon: TrendingUp },
  { value: 'game_analysis', label: 'Game Analysis', icon: Filter },
  { value: 'motivation', label: 'Motivation', icon: Flame },
  { value: 'q_and_a', label: 'Q&A', icon: MessageSquare },
  { value: 'announcements', label: 'Announcements', icon: Award }
];

const sortOptions = [
  { value: 'last_activity', label: 'Most Active' },
  { value: 'created', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' }
];

const CommunityFeed = () => {
  const navigate = useNavigate();
  const { player, token, isAuthenticated } = usePlayerAuth();
  const community = useCommunity(token);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState('last_activity');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [userReactions, setUserReactions] = useState({});
  const [savedPosts, setSavedPosts] = useState(new Set());
  const [pinnedPosts, setPinnedPosts] = useState([]);

  const limit = 20;

  // Fetch posts
  const fetchPosts = useCallback(async (reset = false) => {
    if (!reset && loading) return;

    setLoading(true);
    try {
      const newOffset = reset ? 0 : offset;
      const data = await community.fetchPosts({
        category: selectedCategory === 'all' ? null : selectedCategory,
        search: searchQuery || null,
        sortBy: selectedSort,
        limit,
        offset: newOffset
      });

      if (reset) {
        setPosts(data.posts || []);
        setOffset(limit);
      } else {
        setPosts(prev => [...prev, ...(data.posts || [])]);
        setOffset(newOffset + limit);
      }

      setHasMore(data.has_more || false);

      // Separate pinned posts
      const pinned = (data.posts || []).filter(p => p.is_pinned);
      setPinnedPosts(pinned);
    } catch (err) {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [community, selectedCategory, selectedSort, searchQuery, offset, loading]);

  // Initial load
  useEffect(() => {
    fetchPosts(true);
  }, [selectedCategory, selectedSort]);

  // Fetch user reactions
  useEffect(() => {
    if (!isAuthenticated || posts.length === 0) return;

    const fetchReactions = async () => {
      try {
        const postIds = posts.map(p => p.id);
        const data = await community.fetchUserReactions(postIds);

        const reactionsMap = {};
        (data.reactions || []).forEach(reaction => {
          if (reaction.post_id) {
            reactionsMap[reaction.post_id] = reaction.reaction_type;
          }
        });
        setUserReactions(reactionsMap);
      } catch (err) {
        console.error('Failed to fetch reactions:', err);
      }
    };

    fetchReactions();
  }, [posts, isAuthenticated, community]);

  // Handle create post
  const handleCreatePost = async (postData) => {
    await community.createPost(postData);
    await fetchPosts(true);
  };

  // Handle reaction
  const handleReaction = async (postId, commentId, reactionType) => {
    if (!isAuthenticated) {
      toast.error('Please login to react');
      return;
    }

    try {
      await community.toggleReaction({
        post_id: commentId ? null : postId,
        comment_id: commentId,
        reaction_type: reactionType
      });

      // Update local state
      if (!commentId) {
        setUserReactions(prev => ({
          ...prev,
          [postId]: prev[postId] === reactionType ? null : reactionType
        }));

        // Update post likes count
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            const currentReaction = userReactions[postId];
            const likesDelta = currentReaction === reactionType ? -1 : (currentReaction ? 0 : 1);
            return {
              ...post,
              likes_count: (post.likes_count || 0) + likesDelta
            };
          }
          return post;
        }));
      }
    } catch (err) {
      toast.error('Failed to add reaction');
    }
  };

  // Handle delete post
  const handleDeletePost = async (postId) => {
    try {
      await community.deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      throw err;
    }
  };

  // Handle save post
  const handleSavePost = (postId) => {
    setSavedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
        toast.success('Post unsaved');
      } else {
        newSet.add(postId);
        toast.success('Post saved');
      }
      return newSet;
    });
  };

  // Load more posts
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchPosts(false);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchPosts(true);
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      <Navigation variant="player" user={player} />

      {/* Main Content */}
      <main className="lg:pl-64 min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-[#0b0b0b]/95 backdrop-blur-md border-b border-white/10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-white">Community</h1>
              <Button
                onClick={() => {
                  if (!isAuthenticated) {
                    toast.error('Please login to create a post');
                    navigate('/player/login');
                    return;
                  }
                  setIsCreateModalOpen(true);
                }}
                className="bg-gradient-to-r from-[#0134bd] to-[#012aa3] hover:from-[#012aa3] hover:to-[#0134bd] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Post
              </Button>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search posts..."
                    className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[#fb6c1d]"
                  />
                </div>
              </form>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value)}
                  className="appearance-none w-full sm:w-40 px-4 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#fb6c1d] cursor-pointer"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat.value
                      ? 'bg-[#0134bd] text-white'
                      : 'bg-[#1a1a1a] text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <cat.icon className="w-4 h-4" />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feed */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Pinned Posts */}
          {pinnedPosts.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4 text-[#fb6c1d]">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">Pinned Posts</span>
              </div>
              {pinnedPosts.map(post => (
                <CommunityPostCard
                  key={post.id}
                  post={post}
                  currentUser={player}
                  userReaction={userReactions[post.id]}
                  onReaction={handleReaction}
                  onDelete={handleDeletePost}
                  onEdit={() => {}}
                  onSave={handleSavePost}
                  isSaved={savedPosts.has(post.id)}
                />
              ))}
            </div>
          )}

          {/* Posts List */}
          {loading && posts.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#fb6c1d] animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No posts yet</h3>
              <p className="text-white/50 mb-4">Be the first to start a conversation!</p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-gradient-to-r from-[#0134bd] to-[#012aa3] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Post
              </Button>
            </div>
          ) : (
            <>
              {posts.filter(p => !p.is_pinned).map(post => (
                <CommunityPostCard
                  key={post.id}
                  post={post}
                  currentUser={player}
                  userReaction={userReactions[post.id]}
                  onReaction={handleReaction}
                  onDelete={handleDeletePost}
                  onEdit={() => {}}
                  onSave={handleSavePost}
                  isSaved={savedPosts.has(post.id)}
                />
              ))}

              {/* Load More */}
              {hasMore && (
                <div className="flex justify-center py-6">
                  <Button
                    onClick={loadMore}
                    disabled={loading}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreatePost}
      />
    </div>
  );
};

export default CommunityFeed;
