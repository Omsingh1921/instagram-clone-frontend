import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import adminService from '../services/admin.service';
import { ToastProvider } from '../context/ToastContext';

// Mock adminService
vi.mock('../services/admin.service', () => ({
  default: {
    getStats: vi.fn(),
    getUsers: vi.fn(),
    updateUserStatus: vi.fn(),
    updateUserRole: vi.fn(),
  },
}));

const mockStats = {
  totalUsers: 1420,
  activeUsers: 1390,
  suspendedUsers: 25,
  deactivatedUsers: 5,
  totalPosts: 8520,
  totalComments: 31200,
  totalReels: 4210,
  activeStories: 340,
  totalReports: 78,
  openReports: 12,
  reviewedReports: 14,
  resolvedReports: 45,
  dismissedReports: 7,
};

const mockUsersPage = {
  content: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      username: 'john_doe',
      displayName: 'John Doe',
      email: 'john@example.com',
      emailVerified: true,
      role: 'ROLE_USER',
      status: 'ACTIVE',
      createdAt: '2026-10-10T12:00:00Z',
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      username: 'sarah_admin',
      displayName: 'Sarah Admin',
      email: 'sarah@example.com',
      emailVerified: true,
      role: 'ROLE_ADMIN',
      status: 'ACTIVE',
      createdAt: '2026-10-01T12:00:00Z',
    },
  ],
  totalPages: 1,
  totalElements: 2,
};

describe('Admin Dashboard & User Management Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.getStats.mockResolvedValue({ data: mockStats });
    adminService.getUsers.mockResolvedValue({ data: mockUsersPage });
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <ToastProvider>
          <AdminDashboardPage />
        </ToastProvider>
      </MemoryRouter>
    );
  };

  it('renders Admin Dashboard overview and loads system KPI metrics cards', async () => {
    renderComponent();

    expect(screen.getByText('Admin Control Center')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Overview & Analytics/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /User Management/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(adminService.getStats).toHaveBeenCalled();
      expect(screen.getByText('1,420')).toBeInTheDocument(); // Total users
      expect(screen.getByText('8,520')).toBeInTheDocument(); // Total posts
      expect(screen.getByText('4,210')).toBeInTheDocument(); // Total reels
      expect(screen.getByText('78')).toBeInTheDocument();    // Total reports
    });
  });

  it('switches to User Management tab and loads user list table', async () => {
    renderComponent();

    const usersTab = screen.getByRole('button', { name: /User Management/i });
    fireEvent.click(usersTab);

    await waitFor(() => {
      expect(adminService.getUsers).toHaveBeenCalled();
      expect(screen.getByText('@john_doe')).toBeInTheDocument();
      expect(screen.getByText('@sarah_admin')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });
  });

  it('suspends an active user when Suspend button is clicked', async () => {
    adminService.updateUserStatus.mockResolvedValue({ success: true });
    renderComponent();

    const usersTab = screen.getByRole('button', { name: /User Management/i });
    fireEvent.click(usersTab);

    await waitFor(() => {
      expect(screen.getByText('@john_doe')).toBeInTheDocument();
    });

    const suspendButtons = screen.getAllByRole('button', { name: /Suspend/i });
    fireEvent.click(suspendButtons[0]);

    await waitFor(() => {
      expect(adminService.updateUserStatus).toHaveBeenCalledWith(
        '11111111-1111-1111-1111-111111111111',
        expect.objectContaining({ status: 'SUSPENDED' })
      );
    });
  });

  it('promotes a user to admin when Make Admin button is clicked', async () => {
    adminService.updateUserRole.mockResolvedValue({ success: true });
    renderComponent();

    const usersTab = screen.getByRole('button', { name: /User Management/i });
    fireEvent.click(usersTab);

    await waitFor(() => {
      expect(screen.getByText('@john_doe')).toBeInTheDocument();
    });

    const makeAdminBtn = screen.getByRole('button', { name: /Make Admin/i });
    fireEvent.click(makeAdminBtn);

    await waitFor(() => {
      expect(adminService.updateUserRole).toHaveBeenCalledWith(
        '11111111-1111-1111-1111-111111111111',
        expect.objectContaining({ role: 'ROLE_ADMIN' })
      );
    });
  });
});
