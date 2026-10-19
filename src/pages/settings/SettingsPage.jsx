import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Lock, Bell, Shield, UserX, Check, Laptop, Smartphone, Globe, LogOut, AlertTriangle, Camera, Mail, Trash2, Power } from 'lucide-react';
import Avatar from '../../components/common/Avatar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import settingsService from '../../services/settings.service';
import userService from '../../services/user.service';
import mediaService from '../../services/media.service';
import sessionService from '../../services/session.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './SettingsPage.css';

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'password', 'privacy', 'blocked', 'sessions', 'account'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  // Profile data
  const [profileForm, setProfileForm] = useState({
    username: '',
    displayName: '',
    bio: '',
    websiteUrl: '',
  });

  // Password data
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Settings data
  const [settingsForm, setSettingsForm] = useState({
    privateAccount: false,
    notifyLikes: true,
    notifyComments: true,
    notifyFollows: true,
    notifyMessages: true,
  });

  // Account & Danger Zone state
  const [newEmailInput, setNewEmailInput] = useState('');
  const [changingEmail, setChangingEmail] = useState(false);
  const [emailChangeSent, setEmailChangeSent] = useState('');
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Blocked users
  const [blockedUsers, setBlockedUsers] = useState([]);

  // Sessions data
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState(null);
  const [revokingId, setRevokingId] = useState(null);
  const [showRevokeOtherModal, setShowRevokeOtherModal] = useState(false);
  const [showLogoutAllModal, setShowLogoutAllModal] = useState(false);

  const { user: currentUser, updateUser, logout } = useAuth();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    const loadSettingsAndProfile = async () => {
      try {
        setLoading(true);
        const [profRes, settRes] = await Promise.all([
          userService.getCurrentUser(),
          settingsService.getSettings(),
        ]);

        const prof = profRes?.data || profRes;
        const sett = settRes?.data || settRes;

        setProfileForm({
          username: prof.username || currentUser?.username || '',
          displayName: prof.displayName || prof.fullName || '',
          bio: prof.bio || '',
          websiteUrl: prof.websiteUrl || '',
        });

        if (sett) {
          setSettingsForm({
            privateAccount: !!sett.privateAccount,
            notifyLikes: sett.likes ?? sett.notifyLikes ?? true,
            notifyComments: sett.comments ?? sett.notifyComments ?? true,
            notifyFollows: sett.followers ?? sett.notifyFollows ?? true,
            notifyMessages: sett.messages ?? sett.notifyMessages ?? true,
          });
        }
      } catch {
        // Fallback to local profile values
        if (currentUser) {
          setProfileForm({
            username: currentUser.username || '',
            displayName: currentUser.displayName || currentUser.fullName || '',
            bio: currentUser.bio || '',
            websiteUrl: currentUser.websiteUrl || '',
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadSettingsAndProfile();
  }, [currentUser]);

  // Load Blocked accounts when tab is active
  useEffect(() => {
    if (activeTab === 'blocked') {
      const loadBlocks = async () => {
        try {
          const res = await settingsService.getBlockedUsers();
          const list = res?.data?.content || res?.content || res?.data || [];
          setBlockedUsers(list);
        } catch {
          setBlockedUsers([]);
        }
      };
      loadBlocks();
    }
  }, [activeTab]);

  // Load active sessions when tab is active
  const loadSessions = useCallback(async () => {
    try {
      setSessionsLoading(true);
      setSessionsError(null);
      const res = await sessionService.getActiveSessions();
      const list = res?.data || res || [];
      setSessions(Array.isArray(list) ? list : []);
    } catch (err) {
      const msg = err.message || 'Failed to load active sessions';
      setSessionsError(msg);
      showError(msg);
    } finally {
      setSessionsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    if (activeTab === 'sessions') {
      loadSessions();
    }
  }, [activeTab, loadSessions]);

  const handleRevokeSession = async (sessionId, isCurrent) => {
    try {
      setRevokingId(sessionId);
      await sessionService.revokeSession(sessionId);
      showSuccess(isCurrent ? 'Logged out of current session' : 'Session logged out successfully');
      if (isCurrent) {
        logout();
      } else {
        await loadSessions();
      }
    } catch (err) {
      showError(err.message || 'Failed to revoke session');
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeOtherSessions = async () => {
    try {
      setSaving(true);
      const res = await sessionService.revokeOtherSessions();
      const count = res?.data?.revokedCount ?? res?.revokedCount ?? 0;
      showSuccess(`Logged out of ${count} other session${count === 1 ? '' : 's'}`);
      setShowRevokeOtherModal(false);
      loadSessions();
    } catch (err) {
      showError(err.message || 'Failed to revoke other sessions');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutAll = async () => {
    try {
      setSaving(true);
      await sessionService.logoutAll();
      showSuccess('All sessions terminated');
      setShowLogoutAllModal(false);
      logout();
    } catch (err) {
      showError(err.message || 'Failed to terminate all sessions');
    } finally {
      setSaving(false);
    }
  };

  const getDeviceIcon = (deviceName) => {
    if (!deviceName) return Globe;
    const lower = deviceName.toLowerCase();
    if (lower.includes('iphone') || lower.includes('android') || lower.includes('ios') || lower.includes('mobile')) {
      return Smartphone;
    }
    return Laptop;
  };

  const formatSessionTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
        ' at ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  // Avatar upload
  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Please select a valid image file');
      return;
    }

    try {
      setUploadingAvatar(true);
      const uploadRes = await mediaService.uploadMedia(file, 'avatar');
      const mediaUrl = uploadRes?.secureUrl || uploadRes?.data?.secureUrl || uploadRes?.url || uploadRes?.data?.url;
      if (!mediaUrl) throw new Error('No media URL returned from server');

      await userService.updateAvatar(mediaUrl);
      updateUser({
        ...currentUser,
        avatarUrl: mediaUrl,
        profilePictureUrl: mediaUrl,
      });
      showSuccess('Profile photo updated!');
    } catch (err) {
      showError(err.message || 'Failed to update photo');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  // Save profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        displayName: profileForm.displayName.trim(),
        bio: profileForm.bio.trim(),
        websiteUrl: profileForm.websiteUrl.trim(),
      };
      if (profileForm.username && profileForm.username.trim() !== currentUser?.username) {
        payload.username = profileForm.username.trim().toLowerCase();
      }
      const res = await userService.updateProfile(payload);
      const updated = res?.data || res;
      updateUser({ ...currentUser, ...updated });
      showSuccess('Profile updated successfully');
    } catch (err) {
      showError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError('New passwords do not match');
      return;
    }

    try {
      setSaving(true);
      await settingsService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      showSuccess('Password updated successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showError(err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  // Update privacy & notifications
  const handleSaveSettings = async (updatedSettings) => {
    setSettingsForm(updatedSettings);
    try {
      await settingsService.updateSettings(updatedSettings);
      showSuccess('Settings updated');
    } catch (err) {
      showError(err.message || 'Failed to save settings');
    }
  };

  // Unblock user
  const handleUnblock = async (blockedUserId) => {
    try {
      await settingsService.unblockUser(blockedUserId);
      setBlockedUsers((prev) => prev.filter((u) => u.id !== blockedUserId));
      showSuccess('User unblocked');
    } catch (err) {
      showError(err.message || 'Failed to unblock user');
    }
  };

  // Initiate email change
  const handleInitiateEmailChange = async (e) => {
    e.preventDefault();
    if (!newEmailInput || !newEmailInput.includes('@')) {
      showError('Please enter a valid email address');
      return;
    }
    try {
      setChangingEmail(true);
      await settingsService.initiateEmailChange(newEmailInput.trim().toLowerCase());
      setEmailChangeSent(newEmailInput.trim().toLowerCase());
      showSuccess('Verification link sent to ' + newEmailInput);
      setNewEmailInput('');
    } catch (err) {
      showError(err.message || 'Failed to initiate email change');
    } finally {
      setChangingEmail(false);
    }
  };

  // Cancel pending email change
  const handleCancelPendingEmail = async () => {
    try {
      await settingsService.cancelPendingEmailChange();
      setEmailChangeSent('');
      showSuccess('Pending email change cancelled');
    } catch (err) {
      showError(err.message || 'Failed to cancel email change');
    }
  };

  // Deactivate account
  const handleDeactivateAccount = async () => {
    try {
      setSaving(true);
      await userService.deactivateCurrentUser();
      showSuccess('Account deactivated. You can reactivate anytime by logging in.');
      setShowDeactivateModal(false);
      logout();
    } catch (err) {
      showError(err.message || 'Failed to deactivate account');
    } finally {
      setSaving(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    try {
      setSaving(true);
      await userService.deleteCurrentUser();
      showSuccess('Account deleted with a 15-day recovery window.');
      setShowDeleteModal(false);
      logout();
    } catch (err) {
      showError(err.message || 'Failed to delete account');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-page-layout">
      {/* Settings Navigation Bar */}
      <nav className="settings-nav-pane">
        <h2 className="settings-nav-title">Settings</h2>
        <button
          type="button"
          className={`settings-nav-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={18} />
          <span>Edit Profile</span>
        </button>

        <button
          type="button"
          className={`settings-nav-button ${activeTab === 'password' ? 'active' : ''}`}
          onClick={() => setActiveTab('password')}
        >
          <Lock size={18} />
          <span>Change Password</span>
        </button>

        <button
          type="button"
          className={`settings-nav-button ${activeTab === 'privacy' ? 'active' : ''}`}
          onClick={() => setActiveTab('privacy')}
        >
          <Shield size={18} />
          <span>Privacy & Security</span>
        </button>

        <button
          type="button"
          className={`settings-nav-button ${activeTab === 'blocked' ? 'active' : ''}`}
          onClick={() => setActiveTab('blocked')}
        >
          <UserX size={18} />
          <span>Blocked Accounts</span>
        </button>

        <button
          type="button"
          className={`settings-nav-button ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          <Laptop size={18} />
          <span>Login Activity</span>
        </button>

        <button
          type="button"
          className={`settings-nav-button ${activeTab === 'account' ? 'active' : ''}`}
          onClick={() => setActiveTab('account')}
        >
          <AlertTriangle size={18} />
          <span>Account & Danger Zone</span>
        </button>
      </nav>

      {/* Main Settings Content */}
      <main className="settings-content-pane">
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <LoadingSpinner size="md" />
          </div>
        ) : activeTab === 'profile' ? (
          <div>
            <h2 className="settings-section-title">Edit Profile</h2>
            <form onSubmit={handleSaveProfile} className="settings-form">
              {/* Profile Photo Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <Avatar src={(currentUser?.avatarUrl || currentUser?.profilePictureUrl)} alt={currentUser?.username} size="lg" />
                  <div>
                    <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>@{currentUser?.username}</strong>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{profileForm.displayName || 'No display name set'}</div>
                  </div>
                </div>

                <input
                  type="file"
                  ref={avatarInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleAvatarFile}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                >
                  {uploadingAvatar ? <LoadingSpinner size="sm" /> : <Camera size={14} />}
                  <span>{uploadingAvatar ? 'Uploading...' : 'Change photo'}</span>
                </button>
              </div>

              {/* Username Field */}
              <div className="editor-form-group">
                <label className="editor-label">Username</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', padding: '0 12px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '14px', marginRight: '4px' }}>@</span>
                  <input
                    type="text"
                    className="input"
                    style={{ border: 'none', background: 'transparent', padding: '10px 0', width: '100%' }}
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                    minLength={3}
                    maxLength={30}
                    required
                  />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  3-30 characters. Letters, numbers, underscores, and periods allowed.
                </div>
              </div>

              {/* Display Name Field */}
              <div className="editor-form-group">
                <label className="editor-label">Name</label>
                <input
                  type="text"
                  className="input"
                  value={profileForm.displayName}
                  onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                  maxLength={50}
                  placeholder="Your display name"
                />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Help people discover your account by using the name you're known by.
                </div>
              </div>

              {/* Bio Field */}
              <div className="editor-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="editor-label" style={{ margin: 0 }}>Bio</label>
                  <span style={{ fontSize: '11px', color: (profileForm.bio?.length || 0) > 140 ? 'var(--color-error)' : 'var(--text-muted)' }}>
                    {profileForm.bio?.length || 0} / 150
                  </span>
                </div>
                <textarea
                  rows={3}
                  className="input"
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  maxLength={150}
                  placeholder="Write a brief bio about yourself..."
                />
              </div>

              {/* Website Field */}
              <div className="editor-form-group">
                <label className="editor-label">Website</label>
                <input
                  type="text"
                  className="input"
                  placeholder="https://example.com"
                  value={profileForm.websiteUrl}
                  onChange={(e) => setProfileForm({ ...profileForm, websiteUrl: e.target.value })}
                  maxLength={200}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving || uploadingAvatar}
                style={{ marginTop: '8px', alignSelf: 'flex-start' }}
              >
                {saving ? <LoadingSpinner size="sm" /> : 'Save Profile'}
              </button>
            </form>
          </div>
        ) : activeTab === 'password' ? (
          <div>
            <h2 className="settings-section-title">Change Password</h2>
            <form onSubmit={handleChangePassword} className="settings-form">
              <div className="editor-form-group">
                <label className="editor-label">Current Password</label>
                <input
                  type="password"
                  className="input"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                />
              </div>

              <div className="editor-form-group">
                <label className="editor-label">New Password</label>
                <input
                  type="password"
                  className="input"
                  required
                  minLength={8}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                />
              </div>

              <div className="editor-form-group">
                <label className="editor-label">Confirm New Password</label>
                <input
                  type="password"
                  className="input"
                  required
                  minLength={8}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                style={{ marginTop: '8px', alignSelf: 'flex-start' }}
              >
                {saving ? <LoadingSpinner size="sm" /> : 'Change Password'}
              </button>
            </form>
          </div>
        ) : activeTab === 'privacy' ? (
          <div style={{ maxWidth: '520px' }}>
            <h2 className="settings-section-title">Privacy & Notifications</h2>
            
            <div className="settings-toggle-row">
              <div className="toggle-info">
                <span className="toggle-title">Private Account</span>
                <span className="toggle-desc">When your account is private, only approved followers can see your posts and stories.</span>
              </div>
              <label className="switch-control">
                <input
                  type="checkbox"
                  checked={settingsForm.privateAccount}
                  onChange={(e) => handleSaveSettings({ ...settingsForm, privateAccount: e.target.checked })}
                />
                <span className="switch-slider" />
              </label>
            </div>

            <div className="settings-toggle-row">
              <div className="toggle-info">
                <span className="toggle-title">Likes Notifications</span>
                <span className="toggle-desc">Receive notifications when someone likes your posts.</span>
              </div>
              <label className="switch-control">
                <input
                  type="checkbox"
                  checked={settingsForm.notifyLikes}
                  onChange={(e) => handleSaveSettings({ ...settingsForm, notifyLikes: e.target.checked })}
                />
                <span className="switch-slider" />
              </label>
            </div>

            <div className="settings-toggle-row">
              <div className="toggle-info">
                <span className="toggle-title">Comments Notifications</span>
                <span className="toggle-desc">Receive notifications when someone comments on your posts.</span>
              </div>
              <label className="switch-control">
                <input
                  type="checkbox"
                  checked={settingsForm.notifyComments}
                  onChange={(e) => handleSaveSettings({ ...settingsForm, notifyComments: e.target.checked })}
                />
                <span className="switch-slider" />
              </label>
            </div>

            <div className="settings-toggle-row">
              <div className="toggle-info">
                <span className="toggle-title">New Follower Notifications</span>
                <span className="toggle-desc">Receive notifications when someone starts following you.</span>
              </div>
              <label className="switch-control">
                <input
                  type="checkbox"
                  checked={settingsForm.notifyFollows}
                  onChange={(e) => handleSaveSettings({ ...settingsForm, notifyFollows: e.target.checked })}
                />
                <span className="switch-slider" />
              </label>
            </div>

            <div className="settings-toggle-row">
              <div className="toggle-info">
                <span className="toggle-title">Message Notifications</span>
                <span className="toggle-desc">Receive notifications for direct messages.</span>
              </div>
              <label className="switch-control">
                <input
                  type="checkbox"
                  checked={settingsForm.notifyMessages}
                  onChange={(e) => handleSaveSettings({ ...settingsForm, notifyMessages: e.target.checked })}
                />
                <span className="switch-slider" />
              </label>
            </div>
          </div>
        ) : activeTab === 'sessions' ? (
          <div className="sessions-container">
            <h2 className="settings-section-title">Login Activity</h2>
            <p className="sessions-header-desc">
              Manage your active sessions and devices where your account is currently signed in.
            </p>

            <div className="sessions-action-bar">
              <div>
                <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Active Sessions</strong>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {sessions.length} logged-in device{sessions.length === 1 ? '' : 's'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                  disabled={sessions.filter((s) => !s.current).length === 0 || saving}
                  onClick={() => setShowRevokeOtherModal(true)}
                >
                  Log out other devices
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                  disabled={saving}
                  onClick={() => setShowLogoutAllModal(true)}
                >
                  Log out of all
                </button>
              </div>
            </div>

            {sessionsLoading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <LoadingSpinner size="md" />
              </div>
            ) : sessionsError ? (
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-danger)', fontSize: '13px', marginBottom: '12px' }}>
                  {sessionsError}
                </p>
                <button type="button" className="btn btn-secondary" onClick={loadSessions}>
                  Retry
                </button>
              </div>
            ) : sessions.length === 0 ? (
              <EmptyState
                icon={Laptop}
                title="No Active Sessions"
                description="No active sessions were found for your account."
              />
            ) : (
              <div className="sessions-list">
                {sessions.map((sess) => {
                  const DeviceIcon = getDeviceIcon(sess.deviceName);
                  return (
                    <div
                      key={sess.sessionId}
                      className={`session-card ${sess.current ? 'current' : ''}`}
                    >
                      <div className="session-main-details">
                        <div className="session-icon-box">
                          <DeviceIcon size={20} />
                        </div>
                        <div className="session-info">
                          <div className="session-title-line">
                            <span className="session-device-name">
                              {sess.deviceName || 'Unknown Device'}
                            </span>
                            {sess.current && (
                              <span className="session-current-badge">This Device</span>
                            )}
                          </div>
                          <div className="session-meta-line">
                            {sess.ipAddress ? `IP: ${sess.ipAddress} • ` : ''}
                            {sess.current ? 'Active now' : `Last active ${formatSessionTime(sess.lastActivityAt)}`}
                          </div>
                          <div className="session-meta-line" style={{ opacity: 0.75 }}>
                            Signed in {formatSessionTime(sess.createdAt)}
                          </div>
                        </div>
                      </div>

                      {!sess.current && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ fontSize: '12px', padding: '6px 14px' }}
                          disabled={revokingId === sess.sessionId || saving}
                          onClick={() => handleRevokeSession(sess.sessionId)}
                        >
                          {revokingId === sess.sessionId ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            'Log Out'
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === 'blocked' ? (
          <div>
            <h2 className="settings-section-title">Blocked Accounts</h2>
            {blockedUsers.length === 0 ? (
              <EmptyState
                icon={UserX}
                title="No Blocked Accounts"
                description="You haven't blocked anyone yet. Blocked accounts will be listed here."
              />
            ) : (
              <div className="blocked-users-list">
                {blockedUsers.map((item) => {
                  const u = item.blockedUser || item;
                  return (
                    <div key={u.id} className="blocked-user-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Avatar src={(u.avatarUrl || u.profilePictureUrl)} alt={u.username} size="sm" />
                        <div>
                          <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{u.username}</strong>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{u.displayName || u.fullName}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '6px 14px', fontSize: '12px' }}
                        onClick={() => handleUnblock(u.id)}
                      >
                        Unblock
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === 'account' ? (
          <div style={{ maxWidth: '580px' }}>
            <h2 className="settings-section-title">Account & Security</h2>

            {/* Email Address Section */}
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Mail size={18} color="var(--ig-primary-button)" />
                <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>Email Address</strong>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Current email: <strong style={{ color: 'var(--text-primary)' }}>{currentUser?.email || 'No email associated'}</strong>
              </p>

              {emailChangeSent ? (
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '10px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--color-success)', marginBottom: '6px' }}>
                    ✓ Verification email sent to <strong>{emailChangeSent}</strong>. Please check your inbox and click the verification link.
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '4px 10px' }}
                    onClick={handleCancelPendingEmail}
                  >
                    Cancel Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleInitiateEmailChange} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input
                    type="email"
                    className="input"
                    style={{ flex: '1', minWidth: '220px' }}
                    placeholder="Enter new email address"
                    value={newEmailInput}
                    onChange={(e) => setNewEmailInput(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className="btn btn-secondary"
                    disabled={changingEmail}
                  >
                    {changingEmail ? <LoadingSpinner size="sm" /> : 'Change Email'}
                  </button>
                </form>
              )}
            </div>

            {/* Account Deactivation (Temporary) */}
            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Power size={18} color="var(--color-warning)" />
                <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>Temporarily Deactivate Account</strong>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
                Temporarily deactivating your account hides your profile, photos, comments, and likes. You can easily reactivate whenever you want by simply logging back into your account.
              </p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDeactivateModal(true)}
              >
                Deactivate My Account
              </button>
            </div>

            {/* Danger Zone: Account Deletion (Permanent) */}
            <div style={{ background: 'rgba(237, 73, 86, 0.05)', border: '1px solid rgba(237, 73, 86, 0.3)', padding: '20px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Trash2 size={18} color="var(--color-error)" />
                <strong style={{ fontSize: '15px', color: 'var(--color-error)' }}>Danger Zone: Delete Account</strong>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
                When you delete your account, your profile and content will be scheduled for permanent removal with a 15-day recovery grace period. All your active sessions will be terminated immediately.
              </p>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setShowDeleteModal(true)}
              >
                Delete Account
              </button>
            </div>
          </div>
        ) : null}
      </main>

      {/* Modal for Deactivate Account */}
      {showDeactivateModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowDeactivateModal(false)}>
          <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Deactivate Account?</h3>
            <p className="modal-body-text">
              Your profile, posts, comments, and likes will be hidden from everyone until you log back in. Are you sure you want to proceed?
            </p>
            <div className="modal-action-row">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={saving}
                onClick={() => setShowDeactivateModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={saving}
                onClick={handleDeactivateAccount}
              >
                {saving ? <LoadingSpinner size="sm" /> : 'Yes, Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Delete Account */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowDeleteModal(false)}>
          <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title" style={{ color: 'var(--color-error)' }}>Permanently Delete Account?</h3>
            <p className="modal-body-text">
              This will immediately sign you out and schedule your profile, posts, reels, and stories for permanent removal. You will have a 15-day recovery window to restore your account.
            </p>
            <div className="modal-action-row">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={saving}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={saving}
                onClick={handleDeleteAccount}
              >
                {saving ? <LoadingSpinner size="sm" /> : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Revoke Other Sessions */}
      {showRevokeOtherModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowRevokeOtherModal(false)}>
          <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Log out other devices?</h3>
            <p className="modal-body-text">
              You will be signed out on all other web and mobile devices. You will stay signed in on this device.
            </p>
            <div className="modal-action-row">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={saving}
                onClick={() => setShowRevokeOtherModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={saving}
                onClick={handleRevokeOtherSessions}
              >
                {saving ? <LoadingSpinner size="sm" /> : 'Log Out Others'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Logout All Sessions */}
      {showLogoutAllModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowLogoutAllModal(false)}>
          <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Log out of all devices?</h3>
            <p className="modal-body-text">
              You will be signed out everywhere, including this device. You will need to enter your credentials to sign back in.
            </p>
            <div className="modal-action-row">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={saving}
                onClick={() => setShowLogoutAllModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={saving}
                onClick={handleLogoutAll}
              >
                {saving ? <LoadingSpinner size="sm" /> : 'Log Out All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
