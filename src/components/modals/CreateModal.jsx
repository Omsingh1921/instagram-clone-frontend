import React from 'react';
import { Image, Video, Film } from 'lucide-react';
import Modal from '../common/Modal';
import './CreateModal.css';

export const CreateModal = ({
  isOpen,
  onClose,
  onSelectPost,
  onSelectStory,
  onSelectReel,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New" size="sm">
      <div className="create-menu-options">
        <button
          type="button"
          className="create-menu-item"
          onClick={() => {
            onClose();
            onSelectPost();
          }}
        >
          <div className="create-item-icon-box post-icon">
            <Image size={24} />
          </div>
          <div className="create-item-info">
            <span className="create-item-title">Post</span>
            <span className="create-item-desc">Share photos or videos to your feed</span>
          </div>
        </button>

        <button
          type="button"
          className="create-menu-item"
          onClick={() => {
            onClose();
            onSelectStory();
          }}
        >
          <div className="create-item-icon-box story-icon">
            <Film size={24} />
          </div>
          <div className="create-item-info">
            <span className="create-item-title">Story</span>
            <span className="create-item-desc">Disappears from your profile in 24 hours</span>
          </div>
        </button>

        <button
          type="button"
          className="create-menu-item"
          onClick={() => {
            onClose();
            onSelectReel();
          }}
        >
          <div className="create-item-icon-box reel-icon">
            <Video size={24} />
          </div>
          <div className="create-item-info">
            <span className="create-item-title">Reel</span>
            <span className="create-item-desc">Short immersive video with sound</span>
          </div>
        </button>
      </div>
    </Modal>
  );
};

export default CreateModal;
