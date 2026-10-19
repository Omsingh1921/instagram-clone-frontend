import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Avatar from '../components/common/Avatar';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import { Compass } from 'lucide-react';

describe('Common UI Components Suite', () => {
  it('1. Avatar displays user initials as fallback when image is absent', () => {
    render(<Avatar alt="Alex Mercer" size="md" />);
    expect(screen.getByText('AM')).toBeInTheDocument();
  });

  it('2. Avatar displays story gradient ring when hasStory is true and story is unseen', () => {
    const { container } = render(
      <Avatar alt="Jane Doe" size="lg" hasStory={true} storyViewed={false} />
    );
    expect(container.firstChild).toHaveClass('avatar-ring-unseen');
  });

  it('3. Avatar displays muted ring when storyViewed is true', () => {
    const { container } = render(
      <Avatar alt="Jane Doe" size="lg" hasStory={true} storyViewed={true} />
    );
    expect(container.firstChild).toHaveClass('avatar-ring-viewed');
  });

  it('4. Modal renders children when isOpen is true and calls onClose on Escape', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Dialog">
        <div>Modal Body Content</div>
      </Modal>
    );

    expect(screen.getByText('Test Dialog')).toBeInTheDocument();
    expect(screen.getByText('Modal Body Content')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('5. Modal does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Hidden Dialog">
        <div>Hidden Body</div>
      </Modal>
    );

    expect(screen.queryByText('Hidden Dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Hidden Body')).not.toBeInTheDocument();
  });

  it('6. EmptyState displays icon, title, description, and triggers onAction', () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        icon={Compass}
        title="Nothing Here"
        description="Check back later."
        actionLabel="Explore"
        onAction={onAction}
      />
    );

    expect(screen.getByText('Nothing Here')).toBeInTheDocument();
    expect(screen.getByText('Check back later.')).toBeInTheDocument();

    const btn = screen.getByRole('button', { name: /explore/i });
    fireEvent.click(btn);
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
