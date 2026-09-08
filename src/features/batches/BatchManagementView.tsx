import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
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
    const navigate = useNavigate();

    const [farmBatchGroups, setFarmBatchGroups] = useState<FarmBatchGroup[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | Status>('ACTIVE');

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

    const filteredGroups = farmBatchGroups.map(group => {
        const searchLower = searchTerm.toLowerCase();

        const matchedBatches = group.batches.filter(b => {
            const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
            const matchesSearch =
                b.batchNumber.toLowerCase().includes(searchLower) ||
                b.sectionName.toLowerCase().includes(searchLower) ||
                b.animalCategory.toLowerCase().includes(searchLower);
            return matchesStatus && matchesSearch;
        });

        return {
            farm: group.farm,
            batches: matchedBatches
        };
    }).filter(group => group.batches.length > 0);

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

    const inputClassesGreen = "w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm font-semibold focus:outline-none focus:border-farma-green focus:ring-2 focus:ring-farma-green/30 transition-shadow shadow-sm";
    const inputClassesRed = "w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-lg font-bold focus:outline-none focus:border-farma-terracotta focus:ring-2 focus:ring-farma-terracotta/30 transition-shadow shadow-sm tabular-nums";

    return (
        <Routes>
            <Route index element={
                <div className="space-y-8 font-sans max-w-7xl mx-auto pb-16">

                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-farma-forest/10 pb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-2 h-2 rounded-full bg-farma-green"></span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-farma-green">
                                    Flock Operations
                                </span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-farma-forest tracking-tight">
                                {isProprietor ? 'All Flock Batches' : 'My Assigned Flocks'}
                            </h2>
                            <p className="text-sm text-farma-forest/70 font-medium mt-2 max-w-xl leading-relaxed">
                                Active and past flock batches across your farm pens. Monitor bird counts, log mortalities, and harvest ready flocks.
                            </p>
                        </div>

                        <div className="flex flex-col xl:flex-row gap-3 w-full lg:w-auto bg-farma-cream p-3 rounded-xl border border-farma-forest/10 shadow-sm items-stretch xl:items-center">

                            <div className="flex items-center w-full xl:w-64 h-[40px] bg-white border border-farma-forest/10 rounded-lg px-3 focus-within:border-farma-gold focus-within:ring-2 focus-within:ring-farma-gold/20 transition-shadow shadow-sm">
                                <div className="text-farma-forest/40 shrink-0">
                                    <IconSearch />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search batch or pen..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full h-full pl-2.5 bg-transparent border-none focus:outline-none focus:ring-0 text-sm text-farma-forest placeholder-farma-forest/40"
                                />
                            </div>

                            <div className="flex bg-farma-sand/60 p-1 rounded-lg border border-farma-forest/10 shrink-0 h-[40px]">
                                {(['ALL', 'ACTIVE', 'COMPLETED'] as const).map((st) => (
                                    <button
                                        key={st}
                                        type="button"
                                        onClick={() => setStatusFilter(st)}
                                        className={`flex-1 px-4 rounded-md text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer h-full flex items-center justify-center ${statusFilter === st
                                                ? 'bg-white text-farma-green shadow-sm border border-farma-forest/5'
                                                : 'text-farma-forest/50 hover:text-farma-forest'
                                            }`}
                                    >
                                        {st}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-farma-forest/10">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-bold text-farma-forest/50 uppercase tracking-widest">
                                    Active Batches
                                </span>
                                <div className="w-10 h-10 rounded-lg bg-farma-forest/5 flex items-center justify-center text-farma-forest/40 shadow-sm">
                                    <IconBatch />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-farma-forest tabular-nums">
                                {activeBatches.length}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-sm border border-farma-forest/10">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-bold text-farma-green uppercase tracking-widest">
                                    Total Live Birds
                                </span>
                                <div className="w-10 h-10 rounded-lg bg-farma-green/10 flex items-center justify-center text-farma-green shadow-sm">
                                    <IconLive />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-farma-forest tabular-nums tracking-tight">{totalLivePopulation.toLocaleString()}</span>
                                <span className="text-[10px] font-bold text-farma-green uppercase bg-farma-green/10 px-2 py-0.5 rounded-md tracking-wider">Headcount</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-sm border border-farma-terracotta/30">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-bold text-farma-terracotta uppercase tracking-widest">
                                    Total Mortality
                                </span>
                                <div className="w-10 h-10 rounded-lg bg-farma-terracotta/10 text-farma-terracotta flex items-center justify-center">
                                    <IconMortality />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-farma-terracotta tabular-nums tracking-tight">{totalMortality.toLocaleString()}</span>
                                <span className="text-xs font-semibold text-farma-terracotta/80 uppercase tracking-wider">Birds Lost</span>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="bg-farma-cream border border-farma-forest/10 rounded-xl p-24 text-center shadow-sm">
                            <div className="w-10 h-10 border-4 border-farma-green/20 border-t-farma-green rounded-full animate-spin mx-auto mb-6"></div>
                            <h3 className="text-lg font-bold text-farma-forest mb-1">Loading Flock Data...</h3>
                            <p className="text-xs text-farma-forest/50 font-medium">Gathering batch telemetry from all connected facilities.</p>
                        </div>
                    ) : filteredGroups.length > 0 ? (
                        <div className="space-y-8">
                            {filteredGroups.map(({ farm, batches }) => (
                                <div
                                    key={farm.id}
                                    className="bg-white border border-farma-forest/10 rounded-xl overflow-hidden shadow-sm"
                                >
                                    <div className="bg-farma-forest px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 rounded-lg bg-white/10 border border-white/5 flex items-center justify-center text-farma-gold shadow-inner">
                                                <IconFarmHeader />
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-bold text-white">
                                                    {farm.name}
                                                </h4>
                                                <div className="flex items-center gap-2.5 mt-1">
                                                    <span className="text-[9px] font-bold text-farma-gold uppercase tracking-widest bg-farma-gold/10 px-2 py-0.5 rounded-md tabular-nums">
                                                        ID: #{farm.id}
                                                    </span>
                                                    <span className="text-white/20">•</span>
                                                    <span className="text-xs font-medium text-white/60">
                                                        {farm.address}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center">
                                            <span className="px-3 py-1.5 rounded-md bg-white/10 text-white font-bold text-[9px] uppercase tracking-widest border border-white/10 tabular-nums">
                                                {batches.length} Batches Found
                                            </span>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto bg-white">
                                        <table className="w-full text-left text-sm text-farma-forest min-w-[1000px]">
                                            <thead className="bg-farma-sand/50 border-b border-farma-forest/10 text-[10px] font-bold uppercase tracking-widest text-farma-forest/60">
                                                <tr>
                                                    <th className="px-6 py-4 whitespace-nowrap">Batch / Placed</th>
                                                    <th className="px-6 py-4 whitespace-nowrap">Pen / House</th>
                                                    <th className="px-6 py-4 whitespace-nowrap">Bird Type</th>
                                                    <th className="px-6 py-4 whitespace-nowrap">Live Birds</th>
                                                    <th className="px-6 py-4 whitespace-nowrap">Mortality</th>
                                                    <th className="px-6 py-4 whitespace-nowrap">Status</th>
                                                    <th className="px-6 py-4 whitespace-nowrap text-right">Quick Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-farma-forest/5">
                                                {batches.map((batch) => {
                                                    const survivalRate = batch.initialCount > 0
                                                        ? (((batch.initialCount - batch.mortalityCount) / batch.initialCount) * 100).toFixed(1)
                                                        : '100';

                                                    const isActive = batch.status === Status.ACTIVE;

                                                    return (
                                                        <tr
                                                            key={batch.id}
                                                            onClick={() => navigate(String(batch.id))}
                                                            className={`group transition-colors cursor-pointer ${isActive ? 'hover:bg-farma-cream' : 'bg-farma-forest/5 opacity-80 hover:bg-farma-forest/10 grayscale-[30%]'}`}
                                                        >
                                                            <td className="px-6 py-4 font-bold text-farma-forest text-sm group-hover:text-farma-green transition-colors">
                                                                <div className="flex flex-col">
                                                                    <span className="tabular-nums text-base">{batch.batchNumber}</span>
                                                                    <span className="text-[10px] text-farma-forest/50 font-bold uppercase mt-1 tracking-widest tabular-nums">
                                                                        Placed: {batch.startDate}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="font-semibold text-farma-forest text-sm">
                                                                    {batch.sectionName}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="px-2.5 py-1 rounded-md bg-farma-forest/5 text-farma-forest/70 text-[9px] font-bold uppercase tracking-widest border border-farma-forest/10">
                                                                    {batch.animalCategory}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`font-bold text-base tabular-nums ${isActive ? 'text-farma-green' : 'text-farma-forest'}`}>
                                                                    {batch.currentCount.toLocaleString()}
                                                                </span>
                                                                <span className="text-farma-forest/50 text-xs ml-1 font-semibold tabular-nums">
                                                                    / {batch.initialCount.toLocaleString()}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-farma-terracotta text-base tabular-nums">
                                                                        {batch.mortalityCount.toLocaleString()}
                                                                    </span>
                                                                    <span className="text-[10px] text-farma-forest/50 font-bold uppercase tracking-wider mt-0.5 tabular-nums">
                                                                        {survivalRate}% Survival
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span
                                                                    className={`px-2.5 py-1 rounded-md font-bold uppercase tracking-widest text-[9px] border ${isActive
                                                                        ? 'bg-farma-green/10 text-farma-green border-farma-green/20'
                                                                        : 'bg-white text-farma-forest/50 border-farma-forest/10 shadow-sm'
                                                                        }`}
                                                                >
                                                                    {batch.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                {isActive ? (
                                                                    <div className="flex items-center justify-end space-x-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => handleOpenMortalityModal(e, batch)}
                                                                            className="px-3 py-2 rounded-lg bg-white hover:bg-farma-terracotta border border-farma-terracotta/30 text-farma-terracotta hover:text-white font-bold text-[10px] uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                                                                        >
                                                                            Log Mortality
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => handleOpenCloseModal(e, batch)}
                                                                            className="px-3 py-2 rounded-lg bg-farma-green border border-farma-green text-white hover:bg-farma-green-light font-bold text-[10px] uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                                                                        >
                                                                            Harvest
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            navigate(String(batch.id));
                                                                        }}
                                                                        className="px-4 py-2 rounded-lg bg-white border border-farma-forest/10 text-farma-forest/80 text-[10px] font-bold uppercase tracking-widest hover:bg-farma-forest/5 shadow-sm transition-colors duration-300 cursor-pointer"
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
                            ))}
                        </div>
                    ) : (
                        <div className="bg-farma-cream border border-farma-forest/10 rounded-xl p-20 text-center flex flex-col items-center justify-center shadow-sm">
                            <div className="w-16 h-16 rounded-full bg-farma-sand flex items-center justify-center text-farma-forest/30 mb-6 shadow-inner border border-farma-forest/5">
                                <IconEmpty />
                            </div>
                            <h3 className="text-xl font-bold text-farma-forest mb-2">
                                {searchTerm ? 'No Results Found' : 'No Batches Found'}
                            </h3>
                            <p className="text-sm text-farma-forest/60 font-medium max-w-sm leading-relaxed mb-6">
                                {searchTerm
                                    ? `We couldn't find any batches matching "${searchTerm}".`
                                    : isProprietor
                                        ? 'You have no batches matching this filter.'
                                        : 'No batches found for your assigned farm.'}
                            </p>

                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}
                                    className="px-5 py-2.5 bg-white border border-farma-forest/10 rounded-lg text-farma-green hover:bg-farma-forest/5 font-bold text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                                >
                                    Clear Search
                                </button>
                            )}
                        </div>
                    )}

                    {selectedBatchForMortality && (
                        <div className="fixed inset-0 bg-farma-forest/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
                            <div className="bg-farma-cream border border-farma-terracotta/40 rounded-xl max-w-sm w-full shadow-2xl flex flex-col relative overflow-hidden">

                                <div className="h-1.5 w-full bg-farma-terracotta relative shrink-0 shadow-sm"></div>

                                <div className="flex items-start justify-between border-b border-farma-forest/10 p-6 bg-white shrink-0">
                                    <div>
                                        <h4 className="text-xl font-bold text-farma-forest tracking-tight">Log Mortality</h4>
                                        <div className="mt-1.5 inline-flex items-center space-x-2 bg-farma-terracotta/10 px-2.5 py-1 rounded-md border border-farma-terracotta/20">
                                            <span className="text-[10px] font-bold text-farma-terracotta uppercase tracking-widest tabular-nums">
                                                Batch: {selectedBatchForMortality.batchNumber}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedBatchForMortality(null)}
                                        className="text-farma-forest/40 hover:text-farma-terracotta hover:bg-farma-terracotta/10 bg-farma-forest/5 transition-colors p-2 rounded-lg cursor-pointer"
                                    >
                                        <IconClose />
                                    </button>
                                </div>

                                <div className="p-6 bg-white">
                                    {errorMessage && (
                                        <div className="mb-6 p-4 rounded-lg bg-farma-terracotta/10 border border-farma-terracotta/20 text-farma-terracotta text-xs font-bold flex items-center space-x-3 shadow-sm">
                                            <IconWarning />
                                            <span>{errorMessage}</span>
                                        </div>
                                    )}
                                    <form id="mortality-form" onSubmit={handleLogMortality} className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/60 mb-2 pl-1">
                                                Number of Birds Lost *
                                            </label>
                                            <input
                                                type="number"
                                                required
                                                min={1}
                                                max={selectedBatchForMortality.currentCount}
                                                value={mortalityCount}
                                                onChange={(e) => setMortalityCount(Number(e.target.value))}
                                                className={inputClassesRed}
                                            />
                                        </div>
                                    </form>
                                </div>
                                <div className="p-5 bg-farma-sand/50 border-t border-farma-forest/10 shrink-0 flex items-center justify-end gap-3 z-10">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedBatchForMortality(null)}
                                        className="px-5 py-3 rounded-lg bg-transparent hover:bg-farma-forest/5 text-farma-forest/70 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        form="mortality-form"
                                        disabled={submitting}
                                        className="px-6 py-3 rounded-lg bg-farma-terracotta hover:bg-[#c6583d] text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
                                    >
                                        {submitting ? 'Recording...' : 'Record Mortality'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedBatchForClose && (
                        <div className="fixed inset-0 bg-farma-forest/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
                            <div className="bg-farma-cream border border-farma-green/40 rounded-xl max-w-lg w-full shadow-2xl flex flex-col max-h-[95vh] relative overflow-hidden">

                                <div className="h-1.5 w-full bg-farma-green relative shrink-0 shadow-sm"></div>

                                <div className="flex items-start justify-between border-b border-farma-forest/10 p-6 bg-white shrink-0">
                                    <div>
                                        <h4 className="text-xl font-bold text-farma-forest tracking-tight">Harvest Batch</h4>
                                        <p className="text-[10px] font-bold text-farma-forest/50 uppercase tracking-widest mt-1.5">
                                            Finalizes batch & frees {selectedBatchForClose.sectionName}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedBatchForClose(null)}
                                        className="text-farma-forest/40 hover:text-farma-terracotta hover:bg-farma-terracotta/10 bg-farma-forest/5 transition-colors p-2 rounded-lg cursor-pointer"
                                    >
                                        <IconClose />
                                    </button>
                                </div>
                                <div className="p-6 sm:p-8 overflow-y-auto flex-1 custom-scrollbar space-y-6">
                                    {errorMessage && (
                                        <div className="p-4 rounded-lg bg-farma-terracotta/10 border border-farma-terracotta/20 text-farma-terracotta text-xs font-bold flex items-start space-x-3 shadow-sm">
                                            <IconWarning />
                                            <span>{errorMessage}</span>
                                        </div>
                                    )}
                                    <form id="harvest-form" onSubmit={handleCloseBatch} className="space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/60 mb-1.5 pl-1">
                                                Harvest Date *
                                            </label>
                                            <input
                                                type="date"
                                                required
                                                value={closeForm.actualEndDate}
                                                onChange={(e) => setCloseForm({ ...closeForm, actualEndDate: e.target.value })}
                                                className={`${inputClassesGreen} tabular-nums cursor-pointer`}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/60 mb-1.5 pl-1">
                                                    Birds Sold *
                                                </label>
                                                <input
                                                    type="number"
                                                    required
                                                    min={0}
                                                    value={closeForm.totalBirdsSold}
                                                    onChange={(e) => setCloseForm({ ...closeForm, totalBirdsSold: Number(e.target.value) })}
                                                    className={`${inputClassesGreen} tabular-nums`}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/60 mb-1.5 pl-1">
                                                    Total Revenue (₦) *
                                                </label>
                                                <input
                                                    type="number"
                                                    required
                                                    min={1}
                                                    value={closeForm.totalSaleRevenue}
                                                    onChange={(e) => setCloseForm({ ...closeForm, totalSaleRevenue: Number(e.target.value) })}
                                                    className={`${inputClassesGreen} tabular-nums`}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/60 mb-1.5 pl-1">
                                                Harvest Notes (Optional)
                                            </label>
                                            <textarea
                                                rows={2}
                                                value={closeForm.harvestNotes}
                                                onChange={(e) => setCloseForm({ ...closeForm, harvestNotes: e.target.value })}
                                                placeholder="e.g. Sold to processing plant"
                                                className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm focus:outline-none focus:ring-2 focus:border-farma-green focus:ring-farma-green/30 transition-shadow shadow-sm resize-none"
                                            />
                                        </div>
                                    </form>
                                </div>
                                <div className="p-5 bg-farma-sand/50 border-t border-farma-forest/10 shrink-0 flex items-center justify-end gap-3 z-10">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedBatchForClose(null)}
                                        className="px-5 py-3 rounded-lg bg-transparent hover:bg-farma-forest/5 text-farma-forest/70 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        form="harvest-form"
                                        disabled={submitting}
                                        className="px-6 py-3 rounded-lg bg-farma-forest hover:bg-farma-green text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
                                    >
                                        {submitting ? 'Finalizing...' : 'Finalize Harvest'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            } />

            <Route path=":batchId/*" element={<BatchDetailWrapper refreshList={loadBatches} />} />
        </Routes>
    );
};

const BatchDetailWrapper: React.FC<{ refreshList: () => void }> = ({ refreshList }) => {
    const { batchId } = useParams();
    const navigate = useNavigate();

    return (
        <BatchDetailView
            batchId={Number(batchId)}
            onBack={() => {
                refreshList();
                navigate('..', { relative: 'path' });
            }}
        />
    );
};

// ==========================================
// Reusable SVG Components
// ==========================================

const IconSearch = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const IconBatch = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
);

const IconLive = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

const IconMortality = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </svg>
);

const IconFarmHeader = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
);

const IconEmpty = () => (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
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