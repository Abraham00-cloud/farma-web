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
    
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DEACTIVATED'>('ALL');

    const [showModal, setShowModal] = useState<boolean>(false);
    const [managerToDeactivate, setManagerToDeactivate] = useState<UserResponseDto | null>(null);
    
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

    useEffect(() => {
        let isMounted = true;

        const initFetch = async () => {
            try {
                const data = await userService.getManagersByProprietor(proprietorId);
                if (isMounted) setManagers(data);
            } catch {
                // Silently fallback on empty state for UI
            } finally {
                if (isMounted) setIsFetching(false);
            }
        };

        initFetch();

        return () => {
            isMounted = false;
        };
    }, [proprietorId]);

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

    const filteredManagers = managers.filter(m => {
        const matchesSearch = 
            m.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.id.toString().includes(searchQuery);

        if (statusFilter === 'ACTIVE') return matchesSearch && m.isActive;
        if (statusFilter === 'DEACTIVATED') return matchesSearch && !m.isActive;
        return matchesSearch;
    });

    const activeManagersCount = managers.filter(m => m.isActive).length;

    return (
        <div className="space-y-6 lg:space-y-8 font-sans max-w-7xl mx-auto pb-12">
            
            <div className="flex flex-col gap-6 border-b border-farma-forest/10 pb-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
                    <div>
                        <h3 className="text-3xl md:text-4xl font-bold text-farma-forest tracking-tight">
                            Farm Managers
                        </h3>
                        <p className="text-sm text-farma-forest/70 font-medium mt-2 max-w-xl leading-relaxed">
                            Add and manage the team members who oversee daily farm operations, update flock logs, and monitor facility resources.
                        </p>
                    </div>
                    
                    <button
                        type="button"
                        onClick={() => setShowModal(true)}
                        className="w-full sm:w-auto px-6 py-4 rounded-xl bg-farma-gold hover:bg-farma-gold-hover text-farma-forest font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center space-x-2.5 cursor-pointer shrink-0 shadow-sm"
                    >
                        <IconPlus />
                        <span>Add New Manager</span>
                    </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                    <div className="bg-farma-cream border border-farma-forest/10 p-5 rounded-xl flex flex-col justify-center shadow-sm">
                        <span className="text-[10px] font-bold text-farma-green uppercase tracking-widest mb-1">Active Team</span>
                        <span className="text-3xl font-bold text-farma-forest tabular-nums">
                            {isFetching && managers.length === 0 ? '--' : `${activeManagersCount} / ${managers.length}`}
                        </span>
                    </div>
                    <div className="bg-farma-cream border border-farma-forest/10 p-5 rounded-xl flex flex-col justify-center shadow-sm">
                        <span className="text-[10px] font-bold text-farma-forest/50 uppercase tracking-widest mb-1">Organisation ID</span>
                        <span className="text-3xl font-bold text-farma-forest tabular-nums">#{organisationId}</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-farma-cream p-4 rounded-xl border border-farma-forest/10 shadow-sm">
                
                <div className="relative flex-1 max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-farma-forest/40">
                        <IconSearch />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, email, or ID..."
                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-white border border-farma-forest/10 text-sm text-farma-forest placeholder-farma-forest/40 focus:outline-none focus:border-farma-gold focus:ring-2 focus:ring-farma-gold/20 transition-shadow shadow-sm"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-bold text-farma-forest/40 hover:text-farma-forest cursor-pointer"
                        >
                            Clear
                        </button>
                    )}
                </div>

                <div className="flex items-center bg-farma-sand/60 p-1 rounded-lg border border-farma-forest/10 shrink-0">
                    {(['ALL', 'ACTIVE', 'DEACTIVATED'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                                statusFilter === status
                                    ? 'bg-farma-forest text-farma-gold shadow-sm'
                                    : 'text-farma-forest/60 hover:text-farma-forest'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white border border-farma-forest/10 rounded-xl shadow-sm relative overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-farma-forest min-w-[800px]">
                        <thead className="bg-farma-sand/50 border-b border-farma-forest/10">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-farma-forest/60 w-28">User ID</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-farma-forest/60">Full Name</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-farma-forest/60">Email Address</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-farma-forest/60">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-farma-forest/60 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-farma-forest/5">
                            {isFetching && managers.length === 0 ? (
                                [...Array(3)].map((_, idx) => (
                                    <tr key={idx} className="animate-pulse">
                                        <td className="px-6 py-5"><div className="h-4 bg-farma-forest/10 rounded w-12"></div></td>
                                        <td className="px-6 py-5"><div className="flex items-center space-x-3"><div className="w-10 h-10 rounded-lg bg-farma-forest/10"></div><div className="h-4 bg-farma-forest/10 rounded w-32"></div></div></td>
                                        <td className="px-6 py-5"><div className="h-4 bg-farma-forest/10 rounded w-48"></div></td>
                                        <td className="px-6 py-5"><div className="h-6 bg-farma-forest/10 rounded w-20"></div></td>
                                        <td className="px-6 py-5 flex justify-end"><div className="h-8 bg-farma-forest/10 rounded w-24"></div></td>
                                    </tr>
                                ))
                            ) : filteredManagers.length > 0 ? (
                                filteredManagers.map((m) => (
                                    <tr 
                                        key={m.id} 
                                        className={`transition-colors ${
                                            m.isActive 
                                            ? 'hover:bg-farma-cream' 
                                            : 'bg-farma-forest/5 opacity-60 grayscale-[30%]'
                                        }`}
                                    >
                                        <td className="px-6 py-4 font-bold text-farma-forest/40 text-xs tabular-nums">
                                            #{m.id.toString().padStart(4, '0')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-10 h-10 rounded-lg border flex items-center justify-center font-bold text-sm shadow-sm ${m.isActive ? 'bg-white border-farma-forest/10 text-farma-green' : 'bg-transparent border-farma-forest/20 text-farma-forest/40'}`}>
                                                    {m.firstName.charAt(0)}{m.lastName.charAt(0)}
                                                </div>
                                                <span className={`font-bold text-sm ${m.isActive ? 'text-farma-forest' : 'text-farma-forest/60'}`}>
                                                    {m.firstName} {m.lastName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-farma-forest/80 text-xs">{m.email}</td>
                                        <td className="px-6 py-4">
                                            {m.isActive ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-md bg-farma-green/10 border border-farma-green/20 text-farma-green font-bold text-[10px] uppercase tracking-wider">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-md bg-farma-terracotta/10 border border-farma-terracotta/20 text-farma-terracotta font-bold text-[10px] uppercase tracking-wider">
                                                    Deactivated
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {m.isActive ? (
                                                <button
                                                    onClick={() => setManagerToDeactivate(m)}
                                                    className="px-3.5 py-2 bg-white border border-farma-terracotta/30 text-farma-terracotta rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-farma-terracotta hover:text-white transition-colors shadow-sm cursor-pointer"
                                                >
                                                    Deactivate
                                                </button>
                                            ) : (
                                                <span className="text-[10px] text-farma-forest/40 font-bold uppercase tracking-wider">Access Revoked</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                                            <div className="w-12 h-12 rounded-full bg-farma-sand flex items-center justify-center text-farma-forest/40 mb-1">
                                                <IconEmptyTeam />
                                            </div>
                                            <h4 className="font-bold text-lg text-farma-forest">No managers found</h4>
                                            <p className="text-xs text-farma-forest/60 leading-relaxed">
                                                {searchQuery ? `No results matching "${searchQuery}". Try adjusting your search query.` : 'No managers match the selected filter status.'}
                                            </p>
                                            {searchQuery && (
                                                <button 
                                                    onClick={() => setSearchQuery('')}
                                                    className="mt-2 text-xs font-bold text-farma-green hover:underline cursor-pointer"
                                                >
                                                    Clear search query
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-farma-forest/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
                    <div className="bg-farma-cream border border-farma-forest/10 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative">
                        
                        <div className="h-1.5 w-full bg-farma-forest shrink-0"></div>

                        <div className="flex items-center justify-between border-b border-farma-forest/10 p-6 bg-white shrink-0">
                            <div>
                                <h4 className="text-xl font-bold text-farma-forest tracking-tight">Add New Manager</h4>
                                <p className="text-[10px] font-bold text-farma-green uppercase tracking-widest mt-1">
                                    Create operational credentials for facility management
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="text-farma-forest/40 hover:text-farma-terracotta hover:bg-farma-terracotta/10 bg-farma-forest/5 transition-colors p-2 rounded-lg cursor-pointer"
                            >
                                <IconClose />
                            </button>
                        </div>

                        <div className="p-6 sm:p-8 overflow-y-auto">
                            {errorMessage && (
                                <div className="mb-6 p-4 rounded-lg bg-farma-terracotta/10 border border-farma-terracotta/30 text-farma-terracotta text-xs font-bold flex items-start space-x-3 shadow-sm">
                                    <IconWarning />
                                    <span className="leading-relaxed">{errorMessage}</span>
                                </div>
                            )}

                            <form id="manager-form" onSubmit={handleAddManager} className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-1.5 pl-1">
                                            First Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            placeholder="e.g. Samuel"
                                            className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/15 text-farma-forest text-sm font-semibold focus:outline-none focus:border-farma-gold focus:ring-2 focus:ring-farma-gold/20 transition-shadow shadow-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-1.5 pl-1">
                                            Last Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            placeholder="e.g. Olayinka"
                                            className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/15 text-farma-forest text-sm font-semibold focus:outline-none focus:border-farma-gold focus:ring-2 focus:ring-farma-gold/20 transition-shadow shadow-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-1.5 pl-1">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="manager@farma.com.ng"
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/15 text-farma-forest text-sm font-semibold focus:outline-none focus:border-farma-gold focus:ring-2 focus:ring-farma-gold/20 transition-shadow shadow-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-1.5 pl-1 flex justify-between">
                                        <span>Temporary Password *</span>
                                        <span className="text-farma-forest/40 font-semibold normal-case">Min. 8 Chars</span>
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        minLength={8}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="••••••••"
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/15 text-farma-forest text-sm font-semibold focus:outline-none focus:border-farma-gold focus:ring-2 focus:ring-farma-gold/20 transition-shadow shadow-sm"
                                    />
                                    <p className="text-[10px] text-farma-forest/50 mt-2 font-semibold leading-relaxed">
                                        The manager will use these credentials to log in to the facility portal and submit daily field logs.
                                    </p>
                                </div>
                            </form>
                        </div>
                        
                        <div className="p-5 bg-farma-sand border-t border-farma-forest/10 shrink-0 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="px-5 py-3 rounded-lg bg-transparent hover:bg-farma-forest/5 text-farma-forest/70 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="manager-form"
                                disabled={loading}
                                className="px-6 py-3 rounded-lg bg-farma-gold hover:bg-farma-gold-hover text-farma-forest font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                            >
                                {loading ? 'Saving Manager...' : 'Save Manager'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {managerToDeactivate && (
                <div className="fixed inset-0 bg-farma-forest/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
                    <div className="bg-farma-cream border border-farma-terracotta/40 rounded-xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col relative p-8 text-center space-y-4">
                        <div className="w-14 h-14 rounded-full bg-farma-terracotta/10 flex items-center justify-center text-farma-terracotta mx-auto mb-2 shadow-inner">
                            <IconWarningLarge />
                        </div>
                        <h4 className="text-xl font-bold text-farma-forest">Deactivate Manager?</h4>
                        <p className="text-farma-forest/70 text-sm leading-relaxed">
                            Are you sure you want to revoke access for <strong className="text-farma-forest">{managerToDeactivate.firstName} {managerToDeactivate.lastName}</strong>? 
                            They will immediately lose session permissions to submit field telemetry.
                        </p>
                        
                        {errorMessage && (
                            <p className="text-farma-terracotta text-xs font-bold bg-farma-terracotta/10 p-3 rounded-lg border border-farma-terracotta/20">{errorMessage}</p>
                        )}

                        <div className="pt-4 flex gap-3">
                            <button
                                type="button"
                                onClick={() => { setManagerToDeactivate(null); setErrorMessage(null); }}
                                disabled={deactivateLoading}
                                className="flex-1 py-3 rounded-lg bg-white border border-farma-forest/10 text-farma-forest/70 hover:text-farma-forest hover:bg-farma-forest/5 font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeactivateManager}
                                disabled={deactivateLoading}
                                className="flex-1 py-3 rounded-lg bg-farma-terracotta hover:bg-[#c6583d] text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                {deactivateLoading ? 'Revoking...' : 'Yes, Revoke Access'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ==========================================
// Reusable SVG Components
// ==========================================

const IconPlus = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
    </svg>
);

const IconSearch = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const IconClose = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const IconWarning = () => (
    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

const IconWarningLarge = () => (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

const IconEmptyTeam = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);