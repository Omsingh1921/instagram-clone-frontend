import React, { useState, useRef } from 'react';
import { UploadCloud, X } from 'lucide-react';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import mediaService from '../../services/media.service';
import storyService from '../../services/story.service';
import { useToast } from '../../context/ToastContext';
import './CreatePostModal.css';

export const CreateStoryModal = ({ isOpen, onClose, onStoryCreated }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const { showSuccess, showError } = useToast();

  const handleClose = () => {
    setFile(null);
    setPreviewUrl('');
    setLoading(false);
    onClose();
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    try {
      setLoading(true);
      const uploadRes = await mediaService.uploadMedia(file, 'stories');
      const mediaUrl = uploadRes?.secureUrl || uploadRes?.data?.secureUrl || uploadRes?.url || uploadRes?.data?.url;
      const mediaType = file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';

      await storyService.createStory({ mediaUrl, mediaType });
      showSuccess('Story added! It will be visible for 24 hours.');
      window.dispatchEvent(new CustomEvent('story:refresh'));
      handleClose();
      if (onStoryCreated) onStoryCreated();
    } catch (err) {
      showError(err.message || 'Failed to upload story');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add to Story" size="md">
      <form onSubmit={handleSubmit} className="create-post-container">
        {!previewUrl ? (
          <div className="file-dropzone" onClick={() => fileInputRef.current?.click()}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
              accept="image/*,video/*"
              style={{ display: 'none' }}
            />
            <div className="dropzone-content">
              <div className="upload-icon-circle story-icon">
                <UploadCloud size={40} />
              </div>
              <h3 className="dropzone-title">Upload a Story</h3>
              <p className="dropzone-subtitle">Photos and videos that expire in 24 hours</p>
              <button type="button" className="btn btn-primary dropzone-browse-btn">
                Select Photo or Video
              </button>
            </div>
          </div>
        ) : (
          <div className="create-post-editor" style={{ flexDirection: 'column', height: 'auto' }}>
            <div className="editor-media-preview" style={{ height: '360px' }}>
              {file?.type.startsWith('video/') ? (
                <video src={previewUrl} controls className="preview-media" />
              ) : (
                <img src={previewUrl} alt="Story preview" className="preview-media" />
              )}
              <button type="button" className="change-media-btn" onClick={() => setPreviewUrl('')}>
                <X size={18} />
              </button>
            </div>
            <div className="editor-actions" style={{ padding: '16px' }}>
              <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <LoadingSpinner size="sm" /> : 'Share to Story'}
              </button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default CreateStoryModal;
