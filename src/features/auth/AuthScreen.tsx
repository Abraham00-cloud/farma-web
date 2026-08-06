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
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
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

    // Handle Login Submit
    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage(null);

        try {
            const response = await authService.login(loginData);
            onAuthSuccess(response);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setErrorMessage(
                    err.response?.data?.message || 'Authentication failed. Please verify credentials.'
                );
            } else {
                setErrorMessage('An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle Registration Submit
    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage(null);

        try {
            const response = await authService.registerOrganisation(regData);
            onAuthSuccess(response);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setErrorMessage(
                    err.response?.data?.message ||
                    'Registration failed. Registration number or email might already be in use.'
                );
            } else {
                setErrorMessage('An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-agri-slate)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                {/* Brand Icon Badge */}
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--color-agri-surface)] border border-[var(--color-agri-border)] text-[var(--color-agri-emerald)] mb-4 shadow-xl">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                    </svg>
                </div>
                <h2 className="text-3xl font-extrabold text-[var(--color-agri-straw)] tracking-tight">
                    FARMA
                </h2>
                <p className="mt-1 text-xs font-semibold tracking-wider text-slate-400 uppercase">
                    Precision Livestock Telemetry & Financial Control
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
                <div className="bg-[var(--color-agri-surface)] py-8 px-6 shadow-2xl border border-[var(--color-agri-border)] rounded-2xl sm:px-10">
                    {/* Mode Switcher Tabs */}
                    <div className="flex border-b border-[var(--color-agri-border)] mb-6">
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(true);
                                setErrorMessage(null);
                            }}
                            className={`flex-1 pb-3 text-center text-xs font-bold uppercase tracking-wider transition-colors relative ${isLogin ? 'text-[var(--color-agri-emerald)]' : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            System Authentication
                            {isLogin && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-agri-emerald)] rounded-full" />
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(false);
                                setErrorMessage(null);
                            }}
                            className={`flex-1 pb-3 text-center text-xs font-bold uppercase tracking-wider transition-colors relative ${!isLogin ? 'text-[var(--color-agri-emerald)]' : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            Provision Organisation
                            {!isLogin && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-agri-emerald)] rounded-full" />
                            )}
                        </button>
                    </div>

                    {/* Error Banner */}
                    {errorMessage && (
                        <div className="mb-6 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start space-x-2">
                            <span className="shrink-0 font-bold">🚨</span>
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* LOGIN FORM */}
                    {isLogin ? (
                        <form onSubmit={handleLoginSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                                    User Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={loginData.email}
                                    onChange={(e) =>
                                        setLoginData({ ...loginData, email: e.target.value })
                                    }
                                    placeholder="user@farma-enterprise.com"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-agri-slate)] border border-[var(--color-agri-border)] text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-agri-emerald)]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={loginData.password}
                                    onChange={(e) =>
                                        setLoginData({ ...loginData, password: e.target.value })
                                    }
                                    placeholder="••••••••"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-agri-slate)] border border-[var(--color-agri-border)] text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-agri-emerald)]"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-2 py-3 px-4 rounded-xl bg-[var(--color-agri-emerald)] hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider shadow-lg focus:outline-none transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                            >
                                {loading ? (
                                    <span>Authenticating...</span>
                                ) : (
                                    <span>Sign In To Workspace →</span>
                                )}
                            </button>
                        </form>
                    ) : (
                        /* ORGANISATION REGISTRATION FORM */
                        <form onSubmit={handleRegisterSubmit} className="space-y-4">
                            <div className="bg-[var(--color-agri-slate)] p-3.5 rounded-xl border border-[var(--color-agri-border)] space-y-3">
                                <span className="text-xs font-bold text-[var(--color-agri-emerald)] uppercase tracking-wider block">
                                    1. Enterprise Entity Parameters
                                </span>

                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1">
                                        Organisation Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={regData.name}
                                        onChange={(e) =>
                                            setRegData({ ...regData, name: e.target.value })
                                        }
                                        placeholder="e.g. Digicore Agro Allied Ltd"
                                        className="w-full px-3 py-2 rounded-lg bg-[var(--color-agri-surface)] border border-[var(--color-agri-border)] text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[var(--color-agri-emerald)]"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-300 mb-1">
                                            Type
                                        </label>
                                        <select
                                            value={regData.organisationType}
                                            onChange={(e) =>
                                                setRegData({
                                                    ...regData,
                                                    organisationType: e.target.value as OrganisationType,
                                                })
                                            }
                                            className="w-full px-3 py-2 rounded-lg bg-[var(--color-agri-surface)] border border-[var(--color-agri-border)] text-white text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-agri-emerald)]"
                                        >
                                            <option value={OrganisationType.PRIVATE}>PRIVATE</option>
                                            <option value={OrganisationType.PUBLIC}>PUBLIC</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-300 mb-1">
                                            Registration Reg. No
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={regData.registrationNumber}
                                            onChange={(e) =>
                                                setRegData({
                                                    ...regData,
                                                    registrationNumber: e.target.value,
                                                })
                                            }
                                            placeholder="RC-2026-908"
                                            className="w-full px-3 py-2 rounded-lg bg-[var(--color-agri-surface)] border border-[var(--color-agri-border)] text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[var(--color-agri-emerald)]"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[var(--color-agri-slate)] p-3.5 rounded-xl border border-[var(--color-agri-border)] space-y-3">
                                <span className="text-xs font-bold text-[var(--color-agri-emerald)] uppercase tracking-wider block">
                                    2. Proprietor Administrator
                                </span>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-300 mb-1">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={regData.adminFirstName}
                                            onChange={(e) =>
                                                setRegData({ ...regData, adminFirstName: e.target.value })
                                            }
                                            placeholder="Abraham"
                                            className="w-full px-3 py-2 rounded-lg bg-[var(--color-agri-surface)] border border-[var(--color-agri-border)] text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[var(--color-agri-emerald)]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-300 mb-1">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={regData.adminLastName}
                                            onChange={(e) =>
                                                setRegData({ ...regData, adminLastName: e.target.value })
                                            }
                                            placeholder="Alagbe"
                                            className="w-full px-3 py-2 rounded-lg bg-[var(--color-agri-surface)] border border-[var(--color-agri-border)] text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[var(--color-agri-emerald)]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={regData.email}
                                        onChange={(e) =>
                                            setRegData({ ...regData, email: e.target.value })
                                        }
                                        placeholder="proprietor@digicore.com"
                                        className="w-full px-3 py-2 rounded-lg bg-[var(--color-agri-surface)] border border-[var(--color-agri-border)] text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[var(--color-agri-emerald)]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1">
                                        Password (Min 8 Chars)
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        minLength={8}
                                        value={regData.password}
                                        onChange={(e) =>
                                            setRegData({ ...regData, password: e.target.value })
                                        }
                                        placeholder="••••••••"
                                        className="w-full px-3 py-2 rounded-lg bg-[var(--color-agri-surface)] border border-[var(--color-agri-border)] text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[var(--color-agri-emerald)]"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 px-4 rounded-xl bg-[var(--color-agri-emerald)] hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider shadow-lg focus:outline-none transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                            >
                                {loading ? (
                                    <span>Provisioning Account...</span>
                                ) : (
                                    <span>Provision Entity & Launch Workspace →</span>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};