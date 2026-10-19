import React, { useState, useRef } from 'react';
import { Video, X } from 'lucide-react';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import mediaService from '../../services/media.service';
import reelService from '../../services/reel.service';
import { useToast } from '../../context/ToastContext';
import './CreatePostModal.css';

export const CreateReelModal = ({ isOpen, onClose, onReelCreated }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const { showSuccess, showError } = useToast();

  const handleClose = () => {
    setFile(null);
    setPreviewUrl('');
    setCaption('');
    setLoading(false);
    onClose();
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('video/')) {
      showError('Please select a video file for your reel.');
      return;
    }
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    try {
      setLoading(true);
      const uploadRes = await mediaService.uploadMedia(file, 'reels');
      const mediaUrl = uploadRes?.secureUrl || uploadRes?.data?.secureUrl || uploadRes?.url || uploadRes?.data?.url;
      const thumbnailUrl = uploadRes?.data?.thumbnailUrl || uploadRes?.thumbnailUrl || mediaUrl;
      const durationMs = uploadRes?.data?.duration ? Math.round(uploadRes.data.duration * 1000) : 15000;

      await reelService.createReel({
        videoUrl: mediaUrl,
        thumbnailUrl: thumbnailUrl,
        caption: caption.trim(),
        durationMs: durationMs,
      });

      showSuccess('Reel uploaded successfully!');
      handleClose();
      if (onReelCreated) onReelCreated();
    } catch (err) {
      showError(err.message || 'Failed to create reel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Reel" size="lg">
      <form onSubmit={handleSubmit} className="create-post-container">
        {!previewUrl ? (
          <div className="file-dropzone" onClick={() => fileInputRef.current?.click()}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
              accept="video/*"
              style={{ display: 'none' }}
            />
            <div className="dropzone-content">
              <div className="upload-icon-circle reel-icon">
                <Video size={40} />
              </div>
              <h3 className="dropzone-title">Upload a Reel Video</h3>
              <p className="dropzone-subtitle">Vertical short videos up to 90 seconds (MP4, WEBM)</p>
              <button type="button" className="btn btn-primary dropzone-browse-btn">
                Select Video
              </button>
            </div>
          </div>
        ) : (
          <div className="create-post-editor">
            <div className="editor-media-preview">
              <video src={previewUrl} controls className="preview-media" autoPlay loop muted />
              <button type="button" className="change-media-btn" onClick={() => setPreviewUrl('')}>
                <X size={18} />
              </button>
            </div>
            <div className="editor-details-pane">
              <div className="editor-form-group">
                <label htmlFor="reel-caption" className="editor-label">Caption</label>
                <textarea
                  id="reel-caption"
                  rows={6}
                  className="input editor-caption-input"
                  placeholder="Write a caption for your reel..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={2200}
                />
              </div>
              <div className="editor-actions">
                <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <LoadingSpinner size="sm" /> : 'Share Reel'}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default CreateReelModal;
