import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom'; // <-- Added Router imports
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
    const navigate = useNavigate(); // <-- Initialize Navigation

    const [farmBatchGroups, setFarmBatchGroups] = useState<FarmBatchGroup[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<'ALL' | Status>('ACTIVE');

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
                setErrorMessage(err.response?.data?.message || 'Failed to finalize harvest.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // PROPER ROUTING RENDER BLOCK
    return (
        <Routes>
            {/* 1. The Main List Route */}
            <Route index element={
                <div className="space-y-6 lg:space-y-8 font-sans max-w-7xl mx-auto pb-12">
                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b-2 border-[#101B14]/10 pb-6">
                        <div>
                            <h3 className="text-3xl md:text-4xl font-extrabold text-[#101B14] tracking-tight font-['Fraunces',serif]">
                                {isProprietor ? 'All Flock Batches' : 'My Farm Flocks'}
                            </h3>
                            <p className="text-sm text-[#101B14]/70 font-medium mt-2 max-w-xl leading-relaxed">
                                Active and past flock batches across your farm pens. Monitor bird counts, log mortalities, and harvest ready flocks.
                            </p>
                        </div>

                        {/* Filter Pills */}
                        <div className="flex bg-[#FBF9F5] p-1.5 rounded-lg border border-[#101B14]/10 shadow-xs text-xs font-bold uppercase tracking-wider">
                            {(['ACTIVE', 'COMPLETED', 'ALL'] as const).map((st) => (
                                <button
                                    key={st}
                                    type="button"
                                    onClick={() => setStatusFilter(st)}
                                    className={`px-5 py-2.5 rounded-md transition-all cursor-pointer ${
                                        statusFilter === st
                                            ? 'bg-[#101B14] text-[#FBF9F5] shadow-md transform scale-[1.02]'
                                            : 'text-[#101B14]/60 hover:text-[#101B14] hover:bg-[#101B14]/5'
                                    }`}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Aggregate Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="bg-[#FBF9F5] border border-[#101B14]/10 rounded-xl p-6 shadow-xs flex flex-col justify-center">
                            <span className="text-[10px] font-mono font-bold text-[#101B14]/60 uppercase tracking-widest mb-1">
                                Active Batches
                            </span>
                            <div className="text-3xl font-extrabold text-[#101B14] font-mono">
                                {activeBatches.length}
                            </div>
                        </div>
                        <div className="bg-[#FBF9F5] border border-[#101B14]/10 rounded-xl p-6 shadow-xs flex flex-col justify-center">
                            <span className="text-[10px] font-mono font-bold text-[#3F6B47] uppercase tracking-widest mb-1">
                                Total Live Birds
                            </span>
                            <div className="text-3xl font-extrabold text-[#101B14] font-mono">
                                {totalLivePopulation.toLocaleString()}
                            </div>
                        </div>
                        <div className="bg-[#FBF9F5] border border-[#101B14]/10 rounded-xl p-6 shadow-xs flex flex-col justify-center">
                            <span className="text-[10px] font-mono font-bold text-[#E76F51] uppercase tracking-widest mb-1">
                                Total Mortality Logged
                            </span>
                            <div className="text-3xl font-extrabold text-[#101B14] font-mono">
                                {totalMortality.toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {/* Farm-Classified Batches */}
                    {loading ? (
                        <div className="bg-[#FBF9F5] border border-[#101B14]/10 rounded-xl p-24 text-center shadow-xs flex flex-col items-center justify-center">
                            <div className="w-12 h-12 border-4 border-[#3F6B47]/20 border-t-[#3F6B47] rounded-full animate-spin mb-6"></div>
                            <span className="text-[#101B14]/60 text-sm font-bold font-mono uppercase tracking-widest">
                                Loading flock data...
                            </span>
                        </div>
                    ) : farmBatchGroups.length > 0 ? (
                        farmBatchGroups.map(({ farm, batches }) => {
                            const filteredBatches = statusFilter === 'ALL'
                                ? batches
                                : batches.filter((b) => b.status === statusFilter);

                            if (filteredBatches.length === 0) return null;

                            return (
                                <div
                                    key={farm.id}
                                    className="bg-[#FBF9F5] border border-[#101B14]/10 rounded-xl overflow-hidden shadow-xs space-y-0"
                                >
                                    <div className="bg-[#FBF9F5] px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#101B14]/10">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 rounded-lg bg-white border border-[#101B14]/10 flex items-center justify-center shadow-xs text-[#101B14]">
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-extrabold tracking-tight font-['Fraunces',serif] text-[#101B14]">{farm.name}</h4>
                                                <p className="text-xs font-mono text-[#101B14]/60 tracking-wider mt-1 flex items-center gap-2">
                                                    <span>📍 {farm.address}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-3 text-xs font-mono">
                                            <span className="px-4 py-2 rounded-lg bg-[#3F6B47]/10 text-[#3F6B47] font-bold uppercase tracking-widest border border-[#3F6B47]/20">
                                                {filteredBatches.length} Batches Here
                                            </span>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm text-[#101B14] min-w-[1000px]">
                                            <thead className="bg-[#DFD8C4] border-b-2 border-[#101B14]/15 text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/80 shadow-xs">
                                                <tr>
                                                    <th className="px-6 py-5 whitespace-nowrap">Batch Number</th>
                                                    <th className="px-6 py-5 whitespace-nowrap">Pen / House</th>
                                                    <th className="px-6 py-5 whitespace-nowrap">Bird Type</th>
                                                    <th className="px-6 py-5 whitespace-nowrap">Live Birds</th>
                                                    <th className="px-6 py-5 whitespace-nowrap">Mortality</th>
                                                    <th className="px-6 py-5 whitespace-nowrap">Status</th>
                                                    <th className="px-6 py-5 whitespace-nowrap text-right">Quick Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#101B14]/10 bg-[#FBF9F5] font-mono text-xs">
                                                {filteredBatches.map((batch) => {
                                                    const survivalRate = batch.initialCount > 0
                                                        ? (((batch.initialCount - batch.mortalityCount) / batch.initialCount) * 100).toFixed(1)
                                                        : '100';

                                                    return (
                                                        <tr
                                                            key={batch.id}
                                                            onClick={() => navigate(String(batch.id))} // <-- PUSHES URL INSTEAD OF SETTING STATE
                                                            className="group hover:bg-[#ECE6D6] hover:border-l-4 hover:border-l-[#3F6B47] transition-all cursor-pointer"
                                                        >
                                                            <td className="px-6 py-5 font-bold text-[#101B14] text-sm group-hover:text-[#3F6B47] transition-colors">
                                                                <div className="flex flex-col">
                                                                    <span>{batch.batchNumber}</span>
                                                                    <span className="text-[10px] text-[#101B14]/50 font-normal uppercase mt-0.5">
                                                                        Started: {batch.startDate}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <span className="font-bold text-[#101B14] text-sm">
                                                                    {batch.sectionName}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <span className="px-2 py-1 rounded bg-[#101B14]/5 text-[#101B14]/70 text-[10px] font-bold uppercase tracking-wider border border-[#101B14]/10">
                                                                    {batch.animalCategory}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <span className="font-extrabold text-[#3F6B47] text-base">
                                                                    {batch.currentCount.toLocaleString()}
                                                                </span>
                                                                <span className="text-[#101B14]/50 text-xs ml-1 font-sans">
                                                                    / {batch.initialCount.toLocaleString()}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <div className="flex flex-col">
                                                                    <span className="font-extrabold text-[#E76F51] text-base">
                                                                        {batch.mortalityCount.toLocaleString()}
                                                                    </span>
                                                                    <span className="text-[10px] text-[#101B14]/50 font-sans">
                                                                        {survivalRate}% survival
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <span
                                                                    className={`px-3 py-1 rounded-full font-extrabold uppercase tracking-widest text-[10px] border ${batch.status === Status.ACTIVE
                                                                            ? 'bg-[#3F6B47]/10 text-[#3F6B47] border-[#3F6B47]/20'
                                                                            : 'bg-[#101B14]/5 text-[#101B14]/60 border-[#101B14]/10'
                                                                        }`}
                                                                >
                                                                    {batch.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-5 text-right font-sans">
                                                                {batch.status === Status.ACTIVE ? (
                                                                    <div className="flex items-center justify-end space-x-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => handleOpenMortalityModal(e, batch)}
                                                                            className="px-3 py-2 rounded-lg bg-white hover:bg-[#E76F51] border border-[#E76F51]/30 text-[#E76F51] hover:text-white font-bold text-[10px] uppercase tracking-wider transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                                                                        >
                                                                            Log Mortality
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => handleOpenCloseModal(e, batch)}
                                                                            className="px-3 py-2 rounded-lg bg-white hover:bg-[#3F6B47] border border-[#101B14]/20 text-[#101B14] hover:text-white hover:border-[#3F6B47] font-bold text-[10px] uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
                                                                        >
                                                                            Harvest
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            navigate(String(batch.id)); // <-- PUSHES URL INSTEAD OF SETTING STATE
                                                                        }}
                                                                        className="px-4 py-2 rounded-lg bg-white border border-[#101B14]/15 text-[#101B14] text-xs font-bold uppercase tracking-wider group-hover:bg-[#3F6B47] group-hover:text-white group-hover:border-[#3F6B47] shadow-xs transition-all duration-300 cursor-pointer"
                                                                    >
                                                                        View Record →
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="bg-[#FBF9F5] border border-[#101B14]/10 rounded-xl p-20 text-center flex flex-col items-center justify-center shadow-xs">
                            <div className="w-20 h-20 rounded-full bg-[#ECE6D6] flex items-center justify-center text-[#101B14]/30 mb-5 shadow-inner">
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-extrabold text-[#101B14] font-['Fraunces',serif] mb-2">
                                No Batches Found
                            </h3>
                            <p className="text-sm text-[#101B14]/60 font-medium max-w-sm leading-relaxed">
                                {isProprietor ? 'You have no batches matching this filter.' : 'No batches found for your assigned farm.'}
                            </p>
                        </div>
                    )}

                    {/* Modals for List View */}
                    {selectedBatchForMortality && (
                        <div className="fixed inset-0 bg-[#101B14]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
                            <div className="bg-[#FBF9F5] border border-[#E76F51]/40 rounded-xl max-w-sm w-full shadow-2xl flex flex-col max-h-[95vh] relative overflow-hidden">
                                <div className="h-2 w-full bg-[#E76F51] relative shrink-0 shadow-sm"></div>
                                <div className="flex items-center justify-between border-b border-[#101B14]/10 p-6 bg-white shrink-0">
                                    <div>
                                        <h4 className="text-xl font-extrabold text-[#101B14] font-['Fraunces',serif] tracking-tight">Log Mortality</h4>
                                        <p className="text-[10px] font-mono font-bold text-[#E76F51] uppercase tracking-widest mt-1.5">
                                            Batch: {selectedBatchForMortality.batchNumber}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedBatchForMortality(null)}
                                        className="text-[#101B14]/40 hover:text-[#E76F51] hover:bg-[#E76F51]/10 bg-[#101B14]/5 transition-all p-2 rounded-full cursor-pointer"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="p-6 bg-white">
                                    {errorMessage && (
                                        <div className="mb-6 p-4 rounded-lg bg-[#E76F51]/10 border border-[#E76F51]/30 text-[#E76F51] text-sm font-bold flex items-start space-x-3 shadow-sm">
                                            <span className="leading-relaxed">{errorMessage}</span>
                                        </div>
                                    )}
                                    <form id="mortality-form" onSubmit={handleLogMortality} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-[#101B14]/70 mb-2">
                                                Number of Birds Lost *
                                            </label>
                                            <input
                                                type="number"
                                                required
                                                min={1}
                                                max={selectedBatchForMortality.currentCount}
                                                value={mortalityCount}
                                                onChange={(e) => setMortalityCount(Number(e.target.value))}
                                                className="w-full px-5 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-lg font-extrabold focus:outline-none focus:border-[#E76F51] focus:ring-2 focus:ring-[#E76F51]/30 transition-all shadow-sm font-mono"
                                            />
                                        </div>
                                    </form>
                                </div>
                                <div className="p-5 bg-[#F5F1E6] border-t border-[#101B14]/10 shrink-0 flex items-center justify-end gap-3 z-10">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedBatchForMortality(null)}
                                        className="px-5 py-3 rounded-lg bg-transparent hover:bg-[#101B14]/5 text-[#101B14]/60 hover:text-[#101B14] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        form="mortality-form"
                                        disabled={submitting}
                                        className="px-6 py-3 rounded-lg bg-[#E76F51] hover:bg-[#d45e41] text-white font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                                    >
                                        {submitting ? 'Recording...' : 'Record Mortality'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedBatchForClose && (
                        <div className="fixed inset-0 bg-[#101B14]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
                            <div className="bg-[#FBF9F5] border border-[#3F6B47]/40 rounded-xl max-w-md w-full shadow-2xl flex flex-col max-h-[95vh] relative overflow-hidden">
                                <div className="h-2 w-full bg-[#3F6B47] relative shrink-0 shadow-sm"></div>
                                <div className="flex items-center justify-between border-b border-[#101B14]/10 p-6 bg-white shrink-0">
                                    <div>
                                        <h4 className="text-2xl font-extrabold text-[#101B14] font-['Fraunces',serif] tracking-tight">Harvest Batch</h4>
                                        <p className="text-[10px] font-mono font-bold text-[#101B14]/50 uppercase tracking-widest mt-1.5">
                                            Closes batch & frees {selectedBatchForClose.sectionName}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedBatchForClose(null)}
                                        className="text-[#101B14]/40 hover:text-[#E76F51] hover:bg-[#E76F51]/10 bg-[#101B14]/5 transition-all p-2 rounded-full cursor-pointer"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                                    {errorMessage && (
                                        <div className="mb-6 p-4 rounded-lg bg-[#E76F51]/10 border border-[#E76F51]/30 text-[#E76F51] text-sm font-bold flex items-start space-x-3 shadow-sm">
                                            <span className="leading-relaxed">{errorMessage}</span>
                                        </div>
                                    )}
                                    <form id="harvest-form" onSubmit={handleCloseBatch} className="space-y-5">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-[#101B14]/70 mb-2">
                                                Harvest Date *
                                            </label>
                                            <input
                                                type="date"
                                                required
                                                value={closeForm.actualEndDate}
                                                onChange={(e) => setCloseForm({ ...closeForm, actualEndDate: e.target.value })}
                                                className="w-full px-4 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#3F6B47] focus:ring-2 focus:ring-[#3F6B47]/30 transition-all shadow-sm"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-[#101B14]/70 mb-2">
                                                    Birds Sold *
                                                </label>
                                                <input
                                                    type="number"
                                                    required
                                                    min={0}
                                                    value={closeForm.totalBirdsSold}
                                                    onChange={(e) => setCloseForm({ ...closeForm, totalBirdsSold: Number(e.target.value) })}
                                                    className="w-full px-4 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#3F6B47] focus:ring-2 focus:ring-[#3F6B47]/30 transition-all shadow-sm font-mono"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-[#101B14]/70 mb-2">
                                                    Total Revenue (₦) *
                                                </label>
                                                <input
                                                    type="number"
                                                    required
                                                    min={1}
                                                    value={closeForm.totalSaleRevenue}
                                                    onChange={(e) => setCloseForm({ ...closeForm, totalSaleRevenue: Number(e.target.value) })}
                                                    className="w-full px-4 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#3F6B47] focus:ring-2 focus:ring-[#3F6B47]/30 transition-all shadow-sm font-mono"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-[#101B14]/70 mb-2">
                                                Harvest Notes (Optional)
                                            </label>
                                            <textarea
                                                rows={2}
                                                value={closeForm.harvestNotes}
                                                onChange={(e) => setCloseForm({ ...closeForm, harvestNotes: e.target.value })}
                                                placeholder="e.g. Sold to processing plant"
                                                className="w-full px-4 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm focus:outline-none focus:border-[#3F6B47] focus:ring-2 focus:ring-[#3F6B47]/30 transition-all shadow-sm"
                                            />
                                        </div>
                                    </form>
                                </div>
                                <div className="p-5 bg-[#F5F1E6] border-t border-[#101B14]/10 shrink-0 flex items-center justify-end gap-3 z-10">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedBatchForClose(null)}
                                        className="px-5 py-3 rounded-lg bg-transparent hover:bg-[#101B14]/5 text-[#101B14]/60 hover:text-[#101B14] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        form="harvest-form"
                                        disabled={submitting}
                                        className="px-6 py-3 rounded-lg bg-[#101B14] hover:bg-[#3F6B47] text-white font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                                    >
                                        {submitting ? 'Finalizing...' : 'Finalize Harvest'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            } />
            
            {/* 2. The Detail Route */}
            <Route path=":batchId" element={<BatchDetailWrapper refreshList={loadBatches} />} />
        </Routes>
    );
};

// --- WRAPPER COMPONENT ---
// This reads the URL parameter and passes it to your unmodified Detail View.
const BatchDetailWrapper: React.FC<{ refreshList: () => void }> = ({ refreshList }) => {
    const { batchId } = useParams();
    const navigate = useNavigate();

    return (
        <BatchDetailView 
            batchId={Number(batchId)} 
            onBack={() => {
                refreshList(); 
                navigate('..', { relative: 'path' }); // Cleanly pops back to the list
            }} 
        />
    );
};