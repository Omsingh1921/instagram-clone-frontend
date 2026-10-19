import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw, KeyRound, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import authService from '../../services/auth.service';
import './LoginPage.css';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await authService.forgotPassword(cleanEmail);
      setIsSubmitted(true);
      setCooldown(60);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to send password reset link. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await authService.forgotPassword(email.trim().toLowerCase());
      setCooldown(60);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to resend reset link.');
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
            <KeyRound size={28} className="tag-icon-pink" />
          </div>

          <div className="auth-brand-header">
            <h1 className="auth-logo-text" style={{ fontSize: '24px' }}>Trouble Logging In?</h1>
            <p className="auth-subtitle">
              Enter your email and we'll send you a secure link to reset your password and get back into your account.
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

          {!isSubmitted ? (
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  className="auth-input"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  autoComplete="email"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <button
                type="submit"
                className="btn-auth-submit btn-modern-gradient"
                disabled={isSubmitting || !email.trim()}
              >
                {isSubmitting ? 'Sending Link...' : 'Send Login Link'}
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
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  marginBottom: '18px',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 600, marginBottom: '6px' }}>
                  <CheckCircle2 size={18} />
                  <span>Reset Link Sent!</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  We've sent a single-use password reset link to <strong>{email}</strong>. Check your inbox and follow the link.
                </p>
              </div>

              <button
                type="button"
                className="btn-modern-glass"
                style={{ width: '100%', marginBottom: '12px' }}
                onClick={handleResend}
                disabled={cooldown > 0 || isSubmitting}
              >
                <RefreshCw size={14} className={isSubmitting ? 'animate-spin' : ''} />
                <span>{cooldown > 0 ? `Resend link in ${cooldown}s` : 'Resend Reset Link'}</span>
              </button>
            </motion.div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0 16px', gap: '10px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
          </div>

          <Link
            to="/signup"
            className="auth-link-bold"
            style={{ fontSize: '13px', display: 'inline-block' }}
          >
            Create New Account
          </Link>
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

export default ForgotPasswordPage;
