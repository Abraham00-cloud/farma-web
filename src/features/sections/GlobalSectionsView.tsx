import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { infrastructureService } from '../../services/infrastructureService';
import { batchService } from '../../services/batchService';
import { SectionDetailView } from './SectionDetailView';
import { BatchDetailView } from '../batches/BatchDetailView';
import type { FarmResponseDto, SectionResponseDto } from '../../types/infrastructure';
import { Breed, type BatchRequestDto, type BatchResponseDto } from '../../types/batch';

interface GlobalSectionsViewProps {
    organisationId: number;
    userRole?: string;
    currentUserId?: number;
}

interface FarmGroup {
    farm: FarmResponseDto;
    sections: SectionResponseDto[];
}

const getDefaultBatchDates = () => {
    const now = new Date();
    const startDate = now.toISOString().split('T')[0];
    const future = new Date(now.getTime() + 42 * 24 * 60 * 60 * 1000);
    const expectedEndDate = future.toISOString().split('T')[0];
    return { startDate, expectedEndDate };
};

export const GlobalSectionsView: React.FC<GlobalSectionsViewProps> = ({ 
    organisationId, 
    userRole = 'PROPRIETOR', 
    currentUserId 
}) => {
    const isProprietor = userRole?.toUpperCase() === 'PROPRIETOR' || userRole?.toUpperCase() === 'ADMIN';

    const [farmGroups, setFarmGroups] = useState<FarmGroup[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

    // Deep Navigation States
    const [selectedSection, setSelectedSection] = useState<SectionResponseDto | null>(null);
    const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);

    // Modal States
    const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
    const [sectionToStock, setSectionToStock] = useState<SectionResponseDto | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [batchForm, setBatchForm] = useState<{
        initialCount: number;
        startDate: string;
        expectedEndDate: string;
        breed: Breed;
    }>(() => {
        const dates = getDefaultBatchDates();
        return {
            initialCount: 500,
            startDate: dates.startDate,
            expectedEndDate: dates.expectedEndDate,
            breed: Breed.COBB_500,
        };
    });

    const loadGlobalData = async () => {
        try {
            let farmList = await infrastructureService.getFarmsByOrganisation(organisationId);
            
            // 🔒 ROLE SCOPING: If it's a Manager, only allow them to see their assigned farm(s)
            if (!isProprietor && currentUserId) {
                farmList = farmList.filter((farm) => farm.managerId === currentUserId);
            }

            const groups = await Promise.all(
                farmList.map(async (farm) => {
                    try {
                        const farmSections = await infrastructureService.getSectionsByFarm(farm.id);
                        return { farm, sections: farmSections };
                    } catch {
                        return { farm, sections: [] };
                    }
                })
            );

            setFarmGroups(groups);
        } catch {
            // Fallback
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            try {
                let farmList = await infrastructureService.getFarmsByOrganisation(organisationId);
                
                // 🔒 ROLE SCOPING LOGIC
                if (!isProprietor && currentUserId) {
                    farmList = farmList.filter((farm) => farm.managerId === currentUserId);
                }

                const groups = await Promise.all(
                    farmList.map(async (farm) => {
                        try {
                            const farmSections = await infrastructureService.getSectionsByFarm(farm.id);
                            return { farm, sections: farmSections };
                        } catch {
                            return { farm, sections: [] };
                        }
                    })
                );

                if (isMounted) {
                    setFarmGroups(groups);
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

    const handleOpenStockModal = (sec: SectionResponseDto) => {
        setSectionToStock(sec);
        setBatchForm((prev) => ({
            ...prev,
            initialCount: sec.capacity,
        }));
        setShowBatchModal(true);
    };

    const handleCreateBatch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sectionToStock) return;

        setSubmitting(true);
        setErrorMessage(null);

        const generatedBatchNumber = `${sectionToStock.name.toUpperCase().replace(/\s+/g, '')}-${Date.now()}`;

        const payload: BatchRequestDto = {
            batchNumber: generatedBatchNumber,
            sectionId: Number(sectionToStock.id),
            initialCount: Number(batchForm.initialCount),
            startDate: batchForm.startDate,
            expectedEndDate: batchForm.expectedEndDate,
            breed: batchForm.breed,
        };

        try {
            await batchService.createBatch(payload);
            setShowBatchModal(false);
            setSectionToStock(null);
            await loadGlobalData();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const backendError = err.response?.data?.message || err.response?.data;
                setErrorMessage(
                    typeof backendError === 'string'
                        ? backendError
                        : JSON.stringify(backendError)
                );
            } else {
                setErrorMessage('Failed to stock flock batch.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Deep Navigation Overrides
    if (selectedBatchId !== null) {
        return (
            <BatchDetailView
                batchId={selectedBatchId}
                onBack={() => setSelectedBatchId(null)}
            />
        );
    }

    if (selectedSection !== null) {
        return (
            <>
                <SectionDetailView
                    section={selectedSection}
                    onBack={() => {
                        setSelectedSection(null);
                        loadGlobalData();
                    }}
                    onSelectBatch={(batch: BatchResponseDto) => setSelectedBatchId(batch.id)}
                    onStockSection={() => handleOpenStockModal(selectedSection)}
                />

                {showBatchModal && sectionToStock && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                        <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div>
                                    <h4 className="text-base font-bold text-slate-900">
                                        Stock Flock Batch in {sectionToStock.name}
                                    </h4>
                                    <p className="text-xs text-slate-500">
                                        Section Capacity: {sectionToStock.capacity.toLocaleString()} Heads
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowBatchModal(false)}
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

                            <form onSubmit={handleCreateBatch} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Biological Breed / Strain *
                                    </label>
                                    <select
                                        value={batchForm.breed}
                                        onChange={(e) =>
                                            setBatchForm({ ...batchForm, breed: e.target.value as Breed })
                                        }
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#C2410C] focus:bg-white"
                                    >
                                        {Object.values(Breed).map((b) => (
                                            <option key={b} value={b}>
                                                {b.replace('_', ' ')}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Initial Animal Count * (Max: {sectionToStock.capacity})
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min={1}
                                        max={sectionToStock.capacity}
                                        value={batchForm.initialCount}
                                        onChange={(e) =>
                                            setBatchForm({ ...batchForm, initialCount: Number(e.target.value) })
                                        }
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#C2410C] focus:bg-white font-mono"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Placement Date *
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={batchForm.startDate}
                                            onChange={(e) =>
                                                setBatchForm({ ...batchForm, startDate: e.target.value })
                                            }
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#C2410C] focus:bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Expected Harvest Date *
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={batchForm.expectedEndDate}
                                            onChange={(e) =>
                                                setBatchForm({ ...batchForm, expectedEndDate: e.target.value })
                                            }
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#C2410C] focus:bg-white"
                                        />
                                    </div>
                                </div>

                                <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowBatchModal(false)}
                                        className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider shadow-xs transition cursor-pointer disabled:opacity-50"
                                    >
                                        {submitting ? 'Stocking...' : 'Initiate Flock Batch'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </>
        );
    }

    const totalUnits = farmGroups.reduce((acc, g) => acc + g.sections.length, 0);
    const totalCapacity = farmGroups.reduce(
        (acc, g) => acc + g.sections.reduce((sAcc, sec) => sAcc + sec.capacity, 0),
        0
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        {isProprietor ? 'Enterprise Containment Fleet' : 'My Site Containment Pens'}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                        Sections classified physically by parent farm facility and animal specialization.
                    </p>
                </div>

                {/* Filter Pills */}
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                    {['ALL', 'POULTRY', 'LIVESTOCK'].map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${selectedCategory === cat
                                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                                    : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Aggregate Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        Monitored Facilities
                    </span>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1">
                        {farmGroups.length} {farmGroups.length === 1 ? 'Farm Site' : 'Farm Sites'}
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        Total Containment Pens
                    </span>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1">
                        {totalUnits} Pens / Houses
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        Combined Holding Capacity
                    </span>
                    <div className="text-2xl font-extrabold text-[#C2410C] mt-1">
                        {totalCapacity.toLocaleString()} Animals
                    </div>
                </div>
            </div>

            {/* Farm-Classified Sections */}
            {loading ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs font-mono text-slate-400">
                    {isProprietor ? 'Loading enterprise containment fleet...' : 'Loading site containment pens...'}
                </div>
            ) : farmGroups.length > 0 ? (
                farmGroups.map(({ farm, sections }) => {
                    const filteredSections = selectedCategory === 'ALL'
                        ? sections
                        : sections.filter((s) => s.animalCategory === selectedCategory);

                    return (
                        <div
                            key={farm.id}
                            className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-0"
                        >
                            {/* Farm Facility Group Header */}
                            <div className="bg-slate-900 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-lg bg-[#C2410C] flex items-center justify-center font-bold text-sm">
                                        🏢
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
                                        {sections.length} Containment Units
                                    </span>
                                </div>
                            </div>

                            {/* Nested Pens Table for this specific Farm */}
                            <table className="w-full text-left text-xs font-sans text-slate-700">
                                <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3">Pen Code</th>
                                        <th className="px-6 py-3">Section Name</th>
                                        <th className="px-6 py-3">Category</th>
                                        <th className="px-6 py-3">Production Focus</th>
                                        <th className="px-6 py-3">Capacity</th>
                                        <th className="px-6 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-mono">
                                    {filteredSections.length > 0 ? (
                                        filteredSections.map((sec) => (
                                            <tr
                                                key={sec.id}
                                                onClick={() => setSelectedSection(sec)}
                                                className="hover:bg-slate-50/80 transition cursor-pointer group"
                                            >
                                                <td className="px-6 py-4 font-bold text-slate-400">#{sec.id}</td>
                                                <td className="px-6 py-4 font-bold text-slate-900 group-hover:text-[#C2410C]">
                                                    {sec.name} →
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                                                        {sec.animalCategory}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">{sec.productionType}</td>
                                                <td className="px-6 py-4 font-bold text-slate-900">
                                                    {sec.capacity.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-xs font-bold text-emerald-700 hover:underline">
                                                        Open Workspace →
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                                                No sections registered under {farm.name} matching this filter.
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
                    {isProprietor ? 'No farm facilities or containment sections registered.' : 'No containment sections found for your assigned farm.'}
                </div>
            )}
        </div>
    );
};