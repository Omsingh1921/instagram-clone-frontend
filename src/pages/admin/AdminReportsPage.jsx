import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
  Mail,
  Trash2,
  UserX,
  Filter,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import adminService from '../../services/admin.service';
import { useToast } from '../../context/ToastContext';
import { timeAgo } from '../../utils';
import './AdminReportsPage.css';

export const AdminReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterTargetType, setFilterTargetType] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Resolution modal state
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolutionStatus, setResolutionStatus] = useState('RESOLVED');
  const [moderationAction, setModerationAction] = useState('NO_ACTION');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submittingResolution, setSubmittingResolution] = useState(false);

  const { showSuccess, showError } = useToast();

  const loadReports = async () => {
    try {
      setLoading(true);
      const statusParam = filterStatus === 'ALL' ? null : filterStatus;
      const targetParam = filterTargetType === 'ALL' ? null : filterTargetType;
      const res = await adminService.getReports(statusParam, targetParam, 0, 50);
      const list = res?.data?.content || res?.content || res?.data || [];
      setReports(list);
    } catch (err) {
      showError(err.message || 'Failed to fetch moderation reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [filterStatus, filterTargetType]);

  const openResolveModal = (report, defaultAction = 'NO_ACTION', defaultStatus = 'RESOLVED') => {
    setSelectedReport(report);
    setModerationAction(defaultAction);
    setResolutionStatus(defaultStatus);
    setResolutionNotes('');
  };

  const closeResolveModal = () => {
    setSelectedReport(null);
    setSubmittingResolution(false);
  };

  const submitResolution = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;

    try {
      setSubmittingResolution(true);
      await adminService.resolveReport(selectedReport.id, {
        status: resolutionStatus,
        action: moderationAction,
        resolutionNotes: resolutionNotes.trim() || 'Processed by admin moderation panel',
      });
      showSuccess(`Report resolved with action: ${moderationAction}`);
      closeResolveModal();
      loadReports();
    } catch (err) {
      showError(err.message || 'Failed to resolve report');
    } finally {
      setSubmittingResolution(false);
    }
  };

  const handleQuickDismiss = async (reportId) => {
    try {
      setProcessingId(reportId);
      await adminService.resolveReport(reportId, {
        status: 'DISMISSED',
        action: 'NO_ACTION',
        resolutionNotes: 'Dismissed: No violation detected',
      });
      showSuccess('Report dismissed');
      loadReports();
    } catch (err) {
      showError(err.message || 'Failed to dismiss report');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="admin-reports-container">
      {/* Top Unified Admin Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <NavLink
            to="/admin"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: '1px solid ' + (isActive ? 'var(--ig-primary-button)' : 'var(--border-primary)'),
              background: isActive ? 'var(--bg-hover)' : 'var(--bg-secondary)',
            })}
          >
            <ShieldCheck size={15} />
            <span>Overview & Users</span>
          </NavLink>
          <NavLink
            to="/admin/reports"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: '1px solid ' + (isActive ? 'var(--ig-primary-button)' : 'var(--border-primary)'),
              background: isActive ? 'var(--bg-hover)' : 'var(--bg-secondary)',
            })}
          >
            <ShieldAlert size={15} />
            <span>Moderation Reports</span>
          </NavLink>
          <NavLink
            to="/admin/email"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: '1px solid ' + (isActive ? 'var(--ig-primary-button)' : 'var(--border-primary)'),
              background: isActive ? 'var(--bg-hover)' : 'var(--bg-secondary)',
            })}
          >
            <Mail size={15} />
            <span>Email & Templates</span>
          </NavLink>
        </div>

        <button
          type="button"
          className="table-action-btn"
          onClick={loadReports}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={13} className={loading ? 'spinning' : ''} />
          <span>Refresh Queue</span>
        </button>
      </div>

      <div className="admin-header-row">
        <h1 className="admin-title">
          <ShieldAlert size={28} color="var(--color-warning)" />
          Content Moderation Queue
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Target Type Filter */}
          <select
            className="filter-select"
            value={filterTargetType}
            onChange={(e) => setFilterTargetType(e.target.value)}
          >
            <option value="ALL">All Content Types</option>
            <option value="POST">Posts</option>
            <option value="REEL">Reels</option>
            <option value="COMMENT">Comments</option>
            <option value="STORY">Stories</option>
            <option value="MESSAGE">Messages</option>
            <option value="USER">User Accounts</option>
          </select>

          {/* Status Filter Pills */}
          <div className="reports-filter-pills">
            {['ALL', 'OPEN', 'REVIEWED', 'RESOLVED', 'DISMISSED'].map((st) => (
              <button
                key={st}
                type="button"
                className={`filter-pill ${filterStatus === st ? 'active' : ''}`}
                onClick={() => setFilterStatus(st)}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <LoadingSpinner size="lg" />
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No Reports in Queue"
          description={`There are currently no ${filterStatus !== 'ALL' ? filterStatus.toLowerCase() : ''} reports matching the selected filters.`}
        />
      ) : (
        <div className="reports-list-table">
          {reports.map((report) => (
            <div key={report.id} className="report-card-item">
              <div className="report-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className={`report-badge ${report.status}`}>{report.status}</span>
                  <span className="role-badge" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-secondary)' }}>
                    {report.targetType}
                  </span>
                  <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                    ID: {report.targetId}
                  </strong>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {timeAgo(report.createdAt)}
                </span>
              </div>

              <div className="report-details-grid">
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Violation Reason:</span>
                  <div style={{ fontWeight: 600, color: 'var(--color-error)' }}>{report.reasonCode}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Reported By:</span>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {report.reporter?.username ? `@${report.reporter.username}` : 'Platform User'}
                  </div>
                </div>
              </div>

              {report.description && (
                <div className="report-desc-box">
                  <strong>Reporter Notes:</strong> {report.description}
                </div>
              )}

              {report.resolutionNotes && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '8px 12px', borderRadius: 'var(--radius-md)' }}>
                  <strong>Resolution:</strong> {report.resolutionNotes}
                </div>
              )}

              {(report.status === 'OPEN' || report.status === 'REVIEWED') && (
                <div className="report-action-buttons">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 14px' }}
                    onClick={() => handleQuickDismiss(report.id)}
                    disabled={processingId === report.id}
                  >
                    <X size={14} style={{ marginRight: '4px' }} />
                    Dismiss
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 14px', color: 'var(--color-warning)' }}
                    onClick={() => openResolveModal(report, 'WARN_USER', 'RESOLVED')}
                    disabled={processingId === report.id}
                  >
                    <AlertTriangle size={14} style={{ marginRight: '4px' }} />
                    Warn User
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: '12px', padding: '6px 14px', background: 'var(--color-error)' }}
                    onClick={() => openResolveModal(report, 'REMOVE_CONTENT', 'RESOLVED')}
                    disabled={processingId === report.id}
                  >
                    <Trash2 size={14} style={{ marginRight: '4px' }} />
                    Takedown Content
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: '12px', padding: '6px 14px' }}
                    onClick={() => openResolveModal(report, 'SUSPEND_USER', 'RESOLVED')}
                    disabled={processingId === report.id}
                  >
                    <UserX size={14} style={{ marginRight: '4px' }} />
                    Suspend Author
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Resolution & Takedown Action Modal */}
      {selectedReport && (
        <Modal
          isOpen={!!selectedReport}
          onClose={closeResolveModal}
          title={`Resolve Report (${selectedReport.targetType})`}
          size="md"
        >
          <form onSubmit={submitResolution} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="editor-label">Resolution Status</label>
              <select
                className="input"
                value={resolutionStatus}
                onChange={(e) => setResolutionStatus(e.target.value)}
              >
                <option value="RESOLVED">RESOLVED (Action Enforced)</option>
                <option value="DISMISSED">DISMISSED (No Penalty)</option>
                <option value="REVIEWED">REVIEWED (Under Review)</option>
              </select>
            </div>

            <div>
              <label className="editor-label">Enforcement Action</label>
              <select
                className="input"
                value={moderationAction}
                onChange={(e) => setModerationAction(e.target.value)}
              >
                <option value="NO_ACTION">NO_ACTION (No penalty)</option>
                <option value="REMOVE_CONTENT">REMOVE_CONTENT (Takedown & delete offending item)</option>
                <option value="SUSPEND_USER">SUSPEND_USER (Suspend author's account)</option>
                <option value="WARN_USER">WARN_USER (Send warning alert to user)</option>
              </select>
            </div>

            <div>
              <label className="editor-label">Resolution Notes & Audit Log</label>
              <textarea
                rows={3}
                className="input"
                placeholder="Explain the moderation decision..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                maxLength={500}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeResolveModal}
                disabled={submittingResolution}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submittingResolution}
              >
                {submittingResolution ? <LoadingSpinner size="sm" /> : 'Confirm Resolution'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminReportsPage;
