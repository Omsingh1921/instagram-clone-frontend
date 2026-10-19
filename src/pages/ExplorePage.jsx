import React, { useState, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, Copy, Video, Compass } from 'lucide-react';
import CommentsModal from '../components/modals/CommentsModal';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import feedService from '../services/feed.service';
import { formatCount } from '../utils';
import './ExplorePage.css';

export const ExplorePage = () => {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  const fetchExplore = useCallback(async (pageNum = 0, append = false) => {
    try {
      if (pageNum === 0) setLoading(true);
      else setLoadingMore(true);

      const res = await feedService.getExploreFeed(pageNum, 18);
      const list = res?.data?.content || res?.content || res?.data || [];
      const isLast = res?.data?.last ?? res?.last ?? list.length < 18;

      if (append) {
        setPosts((prev) => [...prev, ...list]);
      } else {
        setPosts(list);
      }

      setHasMore(!isLast && list.length > 0);
      setPage(pageNum);
    } catch {
      if (!append) setPosts([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchExplore(0, false);
  }, [fetchExplore]);

  return (
    <div className="explore-page-container">
      {loading ? (
        <div className="explore-loading-container">
          <LoadingSpinner size="lg" />
          <p style={{ marginTop: '16px' }}>Discovering new posts...</p>
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No explore posts yet"
          description="Be the first to share content on the platform to appear here."
        />
      ) : (
        <>
          <div className="explore-grid">
            {posts.map((post) => {
              const firstMedia = post.media?.[0];
              const isVideo = firstMedia?.mediaType === 'VIDEO';
              const hasMultiple = (post.media?.length || 0) > 1;

              return (
                <div
                  key={post.id}
                  className="explore-grid-item"
                  onClick={() => setSelectedPostId(post.id)}
                >
                  {/* Media */}
                  {isVideo ? (
                    <video src={firstMedia.mediaUrl} className="explore-media" muted />
                  ) : (
                    <img
                      src={firstMedia?.mediaUrl}
                      alt={post.caption || 'Explore post'}
                      className="explore-media"
                      loading="lazy"
                    />
                  )}

                  {/* Multiple/Video Indicator */}
                  {hasMultiple && (
                    <div className="explore-media-badge">
                      <Copy size={18} />
                    </div>
                  )}
                  {isVideo && (
                    <div className="explore-media-badge">
                      <Video size={18} />
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="explore-item-overlay">
                    <div className="overlay-stat">
                      <Heart size={20} fill="#fff" />
                      <span>{formatCount(post.likeCount || 0)}</span>
                    </div>
                    <div className="overlay-stat">
                      <MessageCircle size={20} fill="#fff" />
                      <span>{formatCount(post.commentCount || 0)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {hasMore && (
            <button
              type="button"
              className="btn btn-secondary feed-load-more-btn"
              onClick={() => fetchExplore(page + 1, true)}
              disabled={loadingMore}
              style={{ marginTop: '32px' }}
            >
              {loadingMore ? <LoadingSpinner size="sm" /> : 'Load more'}
            </button>
          )}
        </>
      )}

      {/* Post Modal */}
      {selectedPostId && (
        <CommentsModal
          isOpen={!!selectedPostId}
          onClose={() => setSelectedPostId(null)}
          postId={selectedPostId}
          onPostUpdated={() => fetchExplore(0, false)}
        />
      )}
    </div>
  );
};

export default ExplorePage;
