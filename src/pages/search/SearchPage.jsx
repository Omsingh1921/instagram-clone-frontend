import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, X, User, Grid } from 'lucide-react';
import Avatar from '../../components/common/Avatar';
import CommentsModal from '../../components/modals/CommentsModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { useDebounce } from '../../hooks/useDebounce';
import searchService from '../../services/search.service';
import followService from '../../services/follow.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './SearchPage.css';

export const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'posts'
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  

  const debouncedQuery = useDebounce(query, 300);
  const { user: currentUser, isFollowing, toggleFollow } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setUsers([]);
      setPosts([]);
      return;
    }

    const performSearch = async () => {
      try {
        setLoading(true);
        if (activeTab === 'users') {
          const res = await searchService.searchUsers(debouncedQuery, 0, 20);
          const list = res?.data?.content || res?.content || res?.data || [];
          setUsers(list);
        } else {
          const res = await searchService.searchPosts(debouncedQuery, 0, 20);
          const list = res?.data?.content || res?.content || res?.data || [];
          setPosts(list);
        }
      } catch {
        if (activeTab === 'users') setUsers([]);
        else setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, activeTab]);

  const handleFollowToggle = async (e, targetUserId) => {
    e.stopPropagation();
    try {
      const nextState = await toggleFollow(targetUserId);
      if (nextState) {
        showSuccess('Following user');
      }
    } catch (err) {
      showError(err.message || 'Action failed');
    }
  };

  return (
    <div className="search-page-container">
      <h1 className="search-page-title">Search</h1>

      {/* Search Input Bar */}
      <div className="search-input-wrapper">
        <SearchIcon size={18} className="search-leading-icon" />
        <input
          type="text"
          className="search-input-field"
          placeholder="Search accounts or posts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {query && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => setQuery('')}
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="search-tabs-row">
        <button
          type="button"
          className={`search-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Accounts
        </button>
        <button
          type="button"
          className={`search-tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          Posts
        </button>
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <LoadingSpinner size="md" />
        </div>
      ) : activeTab === 'users' ? (
        users.length === 0 ? (
          <EmptyState
            icon={User}
            title={query ? 'No accounts found' : 'Find friends and creators'}
            description={query ? 'Try searching for another name or username.' : 'Search for accounts by typing in the search bar above.'}
          />
        ) : (
          <div className="search-results-list">
            {users.map((u) => {
              const isMe = currentUser?.id === u.id;
              const isTargetFollowing = isFollowing(u.id);

              return (
                <div
                  key={u.id}
                  className="search-user-row"
                  onClick={() => navigate(`/profile/${u.id}`)}
                >
                  <div className="search-user-info">
                    <Avatar
                      src={u.profilePictureUrl || u.avatarUrl}
                      alt={u.username}
                      size="md"
                    />
                    <div className="search-user-text">
                      <span className="search-user-uname">{u.username}</span>
                      <span className="search-user-fname">{u.displayName || u.fullName}</span>
                    </div>
                  </div>

                  {!isMe && (
                    <button
                      type="button"
                      className={`btn ${isTargetFollowing ? 'btn-secondary' : 'btn-primary'}`}
                      style={{ padding: '6px 14px', fontSize: '12px' }}
                      onClick={(e) => handleFollowToggle(e, u.id)}
                    >
                      {isTargetFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : posts.length === 0 ? (
        <EmptyState
          icon={Grid}
          title={query ? 'No posts found' : 'Search for posts'}
          description={query ? 'No posts matched your query.' : 'Search keywords or tags.'}
        />
      ) : (
        <div className="search-posts-grid">
          {posts.map((post) => (
            <div
              key={post.id}
              className="search-post-item"
              onClick={() => setSelectedPostId(post.id)}
            >
              <img
                src={post.media?.[0]?.mediaUrl}
                alt={post.caption || 'Post'}
                className="search-post-media"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {/* Post Modal */}
      {selectedPostId && (
        <CommentsModal
          isOpen={!!selectedPostId}
          onClose={() => setSelectedPostId(null)}
          postId={selectedPostId}
        />
      )}
    </div>
  );
};

export default SearchPage;
