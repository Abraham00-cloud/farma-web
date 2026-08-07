import React from 'react';
import type { AuthResponseDto } from '../../types/auth';

interface ManagerDashboardViewProps {
    authData: AuthResponseDto;
    setActiveTab: (tab: string) => void;
}

export const ManagerDashboardView: React.FC<ManagerDashboardViewProps> = ({
    authData,
    setActiveTab,
}) => {
    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Page Title & Operational Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <div className="flex items-center space-x-2">
                        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                            Farm Operations Command
                        </h3>
                        <span className="text-xs font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            Site Manager
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                        Real-time pen monitoring, daily telemetry logging, biosecurity alerts, and local inventory stock.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-mono font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                        Active Shift • Farm Scope #{authData.organisationId}
                    </span>
                </div>
            </div>

            {/* Operational KPI Grid for Manager */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Metric Card 1: Active Batches */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                            Active Batches
                        </span>
                        <span className="text-lg">🐣</span>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-3xl font-extrabold text-slate-900 font-mono">1</span>
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                            Cobb-500 Broilers
                        </span>
                    </div>
                </div>

                {/* Metric Card 2: Today's Telemetry */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                            Daily Telemetry
                        </span>
                        <span className="text-lg">📝</span>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            ✓ Today Logged
                        </span>
                        <button
                            type="button"
                            onClick={() => setActiveTab('daily-logs')}
                            className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                        >
                            Add Entry →
                        </button>
                    </div>
                </div>

                {/* Metric Card 3: Biosecurity Alerts */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                            Biosecurity Hazards
                        </span>
                        <span className="text-lg">🛡️</span>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-3xl font-extrabold text-slate-900 font-mono">0</span>
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                            THI Normal
                        </span>
                    </div>
                </div>

                {/* Metric Card 4: Feed Inventory */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                            Feed Inventory
                        </span>
                        <span className="text-lg">📦</span>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-3xl font-extrabold text-slate-900 font-mono">
                            450 <span className="text-xs font-normal text-slate-500">kg</span>
                        </span>
                        <button
                            type="button"
                            onClick={() => setActiveTab('inventory')}
                            className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
                        >
                            View Stock →
                        </button>
                    </div>
                </div>
            </div>

            {/* Operational Actions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                {/* Left 2-Column: Field Actions */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h4 className="text-base font-bold text-slate-900">
                            Manager Field Workflows
                        </h4>
                        <span className="text-xs font-mono text-slate-400">Daily Operations</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setActiveTab('daily-logs')}
                            className="p-4 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-left transition group cursor-pointer"
                        >
                            <div className="flex items-center space-x-3">
                                <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg">
                                    📝
                                </span>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 group-hover:text-amber-900">
                                        Record Daily Log
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Log mortality, feed usage & weight
                                    </p>
                                </div>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('analytics')}
                            className="p-4 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50/30 text-left transition group cursor-pointer"
                        >
                            <div className="flex items-center space-x-3">
                                <span className="w-10 h-10 rounded-xl bg-red-100 text-red-800 flex items-center justify-center font-bold text-lg">
                                    🛡️
                                </span>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 group-hover:text-red-800">
                                        Biosecurity Radar
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Monitor THI climate & disease risks
                                    </p>
                                </div>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('batches')}
                            className="p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/30 text-left transition group cursor-pointer"
                        >
                            <div className="flex items-center space-x-3">
                                <span className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-lg">
                                    🐣
                                </span>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 group-hover:text-purple-800">
                                        Flock Performance
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        View FCR, growth & batch progress
                                    </p>
                                </div>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('inventory')}
                            className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 text-left transition group cursor-pointer"
                        >
                            <div className="flex items-center space-x-3">
                                <span className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-lg">
                                    📦
                                </span>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 group-hover:text-blue-800">
                                        Farm Inventory
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Track feed bags & vaccines
                                    </p>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Right Column: Operator Clearance */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                        <h4 className="text-base font-bold text-slate-900">Operator Profile</h4>
                        <p className="text-xs text-slate-400 font-mono">Assigned Site Manager Clearance</p>
                    </div>

                    <div className="space-y-3 text-xs font-mono">
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                            <span className="text-slate-500">Manager Email</span>
                            <span className="font-bold text-slate-900">{authData.email}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                            <span className="text-slate-500">Access Scope</span>
                            <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                                {authData.role}
                            </span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                            <span className="text-slate-500">Tenant Org ID</span>
                            <span className="font-bold text-slate-900">#{authData.organisationId}</span>
                        </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                        <p className="font-bold text-slate-800">💡 Manager Protocol Notice:</p>
                        <p>
                            Daily logs automatically update live FCR curves and debit feed stock. High mortality or thermal stress will trigger biosecurity alerts requiring supervisor action.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};