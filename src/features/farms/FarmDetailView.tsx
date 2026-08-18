import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { infrastructureService } from '../../services/infrastructureService';
import { batchService } from '../../services/batchService';
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
    const navigate = useNavigate();
    const { pathname } = useLocation(); 
    
    // Dynamically get if we are in '/proprietor' or '/manager' so routing works for both
    const portalNamespace = pathname.split('/')[1];

    const [sections, setSections] = useState<SectionResponseDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);

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
                setErrorMessage('An unexpected error occurred while creating the pen.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenBatchModal = (e: React.MouseEvent, sec: SectionResponseDto) => {
        e.stopPropagation(); // Prevents opening the deep link view when clicking '+ Stock'
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
                setErrorMessage('An unexpected error occurred while stocking the birds.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 lg:space-y-8 font-sans max-w-7xl mx-auto pb-12">
            
            {/* Top Navigation & Action Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#101B14]/10 pb-5">
                <button
                    type="button"
                    onClick={onBack}
                    className="text-xs font-bold text-[#101B14]/70 hover:text-[#101B14] flex items-center space-x-2 cursor-pointer transition-colors w-fit"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Back to All Farms</span>
                </button>

                <button
                    type="button"
                    onClick={() => setShowSectionModal(true)}
                    className="px-6 py-3 rounded-lg bg-[#D9A63E] hover:bg-[#c99834] text-[#101B14] font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                    <span>+ Add New Pen / House</span>
                </button>
            </div>

            {/* Farm Banner Card */}
            <div className="bg-[#FBF9F5] border border-[#101B14]/10 rounded-xl p-6 sm:p-8 shadow-xs relative overflow-hidden space-y-6">
                
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 mt-1">
                    <div>
                        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101B14] tracking-tight font-['Fraunces',serif]">
                                {farm.name}
                            </h2>
                            <span
                                className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${farm.isActive
                                        ? 'bg-[#3F6B47]/10 text-[#3F6B47] border border-[#3F6B47]/25'
                                        : 'bg-[#E76F51]/10 text-[#E76F51] border border-[#E76F51]/25'
                                    }`}
                            >
                                {farm.isActive ? 'Farm Active' : 'Farm Inactive'}
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#101B14]/70 font-mono mt-3 flex items-center gap-2">
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{farm.address}</span>
                            <span className="text-[#101B14]/30 mx-2">•</span>
                            <span className="bg-white px-2 py-1 rounded border border-[#101B14]/10">
                                GPS: {farm.latitude.toFixed(4)}, {farm.longitude.toFixed(4)}
                            </span>
                        </p>
                    </div>

                    <div className="flex items-center space-x-4 bg-white p-4 rounded-lg border border-[#101B14]/10 text-xs font-mono shadow-xs">
                        <div>
                            <span className="text-[#101B14]/50 block text-[9px] uppercase tracking-wider font-bold mb-1">Farm ID</span>
                            <span className="font-extrabold text-[#101B14] text-sm">#{farm.id}</span>
                        </div>
                        <div className="h-8 w-px bg-[#101B14]/10" />
                        <div>
                            <span className="text-[#101B14]/50 block text-[9px] uppercase tracking-wider font-bold mb-1">Manager ID</span>
                            <span className="font-extrabold text-[#3F6B47] text-sm">#{farm.managerId}</span>
                        </div>
                    </div>
                </div>

                {/* Operational Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#101B14]/10">
                    <div className="bg-white p-4 rounded-lg border border-[#101B14]/10 shadow-xs">
                        <span className="text-[10px] font-mono font-bold text-[#101B14]/60 uppercase tracking-wider block mb-1">
                            Total Pens & Houses
                        </span>
                        <div className="text-xl sm:text-2xl font-extrabold text-[#101B14] font-mono">
                            {sections.length} <span className="text-xs font-sans font-normal text-[#101B14]/60">Pens</span>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-[#101B14]/10 shadow-xs">
                        <span className="text-[10px] font-mono font-bold text-[#101B14]/60 uppercase tracking-wider block mb-1">
                            Total Bird Capacity
                        </span>
                        <div className="text-xl sm:text-2xl font-extrabold text-[#101B14] font-mono">
                            {sections.reduce((acc, curr) => acc + curr.capacity, 0).toLocaleString()}
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-[#101B14]/10 shadow-xs">
                        <span className="text-[10px] font-mono font-bold text-[#101B14]/60 uppercase tracking-wider block mb-1">
                            Ready Pens
                        </span>
                        <div className="text-xl sm:text-2xl font-extrabold text-[#3F6B47] font-mono">
                            {sections.length} <span className="text-xs font-sans font-normal text-[#101B14]/60">Active</span>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-[#101B14]/10 shadow-xs">
                        <span className="text-[10px] font-mono font-bold text-[#101B14]/60 uppercase tracking-wider block mb-1">
                            Farm Biosecurity
                        </span>
                        <div className="text-xl sm:text-2xl font-extrabold text-[#3F6B47] font-mono">
                            Level 1 <span className="text-xs font-sans font-normal text-[#101B14]/60">(Clean)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pens & Houses Table Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-[#101B14] font-['Fraunces',serif]">
                        Pens, Houses & Livestock Sections
                    </h3>
                    <span className="text-xs font-mono font-bold text-[#101B14]/60">
                        Showing {sections.length} registered pens
                    </span>
                </div>

                <div className="bg-[#FBF9F5] border border-[#101B14]/10 rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-[#101B14] min-w-[800px]">
                            {/* Darker Cream Header */}
                            <thead className="bg-[#DFD8C4] border-b-2 border-[#101B14]/10 text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/80 shadow-xs">
                                <tr>
                                    <th className="px-6 py-5 whitespace-nowrap">Pen ID</th>
                                    <th className="px-6 py-5 whitespace-nowrap">Pen / House Name</th>
                                    <th className="px-6 py-5 whitespace-nowrap">Animal Type</th>
                                    <th className="px-6 py-5 whitespace-nowrap">Production Focus</th>
                                    <th className="px-6 py-5 whitespace-nowrap">Max Capacity</th>
                                    <th className="px-6 py-5 whitespace-nowrap text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#101B14]/10 bg-[#FBF9F5]">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-[#101B14]/50 font-bold">
                                            Loading farm pens...
                                        </td>
                                    </tr>
                                ) : sections.length > 0 ? (
                                    sections.map((sec) => (
                                        <tr
                                            key={sec.id}
                                            onClick={() => navigate(`/${portalNamespace}/sections/${sec.id}`)}
                                            className="group hover:bg-[#ECE6D6] hover:border-l-4 hover:border-l-[#3F6B47] transition-all cursor-pointer"
                                        >
                                            <td className="px-6 py-5 font-mono text-xs font-bold text-[#101B14]/50">
                                                #{sec.id}
                                            </td>
                                            <td className="px-6 py-5 font-bold text-[#101B14] text-base group-hover:text-[#3F6B47] transition-colors">
                                                {sec.name}
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="px-3 py-1.5 rounded-full bg-[#101B14]/5 text-[#101B14]/80 text-[10px] font-extrabold uppercase tracking-widest border border-[#101B14]/10">
                                                    {sec.animalCategory}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-xs font-bold text-[#101B14]/60 uppercase tracking-wider">
                                                {sec.productionType}
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="font-mono text-base font-extrabold text-[#101B14] bg-[#D9A63E]/10 px-3 py-1 rounded-md text-[#D9A63E] border border-[#D9A63E]/20">
                                                    {sec.capacity.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleOpenBatchModal(e, sec)}
                                                    className="px-5 py-2.5 rounded-lg bg-white border border-[#101B14]/15 text-[#101B14] text-xs font-bold uppercase tracking-wider group-hover:bg-[#3F6B47] group-hover:text-white group-hover:border-[#3F6B47] shadow-xs transition-all duration-300"
                                                >
                                                    + Stock Birds
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center bg-[#FBF9F5]">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <svg className="w-12 h-12 text-[#101B14]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                                </svg>
                                                <p className="text-[#101B14]/60 font-sans text-sm font-bold">
                                                    No pens or houses registered under this farm yet.
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowSectionModal(true)}
                                                    className="text-[#D9A63E] hover:text-[#b88c34] font-bold text-xs uppercase tracking-wider border-b border-[#D9A63E]/40 pb-0.5 transition-colors"
                                                >
                                                    + Add Your First Pen / House
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ========================================= */}
            {/* MODAL 1: ADD NEW PEN / SECTION            */}
            {/* ========================================= */}
            {showSectionModal && (
                <div className="fixed inset-0 bg-[#101B14]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
                    <div className="bg-[#FBF9F5] border border-[#D9A63E]/40 rounded-xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative">
                        <div className="h-2 w-full bg-[#D9A63E]"></div>
                        
                        <div className="flex items-center justify-between border-b border-[#101B14]/10 p-6 bg-white">
                            <div>
                                <h4 className="text-2xl font-extrabold text-[#101B14] font-['Fraunces',serif]">Add New Pen</h4>
                                <p className="text-[10px] font-mono font-bold text-[#3F6B47] uppercase tracking-widest mt-1">Register a new containment zone</p>
                            </div>
                            <button onClick={() => setShowSectionModal(false)} className="text-[#101B14]/40 hover:text-[#E76F51] hover:bg-[#E76F51]/10 bg-[#101B14]/5 p-2 rounded-full transition-all">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {errorMessage && (
                                <div className="mb-6 p-4 rounded-lg bg-[#E76F51]/10 border border-[#E76F51]/30 text-[#E76F51] text-sm font-bold shadow-sm">
                                    {errorMessage}
                                </div>
                            )}

                            <form id="section-form" onSubmit={handleCreateSection} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[#101B14]/70 mb-2">Pen / House Name *</label>
                                    <input type="text" required value={sectionForm.name} onChange={e => setSectionForm({...sectionForm, name: e.target.value})} placeholder="e.g. Broiler House A" className="w-full px-4 py-3 rounded-lg border border-[#101B14]/20 focus:ring-2 focus:ring-[#D9A63E] outline-none shadow-sm font-bold text-sm" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-[#101B14]/70 mb-2">Animal Type</label>
                                        <select value={sectionForm.animalCategory} onChange={e => setSectionForm({...sectionForm, animalCategory: e.target.value as AnimalCategory})} className="w-full px-4 py-3 rounded-lg border border-[#101B14]/20 focus:ring-2 focus:ring-[#D9A63E] outline-none shadow-sm text-sm">
                                            <option value={AnimalCategory.POULTRY}>POULTRY</option>
                                            <option value={AnimalCategory.LIVESTOCK}>LIVESTOCK</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-[#101B14]/70 mb-2">Production</label>
                                        <select value={sectionForm.productionType} onChange={e => setSectionForm({...sectionForm, productionType: e.target.value as ProductionType})} className="w-full px-4 py-3 rounded-lg border border-[#101B14]/20 focus:ring-2 focus:ring-[#D9A63E] outline-none shadow-sm text-sm">
                                            <option value={ProductionType.Meat}>Meat</option>
                                            <option >Dairy</option>
                                            <option >Eggs</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[#101B14]/70 mb-2">Max Capacity (Headcount) *</label>
                                    <input type="number" required min={1} value={sectionForm.capacity} onChange={e => setSectionForm({...sectionForm, capacity: Number(e.target.value)})} className="w-full px-4 py-3 rounded-lg border border-[#101B14]/20 focus:ring-2 focus:ring-[#D9A63E] outline-none shadow-sm font-mono text-sm font-bold" />
                                </div>
                            </form>
                        </div>

                        <div className="p-6 bg-[#ECE6D6] border-t border-[#101B14]/10 flex justify-end gap-3 shrink-0">
                            <button onClick={() => setShowSectionModal(false)} className="px-6 py-3 font-bold text-xs uppercase text-[#101B14]/60 hover:text-[#101B14] transition-colors">Cancel</button>
                            <button type="submit" form="section-form" disabled={submitting} className="px-6 py-3 bg-[#D9A63E] text-[#101B14] font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-md hover:bg-[#c99834] disabled:opacity-50">
                                {submitting ? 'Saving...' : 'Save Pen'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================= */}
            {/* MODAL 2: STOCK BIRDS (CREATE BATCH)       */}
            {/* ========================================= */}
            {showBatchModal && selectedSectionForBatch && (
                <div className="fixed inset-0 bg-[#101B14]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
                    <div className="bg-[#FBF9F5] border border-[#3F6B47]/40 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative">
                        <div className="h-2 w-full bg-[#3F6B47]"></div>
                        
                        <div className="flex items-center justify-between border-b border-[#101B14]/10 p-6 bg-white">
                            <div>
                                <h4 className="text-2xl font-extrabold text-[#101B14] font-['Fraunces',serif]">Stock Livestock</h4>
                                <p className="text-[10px] font-mono font-bold text-[#3F6B47] uppercase tracking-widest mt-1">Deploy a new batch into {selectedSectionForBatch.name}</p>
                            </div>
                            <button onClick={() => {setShowBatchModal(false); setSelectedSectionForBatch(null);}} className="text-[#101B14]/40 hover:text-[#E76F51] hover:bg-[#E76F51]/10 bg-[#101B14]/5 p-2 rounded-full transition-all">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {errorMessage && (
                                <div className="mb-6 p-4 rounded-lg bg-[#E76F51]/10 border border-[#E76F51]/30 text-[#E76F51] text-sm font-bold shadow-sm">
                                    {errorMessage}
                                </div>
                            )}

                            <form id="batch-form" onSubmit={handleCreateBatch} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-[#101B14]/70 mb-2">Initial Count *</label>
                                        <input type="number" required min={1} max={selectedSectionForBatch.capacity} value={batchForm.initialCount} onChange={e => setBatchForm({...batchForm, initialCount: Number(e.target.value)})} className="w-full px-4 py-3 rounded-lg border border-[#101B14]/20 focus:ring-2 focus:ring-[#3F6B47] outline-none shadow-sm font-mono text-sm font-bold" />
                                        <span className="text-[9px] text-[#101B14]/50 mt-1 block uppercase">Max: {selectedSectionForBatch.capacity}</span>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-[#101B14]/70 mb-2">Breed</label>
                                        <select value={batchForm.breed} onChange={e => setBatchForm({...batchForm, breed: e.target.value as Breed})} className="w-full px-4 py-3 rounded-lg border border-[#101B14]/20 focus:ring-2 focus:ring-[#3F6B47] outline-none shadow-sm text-sm">
                                            <option value={Breed.COBB_500}>COBB 500</option>
                                            <option value={Breed.ROSS_308}>ROSS 308</option>
                                            <option value={Breed.ISA_BROWN}>ISA BROWN</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-[#101B14]/70 mb-2">Start Date *</label>
                                        <input type="date" required value={batchForm.startDate} onChange={e => setBatchForm({...batchForm, startDate: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-[#101B14]/20 focus:ring-2 focus:ring-[#3F6B47] outline-none shadow-sm text-sm font-mono" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-[#101B14]/70 mb-2">Est. End Date *</label>
                                        <input type="date" required value={batchForm.expectedEndDate} onChange={e => setBatchForm({...batchForm, expectedEndDate: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-[#101B14]/20 focus:ring-2 focus:ring-[#3F6B47] outline-none shadow-sm text-sm font-mono" />
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-6 bg-[#ECE6D6] border-t border-[#101B14]/10 flex justify-end gap-3 shrink-0">
                            <button onClick={() => {setShowBatchModal(false); setSelectedSectionForBatch(null);}} className="px-6 py-3 font-bold text-xs uppercase text-[#101B14]/60 hover:text-[#101B14] transition-colors">Cancel</button>
                            <button type="submit" form="batch-form" disabled={submitting} className="px-6 py-3 bg-[#3F6B47] text-white font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-md hover:bg-[#2d4f34] disabled:opacity-50">
                                {submitting ? 'Stocking...' : 'Deploy Batch'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};