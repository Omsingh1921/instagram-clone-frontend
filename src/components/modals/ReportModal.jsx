import React, { useState } from 'react';
import { Flag } from 'lucide-react';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import adminService from '../../services/admin.service';
import { useToast } from '../../context/ToastContext';
import './ReportModal.css';

const REASON_OPTIONS = [
  { code: 'SPAM', label: 'It is spam' },
  { code: 'INAPPROPRIATE', label: 'Inappropriate or offensive content' },
  { code: 'HARASSMENT', label: 'Harassment or bullying' },
  { code: 'HATE_SPEECH', label: 'Hate speech or discrimination' },
  { code: 'FALSE_INFORMATION', label: 'False or misleading information' },
  { code: 'OTHER', label: 'Something else' },
];

export const ReportModal = ({
  isOpen,
  onClose,
  targetType = 'POST', // 'POST', 'COMMENT', 'USER'
  targetId,
}) => {
  const [reasonCode, setReasonCode] = useState('SPAM');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetId) return;

    try {
      setLoading(true);
      await adminService.createReport({
        targetType,
        targetId,
        reasonCode,
        description: description.trim(),
      });
      showSuccess('Report submitted. Our moderation team will review it.');
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report" size="sm">
      <form onSubmit={handleSubmit} className="report-modal-form">
        <div className="report-intro">
          <Flag size={20} className="report-icon" />
          <p>Why are you reporting this {targetType.toLowerCase()}?</p>
        </div>

        <div className="report-reasons-list">
          {REASON_OPTIONS.map((opt) => (
            <label key={opt.code} className="report-reason-label">
              <input
                type="radio"
                name="reportReason"
                value={opt.code}
                checked={reasonCode === opt.code}
                onChange={() => setReasonCode(opt.code)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>

        <div className="report-desc-field">
          <label htmlFor="report-desc" className="editor-label">Additional Details (Optional)</label>
          <textarea
            id="report-desc"
            className="input report-desc-input"
            rows={3}
            placeholder="Help us understand the context..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="report-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-danger" disabled={loading}>
            {loading ? <LoadingSpinner size="sm" /> : 'Submit Report'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ReportModal;
