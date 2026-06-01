import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FormField   from '../components/common/FormField';
import SubmitButton from '../components/common/SubmitButton';
import { useAuth } from '../hooks/useAuth';
import {
  login as loginApi,
  register as registerApi,
  registerVerify,
  sendOtp,
  verifyOtp,
} from '../api/authApi';

// ── Main Component ─────────────────────────────────────────────────────────

export default function Login() {
  const navigate  = useNavigate();
  const { login } = useAuth();

  // ── UI state ──────────────────────────────────────────────────────────────
  const [mode,       setMode]       = useState('login');   
  const [authMethod, setAuthMethod] = useState('password'); 
  const [otpStep,    setOtpStep]    = useState('idle');    
  const [loading,    setLoading]    = useState(false);
  const [errors,     setErrors]     = useState({});

  // ── Form fields ───────────────────────────────────────────────────────────
  const [email,           setEmail]          = useState('');
  const [password,        setPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName,       setFirstName]      = useState('');
  const [lastName,        setLastName]       = useState('');
  const [otp,             setOtp]            = useState('');

  // ── Helpers ───────────────────────────────────────────────────────────────

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
    login(responseData);
    navigate('/dashboard', { replace: true });
  };

  // ── Submit handlers ───────────────────────────────────────────────────────

  /**
   * 1. Login with email + password
   */
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const res = await loginApi({ email, password });
      toast.success(res.data.message);
      handleSuccess(res.data.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      setErrors({ form: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 2a. Send OTP (for both passwordless login and registration step 2)
   */
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      if (mode === 'register') {
        // Register step 1 — validate + create account + send OTP
        const res = await registerApi({
          email,
          password,
          confirm_password: confirmPassword,
          first_name: firstName,
          last_name: lastName,
        });
        toast.success(res.data.message);
      } else {
        // Passwordless login — just send OTP
        const res = await sendOtp({ email });
        toast.success(res.data.message);
      }
      setOtpStep('sent');
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong.';
      setErrors({ form: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 2b. Verify OTP (for both passwordless login and registration step 2)
   */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const fn = mode === 'register' ? registerVerify : verifyOtp;
      const res = await fn({ email, otp });
      toast.success(res.data.message);
      handleSuccess(res.data.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'OTP verification failed.';
      setErrors({ otp: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={styles.page}>
      <div style={styles.card} className="glass-card page-enter">

        {/* ── Brand ── */}
        <div style={styles.brand}>
          <div style={styles.logo}>⬡</div>
          <h1 style={styles.brandName}>Helix Flow</h1>
          <p style={styles.tagline}>Manage your tasks, master your time.</p>
        </div>

        {/* ── Mode tabs: Login / Register ── */}
        <div style={styles.tabRow}>
          {['login', 'register'].map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              style={{
                ...styles.tab,
                ...(mode === m ? styles.tabActive : {}),
              }}
            >
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* ── Auth method tabs (only in login mode) ── */}
        {mode === 'login' && otpStep === 'idle' && (
          <div style={styles.methodRow}>
            {[
              { key: 'password', label: '🔑 Password' },
              { key: 'otp',      label: '📧 OTP' },
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

        {/* ── OTP sent confirmation banner ── */}
        {otpStep === 'sent' && (
          <div style={styles.otpBanner}>
            📬 OTP sent to <strong>{email}</strong>
            <br />
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              Check your inbox. Valid for 10 minutes.
            </span>
          </div>
        )}

        {/* ── Forms ── */}

        {/* 1. Password login */}
        {mode === 'login' && authMethod === 'password' && (
          <form onSubmit={handlePasswordLogin} style={styles.form}>
            <FormField label="Email" id="email" type="email"
              placeholder="you@example.com"
              value={email} onChange={setEmail} />
            <FormField label="Password" id="password" type="password"
              placeholder="Enter your password"
              value={password} onChange={setPassword} />
            {errors.form && <p className="error-text" style={{ textAlign: 'center' }}>{errors.form}</p>}
            <SubmitButton loading={loading}>Sign In</SubmitButton>
          </form>
        )}

        {/* 2. OTP login — step 1: enter email */}
        {mode === 'login' && authMethod === 'otp' && otpStep === 'idle' && (
          <form onSubmit={handleSendOtp} style={styles.form}>
            <FormField label="Email" id="email-otp" type="email"
              placeholder="you@example.com"
              value={email} onChange={setEmail} />
            {errors.form && <p className="error-text" style={{ textAlign: 'center' }}>{errors.form}</p>}
            <SubmitButton loading={loading}>Send OTP</SubmitButton>
          </form>
        )}

        {/* 3. OTP login — step 2: enter OTP */}
        {mode === 'login' && authMethod === 'otp' && otpStep === 'sent' && (
          <form onSubmit={handleVerifyOtp} style={styles.form}>
            <FormField label="Enter OTP" id="otp-login" type="text"
              placeholder="6-digit code"
              value={otp} onChange={setOtp} error={errors.otp} />
            <SubmitButton loading={loading}>Verify & Sign In</SubmitButton>
            <button type="button" onClick={resetOtpStep} style={styles.backLink}>
              ← Use a different email
            </button>
          </form>
        )}

        {/* 4. Register — step 1: fill details */}
        {mode === 'register' && otpStep === 'idle' && (
          <form onSubmit={handleSendOtp} style={styles.form}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="First Name" id="firstName" placeholder="John"
                value={firstName} onChange={setFirstName} />
              <FormField label="Last Name" id="lastName" placeholder="Doe"
                value={lastName} onChange={setLastName} />
            </div>
            <FormField label="Email" id="reg-email" type="email"
              placeholder="you@example.com"
              value={email} onChange={setEmail} />
            <FormField label="Password" id="reg-password" type="password"
              placeholder="Min 8 chars, 1 uppercase, 1 digit"
              value={password} onChange={setPassword} />
            <FormField label="Confirm Password" id="confirmPassword" type="password"
              placeholder="Repeat your password"
              value={confirmPassword} onChange={setConfirmPassword} />
            {errors.form && <p className="error-text" style={{ textAlign: 'center' }}>{errors.form}</p>}
            <SubmitButton loading={loading}>Create Account</SubmitButton>
          </form>
        )}

        {/* 5. Register — step 2: verify OTP */}
        {mode === 'register' && otpStep === 'sent' && (
          <form onSubmit={handleVerifyOtp} style={styles.form}>
            <FormField label="Verification Code" id="otp-register" type="text"
              placeholder="6-digit OTP from your email"
              value={otp} onChange={setOtp} error={errors.otp} />
            <SubmitButton loading={loading}>Verify & Continue</SubmitButton>
            <button type="button" onClick={resetOtpStep} style={styles.backLink}>
              ← Go back
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

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
  brand: {
    textAlign: 'center',
    marginBottom: 4,
  },
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
  methodRow: {
    display: 'flex',
    gap: 8,
  },
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
};