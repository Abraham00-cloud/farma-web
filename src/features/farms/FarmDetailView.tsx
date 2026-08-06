import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { infrastructureService } from '../../services/infrastructureService';
import { batchService } from '../../services/batchService';
import { SectionDetailView } from '../sections/SectionDetailView';
import { BatchDetailView } from '../batches/BatchDetailView';
import {
    AnimalCategory,
    ProductionType,
    type FarmResponseDto,
    type SectionResponseDto,
    type SectionRequestDto,
} from '../../types/infrastructure';
import {
    Breed,
    type BatchRequestDto,
    type BatchResponseDto,
} from '../../types/batch';

interface FarmDetailViewProps {
    farm: FarmResponseDto;
    onBack: () => void;
}

const getDefaultBatchDates = () => {
    const now = new Date();
    const startDate = now.toISOString().split('T')[0];
    const future = new Date(now.getTime() + 42 * 24 * 60 * 60 * 1000);
    const expectedEndDate = future.toISOString().split('T')[0];
    return { startDate, expectedEndDate };
};

export const FarmDetailView: React.FC<FarmDetailViewProps> = ({ farm, onBack }) => {
    const [sections, setSections] = useState<SectionResponseDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);

    // Deep Navigation States
    const [selectedSection, setSelectedSection] = useState<SectionResponseDto | null>(null);
    const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);

    // Modals
    const [showSectionModal, setShowSectionModal] = useState<boolean>(false);
    const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
    const [selectedSectionForBatch, setSelectedSectionForBatch] = useState<SectionResponseDto | null>(null);

    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [sectionForm, setSectionForm] = useState<Omit<SectionRequestDto, 'farmId'>>({
        name: '',
        animalCategory: AnimalCategory.POULTRY,
        productionType: ProductionType.Meat,
        capacity: 1000,
    });

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

    useEffect(() => {
        let isMounted = true;

        const fetchSections = async () => {
            try {
                const data = await infrastructureService.getSectionsByFarm(farm.id);
                if (isMounted) {
                    setSections(data);
                }
            } catch {
                // Fallback state
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchSections();

        return () => {
            isMounted = false;
        };
    }, [farm.id]);

    const refreshSections = async () => {
        try {
            const data = await infrastructureService.getSectionsByFarm(farm.id);
            setSections(data);
        } catch {
            // Ignore background refresh errors
        }
    };

    // If a batch is selected, open the Deep Batch Dossier
    if (selectedBatchId !== null) {
        return (
            <BatchDetailView
                batchId={selectedBatchId}
                onBack={() => setSelectedBatchId(null)}
            />
        );
    }

    // If a section is selected, open the Section Detail Workspace
    if (selectedSection !== null) {
        return (
            <SectionDetailView
                section={selectedSection}
                onBack={() => setSelectedSection(null)}
                onSelectBatch={(batch: BatchResponseDto) => setSelectedBatchId(batch.id)}
                onStockSection={() => {
                    setSelectedSectionForBatch(selectedSection);
                    setShowBatchModal(true);
                }}
            />
        );
    }

    const handleCreateSection = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrorMessage(null);

        const payload: SectionRequestDto = {
            name: sectionForm.name.trim(),
            farmId: Number(farm.id),
            animalCategory: sectionForm.animalCategory,
            productionType: sectionForm.productionType,
            capacity: Number(sectionForm.capacity),
        };

        try {
            await infrastructureService.createSection(payload);
            setShowSectionModal(false);
            setSectionForm({
                name: '',
                animalCategory: AnimalCategory.POULTRY,
                productionType: ProductionType.Meat,
                capacity: 1000,
            });
            await refreshSections();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const backendError = err.response?.data?.message || err.response?.data;
                setErrorMessage(
                    typeof backendError === 'string'
                        ? backendError
                        : JSON.stringify(backendError)
                );
            } else {
                setErrorMessage('An unexpected error occurred while creating the section.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenBatchModal = (e: React.MouseEvent, sec: SectionResponseDto) => {
        e.stopPropagation(); // Prevents opening SectionDetailView when clicking '+ Stock'
        setSelectedSectionForBatch(sec);
        setBatchForm((prev) => ({
            ...prev,
            initialCount: sec.capacity,
        }));
        setShowBatchModal(true);
    };

    const handleCreateBatch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSectionForBatch) return;

        setSubmitting(true);
        setErrorMessage(null);

        const generatedBatchNumber = `${selectedSectionForBatch.name.toUpperCase().replace(/\s+/g, '')}-${Date.now()}`;

        const payload: BatchRequestDto = {
            batchNumber: generatedBatchNumber,
            sectionId: Number(selectedSectionForBatch.id),
            initialCount: Number(batchForm.initialCount),
            startDate: batchForm.startDate,
            expectedEndDate: batchForm.expectedEndDate,
            breed: batchForm.breed,
        };

        try {
            await batchService.createBatch(payload);
            setShowBatchModal(false);
            setSelectedSectionForBatch(null);
            await refreshSections();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const backendError = err.response?.data?.message || err.response?.data;
                setErrorMessage(
                    typeof backendError === 'string'
                        ? backendError
                        : JSON.stringify(backendError)
                );
            } else {
                setErrorMessage('An unexpected error occurred while stocking the flock batch.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Top Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center space-x-1 cursor-pointer"
                >
                    <span>← Back to All Facilities</span>
                </button>

                <button
                    type="button"
                    onClick={() => setShowSectionModal(true)}
                    className="px-4 py-2 rounded-xl bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold text-xs uppercase tracking-wider shadow-xs transition cursor-pointer"
                >
                    + Add Pen / House
                </button>
            </div>

            {/* Farm Banner */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center space-x-3">
                            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                                {farm.name}
                            </h2>
                            <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${farm.isActive
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                                    }`}
                            >
                                {farm.isActive ? 'ACTIVE FACILITY' : 'INACTIVE'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-1">
                            📍 {farm.address} • GPS: [{farm.latitude.toFixed(4)}, {farm.longitude.toFixed(4)}]
                        </p>
                    </div>

                    <div className="flex items-center space-x-4 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-mono">
                        <div>
                            <span className="text-slate-400 block text-[10px] uppercase">Facility ID</span>
                            <span className="font-bold text-slate-900">#{farm.id}</span>
                        </div>
                        <div className="h-6 w-px bg-slate-200" />
                        <div>
                            <span className="text-slate-400 block text-[10px] uppercase">Manager ID</span>
                            <span className="font-bold text-emerald-700">#{farm.managerId}</span>
                        </div>
                    </div>
                </div>

                {/* Operational Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                            Total Containment Units
                        </span>
                        <div className="text-xl font-extrabold text-slate-900 mt-1">
                            {sections.length} Pens
                        </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                            Total Capacity
                        </span>
                        <div className="text-xl font-extrabold text-slate-900 mt-1">
                            {sections.reduce((acc, curr) => acc + curr.capacity, 0).toLocaleString()} Animals
                        </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                            Available Units
                        </span>
                        <div className="text-xl font-extrabold text-emerald-700 mt-1">
                            {sections.length} Unlocked
                        </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                            Biosecurity Status
                        </span>
                        <div className="text-xl font-extrabold text-emerald-600 mt-1">
                            Level 1 (Cleared)
                        </div>
                    </div>
                </div>
            </div>

            {/* Pens & Houses Table */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">
                    Containment Sections (Pens & Houses)
                </h3>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs font-sans text-slate-700">
                        <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="px-5 py-3.5">ID</th>
                                <th className="px-5 py-3.5">Section Name</th>
                                <th className="px-5 py-3.5">Category</th>
                                <th className="px-5 py-3.5">Production Focus</th>
                                <th className="px-5 py-3.5">Capacity</th>
                                <th className="px-5 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                                        Loading sections...
                                    </td>
                                </tr>
                            ) : sections.length > 0 ? (
                                sections.map((sec) => (
                                    <tr
                                        key={sec.id}
                                        onClick={() => setSelectedSection(sec)}
                                        className="hover:bg-slate-50/80 transition cursor-pointer group"
                                    >
                                        <td className="px-5 py-4 font-bold text-slate-900">#{sec.id}</td>
                                        <td className="px-5 py-4 font-bold text-slate-900 group-hover:text-[#C2410C]">
                                            {sec.name} →
                                        </td>
                                        <td className="px-5 py-4">{sec.animalCategory}</td>
                                        <td className="px-5 py-4">{sec.productionType}</td>
                                        <td className="px-5 py-4 font-bold">{sec.capacity.toLocaleString()}</td>
                                        <td className="px-5 py-4 text-right">
                                            <button
                                                type="button"
                                                onClick={(e) => handleOpenBatchModal(e, sec)}
                                                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] uppercase tracking-wider transition cursor-pointer"
                                            >
                                                + Stock Flock Batch
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                                        No pens or containment sections registered under this farm yet. Click <span className="font-bold text-slate-700">"+ Add Pen / House"</span> to add one.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Stock Flock Batch Modal */}
            {showBatchModal && selectedSectionForBatch && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h4 className="text-base font-bold text-slate-900">
                                    Stock Flock Batch in {selectedSectionForBatch.name}
                                </h4>
                                <p className="text-xs text-slate-500">
                                    Section Max Capacity: {selectedSectionForBatch.capacity.toLocaleString()}
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
                                    Initial Animal Count * (Max: {selectedSectionForBatch.capacity})
                                </label>
                                <input
                                    type="number"
                                    required
                                    min={1}
                                    max={selectedSectionForBatch.capacity}
                                    value={batchForm.initialCount}
                                    onChange={(e) =>
                                        setBatchForm({ ...batchForm, initialCount: Number(e.target.value) })
                                    }
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#C2410C] focus:bg-white"
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

            {/* Modal to Create Section */}
            {showSectionModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h4 className="text-base font-bold text-slate-900">Add Containment Section</h4>
                                <p className="text-xs text-slate-500">Register a pen or house under {farm.name}.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowSectionModal(false)}
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

                        <form onSubmit={handleCreateSection} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Section Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={sectionForm.name}
                                    onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                                    placeholder="e.g. Broiler House 1"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#C2410C] focus:bg-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Animal Category *
                                    </label>
                                    <select
                                        value={sectionForm.animalCategory}
                                        onChange={(e) =>
                                            setSectionForm({
                                                ...sectionForm,
                                                animalCategory: e.target.value as AnimalCategory,
                                            })
                                        }
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#C2410C] focus:bg-white"
                                    >
                                        {Object.values(AnimalCategory).map((cat) => (
                                            <option key={cat} value={cat}>
                                                {cat}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Production Type *
                                    </label>
                                    <select
                                        value={sectionForm.productionType}
                                        onChange={(e) =>
                                            setSectionForm({
                                                ...sectionForm,
                                                productionType: e.target.value as ProductionType,
                                            })
                                        }
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#C2410C] focus:bg-white"
                                    >
                                        {Object.values(ProductionType).map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Holding Capacity *
                                </label>
                                <input
                                    type="number"
                                    required
                                    min={1}
                                    value={sectionForm.capacity}
                                    onChange={(e) =>
                                        setSectionForm({ ...sectionForm, capacity: Number(e.target.value) })
                                    }
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#C2410C] focus:bg-white"
                                />
                            </div>

                            <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowSectionModal(false)}
                                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2.5 rounded-xl bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-bold uppercase tracking-wider shadow-xs transition cursor-pointer disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : 'Save Section'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};