import React, { useState, useEffect } from 'react';
import './Avatar.css';

export const Avatar = ({
  src,
  alt = 'User',
  size = 'md',
  hasStory = false,
  storyViewed = false,
  onClick,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const ringClass = hasStory
    ? storyViewed
      ? 'avatar-ring-viewed'
      : 'avatar-ring-unseen'
    : '';

  return (
    <div
      className={`avatar-wrapper avatar-${size} ${ringClass} ${className}`}
      onClick={onClick}
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={alt}
          className="avatar-image"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : (
        <div className="avatar-fallback" aria-label={alt}>
          {getInitials(alt)}
        </div>
      )}
    </div>
  );
};

export default Avatar;
