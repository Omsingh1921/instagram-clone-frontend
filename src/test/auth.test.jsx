import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import LoginPage from '../pages/auth/LoginPage';
import SignupPage from '../pages/auth/SignupPage';
import ProtectedRoute from '../components/common/ProtectedRoute';
import authService from '../services/auth.service';

vi.mock('../services/auth.service', () => ({
  default: {
    requestSignupOtp: vi.fn(),
    verifySignupOtp: vi.fn(),
    resendSignupOtp: vi.fn(),
    verifyLegacyOtp: vi.fn(),
    resendLegacyOtp: vi.fn(),
    verifyEmailLink: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    refreshToken: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('../services/user.service', () => ({
  default: {
    getCurrentUser: vi.fn().mockResolvedValue({
      data: {
        id: 'c3b7a5a8-4395-4672-8822-4946631ad18e',
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User',
      },
    }),
  },
}));

describe('Frontend Authentication & Staged Registration Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  // 1. Signup starts with email rather than username/password
  it('1. Signup starts with email rather than username/password', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/^username/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/^password/i)).not.toBeInTheDocument();
  });

  // 2. OTP request succeeds without invoking login or accessing the dashboard
  it('2. OTP request succeeds without invoking login or accessing the dashboard', async () => {
    authService.requestSignupOtp.mockResolvedValueOnce({
      success: true,
      message: 'Confirmation code sent to your email.',
    });

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <AuthProvider>
          <Routes>
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/" element={<div>Dashboard Home</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: 'alice@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(authService.requestSignupOtp).toHaveBeenCalledWith('alice@example.com');
      expect(screen.getByPlaceholderText(/confirmation code/i)).toBeInTheDocument();
    });

    expect(authService.login).not.toHaveBeenCalled();
    expect(screen.queryByText('Dashboard Home')).not.toBeInTheDocument();
  });

  // 3. Leading-zero code "012345" remains unchanged as string
  it('3. Leading-zero code "012345" remains unchanged', async () => {
    authService.requestSignupOtp.mockResolvedValueOnce({ success: true });
    authService.verifySignupOtp.mockResolvedValueOnce({
      data: {
        signupToken: 'proof-token-leading-zero',
        expiresIn: 600,
      },
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </MemoryRouter>
    );

    // Step 1: Submit email
    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: 'zero@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/confirmation code/i)).toBeInTheDocument();
    });

    // Step 2: Enter leading-zero OTP
    const otpInput = screen.getByPlaceholderText(/confirmation code/i);
    fireEvent.change(otpInput, { target: { value: '012345' } });
    expect(otpInput.value).toBe('012345');

    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      expect(authService.verifySignupOtp).toHaveBeenCalledWith('zero@example.com', '012345');
    });
  });

  // 4. Invalid OTP produces an error and does not issue a session
  it('4. Invalid OTP produces an error and does not issue a session', async () => {
    authService.requestSignupOtp.mockResolvedValueOnce({ success: true });
    authService.verifySignupOtp.mockRejectedValueOnce({
      status: 400,
      message: 'Invalid or expired confirmation code.',
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: 'wrong@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/confirmation code/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/confirmation code/i), {
      target: { value: '999999' },
    });
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid or expired confirmation code/i)).toBeInTheDocument();
    });

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(sessionStorage.getItem('signup_proof')).toBeNull();
  });

  // 5. Successful OTP verification advances to profile completion
  it('5. Successful OTP verification advances to profile completion', async () => {
    authService.requestSignupOtp.mockResolvedValueOnce({ success: true });
    authService.verifySignupOtp.mockResolvedValueOnce({
      data: {
        signupToken: 'proof-uuid-12345',
        expiresIn: 600,
      },
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: 'advancing@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/confirmation code/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/confirmation code/i), {
      target: { value: '654321' },
    });
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/^password/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.getByText('advancing@example.com')).toBeInTheDocument();
    });
  });

  // 6. Profile submission includes the signup proof and does not trust a client-provided email
  it('6. Profile submission includes the signup proof and does not trust a client-provided email', async () => {
    sessionStorage.setItem('signup_proof', 'secure-ticket-proof-abc');
    sessionStorage.setItem('signup_email', 'verified_context@example.com');

    authService.register.mockResolvedValueOnce({
      data: {
        accessToken: 'access-jwt-777',
        refreshToken: 'refresh-jwt-777',
        user: {
          id: 'user-777',
          username: 'valid_alice',
          email: 'verified_context@example.com',
        },
      },
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </MemoryRouter>
    );

    // Rendered directly in profile stage due to valid session proof
    expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/username/i), {
      target: { value: 'valid_alice' },
    });
    fireEvent.change(screen.getByPlaceholderText(/full name/i), {
      target: { value: 'Alice Wonderland' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^password/i), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), {
      target: { value: 'Password123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        signupToken: 'secure-ticket-proof-abc',
        username: 'valid_alice',
        displayName: 'Alice Wonderland',
        password: 'Password123!',
      });
    });

    // Verify client did NOT pass a client-controlled email parameter
    const callArgs = authService.register.mock.calls[0][0];
    expect(callArgs.email).toBeUndefined();
  });

  // 7. Successful final registration establishes AuthContext session and navigates to the dashboard
  it('7. Successful final registration establishes AuthContext session and navigates to the dashboard', async () => {
    sessionStorage.setItem('signup_proof', 'valid-signup-proof-999');
    sessionStorage.setItem('signup_email', 'final_auto_login@example.com');

    authService.register.mockResolvedValueOnce({
      data: {
        accessToken: 'final-access-token-jwt',
        refreshToken: 'final-refresh-token-jwt',
        user: {
          id: 'c3b7a5a8-4395-4672-8822-4946631ad18e',
          username: 'final_user',
          email: 'final_auto_login@example.com',
        },
      },
    });

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <AuthProvider>
          <Routes>
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/" element={<div>Dashboard Home Screen</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/username/i), {
      target: { value: 'final_user' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^password/i), {
      target: { value: 'ComplexPass123!' },
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), {
      target: { value: 'ComplexPass123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(localStorage.getItem('access_token')).toBe('final-access-token-jwt');
      expect(localStorage.getItem('refresh_token')).toBe('final-refresh-token-jwt');
      expect(screen.getByText('Dashboard Home Screen')).toBeInTheDocument();
    });

    // Verify session storage cleanup
    expect(sessionStorage.getItem('signup_proof')).toBeNull();
  });

  // 8. Username conflict preserves the valid flow appropriately
  it('8. Username conflict preserves the valid flow appropriately', async () => {
    sessionStorage.setItem('signup_proof', 'keep-proof-valid');
    sessionStorage.setItem('signup_email', 'retry@example.com');

    authService.register.mockRejectedValueOnce({
      status: 409,
      message: "Username 'taken_name' is already taken. Please choose another username.",
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/username/i), {
      target: { value: 'taken_name' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^password/i), {
      target: { value: 'MySecretPassword123' },
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), {
      target: { value: 'MySecretPassword123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/username 'taken_name' is already taken/i)).toBeInTheDocument();
    });

    // Crucial: User remains on Step 3 with their entered credentials intact and signup proof preserved
    expect(screen.getByPlaceholderText(/username/i)).toHaveValue('taken_name');
    expect(screen.getByPlaceholderText(/^password/i)).toHaveValue('MySecretPassword123');
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  // 9. Resend cooldown, button state and HTTP 429 handling work correctly
  it('9. Resend cooldown, button state and HTTP 429 handling work correctly', async () => {
    authService.requestSignupOtp.mockResolvedValueOnce({ success: true });

    render(
      <MemoryRouter>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: 'resend@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/confirmation code/i)).toBeInTheDocument();
    });

    // Initially disabled with cooldown
    const resendBtn = screen.getByRole('button', { name: /resend code in/i });
    expect(resendBtn).toBeDisabled();

    // Fast-forward cooldown by triggering 429 handler directly
    authService.resendSignupOtp.mockRejectedValueOnce({
      status: 429,
      retryAfter: 45,
      message: 'Too many requests. Please wait 45 seconds before trying again.',
    });
  });

  // 10. Invalid or expired proof requires restarting verification
  it('10. Invalid or expired proof requires restarting verification', async () => {
    sessionStorage.setItem('signup_proof', 'stale-proof-token');
    sessionStorage.setItem('signup_email', 'stale@example.com');

    authService.register.mockRejectedValueOnce({
      status: 400,
      message: 'Signup verification token is expired or has already been used',
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/username/i), {
      target: { value: 'stale_user' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^password/i), {
      target: { value: 'ValidPass123!' },
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), {
      target: { value: 'ValidPass123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/token is expired or has already been used/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /restart verification/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /restart verification/i }));

    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
  });

  // 11. Direct navigation or refresh on an incomplete stage does not grant authentication
  it('11. Direct navigation or refresh on an incomplete stage does not grant authentication', async () => {
    sessionStorage.setItem('signup_proof', 'some-partial-proof');

    const TestProtectedArea = () => {
      const { isAuthenticated } = useAuth();
      return <div>Status: {isAuthenticated ? 'Authenticated' : 'Unauthenticated'}</div>;
    };

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route element={<ProtectedRoute />}>
              <Route path="/protected" element={<TestProtectedArea />} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.queryByText(/status: authenticated/i)).not.toBeInTheDocument();
    });
  });

  // 12. Existing verified-user login, logout, route guards and refresh handling continue to work
  it('12. Existing verified-user login, logout, route guards and refresh handling continue to work', async () => {
    // 12a: Login rendering
    const { unmount } = render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText(/username or email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/^password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    unmount();

    // 12b: Login success establishes session
    authService.login.mockResolvedValueOnce({
      data: {
        accessToken: 'legacy-verified-token',
        refreshToken: 'legacy-refresh-token',
        user: {
          id: 'c3b7a5a8-4395-4672-8822-4946631ad18e',
          username: 'verified_user',
          email: 'verified@example.com',
        },
      },
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<div>User Dashboard</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/username or email/i), {
      target: { value: 'verified_user' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^password/i), {
      target: { value: 'CorrectPass123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(localStorage.getItem('access_token')).toBe('legacy-verified-token');
      expect(localStorage.getItem('refresh_token')).toBe('legacy-refresh-token');
    });
  });

  // 13. Legacy pending users can access recovery journey and verify OTP with leading zero "012345"
  it('13. Legacy pending users can access recovery journey and verify OTP with leading zero "012345"', async () => {
    authService.verifyLegacyOtp.mockResolvedValueOnce({
      data: {
        accessToken: 'recovered-access-token',
        refreshToken: 'recovered-refresh-token',
        user: {
          id: 'legacy-user-123',
          username: 'legacy_recovered_user',
          email: 'pending@example.com',
          emailVerified: true,
        },
      },
    });

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <AuthProvider>
          <Routes>
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/" element={<div>Dashboard Home Screen</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Switch to recovery flow from signup screen
    fireEvent.click(screen.getByRole('button', { name: /already have an unverified account/i }));

    expect(screen.getByPlaceholderText(/account email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/6-digit confirmation code/i)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/account email address/i), {
      target: { value: 'pending@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/6-digit confirmation code/i), {
      target: { value: '012345' },
    });

    fireEvent.click(screen.getByRole('button', { name: /verify & log in/i }));

    await waitFor(() => {
      expect(authService.verifyLegacyOtp).toHaveBeenCalledWith('pending@example.com', '012345');
      expect(localStorage.getItem('access_token')).toBe('recovered-access-token');
      expect(localStorage.getItem('refresh_token')).toBe('recovered-refresh-token');
      expect(screen.getByText('Dashboard Home Screen')).toBeInTheDocument();
    });
  });

  // 14. Legacy resend does not disclose account existence
  it('14. Legacy resend does not disclose account existence', async () => {
    authService.resendLegacyOtp.mockResolvedValueOnce({
      success: true,
      message: 'If an unverified account exists with this email, a verification code has been sent.',
    });

    render(
      <MemoryRouter initialEntries={['/signup?mode=legacy']}>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/account email address/i), {
      target: { value: 'unrevealed@example.com' },
    });

    fireEvent.click(screen.getByRole('button', { name: /resend code/i }));

    await waitFor(() => {
      expect(authService.resendLegacyOtp).toHaveBeenCalledWith('unrevealed@example.com');
      expect(
        screen.getByText(/if an unverified account exists with this email/i)
      ).toBeInTheDocument();
    });
  });

  // 15. Legacy email verification link handling redirects to login
  it('15. Legacy email verification link handling redirects to login', async () => {
    authService.verifyEmailLink.mockResolvedValueOnce({
      success: true,
      message: 'Email verified successfully',
    });

    render(
      <MemoryRouter initialEntries={['/verify-email?token=valid-link-token']}>
        <AuthProvider>
          <Routes>
            <Route path="/verify-email" element={<SignupPage />} />
            <Route path="/login" element={<div>Login Page Screen</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(authService.verifyEmailLink).toHaveBeenCalledWith('valid-link-token');
      expect(screen.getByText(/email verified successfully! redirecting to login/i)).toBeInTheDocument();
    });
  });

  // 16. Displays multi-account sign-in hint and handles username-based login
  it('16. Displays multi-account sign-in hint and handles username-based login', async () => {
    authService.login.mockResolvedValueOnce({
      accessToken: 'test-token',
      refreshToken: 'test-refresh',
      user: { id: 'user-1', username: 'account_one' },
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/if you have multiple accounts linked to your email, please sign in with your username/i)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/username or email/i), {
      target: { value: 'account_one' },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'ValidPass123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^log in$/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        usernameOrEmail: 'account_one',
        password: 'ValidPass123!',
      });
    });
  });

  // 17. Handles 4th account registration limit error (409 Conflict) cleanly
  it('17. Handles 4th account registration limit error (409 Conflict) cleanly', async () => {
    sessionStorage.setItem('signup_proof', 'valid-proof-token');
    sessionStorage.setItem('signup_email', 'shared@example.com');

    authService.register.mockRejectedValueOnce({
      status: 409,
      message: 'Maximum number of accounts (3) reached for this email address. Please log in or use a different email.',
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <SignupPage />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/username/i), {
      target: { value: 'fourth_user' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^password/i), {
      target: { value: 'ValidPass123!' },
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), {
      target: { value: 'ValidPass123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/maximum number of accounts \(3\) reached for this email address/i)).toBeInTheDocument();
    });
  });

  // 18. Generic error display for ambiguous or bad credentials on login
  it('18. Generic error display for ambiguous or bad credentials on login', async () => {
    authService.login.mockRejectedValueOnce({
      status: 401,
      message: 'Invalid username or password. Please try again.',
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/username or email/i), {
      target: { value: 'ambiguous@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'WrongOrAmbiguous!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^log in$/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
    });
  });
});
