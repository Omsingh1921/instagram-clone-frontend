import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, UserPlus, UserCheck, UserMinus } from 'lucide-react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import LoadingSpinner from '../common/LoadingSpinner';
import followService from '../../services/follow.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './FollowListModal.css';

export const FollowListModal = ({
  isOpen,
  onClose,
  userId,
  type = 'followers', // 'followers' or 'following'
  title = '',
}) => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const { user: currentUser, isFollowing, toggleFollow } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const isOwnList = Boolean(currentUser?.id && String(currentUser.id) === String(userId));

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchList = async () => {
      try {
        setLoading(true);
        const res = type === 'followers'
          ? await followService.getFollowers(userId)
          : await followService.getFollowing(userId);

        const list = res?.data?.content || res?.content || res?.data || [];
        setUsers(list);
      } catch (err) {
        showError(err.message || 'Failed to load list');
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, [isOpen, userId, type]);

  const handleToggleFollow = async (targetId) => {
    try {
      await toggleFollow(targetId);
    } catch (err) {
      showError(err.message || 'Action failed');
    }
  };

  const handleRemoveFollower = async (followerId, username) => {
    if (typeof window !== 'undefined' && typeof window.confirm === 'function' && !window.confirm(`Remove @${username} as a follower? They won't be notified.`)) {
      return;
    }

    try {
      setRemovingId(followerId);
      await followService.removeFollower(followerId);
      setUsers((prev) => prev.filter((u) => (u.id || u.user?.id) !== followerId));
      showSuccess(`Removed @${username} from followers`);
    } catch (err) {
      showError(err.message || 'Failed to remove follower');
    } finally {
      setRemovingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const item = u.user || u;
    return (
      item.username?.toLowerCase().includes(q) ||
      item.displayName?.toLowerCase().includes(q) ||
      item.fullName?.toLowerCase().includes(q)
    );
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || (type === 'followers' ? 'Followers' : 'Following')}
      size="sm"
    >
      <div className="follow-list-container">
        <div className="follow-search-box">
          <SearchIcon size={16} className="follow-search-icon" />
          <input
            type="text"
            className="follow-search-input"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="follow-users-list">
          {loading ? (
            <div className="follow-list-loading">
              <LoadingSpinner size="md" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="follow-list-empty">
              {search ? 'No users found matching your search' : 'No users to display'}
            </div>
          ) : (
            filteredUsers.map((item) => {
              const u = item.user || item;
              const isMe = currentUser?.id === u.id;
              const isUserFollowing = isFollowing ? isFollowing(u.id) : false;

              return (
                <div key={u.id} className="follow-user-item">
                  <div
                    className="follow-user-info"
                    onClick={() => {
                      onClose();
                      navigate(`/profile/${u.id}`);
                    }}
                  >
                    <Avatar
                      src={u.profilePictureUrl || u.avatarUrl}
                      alt={u.username}
                      size="sm"
                    />
                    <div className="follow-user-names">
                      <span className="follow-username">@{u.username}</span>
                      <span className="follow-fullname">{u.displayName || u.fullName}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isOwnList && type === 'followers' && !isMe && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: '12px', padding: '5px 10px' }}
                        onClick={() => handleRemoveFollower(u.id, u.username)}
                        disabled={removingId === u.id}
                      >
                        {removingId === u.id ? <LoadingSpinner size="sm" /> : 'Remove'}
                      </button>
                    )}

                    {!isMe && (
                      <button
                        type="button"
                        className={`btn follow-item-btn ${isUserFollowing ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={() => handleToggleFollow(u.id)}
                      >
                        {isUserFollowing ? (
                          <>
                            <UserCheck size={14} />
                            <span>Following</span>
                          </>
                        ) : (
                          <>
                            <UserPlus size={14} />
                            <span>Follow</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};

export default FollowListModal;
