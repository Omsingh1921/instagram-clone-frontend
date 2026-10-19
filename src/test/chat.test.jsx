import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import chatService from '../services/chat.service';
import MessagesPage from '../pages/MessagesPage';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

// Mock dependencies
vi.mock('../services/chat.service', () => ({
  default: {
    getConversations: vi.fn(),
    getOrCreateDirectConversation: vi.fn(),
    getConversationById: vi.fn(),
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
    markAsRead: vi.fn().mockResolvedValue({ success: true }),
  },
}));

vi.mock('../services/user.service', () => ({
  default: {
    getCurrentUser: vi.fn().mockResolvedValue({
      data: {
        userId: '11111111-1111-1111-1111-111111111111',
        username: 'test1',
        displayName: 'Test One',
      },
    }),
    searchUsers: vi.fn().mockResolvedValue({ data: { content: [] } }),
  },
}));

vi.mock('../services/websocket', () => ({
  default: {
    connect: vi.fn(),
    subscribe: vi.fn(() => () => {}),
    send: vi.fn(),
  },
}));

describe('Chat & Messages Suite', () => {
  const mockUser = {
    id: '11111111-1111-1111-1111-111111111111',
    userId: '11111111-1111-1111-1111-111111111111',
    username: 'test1',
  };

  const mockOtherUser = {
    id: '22222222-2222-2222-2222-222222222222',
    username: 'test2',
    displayName: 'Test Two',
    avatarUrl: '/uploads/avatar2.jpg',
  };

  const mockConversation = {
    id: '33333333-3333-3333-3333-333333333333',
    members: [mockUser, mockOtherUser],
    lastMessage: { content: 'hello from test2', createdAt: new Date().toISOString() },
    unreadCount: 0,
  };

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('access_token', 'mock_jwt_token');
  });

  it('renders conversations sidebar and placeholder correctly', async () => {
    chatService.getConversations.mockResolvedValueOnce({
      data: { content: [mockConversation] },
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <MessagesPage />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    // Initial placeholder when no conversation is active
    expect(await screen.findByText('Your Messages')).toBeInTheDocument();
    expect(await screen.findByText('Test Two')).toBeInTheDocument();
  });

  it('shows single right tick on sent message when recipient has not yet read', async () => {
    chatService.getConversations.mockResolvedValueOnce({
      data: { content: [mockConversation] },
    });

    // Only user A sent a message, recipient has not seen or replied
    chatService.getMessages.mockResolvedValueOnce({
      data: {
        content: [
          {
            id: 'msg-unseen',
            sender: mockUser,
            content: 'Unread by test2',
            createdAt: '2026-10-05T12:10:00',
            status: 'sent',
          },
        ],
      },
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <MessagesPage />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    const convItems = await screen.findAllByText('Test Two');
    const convItem = convItems[0];
    fireEvent.click(convItem);

    expect(await screen.findByText('Unread by test2')).toBeInTheDocument();

    const msgBubble = screen.getByText('Unread by test2').closest('.message-bubble');
    expect(msgBubble).toHaveClass('mine');

    // Single right tick should be present
    const singleCheck = msgBubble.querySelector('.status-check-single');
    expect(singleCheck).toBeInTheDocument();
  });

  it('shows double right tick when recipient replied or seen', async () => {
    chatService.getConversations.mockResolvedValueOnce({
      data: { content: [mockConversation] },
    });

    // msg-1 is seen because msg-2 was sent by other user afterwards
    chatService.getMessages.mockResolvedValueOnce({
      data: {
        content: [
          {
            id: 'msg-2',
            sender: mockOtherUser,
            content: 'I see your message',
            createdAt: '2026-10-05T12:05:00',
          },
          {
            id: 'msg-1',
            sender: mockUser,
            content: 'Sent earlier',
            createdAt: '2026-10-05T12:00:00',
          },
        ],
      },
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <MessagesPage />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    const convItems = await screen.findAllByText('Test Two');
    const convItem = convItems[0];
    fireEvent.click(convItem);

    expect(await screen.findByText('Sent earlier')).toBeInTheDocument();
    expect(await screen.findByText('I see your message')).toBeInTheDocument();

    const sentBubble = screen.getByText('Sent earlier').closest('.message-bubble');
    expect(sentBubble).toHaveClass('mine');

    // Double right tick should be present
    const doubleCheck = sentBubble.querySelector('.status-check-double');
    expect(doubleCheck).toBeInTheDocument();
  });
});
