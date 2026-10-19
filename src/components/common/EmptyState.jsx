import React from 'react';
import './EmptyState.css';

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`empty-state-container ${className}`}>
      {Icon && (
        <div className="empty-state-icon-box">
          <Icon size={36} className="empty-state-icon" />
        </div>
      )}
      {title && <h3 className="empty-state-title">{title}</h3>}
      {description && <p className="empty-state-description">{description}</p>}
      {actionLabel && onAction && (
        <button type="button" className="btn btn-primary empty-state-btn" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
