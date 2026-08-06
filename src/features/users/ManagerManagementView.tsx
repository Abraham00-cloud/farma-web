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
    const [showModal, setShowModal] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Initial state uses props directly
    const [formData, setFormData] = useState<Omit<UserRequestDto, 'organisationId' | 'parentId'>>({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: Role.MANAGER,
    });

    // Fetch managers linked to this proprietor
    useEffect(() => {
        let isMounted = true;

        const fetchManagers = async () => {
            try {
                const data = await userService.getManagersByProprietor(proprietorId);
                if (isMounted) {
                    setManagers(data);
                }
            } catch {
                // Fallback on clean state
            }
        };

        fetchManagers();

        return () => {
            isMounted = false;
        };
    }, [proprietorId]);

    const handleAddManager = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage(null);

        // Build the complete DTO with guaranteed parentId and organisationId
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

            // Refresh list cleanly
            const updatedList = await userService.getManagersByProprietor(proprietorId);
            setManagers(updatedList);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setErrorMessage(
                    err.response?.data?.message || 'Failed to register manager account.'
                );
            } else {
                setErrorMessage('An unexpected error occurred while creating the manager.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Action Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        Personnel Directory
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                        Register and manage site managers responsible for daily farm operations and pen telemetry.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold text-xs uppercase tracking-wider shadow-sm transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                    <span>+ Add New Manager</span>
                </button>
            </div>

            {/* Managers Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs font-sans text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200">
                        <tr>
                            <th className="px-5 py-3.5">ID</th>
                            <th className="px-5 py-3.5">Full Name</th>
                            <th className="px-5 py-3.5">Email Address</th>
                            <th className="px-5 py-3.5">Role</th>
                            <th className="px-5 py-3.5">Date Created</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {managers.length > 0 ? (
                            managers.map((m) => (
                                <tr key={m.id} className="hover:bg-slate-50/80 transition">
                                    <td className="px-5 py-4 font-mono font-bold text-slate-900">#{m.id}</td>
                                    <td className="px-5 py-4 font-bold text-slate-900">
                                        {m.firstName} {m.lastName}
                                    </td>
                                    <td className="px-5 py-4 text-slate-600 font-mono">{m.email}</td>
                                    <td className="px-5 py-4">
                                        <span className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold font-mono text-[10px]">
                                            {m.role}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 font-mono text-slate-400">
                                        {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'N/A'}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-5 py-10 text-center text-slate-400 font-mono">
                                    No site managers registered yet. Click <span className="text-slate-700 font-bold">"+ Add New Manager"</span> to add your first manager.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Manager Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h4 className="text-base font-bold text-slate-900">Add Site Manager</h4>
                                <p className="text-xs text-slate-500">
                                    Parent Proprietor ID: #{proprietorId} | Organisation ID: #{organisationId}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer p-1"
                            >
                                ✕
                            </button>
                        </div>

                        {errorMessage && (
                            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-mono">
                                🚨 {errorMessage}
                            </div>
                        )}

                        <form onSubmit={handleAddManager} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        First Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.firstName}
                                        onChange={(e) =>
                                            setFormData({ ...formData, firstName: e.target.value })
                                        }
                                        placeholder="e.g. John"
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#C2410C] focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Last Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.lastName}
                                        onChange={(e) =>
                                            setFormData({ ...formData, lastName: e.target.value })
                                        }
                                        placeholder="e.g. Doe"
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#C2410C] focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({ ...formData, email: e.target.value })
                                    }
                                    placeholder="manager@farm.com"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#C2410C] focus:bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Password (Min 8 characters) *
                                </label>
                                <input
                                    type="password"
                                    required
                                    minLength={8}
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData({ ...formData, password: e.target.value })
                                    }
                                    placeholder="••••••••"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#C2410C] focus:bg-white"
                                />
                            </div>

                            <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2.5 rounded-xl bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-bold uppercase tracking-wider shadow-xs transition cursor-pointer disabled:opacity-50"
                                >
                                    {loading ? 'Registering...' : 'Save Manager'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};