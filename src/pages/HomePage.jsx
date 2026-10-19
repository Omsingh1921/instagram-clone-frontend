import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Sparkles, UserPlus, Compass } from 'lucide-react';
import StoryBar from '../components/story/StoryBar';
import PostCard from '../components/post/PostCard';
import Avatar from '../components/common/Avatar';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import feedService from '../services/feed.service';
import userService from '../services/user.service';
import followService from '../services/follow.service';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './HomePage.css';

export const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  

  const { user: currentUser, isFollowing, toggleFollow } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  // Load Feed
  const fetchFeed = useCallback(async (pageNum = 0, append = false) => {
    try {
      if (pageNum === 0) setLoading(true);
      else setLoadingMore(true);

      const res = await feedService.getHomeFeed(pageNum, 10);
      const postList = res?.data?.content || res?.content || res?.data || [];
      const isLast = res?.data?.last ?? res?.last ?? postList.length < 10;

      if (append) {
        setPosts((prev) => [...prev, ...postList]);
      } else {
        setPosts(postList);
      }

      setHasMore(!isLast && postList.length > 0);
      setPage(pageNum);
    } catch {
      if (!append) setPosts([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Load Suggestions for Sidebar
  const loadSuggestions = useCallback(async () => {
    try {
      const res = await userService.searchUsers('', 0, 5);
      const userList = res?.data?.content || res?.content || res?.data || [];
      // Filter out self
      const filtered = userList.filter((u) => u.id !== currentUser?.id);
      setSuggestions(filtered);
    } catch {
      setSuggestions([]);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    fetchFeed(0, false);
    loadSuggestions();

    const handleRefresh = () => fetchFeed(0, false);
    window.addEventListener('feed:refresh', handleRefresh);
    return () => window.removeEventListener('feed:refresh', handleRefresh);
  }, [fetchFeed, loadSuggestions]);

  const handleFollowToggle = async (userId) => {
    try {
      const nextState = await toggleFollow(userId);
      if (nextState) {
        showSuccess('Following user');
      }
    } catch (err) {
      showError(err.message || 'Action failed');
    }
  };

  const handlePostDeleted = (deletedId) => {
    setPosts((prev) => prev.filter((p) => p.id !== deletedId));
  };

  return (
    <div className="home-page-container">
      {/* Main Feed Column */}
      <section className="home-feed-column">
        {/* Stories Bar */}
        <StoryBar />

        {/* Feed Posts */}
        {loading ? (
          <div className="home-feed-loading">
            <LoadingSpinner size="lg" />
            <p>Loading your feed...</p>
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            icon={Compass}
            title="Welcome to Instagram!"
            description="When you follow people, you'll see the photos and videos they post here. Discover creators and connect with friends."
            actionLabel="Explore Posts"
            onAction={() => navigate('/explore')}
          />
        ) : (
          <>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPostDeleted={handlePostDeleted}
                onPostUpdated={() => {}}
              />
            ))}

            {hasMore && (
              <button
                type="button"
                className="btn btn-secondary feed-load-more-btn"
                onClick={() => fetchFeed(page + 1, true)}
                disabled={loadingMore}
              >
                {loadingMore ? <LoadingSpinner size="sm" /> : 'Load more posts'}
              </button>
            )}

            {!hasMore && posts.length > 0 && (
              <div className="feed-caught-up-banner" style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                <Sparkles size={20} style={{ margin: '0 auto 8px', color: 'var(--color-primary)' }} />
                <p>You're all caught up!</p>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>You've seen all new posts from accounts you follow.</span>
              </div>
            )}
          </>
        )}
      </section>

      {/* Right Sidebar Column (Desktop) */}
      <aside className="home-sidebar-column">
        {/* Current User Card */}
        {currentUser && (
          <div className="sidebar-user-card">
            <div
              className="sidebar-user-info"
              onClick={() => navigate(`/profile/${currentUser.id}`)}
            >
              <Avatar
                src={(currentUser.avatarUrl || currentUser.profilePictureUrl)}
                alt={currentUser.username}
                size="md"
              />
              <div className="sidebar-user-names">
                <span className="sidebar-username">{currentUser.username}</span>
                <span className="sidebar-fullname">{currentUser.displayName || currentUser.fullName}</span>
              </div>
            </div>
            <button
              type="button"
              className="sidebar-switch-btn"
              onClick={() => navigate('/settings')}
            >
              Edit
            </button>
          </div>
        )}

        {/* Suggestions Card */}
        {suggestions.length > 0 && (
          <div className="sidebar-suggestions-card">
            <div className="suggestions-header">
              <span className="suggestions-title">Suggested for you</span>
              <NavLink to="/search" className="suggestions-see-all">See All</NavLink>
            </div>

            <div className="suggestions-list">
              {suggestions.map((u) => {
                const isItemFollowing = isFollowing(u.id);
                return (
                  <div key={u.id} className="suggestion-item">
                    <div
                      className="suggestion-info"
                      onClick={() => navigate(`/profile/${u.id}`)}
                    >
                      <Avatar
                        src={(u.avatarUrl || u.profilePictureUrl)}
                        alt={u.username}
                        size="sm"
                      />
                      <div className="sidebar-user-names">
                        <span className="sidebar-username">{u.username}</span>
                        <span className="sidebar-fullname">Suggested for you</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="suggestion-follow-btn"
                      onClick={() => handleFollowToggle(u.id)}
                    >
                      {isItemFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Links */}
        <footer className="sidebar-footer-links">
          <div>
            <a href="#about">About</a> ? <a href="#help">Help</a> ? <a href="#press">Press</a> ? <a href="#api">API</a> ? <a href="#jobs">Jobs</a> ? <a href="#privacy">Privacy</a> ? <a href="#terms">Terms</a>
          </div>
          <div className="copyright-text">
            ? 2026 INSTAGRAM CLONE FROM META
          </div>
        </footer>
      </aside>
    </div>
  );
};

export default HomePage;
