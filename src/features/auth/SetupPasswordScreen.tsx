import React, { useState } from 'react';
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
  ShieldCheck
} from 'lucide-react';

export const SetupPasswordScreen: React.FC = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const passwordValidations = {
    length: newPassword.length >= 8,
    casing: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword),
    number: /\d/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword)
  };
  const isPasswordStrong = Object.values(passwordValidations).every(Boolean);
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordStrong) {
      setMessage({ type: 'error', text: 'Please meet all password strength requirements.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('farma_jwt');

      if (!token) {
        setMessage({
          type: 'error',
          text: 'Authentication session expired. Please sign in again.'
        });
        setLoading(false);
        return;
      }

      await axios.post(
        'https://api.farma.com.ng/api/v1/auth/force-password-update',
        { newPassword },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      const authDataString = localStorage.getItem('farma_auth');
      if (authDataString) {
        const authData = JSON.parse(authDataString);
        authData.requiresPasswordChange = false;
        localStorage.setItem('farma_auth', JSON.stringify(authData));
      }

      setMessage({
        type: 'success',
        text: 'Account secured! Redirecting to your facility workspace...'
      });

      setTimeout(() => {
        navigate('/manager/dashboard', { replace: true });
      }, 2000);
    } catch (err: unknown) {
      console.error('Password setup error:', err);
      setMessage({
        type: 'error',
        text: 'Failed to update password. Please check your connection and try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const inputClasses =
    'w-full px-4 py-3 rounded-xl bg-[#F7F8F5] border border-gray-200 text-[#18261B] text-sm placeholder-gray-400 focus:bg-white focus:outline-none focus:border-[#4C7A2B] focus:ring-4 focus:ring-[#84A93C]/20 transition-all duration-200';

  return (
    <div className="min-h-screen bg-[#F7F8F5] text-[#1A241B] font-sans antialiased flex flex-col justify-between relative overflow-hidden selection:bg-[#84A93C] selection:text-white">
      {/* Top Forest Green Banner */}
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
          onClick={() => navigate('/auth/manager')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-white/85 hover:text-white bg-white/10 hover:bg-white/15 px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#A8C868]" />
          <span>Back to Sign In</span>
        </button>
      </header>

      {/* Main Card */}
      <main className="relative z-10 w-full max-w-md mx-auto px-4 sm:px-6 my-auto py-6">
        <div className="bg-white py-8 sm:py-10 px-6 sm:px-10 shadow-xl shadow-black/10 border border-gray-100 rounded-3xl">
          <div className="text-center mb-7">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF4E4] text-[#3A6324] text-[11px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              First-Time Security Setup
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18261B] tracking-tight mt-3">
              Secure Your Account
            </h1>

            <p className="text-xs text-[#5C6B5E] mt-1.5 leading-relaxed">
              Replace your temporary onboarding password with a personal password before entering
              your facility workspace.
            </p>
          </div>

          {message && (
            <div
              className={`mb-6 p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                message.type === 'success'
                  ? 'bg-[#EEF4E4] border border-[#84A93C]/40 text-[#13311C]'
                  : 'bg-red-50 border border-red-200/80 text-red-700'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-[#3A6324] shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <span className="font-medium leading-relaxed">{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#18261B] mb-1.5">
                Create New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`${inputClasses} pr-11`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-[#18261B] transition-colors cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Checklist */}
              <div className="mt-2.5 grid grid-cols-2 gap-1.5 p-3 bg-[#F7F8F5] rounded-xl border border-gray-200/80">
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

            <div>
              <label className="block text-xs font-bold text-[#18261B] mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`${inputClasses} pr-11`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-[#18261B] transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-[11px] font-semibold text-red-600 mt-1.5">
                  Passwords do not match yet.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordStrong || !passwordsMatch}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#84A93C] hover:bg-[#95BD42] text-[#13311C] font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>{loading ? 'Securing Account...' : 'Save & Enter Workspace'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
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

export default SetupPasswordScreen;