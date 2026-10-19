import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, Trash2, Eye, Heart } from 'lucide-react';
import Avatar from '../common/Avatar';
import LoadingSpinner from '../common/LoadingSpinner';
import storyService from '../../services/story.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { timeAgo } from '../../utils';
import './StoryViewerModal.css';

const STORY_DURATION = 5000; // 5 seconds per story

export const StoryViewerModal = ({
  isOpen,
  storyGroups = [],
  initialGroupIdx = 0,
  onClose,
}) => {
  const [groupIdx, setGroupIdx] = useState(initialGroupIdx);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [loadingViewers, setLoadingViewers] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [likedStory, setLikedStory] = useState(false);

  const startTimeRef = useRef(null);
  const elapsedBeforePauseRef = useRef(0);
  const viewedStoriesRef = useRef(new Set());

  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const currentGroup = storyGroups[groupIdx];
  const currentStory = currentGroup?.stories?.[storyIdx];
  const isMyStory = String(currentUser?.id || '') === String(currentGroup?.author?.id || '');

  // Reset viewers & reply when story changes
  useEffect(() => {
    setShowViewers(false);
    setViewers([]);
    setReplyText('');
    setLikedStory(false);
  }, [storyIdx, groupIdx]);

  // Mark viewed on load (only once per story)
  useEffect(() => {
    if (currentStory?.id && !viewedStoriesRef.current.has(currentStory.id)) {
      viewedStoriesRef.current.add(currentStory.id);
      if (!currentStory.viewed) {
        currentStory.viewed = true;
        storyService.markStoryViewed(currentStory.id).catch(() => {});
      }
    }
  }, [currentStory?.id]);

  const goToNextStory = () => {
    if (showViewers) return;
    if (!currentGroup) return;
    if (storyIdx < currentGroup.stories.length - 1) {
      setStoryIdx((prev) => prev + 1);
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
    } else if (groupIdx < storyGroups.length - 1) {
      setGroupIdx((prev) => prev + 1);
      setStoryIdx(0);
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
    } else {
      onClose();
    }
  };

  const goToPrevStory = () => {
    if (showViewers) return;
    if (storyIdx > 0) {
      setStoryIdx((prev) => prev - 1);
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
    } else if (groupIdx > 0) {
      const prevGroup = storyGroups[groupIdx - 1];
      setGroupIdx((prev) => prev - 1);
      setStoryIdx((prevGroup?.stories?.length || 1) - 1);
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showViewers) {
          setShowViewers(false);
          setIsPaused(false);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowRight' && !showViewers) {
        goToNextStory();
      } else if (e.key === 'ArrowLeft' && !showViewers) {
        goToPrevStory();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, groupIdx, storyIdx, currentGroup, showViewers]);

  // Timer loop
  useEffect(() => {
    if (!isOpen || isPaused || showViewers || !currentStory) return;

    startTimeRef.current = Date.now() - elapsedBeforePauseRef.current;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(pct);

      if (elapsed >= STORY_DURATION) {
        clearInterval(interval);
        goToNextStory();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isOpen, isPaused, showViewers, currentStory, groupIdx, storyIdx]);

  const handleMouseDown = (e) => {
    if (showViewers) return;
    // Don't pause on footer clicks
    if (e.target.closest('.story-viewer-footer')) return;
    setIsPaused(true);
    elapsedBeforePauseRef.current = (progress / 100) * STORY_DURATION;
  };

  const handleMouseUp = () => {
    if (showViewers) return;
    setIsPaused(false);
  };

  const handleDeleteStory = async () => {
    if (!currentStory) return;
    try {
      await storyService.deleteStory(currentStory.id);
      showSuccess('Story deleted');
      if (currentGroup.stories.length <= 1) {
        if (groupIdx < storyGroups.length - 1) {
          setGroupIdx((prev) => prev + 1);
          setStoryIdx(0);
          setProgress(0);
        } else if (groupIdx > 0) {
          setGroupIdx((prev) => prev - 1);
          setStoryIdx(0);
          setProgress(0);
        } else {
          onClose();
        }
      } else {
        currentGroup.stories.splice(storyIdx, 1);
        if (storyIdx >= currentGroup.stories.length) {
          setStoryIdx(Math.max(0, currentGroup.stories.length - 1));
        }
        setProgress(0);
        elapsedBeforePauseRef.current = 0;
      }
    } catch (err) {
      showError(err.message || 'Failed to delete story');
    }
  };

  const handleOpenViewers = async () => {
    setIsPaused(true);
    setShowViewers(true);
    if (!currentStory?.id) return;

    try {
      setLoadingViewers(true);
      const res = await storyService.getStoryViewers(currentStory.id);
      let list = [];
      if (Array.isArray(res?.data)) {
        list = res.data;
      } else if (Array.isArray(res)) {
        list = res;
      } else if (Array.isArray(res?.data?.data)) {
        list = res.data.data;
      }
      setViewers(list);
    } catch (err) {
      console.error('[StoryViewer] Failed to load story viewers:', err);
      setViewers([]);
    } finally {
      setLoadingViewers(false);
    }
  };

  const handleCloseViewers = () => {
    setShowViewers(false);
    setIsPaused(false);
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !currentGroup?.author?.username) return;
    showSuccess(`Reply sent to ${currentGroup.author.username}`);
    setReplyText('');
    setIsPaused(false);
  };

  const handleLikeStory = () => {
    setLikedStory(!likedStory);
    if (!likedStory) {
      showSuccess('Liked story');
    }
  };

  if (!isOpen || !currentGroup || !currentStory) return null;

  return (
    <div className="story-viewer-overlay" role="dialog" aria-modal="true">
      {/* External Prev Arrow */}
      {groupIdx > 0 && !showViewers && (
        <button
          type="button"
          className="story-nav-arrow prev"
          onClick={goToPrevStory}
          aria-label="Previous user story"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      <div
        className="story-viewer-frame"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
      >
        {/* Progress Bars */}
        <div className="story-progress-container">
          {currentGroup.stories.map((s, idx) => {
            let width = '0%';
            if (idx < storyIdx) width = '100%';
            else if (idx === storyIdx) width = `${progress}%`;

            return (
              <div key={s.id} className="story-progress-bar">
                <div className="story-progress-fill" style={{ width }} />
              </div>
            );
          })}
        </div>

        {/* Header */}
        <div className="story-viewer-header">
          <div className="story-viewer-author">
            <Avatar
              src={(currentGroup.author?.avatarUrl || currentGroup.author?.profilePictureUrl)}
              alt={currentGroup.author?.username}
              size="sm"
            />
            <span className="story-viewer-username">{currentGroup.author?.username}</span>
            <span className="story-viewer-time">{timeAgo(currentStory.createdAt)}</span>
          </div>

          <div className="story-viewer-controls">
            {isMyStory && (
              <button
                type="button"
                className="story-ctrl-btn"
                onClick={handleDeleteStory}
                title="Delete story"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              type="button"
              className="story-ctrl-btn"
              onClick={onClose}
              aria-label="Close stories"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="story-viewer-content">
          {currentStory.mediaType === 'VIDEO' ? (
            <video
              src={currentStory.mediaUrl}
              autoPlay
              muted
              playsInline
              className="story-viewer-media"
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              alt="Story"
              className="story-viewer-media"
            />
          )}

          {/* Tap Zones */}
          {!showViewers && (
            <>
              <div className="story-nav-tap left" onClick={goToPrevStory} />
              <div className="story-nav-tap right" onClick={goToNextStory} />
            </>
          )}
        </div>

        {/* Footer */}
        <div className={`story-viewer-footer ${!isMyStory ? 'other-user-footer' : ''}`}>
          {isMyStory ? (
            <button
              type="button"
              className="story-seen-badge-btn"
              onClick={handleOpenViewers}
              title="View story activity and viewers"
            >
              <div className="story-seen-icon-stack">
                <Eye size={18} />
              </div>
              <span className="story-seen-count">
                {currentStory.viewCount > 0
                  ? `Seen by ${currentStory.viewCount}`
                  : '0 views'}
              </span>
            </button>
          ) : (
            <>
              <div className="story-reply-box">
                <input
                  type="text"
                  placeholder={`Reply to ${currentGroup.author?.username || 'user'}...`}
                  className="story-reply-input"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onFocus={() => setIsPaused(true)}
                  onBlur={() => !showViewers && setIsPaused(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendReply();
                  }}
                />
                {replyText.trim() && (
                  <button
                    type="button"
                    className="story-reply-send-btn"
                    onClick={handleSendReply}
                  >
                    Send
                  </button>
                )}
              </div>
              <button
                type="button"
                className={`story-like-btn ${likedStory ? 'liked' : ''}`}
                onClick={handleLikeStory}
                title="Like story"
              >
                <Heart size={24} fill={likedStory ? '#ef4444' : 'none'} color={likedStory ? '#ef4444' : '#fff'} />
              </button>
            </>
          )}
        </div>

        {/* Viewers Sheet (Instagram Style) */}
        {showViewers && isMyStory && (
          <div className="story-viewers-sheet">
            <div className="story-viewers-sheet-header">
              <div className="story-viewers-sheet-title">
                <Eye size={18} />
                <span>Story Activity</span>
                <span className="story-viewers-sheet-badge">
                  {currentStory.viewCount || 0} {currentStory.viewCount === 1 ? 'view' : 'views'}
                </span>
              </div>
              <button
                type="button"
                className="story-viewers-sheet-close"
                onClick={handleCloseViewers}
                aria-label="Close viewers"
              >
                <X size={18} />
              </button>
            </div>

            <div className="story-viewers-sheet-body">
              {loadingViewers ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}>
                  <LoadingSpinner size="md" />
                </div>
              ) : viewers.length > 0 ? (
                viewers.map((viewer) => (
                  <div key={viewer.id} className="story-viewer-user-row">
                    <div
                      className="story-viewer-user-info"
                      onClick={() => {
                        onClose();
                        navigate(`/profile/${viewer.id}`);
                      }}
                    >
                      <Avatar
                        src={viewer.avatarUrl || viewer.profilePictureUrl}
                        alt={viewer.username}
                        size="sm"
                      />
                      <div className="story-viewer-user-names">
                        <span className="story-viewer-user-uname">{viewer.username}</span>
                        <span className="story-viewer-user-fname">
                          {viewer.displayName || viewer.fullName || ''}
                        </span>
                      </div>
                    </div>
                    {viewer.viewedAt && (
                      <span className="story-viewer-user-time">{timeAgo(viewer.viewedAt)}</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="story-viewers-empty-state">
                  <Eye size={36} className="story-viewers-empty-icon" />
                  <h4 className="story-viewers-empty-title">
                    {currentStory.viewCount > 0
                      ? `${currentStory.viewCount} ${currentStory.viewCount === 1 ? 'Account has' : 'Accounts have'} seen your story`
                      : 'No views yet'}
                  </h4>
                  <p className="story-viewers-empty-desc">
                    {currentStory.viewCount > 0
                      ? 'People who have seen your story are counted in the views total above.'
                      : 'When people view your story, their accounts and view times will appear here.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* External Next Arrow */}
      {groupIdx < storyGroups.length - 1 && !showViewers && (
        <button
          type="button"
          className="story-nav-arrow next"
          onClick={goToNextStory}
          aria-label="Next user story"
        >
          <ChevronRight size={24} />
        </button>
      )}
    </div>
  );
};

export default StoryViewerModal;
