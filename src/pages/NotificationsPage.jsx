import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, CheckCheck, UserCheck, UserPlus } from 'lucide-react';
import Avatar from '../components/common/Avatar';
import CommentsModal from '../components/modals/CommentsModal';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import notificationService from '../services/notification.service';
import followService from '../services/follow.service';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { timeAgo } from '../utils';
import './NotificationsPage.css';

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [followRequests, setFollowRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingRequestId, setProcessingRequestId] = useState(null);
  const [activePostId, setActivePostId] = useState(null);

  const { isFollowing, toggleFollow } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const loadNotificationsAndRequests = async () => {
    try {
      setLoading(true);
      const [notifRes, reqRes] = await Promise.allSettled([
        notificationService.getNotifications(0, 40),
        followService.getPendingFollowRequests(0, 20),
      ]);

      if (notifRes.status === 'fulfilled') {
        const res = notifRes.value;
        const list = res?.data?.content || res?.content || res?.data || [];
        setNotifications(list);
      } else {
        setNotifications([]);
      }

      if (reqRes.status === 'fulfilled') {
        const res = reqRes.value;
        const reqList = res?.data?.content || res?.content || res?.data || [];
        setFollowRequests(reqList);
      } else {
        setFollowRequests([]);
      }
    } catch {
      setNotifications([]);
      setFollowRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotificationsAndRequests();

    const handleRealtimeNotif = (e) => {
      const incoming = e.detail;
      if (incoming && incoming.id) {
        setNotifications((prev) => {
          if (prev.some((n) => n.id === incoming.id)) return prev;
          return [incoming, ...prev];
        });
      }
    };

    window.addEventListener('app:notification', handleRealtimeNotif);
    return () => window.removeEventListener('app:notification', handleRealtimeNotif);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      showSuccess('All notifications marked as read');
    } catch (err) {
      showError(err.message || 'Failed to mark all as read');
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      try {
        await notificationService.markAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
        );
      } catch {
        // Ignore error
      }
    }

    if (notif.postId) {
      setActivePostId(notif.postId);
    } else if (notif.actor?.id) {
      navigate(`/profile/${notif.actor.id}`);
    }
  };

  const handleFollowToggle = async (e, actorId) => {
    e.stopPropagation();
    try {
      const nextState = await toggleFollow(actorId);
      if (nextState) {
        showSuccess('Following user');
      }
    } catch (err) {
      showError(err.message || 'Action failed');
    }
  };

  const handleAcceptRequest = async (e, requestId) => {
    e.stopPropagation();
    try {
      setProcessingRequestId(requestId);
      await followService.acceptFollowRequest(requestId);
      setFollowRequests((prev) => prev.filter((r) => r.id !== requestId));
      showSuccess('Follow request approved');
    } catch (err) {
      showError(err.message || 'Failed to accept follow request');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRejectRequest = async (e, requestId) => {
    e.stopPropagation();
    try {
      setProcessingRequestId(requestId);
      await followService.rejectFollowRequest(requestId);
      setFollowRequests((prev) => prev.filter((r) => r.id !== requestId));
      showSuccess('Follow request removed');
    } catch (err) {
      showError(err.message || 'Failed to reject follow request');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const unreadList = notifications.filter((n) => !n.read);
  const readList = notifications.filter((n) => n.read);

  const renderNotifText = (n) => {
    switch (n.type) {
      case 'LIKE':
        return 'liked your post.';
      case 'COMMENT':
        return 'commented on your post.';
      case 'FOLLOW':
        return 'started following you.';
      case 'FOLLOW_REQUEST':
        return 'sent you a follow request.';
      case 'MENTION':
        return 'mentioned you.';
      default:
        return 'interacted with your profile.';
    }
  };

  return (
    <div className="notifications-page-container">
      <div className="notifications-header-row">
        <h1 className="notifications-page-title">Notifications</h1>
        {unreadList.length > 0 && (
          <button
            type="button"
            className="mark-all-read-btn"
            onClick={handleMarkAllRead}
          >
            <CheckCheck size={16} />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* Pending Follow Requests for Private Accounts */}
          {followRequests.length > 0 && (
            <div style={{ marginBottom: '24px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <UserCheck size={18} color="var(--ig-primary-button)" />
                <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>
                  Follow Requests ({followRequests.length})
                </strong>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {followRequests.map((req) => {
                  const person = req.requester || req.user || req.sender || {};
                  return (
                    <div
                      key={req.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        flexWrap: 'wrap',
                        padding: '8px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-elevated)',
                      }}
                    >
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                        onClick={() => person.id && navigate(`/profile/${person.id}`)}
                      >
                        <Avatar
                          src={person.avatarUrl || person.profilePictureUrl}
                          alt={person.username}
                          size="md"
                        />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                            @{person.username || 'user'}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {person.displayName || person.fullName || 'Requested to follow you'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ fontSize: '12px', padding: '6px 14px' }}
                          disabled={processingRequestId === req.id}
                          onClick={(e) => handleAcceptRequest(e, req.id)}
                        >
                          {processingRequestId === req.id ? <LoadingSpinner size="sm" /> : 'Confirm'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ fontSize: '12px', padding: '6px 14px' }}
                          disabled={processingRequestId === req.id}
                          onClick={(e) => handleRejectRequest(e, req.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {notifications.length === 0 && followRequests.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="No notifications yet"
              description="When someone likes or comments on your posts, or follows you, you'll see it here."
            />
          ) : (
            <div className="notifications-items-list">
              {unreadList.length > 0 && (
                <>
                  <h2 className="notifications-section-heading">New</h2>
                  {unreadList.map((notif) => {
                    const isActorFollowing = isFollowing(notif.actor?.id);
                    return (
                      <div
                        key={notif.id}
                        className="notification-item-card unread"
                        onClick={() => handleNotificationClick(notif)}
                      >
                        <div className="notification-main-content">
                          <Avatar
                            src={(notif.actor?.avatarUrl || notif.actor?.profilePictureUrl)}
                            alt={notif.actor?.username}
                            size="md"
                          />
                          <div className="notification-text-box">
                            <span className="actor-username">{notif.actor?.username}</span>
                            <span>{renderNotifText(notif)}</span>
                            <span className="notification-time">{timeAgo(notif.createdAt)}</span>
                          </div>
                        </div>

                        <div className="notification-side-action">
                          {notif.type === 'FOLLOW' ? (
                            <button
                              type="button"
                              className={`btn notif-follow-btn ${isActorFollowing ? 'btn-secondary' : 'btn-primary'}`}
                              onClick={(e) => handleFollowToggle(e, notif.actor?.id)}
                            >
                              {isActorFollowing ? 'Following' : 'Follow'}
                            </button>
                          ) : (
                            <div className="notification-unread-dot" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {readList.length > 0 && (
                <>
                  <h2 className="notifications-section-heading">Earlier</h2>
                  {readList.map((notif) => {
                    const isActorFollowing = isFollowing(notif.actor?.id);
                    return (
                      <div
                        key={notif.id}
                        className="notification-item-card read"
                        onClick={() => handleNotificationClick(notif)}
                      >
                        <div className="notification-main-content">
                          <Avatar
                            src={(notif.actor?.avatarUrl || notif.actor?.profilePictureUrl)}
                            alt={notif.actor?.username}
                            size="md"
                          />
                          <div className="notification-text-box">
                            <span className="actor-username">{notif.actor?.username}</span>
                            <span>{renderNotifText(notif)}</span>
                            <span className="notification-time">{timeAgo(notif.createdAt)}</span>
                          </div>
                        </div>

                        <div className="notification-side-action">
                          {notif.type === 'FOLLOW' && (
                            <button
                              type="button"
                              className={`btn notif-follow-btn ${isActorFollowing ? 'btn-secondary' : 'btn-primary'}`}
                              onClick={(e) => handleFollowToggle(e, notif.actor?.id)}
                            >
                              {isActorFollowing ? 'Following' : 'Follow'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Post Modal when clicking on post-related notification */}
      {activePostId && (
        <CommentsModal
          isOpen={!!activePostId}
          onClose={() => setActivePostId(null)}
          postId={activePostId}
        />
      )}
    </div>
  );
};

export default NotificationsPage;
