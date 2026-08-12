import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export function ResetPasswordScreen() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setMessage({ type: 'error', text: 'Invalid or missing password reset token.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('https://api.farma.com.ng/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password reset successfully! Redirecting to login...' });
        setTimeout(() => {
          navigate('/auth/proprietor');
        }, 2500);
      } else {
        setMessage({ type: 'error', text: 'Failed to reset password. Token may be expired or invalid.' });
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setMessage({ type: 'error', text: 'An unexpected error occurred. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ECE6D6] flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-[#F5F1E6] rounded-[6px] border border-[#101B14]/15 p-8 shadow-sm">
        
        {/* Header */}
        <div className="flex items-center space-x-3 pb-6 mb-6 border-b border-[#101B14]/15">
          <div className="bg-[#101B14] text-[#D9A63E] w-10 h-10 rounded-[8px] flex items-center justify-center font-bold text-lg">
            F
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#101B14] tracking-tight">FARMA</h1>
            <p className="text-[10px] font-mono font-bold text-[#3F6B47] uppercase tracking-wider">
              Security &amp; Access Control
            </p>
          </div>
        </div>

        <h2 className="text-lg font-bold text-[#101B14] mb-2">Set New Password</h2>
        <p className="text-xs text-[#101B14]/70 mb-6">
          Enter a strong new password for your FARMA account below.
        </p>

        {/* Feedback Alert */}
        {message && (
          <div
            className={`p-3 rounded-[4px] text-xs font-medium mb-4 border ${
              message.type === 'success'
                ? 'bg-[#3F6B47]/10 border-[#3F6B47]/30 text-[#3F6B47]'
                : 'bg-red-500/10 border-red-500/30 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Reset Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#101B14]/70 mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-[#ECE6D6] border border-[#101B14]/20 rounded-[4px] px-3 py-2 text-sm text-[#161F17] focus:outline-none focus:border-[#3F6B47]"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#101B14]/70 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#ECE6D6] border border-[#101B14]/20 rounded-[4px] px-3 py-2 text-sm text-[#161F17] focus:outline-none focus:border-[#3F6B47]"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full mt-2 bg-[#D9A63E] hover:bg-[#c49332] text-[#101B14] font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-[4px] transition disabled:opacity-50"
          >
            {loading ? 'Updating Credentials...' : 'Update Password →'}
          </button>
        </form>
      </div>
    </div>
  );
}