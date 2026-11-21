import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Circle,
  AlertCircle,
  Building2,
  UserCheck,
  ShieldCheck
} from 'lucide-react';
import { authService } from '../../services/authService';
import {
  OrganisationType,
  type AuthResponseDto,
  type LoginRequestDto,
  type OrganisationRequestDto
} from '../../types/auth';

interface AuthScreenProps {
  onAuthSuccess: (authData: AuthResponseDto) => void;
  portalType: 'PROPRIETOR' | 'MANAGER';
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, portalType }) => {
  const navigate = useNavigate();
  const [portalOverride, setPortalOverride] = useState<'PROPRIETOR' | 'MANAGER' | null>(null);
  const activePortal = portalOverride ?? portalType;
  const isManager = activePortal === 'MANAGER';

  // Wipe stale session data immediately on mount
  useEffect(() => {
    localStorage.removeItem('farma_jwt');
    localStorage.removeItem('farma_auth');
  }, []);

  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [isForgotPassword, setIsForgotPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Password visibility toggles
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);

  // Rate Limiting & Cooldown State
  const failedAttemptsRef = useRef<number>(0);
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);

  const [loginData, setLoginData] = useState<LoginRequestDto>({
    email: '',
    password: ''
  });

  const [resetEmail, setResetEmail] = useState<string>('');

  const [regData, setRegData] = useState<OrganisationRequestDto>({
    name: '',
    organisationType: OrganisationType.PRIVATE,
    email: '',
    registrationNumber: '',
    adminFirstName: '',
    adminLastName: '',
    password: ''
  });

  const [passwordValidations, setPasswordValidations] = useState({
    length: false,
    casing: false,
    number: false,
    special: false
  });

  const isPasswordStrong = Object.values(passwordValidations).every(Boolean);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (lockoutTimer > 0) {
      timer = setTimeout(() => setLockoutTimer((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [lockoutTimer]);

  const handlePasswordChange = (password: string) => {
    setRegData({ ...regData, password });
    setPasswordValidations({
      length: password.length >= 8,
      casing: /[a-z]/.test(password) && /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    });
  };

  const switchPortalRole = (role: 'PROPRIETOR' | 'MANAGER') => {
    setPortalOverride(role);
    setErrorMessage(null);
    setSuccessMessage(null);
    if (role === 'MANAGER') {
      setIsLogin(true);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTimer > 0) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await authService.login(loginData);

      failedAttemptsRef.current = 0;
      onAuthSuccess(response);

      if (response.requiresPasswordChange) {
        navigate('/auth/setup-password', { replace: true });
        return;
      }

      const userRole = response.role?.toUpperCase();
      const targetPath = userRole === 'MANAGER' ? '/manager/dashboard' : '/proprietor/dashboard';
      navigate(targetPath, { replace: true });
    } catch (error: unknown) {
      failedAttemptsRef.current += 1;
      if (failedAttemptsRef.current >= 4) {
        setLockoutTimer(30);
        failedAttemptsRef.current = 0;
      }

      if (axios.isAxiosError(error) && !error.response) {
        setErrorMessage('Network error. Please check your internet connection.');
      } else {
        setErrorMessage('Invalid email or password. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
      setLoginData((prev) => ({ ...prev, password: '' }));
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await axios.post('https://api.farma.com.ng/api/v1/auth/forgot-password', {
        email: resetEmail
      });
    } catch {
      console.debug('Password reset request processed.');
    } finally {
      setLoading(false);
      setSuccessMessage(
        isManager
          ? 'If your email is registered, we have sent password reset instructions to your inbox.'
          : 'If your email is registered, we have sent a secure password reset link to your inbox.'
      );
      setResetEmail('');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      await authService.registerOrganisation(regData);

      const authResponse = await authService.login({
        email: regData.email,
        password: regData.password
      });

      onAuthSuccess(authResponse);
      navigate('/proprietor/dashboard', { replace: true });
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const serverMsg = error.response?.data?.message;

        if (status === 409 || (serverMsg && serverMsg.toLowerCase().includes('already'))) {
          setErrorMessage('An account with this email or registration number already exists.');
        } else if (status === 400) {
          setErrorMessage('Please ensure all required fields are filled out correctly.');
        } else {
          setErrorMessage('Registration failed. Please try again.');
        }
      } else {
        setErrorMessage('A network error occurred. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClasses =
    'w-full px-4 py-3 rounded-xl bg-[#F7F8F5] border border-gray-200 text-[#18261B] text-sm placeholder-gray-400 focus:bg-white focus:outline-none focus:border-[#4C7A2B] focus:ring-4 focus:ring-[#84A93C]/20 transition-all duration-200';

  return (
    <div className="min-h-screen bg-[#F7F8F5] text-[#1A241B] font-sans antialiased flex flex-col justify-between relative overflow-hidden selection:bg-[#84A93C] selection:text-white">
      {/* Subtle Ambient Background Accent */}
      <div className="absolute top-0 inset-x-0 h-72 bg-[#13311C] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 select-none">
          <div className="w-9 h-9 rounded-full bg-[#84A93C] flex items-center justify-center shadow-md">
            <span className="font-bold text-lg text-[#13311C] leading-none">F</span>
          </div>
          <div className="text-left leading-tight">
            <span className="text-lg font-extrabold tracking-tight text-white block">Farma</span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#A8C868] block">
              Farm Management OS
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-white/85 hover:text-white bg-white/10 hover:bg-white/15 px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#A8C868]" />
          <span>Back to Home</span>
        </button>
      </header>

      {/* Main Auth Card Container */}
      <main
        className={`relative z-10 w-full mx-auto px-4 sm:px-6 my-auto py-6 transition-all duration-300 ${
          !isLogin && !isForgotPassword ? 'max-w-4xl' : 'max-w-md'
        }`}
      >
        <div className="bg-white py-8 sm:py-10 px-6 sm:px-10 shadow-xl shadow-black/10 border border-gray-100 rounded-3xl">
          {/* Card Header */}
          <div className="text-center mb-7">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF4E4] text-[#3A6324] text-[11px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              {isManager
                ? 'Facility Manager Access'
                : isForgotPassword
                  ? 'Account Recovery'
                  : isLogin
                    ? 'Organisation Owner Access'
                    : 'New Organisation Onboarding'}
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18261B] tracking-tight mt-3">
              {isForgotPassword
                ? 'Reset Password'
                : isLogin
                  ? 'Sign In to Farma'
                  : 'Register Your Farm'}
            </h1>

            <p className="text-xs text-[#5C6B5E] mt-1.5 max-w-sm mx-auto">
              {isForgotPassword
                ? 'Enter your registered email address to receive recovery instructions.'
                : isLogin
                  ? 'Access your multi-tenant farm workspace and real-time operational records.'
                  : 'Create your master organisation account to manage facilities, staff, and flock margins.'}
            </p>
          </div>

          {/* Role Switcher Pill (Login Only) */}
          {isLogin && !isForgotPassword && (
            <div className="mb-6 grid grid-cols-2 p-1 bg-[#F7F8F5] rounded-xl border border-gray-200/80">
              <button
                type="button"
                onClick={() => switchPortalRole('PROPRIETOR')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  !isManager
                    ? 'bg-[#13311C] text-white shadow-xs'
                    : 'text-[#5C6B5E] hover:text-[#18261B]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Organisation Owner</span>
              </button>
              <button
                type="button"
                onClick={() => switchPortalRole('MANAGER')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isManager
                    ? 'bg-[#13311C] text-white shadow-xs'
                    : 'text-[#5C6B5E] hover:text-[#18261B]'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Facility Manager</span>
              </button>
            </div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Success Alert */}
          {successMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-[#EEF4E4] border border-[#84A93C]/40 text-[#13311C] text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#3A6324] shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{successMessage}</span>
            </div>
          )}

          {/* ==================== FORGOT PASSWORD VIEW ==================== */}
          {isForgotPassword ? (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-5">
              <p className="text-xs text-[#5C6B5E] leading-relaxed bg-[#F7F8F5] p-3.5 rounded-xl border border-gray-200/70">
                {isManager
                  ? 'Enter your manager email address to receive a password reset link, or contact your organisation owner to issue a temporary password.'
                  : 'Enter your proprietor email address and we will send a secure link to reset your password.'}
              </p>

              <div>
                <label className="block text-xs font-bold text-[#18261B] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder={isManager ? 'manager@farma.com.ng' : 'owner@farma.com.ng'}
                  className={inputClasses}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-[#84A93C] hover:bg-[#95BD42] text-[#13311C] font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? 'Sending Reset Link...' : 'Send Reset Link'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>

              <div className="text-center pt-5 border-t border-gray-100 text-xs text-[#5C6B5E]">
                Remembered your password?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="font-bold text-[#3A6324] hover:text-[#13311C] transition-colors cursor-pointer ml-1"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          ) : isLogin ? (
            /* ==================== LOGIN VIEW ==================== */
            <div>
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#18261B] mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    autoComplete="username"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    placeholder={isManager ? 'manager@farma.com.ng' : 'owner@farma.com.ng'}
                    className={inputClasses}
                    disabled={lockoutTimer > 0}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-[#18261B]">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="text-xs font-semibold text-[#3A6324] hover:text-[#13311C] transition-colors cursor-pointer"
                      disabled={lockoutTimer > 0}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      placeholder="••••••••"
                      className={`${inputClasses} pr-11`}
                      disabled={lockoutTimer > 0}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      disabled={lockoutTimer > 0}
                      aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-[#18261B] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {showLoginPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || lockoutTimer > 0}
                  className={`w-full mt-2 py-3.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    lockoutTimer > 0
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-[#84A93C] hover:bg-[#95BD42] text-[#13311C] shadow-md disabled:opacity-50'
                  }`}
                >
                  {lockoutTimer > 0 ? (
                    <span>Too many attempts — try again in {lockoutTimer}s</span>
                  ) : loading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>
                        {isManager ? 'Sign In to Facility Workspace' : 'Sign In to Owner Portal'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {!isManager ? (
                <div className="mt-7 pt-5 border-t border-gray-100 text-center text-xs text-[#5C6B5E]">
                  New to Farma?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(false);
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="font-bold text-[#3A6324] hover:text-[#13311C] transition-colors cursor-pointer ml-1"
                  >
                    Register your farm organisation
                  </button>
                </div>
              ) : (
                <div className="mt-7 pt-5 border-t border-gray-100 text-center text-[11px] text-[#5C6B5E]">
                  Facility Manager accounts are provisioned by your Organisation Owner.
                </div>
              )}
            </div>
          ) : (
            /* ==================== REGISTRATION VIEW ==================== */
            <form onSubmit={handleRegisterSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Step 1: Organisation Details */}
                <div className="bg-[#F7F8F5] p-5 rounded-2xl border border-gray-200/80 space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-gray-200/70">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#13311C] text-[#A8C868] text-xs font-bold">
                      1
                    </span>
                    <span className="text-xs font-extrabold text-[#18261B] uppercase tracking-wider">
                      Organisation Details
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#18261B] mb-1.5">
                      Organisation / Farm Name
                    </label>
                    <input
                      type="text"
                      required
                      value={regData.name}
                      onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                      placeholder="e.g. Green Pastures Poultry Ltd"
                      className={`${inputClasses} bg-white`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#18261B] mb-1.5">
                      Business Structure
                    </label>
                    <select
                      value={regData.organisationType}
                      onChange={(e) =>
                        setRegData({
                          ...regData,
                          organisationType: e.target.value as OrganisationType
                        })
                      }
                      className={`${inputClasses} bg-white cursor-pointer`}
                    >
                      <option value={OrganisationType.PRIVATE}>Private Enterprise</option>
                      <option value={OrganisationType.PUBLIC}>Public / Cooperative</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#18261B] mb-1.5">
                      CAC / Registration No. <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={regData.registrationNumber}
                      onChange={(e) =>
                        setRegData({ ...regData, registrationNumber: e.target.value })
                      }
                      placeholder="e.g. RC-1948201"
                      className={`${inputClasses} bg-white`}
                    />
                  </div>
                </div>

                {/* Step 2: Proprietor Details */}
                <div className="bg-[#F7F8F5] p-5 rounded-2xl border border-gray-200/80 space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-gray-200/70">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#3A6324] text-white text-xs font-bold">
                      2
                    </span>
                    <span className="text-xs font-extrabold text-[#18261B] uppercase tracking-wider">
                      Owner Account Details
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-[#18261B] mb-1.5">
                        First Name
                      </label>
                      <input
                        type="text"
                        required
                        autoComplete="given-name"
                        value={regData.adminFirstName}
                        onChange={(e) =>
                          setRegData({ ...regData, adminFirstName: e.target.value })
                        }
                        placeholder="John"
                        className={`${inputClasses} bg-white`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#18261B] mb-1.5">
                        Last Name
                      </label>
                      <input
                        type="text"
                        required
                        autoComplete="family-name"
                        value={regData.adminLastName}
                        onChange={(e) =>
                          setRegData({ ...regData, adminLastName: e.target.value })
                        }
                        placeholder="Adeyemi"
                        className={`${inputClasses} bg-white`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#18261B] mb-1.5">
                      Work Email Address
                    </label>
                    <input
                      type="email"
                      required
                      autoComplete="username"
                      value={regData.email}
                      onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                      placeholder="owner@yourfarm.com"
                      className={`${inputClasses} bg-white`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#18261B] mb-1.5">
                      Create Password
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        minLength={8}
                        value={regData.password}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        placeholder="••••••••"
                        className={`${inputClasses} bg-white pr-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-[#18261B] transition-colors cursor-pointer"
                      >
                        {showRegPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Password Strength Checklist */}
                    <div className="mt-2.5 grid grid-cols-2 gap-1.5 p-3 bg-white rounded-xl border border-gray-200/80">
                      <div
                        className={`text-[11px] font-semibold flex items-center gap-1.5 ${
                          passwordValidations.length ? 'text-[#3A6324]' : 'text-gray-400'
                        }`}
                      >
                        {passwordValidations.length ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>8+ characters</span>
                      </div>
                      <div
                        className={`text-[11px] font-semibold flex items-center gap-1.5 ${
                          passwordValidations.casing ? 'text-[#3A6324]' : 'text-gray-400'
                        }`}
                      >
                        {passwordValidations.casing ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>Upper &amp; lowercase</span>
                      </div>
                      <div
                        className={`text-[11px] font-semibold flex items-center gap-1.5 ${
                          passwordValidations.number ? 'text-[#3A6324]' : 'text-gray-400'
                        }`}
                      >
                        {passwordValidations.number ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>At least 1 number</span>
                      </div>
                      <div
                        className={`text-[11px] font-semibold flex items-center gap-1.5 ${
                          passwordValidations.special ? 'text-[#3A6324]' : 'text-gray-400'
                        }`}
                      >
                        {passwordValidations.special ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>Special character</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="max-w-md mx-auto pt-1">
                <button
                  type="submit"
                  disabled={loading || !isPasswordStrong}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#84A93C] hover:bg-[#95BD42] text-[#13311C] font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>
                    {loading ? 'Creating Organisation Workspace...' : 'Complete Registration'}
                  </span>
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>

                <div className="mt-6 pt-5 border-t border-gray-100 text-center text-xs text-[#5C6B5E]">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true);
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="font-bold text-[#3A6324] hover:text-[#13311C] transition-colors cursor-pointer ml-1"
                  >
                    Sign in here
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 py-5 text-center text-xs text-[#5C6B5E]">
        <span>© {new Date().getFullYear()} Farma Technologies (farma.com.ng)</span>
        <span className="mx-2">&bull;</span>
        <a href="/privacy" className="hover:text-[#18261B] transition-colors">
          Privacy Policy
        </a>
        <span className="mx-2">&bull;</span>
        <a href="/terms" className="hover:text-[#18261B] transition-colors">
          Terms of Service
        </a>
      </footer>
    </div>
  );
};

export default AuthScreen;