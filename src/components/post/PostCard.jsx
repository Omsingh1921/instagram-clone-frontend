import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Flag,
  Copy,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import CommentsModal from '../modals/CommentsModal';
import ReportModal from '../modals/ReportModal';
import engagementService from '../../services/engagement.service';
import postService from '../../services/post.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { timeAgo, formatCount } from '../../utils';
import './PostCard.css';

export const PostCard = ({ post, onPostDeleted, onPostUpdated }) => {
  const [currentMediaIdx, setCurrentMediaIdx] = useState(0);
  const [isLiked, setIsLiked] = useState(post.likedByCurrentUser || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [isSaved, setIsSaved] = useState(post.savedByCurrentUser || false);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [quickComment, setQuickComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const isAuthor = currentUser?.id === post.author?.id;
  const mediaList = post.media || [];
  const currentMedia = mediaList[currentMediaIdx] || mediaList[0];

  const handleLike = async () => {
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikeCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      await engagementService.toggleLike(post.id);
      if (onPostUpdated) onPostUpdated();
    } catch {
      setIsLiked(!nextState);
      setLikeCount((prev) => (!nextState ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  const handleDoubleTap = () => {
    setShowHeartAnim(true);
    setTimeout(() => setShowHeartAnim(false), 900);
    if (!isLiked) {
      handleLike();
    }
  };

  const handleSave = async () => {
    const nextState = !isSaved;
    setIsSaved(nextState);
    try {
      await engagementService.toggleSave(post.id);
      if (onPostUpdated) onPostUpdated();
    } catch {
      setIsSaved(!nextState);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await postService.deletePost(post.id);
      showSuccess('Post deleted successfully');
      setMenuOpen(false);
      if (onPostDeleted) onPostDeleted(post.id);
    } catch (err) {
      showError(err.message || 'Failed to delete post');
    }
  };

  const handleCopyLink = () => {
    const postUrl = `${window.location.origin}/posts/${post.id}`;
    navigator.clipboard.writeText(postUrl);
    showSuccess('Link copied to clipboard!');
    setMenuOpen(false);
  };

  const handleQuickCommentSubmit = async (e) => {
    e.preventDefault();
    if (!quickComment.trim()) return;

    try {
      setSubmittingComment(true);
      await engagementService.addComment(post.id, { text: quickComment.trim() });
      setCommentCount((prev) => prev + 1);
      setQuickComment('');
      showSuccess('Comment posted');
      if (onPostUpdated) onPostUpdated();
    } catch (err) {
      showError(err.message || 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <>
      <article className="post-card">
        {/* Header */}
        <header className="post-card-header">
          <div
            className="post-author-link"
            onClick={() => navigate(`/profile/${post.author?.id}`)}
          >
            <Avatar
              src={(post.author?.avatarUrl || post.author?.profilePictureUrl)}
              alt={post.author?.username}
              size="sm"
            />
            <div className="post-author-meta">
              <span className="post-author-username">{post.author?.username}</span>
              <span className="post-header-dot">?</span>
              <span className="post-time-ago">{timeAgo(post.createdAt)}</span>
            </div>
          </div>

          <button
            type="button"
            className="post-options-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Post options"
          >
            <MoreHorizontal size={18} />
          </button>

          {menuOpen && (
            <div className="post-options-menu">
              <button type="button" className="post-menu-item" onClick={handleCopyLink}>
                <Copy size={14} />
                <span>Copy link</span>
              </button>
              {isAuthor ? (
                <button
                  type="button"
                  className="post-menu-item danger"
                  onClick={handleDeletePost}
                >
                  <Trash2 size={14} />
                  <span>Delete post</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="post-menu-item danger"
                  onClick={() => {
                    setMenuOpen(false);
                    setReportModalOpen(true);
                  }}
                >
                  <Flag size={14} />
                  <span>Report post</span>
                </button>
              )}
            </div>
          )}
        </header>

        {/* Media Container */}
        <div className="post-media-container" onDoubleClick={handleDoubleTap}>
          {currentMedia?.mediaType === 'VIDEO' ? (
            <video
              src={currentMedia.mediaUrl}
              controls
              className="post-media-item"
            />
          ) : currentMedia?.mediaUrl ? (
            <img
              src={currentMedia.mediaUrl}
              alt={post.caption || 'Post'}
              className="post-media-item"
              loading="lazy"
            />
          ) : (
            <div className="dialog-media-empty">No media</div>
          )}

          {/* Double-click Heart Animation */}
          {showHeartAnim && (
            <Heart size={80} className="double-click-heart" fill="#fff" />
          )}

          {/* Carousel Arrows */}
          {mediaList.length > 1 && (
            <>
              {currentMediaIdx > 0 && (
                <button
                  type="button"
                  className="carousel-btn prev"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentMediaIdx((prev) => prev - 1);
                  }}
                  aria-label="Previous photo"
                >
                  <ChevronLeft size={18} />
                </button>
              )}
              {currentMediaIdx < mediaList.length - 1 && (
                <button
                  type="button"
                  className="carousel-btn next"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentMediaIdx((prev) => prev + 1);
                  }}
                  aria-label="Next photo"
                >
                  <ChevronRight size={18} />
                </button>
              )}
              <div className="carousel-dots">
                {mediaList.map((_, idx) => (
                  <div
                    key={idx}
                    className={`carousel-dot ${idx === currentMediaIdx ? 'active' : ''}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Action Bar */}
        <div className="post-card-actions">
          <div className="post-actions-left">
            <button
              type="button"
              className={`post-action-btn ${isLiked ? 'liked' : ''}`}
              onClick={handleLike}
              aria-label={isLiked ? 'Unlike' : 'Like'}
            >
              <Heart size={24} fill={isLiked ? 'var(--color-error)' : 'none'} />
            </button>
            <button
              type="button"
              className="post-action-btn"
              onClick={() => setCommentsModalOpen(true)}
              aria-label="Comment"
            >
              <MessageCircle size={24} />
            </button>
            <button
              type="button"
              className="post-action-btn"
              onClick={handleCopyLink}
              aria-label="Share"
            >
              <Send size={22} />
            </button>
          </div>

          <button
            type="button"
            className="post-action-btn"
            onClick={handleSave}
            aria-label={isSaved ? 'Unsave' : 'Save'}
          >
            <Bookmark size={24} fill={isSaved ? 'var(--text-primary)' : 'none'} />
          </button>
        </div>

        {/* Likes Count */}
        <div className="post-likes-section">
          <span className="post-likes-count">
            {formatCount(likeCount)} {likeCount === 1 ? 'like' : 'likes'}
          </span>
        </div>

        {/* Caption */}
        {post.caption && (
          <div className="post-caption-section">
            <span
              className="caption-author"
              onClick={() => navigate(`/profile/${post.author?.id}`)}
              style={{ cursor: 'pointer' }}
            >
              {post.author?.username}
            </span>
            <span>
              {isExpanded || post.caption.length <= 90
                ? post.caption
                : `${post.caption.slice(0, 90)}...`}
            </span>
            {post.caption.length > 90 && !isExpanded && (
              <button
                type="button"
                className="caption-more-btn"
                onClick={() => setIsExpanded(true)}
              >
                more
              </button>
            )}
          </div>
        )}

        {/* Comments Link */}
        {commentCount > 0 && (
          <div className="post-comments-summary">
            <button
              type="button"
              className="view-all-comments-btn"
              onClick={() => setCommentsModalOpen(true)}
            >
              View all {formatCount(commentCount)} comments
            </button>
          </div>
        )}

        {/* Quick Comment Field */}
        <form onSubmit={handleQuickCommentSubmit} className="post-quick-comment-form">
          <input
            type="text"
            className="quick-comment-input"
            placeholder="Add a comment..."
            value={quickComment}
            onChange={(e) => setQuickComment(e.target.value)}
            maxLength={500}
          />
          <button
            type="submit"
            className="quick-comment-submit"
            disabled={!quickComment.trim() || submittingComment}
          >
            Post
          </button>
        </form>
      </article>

      {/* Modals */}
      {commentsModalOpen && (
        <CommentsModal
          isOpen={commentsModalOpen}
          onClose={() => setCommentsModalOpen(false)}
          postId={post.id}
          onPostUpdated={onPostUpdated}
        />
      )}

      {reportModalOpen && (
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          targetType="POST"
          targetId={post.id}
        />
      )}
    </>
  );
};

export default PostCard;
