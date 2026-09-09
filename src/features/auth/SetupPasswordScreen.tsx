import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export const SetupPasswordScreen: React.FC = () => {
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // --- Dynamic Password Validation State ---
    const passwordValidations = {
        length: newPassword.length >= 8,
        casing: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword),
        number: /\d/.test(newPassword),
        special: /[@$!%*?&]/.test(newPassword),
    };
    const isPasswordStrong = Object.values(passwordValidations).every(Boolean);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match.' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            // Retrieve the JWT token saved during the intercepted login
            const token = localStorage.getItem('farma_jwt'); 

            if (!token) {
                setMessage({ type: 'error', text: 'Authentication session lost. Please log in again.' });
                setLoading(false);
                return;
            }

            // Hit our brand new backend endpoint
            await axios.post('https://api.farma.com.ng/api/v1/auth/force-password-update', 
                { newPassword },
                { 
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    } 
                }
            );

            // We must also update the local storage auth flag so the app knows the user is clear
            const authDataString = localStorage.getItem('farma_auth');
            if (authDataString) {
                const authData = JSON.parse(authDataString);
                authData.requiresPasswordChange = false;
                localStorage.setItem('farma_auth', JSON.stringify(authData));
            }

            setMessage({ type: 'success', text: 'Account secured! Redirecting to your workspace...' });
            
            // Push them directly to the Manager Dashboard
            setTimeout(() => {
                navigate('/manager/dashboard', { replace: true });
            }, 2000);

        } catch (err: unknown) {
            console.error('Password setup error:', err);
            setMessage({ type: 'error', text: 'Failed to update password. Please check your connection and try again.' });
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "w-full px-4 py-3 rounded-xl bg-[#ECE6D6]/50 border border-[#101B14]/10 text-[#101B14] text-sm placeholder-[#8FA091] focus:bg-white focus:outline-none focus:border-[#D9A63E] focus:ring-4 focus:ring-[#D9A63E]/20 transition-all duration-300";

    return (
        <div className="min-h-screen bg-[#ECE6D6] relative flex flex-col justify-center py-8 px-4 font-sans overflow-hidden">
            {/* Aesthetic Ambient Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#3F6B47] rounded-full mix-blend-multiply filter blur-[128px] opacity-40 pointer-events-none animate-pulse" style={{ animationDuration: '8s' }}></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#D9A63E] rounded-full mix-blend-multiply filter blur-[128px] opacity-30 pointer-events-none animate-pulse" style={{ animationDuration: '10s' }}></div>

            <div className="relative sm:mx-auto sm:w-full sm:max-w-[28rem] z-10">
                <div className="bg-[#FBF9F5] py-8 sm:py-10 px-6 sm:px-12 shadow-2xl shadow-[#101B14]/10 border border-white/60 rounded-[2rem] backdrop-blur-sm">
                    
                    {/* Branding Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-3 mb-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#101B14] text-[#D9A63E] shadow-lg shadow-[#101B14]/20">
                                <span className="font-['Fraunces',serif] font-bold text-2xl">F</span>
                            </div>
                            <span className="font-['Fraunces',serif] font-extrabold text-3xl text-[#101B14] tracking-tight">Farma</span>
                        </div>
                        <h2 className="text-2xl font-extrabold text-[#101B14] font-['Fraunces',serif] tracking-tight mt-2">Secure Your Account</h2>
                        <p className="text-[10px] font-bold tracking-widest text-[#3F6B47] uppercase mt-2">Action Required</p>
                    </div>

                    <p className="text-xs font-medium text-[#101B14]/60 text-center mb-6 leading-relaxed">
                        For security reasons, you must change your auto-generated temporary password before accessing the farm workspace.
                    </p>

                    {/* Feedback Alert */}
                    {message && (
                        <div className={`mb-6 p-4 rounded-xl text-xs flex items-start space-x-3 shadow-sm ${message.type === 'success' ? 'bg-[#3F6B47]/10 border border-[#3F6B47]/20 text-[#2A5C38]' : 'bg-red-50 border border-red-100 text-red-600'}`}>
                            <span className="shrink-0 font-bold text-sm">{message.type === 'success' ? '✅' : '⚠️'}</span>
                            <span className="font-medium leading-relaxed">{message.text}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5 text-left">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#101B14]/60 mb-1.5 pl-1">New Password</label>
                            <div className="relative">
                                <input 
                                    type={showPassword ? 'text' : 'password'} 
                                    required 
                                    value={newPassword} 
                                    onChange={(e) => setNewPassword(e.target.value)} 
                                    className={`${inputClasses} pr-12`} 
                                    placeholder="••••••••" 
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#8FA091] hover:text-[#101B14] transition-colors cursor-pointer">
                                    {showPassword ? (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    )}
                                </button>
                            </div>
                            
                            {/* Dynamic Checklist */}
                            <div className="mt-2 space-y-1.5 p-3 bg-[#101B14]/5 rounded-xl border border-[#101B14]/10">
                                <div className={`text-[10px] font-bold tracking-wide flex items-center transition-colors ${passwordValidations.length ? 'text-[#3F6B47]' : 'text-[#101B14]/40'}`}>
                                    <span className="mr-2 text-xs">{passwordValidations.length ? '✅' : '○'}</span> At least 8 characters
                                </div>
                                <div className={`text-[10px] font-bold tracking-wide flex items-center transition-colors ${passwordValidations.casing ? 'text-[#3F6B47]' : 'text-[#101B14]/40'}`}>
                                    <span className="mr-2 text-xs">{passwordValidations.casing ? '✅' : '○'}</span> Uppercase & lowercase
                                </div>
                                <div className={`text-[10px] font-bold tracking-wide flex items-center transition-colors ${passwordValidations.number ? 'text-[#3F6B47]' : 'text-[#101B14]/40'}`}>
                                    <span className="mr-2 text-xs">{passwordValidations.number ? '✅' : '○'}</span> At least one number
                                </div>
                                <div className={`text-[10px] font-bold tracking-wide flex items-center transition-colors ${passwordValidations.special ? 'text-[#3F6B47]' : 'text-[#101B14]/40'}`}>
                                    <span className="mr-2 text-xs">{passwordValidations.special ? '✅' : '○'}</span> Special character (@$!%*?&)
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#101B14]/60 mb-1.5 pl-1">Confirm Password</label>
                            <input 
                                type={showPassword ? 'text' : 'password'} 
                                required 
                                value={confirmPassword} 
                                onChange={(e) => setConfirmPassword(e.target.value)} 
                                className={inputClasses} 
                                placeholder="••••••••" 
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading || !isPasswordStrong} 
                            className="w-full mt-4 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#D9A63E] to-[#c49332] text-[#101B14] font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#D9A63E]/20 hover:shadow-[#D9A63E]/40 hover:-translate-y-0.5 focus:outline-none transform transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#101B14]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    <span>Updating...</span>
                                </>
                            ) : (
                                <span>Save & Continue →</span>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};