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
            setMessage({ type: 'error', text: 'Invalid or missing password reset link.' });
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
                setMessage({ type: 'error', text: 'Failed to reset password. The link may have expired.' });
            }
        } catch (err) {
            console.error('Password reset error:', err);
            setMessage({ type: 'error', text: 'An unexpected error occurred. Please try again later.' });
        } finally {
            setLoading(false);
        }
    };

    // Shared input styling for perfect equilibrium with the AuthScreen
    const inputClasses = "w-full px-4 py-3 rounded-xl bg-[#ECE6D6]/50 border border-[#101B14]/10 text-[#101B14] text-sm placeholder-[#8FA091] focus:bg-white focus:outline-none focus:border-[#D9A63E] focus:ring-4 focus:ring-[#D9A63E]/20 transition-all duration-300";

    // If there's no token present in the URL query string, show the invalid link fallback
    if (!token) {
        return (
            <div className="min-h-screen bg-[#ECE6D6] relative flex flex-col justify-center py-8 px-4 font-sans overflow-hidden">
                {/* Aesthetic Ambient Background Orbs */}
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#3F6B47] rounded-full mix-blend-multiply filter blur-[128px] opacity-40 pointer-events-none animate-pulse" style={{ animationDuration: '8s' }}></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#D9A63E] rounded-full mix-blend-multiply filter blur-[128px] opacity-30 pointer-events-none animate-pulse" style={{ animationDuration: '10s' }}></div>

                <div className="relative sm:mx-auto sm:w-full sm:max-w-[28rem] z-10">
                    <div className="bg-[#FBF9F5] py-8 sm:py-10 px-6 sm:px-12 shadow-2xl shadow-[#101B14]/10 border border-white/60 rounded-[2rem] backdrop-blur-sm text-center">
                        
                        {/* Branding Header */}
                        <div className="text-center mb-8">
                            <button onClick={() => navigate('/')} className="inline-flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity cursor-pointer">
                                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#101B14] text-[#D9A63E] shadow-lg shadow-[#101B14]/20">
                                    <span className="font-['Fraunces',serif] font-bold text-2xl">F</span>
                                </div>
                                <span className="font-['Fraunces',serif] font-extrabold text-3xl text-[#101B14] tracking-tight">Farma</span>
                            </button>
                            <h2 className="text-2xl font-extrabold text-[#101B14] font-['Fraunces',serif] tracking-tight mt-2">Invalid Link</h2>
                            <p className="text-[10px] font-bold tracking-widest text-[#3F6B47] uppercase mt-2">
                                Account Recovery
                            </p>
                        </div>

                        <p className="text-sm font-medium text-[#101B14]/60 mt-3 mb-8 leading-relaxed">
                            This password reset link is invalid or has expired. Please go back to the login page and request a new one.
                        </p>

                        <button
                            onClick={() => navigate('/auth/proprietor')}
                            className="w-full mt-4 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#101B14] to-[#1c2e22] text-[#FBF9F5] font-extrabold text-xs uppercase tracking-wider shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:outline-none transform transition-all duration-300 cursor-pointer"
                        >
                            Return to Login →
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#ECE6D6] relative flex flex-col justify-center py-8 px-4 font-sans overflow-hidden">
            
            {/* Aesthetic Ambient Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#3F6B47] rounded-full mix-blend-multiply filter blur-[128px] opacity-40 pointer-events-none animate-pulse" style={{ animationDuration: '8s' }}></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#D9A63E] rounded-full mix-blend-multiply filter blur-[128px] opacity-30 pointer-events-none animate-pulse" style={{ animationDuration: '10s' }}></div>

            <div className="relative sm:mx-auto sm:w-full sm:max-w-[28rem] z-10">
                <div className="bg-[#FBF9F5] py-8 sm:py-10 px-6 sm:px-12 shadow-2xl shadow-[#101B14]/10 border border-white/60 rounded-[2rem] backdrop-blur-sm">
                    
                    {/* Branding Header */}
                    <div className="text-center mb-8">
                        <button onClick={() => navigate('/')} className="inline-flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity cursor-pointer">
                            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#101B14] text-[#D9A63E] shadow-lg shadow-[#101B14]/20">
                                <span className="font-['Fraunces',serif] font-bold text-2xl">F</span>
                            </div>
                            <span className="font-['Fraunces',serif] font-extrabold text-3xl text-[#101B14] tracking-tight">Farma</span>
                        </button>
                        
                        <h2 className="text-2xl font-extrabold text-[#101B14] font-['Fraunces',serif] tracking-tight mt-2">Set New Password</h2>
                        <p className="text-[10px] font-bold tracking-widest text-[#3F6B47] uppercase mt-2">
                            Account Recovery
                        </p>
                    </div>

                    <p className="text-xs font-medium text-[#101B14]/60 text-center mb-6">
                        Enter a strong new password for your Farma account below.
                    </p>

                    {/* Feedback Alert */}
                    {message && (
                        <div className={`mb-6 p-4 rounded-xl text-xs flex items-start space-x-3 shadow-sm ${message.type === 'success' ? 'bg-[#3F6B47]/10 border border-[#3F6B47]/20 text-[#2A5C38]' : 'bg-red-50 border border-red-100 text-red-600'}`}>
                            <span className="shrink-0 font-bold text-sm">{message.type === 'success' ? '✅' : '⚠️'}</span>
                            <span className="font-medium leading-relaxed">{message.text}</span>
                        </div>
                    )}

                    {/* Reset Form */}
                    <form onSubmit={handleSubmit} className="space-y-5 text-left">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#101B14]/60 mb-1.5 pl-1">
                                New Password
                            </label>
                            <input
                                type="password"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className={inputClasses}
                                placeholder="••••••••"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#101B14]/60 mb-1.5 pl-1">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={inputClasses}
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-4 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#D9A63E] to-[#c49332] text-[#101B14] font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#D9A63E]/20 hover:shadow-[#D9A63E]/40 hover:-translate-y-0.5 focus:outline-none transform transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#101B14]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    <span>Updating...</span>
                                </>
                            ) : (
                                <span>Update Password →</span>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}