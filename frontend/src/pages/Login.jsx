import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FormField from '../components/common/FormField';
import SubmitButton from '../components/common/SubmitButton';
import { useAuth } from '../hooks/useAuth';
import {
  login as loginApi,
  register as registerApi,
  registerVerify,
  sendOtp,
  verifyOtp,
} from '../api/authApi';

// ── Security Constants ──────────────────────────────────────────────────────

const RATE_LIMIT = {
  MAX_ATTEMPTS: 5,
  WINDOW_MS: 15 * 60 * 1000,    // 15 minutes
  OTP_MAX: 3,
  OTP_WINDOW_MS: 10 * 60 * 1000, // 10 minutes
  LOCKOUT_MS: 15 * 60 * 1000,
};

const FIELD_LIMITS = {
  EMAIL_MAX: 254,       // RFC 5321
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 128,    // prevent bcrypt DoS
  NAME_MIN: 1,
  NAME_MAX: 50,
  OTP_LENGTH: 6,
};

// ── Sanitization ────────────────────────────────────────────────────────────

/**
 * Strip leading/trailing whitespace and remove null bytes.
 * Applied to every text field before validation and submission.
 */
const sanitize = (value) =>
  typeof value === 'string' ? value.replace(/\0/g, '').trim() : '';

/**
 * Prevent XSS by encoding HTML special chars.
 * Use when inserting user-supplied strings into display (extra layer).
 */
