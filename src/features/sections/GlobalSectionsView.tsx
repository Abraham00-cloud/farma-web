import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { infrastructureService } from '../../services/infrastructureService';
import { batchService } from '../../services/batchService';
import { SectionDetailView } from './SectionDetailView';
import { BatchDetailView } from '../batches/BatchDetailView';
import type { FarmResponseDto, SectionResponseDto } from '../../types/infrastructure';
import { Breed, type BatchRequestDto } from '../../types/batch';

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

// 1. The Main Parent Wrapper
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
    const [refreshCounter, setRefreshCounter] = useState<number>(0);

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

    useEffect(() => {
        let isMounted = true;

        const fetchFarmsAndSections = async () => {
            try {
                let farmList = await infrastructureService.getFarmsByOrganisation(organisationId);
                
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
                    setLoading(false);
                }
            } catch {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchFarmsAndSections();

        return () => {
            isMounted = false;
        };
    }, [organisationId, isProprietor, currentUserId, refreshCounter]);

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
            
            setLoading(true);
            setRefreshCounter(prev => prev + 1);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const backendError = err.response?.data?.message || err.response?.data;
                setErrorMessage(
                    typeof backendError === 'string'
                        ? backendError
                        : JSON.stringify(backendError)
                );
            } else {
                setErrorMessage('Failed to stock the new batch.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Routes>
                <Route 
                    index 
                    element={
                        <SectionsListView 
                            farmGroups={farmGroups} 
                            loading={loading} 
                            isProprietor={isProprietor} 
                            selectedCategory={selectedCategory} 
                            setSelectedCategory={setSelectedCategory} 
                        />
                    } 
                />
                <Route 
                    path=":sectionId/*" 
                    element={
                        <SectionDetailWrapper 
                            farmGroups={farmGroups} 
                            loading={loading} 
                            onStockSection={handleOpenStockModal} 
                        />
                    } 
                />
            </Routes>

            {/* Modal Layer */}
            {showBatchModal && sectionToStock && (
                <div className="fixed inset-0 bg-[#101B14]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
                    <div className="bg-[#FBF9F5] border border-[#D9A63E]/40 rounded-xl max-w-lg w-full shadow-2xl flex flex-col max-h-[95vh] relative overflow-hidden">
                        
                        <div className="h-2 w-full bg-[#D9A63E] relative shrink-0 shadow-sm"></div>

                        <div className="flex items-start justify-between border-b border-[#101B14]/10 p-6 bg-white shrink-0">
                            <div>
                                <h4 className="text-2xl font-extrabold text-[#101B14] font-['Fraunces',serif] tracking-tight">
                                    Stock New Birds
                                </h4>
                                <div className="mt-2 inline-flex items-center space-x-2 bg-[#3F6B47]/10 px-3 py-1.5 rounded-lg border border-[#3F6B47]/20">
                                    <span className="text-xs font-bold text-[#3F6B47] uppercase tracking-wider">Target Pen: {sectionToStock.name}</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowBatchModal(false)}
                                className="text-[#101B14]/40 hover:text-[#E76F51] hover:bg-[#E76F51]/10 bg-[#101B14]/5 transition-all p-2 rounded-full cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
                            {errorMessage && (
                                <div className="p-4 rounded-lg bg-[#E76F51]/10 border border-[#E76F51]/30 text-[#E76F51] text-sm font-bold flex items-center space-x-3 shadow-sm">
                                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            <form id="global-batch-form" onSubmit={handleCreateBatch} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#101B14]/70">
                                        <span>Breed / Strain *</span>
                                    </label>
                                    <select
                                        value={batchForm.breed}
                                        onChange={(e) =>
                                            setBatchForm({ ...batchForm, breed: e.target.value as Breed })
                                        }
                                        className="w-full px-5 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#D9A63E] focus:ring-2 focus:ring-[#D9A63E]/50 transition-all cursor-pointer shadow-sm"
                                    >
                                        {Object.values(Breed).map((b) => (
                                            <option key={b} value={b}>{b.replace('_', ' ')}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#101B14]/70">
                                        <span>Number of Birds *</span>
                                        <span className="text-[#D9A63E] bg-[#D9A63E]/10 px-2 py-0.5 rounded text-[10px] font-bold">Max: {sectionToStock.capacity.toLocaleString()}</span>
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
                                        className="w-full px-5 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-lg font-extrabold focus:outline-none focus:border-[#D9A63E] focus:ring-2 focus:ring-[#D9A63E]/50 transition-all shadow-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="flex items-center text-xs font-bold uppercase tracking-wider text-[#101B14]/70">
                                            Placement Date *
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={batchForm.startDate}
                                            onChange={(e) =>
                                                setBatchForm({ ...batchForm, startDate: e.target.value })
                                            }
                                            className="w-full px-4 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#D9A63E] focus:ring-2 focus:ring-[#D9A63E]/50 transition-all shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="flex items-center text-xs font-bold uppercase tracking-wider text-[#101B14]/70">
                                            Expected Harvest Date *
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={batchForm.expectedEndDate}
                                            onChange={(e) =>
                                                setBatchForm({ ...batchForm, expectedEndDate: e.target.value })
                                            }
                                            className="w-full px-4 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#D9A63E] focus:ring-2 focus:ring-[#D9A63E]/50 transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-6 bg-[#F5F1E6] border-t border-[#101B14]/10 shrink-0 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-4 z-10">
                            <button
                                type="button"
                                onClick={() => setShowBatchModal(false)}
                                className="w-full sm:w-auto px-6 py-4 rounded-lg bg-transparent hover:bg-[#101B14]/5 text-[#101B14]/60 hover:text-[#101B14] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="global-batch-form"
                                disabled={submitting}
                                className="w-full sm:w-auto px-8 py-4 rounded-lg bg-[#D9A63E] hover:bg-[#c99834] text-[#101B14] font-extrabold text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                            >
                                {submitting ? 'Stocking...' : 'Stock Batch Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// 2. Extracted List Component
const SectionsListView: React.FC<{
    farmGroups: FarmGroup[];
    loading: boolean;
    isProprietor: boolean;
    selectedCategory: string;
    setSelectedCategory: (cat: string) => void;
}> = ({ farmGroups, loading, isProprietor, selectedCategory, setSelectedCategory }) => {
    const navigate = useNavigate();

    const totalUnits = farmGroups.reduce((acc, g) => acc + g.sections.length, 0);
    const totalCapacity = farmGroups.reduce(
        (acc, g) => acc + g.sections.reduce((sAcc, sec) => sAcc + sec.capacity, 0),
        0
    );

    return (
        <div className="space-y-8 font-sans max-w-7xl mx-auto pb-16">
            
            {/* Header & Category Tabs */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-2 border-[#101B14]/10 pb-6">
                <div>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-[#101B14] tracking-tight font-['Fraunces',serif]">
                        {isProprietor ? 'All Farms and Pens' : 'My Farm Pens'}
                    </h2>
                    <p className="text-sm text-[#101B14]/70 font-medium mt-2 max-w-xl leading-relaxed">
                        A complete list of all animal housing units and their current holding capacities.
                    </p>
                </div>

                <div className="flex bg-[#FBF9F5] p-1.5 rounded-lg border border-[#101B14]/10 shadow-xs text-xs font-bold uppercase tracking-wider">
                    {['ALL', 'POULTRY', 'LIVESTOCK'].map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-5 py-2.5 rounded-md transition-all cursor-pointer ${
                                selectedCategory === cat
                                    ? 'bg-[#101B14] text-[#FBF9F5] shadow-md transform scale-[1.02]'
                                    : 'text-[#101B14]/60 hover:text-[#101B14] hover:bg-[#101B14]/5'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Metrics Row using Bright Light Cream Tone */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#FBF9F5] rounded-xl p-6 shadow-xs border border-[#101B14]/10">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-[#101B14]/60 uppercase tracking-widest">
                            Total Farms
                        </span>
                        <div className="w-10 h-10 rounded-full bg-[#101B14]/5 flex items-center justify-center text-[#101B14]">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-8a2 2 0 012-2h4a2 2 0 012 2v8M13 21h8M15 21v-4a2 2 0 012-2h0a2 2 0 012 2v4M13 13h8M13 9h8M3 13h8M3 9h8M3 5h18" />
                            </svg>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-extrabold text-[#101B14] font-mono">{farmGroups.length}</span>
                        <span className="text-sm font-bold text-[#101B14]/50 uppercase">Active</span>
                    </div>
                </div>

                <div className="bg-[#FBF9F5] rounded-xl p-6 shadow-xs border border-[#101B14]/10">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-[#101B14]/60 uppercase tracking-widest">
                            Total Pens
                        </span>
                        <div className="w-10 h-10 rounded-full bg-[#3F6B47]/10 flex items-center justify-center text-[#3F6B47]">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-extrabold text-[#101B14] font-mono">{totalUnits}</span>
                        <span className="text-sm font-bold text-[#3F6B47] uppercase bg-[#3F6B47]/10 px-2 py-0.5 rounded">Pens</span>
                    </div>
                </div>

                <div className="bg-[#D9A63E] rounded-xl p-6 shadow-md border border-[#D9A63E]">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-extrabold text-[#101B14]/80 uppercase tracking-widest">
                            Total Bird Capacity
                        </span>
                        <div className="w-10 h-10 rounded-full bg-white/30 text-[#101B14] flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-extrabold text-[#101B14] font-mono tracking-tight">{totalCapacity.toLocaleString()}</span>
                        <span className="text-sm font-black text-[#101B14]/80 uppercase">Birds Max</span>
                    </div>
                </div>
            </div>

            {/* Farm Groups & Pens Data Tables */}
            {loading ? (
                <div className="bg-[#FBF9F5] border border-[#101B14]/10 rounded-xl p-24 text-center shadow-xs">
                    <div className="w-12 h-12 border-4 border-[#3F6B47]/20 border-t-[#3F6B47] rounded-full animate-spin mx-auto mb-6"></div>
                    <h3 className="text-lg font-bold text-[#101B14] mb-1">Loading Data...</h3>
                    <p className="text-sm text-[#101B14]/50">Gathering your farms and pens from the system.</p>
                </div>
            ) : farmGroups.length > 0 ? (
                <div className="space-y-8">
                    {farmGroups.map(({ farm, sections }) => {
                        const filteredSections = selectedCategory === 'ALL'
                            ? sections
                            : sections.filter((s) => s.animalCategory === selectedCategory);

                        return (
                            <div
                                key={farm.id}
                                className="bg-[#FBF9F5] border border-[#101B14]/10 rounded-xl overflow-hidden shadow-xs"
                            >
                                {/* Farm Title Banner */}
                                <div className="bg-[#FBF9F5] px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#101B14]/10">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 rounded-lg bg-white border border-[#101B14]/10 flex items-center justify-center shadow-xs text-[#101B14]">
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-extrabold tracking-tight font-['Fraunces',serif] text-[#101B14]">
                                                {farm.name}
                                            </h4>
                                            <p className="text-xs font-mono text-[#101B14]/60 tracking-wider mt-1 flex items-center gap-2">
                                                <span>📍 {farm.address}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        <span className="px-4 py-2 rounded-lg bg-[#3F6B47]/10 text-[#3F6B47] font-bold text-xs uppercase tracking-widest border border-[#3F6B47]/20">
                                            {sections.length} Pens Here
                                        </span>
                                    </div>
                                </div>

                                {/* Table with Darker Cream Header & Light Cream Rows */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-[#101B14] min-w-[800px]">
                                        <thead className="bg-[#DFD8C4] border-b-2 border-[#101B14]/15 text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/80 shadow-xs">
                                            <tr>
                                                <th className="px-6 py-5 whitespace-nowrap">ID</th>
                                                <th className="px-6 py-5 whitespace-nowrap">Pen Name</th>
                                                <th className="px-6 py-5 whitespace-nowrap">Animal Type</th>
                                                <th className="px-6 py-5 whitespace-nowrap">Purpose</th>
                                                <th className="px-6 py-5 whitespace-nowrap">Max Capacity</th>
                                                <th className="px-6 py-5 whitespace-nowrap text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#101B14]/10 bg-[#FBF9F5]">
                                            {filteredSections.length > 0 ? (
                                                filteredSections.map((sec) => (
                                                    <tr
                                                        key={sec.id}
                                                        onClick={() => navigate(String(sec.id))}
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
                                                            <button className="px-5 py-2.5 rounded-lg bg-white border border-[#101B14]/15 text-[#101B14] text-xs font-bold uppercase tracking-wider group-hover:bg-[#3F6B47] group-hover:text-white group-hover:border-[#3F6B47] shadow-xs transition-all duration-300">
                                                                Open Pen →
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-16 text-center bg-[#FBF9F5]">
                                                        <div className="flex flex-col items-center justify-center space-y-3">
                                                            <svg className="w-12 h-12 text-[#101B14]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                                            </svg>
                                                            <span className="text-[#101B14]/60 font-bold text-sm">
                                                                No pens match the "{selectedCategory}" filter for this farm.
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-[#FBF9F5] border border-[#101B14]/10 rounded-2xl p-20 text-center flex flex-col items-center justify-center shadow-xs">
                    <div className="w-20 h-20 rounded-full bg-[#ECE6D6] flex items-center justify-center text-[#101B14]/30 mb-5 shadow-inner">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-extrabold text-[#101B14] font-['Fraunces',serif] mb-2">No Farms Found</h3>
                    <p className="text-sm text-[#101B14]/60 font-medium max-w-sm leading-relaxed">
                        {isProprietor 
                            ? 'You have not added any farms or pens yet. Go to the Farm Setup page to create your first one.' 
                            : 'You have not been assigned to manage any farms or pens yet.'}
                    </p>
                </div>
            )}
        </div>
    );
};

// 3. Sub-Routers for Deep Linking
const SectionDetailWrapper: React.FC<{ 
    farmGroups: FarmGroup[], 
    loading: boolean,
    onStockSection: (sec: SectionResponseDto) => void
}> = ({ farmGroups, loading, onStockSection }) => {
    const { sectionId } = useParams();
    const navigate = useNavigate();

    let section: SectionResponseDto | undefined;
    for (const group of farmGroups) {
        const found = group.sections.find(s => String(s.id) === sectionId);
        if (found) {
            section = found;
            break;
        }
    }

    if (loading) {
        return (
            <div className="p-24 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#3F6B47]/20 border-t-[#3F6B47] rounded-full animate-spin mb-6"></div>
                <span className="text-[#101B14]/60 text-sm font-bold uppercase tracking-widest">
                    Loading pen details...
                </span>
            </div>
        );
    }

    if (!section) {
        return (
            <div className="bg-[#FBF9F5] border border-[#E76F51]/20 rounded-xl p-16 text-center shadow-xs flex flex-col items-center max-w-2xl mx-auto mt-12">
                <div className="w-20 h-20 rounded-full bg-[#E76F51]/10 text-[#E76F51] flex items-center justify-center mb-6">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-2xl font-extrabold text-[#101B14] mb-3 font-['Fraunces',serif]">Pen Not Found</h3>
                <p className="text-[#101B14]/60 mb-8 text-sm font-medium">The requested pen could not be found or you do not have permission to view it.</p>
                <button 
                    onClick={() => navigate('..', { relative: 'path' })} 
                    className="px-6 py-3 bg-[#3F6B47] text-white rounded-lg font-bold text-xs uppercase tracking-wider shadow-xs hover:bg-[#2d4f34] transition-colors"
                >
                    Return to All Farms
                </button>
            </div>
        );
    }

    return (
        <Routes>
            <Route index element={<SectionDetailView section={section} onStockSection={() => onStockSection(section!)} />} />
            <Route path="batches/:batchId" element={<BatchDetailWrapper />} />
        </Routes>
    );
};

const BatchDetailWrapper = () => {
    const { batchId } = useParams();
    const navigate = useNavigate();
    return <BatchDetailView batchId={Number(batchId)} onBack={() => navigate('..', { relative: 'path' })} />;
};