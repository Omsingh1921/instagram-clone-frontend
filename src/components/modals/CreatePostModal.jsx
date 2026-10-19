import React, { useState, useRef } from 'react';
import { UploadCloud, X, Globe, Lock } from 'lucide-react';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import postService from '../../services/post.service';
import { useToast } from '../../context/ToastContext';
import './CreatePostModal.css';

export const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const { showSuccess, showError } = useToast();

  const resetForm = () => {
    setFile(null);
    setPreviewUrl('');
    setCaption('');
    setVisibility('PUBLIC');
    setLoading(false);
    setIsDragOver(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    const isImage = selectedFile.type.startsWith('image/');
    const isVideo = selectedFile.type.startsWith('video/');

    if (!isImage && !isVideo) {
      showError('Please select a valid image or video file.');
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      showError('File size exceeds the 50MB limit.');
      return;
    }

    setFile(selectedFile);
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      showError('Please select a photo or video to upload.');
      return;
    }

    try {
      setLoading(true);
      const uploadRes = await postService.uploadMedia(file, 'posts');
      const mediaUrl = uploadRes?.secureUrl || uploadRes?.data?.secureUrl || uploadRes?.data?.mediaUrl || uploadRes?.mediaUrl;
      const mediaType = uploadRes?.data?.mediaType || uploadRes?.mediaType || (file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE');

      if (!mediaUrl) {
        throw new Error('Media upload did not return a valid URL');
      }

      const postPayload = {
        caption: caption.trim(),
        visibility,
        media: [
          {
            mediaUrl,
            mediaType,
            displayOrder: 0,
            width: uploadRes?.data?.width || 1080,
            height: uploadRes?.data?.height || 1080,
          },
        ],
      };

      await postService.createPost(postPayload);
      showSuccess('Post created successfully!');
      handleClose();
      if (onPostCreated) onPostCreated();
    } catch (err) {
      showError(err.message || 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Post" size="lg">
      <form onSubmit={handleSubmit} className="create-post-container">
        {!previewUrl ? (
          <div
            className={`file-dropzone ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
              accept="image/*,video/*"
              style={{ display: 'none' }}
            />
            <div className="dropzone-content">
              <div className="upload-icon-circle">
                <UploadCloud size={40} />
              </div>
              <h3 className="dropzone-title">Drag photos and videos here</h3>
              <p className="dropzone-subtitle">Supports JPG, PNG, WEBP, and MP4 up to 50MB</p>
              <button
                type="button"
                className="btn btn-primary dropzone-browse-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Select from computer
              </button>
            </div>
          </div>
        ) : (
          <div className="create-post-editor">
            <div className="editor-media-preview">
              {file?.type.startsWith('video/') ? (
                <video src={previewUrl} controls className="preview-media" />
              ) : (
                <img src={previewUrl} alt="Upload preview" className="preview-media" />
              )}
              <button
                type="button"
                className="change-media-btn"
                onClick={() => { setFile(null); setPreviewUrl(''); }}
                title="Choose different media"
              >
                <X size={18} />
              </button>
            </div>

            <div className="editor-details-pane">
              <div className="editor-form-group">
                <label htmlFor="post-caption" className="editor-label">Caption</label>
                <textarea
                  id="post-caption"
                  rows={6}
                  className="input editor-caption-input"
                  placeholder="Write a caption... Use #hashtags and @mentions"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={2200}
                />
                <div className="caption-char-count">{caption.length}/2200</div>
              </div>

              <div className="editor-form-group">
                <label className="editor-label">Audience</label>
                <div className="visibility-selector">
                  <button
                    type="button"
                    className={`vis-option ${visibility === 'PUBLIC' ? 'active' : ''}`}
                    onClick={() => setVisibility('PUBLIC')}
                  >
                    <Globe size={16} />
                    <span>Public</span>
                  </button>
                  <button
                    type="button"
                    className={`vis-option ${visibility === 'PRIVATE' ? 'active' : ''}`}
                    onClick={() => setVisibility('PRIVATE')}
                  >
                    <Lock size={16} />
                    <span>Followers only</span>
                  </button>
                </div>
              </div>

              <div className="editor-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? <LoadingSpinner size="sm" /> : 'Share Post'}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default CreatePostModal;
