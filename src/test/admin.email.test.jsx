import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminEmailDashboard from '../pages/admin/AdminEmailDashboard';
import adminService from '../services/admin.service';
import { ToastProvider } from '../context/ToastContext';

// Mock adminService
vi.mock('../services/admin.service', () => ({
  default: {
    getEmailConfigs: vi.fn(),
    getEmailConfigByCategory: vi.fn(),
    updateEmailConfig: vi.fn(),
    sendTestEmail: vi.fn(),
    getEmailTemplates: vi.fn(),
    getEmailTemplateByType: vi.fn(),
    updateEmailTemplate: vi.fn(),
    previewEmailTemplate: vi.fn(),
    resetEmailTemplate: vi.fn(),
  },
}));

const mockConfigs = [
  {
    category: 'ACCOUNT',
    purposeName: 'Account & Authentication',
    description: 'Handles verification and password resets',
    fromEmail: 'accounts@instagram.com',
    senderName: 'Instagram Accounts',
    isEnabled: true,
  },
  {
    category: 'SECURITY',
    purposeName: 'Security Alerts',
    description: 'Handles OTP and login alerts',
    fromEmail: 'security@instagram.com',
    senderName: 'Instagram Security',
    isEnabled: true,
  },
];

const mockTemplates = [
  {
    emailType: 'WELCOME',
    templateName: 'Welcome Email',
    category: 'ACCOUNT',
    subjectTemplate: 'Welcome to Instagram, {{username}}!',
    bodyHtmlTemplate: '<h3>Welcome {{username}}</h3>',
    bodyTextTemplate: 'Welcome {{username}}',
    availablePlaceholders: ['{{username}}', '{{exploreUrl}}'],
    isActive: true,
  },
  {
    emailType: 'EMAIL_OTP',
    templateName: 'OTP Code',
    category: 'SECURITY',
    subjectTemplate: 'Your code is {{otpCode}}',
    bodyHtmlTemplate: '<p>Code: {{otpCode}}</p>',
    bodyTextTemplate: 'Code: {{otpCode}}',
    availablePlaceholders: ['{{username}}', '{{otpCode}}', '{{validityMinutes}}'],
    isActive: true,
  },
];

describe('Admin Email & Template Control Center Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.getEmailConfigs.mockResolvedValue({ data: mockConfigs });
    adminService.getEmailTemplates.mockResolvedValue({ data: mockTemplates });
    adminService.previewEmailTemplate.mockResolvedValue({
      data: {
        renderedSubject: 'Welcome to Instagram, alex_designer!',
        renderedHtml: '<div>Mock Rendered HTML</div>',
        renderedText: 'Mock Rendered Text',
      },
    });
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <ToastProvider>
          <AdminEmailDashboard />
        </ToastProvider>
      </MemoryRouter>
    );
  };

  it('renders Admin Email Dashboard and displays dynamic sender configurations by default', async () => {
    renderComponent();

    expect(screen.getByText('Email & Communication Studio')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sender Configurations/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dynamic Template Studio/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Account & Authentication')).toBeInTheDocument();
      expect(screen.getByText('accounts@instagram.com')).toBeInTheDocument();
      expect(screen.getByText('Security Alerts')).toBeInTheDocument();
      expect(screen.getByText('security@instagram.com')).toBeInTheDocument();
    });
  });

  it('switches to Dynamic Template Studio tab and loads template editor and placeholder tags', async () => {
    renderComponent();

    const templateTab = screen.getByRole('button', { name: /Dynamic Template Studio/i });
    fireEvent.click(templateTab);

    await waitFor(() => {
      expect(adminService.getEmailTemplates).toHaveBeenCalled();
      expect(screen.getAllByText('Welcome Email').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Email Subject Template')).toBeInTheDocument();
      expect(screen.getByText('HTML Body Template')).toBeInTheDocument();
      expect(screen.getByText('Live Email Preview')).toBeInTheDocument();
    });
  });

  it('inserts variable tags into HTML template when a placeholder chip is clicked', async () => {
    renderComponent();

    const templateTab = screen.getByRole('button', { name: /Dynamic Template Studio/i });
    fireEvent.click(templateTab);

    await waitFor(() => {
      expect(screen.getByTitle('Click to append {{username}}')).toBeInTheDocument();
    });

    const placeholderButton = screen.getByTitle('Click to append {{username}}');
    fireEvent.click(placeholderButton);

    const textarea = screen.getByLabelText('HTML Body Template');
    expect(textarea.value).toContain('{{username}}');
  });

  it('calls sendTestEmail service when test email dialog is submitted', async () => {
    adminService.sendTestEmail.mockResolvedValue({ success: true });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Account & Authentication')).toBeInTheDocument();
    });

    const sendTestBtn = screen.getByText('Send Test Email');
    fireEvent.click(sendTestBtn);

    expect(screen.getByText('Send Live Deliverability Test Email')).toBeInTheDocument();

    const recipientInput = screen.getByPlaceholderText('your-email@example.com');
    fireEvent.change(recipientInput, { target: { value: 'admin-test@example.com' } });

    const submitBtn = screen.getByRole('button', { name: /Send Live Test/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(adminService.sendTestEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientEmail: 'admin-test@example.com',
          category: 'ACCOUNT',
        })
      );
    });
  });
});
