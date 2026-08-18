import React, { useState, useEffect } from 'react';
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

    // --- NEW: Wipe stale session data immediately on mount ---
    useEffect(() => {
        localStorage.removeItem('farma_jwt');
        localStorage.removeItem('farma_auth');
    }, []);
    // ---------------------------------------------------------

    const [isLogin, setIsLogin] = useState<boolean>(true);
    const [isForgotPassword, setIsForgotPassword] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // State for password visibility toggles
    const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
    const [showRegPassword, setShowRegPassword] = useState<boolean>(false);

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

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage(null);

        try {
            const response = await authService.login(loginData);
            onAuthSuccess(response);

            const userRole = response.role?.toUpperCase();
            const targetPath = (userRole === 'MANAGER') ? '/manager/dashboard' : '/proprietor/dashboard';
            navigate(targetPath, { replace: true });
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                if (status === 401 || status === 403 || status === 404) {
                    setErrorMessage('Invalid email or password. Please verify your credentials.');
                } else {
                    setErrorMessage(error.response?.data?.message || 'Authentication failed. Please try again later.');
                }
            } else {
                setErrorMessage('A network error occurred. Please check your connection.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            setSuccessMessage(
                isManager
                    ? 'If an active manager profile matches this email address, password reset instructions have been sent. You may also contact your enterprise proprietor for manual credential re-provisioning.'
                    : 'If an active account matches this email address, password recovery instructions have been dispatched. Please check your inbox.'
            );
        } catch {
            setErrorMessage('Unable to process request at the moment. Please try again later.');
        } finally {
            setLoading(false);
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
                    setErrorMessage('An organisation or user account with this email/registration number already exists.');
                } else if (status === 400) {
                    setErrorMessage('Please ensure all required fields are filled out correctly.');
                } else {
                    setErrorMessage(serverMsg || 'Registration failed. Please try again.');
                }
            } else {
                setErrorMessage('A network error occurred. Please check your connection.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#ECE6D6] flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans">

            {/* Minimalist branding header */}
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
                <button
                    onClick={() => navigate('/')}
                    className="inline-flex items-center gap-2 font-['Fraunces',serif] font-semibold text-[1.8rem] text-[#101B14] hover:opacity-80 transition-opacity cursor-pointer mb-1"
                >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D9A63E]"></span>
                    Farma
                </button>
                <p className="text-xs font-semibold tracking-wider text-[#3F6B47] uppercase">
                    {isManager ? 'Site Manager Access Portal' : 'Proprietor Executive Control'}
                </p>
            </div>

            {/* Main Form Container */}
            <div className="sm:mx-auto sm:w-full sm:max-w-lg">
                <div className="bg-[#F5F1E6] py-6 sm:py-8 px-5 sm:px-10 shadow-xl border border-[#101B14]/15 rounded-2xl">

                    {!isManager && !isForgotPassword ? (
                        <div className="flex border-b border-[#101B14]/10 mb-6">
                            <button
                                type="button"
                                onClick={() => { setIsLogin(true); setErrorMessage(null); setSuccessMessage(null); }}
                                className={`flex-1 pb-3 text-center text-xs font-bold uppercase tracking-wider transition-colors relative cursor-pointer ${isLogin ? 'text-[#101B14]' : 'text-[#8FA091] hover:text-[#101B14]'}`}
                            >
                                System Authentication
                                {isLogin && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D9A63E] rounded-full" />}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setIsLogin(false); setErrorMessage(null); setSuccessMessage(null); }}
                                className={`flex-1 pb-3 text-center text-xs font-bold uppercase tracking-wider transition-colors relative cursor-pointer ${!isLogin ? 'text-[#101B14]' : 'text-[#8FA091] hover:text-[#101B14]'}`}
                            >
                                Provision Organisation
                                {!isLogin && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D9A63E] rounded-full" />}
                            </button>
                        </div>
                    ) : isForgotPassword ? (
                        <div className="mb-6 pb-4 border-b border-[#101B14]/10 text-center">
                            <span className="text-xs font-extrabold uppercase tracking-widest text-[#101B14]">
                                {isManager ? 'Manager Portal Password Assistance' : 'Password Recovery Assistance'}
                            </span>
                        </div>
                    ) : (
                        <div className="mb-6 pb-4 border-b border-[#101B14]/10 text-center">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#101B14]/70">Sign in to your assigned facility</span>
                        </div>
                    )}

                    {errorMessage && (
                        <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
                            <span className="shrink-0 font-bold">⚠️</span>
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {successMessage && (
                        <div className="mb-6 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs flex items-start space-x-2">
                            <span className="shrink-0 font-bold">✅</span>
                            <span>{successMessage}</span>
                        </div>
                    )}

                    {isForgotPassword ? (
                        <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                            <p className="text-xs text-[#101B14]/80 leading-relaxed bg-[#ECE6D6] p-3 rounded-xl border border-[#101B14]/10">
                                {isManager
                                    ? 'Enter your registered manager email address. A recovery token and security update link will be routed to your email inbox, or you can request a manual reset token through your facility proprietor.'
                                    : 'Please submit your registered enterprise email address. If an account matches your entry, a secure recovery authorization link will be sent to your inbox.'}
                            </p>
                            <div>
                                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#101B14]/80 mb-1">
                                    {isManager ? 'Manager Email Address' : 'Account Email Address'}
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    placeholder={isManager ? "manager@farma.com.ng" : "proprietor@farma.com.ng"}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#ECE6D6] border border-[#101B14]/20 text-[#101B14] text-sm placeholder-[#8FA091] focus:outline-none focus:ring-2 focus:ring-[#D9A63E]"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-2 py-3 px-4 rounded-xl bg-[#D9A63E] hover:bg-[#e9b752] text-[#101B14] font-bold text-xs uppercase tracking-wider shadow-md focus:outline-none transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                            >
                                {loading ? <span>Dispatching Instructions...</span> : <span>Send Recovery Instructions →</span>}
                            </button>

                            <div className="text-center mt-4">
                                <button
                                    type="button"
                                    onClick={() => { setIsForgotPassword(false); setErrorMessage(null); setSuccessMessage(null); }}
                                    className="text-xs font-bold text-[#3F6B47] hover:underline cursor-pointer"
                                >
                                    ← Return to Sign In
                                </button>
                            </div>
                        </form>
                    ) : isLogin ? (
                        <form onSubmit={handleLoginSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#101B14]/80 mb-1">
                                    {isManager ? 'Manager Email Address' : 'Proprietor Email'}
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={loginData.email}
                                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                    placeholder={isManager ? "manager@farma.com.ng" : "proprietor@farma.com.ng"}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#ECE6D6] border border-[#101B14]/20 text-[#101B14] text-sm placeholder-[#8FA091] focus:outline-none focus:ring-2 focus:ring-[#D9A63E]"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#101B14]/80">Password</label>
                                    <button
                                        type="button"
                                        onClick={() => { setIsForgotPassword(true); setErrorMessage(null); setSuccessMessage(null); }}
                                        className="text-[0.7rem] font-bold text-[#3F6B47] hover:underline cursor-pointer"
                                    >
                                        {isManager ? 'Forgot / Reset Password?' : 'Forgot Password?'}
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showLoginPassword ? 'text' : 'password'}
                                        required
                                        value={loginData.password}
                                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                        placeholder="••••••••"
                                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-[#ECE6D6] border border-[#101B14]/20 text-[#101B14] text-sm placeholder-[#8FA091] focus:outline-none focus:ring-2 focus:ring-[#D9A63E]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8FA091] hover:text-[#101B14] cursor-pointer"
                                    >
                                        {showLoginPassword ? (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-2 py-3 px-4 rounded-xl bg-[#D9A63E] hover:bg-[#e9b752] text-[#101B14] font-bold text-xs uppercase tracking-wider shadow-md focus:outline-none transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#101B14]" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Authenticating...</span>
                                    </>
                                ) : (
                                    <span>Sign In To Workspace →</span>
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleRegisterSubmit} className="space-y-4">
                            {/* Step 1: Enterprise Entity Parameters */}
                            <div className="bg-[#ECE6D6] p-3.5 sm:p-4 rounded-xl border border-[#101B14]/10 space-y-3">
                                <span className="text-xs font-mono font-bold text-[#3F6B47] uppercase tracking-wider block">
                                    1. Enterprise Entity Parameters
                                </span>
                                <div>
                                    <label className="block text-xs font-medium text-[#101B14]/80 mb-1">Organisation Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={regData.name}
                                        onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                                        placeholder="e.g. Digicore Agro Allied Ltd"
                                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F1E6] border border-[#101B14]/20 text-[#101B14] text-sm placeholder-[#8FA091] focus:outline-none focus:ring-2 focus:ring-[#D9A63E]"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-[#101B14]/80 mb-1">Type</label>
                                        <select
                                            value={regData.organisationType}
                                            onChange={(e) => setRegData({ ...regData, organisationType: e.target.value as OrganisationType })}
                                            className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F1E6] border border-[#101B14]/20 text-[#101B14] text-sm focus:outline-none focus:ring-2 focus:ring-[#D9A63E]"
                                        >
                                            <option value={OrganisationType.PRIVATE}>PRIVATE</option>
                                            <option value={OrganisationType.PUBLIC}>PUBLIC</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[#101B14]/80 mb-1">Reg. No</label>
                                        <input
                                            type="text"
                                            required
                                            value={regData.registrationNumber}
                                            onChange={(e) => setRegData({ ...regData, registrationNumber: e.target.value })}
                                            placeholder="RC-2026-908"
                                            className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F1E6] border border-[#101B14]/20 text-[#101B14] text-sm placeholder-[#8FA091] focus:outline-none focus:ring-2 focus:ring-[#D9A63E]"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Step 2: Proprietor Administrator */}
                            <div className="bg-[#ECE6D6] p-3.5 sm:p-4 rounded-xl border border-[#101B14]/10 space-y-3">
                                <span className="text-xs font-mono font-bold text-[#3F6B47] uppercase tracking-wider block">
                                    2. Proprietor Administrator
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-[#101B14]/80 mb-1">First Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={regData.adminFirstName}
                                            onChange={(e) => setRegData({ ...regData, adminFirstName: e.target.value })}
                                            placeholder="Abraham"
                                            className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F1E6] border border-[#101B14]/20 text-[#101B14] text-sm placeholder-[#8FA091] focus:outline-none focus:ring-2 focus:ring-[#D9A63E]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[#101B14]/80 mb-1">Last Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={regData.adminLastName}
                                            onChange={(e) => setRegData({ ...regData, adminLastName: e.target.value })}
                                            placeholder="Alagbe"
                                            className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F1E6] border border-[#101B14]/20 text-[#101B14] text-sm placeholder-[#8FA091] focus:outline-none focus:ring-2 focus:ring-[#D9A63E]"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[#101B14]/80 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={regData.email}
                                        onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                                        placeholder="proprietor@digicore.com"
                                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#F5F1E6] border border-[#101B14]/20 text-[#101B14] text-sm placeholder-[#8FA091] focus:outline-none focus:ring-2 focus:ring-[#D9A63E]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[#101B14]/80 mb-1">Password (Min 8 Chars)</label>
                                    <div className="relative">
                                        <input
                                            type={showRegPassword ? 'text' : 'password'}
                                            required
                                            minLength={8}
                                            value={regData.password}
                                            onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                                            placeholder="••••••••"
                                            className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-[#F5F1E6] border border-[#101B14]/20 text-[#101B14] text-sm placeholder-[#8FA091] focus:outline-none focus:ring-2 focus:ring-[#D9A63E]"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowRegPassword(!showRegPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8FA091] hover:text-[#101B14] cursor-pointer"
                                        >
                                            {showRegPassword ? (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 px-4 rounded-xl bg-[#D9A63E] hover:bg-[#e9b752] text-[#101B14] font-bold text-xs uppercase tracking-wider shadow-md focus:outline-none transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#101B14]" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Provisioning Account...</span>
                                    </>
                                ) : (
                                    <span>Provision Entity &amp; Launch Workspace →</span>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};