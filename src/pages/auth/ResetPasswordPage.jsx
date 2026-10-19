import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import authService from '../../services/auth.service';
import './LoginPage.css';

export const ResetPasswordPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(location.search);
      const tokenParam = searchParams.get('token');
      if (tokenParam) {
        setToken(tokenParam);
      } else {
        setErrorMessage('No reset token provided in link. Please request a new link.');
      }
    } catch {
      setErrorMessage('Invalid reset link.');
    }
  }, [location]);

  // Calculate password strength score 0..4
  const getPasswordStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strengthScore = getPasswordStrength(newPassword);
  const strengthLabels = ['Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthClasses = ['active-weak', 'active-weak', 'active-fair', 'active-good', 'active-strong'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setErrorMessage('Missing password reset token. Please request a new reset link.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await authService.resetPassword(token, newPassword);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container aurora-mesh-bg">
      <motion.div
        className="auth-form-column"
        style={{ margin: '0 auto' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="auth-card-main glass-card border-glow-accent">
          <div className="auth-icon-circle">
            <Lock size={28} className="tag-icon-pink" />
          </div>

          <div className="auth-brand-header">
            <h1 className="auth-logo-text" style={{ fontSize: '24px' }}>Create New Password</h1>
            <p className="auth-subtitle">
              Your new password must be different from previous passwords and at least 8 characters long.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {errorMessage && (
              <motion.div
                className="auth-error-banner"
                role="alert"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {!isSuccess ? (
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group password-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="newPassword"
                  className="auth-input"
                  placeholder="New password (min. 8 characters)"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  autoComplete="new-password"
                  required
                  disabled={isSubmitting || !token}
                />
                <button
                  type="button"
                  className="btn-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password strength meter */}
              {newPassword && (
                <div className="strength-meter-container">
                  <div className="strength-bar-track">
                    {[1, 2, 3, 4].map((seg) => (
                      <div
                        key={seg}
                        className={`strength-bar-segment ${seg <= strengthScore ? strengthClasses[strengthScore] : ''}`}
                      />
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>Security: <strong style={{ color: strengthScore >= 3 ? '#10b981' : '#f09433' }}>{strengthLabels[strengthScore]}</strong></span>
                    <span>8+ chars with mix of letters & numbers</span>
                  </div>
                </div>
              )}

              <div className="form-group password-group" style={{ marginTop: '8px' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  className="auth-input"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  autoComplete="new-password"
                  required
                  disabled={isSubmitting || !token}
                />
              </div>

              <button
                type="submit"
                className="btn-auth-submit btn-modern-gradient"
                disabled={isSubmitting || !token || !newPassword || !confirmPassword}
              >
                {isSubmitting ? 'Updating Password...' : 'Reset Password'}
              </button>
            </form>
          ) : (
            <motion.div
              className="auth-success-flow"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  marginBottom: '16px',
                  textAlign: 'center',
                }}
              >
                <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 10px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#10b981', margin: '0 0 6px' }}>Password Reset Successful!</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                  Your password has been updated securely. Redirecting you to login...
                </p>
              </div>
            </motion.div>
          )}
        </div>

        <div className="auth-switch-card glass-card" style={{ display: 'flex', justifyContent: 'center' }}>
          <Link
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Login</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
