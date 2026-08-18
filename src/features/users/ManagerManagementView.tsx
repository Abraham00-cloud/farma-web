import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { userService } from '../../services/userService';
import { Role, type UserRequestDto, type UserResponseDto } from '../../types/auth';

interface ManagerManagementViewProps {
    organisationId: number;
    proprietorId: number;
}

export const ManagerManagementView: React.FC<ManagerManagementViewProps> = ({
    organisationId,
    proprietorId,
}) => {
    const [managers, setManagers] = useState<UserResponseDto[]>([]);
    const [isFetching, setIsFetching] = useState<boolean>(true); 
    
    // Modals
    const [showModal, setShowModal] = useState<boolean>(false);
    const [managerToDeactivate, setManagerToDeactivate] = useState<UserResponseDto | null>(null);
    
    // Loading States
    const [loading, setLoading] = useState<boolean>(false);
    const [deactivateLoading, setDeactivateLoading] = useState<boolean>(false);
    
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [formData, setFormData] = useState<Omit<UserRequestDto, 'organisationId' | 'parentId'>>({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: Role.MANAGER,
    });

    // 1. PERFECTED EFFECT: Defined entirely inside the hook to satisfy ESLint
    useEffect(() => {
        let isMounted = true;

        const initFetch = async () => {
            try {
                const data = await userService.getManagersByProprietor(proprietorId);
                if (isMounted) setManagers(data);
            } catch {
                // Silently fallback on empty state for UI
            } finally {
                // State is ONLY updated asynchronously here, completely resolving the ESLint error
                if (isMounted) setIsFetching(false);
            }
        };

        initFetch();

        return () => {
            isMounted = false;
        };
    }, [proprietorId]);

    // 2. BACKGROUND REFRESH: Used only when you add or deactivate a manager
    const refreshManagers = async () => {
        try {
            const data = await userService.getManagersByProprietor(proprietorId);
            setManagers(data);
        } catch {
            // Silently fallback
        }
    };

    const handleAddManager = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage(null);

        const payload: UserRequestDto = {
            ...formData,
            organisationId,
            parentId: proprietorId,
        };

        try {
            await userService.createUser(payload);

            setShowModal(false);
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                role: Role.MANAGER,
            });

            // Refresh list using the background function
            await refreshManagers();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setErrorMessage(err.response?.data?.message || 'Failed to add new manager.');
            } else {
                setErrorMessage('An unexpected error occurred while saving the manager.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivateManager = async () => {
        if (!managerToDeactivate) return;
        
        setDeactivateLoading(true);
        setErrorMessage(null);
        
        try {
            await userService.deactivateUser(managerToDeactivate.id);
            setManagerToDeactivate(null);
            
            // Refresh list using the background function
            await refreshManagers(); 
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setErrorMessage(err.response?.data?.message || 'Failed to deactivate manager.');
            } else {
                setErrorMessage('An unexpected error occurred during deactivation.');
            }
        } finally {
            setDeactivateLoading(false);
        }
    };

    // Metric Math
    const activeManagersCount = managers.filter(m => m.isActive).length;

    return (
        <div className="space-y-6 lg:space-y-8 font-sans max-w-7xl mx-auto pb-12">
            
            {/* Header Ribbon */}
            <div className="flex flex-col gap-6 border-b-2 border-[#101B14]/10 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#3F6B47] animate-pulse"></span>
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#3F6B47]">
                                Team Management
                            </span>
                        </div>
                        <h3 className="text-3xl md:text-4xl font-extrabold text-[#101B14] tracking-tight font-['Fraunces',serif]">
                            Site Managers
                        </h3>
                        <p className="text-sm text-[#101B14]/70 font-medium mt-2 max-w-xl leading-relaxed">
                            Add and manage the team members who oversee daily farm operations, update flocks, and record farm data.
                        </p>
                    </div>
                    
                    <button
                        type="button"
                        onClick={() => setShowModal(true)}
                        className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-[#D9A63E] hover:bg-[#c99834] text-[#101B14] font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2.5 cursor-pointer shrink-0"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add New Manager</span>
                    </button>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                    <div className="bg-[#FBF9F5] border border-[#101B14]/10 p-4 rounded-xl flex flex-col justify-center shadow-xs">
                        <span className="text-[10px] font-mono font-bold text-[#3F6B47] uppercase tracking-widest mb-1">Active Managers</span>
                        <span className="text-2xl font-extrabold text-[#101B14] font-mono">
                            {isFetching && managers.length === 0 ? '--' : `${activeManagersCount} / ${managers.length}`}
                        </span>
                    </div>
                    <div className="bg-[#FBF9F5] border border-[#101B14]/10 p-4 rounded-xl flex flex-col justify-center shadow-xs">
                        <span className="text-[10px] font-mono font-bold text-[#3F6B47] uppercase tracking-widest mb-1">Business ID</span>
                        <span className="text-2xl font-extrabold text-[#101B14] font-mono">#{organisationId}</span>
                    </div>
                </div>
            </div>

            {/* Managers Table Container */}
            <div className="bg-[#FBF9F5] border border-[#101B14]/10 rounded-xl shadow-xs relative overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-[#101B14] min-w-[800px]">
                        <thead className="bg-[#DFD8C4] border-b-2 border-[#101B14]/15">
                            <tr>
                                <th className="px-6 py-5 text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/80 w-24">User ID</th>
                                <th className="px-6 py-5 text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/80">Full Name</th>
                                <th className="px-6 py-5 text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/80">Email Address</th>
                                <th className="px-6 py-5 text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/80">Status</th>
                                <th className="px-6 py-5 text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/80 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#101B14]/10 bg-[#FBF9F5]">
                            {isFetching && managers.length === 0 ? (
                                [...Array(3)].map((_, idx) => (
                                    <tr key={idx} className="animate-pulse bg-[#FBF9F5]">
                                        <td className="px-6 py-6"><div className="h-4 bg-[#101B14]/10 rounded w-12"></div></td>
                                        <td className="px-6 py-6"><div className="flex items-center space-x-3"><div className="w-10 h-10 rounded-full bg-[#101B14]/10"></div><div className="h-4 bg-[#101B14]/10 rounded w-32"></div></div></td>
                                        <td className="px-6 py-6"><div className="h-4 bg-[#101B14]/10 rounded w-48"></div></td>
                                        <td className="px-6 py-6"><div className="h-6 bg-[#101B14]/10 rounded w-20"></div></td>
                                        <td className="px-6 py-6 flex justify-end"><div className="h-8 bg-[#101B14]/10 rounded w-24"></div></td>
                                    </tr>
                                ))
                            ) : managers.length > 0 ? (
                                managers.map((m) => (
                                    <tr 
                                        key={m.id} 
                                        className={`transition-all ${
                                            m.isActive 
                                            ? 'hover:bg-[#ECE6D6] hover:border-l-4 hover:border-l-[#3F6B47]' 
                                            : 'bg-[#101B14]/5 opacity-60 grayscale-[50%]'
                                        }`}
                                    >
                                        <td className="px-6 py-5 font-mono font-bold text-[#101B14]/50 text-xs">
                                            #{m.id.toString().padStart(4, '0')}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-10 h-10 rounded border flex items-center justify-center font-extrabold text-sm shadow-sm ${m.isActive ? 'bg-white border-[#101B14]/10 text-[#3F6B47]' : 'bg-transparent border-[#101B14]/20 text-[#101B14]/40'}`}>
                                                    {m.firstName.charAt(0)}{m.lastName.charAt(0)}
                                                </div>
                                                <span className={`font-extrabold text-base transition-colors ${m.isActive ? 'text-[#101B14] group-hover:text-[#3F6B47]' : 'text-[#101B14]/60'}`}>
                                                    {m.firstName} {m.lastName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-[#101B14]/80 font-mono text-sm">{m.email}</td>
                                        <td className="px-6 py-5">
                                            {m.isActive ? (
                                                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#3F6B47]/10 border border-[#3F6B47]/20 text-[#3F6B47] font-extrabold text-[10px] uppercase tracking-widest">
                                                    ACTIVE
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#E76F51]/10 border border-[#E76F51]/20 text-[#E76F51] font-extrabold text-[10px] uppercase tracking-widest">
                                                    DEACTIVATED
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            {m.isActive ? (
                                                <button
                                                    onClick={() => setManagerToDeactivate(m)}
                                                    className="px-4 py-2 bg-white border border-[#E76F51]/30 text-[#E76F51] rounded text-[10px] font-extrabold uppercase tracking-widest hover:bg-[#E76F51] hover:text-white transition-colors shadow-sm cursor-pointer"
                                                >
                                                    Deactivate
                                                </button>
                                            ) : (
                                                <span className="text-[#101B14]/40 font-bold text-xs uppercase tracking-widest">Revoked</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-24 bg-[#FBF9F5]">
                                        <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-4">
                                            <div className="w-16 h-16 rounded-full bg-[#ECE6D6] flex items-center justify-center text-[#101B14]/30 mb-2 shadow-inner">
                                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                </svg>
                                            </div>
                                            <h4 className="text-xl font-bold text-[#101B14] font-['Fraunces',serif]">No Managers Added</h4>
                                            <p className="text-[#101B14]/60 text-sm leading-relaxed">
                                                You have not added any site managers yet. Add a manager so they can start recording farm data.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => setShowModal(true)}
                                                className="mt-2 px-6 py-3 bg-[#3F6B47] text-white rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-[#2d4f34] transition-colors cursor-pointer"
                                            >
                                                + Add First Manager
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Manager Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-[#101B14]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
                    <div className="bg-[#FBF9F5] border border-[#D9A63E]/40 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative">
                        
                        {/* Header Accent Line */}
                        <div className="h-2 w-full bg-[#D9A63E] relative shrink-0 shadow-sm"></div>

                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-[#101B14]/10 p-6 bg-white shrink-0">
                            <div>
                                <h4 className="text-2xl font-extrabold text-[#101B14] font-['Fraunces',serif] tracking-tight">Add New Manager</h4>
                                <p className="text-[10px] font-mono font-bold text-[#3F6B47] uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                                    Create login details for a farm manager
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="text-[#101B14]/40 hover:text-[#E76F51] hover:bg-[#E76F51]/10 bg-[#101B14]/5 transition-all p-2 rounded-full cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto">
                            {errorMessage && (
                                <div className="mb-6 p-4 rounded-lg bg-[#E76F51]/10 border border-[#E76F51]/30 text-[#E76F51] text-sm font-bold flex items-start space-x-3 shadow-sm">
                                    <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    <span className="leading-relaxed">{errorMessage}</span>
                                </div>
                            )}

                            <form id="manager-form" onSubmit={handleAddManager} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-[#101B14]/70 mb-2">
                                            First Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            placeholder="e.g. Samuel"
                                            className="w-full px-5 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#D9A63E] focus:ring-2 focus:ring-[#D9A63E]/50 transition-all shadow-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-[#101B14]/70 mb-2">
                                            Last Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            placeholder="e.g. Olayinka"
                                            className="w-full px-5 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#D9A63E] focus:ring-2 focus:ring-[#D9A63E]/50 transition-all shadow-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[#101B14]/70 mb-2">
                                        Email Address *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-[#101B14]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="manager@farm.com"
                                            className="w-full pl-11 pr-5 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm focus:outline-none focus:border-[#D9A63E] focus:ring-2 focus:ring-[#D9A63E]/50 transition-all shadow-sm font-mono"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[#101B14]/70 mb-2 flex justify-between">
                                        <span>Temporary Password *</span>
                                        <span className="text-[#101B14]/40 font-normal normal-case">Min. 8 Chars</span>
                                    </label>
                                    <div className="relative">
                                         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-[#101B14]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="password"
                                            required
                                            minLength={8}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="••••••••"
                                            className="w-full pl-11 pr-5 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm focus:outline-none focus:border-[#D9A63E] focus:ring-2 focus:ring-[#D9A63E]/50 transition-all shadow-sm tracking-widest"
                                        />
                                    </div>
                                    <p className="text-[10px] text-[#101B14]/50 mt-2 font-medium">
                                        The manager will use this email and password to log in to the farm portal.
                                    </p>
                                </div>
                            </form>
                        </div>
                        
                        {/* Modal Footer */}
                        <div className="p-6 bg-[#ECE6D6] border-t border-[#101B14]/10 shrink-0 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-4 z-10">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="w-full sm:w-auto px-6 py-4 rounded-lg bg-transparent hover:bg-[#101B14]/5 text-[#101B14]/60 hover:text-[#101B14] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="manager-form"
                                disabled={loading}
                                className="w-full sm:w-auto px-8 py-4 rounded-lg bg-[#D9A63E] hover:bg-[#c99834] text-[#101B14] font-extrabold text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Save Manager'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Deactivate Confirmation Modal */}
            {managerToDeactivate && (
                <div className="fixed inset-0 bg-[#101B14]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
                    <div className="bg-white border-2 border-[#E76F51] rounded-xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col relative">
                        <div className="p-8 text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-[#E76F51]/10 flex items-center justify-center text-[#E76F51] mx-auto mb-4">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h4 className="text-2xl font-extrabold text-[#101B14] font-['Fraunces',serif]">Deactivate Manager?</h4>
                            <p className="text-[#101B14]/70 text-sm leading-relaxed">
                                Are you sure you want to deactivate <strong className="text-[#101B14]">{managerToDeactivate.firstName} {managerToDeactivate.lastName}</strong>? 
                                They will immediately lose access to the portal, and any farms they currently manage will be unassigned. 
                                <br/><br/>
                                <span className="text-[#E76F51] font-bold">This action cannot be undone from the dashboard.</span>
                            </p>
                            
                            {/* Inner Modal Error Message if deletion fails */}
                            {errorMessage && (
                                <p className="text-[#E76F51] text-xs font-bold mt-2 bg-[#E76F51]/10 p-2 rounded">{errorMessage}</p>
                            )}
                        </div>
                        <div className="p-4 bg-[#FBF9F5] border-t border-[#101B14]/10 flex gap-3">
                            <button
                                type="button"
                                onClick={() => { setManagerToDeactivate(null); setErrorMessage(null); }}
                                disabled={deactivateLoading}
                                className="flex-1 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14]/70 hover:text-[#101B14] hover:bg-[#101B14]/5 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeactivateManager}
                                disabled={deactivateLoading}
                                className="flex-1 py-3.5 rounded-lg bg-[#E76F51] hover:bg-[#d45d40] text-white font-extrabold text-xs uppercase tracking-wider shadow-md transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer"
                            >
                                {deactivateLoading ? 'Deactivating...' : 'Yes, Deactivate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};