const escapeHtml = (value) =>
  sanitize(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

// ── Validators ───────────────────────────────────────────────────────────────

const EMAIL_RE =
  /^(?=[a-zA-Z0-9@._%+\-]{6,254}$)[a-zA-Z0-9._%+\-]{1,64}@(?:[a-zA-Z0-9\-]{1,63}\.)+[a-zA-Z]{2,63}$/;

const validateEmail = (raw) => {
  const v = sanitize(raw);
  if (!v) return 'Email is required.';
  if (v.length > FIELD_LIMITS.EMAIL_MAX)
    return `Email must be at most ${FIELD_LIMITS.EMAIL_MAX} characters.`;
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address.';
  // Reject common injection patterns
  if (/[<>'";\\/]/.test(v)) return 'Email contains invalid characters.';
  return null;
};

// NIST 800-63B-aligned password rules:
//   ≥ 8 chars, ≤ 128 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
const validatePassword = (raw, { confirmWith } = {}) => {
  const v = sanitize(raw);
  if (!v) return 'Password is required.';
  if (v.length < FIELD_LIMITS.PASSWORD_MIN)
    return `Password must be at least ${FIELD_LIMITS.PASSWORD_MIN} characters.`;
  if (v.length > FIELD_LIMITS.PASSWORD_MAX)
    return `Password must be at most ${FIELD_LIMITS.PASSWORD_MAX} characters.`;
  if (!/[A-Z]/.test(v)) return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(v)) return 'Password must contain at least one lowercase letter.';
  if (!/[0-9]/.test(v)) return 'Password must contain at least one digit.';
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(v))
    return 'Password must contain at least one special character.';
  // Reject passwords that are obviously sequential / keyboard walks
  if (/^(.)\1{7,}$/.test(v)) return 'Password is too simple.';
  if (confirmWith !== undefined && v !== sanitize(confirmWith))
    return 'Passwords do not match.';
  return null;
};

const validateName = (raw, label) => {
  const v = sanitize(raw);
  if (!v) return `${label} is required.`;
  if (v.length < FIELD_LIMITS.NAME_MIN) return `${label} is too short.`;
  if (v.length > FIELD_LIMITS.NAME_MAX)
    return `${label} must be at most ${FIELD_LIMITS.NAME_MAX} characters.`;
  // Only letters, spaces, hyphens, apostrophes (international names)
  if (!/^[\p{L}\s'\-]+$/u.test(v))
    return `${label} contains invalid characters.`;
  return null;
};

const validateOtp = (raw) => {
  const v = sanitize(raw);
  if (!v) return 'OTP is required.';
  if (!/^\d{6}$/.test(v)) return 'OTP must be exactly 6 digits.';
  return null;
};

// ── Rate Limiter (client-side defence-in-depth) ──────────────────────────────
// Real enforcement MUST be on the server; this adds friction against scripts.

class RateLimiter {
  constructor(maxAttempts, windowMs, lockoutMs) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.lockoutMs = lockoutMs;
    this.attempts = [];
    this.lockedUntil = null;
  }

  isLocked() {
    if (this.lockedUntil && Date.now() < this.lockedUntil) {
      const remaining = Math.ceil((this.lockedUntil - Date.now()) / 1000);
      return `Too many attempts. Try again in ${remaining}s.`;
    }
    this.lockedUntil = null;
    return null;
  }

  record() {
    const now = Date.now();
    this.attempts = this.attempts.filter((t) => now - t < this.windowMs);
    this.attempts.push(now);
    if (this.attempts.length >= this.maxAttempts) {
      this.lockedUntil = now + this.lockoutMs;
      this.attempts = [];
      return `Too many attempts. Locked for ${Math.ceil(this.lockoutMs / 60000)} minutes.`;
    }
    return null;
  }

  reset() {
    this.attempts = [];
    this.lockedUntil = null;
  }
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Rate limiters (per instance / tab session)
  const loginLimiter = useRef(
    new RateLimiter(RATE_LIMIT.MAX_ATTEMPTS, RATE_LIMIT.WINDOW_MS, RATE_LIMIT.LOCKOUT_MS)
  );
  const otpLimiter = useRef(
    new RateLimiter(RATE_LIMIT.OTP_MAX, RATE_LIMIT.OTP_WINDOW_MS, RATE_LIMIT.LOCKOUT_MS)
  );

  // ── UI state
  const [mode, setMode] = useState('login');
  const [authMethod, setAuthMethod] = useState('password');
  const [otpStep, setOtpStep] = useState('idle');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // ── Form fields (raw; sanitized on submit)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [otp, setOtp] = useState('');

  // ── Derived password-strength score (0-4)
  const passwordStrength = useCallback((pw) => {
    const v = sanitize(pw);
    let score = 0;
    if (v.length >= 8) score++;
    if (v.length >= 12) score++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
    if (/[0-9]/.test(v)) score++;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(v)) score++;
    return Math.min(score, 4);
  }, []);

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];

  // ── Helpers
  const resetOtpStep = () => {
    setOtpStep('idle');
    setOtp('');
    setErrors({});
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setErrors({});
    setOtp('');
    setOtpStep('idle');
  };

  const switchMethod = (method) => {
    setAuthMethod(method);
    setErrors({});
    setOtp('');
    setOtpStep('idle');
  };

  const handleSuccess = (responseData) => {
    loginLimiter.current.reset();
    otpLimiter.current.reset();
    login(responseData);
    navigate('/dashboard', { replace: true });
  };

  // ── Input change handlers — enforce max lengths inline
  const handleEmailChange = (val) =>
    setEmail(val.slice(0, FIELD_LIMITS.EMAIL_MAX + 1));
  const handlePasswordChange = (val) =>
    setPassword(val.slice(0, FIELD_LIMITS.PASSWORD_MAX + 1));
  const handleConfirmPasswordChange = (val) =>
    setConfirmPassword(val.slice(0, FIELD_LIMITS.PASSWORD_MAX + 1));
  const handleFirstNameChange = (val) =>
    setFirstName(val.slice(0, FIELD_LIMITS.NAME_MAX + 1));
  const handleLastNameChange = (val) =>
    setLastName(val.slice(0, FIELD_LIMITS.NAME_MAX + 1));
  const handleOtpChange = (val) =>
    // Only allow digits, max 6
    setOtp(val.replace(/\D/g, '').slice(0, FIELD_LIMITS.OTP_LENGTH));

  // ── Submit handlers ──────────────────────────────────────────────────────

  /**
   * 1. Login with email + password
   */
  const handlePasswordLogin = async (e) => {
    e.preventDefault();

    // Client-side rate-limit check
    const lockMsg = loginLimiter.current.isLocked();
    if (lockMsg) {
      setErrors({ form: lockMsg });
      toast.error(lockMsg);
      return;
    }

    // Validate
    const newErrors = {};
    const emailErr = validateEmail(email);
    if (emailErr) newErrors.email = emailErr;
    const pwErr = validatePassword(password);
    if (pwErr) newErrors.password = pwErr;

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    // Record attempt BEFORE the request (prevents bypass by cancelling)
    const overLimitMsg = loginLimiter.current.record();

    try {
      const res = await loginApi({
        email: sanitize(email),
        password: sanitize(password),
      });
      toast.success(res.data.message);
      handleSuccess(res.data.data);
    } catch (err) {
      // Use generic message to avoid user enumeration
      const serverMsg = err.response?.data?.message;
      const msg =
        err.response?.status === 401 || err.response?.status === 404
          ? 'Invalid email or password.'
          : serverMsg || 'Login failed. Please try again.';
      setErrors({ form: msg });
      toast.error(msg);
      if (overLimitMsg) {
        setErrors({ form: overLimitMsg });
        toast.error(overLimitMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * 2a. Send OTP (login OTP or registration step 1)
   */
  const handleSendOtp = async (e) => {
    e.preventDefault();

    const lockMsg = otpLimiter.current.isLocked();
    if (lockMsg) {
      setErrors({ form: lockMsg });
      toast.error(lockMsg);
      return;
    }

    const newErrors = {};
    const emailErr = validateEmail(email);
    if (emailErr) newErrors.email = emailErr;

    if (mode === 'register') {
      const fnErr = validateName(firstName, 'First name');
      if (fnErr) newErrors.firstName = fnErr;
      const lnErr = validateName(lastName, 'Last name');
      if (lnErr) newErrors.lastName = lnErr;
      const pwErr = validatePassword(password, { confirmWith: confirmPassword });
      if (pwErr) newErrors.password = pwErr;
      if (!pwErr) {
        const cpErr = sanitize(password) !== sanitize(confirmPassword)
          ? 'Passwords do not match.'
          : null;
        if (cpErr) newErrors.confirmPassword = cpErr;
      }
    }

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    otpLimiter.current.record();

    try {
      if (mode === 'register') {
        const res = await registerApi({
          email: sanitize(email),
          password: sanitize(password),
          confirm_password: sanitize(confirmPassword),
          first_name: sanitize(firstName),
          last_name: sanitize(lastName),
        });
        toast.success(res.data.message);
      } else {
        const res = await sendOtp({ email: sanitize(email) });
        toast.success(res.data.message);
      }
      setOtpStep('sent');
    }  catch (err) {
  if (mode === 'register') {
    // Show real server error (e.g. "An account with this email already exists.")
    const msg = err.response?.data?.message || 'Registration failed. Please try again.';
    setErrors({ form: msg });
    toast.error(msg);
  } else {
    // Anti-enumeration for OTP login only
    const msg = 'If that email exists, an OTP has been sent.';
    setErrors({ form: msg });
    toast.success(msg);
  }
} finally {
      setLoading(false);
    }
  };

  /**
   * 2b. Verify OTP
   */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    const lockMsg = otpLimiter.current.isLocked();
    if (lockMsg) {
      setErrors({ form: lockMsg });
      toast.error(lockMsg);
      return;
    }

    const otpErr = validateOtp(otp);
    if (otpErr) {
      setErrors({ otp: otpErr });
      return;
    }

    setLoading(true);
    setErrors({});
    otpLimiter.current.record();

    try {
      const fn = mode === 'register' ? registerVerify : verifyOtp;
      const res = await fn({
        email: sanitize(email),
        otp: sanitize(otp),
      });
      toast.success(res.data.message);
      handleSuccess(res.data.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'OTP verification failed. Please try again.';
      setErrors({ otp: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Password strength meter ──────────────────────────────────────────────
  const strength = passwordStrength(password);
  const showStrength =
    (mode === 'register' || (mode === 'login' && authMethod === 'password')) &&
    password.length > 0 &&
    mode === 'register';

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={styles.page}>
      <div style={styles.card} className="glass-card page-enter">

        {/* Brand */}
        <div style={styles.brand}>
          <div style={styles.logo}>⬡</div>
          <h1 style={styles.brandName}>Helix Flow</h1>
          <p style={styles.tagline}>Manage your tasks, master your time.</p>
        </div>

        {/* Mode tabs */}
        <div style={styles.tabRow}>
          {['login', 'register'].map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              style={{ ...styles.tab, ...(mode === m ? styles.tabActive : {}) }}
            >
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Auth method tabs (login only) */}
        {mode === 'login' && otpStep === 'idle' && (
          <div style={styles.methodRow}>
            {[
              { key: 'password', label: '🔑 Password' },
              { key: 'otp', label: '📧 OTP' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => switchMethod(key)}
                style={{
                  ...styles.methodBtn,
                  ...(authMethod === key ? styles.methodBtnActive : {}),
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* OTP banner */}
        {otpStep === 'sent' && (
          <div style={styles.otpBanner}>
            📬 OTP sent to <strong>{escapeHtml(email)}</strong>
            <br />
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              Check your inbox. Valid for 10 minutes.
            </span>
          </div>
        )}

        {/* ── 1. Password login ── */}
        {mode === 'login' && authMethod === 'password' && (
          <form onSubmit={handlePasswordLogin} style={styles.form} noValidate>
            <FormField
              label="Email"
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={handleEmailChange}
              error={errors.email}
              autoComplete="email"
              maxLength={FIELD_LIMITS.EMAIL_MAX}
              inputMode="email"
            />
            <FormField
              label="Password"
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={handlePasswordChange}
              error={errors.password}
              autoComplete="current-password"
              maxLength={FIELD_LIMITS.PASSWORD_MAX}
            />
            {errors.form && (
              <p className="error-text" style={styles.centerError}>{errors.form}</p>
            )}
            <SubmitButton loading={loading}>Sign In</SubmitButton>
          </form>
        )}

        {/* ── 2. OTP login — enter email ── */}
        {mode === 'login' && authMethod === 'otp' && otpStep === 'idle' && (
          <form onSubmit={handleSendOtp} style={styles.form} noValidate>
            <FormField
              label="Email"
              id="email-otp"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={handleEmailChange}
              error={errors.email}
              autoComplete="email"
              maxLength={FIELD_LIMITS.EMAIL_MAX}
              inputMode="email"
            />
            {errors.form && (
              <p className="error-text" style={styles.centerError}>{errors.form}</p>
            )}
            <SubmitButton loading={loading}>Send OTP</SubmitButton>
          </form>
        )}

        {/* ── 3. OTP login — enter code ── */}
        {mode === 'login' && authMethod === 'otp' && otpStep === 'sent' && (
          <form onSubmit={handleVerifyOtp} style={styles.form} noValidate>
            <FormField
              label="Enter OTP"
              id="otp-login"
              type="text"
              placeholder="6-digit code"
              value={otp}
              onChange={handleOtpChange}
              error={errors.otp}
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={FIELD_LIMITS.OTP_LENGTH}
            />
            <SubmitButton loading={loading}>Verify &amp; Sign In</SubmitButton>
            <button type="button" onClick={resetOtpStep} style={styles.backLink}>
              ← Use a different email
            </button>
          </form>
        )}

        {/* ── 4. Register — fill details ── */}
        {mode === 'register' && otpStep === 'idle' && (
          <form onSubmit={handleSendOtp} style={styles.form} noValidate>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField
                label="First Name"
                id="firstName"
                placeholder="John"
                value={firstName}
                onChange={handleFirstNameChange}
                error={errors.firstName}
                autoComplete="given-name"
                maxLength={FIELD_LIMITS.NAME_MAX}
              />
              <FormField
                label="Last Name"
                id="lastName"
                placeholder="Doe"
                value={lastName}
                onChange={handleLastNameChange}
                error={errors.lastName}
                autoComplete="family-name"
                maxLength={FIELD_LIMITS.NAME_MAX}
              />
            </div>
            <FormField
              label="Email"
              id="reg-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={handleEmailChange}
              error={errors.email}
              autoComplete="email"
              maxLength={FIELD_LIMITS.EMAIL_MAX}
              inputMode="email"
            />
            <FormField
              label="Password"
              id="reg-password"
              type="password"
              placeholder="Min 8 chars · uppercase · digit · symbol"
              value={password}
              onChange={handlePasswordChange}
              error={errors.password}
              autoComplete="new-password"
              maxLength={FIELD_LIMITS.PASSWORD_MAX}
            />

            {/* Password strength meter */}
            {showStrength && (
              <div style={styles.strengthWrap}>
                <div style={styles.strengthBarTrack}>
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      style={{
                        ...styles.strengthBarSegment,
                        background: strength >= n ? strengthColors[strength] : 'rgba(255,255,255,0.1)',
                      }}
                    />
                  ))}
                </div>
                <span style={{ ...styles.strengthLabel, color: strengthColors[strength] }}>
                  {strengthLabel[strength]}
                </span>
              </div>
            )}

            <FormField
              label="Confirm Password"
              id="confirmPassword"
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              error={errors.confirmPassword}
              autoComplete="new-password"
              maxLength={FIELD_LIMITS.PASSWORD_MAX}
            />

            {/* Password requirements checklist */}
            {password.length > 0 && (
              <ul style={styles.reqList}>
                {[
                  [`≥ ${FIELD_LIMITS.PASSWORD_MIN} characters`, password.length >= FIELD_LIMITS.PASSWORD_MIN],
                  ['Uppercase letter', /[A-Z]/.test(password)],
                  ['Lowercase letter', /[a-z]/.test(password)],
                  ['Digit (0–9)', /[0-9]/.test(password)],
                  ['Special character', /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)],
                ].map(([label, met]) => (
                  <li key={label} style={{ ...styles.reqItem, color: met ? '#22c55e' : 'var(--color-text-muted)' }}>
                    <span style={{ marginRight: 6 }}>{met ? '✓' : '○'}</span>
                    {label}
                  </li>
                ))}
              </ul>
            )}

            {errors.form && (
              <p className="error-text" style={styles.centerError}>{errors.form}</p>
            )}
            <SubmitButton loading={loading}>Create Account</SubmitButton>
          </form>
        )}

        {/* ── 5. Register — verify OTP ── */}
        {mode === 'register' && otpStep === 'sent' && (
          <form onSubmit={handleVerifyOtp} style={styles.form} noValidate>
            <FormField
              label="Verification Code"
              id="otp-register"
              type="text"
              placeholder="6-digit OTP from your email"
              value={otp}
              onChange={handleOtpChange}
              error={errors.otp}
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={FIELD_LIMITS.OTP_LENGTH}
            />
            <SubmitButton loading={loading}>Verify &amp; Continue</SubmitButton>
            <button type="button" onClick={resetOtpStep} style={styles.backLink}>
              ← Go back
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    padding: '40px 36px',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  brand: { textAlign: 'center', marginBottom: 4 },
  logo: {
    fontSize: 40,
    lineHeight: 1,
    color: 'var(--color-primary-light)',
    marginBottom: 8,
  },
  brandName: {
    fontSize: 'var(--font-size-2xl)',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    background: 'linear-gradient(135deg, #f1f0ff, #9d65f5)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  tagline: {
    color: 'var(--color-text-muted)',
    fontSize: 'var(--font-size-sm)',
    marginTop: 4,
  },
  tabRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 'var(--radius-md)',
    padding: 4,
    gap: 4,
  },
  tab: {
    padding: '9px 0',
    borderRadius: 8,
    fontSize: 'var(--font-size-sm)',
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    transition: 'all var(--transition-normal)',
  },
  tabActive: {
    background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
    color: '#fff',
    boxShadow: '0 2px 8px rgba(124,58,237,0.4)',
  },
  methodRow: { display: 'flex', gap: 8 },
  methodBtn: {
    flex: 1,
    padding: '8px 0',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 500,
    color: 'var(--color-text-muted)',
    border: '1px solid var(--color-border)',
    transition: 'all var(--transition-fast)',
  },
  methodBtnActive: {
    color: 'var(--color-primary-light)',
    borderColor: 'var(--color-primary)',
    background: 'rgba(124,58,237,0.1)',
  },
  otpBanner: {
    background: 'rgba(6, 214, 160, 0.08)',
    border: '1px solid rgba(6, 214, 160, 0.2)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 16px',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-accent)',
    textAlign: 'center',
    lineHeight: 1.8,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  backLink: {
    color: 'var(--color-text-muted)',
    fontSize: 'var(--font-size-sm)',
    textAlign: 'center',
    marginTop: -4,
    transition: 'color var(--transition-fast)',
  },
  centerError: { textAlign: 'center' },
  strengthWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginTop: -8,
  },
  strengthBarTrack: {
    display: 'flex',
    gap: 4,
    flex: 1,
  },
  strengthBarSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    transition: 'background 0.3s ease',
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: 600,
    width: 44,
    textAlign: 'right',
  },
  reqList: {
    listStyle: 'none',
    padding: 0,
    margin: '-8px 0 0',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '4px 12px',
  },
  reqItem: {
    fontSize: 11,
    display: 'flex',
    alignItems: 'center',
    transition: 'color 0.2s ease',
  },
};