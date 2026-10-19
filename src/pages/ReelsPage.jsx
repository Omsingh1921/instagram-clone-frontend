import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Volume2,
  VolumeX,
  Music,
  Film,
} from 'lucide-react';
import Avatar from '../components/common/Avatar';
import CommentsModal from '../components/modals/CommentsModal';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import reelService from '../services/reel.service';
import followService from '../services/follow.service';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCount } from '../utils';
import './ReelsPage.css';

export const ReelsPage = () => {
  const [reels, setReels] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [likesMap, setLikesMap] = useState({}); // reelId -> { count, liked }
  
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  const { user: currentUser, isFollowing, toggleFollow } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const loadReels = async (pageNum = 0) => {
    try {
      if (pageNum === 0) setLoading(true);
      const res = await reelService.getReels(pageNum, 10);
      const list = res?.data?.content || res?.content || res?.data || [];
      setReels(list);

      const initialLikes = {};
      list.forEach((r) => {
        initialLikes[r.id] = { count: 0, liked: false };
      });
      setLikesMap(initialLikes);
      setPage(pageNum);
    } catch {
      setReels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReels(0);
  }, []);

  const handleLikeToggle = (reelId) => {
    setLikesMap((prev) => {
      const cur = prev[reelId] || { count: 0, liked: false };
      const nextLiked = !cur.liked;
      return {
        ...prev,
        [reelId]: {
          liked: nextLiked,
          count: nextLiked ? cur.count + 1 : Math.max(0, cur.count - 1),
        },
      };
    });
  };

  const handleFollowToggle = async (authorId) => {
    try {
      const nextState = await toggleFollow(authorId);
      if (nextState) {
        showSuccess('Following creator');
      }
    } catch (err) {
      showError(err.message || 'Action failed');
    }
  };

  const handleShare = (reelId) => {
    const url = `${window.location.origin}/reels/${reelId}`;
    navigator.clipboard.writeText(url);
    showSuccess('Reel link copied to clipboard!');
  };

  return (
    <div className="reels-page-container">
      {loading ? (
        <div className="reels-loading-box">
          <LoadingSpinner size="lg" />
          <p>Loading reels...</p>
        </div>
      ) : reels.length === 0 ? (
        <EmptyState
          icon={Film}
          title="No Reels Available"
          description="Be the first creator to record and share a reel on the platform."
        />
      ) : (
        <div className="reels-feed-list">
          {reels.map((reel) => {
            const isLiked = !!likesMap[reel.id]?.liked;
            const likeCount = likesMap[reel.id]?.count || 0;
            const isAuthorFollowing = isFollowing(reel.author?.id);
            const isMe = currentUser?.id === reel.author?.id;

            return (
              <div key={reel.id} className="reel-card-item">
                <video
                  src={reel.videoUrl}
                  className="reel-video-element"
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  onClick={(e) => {
                    if (e.target.paused) e.target.play();
                    else e.target.pause();
                  }}
                />

                <div className="reel-overlay-gradient" />

                {/* Mute Toggle */}
                <button
                  type="button"
                  className="reel-mute-btn"
                  onClick={() => setIsMuted(!isMuted)}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>

                {/* Bottom Info */}
                <div className="reel-bottom-info">
                  <div className="reel-author-row">
                    <Avatar
                      src={(reel.author?.avatarUrl || reel.author?.profilePictureUrl)}
                      alt={reel.author?.username}
                      size="sm"
                      onClick={() => navigate(`/profile/${reel.author?.id}`)}
                    />
                    <span
                      className="reel-author-username"
                      onClick={() => navigate(`/profile/${reel.author?.id}`)}
                    >
                      {reel.author?.username}
                    </span>
                    {!isMe && (
                      <button
                        type="button"
                        className="reel-follow-btn"
                        onClick={() => handleFollowToggle(reel.author?.id)}
                      >
                        {isAuthorFollowing ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>

                  {reel.caption && (
                    <p className="reel-caption-text">{reel.caption}</p>
                  )}

                  <div className="reel-audio-track">
                    <Music size={12} />
                    <span>Original Audio ? {reel.author?.username}</span>
                  </div>
                </div>

                {/* Right Action Bar */}
                <div className="reel-actions-column">
                  <button
                    type="button"
                    className={`reel-action-btn-item ${isLiked ? 'liked' : ''}`}
                    onClick={() => handleLikeToggle(reel.id)}
                  >
                    <Heart size={26} />
                    <span>{formatCount(likeCount)}</span>
                  </button>

                  <button
                    type="button"
                    className="reel-action-btn-item"
                    onClick={() => {
                      setSelectedPostId(reel.id);
                      setCommentsModalOpen(true);
                    }}
                  >
                    <MessageCircle size={26} />
                    <span>0</span>
                  </button>

                  <button
                    type="button"
                    className="reel-action-btn-item"
                    onClick={() => handleShare(reel.id)}
                  >
                    <Send size={24} />
                  </button>

                  <button
                    type="button"
                    className="reel-action-btn-item"
                    onClick={() => showSuccess('Saved to collection')}
                  >
                    <Bookmark size={24} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reel Comments Modal if opened */}
      {commentsModalOpen && selectedPostId && (
        <CommentsModal
          isOpen={commentsModalOpen}
          onClose={() => {
            setCommentsModalOpen(false);
            setSelectedPostId(null);
          }}
          postId={selectedPostId}
        />
      )}
    </div>
  );
};

export default ReelsPage;
