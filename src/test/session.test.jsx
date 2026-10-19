import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import SettingsPage from '../pages/settings/SettingsPage';
import sessionService from '../services/session.service';
import userService from '../services/user.service';
import settingsService from '../services/settings.service';
import authService from '../services/auth.service';

vi.mock('../services/session.service', () => ({
  default: {
    getActiveSessions: vi.fn(),
    revokeSession: vi.fn(),
    revokeOtherSessions: vi.fn(),
    logoutAll: vi.fn(),
  },
}));

vi.mock('../services/userService', () => ({
  default: {
    getCurrentUser: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

vi.mock('../services/user.service', () => ({
  default: {
    getCurrentUser: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

vi.mock('../services/settings.service', () => ({
  default: {
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
    changePassword: vi.fn(),
    getBlockedUsers: vi.fn(),
    unblockUser: vi.fn(),
  },
}));

vi.mock('../services/auth.service', () => ({
  default: {
    logout: vi.fn(),
    refreshToken: vi.fn(),
  },
}));

vi.mock('../services/follow.service', () => ({
  default: {
    getFollowing: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

const mockUser = {
  id: '00000000-0000-0000-0000-000000000001',
  userId: '00000000-0000-0000-0000-000000000001',
  username: 'testpilot',
  displayName: 'Test Pilot',
  email: 'pilot@example.com',
};

const mockSessions = [
  {
    sessionId: '11111111-1111-1111-1111-111111111111',
    deviceName: 'Chrome on Windows',
    ipAddress: '192.168.1.xxx',
    createdAt: '2026-10-14T10:00:00Z',
    lastActivityAt: '2026-10-14T12:00:00Z',
    expiresAt: '2026-10-21T10:00:00Z',
    current: true,
  },
  {
    sessionId: '22222222-2222-2222-2222-222222222222',
    deviceName: 'Safari on iPhone',
    ipAddress: '10.0.0.xxx',
    createdAt: '2026-10-13T08:00:00Z',
    lastActivityAt: '2026-10-14T09:30:00Z',
    expiresAt: '2026-10-20T08:00:00Z',
    current: false,
  },
];

describe('Frontend Session Management & Settings Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('access_token', 'test-access-token');
    localStorage.setItem('refresh_token', 'test-refresh-token');

    userService.getCurrentUser.mockResolvedValue({ data: mockUser });
    settingsService.getSettings.mockResolvedValue({
      data: { privateAccount: false, notifyLikes: true },
    });
    settingsService.getBlockedUsers.mockResolvedValue({ data: [] });
    sessionService.getActiveSessions.mockResolvedValue({ data: mockSessions });
  });

  const renderSettings = () =>
    render(
      <MemoryRouter>
        <AuthProvider>
          <ToastProvider>
            <SettingsPage />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    );

  it('1. Renders Login Activity navigation tab and fetches active sessions', async () => {
    renderSettings();

    const sessionTabBtn = await screen.findByRole('button', { name: /login activity/i });
    expect(sessionTabBtn).toBeInTheDocument();

    fireEvent.click(sessionTabBtn);

    await waitFor(() => {
      expect(sessionService.getActiveSessions).toHaveBeenCalled();
      expect(screen.getByText('Active Sessions')).toBeInTheDocument();
      expect(screen.getByText('Chrome on Windows')).toBeInTheDocument();
      expect(screen.getByText('Safari on iPhone')).toBeInTheDocument();
    });
  });

  it('2. Correctly marks the current device and suppresses revoke button on it', async () => {
    renderSettings();

    const sessionTabBtn = await screen.findByRole('button', { name: /login activity/i });
    fireEvent.click(sessionTabBtn);

    await waitFor(() => {
      expect(screen.getByText('This Device')).toBeInTheDocument();
      expect(screen.getByText(/active now/i)).toBeInTheDocument();
    });

    // Remote session has a "Log Out" button, but current session does not
    const logoutButtons = screen.getAllByRole('button', { name: /^log out$/i });
    expect(logoutButtons).toHaveLength(1); // Only for Safari on iPhone
  });

  it('3. Revokes a single remote session and refreshes session list', async () => {
    sessionService.revokeSession.mockResolvedValueOnce({ success: true });

    renderSettings();

    const sessionTabBtn = await screen.findByRole('button', { name: /login activity/i });
    fireEvent.click(sessionTabBtn);

    await waitFor(() => {
      expect(screen.getByText('Safari on iPhone')).toBeInTheDocument();
    });

    sessionService.getActiveSessions.mockResolvedValue({ data: [mockSessions[0]] });

    const revokeBtn = screen.getByRole('button', { name: /^log out$/i });
    fireEvent.click(revokeBtn);

    await waitFor(() => {
      expect(sessionService.revokeSession).toHaveBeenCalledWith('22222222-2222-2222-2222-222222222222');
      expect(screen.queryByText('Safari on iPhone')).not.toBeInTheDocument();
    });
  });

  it('4. Confirms and revokes other sessions via modal', async () => {
    sessionService.revokeOtherSessions.mockResolvedValueOnce({
      data: { revokedCount: 1 },
    });

    renderSettings();

    const sessionTabBtn = await screen.findByRole('button', { name: /login activity/i });
    fireEvent.click(sessionTabBtn);

    await waitFor(() => {
      expect(screen.getByText('Safari on iPhone')).toBeInTheDocument();
    });

    const logoutOthersBtn = screen.getByRole('button', { name: /log out other devices/i });
    fireEvent.click(logoutOthersBtn);

    // Modal appears
    expect(screen.getByText(/log out other devices\?/i)).toBeInTheDocument();
    expect(
      screen.getByText(/you will be signed out on all other web and mobile devices/i)
    ).toBeInTheDocument();

    sessionService.getActiveSessions.mockResolvedValue({ data: [mockSessions[0]] });

    // Confirm revoke
    const confirmBtn = screen.getByRole('button', { name: /log out others/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(sessionService.revokeOtherSessions).toHaveBeenCalledTimes(1);
      expect(screen.queryByText(/log out other devices\?/i)).not.toBeInTheDocument();
      expect(screen.queryByText('Safari on iPhone')).not.toBeInTheDocument();
    });
  });

  it('5. Confirms and logs out of all sessions, invoking auth logout', async () => {
    sessionService.logoutAll.mockResolvedValueOnce({ success: true });

    renderSettings();

    const sessionTabBtn = await screen.findByRole('button', { name: /login activity/i });
    fireEvent.click(sessionTabBtn);

    const logoutAllBtn = await screen.findByRole('button', { name: /log out of all/i });
    fireEvent.click(logoutAllBtn);

    // Modal appears
    expect(screen.getByText(/log out of all devices\?/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /log out all/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(sessionService.logoutAll).toHaveBeenCalledTimes(1);
      expect(localStorage.getItem('access_token')).toBeNull();
    });
  });

  it('6. Handles session loading error and supports retry', async () => {
    sessionService.getActiveSessions
      .mockRejectedValueOnce(new Error('Network error loading sessions'))
      .mockResolvedValueOnce({ data: mockSessions });

    renderSettings();

    const sessionTabBtn = await screen.findByRole('button', { name: /login activity/i });
    fireEvent.click(sessionTabBtn);

    await waitFor(() => {
      const errors = screen.getAllByText('Network error loading sessions');
      expect(errors.length).toBeGreaterThan(0);
    });

    const retryBtn = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('Chrome on Windows')).toBeInTheDocument();
    });
  });

  it('7. Displays empty state when no active sessions are returned', async () => {
    sessionService.getActiveSessions.mockResolvedValue({ data: [] });

    renderSettings();

    const sessionTabBtn = await screen.findByRole('button', { name: /login activity/i });
    fireEvent.click(sessionTabBtn);

    await waitFor(() => {
      expect(screen.getByText('No Active Sessions')).toBeInTheDocument();
    });
  });
});
