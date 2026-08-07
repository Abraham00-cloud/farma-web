import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { infrastructureService } from '../../services/infrastructureService';
import { batchService } from '../../services/batchService';
import { dailyLogService } from '../../services/dailyLogService';
import type { FarmResponseDto } from '../../types/infrastructure';
import type { BatchResponseDto } from '../../types/batch';
import type { DailyLogRequestDto, DailyLogResponseDto } from '../../types/dailyLog';

interface DailyLogsHubViewProps {
    organisationId: number;
    userRole?: string;
    currentUserId?: number;
}

interface FarmActiveBatches {
    farm: FarmResponseDto;
    batches: BatchResponseDto[];
}

export const DailyLogsHubView: React.FC<DailyLogsHubViewProps> = ({ 
    organisationId, 
    userRole = 'PROPRIETOR', 
    currentUserId 
}) => {
    const isProprietor = userRole?.toUpperCase() === 'PROPRIETOR' || userRole?.toUpperCase() === 'ADMIN';

    const [farmBatchMap, setFarmBatchMap] = useState<FarmActiveBatches[]>([]);
    const [selectedFarmId, setSelectedFarmId] = useState<number | ''>('');
    const [selectedBatchId, setSelectedBatchId] = useState<number | ''>('');
    const [selectedBatch, setSelectedBatch] = useState<BatchResponseDto | null>(null);

    // Daily Logs for the selected batch ONLY
    const [batchLogs, setBatchLogs] = useState<DailyLogResponseDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Form Payload
    const [logForm, setLogForm] = useState<Omit<DailyLogRequestDto, 'batchId'>>({
        logDate: new Date().toISOString().split('T')[0],
        feedQuantityUsed: 0,
        medicineQuantityUsed: 0,
        administrationMethod: '',
        mortalityCount: 0,
        averageWeight: 0,
        observations: '',
    });

    // 1. Initial Load: Fetch Farms & Active Batches with Role Scoping
    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            try {
                let farmList = await infrastructureService.getFarmsByOrganisation(organisationId);

                // 🔒 ROLE SCOPING: Filter farms if user is a Manager
                if (!isProprietor && currentUserId) {
                    farmList = farmList.filter((farm) => farm.managerId === currentUserId);
                }

                const farmDataPromises = farmList.map(async (farm) => {
                    try {
                        const sections = await infrastructureService.getSectionsByFarm(farm.id);
                        const batchPromises = sections.map((sec) =>
                            batchService.getBatchesBySection(sec.id).catch(() => [])
                        );
                        const nestedBatches = await Promise.all(batchPromises);
                        const farmBatches = nestedBatches.flat().filter((b) => b.status === 'ACTIVE');

                        return { farm, batches: farmBatches };
                    } catch {
                        return { farm, batches: [] };
                    }
                });

                const results = await Promise.all(farmDataPromises);

                if (isMounted) {
                    setFarmBatchMap(results);
                    if (results.length > 0 && results[0].farm) {
                        setSelectedFarmId(results[0].farm.id);
                        if (results[0].batches.length > 0) {
                            const firstBatch = results[0].batches[0];
                            setSelectedBatchId(firstBatch.id);
                            setSelectedBatch(firstBatch);
                        }
                    }
                }
            } catch {
                // Fallback
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

    // 2. Pure Async Data-Fetching Effect for Selected Batch Logs
    useEffect(() => {
        let isMounted = true;

        if (!selectedBatchId) return;

        const fetchLogsForSelectedBatch = async () => {
            try {
                const logs = await dailyLogService.getLogsForBatch(Number(selectedBatchId));
                const sorted = Array.isArray(logs)
                    ? logs.sort((a, b) => new Date(b.logDate).getTime() - new Date(a.logDate).getTime())
                    : [];

                if (isMounted) {
                    setBatchLogs(sorted);
                }
            } catch {
                if (isMounted) {
                    setBatchLogs([]);
                }
            }
        };

        fetchLogsForSelectedBatch();

        return () => {
            isMounted = false;
        };
    }, [selectedBatchId]);

    // Farm Selection Handler
    const handleFarmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const farmId = Number(e.target.value);
        setSelectedFarmId(farmId);

        const group = farmBatchMap.find((g) => g.farm.id === farmId);
        if (group && group.batches.length > 0) {
            const firstBatch = group.batches[0];
            setSelectedBatchId(firstBatch.id);
            setSelectedBatch(firstBatch);
        } else {
            setSelectedBatchId('');
            setSelectedBatch(null);
            setBatchLogs([]);
        }
    };

    // Batch Selection Handler
    const handleBatchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const bId = Number(e.target.value);
        setSelectedBatchId(bId);

        const group = farmBatchMap.find((g) => g.farm.id === Number(selectedFarmId));
        const foundBatch = group?.batches.find((b) => b.id === bId) || null;
        setSelectedBatch(foundBatch);
    };

    // Submit Handler
    const handleCreateDailyLog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBatchId) return;

        setSubmitting(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        const payload: DailyLogRequestDto = {
            batchId: Number(selectedBatchId),
            logDate: logForm.logDate,
            mortalityCount: Number(logForm.mortalityCount || 0),
            feedQuantityUsed: logForm.feedQuantityUsed ? Number(logForm.feedQuantityUsed) : undefined,
            medicineQuantityUsed: logForm.medicineQuantityUsed ? Number(logForm.medicineQuantityUsed) : undefined,
            administrationMethod: logForm.administrationMethod?.trim() || undefined,
            averageWeight: logForm.averageWeight ? Number(logForm.averageWeight) : undefined,
            observations: logForm.observations?.trim() || undefined,
        };

        try {
            await dailyLogService.createDailyLog(payload);
            setSuccessMessage('Daily telemetry log successfully saved!');

            // Re-fetch batch details & logs
            const updatedLogs = await dailyLogService.getLogsForBatch(Number(selectedBatchId));
            const sorted = Array.isArray(updatedLogs)
                ? updatedLogs.sort((a, b) => new Date(b.logDate).getTime() - new Date(a.logDate).getTime())
                : [];
            setBatchLogs(sorted);

            if (selectedBatch) {
                const updatedBatch = await batchService.getBatchById(selectedBatch.id);
                setSelectedBatch(updatedBatch);
            }

            setLogForm({
                logDate: new Date().toISOString().split('T')[0],
                feedQuantityUsed: 0,
                medicineQuantityUsed: 0,
                administrationMethod: '',
                mortalityCount: 0,
                averageWeight: 0,
                observations: '',
            });
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setErrorMessage(
                    typeof err.response?.data === 'string'
                        ? err.response.data
                        : err.response?.data?.message || 'Failed to submit log.'
                );
            } else {
                setErrorMessage('An unexpected error occurred.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const currentFarmGroup = farmBatchMap.find((g) => g.farm.id === Number(selectedFarmId));
    const availableBatches = currentFarmGroup ? currentFarmGroup.batches : [];

    // Metrics for selected batch
    const totalFeedConsumed = batchLogs.reduce((acc, curr) => acc + (curr.feedQuantityUsed || 0), 0);
    const latestWeight = batchLogs.find((l) => l.averageWeight)?.averageWeight || null;

    return (
        <div className="space-y-6">
            {/* 1. TOP SELECTOR BAR */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                            {isProprietor ? 'Daily Telemetry Workspace' : 'Site Shift Telemetry Log'}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {isProprietor 
                                ? 'Select a farm and active cohort to log daily activity or inspect historical telemetry.'
                                : 'Record shift feed distribution, medication administration, and pen mortality.'}
                        </p>
                    </div>
                </div>

                {/* Selector Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            Select Farm Facility
                        </label>
                        <select
                            value={selectedFarmId}
                            onChange={handleFarmChange}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#C2410C] focus:bg-white"
                        >
                            {farmBatchMap.map(({ farm }) => (
                                <option key={farm.id} value={farm.id}>
                                    🏢 {farm.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            Select Active Batch / Pen
                        </label>
                        <select
                            value={selectedBatchId}
                            onChange={handleBatchChange}
                            disabled={availableBatches.length === 0}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#C2410C] focus:bg-white disabled:opacity-50"
                        >
                            {availableBatches.length > 0 ? (
                                availableBatches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        🛖 {b.sectionName} — Code: {b.batchNumber}
                                    </option>
                                ))
                            ) : (
                                <option value="">No active cohorts found in this farm</option>
                            )}
                        </select>
                    </div>
                </div>
            </div>

            {selectedBatch ? (
                <>
                    {/* 2. LIVE BATCH KPI BANNER */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
                                Live Population Balance
                            </span>
                            <span className="text-xl font-extrabold text-slate-900 mt-1 block">
                                {selectedBatch.currentCount.toLocaleString()} / {selectedBatch.initialCount.toLocaleString()} Heads
                            </span>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
                                Total Casualties Logged
                            </span>
                            <span className="text-xl font-extrabold text-rose-600 mt-1 block">
                                {selectedBatch.mortalityCount} Head
                            </span>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
                                Total Feed Consumed
                            </span>
                            <span className="text-xl font-extrabold text-[#C2410C] mt-1 block">
                                {totalFeedConsumed.toFixed(1)} Bags/Units
                            </span>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
                                Latest Avg Body Weight
                            </span>
                            <span className="text-xl font-extrabold text-emerald-700 mt-1 block">
                                {latestWeight ? `${latestWeight} kg` : 'Not Measured'}
                            </span>
                        </div>
                    </div>

                    {/* 3. MAIN WORKSPACE: LOG ENTRY FORM (LEFT) + LOG TIMELINE (RIGHT) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left: Form for Selected Batch */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 h-fit">
                            <div className="border-b border-slate-100 pb-3">
                                <h4 className="text-base font-bold text-slate-900">📝 Record Daily Log</h4>
                                <p className="text-xs text-slate-500 font-mono">
                                    Batch: #{selectedBatch.batchNumber}
                                </p>
                            </div>

                            {errorMessage && (
                                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-mono">
                                    🚨 {errorMessage}
                                </div>
                            )}

                            {successMessage && (
                                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono">
                                    ✅ {successMessage}
                                </div>
                            )}

                            <form onSubmit={handleCreateDailyLog} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Log Date *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={logForm.logDate}
                                        onChange={(e) => setLogForm({ ...logForm, logDate: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#C2410C] focus:bg-white"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Feed Quantity Used
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            value={logForm.feedQuantityUsed || ''}
                                            onChange={(e) => setLogForm({ ...logForm, feedQuantityUsed: Number(e.target.value) })}
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#C2410C] focus:bg-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Casualties Logged *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            max={selectedBatch.currentCount}
                                            value={logForm.mortalityCount}
                                            onChange={(e) => setLogForm({ ...logForm, mortalityCount: Number(e.target.value) })}
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Medicine Qty Used
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            value={logForm.medicineQuantityUsed || ''}
                                            onChange={(e) => setLogForm({ ...logForm, medicineQuantityUsed: Number(e.target.value) })}
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#C2410C] focus:bg-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Avg Weight (kg)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={logForm.averageWeight || ''}
                                            onChange={(e) => setLogForm({ ...logForm, averageWeight: Number(e.target.value) })}
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#C2410C] focus:bg-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Observations / Notes
                                    </label>
                                    <textarea
                                        rows={2}
                                        maxLength={500}
                                        value={logForm.observations || ''}
                                        onChange={(e) => setLogForm({ ...logForm, observations: e.target.value })}
                                        placeholder="e.g. Normal feed intake. Temp normal."
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#C2410C] focus:bg-white"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider shadow-xs transition cursor-pointer disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : 'Submit Daily Log'}
                                </button>
                            </form>
                        </div>

                        {/* Right: History Timeline for Selected Batch */}
                        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs h-fit">
                            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
                                <div>
                                    <h4 className="text-base font-extrabold tracking-tight">
                                        Batch Telemetry Ledger
                                    </h4>
                                    <p className="text-[10px] font-mono text-slate-400">
                                        Showing logs for {selectedBatch.sectionName} ({selectedBatch.batchNumber})
                                    </p>
                                </div>
                                <span className="text-xs font-mono text-slate-400">
                                    {batchLogs.length} Entries Logged
                                </span>
                            </div>

                            <table className="w-full text-left text-xs font-sans text-slate-700">
                                <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="px-5 py-3.5">Date</th>
                                        <th className="px-5 py-3.5">Feed Used</th>
                                        <th className="px-5 py-3.5">Casualties</th>
                                        <th className="px-5 py-3.5">Avg Weight</th>
                                        <th className="px-5 py-3.5">Auditor</th>
                                        <th className="px-5 py-3.5">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-mono">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                                                Loading batch history...
                                            </td>
                                        </tr>
                                    ) : batchLogs.length > 0 ? (
                                        batchLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50/80 transition">
                                                <td className="px-5 py-4 font-bold text-slate-900">{log.logDate}</td>
                                                <td className="px-5 py-4 font-bold text-[#C2410C]">
                                                    {log.feedQuantityUsed ? `${log.feedQuantityUsed} units` : '-'}
                                                </td>
                                                <td className="px-5 py-4 font-bold text-rose-600">
                                                    {log.mortalityCount > 0 ? `${log.mortalityCount} 💀` : '0'}
                                                </td>
                                                <td className="px-5 py-4 font-bold text-slate-900">
                                                    {log.averageWeight ? `${log.averageWeight} kg` : '-'}
                                                </td>
                                                <td className="px-5 py-4 text-emerald-700 font-bold">
                                                    {log.recordedByName || 'Auditor'}
                                                </td>
                                                <td className="px-5 py-4 text-slate-500 max-w-xs truncate">
                                                    {log.observations || '-'}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                                                No telemetry logs recorded for this batch yet. Use the form on the left to submit today's walk-through log.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs font-mono text-slate-400">
                    {isProprietor ? 'Please select an active batch from the top dropdown to start logging telemetry.' : 'No assigned farm or active cohort found for your manager account.'}
                </div>
            )}
        </div>
    );
};