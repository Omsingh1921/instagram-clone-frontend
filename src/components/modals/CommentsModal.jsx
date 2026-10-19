import React, { useState, useEffect, useRef } from 'react';
import { Heart, Bookmark, Send, Trash2, MessageSquare, MoreHorizontal } from 'lucide-react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import LoadingSpinner from '../common/LoadingSpinner';
import ReportModal from './ReportModal';
import postService from '../../services/post.service';
import engagementService from '../../services/engagement.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { timeAgo, formatCount } from '../../utils';
import './CommentsModal.css';

export const CommentsModal = ({ isOpen, onClose, postId, onPostUpdated }) => {
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [repliesMap, setRepliesMap] = useState({});

  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const commentsEndRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !postId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const [postRes, commentsRes] = await Promise.all([
          postService.getPostById(postId),
          engagementService.getComments(postId),
        ]);

        const p = postRes?.data || postRes;
        const c = commentsRes?.data?.content || commentsRes?.content || commentsRes?.data || [];

        setPost(p);
        setComments(c);
        setIsLiked(p.likedByCurrentUser || false);
        setLikeCount(p.likeCount || 0);
        setIsSaved(p.savedByCurrentUser || false);
      } catch (err) {
        showError(err.message || 'Failed to load comments');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, postId]);

  const handleLike = async () => {
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikeCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      await engagementService.toggleLike(postId);
      if (onPostUpdated) onPostUpdated();
    } catch {
      setIsLiked(!nextState);
      setLikeCount((prev) => (!nextState ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  const handleSave = async () => {
    const nextState = !isSaved;
    setIsSaved(nextState);
    try {
      await engagementService.toggleSave(postId);
      if (onPostUpdated) onPostUpdated();
    } catch {
      setIsSaved(!nextState);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setSubmitting(true);
      const payload = {
        text: commentText.trim(),
        parentCommentId: replyTo ? replyTo.id : null,
      };

      const res = await engagementService.addComment(postId, payload);
      const newComment = res?.data || res;

      if (replyTo) {
        setRepliesMap((prev) => ({
          ...prev,
          [replyTo.id]: [...(prev[replyTo.id] || []), newComment],
        }));
        showSuccess('Reply posted!');
      } else {
        setComments((prev) => [...prev, newComment]);
        showSuccess('Comment posted!');
      }

      setCommentText('');
      setReplyTo(null);
      if (onPostUpdated) onPostUpdated();
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      showError(err.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId, parentId = null) => {
    try {
      await engagementService.deleteComment(commentId);
      if (parentId) {
        setRepliesMap((prev) => ({
          ...prev,
          [parentId]: prev[parentId].filter((r) => r.id !== commentId),
        }));
      } else {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
      showSuccess('Comment deleted');
      if (onPostUpdated) onPostUpdated();
    } catch (err) {
      showError(err.message || 'Failed to delete comment');
    }
  };

  const handleLoadReplies = async (commentId) => {
    if (repliesMap[commentId]) {
      setRepliesMap((prev) => {
        const copy = { ...prev };
        delete copy[commentId];
        return copy;
      });
      return;
    }

    try {
      const res = await engagementService.getCommentReplies(commentId);
      const replies = res?.data?.content || res?.content || res?.data || [];
      setRepliesMap((prev) => ({ ...prev, [commentId]: replies }));
    } catch (err) {
      showError(err.message || 'Failed to load replies');
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="xl" showCloseButton={true}>
        <div className="comments-dialog-layout">
          <div className="comments-media-pane">
            {post?.media?.[0]?.mediaType === 'VIDEO' ? (
              <video
                src={post.media[0].mediaUrl}
                controls
                className="dialog-media-item"
              />
            ) : post?.media?.[0]?.mediaUrl ? (
              <img
                src={post.media[0].mediaUrl}
                alt={post.caption || 'Post image'}
                className="dialog-media-item"
              />
            ) : (
              <div className="dialog-media-empty">No media</div>
            )}
          </div>

          <div className="comments-info-pane">
            <div className="comments-header">
              <div className="comments-author-row">
                <Avatar
                  src={(post?.author?.avatarUrl || post?.author?.profilePictureUrl)}
                  alt={post?.author?.username || 'User'}
                  size="sm"
                />
                <span className="comments-author-username">{post?.author?.username}</span>
              </div>
              <button
                type="button"
                className="comments-opts-btn"
                onClick={() => setReportOpen(true)}
                title="Options"
              >
                <MoreHorizontal size={18} />
              </button>
            </div>

            <div className="comments-stream">
              {loading ? (
                <div className="comments-loading">
                  <LoadingSpinner size="md" />
                </div>
              ) : (
                <>
                  {post?.caption && (
                    <div className="comment-row caption-row">
                      <Avatar
                        src={(post.author?.avatarUrl || post.author?.profilePictureUrl)}
                        alt={post.author?.username}
                        size="sm"
                      />
                      <div className="comment-body">
                        <span className="comment-username">{post.author?.username}</span>
                        <span className="comment-text">{post.caption}</span>
                        <div className="comment-meta">
                          <span>{timeAgo(post.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {comments.length === 0 && !post?.caption ? (
                    <div className="comments-empty-state">
                      <MessageSquare size={32} />
                      <p>No comments yet.</p>
                      <span>Start the conversation.</span>
                    </div>
                  ) : (
                    comments.map((comment) => {
                      const isCommentAuthor = currentUser?.id === comment.author?.id;
                      const isPostAuthor = currentUser?.id === post?.author?.id;
                      const hasReplies = comment.replyCount > 0 || (repliesMap[comment.id]?.length > 0);

                      return (
                        <div key={comment.id} className="comment-block">
                          <div className="comment-row">
                            <Avatar
                              src={(comment.author?.avatarUrl || comment.author?.profilePictureUrl)}
                              alt={comment.author?.username}
                              size="sm"
                            />
                            <div className="comment-body">
                              <span className="comment-username">{comment.author?.username}</span>
                              <span className="comment-text">{comment.text}</span>
                              <div className="comment-meta">
                                <span>{timeAgo(comment.createdAt)}</span>
                                <button
                                  type="button"
                                  className="comment-reply-btn"
                                  onClick={() => setReplyTo({ id: comment.id, username: comment.author?.username })}
                                >
                                  Reply
                                </button>
                                {(isCommentAuthor || isPostAuthor) && (
                                  <button
                                    type="button"
                                    className="comment-delete-btn"
                                    onClick={() => handleDeleteComment(comment.id)}
                                    title="Delete comment"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {hasReplies && (
                            <button
                              type="button"
                              className="view-replies-toggle"
                              onClick={() => handleLoadReplies(comment.id)}
                            >
                              <div className="reply-line" />
                              <span>
                                {repliesMap[comment.id]
                                  ? 'Hide replies'
                                  : `View replies (${comment.replyCount || repliesMap[comment.id]?.length || 1})`}
                              </span>
                            </button>
                          )}

                          {repliesMap[comment.id]?.map((reply) => (
                            <div key={reply.id} className="comment-row nested-reply-row">
                              <Avatar
                                src={(reply.author?.avatarUrl || reply.author?.profilePictureUrl)}
                                alt={reply.author?.username}
                                size="xs"
                              />
                              <div className="comment-body">
                                <span className="comment-username">{reply.author?.username}</span>
                                <span className="comment-text">{reply.text}</span>
                                <div className="comment-meta">
                                  <span>{timeAgo(reply.createdAt)}</span>
                                  {(currentUser?.id === reply.author?.id || isPostAuthor) && (
                                    <button
                                      type="button"
                                      className="comment-delete-btn"
                                      onClick={() => handleDeleteComment(reply.id, comment.id)}
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })
                  )}
                  <div ref={commentsEndRef} />
                </>
              )}
            </div>

            <div className="comments-actions-bar">
              <div className="comments-buttons-row">
                <button
                  type="button"
                  className={`action-icon-btn ${isLiked ? 'liked' : ''}`}
                  onClick={handleLike}
                  aria-label="Like"
                >
                  <Heart size={22} fill={isLiked ? 'var(--color-error)' : 'none'} />
                </button>
                <button
                  type="button"
                  className={`action-icon-btn ${isSaved ? 'saved' : ''}`}
                  onClick={handleSave}
                  aria-label="Save"
                >
                  <Bookmark size={22} fill={isSaved ? 'var(--text-primary)' : 'none'} />
                </button>
              </div>
              <div className="comments-likes-count">
                <strong>{formatCount(likeCount)}</strong> {likeCount === 1 ? 'like' : 'likes'}
              </div>
              <div className="comments-post-time">
                {timeAgo(post?.createdAt)}
              </div>
            </div>

            <form onSubmit={handleSubmitComment} className="comments-input-form">
              {replyTo && (
                <div className="replying-banner">
                  <span>Replying to @{replyTo.username}</span>
                  <button type="button" onClick={() => setReplyTo(null)}>?</button>
                </div>
              )}
              <div className="input-with-button">
                <input
                  type="text"
                  className="comment-input-field"
                  placeholder={replyTo ? `Reply to @${replyTo.username}...` : 'Add a comment...'}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  maxLength={1000}
                />
                <button
                  type="submit"
                  className="comment-submit-btn"
                  disabled={!commentText.trim() || submitting}
                >
                  {submitting ? <LoadingSpinner size="sm" /> : <Send size={16} />}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="POST"
        targetId={postId}
      />
    </>
  );
};

export default CommentsModal;
