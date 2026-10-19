import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Settings,
  Grid,
  Bookmark,
  Globe,
  Camera,
  Heart,
  MessageCircle,
  Film,
  MoreHorizontal,
  UserCheck,
  UserPlus,
  Send,
} from 'lucide-react';
import Avatar from '../../components/common/Avatar';
import CommentsModal from '../../components/modals/CommentsModal';
import FollowListModal from '../../components/modals/FollowListModal';
import ReportModal from '../../components/modals/ReportModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import userService from '../../services/user.service';
import postService from '../../services/post.service';
import mediaService from '../../services/media.service';
import reelService from '../../services/reel.service';
import followService from '../../services/follow.service';
import chatService from '../../services/chat.service';
import settingsService from '../../services/settings.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCount } from '../../utils';
import './ProfilePage.css';

export const ProfilePage = () => {
  const { userId } = useParams();
  const { user: currentUser, updateUser, isFollowing: checkIsFollowing, toggleFollow, setFollowStatus } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const isOwnProfile =
    !userId ||
    userId === 'me' ||
    (currentUser && String(currentUser.id) === String(userId));

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts', 'reels', 'saved'

  // Tab content
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  // Modals
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [followModalType, setFollowModalType] = useState('followers');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  // Inline edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    displayName: '',
    bio: '',
    websiteUrl: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const avatarInputRef = useRef(null);

  // Load Profile Details
  const loadProfile = useCallback(async () => {
    try {
      setLoadingProfile(true);
      let res;
      if (isOwnProfile) {
        res = await userService.getCurrentUser();
      } else {
        res = await userService.getUserById(userId);
      }

      const data = res?.data || res;
      setProfile(data);
      if (isOwnProfile) {
        updateUser(data);
      }
      setFollowersCount(data.followersCount || data.followerCount || 0);
      setFollowingCount(data.followingCount || 0);
      const followed = Boolean(data.followedByCurrentUser ?? data.followingByCurrentUser ?? (checkIsFollowing ? checkIsFollowing(data.userId || data.id || userId) : false));
      setIsFollowing(followed);
      if (setFollowStatus) {
        setFollowStatus(data.userId || data.id || userId, followed);
      }

      setEditFormData({
        displayName: data.displayName || data.fullName || '',
        bio: data.bio || '',
        websiteUrl: data.websiteUrl || '',
      });
    } catch (err) {
      showError(err.message || 'Failed to load profile');
    } finally {
      setLoadingProfile(false);
    }
  }, [isOwnProfile, userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Load User Posts
  const loadUserPosts = useCallback(async () => {
    const targetId = isOwnProfile ? currentUser?.id : userId;
    if (!targetId) return;

    try {
      setLoadingPosts(true);
      const res = await postService.getUserPosts(targetId, 0, 30);
      const list = res?.data?.content || res?.content || res?.data || [];
      setPosts(list);
    } catch {
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }, [isOwnProfile, currentUser?.id, userId]);

  // Load User Reels
  const loadUserReels = useCallback(async () => {
    const targetId = isOwnProfile ? currentUser?.id : userId;
    if (!targetId) return;

    try {
      const res = await reelService.getUserReels(targetId, 0, 30);
      const list = res?.data?.content || res?.content || res?.data || [];
      setReels(list);
    } catch {
      setReels([]);
    }
  }, [isOwnProfile, currentUser?.id, userId]);

    // Load Saved Posts (Only for own profile)
  const loadSavedPosts = useCallback(async () => {
    if (!isOwnProfile) return;

    try {
      setLoadingSaved(true);
      const res = await postService.getSavedPosts(0, 30);
      const list = res?.data?.content || res?.content || res?.data || (Array.isArray(res) ? res : []);
      setSavedPosts(list);
    } catch {
      setSavedPosts([]);
    } finally {
      setLoadingSaved(false);
    }
  }, [isOwnProfile]);

  useEffect(() => {
    if (activeTab === 'posts') {
      loadUserPosts();
    } else if (activeTab === 'reels') {
      loadUserReels();
    } else if (activeTab === 'saved') {
      loadSavedPosts();
    }
  }, [activeTab, loadUserPosts, loadUserReels, loadSavedPosts]);

  // Follow / Unfollow
  const handleFollowToggle = async () => {
    try {
      const nextState = await toggleFollow(userId);
      setIsFollowing(nextState);
      setFollowersCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));
      if (nextState) {
        showSuccess('Following user');
      }
    } catch (err) {
      showError(err.message || 'Action failed');
    }
  };

  // Start Direct Chat
  const handleMessageUser = async () => {
    try {
      const res = await chatService.getOrCreateDirectConversation(userId);
      const conv = res?.data || res;
      navigate('/messages', { state: { conversationId: conv.id } });
    } catch (err) {
      showError(err.message || 'Failed to start message');
    }
  };

  // Block user
  const handleBlockUser = async () => {
    if (!window.confirm('Are you sure you want to block this user?')) return;
    try {
      await settingsService.blockUser(userId);
      showSuccess('User blocked');
      navigate('/');
    } catch (err) {
      showError(err.message || 'Failed to block user');
    }
  };

  // Avatar Upload
  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploadRes = await mediaService.uploadMedia(file, 'avatar');
      const mediaUrl = uploadRes?.secureUrl || uploadRes?.data?.secureUrl || uploadRes?.url || uploadRes?.data?.url;
      if (!mediaUrl) throw new Error('No media URL returned from server');
      await userService.updateAvatar(mediaUrl);

      setProfile((prev) => ({
        ...prev,
        avatarUrl: mediaUrl,
        profilePictureUrl: mediaUrl,
      }));
      updateUser({
        ...currentUser,
        avatarUrl: mediaUrl,
        profilePictureUrl: mediaUrl,
      });
      showSuccess('Profile photo updated!');
    } catch (err) {
      showError(err.message || 'Failed to update photo');
    }
  };

  // Save text profile edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      setSavingEdit(true);
      const res = await userService.updateProfile({
        displayName: editFormData.displayName.trim(),
        bio: editFormData.bio.trim(),
        websiteUrl: editFormData.websiteUrl.trim(),
      });
      const updated = res?.data || res;
      setProfile((prev) => ({ ...prev, ...updated }));
      updateUser({ ...currentUser, ...updated });
      setIsEditing(false);
      showSuccess('Profile saved');
    } catch (err) {
      showError(err.message || 'Failed to update profile');
    } finally {
      setSavingEdit(false);
    }
  };

  if (loadingProfile) {
    return (
      <div style={{ padding: '80px', display: 'flex', justifyContent: 'center' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <EmptyState
        icon={Globe}
        title="User not found"
        description="The link you followed may be broken, or the user profile may have been removed."
        actionLabel="Go to Home"
        onAction={() => navigate('/')}
      />
    );
  }

  const effectiveUserId = isOwnProfile ? currentUser?.id : userId;

  const renderTabContent = () => {
    if (loadingPosts) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <LoadingSpinner size="md" />
        </div>
      );
    }

    if (activeTab === 'posts') {
      if (posts.length === 0) {
        return (
          <EmptyState
            icon={Camera}
            title="No Posts Yet"
            description={isOwnProfile ? "When you share photos and videos, they will appear on your profile." : "This user hasn't posted anything yet."}
            actionLabel={isOwnProfile ? "Share your first photo" : undefined}
            onAction={isOwnProfile ? () => window.dispatchEvent(new CustomEvent('open-create-modal')) : undefined}
          />
        );
      }
      return (
        <div className="profile-grid">
          {posts.map((post) => {
            const media = post.media?.[0];
            return (
              <div
                key={post.id}
                className="profile-grid-item"
                onClick={() => setSelectedPostId(post.id)}
              >
                {media?.mediaType === 'VIDEO' ? (
                  <video src={media.mediaUrl} className="profile-grid-media" muted />
                ) : (
                  <img
                    src={media?.mediaUrl}
                    alt={post.caption || 'Post image'}
                    className="profile-grid-media"
                    loading="lazy"
                  />
                )}
                <div className="profile-grid-overlay">
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
      );
    }

    if (activeTab === 'reels') {
      if (reels.length === 0) {
        return (
          <EmptyState
            icon={Film}
            title="No Reels Yet"
            description="Videos uploaded by this user will appear here."
          />
        );
      }
      return (
        <div className="profile-grid">
          {reels.map((reel) => (
            <div
              key={reel.id}
              className="profile-grid-item"
              onClick={() => setSelectedPostId(reel.id)}
            >
              <video src={reel.videoUrl} className="profile-grid-media" muted />
              <div className="profile-grid-overlay">
                <div className="overlay-stat">
                  <Film size={20} fill="#fff" />
                  <span>Watch</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <EmptyState
        icon={Bookmark}
        title="Saved Posts"
        description="Only you can see what you've saved."
      />
    );
  };

  return (
    <div className="profile-page-container">
      {/* Header Section */}
      <header className="profile-header-section">
        <div className="profile-avatar-column">
          <div
            className="profile-avatar-trigger"
            onClick={() => isOwnProfile && avatarInputRef.current?.click()}
          >
            <Avatar
              src={profile.profilePictureUrl || profile.avatarUrl}
              alt={profile.username}
              size="xxl"
            />
            {isOwnProfile && (
              <div className="profile-avatar-overlay">
                <Camera size={28} />
              </div>
            )}
            <input
              type="file"
              ref={avatarInputRef}
              onChange={handleAvatarFile}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>
        </div>

        <div className="profile-info-column">
          {/* Username & Action Buttons */}
          <div className="profile-username-row">
            <h1 className="profile-username-title">{profile.username}</h1>

            <div className="profile-action-buttons">
              {isOwnProfile ? (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary profile-btn"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? 'Cancel' : 'Edit profile'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary profile-btn"
                    onClick={() => navigate('/settings')}
                    title="Settings"
                  >
                    <Settings size={18} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className={`btn profile-btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={handleFollowToggle}
                  >
                    {isFollowing ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <UserCheck size={16} /> Following
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <UserPlus size={16} /> Follow
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary profile-btn"
                    onClick={handleMessageUser}
                  >
                    <Send size={16} style={{ marginRight: '6px' }} />
                    Message
                  </button>

                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      className="btn btn-secondary profile-btn"
                      onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    {moreMenuOpen && (
                      <div className="post-options-menu" style={{ right: 0, top: '40px' }}>
                        <button
                          type="button"
                          className="post-menu-item danger"
                          onClick={() => {
                            setMoreMenuOpen(false);
                            setReportModalOpen(true);
                          }}
                        >
                          Report user
                        </button>
                        <button
                          type="button"
                          className="post-menu-item danger"
                          onClick={handleBlockUser}
                        >
                          Block user
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="profile-stats-row">
            <div className="stat-item">
              <span className="stat-num">{formatCount(posts.length)}</span>
              <span>posts</span>
            </div>
            <div
              className="stat-item clickable"
              onClick={() => {
                setFollowModalType('followers');
                setFollowModalOpen(true);
              }}
            >
              <span className="stat-num">{formatCount(followersCount)}</span>
              <span>followers</span>
            </div>
            <div
              className="stat-item clickable"
              onClick={() => {
                setFollowModalType('following');
                setFollowModalOpen(true);
              }}
            >
              <span className="stat-num">{formatCount(followingCount)}</span>
              <span>following</span>
            </div>
          </div>

          {/* Bio Info */}
          <div className="profile-bio-section">
            <span className="profile-full-name">{profile.displayName || profile.fullName}</span>
            {profile.bio && <p className="profile-bio-text">{profile.bio}</p>}
            {profile.websiteUrl && (
              <a
                href={profile.websiteUrl.startsWith('http') ? profile.websiteUrl : `https://${profile.websiteUrl}`}
                target="_blank"
                rel="noreferrer noopener"
                className="profile-website-link"
              >
                <Globe size={13} />
                <span>{profile.websiteUrl.replace(/^https?:\/\//, '')}</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Edit Profile Form (Inline) */}
      {isEditing && isOwnProfile && (
        <form onSubmit={handleSaveEdit} className="profile-edit-box">
          <h3 style={{ margin: 0, fontSize: '16px' }}>Edit Profile Information</h3>
          <div className="editor-form-group">
            <label className="editor-label">Display Name</label>
            <input
              type="text"
              className="input"
              value={editFormData.displayName}
              onChange={(e) => setEditFormData({ ...editFormData, displayName: e.target.value })}
              maxLength={50}
            />
          </div>
          <div className="editor-form-group">
            <label className="editor-label">Bio</label>
            <textarea
              rows={3}
              className="input"
              value={editFormData.bio}
              onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
              maxLength={150}
            />
          </div>
          <div className="editor-form-group">
            <label className="editor-label">Website</label>
            <input
              type="text"
              className="input"
              placeholder="https://example.com"
              value={editFormData.websiteUrl}
              onChange={(e) => setEditFormData({ ...editFormData, websiteUrl: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={savingEdit}
            >
              {savingEdit ? <LoadingSpinner size="sm" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Navigation Tabs */}
      <nav className="profile-tabs-bar">
        <button
          type="button"
          className={`profile-tab-item ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          <Grid size={14} />
          <span>Posts</span>
        </button>

        <button
          type="button"
          className={`profile-tab-item ${activeTab === 'reels' ? 'active' : ''}`}
          onClick={() => setActiveTab('reels')}
        >
          <Film size={14} />
          <span>Reels</span>
        </button>

        {isOwnProfile && (
          <button
            type="button"
            className={`profile-tab-item ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            <Bookmark size={14} />
            <span>Saved</span>
          </button>
        )}
      </nav>

      {/* Content Grid */}
      {renderTabContent()}

      {/* Comments Modal for clicked post */}
      {selectedPostId && (
        <CommentsModal
          isOpen={!!selectedPostId}
          onClose={() => setSelectedPostId(null)}
          postId={selectedPostId}
          onPostUpdated={() => { loadUserPosts(); if (activeTab === "saved") loadSavedPosts(); }}
        />
      )}

      {/* Followers / Following List Modal */}
      {followModalOpen && (
        <FollowListModal
          isOpen={followModalOpen}
          onClose={() => setFollowModalOpen(false)}
          userId={effectiveUserId}
          type={followModalType}
        />
      )}

      {/* Report Modal */}
      {reportModalOpen && (
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          targetType="USER"
          targetId={userId}
        />
      )}
    </div>
  );
};

export default ProfilePage;
