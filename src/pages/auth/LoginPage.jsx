import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Sparkles, ShieldCheck, Heart, MessageCircle, Send, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/auth.service';
import './LoginPage.css';

export const LoginPage = () => {
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.usernameOrEmail.trim() || !formData.password) {
      setErrorMessage('Please enter both username/email and password');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await authService.login({
        usernameOrEmail: formData.usernameOrEmail.trim(),
        password: formData.password,
      });

      const authData = response?.data || response;
      login(authData);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Invalid username or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container aurora-mesh-bg">
      <div className="auth-content-wrapper">
        {/* Left Side: 21st.dev Dynamic Interactive App Showcase */}
        <motion.div
          className="auth-showcase-column"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="phone-mockup-frame">
            <div className="phone-speaker-notch" />
            
            {/* Mock Header */}
            <div className="mock-app-header">
              <span className="mock-logo">Instagram</span>
              <div className="mock-header-actions">
                <Heart size={16} />
                <MessageCircle size={16} />
              </div>
            </div>

            {/* Mock Stories Row */}
            <div className="mock-stories-bar">
              {['Your Story', 'alex_r', 'sarah.c', 'elena_v'].map((name, i) => (
                <div key={name} className="mock-story-item">
                  <div className={`mock-story-ring ${i === 0 ? 'ring-add' : 'ring-active'}`}>
                    <div className="mock-story-avatar" />
                  </div>
                  <span className="mock-story-name">{name}</span>
                </div>
              ))}
            </div>

            {/* Mock Feed Card */}
            <div className="mock-feed-card">
              <div className="mock-card-header">
                <div className="mock-avatar-sm" />
                <div className="mock-user-meta">
                  <span className="mock-username">creative_studio</span>
                  <span className="mock-location">Tokyo, Japan</span>
                </div>
              </div>

              <div className="mock-media-display">
                <div className="mock-image-gradient" />
                <motion.div
                  className="mock-floating-heart"
                  animate={{ scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Heart size={38} fill="#ff3040" color="#ff3040" />
                </motion.div>
              </div>

              <div className="mock-card-actions">
                <div className="mock-action-left">
                  <Heart size={18} fill="#ff3040" color="#ff3040" />
                  <MessageCircle size={18} />
                  <Send size={18} />
                </div>
                <Bookmark size={18} />
              </div>

              <div className="mock-card-likes">
                <span>Liked by <strong>alex_r</strong> and <strong>1,420 others</strong></span>
              </div>
            </div>

            {/* Floating Highlights Badges */}
            <motion.div
              className="mock-badge-tag badge-tag-1"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: [0, -6, 0], opacity: 1 }}
              transition={{ y: { duration: 4, repeat: Infinity, ease: 'easeInOut' }, opacity: { duration: 0.5 } }}
            >
              <Sparkles size={14} className="tag-icon-pink" />
              <span>Real-Time Reels & Feeds</span>
            </motion.div>

            <motion.div
              className="mock-badge-tag badge-tag-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: [0, 6, 0], opacity: 1 }}
              transition={{ y: { duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }, opacity: { duration: 0.5 } }}
            >
              <ShieldCheck size={14} className="tag-icon-blue" />
              <span>2FA & Device Session Guard</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Side: Auth Card Form */}
        <motion.div
          className="auth-form-column"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="auth-card-main glass-card border-glow-accent">
            <div className="auth-brand-header">
              <div className="auth-badge-icon">
                <div className="brand-camera-gradient" />
              </div>
              <h1 className="auth-logo-text">Instagram</h1>
              <p className="auth-subtitle">Log in to see photos and videos from your friends.</p>
            </div>

            <AnimatePresence mode="wait">
              {errorMessage && (
                <motion.div
                  className="auth-error-banner"
                  role="alert"
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                >
                  <AlertCircle size={16} />
                  <div>
                    <span>{errorMessage}</span>
                    {errorMessage.toLowerCase().includes('verify') && (
                      <div style={{ marginTop: '4px' }}>
                        <Link to="/verify" className="auth-link-bold" style={{ fontSize: '12px', marginLeft: 0 }}>
                          Verify your account here
                        </Link>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <input
                  type="text"
                  name="usernameOrEmail"
                  className="auth-input"
                  placeholder="Username or email"
                  value={formData.usernameOrEmail}
                  onChange={handleChange}
                  autoComplete="username"
                  required
                  disabled={isSubmitting}
                />
                <p className="auth-hint-text">
                  If you have multiple accounts linked to your email, please sign in with your username.
                </p>
              </div>

              <div className="form-group password-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="auth-input"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="btn-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="auth-extra-links">
                <Link to="/forgot-password" className="auth-forgot-link">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                className="btn-auth-submit btn-modern-gradient"
                disabled={isSubmitting || !formData.usernameOrEmail || !formData.password}
              >
                {isSubmitting ? 'Logging In...' : 'Log In'}
              </button>
            </form>
          </div>

          <div className="auth-switch-card glass-card">
            <span>Don't have an account? </span>
            <Link to="/signup" className="auth-link-bold">Sign up</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
