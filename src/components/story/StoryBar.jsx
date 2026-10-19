import React, { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import Avatar from '../common/Avatar';
import StoryViewerModal from './StoryViewerModal';
import CreateStoryModal from '../modals/CreateStoryModal';
import storyService from '../../services/story.service';
import { useAuth } from '../../context/AuthContext';
import './StoryBar.css';

export const StoryBar = () => {
  const [groupedStories, setGroupedStories] = useState([]);
  const [activeStoryGroupIdx, setActiveStoryGroupIdx] = useState(null);
  const [createStoryOpen, setCreateStoryOpen] = useState(false);
  const { user: currentUser } = useAuth();

  const loadStoryFeed = useCallback(async () => {
    try {
      const res = await storyService.getStoryFeed();
      const rawData = res?.data?.data || res?.data || res || [];
      const list = Array.isArray(rawData) ? rawData : [];

      const parsedGroups = [];

      list.forEach((item) => {
        if (!item) return;

        // Case A: Backend UserStoriesResponse { user, stories, allViewed }
        if (item.user && Array.isArray(item.stories)) {
          if (item.stories.length === 0) return;
          const author = {
            id: String(item.user.id || item.user.userId || ''),
            username: item.user.username,
            displayName: item.user.displayName || item.user.fullName,
            avatarUrl: item.user.avatarUrl || item.user.profilePictureUrl,
          };
          const hasUnviewed = !item.allViewed || item.stories.some((s) => !s.viewed);
          parsedGroups.push({
            author,
            stories: item.stories,
            hasUnviewed,
          });
          return;
        }

        // Case B: Flat story object { author, mediaUrl, viewed, ... }
        const author = item.author || item.user;
        const authorId = String(author?.id || author?.userId || '');
        if (!authorId) return;

        let existing = parsedGroups.find((g) => String(g.author?.id) === authorId);
        if (!existing) {
          existing = {
            author: {
              id: authorId,
              username: author.username,
              displayName: author.displayName || author.fullName,
              avatarUrl: author.avatarUrl || author.profilePictureUrl,
            },
            stories: [],
            hasUnviewed: false,
          };
          parsedGroups.push(existing);
        }
        existing.stories.push(item);
        if (!item.viewed) {
          existing.hasUnviewed = true;
        }
      });

      setGroupedStories(parsedGroups);
    } catch {
      setGroupedStories([]);
    }
  }, []);

  useEffect(() => {
    loadStoryFeed();

    const handleRefresh = () => loadStoryFeed();
    window.addEventListener('story:refresh', handleRefresh);
    window.addEventListener('feed:refresh', handleRefresh);

    return () => {
      window.removeEventListener('story:refresh', handleRefresh);
      window.removeEventListener('feed:refresh', handleRefresh);
    };
  }, [loadStoryFeed, currentUser?.id]);

  const currentUserIdStr = currentUser?.id ? String(currentUser.id) : null;
  const myGroup = currentUserIdStr
    ? groupedStories.find((g) => String(g.author?.id) === currentUserIdStr)
    : null;
  const otherGroups = currentUserIdStr
    ? groupedStories.filter((g) => String(g.author?.id) !== currentUserIdStr)
    : groupedStories;

  const handleMyStoryClick = () => {
    if (myGroup && myGroup.stories?.length > 0) {
      const myIdx = groupedStories.indexOf(myGroup);
      setActiveStoryGroupIdx(myIdx >= 0 ? myIdx : 0);
    } else {
      setCreateStoryOpen(true);
    }
  };

  return (
    <>
      <div className="story-bar-container">
        {/* Current User Story Item */}
        <div className="story-bar-item">
          <div className="story-avatar-holder" onClick={handleMyStoryClick}>
            <Avatar
              src={currentUser?.avatarUrl || currentUser?.profilePictureUrl || myGroup?.author?.avatarUrl}
              alt="Your story"
              size="lg"
              hasStory={!!myGroup && myGroup.stories?.length > 0}
              storyViewed={myGroup ? !myGroup.hasUnviewed : false}
            />
            <div
              className="add-story-badge"
              onClick={(e) => {
                e.stopPropagation();
                setCreateStoryOpen(true);
              }}
              title="Add to story"
            >
              <Plus size={12} strokeWidth={3} />
            </div>
          </div>
          <span className="story-username-label">Your story</span>
        </div>

        {/* Other Users' Stories */}
        {otherGroups.map((group) => {
          const groupIdx = groupedStories.indexOf(group);
          return (
            <button
              key={group.author?.id}
              type="button"
              className="story-bar-item"
              onClick={() => setActiveStoryGroupIdx(groupIdx >= 0 ? groupIdx : 0)}
            >
              <div className="story-avatar-holder">
                <Avatar
                  src={(group.author?.avatarUrl || group.author?.profilePictureUrl)}
                  alt={group.author?.username}
                  size="lg"
                  hasStory={true}
                  storyViewed={!group.hasUnviewed}
                />
              </div>
              <span className="story-username-label">{group.author?.username}</span>
            </button>
          );
        })}
      </div>

      {/* Story Viewer Modal */}
      {activeStoryGroupIdx !== null && (
        <StoryViewerModal
          isOpen={activeStoryGroupIdx !== null}
          storyGroups={groupedStories}
          initialGroupIdx={activeStoryGroupIdx}
          onClose={() => {
            setActiveStoryGroupIdx(null);
            loadStoryFeed();
          }}
        />
      )}

      {/* Create Story Modal */}
      {createStoryOpen && (
        <CreateStoryModal
          isOpen={createStoryOpen}
          onClose={() => setCreateStoryOpen(false)}
          onStoryCreated={() => {
            loadStoryFeed();
          }}
        />
      )}
    </>
  );
};

export default StoryBar;
