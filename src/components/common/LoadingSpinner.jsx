import React from 'react';
import './LoadingSpinner.css';

export const LoadingSpinner = ({ size = 24, text = null }) => {
  return (
    <div className="spinner-wrapper">
      <div
        className="instagram-spinner"
        style={{ width: size, height: size }}
      />
      {text && <span className="spinner-text">{text}</span>}
    </div>
  );
};

export default LoadingSpinner;
