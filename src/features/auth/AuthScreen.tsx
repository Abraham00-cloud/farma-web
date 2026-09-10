import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { authService } from '../../services/authService';
import {
    OrganisationType,
    type AuthResponseDto,
    type LoginRequestDto,
    type OrganisationRequestDto,
} from '../../types/auth';

interface AuthScreenProps {
    onAuthSuccess: (authData: AuthResponseDto) => void;
    portalType: 'PROPRIETOR' | 'MANAGER';
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, portalType }) => {
    const navigate = useNavigate();
    const isManager = portalType === 'MANAGER';

    // --- Wipe stale session data immediately on mount ---
    useEffect(() => {
        localStorage.removeItem('farma_jwt');
        localStorage.removeItem('farma_auth');
    }, []);

    const [isLogin, setIsLogin] = useState<boolean>(true);
    const [isForgotPassword, setIsForgotPassword] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // State for password visibility toggles
    const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
    const [showRegPassword, setShowRegPassword] = useState<boolean>(false);

    // --- SECURITY: Rate Limiting & Cooldown State ---
    const failedAttemptsRef = useRef<number>(0);
    const [lockoutTimer, setLockoutTimer] = useState<number>(0);

    const [loginData, setLoginData] = useState<LoginRequestDto>({
        email: '',
        password: '',
    });

    const [resetEmail, setResetEmail] = useState<string>('');

    const [regData, setRegData] = useState<OrganisationRequestDto>({
        name: '',
        organisationType: OrganisationType.PRIVATE,
        email: '',
        registrationNumber: '',
        adminFirstName: '',
        adminLastName: '',
        password: '',
    });

    const [passwordValidations, setPasswordValidations] = useState({
        length: false,
        casing: false,
        number: false,
        special: false,
    });

    const isPasswordStrong = Object.values(passwordValidations).every(Boolean);

    // Handle cooldown timer countdown (FIXED: Universal Timeout Type)
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (lockoutTimer > 0) {
            timer = setTimeout(() => setLockoutTimer(prev => prev - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [lockoutTimer]);

    const handlePasswordChange = (password: string) => {
        setRegData({ ...regData, password });
        setPasswordValidations({
            length: password.length >= 8,
            casing: /[a-z]/.test(password) && /[A-Z]/.test(password),
            number: /\d/.test(password),
            special: /[@$!%*?&]/.test(password),
        });
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (lockoutTimer > 0) return; // Prevent submission if locked out

        setLoading(true);
        setErrorMessage(null);

        try {
            const response = await authService.login(loginData);
            
            // Reset attempts on successful login
            failedAttemptsRef.current = 0; 
            onAuthSuccess(response);

            if (response.requiresPasswordChange) {
                navigate('/auth/setup-password', { replace: true });
                return; 
            }

            const userRole = response.role?.toUpperCase();
            const targetPath = (userRole === 'MANAGER') ? '/manager/dashboard' : '/proprietor/dashboard';
            navigate(targetPath, { replace: true });

        } catch (error: unknown) {
            // SECURITY: Increment failed attempts and trigger lock-out if needed
            failedAttemptsRef.current += 1;
            if (failedAttemptsRef.current >= 4) {
                setLockoutTimer(30); // Lock out for 30 seconds after 4 failed attempts
                failedAttemptsRef.current = 0; // Reset counter for the next window
            }

            // SECURITY: Anti-Enumeration. Mask ALL authentication errors as generic invalid credentials.
            if (axios.isAxiosError(error) && !error.response) {
                setErrorMessage('Network error. Please check your internet connection.');
            } else {
                setErrorMessage('Invalid email or password. Please check your credentials and try again.');
            }
        } finally {
            setLoading(false);
            // Clear the password field on failure to force re-entry
            setLoginData(prev => ({ ...prev, password: '' })); 
        }
    };

    const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            // FIXED: Using direct axios call as requested so authService doesn't break
            await axios.post('https://api.farma.com.ng/api/v1/auth/forgot-password', {
                email: resetEmail
            });
        } catch {
            // SECURITY: Anti-Enumeration. We deliberately swallow errors here.
            console.debug("Password reset request processed."); 
        } finally {
            setLoading(false);
            
            // SECURITY: Always show success message regardless of actual backend outcome
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
                password: regData.password,
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

    const inputClasses = "w-full px-4 py-3 rounded-xl bg-[#ECE6D6]/50 border border-[#101B14]/10 text-[#101B14] text-sm placeholder-[#8FA091] focus:bg-white focus:outline-none focus:border-[#D9A63E] focus:ring-4 focus:ring-[#D9A63E]/20 transition-all duration-300";

    return (
        <div className="min-h-screen bg-[#ECE6D6] relative flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans overflow-hidden">

            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#3F6B47] rounded-full mix-blend-multiply filter blur-[128px] opacity-40 pointer-events-none animate-pulse" style={{ animationDuration: '8s' }}></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#D9A63E] rounded-full mix-blend-multiply filter blur-[128px] opacity-30 pointer-events-none animate-pulse" style={{ animationDuration: '10s' }}></div>

            <div className={`relative sm:mx-auto sm:w-full z-10 transition-all duration-500 ${!isLogin && !isForgotPassword ? 'sm:max-w-4xl' : 'sm:max-w-[28rem]'}`}>
                <div className="bg-[#FBF9F5] py-8 sm:py-10 px-6 sm:px-12 shadow-2xl shadow-[#101B14]/10 border border-white/60 rounded-[2rem] backdrop-blur-sm">

                    <div className="text-center mb-8">
                        <button 
                            onClick={() => navigate('/')} 
                            className="inline-flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity cursor-pointer"
                        >
                            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#101B14] text-[#D9A63E] shadow-lg shadow-[#101B14]/20">
                                <span className="font-['Fraunces',serif] font-bold text-2xl">F</span>
                            </div>
                            <span className="font-['Fraunces',serif] font-extrabold text-3xl text-[#101B14] tracking-tight">
                                Farma
                            </span>
                        </button>

                        <h2 className="text-2xl font-extrabold text-[#101B14] font-['Fraunces',serif] tracking-tight mt-2">
                            {isForgotPassword ? 'Reset Password' : isLogin ? 'Welcome Back' : 'Register Your Farm'}
                        </h2>

                        <p className="text-[10px] font-bold tracking-widest text-[#3F6B47] uppercase mt-2">
                            {isManager 
                                ? 'Farm Manager Portal' 
                                : isForgotPassword 
                                    ? 'Account Recovery' 
                                    : isLogin 
                                        ? 'Farm Organisation Login' 
                                        : 'Farm Organisation Registration'}
                        </p>
                    </div>

                    {errorMessage && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs flex items-start space-x-3 shadow-sm">
                            <span className="shrink-0 font-bold text-sm">⚠️</span>
                            <span className="font-medium leading-relaxed">{errorMessage}</span>
                        </div>
                    )}

                    {successMessage && (
                        <div className="mb-6 p-4 rounded-xl bg-[#3F6B47]/10 border border-[#3F6B47]/20 text-[#2A5C38] text-xs flex items-start space-x-3 shadow-sm">
                            <span className="shrink-0 font-bold text-sm">✅</span>
                            <span className="font-medium leading-relaxed">{successMessage}</span>
                        </div>
                    )}

                    {isForgotPassword ? (
                        <form onSubmit={handleForgotPasswordSubmit} className="space-y-5">
                            <p className="text-xs text-[#101B14]/70 leading-relaxed text-center mb-2">
                                {isManager
                                    ? "Enter your manager email address. We'll send you a link to reset your password, or you can ask the organisation owner to reset it for you."
                                    : "Enter your account email address. We'll send you a link to securely reset your password."}
                            </p>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#101B14]/60 mb-1.5 pl-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    autoComplete="username"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    placeholder={isManager ? "manager@farma.com.ng" : "owner@farma.com.ng"}
                                    className={inputClasses}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-4 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#D9A63E] to-[#c49332] text-[#101B14] font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#D9A63E]/20 hover:shadow-[#D9A63E]/40 hover:-translate-y-0.5 focus:outline-none transform transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                            >
                                {loading ? <span>Sending Email...</span> : <span>Send Reset Link →</span>}
                            </button>

                            <div className="text-center mt-6 pt-6 border-t border-[#101B14]/5">
                                <span className="text-xs text-[#101B14]/50 mr-2 font-medium">Remembered your password?</span>
                                <button type="button" onClick={() => { setIsForgotPassword(false); setErrorMessage(null); setSuccessMessage(null); }} className="text-xs font-bold text-[#3F6B47] hover:text-[#2A5C38] transition-colors cursor-pointer">
                                    Log in here
                                </button>
                            </div>
                        </form>
                    ) : isLogin ? (
                        <div className="max-w-sm mx-auto">
                            <form onSubmit={handleLoginSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#101B14]/60 mb-1.5 pl-1">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        autoComplete="username"
                                        value={loginData.email}
                                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                        placeholder={isManager ? "manager@farma.com.ng" : "owner@farma.com.ng"}
                                        className={inputClasses}
                                        disabled={lockoutTimer > 0}
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5 px-1">
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#101B14]/60">Password</label>
                                        <button type="button" onClick={() => { setIsForgotPassword(true); setErrorMessage(null); setSuccessMessage(null); }} className="text-[10px] font-bold text-[#3F6B47] hover:text-[#2A5C38] transition-colors cursor-pointer" disabled={lockoutTimer > 0}>
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
                                            className={`${inputClasses} pr-12`}
                                            disabled={lockoutTimer > 0}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                                            disabled={lockoutTimer > 0}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#8FA091] hover:text-[#101B14] transition-colors cursor-pointer disabled:opacity-50"
                                        >
                                            {showLoginPassword ? (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || lockoutTimer > 0}
                                    className={`w-full mt-4 py-3.5 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-lg transform transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer
                                        ${lockoutTimer > 0 
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' 
                                            : 'bg-gradient-to-r from-[#D9A63E] to-[#c49332] text-[#101B14] shadow-[#D9A63E]/20 hover:shadow-[#D9A63E]/40 hover:-translate-y-0.5 focus:outline-none disabled:opacity-50'
                                        }`}
                                >
                                    {lockoutTimer > 0 ? (
                                        <span>Try again in {lockoutTimer}s</span>
                                    ) : loading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#101B14]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            <span>Authenticating...</span>
                                        </>
                                    ) : (
                                        <span>Sign In To Workspace →</span>
                                    )}
                                </button>
                            </form>

                            {!isManager && (
                                <div className="mt-8 text-center text-xs text-[#101B14]/50 border-t border-[#101B14]/5 pt-6 font-medium">
                                    New to Farma?{' '}
                                    <button type="button" onClick={() => { setIsLogin(false); setErrorMessage(null); setSuccessMessage(null); }} className="font-bold text-[#3F6B47] hover:text-[#2A5C38] transition-colors cursor-pointer ml-1">
                                        Register your farm organisation
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            <form onSubmit={handleRegisterSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-white p-5 rounded-2xl border border-[#101B14]/5 shadow-sm space-y-4 h-full">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#3F6B47]/10 text-[#3F6B47] text-[10px] font-bold">1</span>
                                            <span className="text-[11px] font-bold text-[#101B14] uppercase tracking-wider">Organisation Details</span>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#101B14]/60 mb-1.5 pl-1">Organisation Name</label>
                                            <input type="text" required value={regData.name} onChange={(e) => setRegData({ ...regData, name: e.target.value })} placeholder="e.g. Green Pastures Poultry Ltd" className={inputClasses} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#101B14]/60 mb-1.5 pl-1">Business Type</label>
                                            <select value={regData.organisationType} onChange={(e) => setRegData({ ...regData, organisationType: e.target.value as OrganisationType })} className={`${inputClasses} appearance-none`} style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23101B14' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}>
                                                <option value={OrganisationType.PRIVATE}>PRIVATE</option>
                                                <option value={OrganisationType.PUBLIC}>PUBLIC</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#101B14]/60 mb-1.5 pl-1">Reg. No (Optional)</label>
                                            <input type="text" value={regData.registrationNumber} onChange={(e) => setRegData({ ...regData, registrationNumber: e.target.value })} placeholder="RC-2026" className={inputClasses} />
                                        </div>
                                    </div>

                                    <div className="bg-white p-5 rounded-2xl border border-[#101B14]/5 shadow-sm space-y-4 h-full">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#D9A63E]/20 text-[#c49332] text-[10px] font-bold">2</span>
                                            <span className="text-[11px] font-bold text-[#101B14] uppercase tracking-wider">Owner Details</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#101B14]/60 mb-1.5 pl-1">First Name</label>
                                                <input type="text" required autoComplete="given-name" value={regData.adminFirstName} onChange={(e) => setRegData({ ...regData, adminFirstName: e.target.value })} placeholder="Abraham" className={inputClasses} />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#101B14]/60 mb-1.5 pl-1">Last Name</label>
                                                <input type="text" required autoComplete="family-name" value={regData.adminLastName} onChange={(e) => setRegData({ ...regData, adminLastName: e.target.value })} placeholder="Alagbe" className={inputClasses} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#101B14]/60 mb-1.5 pl-1">Email Address</label>
                                            <input type="email" required autoComplete="username" value={regData.email} onChange={(e) => setRegData({ ...regData, email: e.target.value })} placeholder="owner@farma.com.ng" className={inputClasses} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#101B14]/60 mb-1.5 pl-1">Password (Min 8 chars)</label>
                                            <div className="relative">
                                                <input type={showRegPassword ? 'text' : 'password'} required autoComplete="new-password" minLength={8} value={regData.password} onChange={(e) => handlePasswordChange(e.target.value)} placeholder="••••••••" className={`${inputClasses} pr-12`} />
                                                <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#8FA091] hover:text-[#101B14] transition-colors cursor-pointer">
                                                    {showRegPassword ? (
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                                    ) : (
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    )}
                                                </button>
                                            </div>
                                            
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
                                    </div>
                                </div>

                                <div className="max-w-md mx-auto">
                                    <button type="submit" disabled={loading || !isPasswordStrong} className="w-full mt-4 py-4 px-4 rounded-xl bg-gradient-to-r from-[#D9A63E] to-[#c49332] text-[#101B14] font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#D9A63E]/20 hover:shadow-[#D9A63E]/40 hover:-translate-y-0.5 focus:outline-none transform transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer">
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#101B14]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                <span>Setting up account...</span>
                                            </>
                                        ) : (
                                            <span>Complete Registration →</span>
                                        )}
                                    </button>

                                    <div className="mt-8 text-center text-xs text-[#101B14]/50 border-t border-[#101B14]/5 pt-6 font-medium">
                                        Already registered?{' '}
                                        <button type="button" onClick={() => { setIsLogin(true); setErrorMessage(null); setSuccessMessage(null); }} className="font-bold text-[#3F6B47] hover:text-[#2A5C38] transition-colors cursor-pointer ml-1">
                                            Log in here
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};