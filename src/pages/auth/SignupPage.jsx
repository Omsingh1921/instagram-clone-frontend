import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle2, Mail, ShieldCheck, KeyRound, ArrowLeft, RefreshCw, Sparkles, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/auth.service';
import './LoginPage.css';

export const SignupPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Wizard Stages: 'email' | 'otp' | 'profile' | 'legacy-recover'
  const [stage, setStage] = useState(() => {
    try {
      const searchParams = new URLSearchParams(location.search);
      if (searchParams.get('mode') === 'legacy' || searchParams.get('token') || location.pathname.includes('/verify')) {
        return 'legacy-recover';
      }
    } catch {
      // Ignore URL parsing errors
    }
    const savedProof = sessionStorage.getItem('signup_proof');
    const savedEmail = sessionStorage.getItem('signup_email');
    if (savedProof && savedEmail) {
      return 'profile';
    }
    return 'email';
  });

  const [email, setEmail] = useState(() => sessionStorage.getItem('signup_email') || '');
  const [otpCode, setOtpCode] = useState('');
  const [signupToken, setSignupToken] = useState(() => sessionStorage.getItem('signup_proof') || '');
  
  // Legacy recovery state
  const [legacyEmail, setLegacyEmail] = useState('');
  const [legacyCode, setLegacyCode] = useState('');

  const [profileData, setProfileData] = useState({
    username: '',
    displayName: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Handle email verification link token or route parameter
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(location.search);
      if (searchParams.get('mode') === 'legacy' || location.pathname.includes('/verify')) {
        setStage('legacy-recover');
      }
      const tokenParam = searchParams.get('token');
      if (tokenParam) {
        setStage('legacy-recover');
        setIsSubmitting(true);
        setErrorMessage('');
        setSuccessMessage('Verifying your email token...');
        authService.verifyEmailLink(tokenParam)
          .then(() => {
            setSuccessMessage('Email verified successfully! Redirecting to login...');
            setTimeout(() => {
              navigate('/login', { replace: true });
            }, 1200);
          })
          .catch((err) => {
            setErrorMessage(err?.message || 'Invalid or expired verification link.');
          })
          .finally(() => {
            setIsSubmitting(false);
          });
      }
    } catch {
      // Ignore
    }
  }, [location, navigate]);

  // Step 1: Request OTP for Email
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await authService.requestSignupOtp(normalizedEmail);
      setSuccessMessage(res?.message || 'Confirmation code sent to your email.');
      setStage('otp');
      setCooldown(60);
    } catch (err) {
      const msg = err?.message || 'Failed to send confirmation code. Please try again.';
      setErrorMessage(msg);
      if (err?.status === 429 && err?.retryAfter) {
        setCooldown(err.retryAfter);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify OTP
  const handleOtpChange = (e) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, '').slice(0, 6);
    setOtpCode(digits);
    if (errorMessage) setErrorMessage('');
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const trimmedCode = otpCode.trim();

    if (trimmedCode.length !== 6) {
      setErrorMessage('Please enter a valid 6-digit confirmation code.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await authService.verifySignupOtp(email.trim().toLowerCase(), trimmedCode);
      const data = res?.data || res;
      const token = data?.signupToken;

      if (!token) {
        throw new Error('Verification failed. No signup token received.');
      }

      setSignupToken(token);
      try {
        sessionStorage.setItem('signup_proof', token);
        sessionStorage.setItem('signup_email', email.trim().toLowerCase());
      } catch {
        // Ignore storage write issues
      }

      setSuccessMessage('Email verified successfully!');
      setStage('profile');
    } catch (err) {
      const msg = err?.message || 'Invalid or expired confirmation code. Please try again.';
      setErrorMessage(msg);
      if (err?.status === 429 && err?.retryAfter) {
        setCooldown(err.retryAfter);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || isResending || isSubmitting) return;

    setIsResending(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await authService.resendSignupOtp(email.trim().toLowerCase());
      setSuccessMessage(res?.message || 'New confirmation code sent to your email.');
      setCooldown(60);
    } catch (err) {
      const msg = err?.message || 'Failed to resend confirmation code.';
      setErrorMessage(msg);
      if (err?.status === 429 && err?.retryAfter) {
        setCooldown(err.retryAfter);
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleChangeEmail = () => {
    setStage('email');
    setOtpCode('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Step 3: Complete Profile & Register
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const getPasswordStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strengthScore = getPasswordStrength(profileData.password);
  const strengthLabels = ['Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthClasses = ['active-weak', 'active-weak', 'active-fair', 'active-good', 'active-strong'];

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const { username, displayName, password, confirmPassword } = profileData;

    if (!signupToken) {
      setErrorMessage('Your verification proof has expired. Please verify your email again.');
      setStage('email');
      return;
    }

    if (!username.trim() || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (username.trim().length < 3) {
      setErrorMessage('Username must be at least 3 characters.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const regRes = await authService.register({
        signupToken,
        username: username.trim(),
        displayName: displayName.trim() || username.trim(),
        password,
      });

      const authData = regRes?.data || regRes;
      setSuccessMessage('Account created successfully! Logging you in...');

      try {
        sessionStorage.removeItem('signup_proof');
        sessionStorage.removeItem('signup_email');
      } catch {
        // Ignore
      }

      login(authData);

      setTimeout(() => {
        navigate('/', { replace: true });
      }, 400);
    } catch (err) {
      const msg = err?.message || 'Registration failed. Please try again.';
      setErrorMessage(msg);

      if (err?.status === 400 && (msg.toLowerCase().includes('token') || msg.toLowerCase().includes('expired'))) {
        try {
          sessionStorage.removeItem('signup_proof');
          sessionStorage.removeItem('signup_email');
        } catch {
          // Ignore
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Legacy Recovery Handlers
  const handleLegacyOtpSubmit = async (e) => {
    e.preventDefault();
    const normalizedEmail = legacyEmail.trim().toLowerCase();
    const trimmedCode = legacyCode.trim();

    if (!normalizedEmail) {
      setErrorMessage('Please enter your account email address.');
      return;
    }

    if (trimmedCode.length !== 6) {
      setErrorMessage('Please enter your 6-digit confirmation code.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await authService.verifyLegacyOtp(normalizedEmail, trimmedCode);
      const authData = res?.data || res;
      setSuccessMessage('Account verified successfully! Logging you in...');
      login(authData);
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 400);
    } catch (err) {
      setErrorMessage(err?.message || 'Verification failed. Please check the code and email or request a new code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLegacyResendOtp = async () => {
    const normalizedEmail = legacyEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      setErrorMessage('Please enter your account email address before requesting a code.');
      return;
    }

    if (cooldown > 0 || isResending || isSubmitting) return;

    setIsResending(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await authService.resendLegacyOtp(normalizedEmail);
      setSuccessMessage('If an unverified account exists with this email, a verification code has been sent.');
      setCooldown(60);
    } catch (err) {
      setErrorMessage(err?.message || 'Failed to resend confirmation code. Please try again later.');
      if (err?.status === 429 && err?.retryAfter) {
        setCooldown(err.retryAfter);
      }
    } finally {
      setIsResending(false);
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
          {/* Brand Header */}
          <div className="auth-brand-header">
            <h1 className="auth-logo-text">Instagram</h1>
            
            {/* 21st.dev Modern Stepper */}
            {stage !== 'legacy-recover' && (
              <div className="modern-stepper">
                <div className={`step-node ${stage === 'email' ? 'active' : 'completed'}`}>
                  {stage !== 'email' ? <Check size={14} /> : '1'}
                </div>
                <div className={`step-connector ${stage === 'otp' || stage === 'profile' ? 'completed' : ''}`} />
                <div className={`step-node ${stage === 'otp' ? 'active' : stage === 'profile' ? 'completed' : ''}`}>
                  {stage === 'profile' ? <Check size={14} /> : '2'}
                </div>
                <div className={`step-connector ${stage === 'profile' ? 'completed' : ''}`} />
                <div className={`step-node ${stage === 'profile' ? 'active' : ''}`}>
                  3
                </div>
              </div>
            )}

            {stage === 'email' && (
              <p className="auth-subtitle">Sign up to see photos and videos from your friends.</p>
            )}

            {stage === 'otp' && (
              <>
                <div className="auth-stage-indicator">
                  <span className="auth-step-pill">Step 2 of 3</span>
                </div>
                <div className="auth-icon-circle">
                  <Mail size={24} className="tag-icon-pink" />
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                  Enter Confirmation Code
                </h2>
                <p className="auth-subtitle">
                  Enter the 6-digit confirmation code we sent to <strong>{email}</strong>.
                </p>
              </>
            )}

            {stage === 'profile' && (
              <>
                <div className="auth-stage-indicator">
                  <span className="auth-step-pill">Step 3 of 3</span>
                </div>
                <div className="auth-icon-circle" style={{ borderColor: 'rgba(16, 185, 129, 0.4)', color: '#10b981' }}>
                  <ShieldCheck size={26} />
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                  Complete Your Profile
                </h2>
                <p className="auth-subtitle">Choose a unique username and strong password to finish signing up.</p>
              </>
            )}

            {stage === 'legacy-recover' && (
              <>
                <div className="auth-stage-indicator">
                  <span className="auth-step-pill">Account Recovery</span>
                </div>
                <div className="auth-icon-circle" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
                  <KeyRound size={26} />
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                  Verify Existing Account
                </h2>
                <p className="auth-subtitle">Enter your account email and confirmation code to finish verification.</p>
              </>
            )}
          </div>

          {/* Error Banner */}
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

          {/* Success Banner */}
          <AnimatePresence mode="wait">
            {successMessage && (
              <motion.div
                className="auth-error-banner"
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  borderColor: 'rgba(16, 185, 129, 0.35)',
                  color: '#10b981',
                }}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <CheckCircle2 size={16} />
                <span>{successMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* STEP 1: Email Form */}
          {stage === 'email' && (
            <motion.form
              key="step-email"
              className="auth-form"
              onSubmit={handleEmailSubmit}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
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
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="btn-auth-submit btn-modern-gradient"
                disabled={isSubmitting || !email.trim()}
              >
                {isSubmitting ? 'Sending Code...' : 'Continue'}
              </button>

              <div style={{ marginTop: '14px', textAlign: 'center' }}>
                <button
                  type="button"
                  className="auth-btn-link"
                  onClick={() => {
                    setErrorMessage('');
                    setSuccessMessage('');
                    setLegacyEmail(email);
                    setStage('legacy-recover');
                  }}
                  style={{ fontSize: '12px', color: 'var(--text-muted)' }}
                >
                  Already have an unverified account? Verify here
                </button>
              </div>
            </motion.form>
          )}

          {/* STEP 2: OTP Verification Form */}
          {stage === 'otp' && (
            <motion.form
              key="step-otp"
              className="auth-form"
              onSubmit={handleOtpSubmit}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="form-group">
                <input
                  type="text"
                  name="code"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  className="auth-input otp-code-input"
                  placeholder="Confirmation code"
                  value={otpCode}
                  onChange={handleOtpChange}
                  autoComplete="one-time-code"
                  required
                  disabled={isSubmitting}
                  autoFocus
                  data-testid="otp-input"
                  aria-label="6-digit confirmation code"
                  style={{
                    letterSpacing: otpCode ? '6px' : 'normal',
                    fontSize: '18px',
                    fontWeight: 600,
                    textAlign: 'center',
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn-auth-submit btn-modern-gradient"
                disabled={isSubmitting || otpCode.length !== 6}
              >
                {isSubmitting ? 'Verifying...' : 'Confirm'}
              </button>

              <div className="auth-otp-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn-modern-glass"
                  onClick={handleResendOtp}
                  disabled={cooldown > 0 || isResending || isSubmitting}
                  style={{ fontSize: '13px' }}
                >
                  <RefreshCw size={14} className={isResending ? 'animate-spin' : ''} />
                  <span>
                    {isResending
                      ? 'Sending...'
                      : cooldown > 0
                      ? `Resend code in ${cooldown}s`
                      : 'Resend code'}
                  </span>
                </button>

                <button
                  type="button"
                  className="auth-btn-link"
                  onClick={handleChangeEmail}
                  disabled={isSubmitting}
                  style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Change email address
                </button>

                <button
                  type="button"
                  className="auth-btn-link"
                  onClick={() => {
                    setErrorMessage('');
                    setSuccessMessage('');
                    setLegacyEmail(email);
                    setLegacyCode(otpCode);
                    setStage('legacy-recover');
                  }}
                  style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Need to verify an earlier registration?
                </button>
              </div>
            </motion.form>
          )}

          {/* STEP 3: Complete Profile Form */}
          {stage === 'profile' && (
            <motion.form
              key="step-profile"
              className="auth-form"
              onSubmit={handleProfileSubmit}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="auth-readonly-box" style={{ justifyContent: 'space-between' }}>
                <span className="auth-readonly-value" style={{ fontWeight: 600 }}>{email}</span>
                <span className="floating-badge green" style={{ padding: '2px 8px', fontSize: '11px' }}>
                  <Check size={12} />
                  <span>Verified</span>
                </span>
              </div>

              <div className="form-group">
                <input
                  type="text"
                  name="username"
                  className="auth-input"
                  placeholder="Username (e.g. alex_smith)"
                  value={profileData.username}
                  onChange={handleProfileChange}
                  autoComplete="username"
                  required
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <input
                  type="text"
                  name="displayName"
                  className="auth-input"
                  placeholder="Full name (optional)"
                  value={profileData.displayName}
                  onChange={handleProfileChange}
                  autoComplete="name"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group password-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="auth-input"
                  placeholder="Password (min 8 characters)"
                  value={profileData.password}
                  onChange={handleProfileChange}
                  autoComplete="new-password"
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

              {/* Password strength meter */}
              {profileData.password && (
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
                    <span>Strength: <strong style={{ color: strengthScore >= 3 ? '#10b981' : '#f09433' }}>{strengthLabels[strengthScore]}</strong></span>
                    <span>8+ chars recommended</span>
                  </div>
                </div>
              )}

              <div className="form-group password-group" style={{ marginTop: '4px' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  className="auth-input"
                  placeholder="Confirm password"
                  value={profileData.confirmPassword}
                  onChange={handleProfileChange}
                  autoComplete="new-password"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <button
                type="submit"
                className="btn-auth-submit btn-modern-gradient"
                disabled={isSubmitting || !profileData.username || !profileData.password}
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </button>

              {errorMessage && errorMessage.toLowerCase().includes('expired') && (
                <div style={{ marginTop: '10px' }}>
                  <button
                    type="button"
                    className="auth-btn-link"
                    onClick={() => {
                      setStage('email');
                      setSignupToken('');
                      setErrorMessage('');
                    }}
                    style={{ fontSize: '12px' }}
                  >
                    Restart Verification
                  </button>
                </div>
              )}
            </motion.form>
          )}

          {/* RECOVERY: Legacy Unverified Account Verification Form */}
          {stage === 'legacy-recover' && (
            <motion.form
              key="step-legacy"
              className="auth-form"
              onSubmit={handleLegacyOtpSubmit}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="form-group">
                <input
                  type="email"
                  name="legacyEmail"
                  className="auth-input"
                  placeholder="Account email address"
                  value={legacyEmail}
                  onChange={(e) => {
                    setLegacyEmail(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  autoComplete="email"
                  required
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <input
                  type="text"
                  name="legacyCode"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  className="auth-input otp-code-input"
                  placeholder="6-digit confirmation code"
                  value={legacyCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setLegacyCode(val);
                    if (errorMessage) setErrorMessage('');
                  }}
                  autoComplete="one-time-code"
                  required
                  disabled={isSubmitting}
                  style={{
                    letterSpacing: legacyCode ? '6px' : 'normal',
                    fontSize: '18px',
                    fontWeight: 600,
                    textAlign: 'center',
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn-auth-submit btn-modern-gradient"
                disabled={isSubmitting || !legacyEmail.trim() || legacyCode.length !== 6}
              >
                {isSubmitting ? 'Verifying...' : 'Verify & Log In'}
              </button>

              <div className="auth-otp-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn-modern-glass"
                  onClick={handleLegacyResendOtp}
                  disabled={cooldown > 0 || isResending || isSubmitting || !legacyEmail.trim()}
                  style={{ fontSize: '13px' }}
                >
                  <RefreshCw size={14} className={isResending ? 'animate-spin' : ''} />
                  <span>
                    {isResending
                      ? 'Sending...'
                      : cooldown > 0
                      ? `Resend code in ${cooldown}s`
                      : 'Resend code'}
                  </span>
                </button>

                <button
                  type="button"
                  className="auth-btn-link"
                  onClick={() => {
                    setErrorMessage('');
                    setSuccessMessage('');
                    setStage('email');
                  }}
                  style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Back to Sign Up
                </button>
              </div>
            </motion.form>
          )}
        </div>

        <div className="auth-switch-card glass-card">
          <span>Have an account? </span>
          <Link to="/login" className="auth-link-bold">Log in</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default SignupPage;
