import React, { useState } from 'react';
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
    portalType: 'PROPRIETOR' | 'MANAGER'; // <--- We require this prop now
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, portalType }) => {
    const isManager = portalType === 'MANAGER';
    
    // Force Manager to always be on Login tab, Proprietor can switch
    const [isLogin, setIsLogin] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Login Form State
    const [loginData, setLoginData] = useState<LoginRequestDto>({
        email: '',
        password: '',
    });

    // Organisation Registration Form State
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
            onAuthSuccess(response); // <-- This clears the eslint error
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setErrorMessage(err.response?.data?.message || 'Authentication failed. Please verify credentials.');
            } else {
                setErrorMessage('An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage(null);

        try {
            const response = await authService.registerOrganisation(regData);
            onAuthSuccess(response); // <-- This clears the eslint error
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setErrorMessage(err.response?.data?.message || 'Registration failed.');
            } else {
                setErrorMessage('An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#ECE6D6] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#101B14] border border-[#101B14]/10 text-[#D9A63E] mb-4 shadow-xl">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                </div>
                <h2 className="text-3xl font-extrabold text-[#101B14] tracking-tight">
                    FARMA
                </h2>
                {/* Dynamically change header text based on portalType */}
                <p className="mt-1 text-xs font-semibold tracking-wider text-[#3F6B47] uppercase">
                    {isManager ? 'Site Manager Access Portal' : 'Proprietor Executive Control'}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
                <div className="bg-[#F5F1E6] py-8 px-6 shadow-2xl border border-[#101B14]/10 rounded-2xl sm:px-10">
                    
                    {/* Hide tabs completely if it's the manager portal */}
                    {!isManager ? (
                        <div className="flex border-b border-[#101B14]/10 mb-6">
                            <button
                                type="button"
                                onClick={() => { setIsLogin(true); setErrorMessage(null); }}
                                className={`flex-1 pb-3 text-center text-xs font-bold uppercase tracking-wider transition-colors relative ${isLogin ? 'text-[#101B14]' : 'text-[#8FA091] hover:text-[#101B14]'}`}
                            >
                                System Authentication
                                {isLogin && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D9A63E] rounded-full" />}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setIsLogin(false); setErrorMessage(null); }}
                                className={`flex-1 pb-3 text-center text-xs font-bold uppercase tracking-wider transition-colors relative ${!isLogin ? 'text-[#101B14]' : 'text-[#8FA091] hover:text-[#101B14]'}`}
                            >
                                Provision Organisation
                                {!isLogin && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D9A63E] rounded-full" />}
                            </button>
                        </div>
                    ) : (
                        <div className="mb-6 pb-4 border-b border-[#101B14]/10 text-center">
                            <span className="text-sm font-bold text-[#101B14]/70">Sign in to your assigned facility</span>
                        </div>
                    )}

                    {errorMessage && (
                        <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
                            <span className="shrink-0 font-bold">🚨</span>
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* LOGIN FORM */}
                    {isLogin ? (
                        <form onSubmit={handleLoginSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#101B14]/80 mb-1">
                                    {isManager ? 'Manager Email Address' : 'Proprietor Email'}
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={loginData.email}
                                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                    placeholder={isManager ? "manager@farma-enterprise.com" : "proprietor@farma-enterprise.com"}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#101B14]/20 text-[#101B14] text-sm placeholder-[#8FA091] focus:outline-none focus:ring-2 focus:ring-[#D9A63E]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-[#101B14]/80 mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    value={loginData.password}
                                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                    placeholder="••••••••"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#101B14]/20 text-[#101B14] text-sm placeholder-[#8FA091] focus:outline-none focus:ring-2 focus:ring-[#D9A63E]"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-2 py-3 px-4 rounded-xl bg-[#D9A63E] hover:bg-[#e9b752] text-[#101B14] font-bold text-xs uppercase tracking-wider shadow-lg focus:outline-none transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                            >
                                {loading ? <span>Authenticating...</span> : <span>Sign In To Workspace →</span>}
                            </button>
                        </form>
                    ) : (
                        /* ORGANISATION REGISTRATION FORM (Proprietor Only) */
                        <form onSubmit={handleRegisterSubmit} className="space-y-4">
                            <div className="bg-white p-3.5 rounded-xl border border-[#101B14]/10 space-y-3">
                                <span className="text-xs font-bold text-[#3F6B47] uppercase tracking-wider block">1. Enterprise Entity Parameters</span>
                                <div>
                                    <label className="block text-xs font-medium text-[#101B14]/80 mb-1">Organisation Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={regData.name}
                                        onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                                        placeholder="e.g. Digicore Agro Allied Ltd"
                                        className="w-full px-3 py-2 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm placeholder-[#8FA091] focus:outline-none focus:ring-1 focus:ring-[#D9A63E]"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium text-[#101B14]/80 mb-1">Type</label>
                                        <select
                                            value={regData.organisationType}
                                            onChange={(e) => setRegData({ ...regData, organisationType: e.target.value as OrganisationType })}
                                            className="w-full px-3 py-2 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm focus:outline-none focus:ring-1 focus:ring-[#D9A63E]"
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
                                            className="w-full px-3 py-2 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm placeholder-[#8FA091] focus:outline-none focus:ring-1 focus:ring-[#D9A63E]"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-3.5 rounded-xl border border-[#101B14]/10 space-y-3">
                                <span className="text-xs font-bold text-[#3F6B47] uppercase tracking-wider block">2. Proprietor Administrator</span>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium text-[#101B14]/80 mb-1">First Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={regData.adminFirstName}
                                            onChange={(e) => setRegData({ ...regData, adminFirstName: e.target.value })}
                                            placeholder="Abraham"
                                            className="w-full px-3 py-2 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm placeholder-[#8FA091] focus:outline-none focus:ring-1 focus:ring-[#D9A63E]"
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
                                            className="w-full px-3 py-2 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm placeholder-[#8FA091] focus:outline-none focus:ring-1 focus:ring-[#D9A63E]"
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
                                        className="w-full px-3 py-2 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm placeholder-[#8FA091] focus:outline-none focus:ring-1 focus:ring-[#D9A63E]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[#101B14]/80 mb-1">Password (Min 8 Chars)</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={8}
                                        value={regData.password}
                                        onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                                        placeholder="••••••••"
                                        className="w-full px-3 py-2 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm placeholder-[#8FA091] focus:outline-none focus:ring-1 focus:ring-[#D9A63E]"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 px-4 rounded-xl bg-[#D9A63E] hover:bg-[#e9b752] text-[#101B14] font-bold text-xs uppercase tracking-wider shadow-lg focus:outline-none transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                            >
                                {loading ? <span>Provisioning Account...</span> : <span>Provision Entity & Launch Workspace →</span>}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};