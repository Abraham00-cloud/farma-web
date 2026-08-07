import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { infrastructureService } from '../../services/infrastructureService';
import { batchService } from '../../services/batchService';
import { BatchDetailView } from './BatchDetailView';
import type { FarmResponseDto } from '../../types/infrastructure';
import {
    Status,
    type BatchResponseDto,
    type BatchCloseRequestDto,
} from '../../types/batch';

interface BatchManagementViewProps {
    organisationId: number;
    userRole?: string;
    currentUserId?: number;
}

interface FarmBatchGroup {
    farm: FarmResponseDto;
    batches: BatchResponseDto[];
}

export const BatchManagementView: React.FC<BatchManagementViewProps> = ({ 
    organisationId,
    userRole = 'PROPRIETOR',
    currentUserId,
}) => {
    const isProprietor = userRole?.toUpperCase() === 'PROPRIETOR' || userRole?.toUpperCase() === 'ADMIN';

    const [farmBatchGroups, setFarmBatchGroups] = useState<FarmBatchGroup[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<'ALL' | Status>('ACTIVE');

    // Deep View State
    const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);

    // Modals
    const [selectedBatchForMortality, setSelectedBatchForMortality] = useState<BatchResponseDto | null>(null);
    const [mortalityCount, setMortalityCount] = useState<number>(1);

    const [selectedBatchForClose, setSelectedBatchForClose] = useState<BatchResponseDto | null>(null);
    const [closeForm, setCloseForm] = useState<BatchCloseRequestDto>(() => ({
        actualEndDate: new Date().toISOString().split('T')[0],
        totalBirdsSold: 0,
        totalSaleRevenue: 0,
        harvestNotes: '',
    }));

    const loadBatches = async () => {
        try {
            let farmList = await infrastructureService.getFarmsByOrganisation(organisationId);

            // 🔒 ROLE SCOPING: Filter farms if user is a Manager
            if (!isProprietor && currentUserId) {
                farmList = farmList.filter((farm) => farm.managerId === currentUserId);
            }

            const groups = await Promise.all(
                farmList.map(async (farm) => {
                    try {
                        const sections = await infrastructureService.getSectionsByFarm(farm.id);
                        const batchPromises = sections.map((sec) =>
                            batchService.getBatchesBySection(sec.id).catch(() => [])
                        );
                        const nestedBatches = await Promise.all(batchPromises);
                        const farmBatches = nestedBatches.flat();

                        const uniqueBatches = Array.from(
                            new Map(farmBatches.map((b) => [b.id, b])).values()
                        );

                        return { farm, batches: uniqueBatches };
                    } catch {
                        return { farm, batches: [] };
                    }
                })
            );

            setFarmBatchGroups(groups);
        } catch {
            // Fallback state
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            try {
                let farmList = await infrastructureService.getFarmsByOrganisation(organisationId);

                // 🔒 ROLE SCOPING: Filter farms if user is a Manager
                if (!isProprietor && currentUserId) {
                    farmList = farmList.filter((farm) => farm.managerId === currentUserId);
                }

                const groups = await Promise.all(
                    farmList.map(async (farm) => {
                        try {
                            const sections = await infrastructureService.getSectionsByFarm(farm.id);
                            const batchPromises = sections.map((sec) =>
                                batchService.getBatchesBySection(sec.id).catch(() => [])
                            );
                            const nestedBatches = await Promise.all(batchPromises);
                            const farmBatches = nestedBatches.flat();

                            const uniqueBatches = Array.from(
                                new Map(farmBatches.map((b) => [b.id, b])).values()
                            );

                            return { farm, batches: uniqueBatches };
                        } catch {
                            return { farm, batches: [] };
                        }
                    })
                );

                if (isMounted) {
                    setFarmBatchGroups(groups);
                }
            } catch {
                // Fallback state
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        init();

        return () => {
            isMounted = false;
        };
    }, [organisationId, isProprietor, currentUserId]);

    if (selectedBatchId !== null) {
        return (
            <BatchDetailView
                batchId={selectedBatchId}
                onBack={() => {
                    setSelectedBatchId(null);
                    loadBatches();
                }}
            />
        );
    }

    const allFlatBatches = farmBatchGroups.flatMap((g) => g.batches);
    const activeBatches = allFlatBatches.filter((b) => b.status === Status.ACTIVE);
    const totalLivePopulation = activeBatches.reduce((acc, curr) => acc + curr.currentCount, 0);
    const totalMortality = allFlatBatches.reduce((acc, curr) => acc + curr.mortalityCount, 0);

    // Handlers
    const handleLogMortality = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBatchForMortality) return;

        setSubmitting(true);
        setErrorMessage(null);

        try {
            await batchService.logMortality(selectedBatchForMortality.id, Number(mortalityCount));
            setSelectedBatchForMortality(null);
            setMortalityCount(1);
            await loadBatches();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setErrorMessage(err.response?.data?.message || 'Failed to log mortality event.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenCloseModal = (e: React.MouseEvent, batch: BatchResponseDto) => {
        e.stopPropagation();
        setSelectedBatchForClose(batch);
        setCloseForm({
            actualEndDate: new Date().toISOString().split('T')[0],
            totalBirdsSold: batch.currentCount,
            totalSaleRevenue: batch.currentCount * 2500,
            harvestNotes: '',
        });
    };

    const handleOpenMortalityModal = (e: React.MouseEvent, batch: BatchResponseDto) => {
        e.stopPropagation();
        setSelectedBatchForMortality(batch);
    };

    const handleCloseBatch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBatchForClose) return;

        setSubmitting(true);
        setErrorMessage(null);

        try {
            await batchService.closeBatch(selectedBatchForClose.id, {
                actualEndDate: closeForm.actualEndDate,
                totalBirdsSold: Number(closeForm.totalBirdsSold),
                totalSaleRevenue: Number(closeForm.totalSaleRevenue),
                harvestNotes: closeForm.harvestNotes?.trim(),
            });
            setSelectedBatchForClose(null);
            await loadBatches();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setErrorMessage(err.response?.data?.message || 'Failed to finalize batch harvest.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        {isProprietor ? 'Flock & Lifecycle Command Center' : 'My Site Flock Batches'}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                        Active and historical livestock cohorts physically classified by farm facility and housing pen.
                    </p>
                </div>

                {/* Filter Pills */}
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                    {(['ACTIVE', 'COMPLETED', 'ALL'] as const).map((st) => (
                        <button
                            key={st}
                            type="button"
                            onClick={() => setStatusFilter(st)}
                            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${statusFilter === st
                                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                                    : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            {st}
                        </button>
                    ))}
                </div>
            </div>

            {/* Aggregate Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        Active Cohorts
                    </span>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1">
                        {activeBatches.length} Batches
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        Live Inventory Population
                    </span>
                    <div className="text-2xl font-extrabold text-emerald-700 mt-1">
                        {totalLivePopulation.toLocaleString()} Heads
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        Cumulative Mortality Logged
                    </span>
                    <div className="text-2xl font-extrabold text-rose-600 mt-1">
                        {totalMortality.toLocaleString()} Casualties
                    </div>
                </div>
            </div>

            {/* Farm-Classified Batches */}
            {loading ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs font-mono text-slate-400">
                    Loading farm production cohorts...
                </div>
            ) : farmBatchGroups.length > 0 ? (
                farmBatchGroups.map(({ farm, batches }) => {
                    const filteredBatches = statusFilter === 'ALL'
                        ? batches
                        : batches.filter((b) => b.status === statusFilter);

                    return (
                        <div
                            key={farm.id}
                            className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-0"
                        >
                            {/* Farm Facility Card Header */}
                            <div className="bg-slate-900 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center font-bold text-sm">
                                        🌾
                                    </div>
                                    <div>
                                        <h4 className="text-base font-extrabold tracking-tight">{farm.name}</h4>
                                        <p className="text-[10px] font-mono text-slate-400">
                                            📍 {farm.address} • GPS: [{farm.latitude.toFixed(3)}, {farm.longitude.toFixed(3)}]
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3 text-xs font-mono">
                                    <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-bold border border-slate-700">
                                        {filteredBatches.length} Cohorts
                                    </span>
                                </div>
                            </div>

                            {/* Batches Table for this Farm */}
                            <table className="w-full text-left text-xs font-sans text-slate-700">
                                <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3.5">Batch Code</th>
                                        <th className="px-6 py-3.5">Housing Pen / Section</th>
                                        <th className="px-6 py-3.5">Category / Type</th>
                                        <th className="px-6 py-3.5">Live Population</th>
                                        <th className="px-6 py-3.5">Mortality</th>
                                        <th className="px-6 py-3.5">Status</th>
                                        <th className="px-6 py-3.5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-mono">
                                    {filteredBatches.length > 0 ? (
                                        filteredBatches.map((batch) => {
                                            const survivalRate = batch.initialCount > 0
                                                ? (((batch.initialCount - batch.mortalityCount) / batch.initialCount) * 100).toFixed(1)
                                                : '100';

                                            return (
                                                <tr
                                                    key={batch.id}
                                                    onClick={() => setSelectedBatchId(batch.id)}
                                                    className="hover:bg-slate-50/80 transition cursor-pointer group"
                                                >
                                                    <td className="px-6 py-4 font-bold text-slate-900 group-hover:text-[#C2410C]">
                                                        <div>{batch.batchNumber} →</div>
                                                        <span className="text-[10px] text-slate-400 font-normal">
                                                            Started: {batch.startDate}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px]">
                                                            🛖 {batch.sectionName}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                                                            {batch.animalCategory} ({batch.productionType})
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-emerald-700">
                                                        {batch.currentCount.toLocaleString()} / {batch.initialCount.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-bold text-rose-600">
                                                            {batch.mortalityCount.toLocaleString()}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 block">
                                                            ({survivalRate}% survival)
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${batch.status === Status.ACTIVE
                                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                                                }`}
                                                        >
                                                            {batch.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right space-x-2">
                                                        {batch.status === Status.ACTIVE && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => handleOpenMortalityModal(e, batch)}
                                                                    className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[10px] transition cursor-pointer"
                                                                >
                                                                    💀 Log Casualty
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => handleOpenCloseModal(e, batch)}
                                                                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] transition cursor-pointer"
                                                                >
                                                                    🌾 Harvest & Close
                                                                </button>
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                                                No production batches recorded under {farm.name} matching this filter.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    );
                })
            ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs font-mono text-slate-400">
                    {isProprietor ? 'No farm facilities or cohorts found.' : 'No production batches found for your assigned farm.'}
                </div>
            )}

            {/* Log Mortality Modal */}
            {selectedBatchForMortality && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h4 className="text-base font-bold text-slate-900">Log Casualty / Mortality</h4>
                                <p className="text-xs text-slate-500">Batch: {selectedBatchForMortality.batchNumber}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedBatchForMortality(null)}
                                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {errorMessage && (
                            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-mono">
                                🚨 {errorMessage}
                            </div>
                        )}

                        <form onSubmit={handleLogMortality} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Recorded Casualty Count *
                                </label>
                                <input
                                    type="number"
                                    required
                                    min={1}
                                    max={selectedBatchForMortality.currentCount}
                                    value={mortalityCount}
                                    onChange={(e) => setMortalityCount(Number(e.target.value))}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white font-mono"
                                />
                            </div>

                            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setSelectedBatchForMortality(null)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase cursor-pointer disabled:opacity-50"
                                >
                                    {submitting ? 'Updating...' : 'Record Mortality'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Close Batch / Harvest Modal */}
            {selectedBatchForClose && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h4 className="text-base font-bold text-slate-900">Harvest & Close Batch</h4>
                                <p className="text-xs text-slate-500">Releases {selectedBatchForClose.sectionName} for sanitization</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedBatchForClose(null)}
                                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {errorMessage && (
                            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-mono">
                                🚨 {errorMessage}
                            </div>
                        )}

                        <form onSubmit={handleCloseBatch} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Actual Harvest End Date *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={closeForm.actualEndDate}
                                    onChange={(e) => setCloseForm({ ...closeForm, actualEndDate: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Total Birds/Livestock Sold *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min={0}
                                        value={closeForm.totalBirdsSold}
                                        onChange={(e) => setCloseForm({ ...closeForm, totalBirdsSold: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Total Sale Revenue (₦) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min={1}
                                        value={closeForm.totalSaleRevenue}
                                        onChange={(e) => setCloseForm({ ...closeForm, totalSaleRevenue: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Harvest Notes (Optional)
                                </label>
                                <textarea
                                    rows={2}
                                    value={closeForm.harvestNotes}
                                    onChange={(e) => setCloseForm({ ...closeForm, harvestNotes: e.target.value })}
                                    placeholder="e.g. Sold to Grand Oak Processing Plant at ₦2,500/bird average."
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                                />
                            </div>

                            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setSelectedBatchForClose(null)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase cursor-pointer disabled:opacity-50"
                                >
                                    {submitting ? 'Finalizing...' : 'Finalize & Unlock Section'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};