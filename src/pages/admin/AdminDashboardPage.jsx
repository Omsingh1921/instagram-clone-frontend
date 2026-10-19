import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Film,
  Image,
  Activity,
  Search,
  CheckCircle2,
  AlertTriangle,
  Mail,
  UserX,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  BarChart3,
  MessageSquare,
  Clock,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Avatar from '../../components/common/Avatar';
import adminService from '../../services/admin.service';
import { useToast } from '../../context/ToastContext';
import { timeAgo } from '../../utils';
import './AdminDashboardPage.css';

export const AdminDashboardPage = () => {
  const [currentTab, setCurrentTab] = useState('OVERVIEW'); // 'OVERVIEW' | 'USERS'

  // Stats State
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Users Management State
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [processingUserId, setProcessingUserId] = useState(null);

  const { showSuccess, showError } = useToast();

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const res = await adminService.getStats();
      setStats(res?.data || res);
    } catch (err) {
      showError(err.message || 'Failed to load system statistics');
    } finally {
      setLoadingStats(false);
    }
  };

  const loadUsers = async (page = 0) => {
    try {
      setLoadingUsers(true);
      const params = {
        page,
        size: 15,
        sort: 'createdAt,desc',
      };
      if (searchQuery.trim()) params.query = searchQuery.trim();
      if (statusFilter) params.status = statusFilter;
      if (roleFilter) params.role = roleFilter;

      const res = await adminService.getUsers(params);
      const pageData = res?.data || res;
      setUsers(pageData?.content || []);
      setTotalPages(pageData?.totalPages || 1);
      setTotalElements(pageData?.totalElements || 0);
      setCurrentPage(page);
    } catch (err) {
      showError(err.message || 'Failed to fetch users');
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (currentTab === 'OVERVIEW') {
      loadStats();
    } else {
      loadUsers(0);
    }
  }, [currentTab]);

  useEffect(() => {
    if (currentTab === 'USERS') {
      const delayDebounce = setTimeout(() => {
        loadUsers(0);
      }, 350);
      return () => clearTimeout(delayDebounce);
    }
  }, [searchQuery, statusFilter, roleFilter]);

  const handleToggleUserStatus = async (user) => {
    const isCurrentlyActive = user.status === 'ACTIVE';
    const targetStatus = isCurrentlyActive ? 'SUSPENDED' : 'ACTIVE';
    const confirmMessage = isCurrentlyActive
      ? `Are you sure you want to SUSPEND @${user.username}? They will not be able to log in.`
      : `Reactivate account for @${user.username}?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      setProcessingUserId(user.id);
      await adminService.updateUserStatus(user.id, {
        status: targetStatus,
        reason: isCurrentlyActive ? 'Admin moderation suspension' : 'Admin reactivation',
      });
      showSuccess(`User @${user.username} status updated to ${targetStatus}`);
      loadUsers(currentPage);
    } catch (err) {
      showError(err.message || 'Failed to update user status');
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleToggleUserRole = async (user) => {
    const isCurrentlyAdmin = user.role === 'ROLE_ADMIN' || user.role === 'ADMIN';
    const targetRole = isCurrentlyAdmin ? 'ROLE_USER' : 'ROLE_ADMIN';
    const confirmMessage = isCurrentlyAdmin
      ? `Demote @${user.username} from Admin to standard User?`
      : `Promote @${user.username} to System Administrator (ROLE_ADMIN)?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      setProcessingUserId(user.id);
      await adminService.updateUserRole(user.id, {
        role: targetRole,
      });
      showSuccess(`User @${user.username} role updated to ${targetRole}`);
      loadUsers(currentPage);
    } catch (err) {
      showError(err.message || 'Failed to update user role');
    } finally {
      setProcessingUserId(null);
    }
  };

  return (
    <div className="admin-dashboard-page">
      {/* Top Admin Navigation Bar */}
      <div className="admin-nav-bar">
        <div className="admin-header-title">
          <ShieldCheck size={32} style={{ color: 'var(--ig-primary-button)' }} />
          <div>
            <h1>Admin Control Center</h1>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
              Comprehensive platform metrics, community management, content moderation, and communication controls.
            </p>
          </div>
        </div>

        <div className="admin-nav-links-row">
          <button
            type="button"
            className={`admin-nav-tab ${currentTab === 'OVERVIEW' ? 'active' : ''}`}
            onClick={() => setCurrentTab('OVERVIEW')}
          >
            <BarChart3 size={16} />
            <span>Overview & Analytics</span>
          </button>
          <button
            type="button"
            className={`admin-nav-tab ${currentTab === 'USERS' ? 'active' : ''}`}
            onClick={() => setCurrentTab('USERS')}
          >
            <Users size={16} />
            <span>User Management</span>
          </button>
          <NavLink to="/admin/reports" className="admin-nav-tab">
            <ShieldAlert size={16} />
            <span>Moderation Reports</span>
          </NavLink>
          <NavLink to="/admin/email" className="admin-nav-tab">
            <Mail size={16} />
            <span>Email & Templates</span>
          </NavLink>
        </div>
      </div>

      {/* TAB 1: SYSTEM ANALYTICS OVERVIEW */}
      {currentTab === 'OVERVIEW' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} color="var(--ig-primary-button)" />
              Real-Time Platform Performance
            </h2>
            <button
              type="button"
              className="table-action-btn"
              onClick={loadStats}
              disabled={loadingStats}
            >
              <RefreshCw size={14} className={loadingStats ? 'spinning' : ''} />
              <span>Refresh Stats</span>
            </button>
          </div>

          {loadingStats ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
              <LoadingSpinner size="lg" />
            </div>
          ) : stats ? (
            <div className="stats-cards-grid">
              {/* Users Metric Card */}
              <div className="stat-card">
                <div className="stat-card-header">
                  <span className="stat-label">User Community</span>
                  <div className="stat-icon-wrapper icon-users">
                    <Users size={22} />
                  </div>
                </div>
                <div>
                  <div className="stat-value">{(stats.totalUsers ?? 0).toLocaleString()}</div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Registered accounts</span>
                </div>
                <div className="stat-breakdown-row">
                  <span className="breakdown-pill" style={{ color: 'var(--color-success)' }}>
                    <CheckCircle2 size={13} /> {stats.activeUsers ?? 0} Active
                  </span>
                  <span className="breakdown-pill" style={{ color: 'var(--color-error)' }}>
                    <AlertTriangle size={13} /> {stats.suspendedUsers ?? 0} Suspended
                  </span>
                </div>
              </div>

              {/* Feed Content Card */}
              <div className="stat-card">
                <div className="stat-card-header">
                  <span className="stat-label">Feed Posts</span>
                  <div className="stat-icon-wrapper icon-posts">
                    <Image size={22} />
                  </div>
                </div>
                <div>
                  <div className="stat-value">{(stats.totalPosts ?? 0).toLocaleString()}</div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Published feed media</span>
                </div>
                <div className="stat-breakdown-row">
                  <span className="breakdown-pill">
                    <MessageSquare size={13} /> {stats.totalComments ?? 0} Comments
                  </span>
                </div>
              </div>

              {/* Video & Stories Card */}
              <div className="stat-card">
                <div className="stat-card-header">
                  <span className="stat-label">Reels & Ephemeral Stories</span>
                  <div className="stat-icon-wrapper icon-reels">
                    <Film size={22} />
                  </div>
                </div>
                <div>
                  <div className="stat-value">{(stats.totalReels ?? 0).toLocaleString()}</div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total short videos</span>
                </div>
                <div className="stat-breakdown-row">
                  <span className="breakdown-pill" style={{ color: '#bc1888' }}>
                    <Clock size={13} /> {stats.activeStories ?? 0} Active Stories
                  </span>
                </div>
              </div>

              {/* Moderation Reports Card */}
              <div className="stat-card">
                <div className="stat-card-header">
                  <span className="stat-label">Moderation Pipeline</span>
                  <div className="stat-icon-wrapper icon-reports">
                    <ShieldAlert size={22} />
                  </div>
                </div>
                <div>
                  <div className="stat-value">{stats.totalReports ?? 0}</div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total filed reports</span>
                </div>
                <div className="stat-breakdown-row">
                  <span className="breakdown-pill" style={{ color: 'var(--color-error)' }}>
                    {stats.openReports ?? 0} Open
                  </span>
                  <span className="breakdown-pill" style={{ color: 'var(--color-success)' }}>
                    {stats.resolvedReports ?? 0} Resolved
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={Activity}
              title="No Statistics Available"
              description="Could not load platform metrics."
              actionLabel="Retry"
              onAction={loadStats}
            />
          )}

          {/* Quick Hub Navigation Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
            <div
              className="stat-card"
              style={{ cursor: 'pointer' }}
              onClick={() => setCurrentTab('USERS')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="stat-icon-wrapper icon-users">
                  <Users size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Manage Platform Users</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Search users, review email verification, promote administrators, and suspend bad actors.
                  </p>
                </div>
              </div>
            </div>

            <NavLink
              to="/admin/reports"
              className="stat-card"
              style={{ textDecoration: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="stat-icon-wrapper icon-reports">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Review Content Reports</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Takedown reported posts, reels, comments, and resolve community complaints.
                  </p>
                </div>
              </div>
            </NavLink>

            <NavLink
              to="/admin/email"
              className="stat-card"
              style={{ textDecoration: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="stat-icon-wrapper icon-posts">
                  <Mail size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Email & Template Studio</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Change dynamic category senders, customize HTML templates, and send deliverability tests.
                  </p>
                </div>
              </div>
            </NavLink>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {currentTab === 'USERS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Filters Bar */}
          <div className="users-filter-bar">
            <div className="users-search-box">
              <Search size={16} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search by username, email, name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-selects-group">
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="DEACTIVATED">DEACTIVATED</option>
              </select>

              <select
                className="filter-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="ROLE_USER">User (ROLE_USER)</option>
                <option value="ROLE_ADMIN">Admin (ROLE_ADMIN)</option>
              </select>

              <button
                type="button"
                className="table-action-btn"
                onClick={() => loadUsers(0)}
              >
                <RefreshCw size={13} className={loadingUsers ? 'spinning' : ''} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="users-table-container">
            {loadingUsers ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
                <LoadingSpinner size="lg" />
              </div>
            ) : users.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No Users Found"
                description="No users matched your search or filter parameters."
              />
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isAdmin = u.role === 'ROLE_ADMIN' || u.role === 'ADMIN';
                    const isActive = u.status === 'ACTIVE';

                    return (
                      <tr key={u.id}>
                        <td>
                          <div className="user-cell">
                            <Avatar
                              src={u.avatarUrl || u.profilePictureUrl}
                              alt={u.username}
                              size="sm"
                            />
                            <div className="user-cell-meta">
                              <span className="user-cell-username">@{u.username}</span>
                              <span className="user-cell-displayname">{u.displayName || u.username}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{u.email}</span>
                            {u.emailVerified ? (
                              <CheckCircle2 size={13} color="var(--color-success)" title="Verified Email" />
                            ) : (
                              <AlertTriangle size={13} color="var(--text-muted)" title="Unverified Email" />
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`role-badge ${isAdmin ? 'role-admin' : 'role-user'}`}>
                            {isAdmin ? 'ADMIN' : 'USER'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge status-${u.status?.toLowerCase() || 'active'}`}>
                            {u.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                          {u.createdAt ? timeAgo(u.createdAt) : 'Recently'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="action-buttons-group" style={{ justifyContent: 'flex-end' }}>
                            {/* Toggle Status */}
                            <button
                              type="button"
                              className={`table-action-btn ${isActive ? 'danger' : 'success'}`}
                              disabled={processingUserId === u.id}
                              onClick={() => handleToggleUserStatus(u)}
                              title={isActive ? 'Suspend User' : 'Reactivate User'}
                            >
                              {isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                              <span>{isActive ? 'Suspend' : 'Reactivate'}</span>
                            </button>

                            {/* Toggle Role */}
                            <button
                              type="button"
                              className="table-action-btn"
                              disabled={processingUserId === u.id}
                              onClick={() => handleToggleUserRole(u)}
                              title={isAdmin ? 'Demote to User' : 'Promote to Admin'}
                            >
                              <ShieldCheck size={14} />
                              <span>{isAdmin ? 'Demote' : 'Make Admin'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="table-pagination">
                <span>
                  Showing page {currentPage + 1} of {totalPages} ({totalElements} users)
                </span>
                <div className="pagination-buttons">
                  <button
                    type="button"
                    className="table-action-btn"
                    disabled={currentPage === 0 || loadingUsers}
                    onClick={() => loadUsers(currentPage - 1)}
                  >
                    <ChevronLeft size={14} />
                    <span>Previous</span>
                  </button>
                  <button
                    type="button"
                    className="table-action-btn"
                    disabled={currentPage >= totalPages - 1 || loadingUsers}
                    onClick={() => loadUsers(currentPage + 1)}
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
