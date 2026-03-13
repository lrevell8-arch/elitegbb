import { useState, useRef } from 'react';
import {
  X, Image, Link2, Hash, Send, Loader2
} from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

const categories = [
  { value: 'general', label: 'General', color: 'bg-gray-500' },
  { value: 'training', label: 'Training', color: 'bg-blue-500' },
  { value: 'recruiting', label: 'Recruiting', color: 'bg-green-500' },
  { value: 'game_analysis', label: 'Game Analysis', color: 'bg-purple-500' },
  { value: 'motivation', label: 'Motivation', color: 'bg-orange-500' },
  { value: 'q_and_a', label: 'Q&A', color: 'bg-yellow-500' }
];

const CreatePostModal = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (title.trim().length < 5) {
      toast.error('Title must be at least 5 characters');
      return;
    }

    if (content.trim().length < 10) {
      toast.error('Content must be at least 10 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        category,
        tags,
        attachments
      });

      // Reset form
      setTitle('');
      setContent('');
      setCategory('general');
      setTags([]);
      setAttachments([]);
      onClose();
      toast.success('Post created successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (tags.length >= 5) {
        toast.error('Maximum 5 tags allowed');
        return;
      }
      if (!tags.includes(tagInput.trim().toLowerCase())) {
        setTags([...tags, tagInput.trim().toLowerCase()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (attachments.length + files.length > 4) {
      toast.error('Maximum 4 attachments allowed');
      return;
    }

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachments(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={!isSubmitting ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-[#1a1a1a] rounded-2xl border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-white">Create Post</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    category === cat.value
                      ? `${cat.color} text-white`
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's on your mind?"
              maxLength={200}
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-[#0b0b0b] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#fb6c1d] transition-colors disabled:opacity-50"
            />
            <div className="mt-1 text-right text-xs text-white/40">
              {title.length}/200
            </div>
          </div>

          {/* Content Input */}
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, ask questions, or start a discussion..."
              rows={6}
              maxLength={10000}
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-[#0b0b0b] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#fb6c1d] transition-colors resize-none disabled:opacity-50"
            />
            <div className="mt-1 text-right text-xs text-white/40">
              {content.length}/10000
            </div>
          </div>

          {/* Tags Input */}
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              Tags <span className="text-white/30">(press Enter to add, max 5)</span>
            </label>
            <div className="flex flex-wrap gap-2 p-3 bg-[#0b0b0b] border border-white/10 rounded-xl">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-[#0134bd]/30 text-white rounded text-sm flex items-center gap-1"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    disabled={isSubmitting}
                    className="hover:text-red-400 disabled:opacity-50"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder={tags.length === 0 ? "Add tags..." : ""}
                disabled={isSubmitting || tags.length >= 5}
                className="flex-1 min-w-[100px] bg-transparent text-white placeholder:text-white/30 focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Attachments
              </label>
              <div className="grid grid-cols-2 gap-2">
                {attachments.map((url, index) => (
                  <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
                    <img
                      src={url}
                      alt={`Attachment ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      disabled={isSubmitting}
                      className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-red-500/50 transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting || attachments.length >= 4}
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                <Image className="w-5 h-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={isSubmitting}
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                <Link2 className="w-5 h-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={isSubmitting}
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                <Hash className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSubmitting}
                className="text-white/60 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || title.length < 5 || content.length < 10}
                className="bg-gradient-to-r from-[#0134bd] to-[#012aa3] hover:from-[#012aa3] hover:to-[#0134bd] text-white px-6"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Post
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;
