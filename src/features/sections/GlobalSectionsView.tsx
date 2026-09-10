import React, { useState, useEffect} from 'react';
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
    
    const [refreshCounter, setRefreshCounter] = useState<number>(0);

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

    const inputClassesGreen = "w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm font-semibold focus:outline-none focus:border-farma-green focus:ring-2 focus:ring-farma-green/30 transition-shadow shadow-sm";

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

            {showBatchModal && sectionToStock && (
                <div className="fixed inset-0 bg-farma-forest/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
                    <div className="bg-farma-cream border border-farma-forest/10 rounded-xl max-w-lg w-full shadow-2xl flex flex-col max-h-[95vh] relative overflow-hidden">
                        
                        <div className="h-1.5 w-full bg-farma-green relative shrink-0 shadow-sm"></div>

                        <div className="flex items-center justify-between border-b border-farma-forest/10 p-6 bg-white shrink-0">
                            <div>
                                <h4 className="text-xl font-bold text-farma-forest tracking-tight">
                                    Stock Livestock
                                </h4>
                                <div className="mt-1.5 inline-flex items-center space-x-2 bg-farma-green/10 px-2.5 py-1 rounded-md border border-farma-green/20">
                                    <span className="text-[10px] font-bold text-farma-green uppercase tracking-widest tabular-nums">
                                        Deploying to: {sectionToStock.name}
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowBatchModal(false)}
                                className="text-farma-forest/40 hover:text-farma-terracotta hover:bg-farma-terracotta/10 bg-farma-forest/5 transition-colors p-2 rounded-lg cursor-pointer"
                            >
                                <IconClose />
                            </button>
                        </div>

                        <div className="p-6 sm:p-8 overflow-y-auto flex-1 custom-scrollbar space-y-6">
                            {errorMessage && (
                                <div className="p-4 rounded-lg bg-farma-terracotta/10 border border-farma-terracotta/20 text-farma-terracotta text-xs font-bold flex items-center space-x-3 shadow-sm">
                                    <IconWarning />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            <form id="global-batch-form" onSubmit={handleCreateBatch} className="space-y-6">
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-farma-forest/60 pl-1">
                                            <span>Initial Count *</span>
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min={1}
                                            max={sectionToStock.capacity}
                                            value={batchForm.initialCount}
                                            onChange={(e) => setBatchForm({ ...batchForm, initialCount: Number(e.target.value) })}
                                            className={`${inputClassesGreen} tabular-nums text-base`}
                                        />
                                        <span className="text-[9px] text-farma-forest/50 mt-1 block font-bold uppercase tracking-widest pl-1 tabular-nums">
                                            Max Capacity: {sectionToStock.capacity.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-farma-forest/60 pl-1">
                                            <span>Breed / Strain *</span>
                                        </label>
                                        <select
                                            value={batchForm.breed}
                                            onChange={(e) => setBatchForm({ ...batchForm, breed: e.target.value as Breed })}
                                            className={`${inputClassesGreen} cursor-pointer`}
                                        >
                                            {Object.values(Breed).map((b) => (
                                                <option key={b} value={b}>{b.replace('_', ' ')}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="flex items-center text-[10px] font-bold uppercase tracking-widest text-farma-forest/60 pl-1">
                                            Placement Date *
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={batchForm.startDate}
                                            onChange={(e) => setBatchForm({ ...batchForm, startDate: e.target.value })}
                                            className={`${inputClassesGreen} tabular-nums cursor-pointer`}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="flex items-center text-[10px] font-bold uppercase tracking-widest text-farma-forest/60 pl-1">
                                            Expected Harvest Date *
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={batchForm.expectedEndDate}
                                            onChange={(e) => setBatchForm({ ...batchForm, expectedEndDate: e.target.value })}
                                            className={`${inputClassesGreen} tabular-nums cursor-pointer`}
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-6 bg-farma-sand/50 border-t border-farma-forest/10 shrink-0 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-3 z-10">
                            <button
                                type="button"
                                onClick={() => setShowBatchModal(false)}
                                className="w-full sm:w-auto px-5 py-3 rounded-lg bg-transparent hover:bg-farma-forest/5 text-farma-forest/60 hover:text-farma-forest font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer text-center"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="global-batch-form"
                                disabled={submitting}
                                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-farma-gold hover:bg-farma-gold-hover text-farma-forest font-bold text-xs uppercase tracking-wider shadow-sm transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
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
}> = ({ farmGroups, loading, isProprietor }) => {
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [selectedFarmId, setSelectedFarmId] = useState<string>('ALL');

    const totalUnits = farmGroups.reduce((acc, g) => acc + g.sections.length, 0);
    const totalCapacity = farmGroups.reduce(
        (acc, g) => acc + g.sections.reduce((sAcc, sec) => sAcc + sec.capacity, 0),
        0
    );

    const filteredGroups = farmGroups.map(group => {
        if (selectedFarmId !== 'ALL' && group.farm.id.toString() !== selectedFarmId) {
            return null; 
        }

        const categoryFiltered = selectedCategory === 'ALL'
            ? group.sections
            : group.sections.filter(s => s.animalCategory === selectedCategory);

        const searchLower = searchTerm.toLowerCase();
        const farmMatchesSearch = 
            group.farm.name.toLowerCase().includes(searchLower) || 
            group.farm.address.toLowerCase().includes(searchLower);
        
        const matchedSections = categoryFiltered.filter(s => 
            s.name.toLowerCase().includes(searchLower) || 
            s.id.toString().includes(searchLower)
        );

        return {
            farm: group.farm,
            sections: farmMatchesSearch ? categoryFiltered : matchedSections,
            farmMatchesSearch
        };
    }).filter(group => group !== null && (group.farmMatchesSearch || group.sections.length > 0)) as { farm: FarmResponseDto, sections: SectionResponseDto[], farmMatchesSearch: boolean }[];

    return (
        <div className="space-y-8 font-sans max-w-7xl mx-auto pb-16">
            
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-farma-forest/10 pb-8">
                <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-farma-forest tracking-tight">
                        {isProprietor ? 'All Farms & Pens' : 'My Assigned Pens'}
                    </h2>
                    <p className="text-sm text-farma-forest/70 font-medium mt-2 max-w-xl leading-relaxed">
                        A global view of all animal housing units, containment pens, and current capacities across your organisation.
                    </p>
                </div>

                <div className="flex flex-col xl:flex-row gap-3 w-full lg:w-auto bg-farma-cream p-3 rounded-xl border border-farma-forest/10 shadow-sm items-stretch xl:items-center">
                    
                    <div className="relative w-full xl:w-48 h-[40px]">
                        <select
                            value={selectedFarmId}
                            onChange={(e) => setSelectedFarmId(e.target.value)}
                            className="w-full h-full px-3 bg-white border border-farma-forest/10 rounded-lg text-xs font-semibold text-farma-forest focus:outline-none focus:border-farma-gold focus:ring-2 focus:ring-farma-gold/20 transition-shadow shadow-sm cursor-pointer"
                        >
                            <option value="ALL">All Farm Locations</option>
                            {farmGroups.map(g => (
                                <option key={g.farm.id} value={g.farm.id.toString()}>{g.farm.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center w-full xl:w-64 h-[40px] bg-white border border-farma-forest/10 rounded-lg px-3 focus-within:border-farma-gold focus-within:ring-2 focus-within:ring-farma-gold/20 transition-shadow shadow-sm">
                        <div className="text-farma-forest/40 shrink-0">
                            <IconSearch />
                        </div>
                        <input
                            type="text"
                            placeholder="Search pens..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-full pl-2.5 bg-transparent border-none focus:outline-none focus:ring-0 text-sm text-farma-forest placeholder-farma-forest/40"
                        />
                    </div>

                    <div className="flex bg-farma-sand/50 p-1 rounded-lg border border-farma-forest/10 shrink-0 h-[40px]">
                        {['ALL', 'POULTRY', 'LIVESTOCK'].map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setSelectedCategory(cat)}
                                className={`flex-1 px-4 rounded-md text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer h-full flex items-center justify-center ${
                                    selectedCategory === cat
                                        ? 'bg-white text-farma-green shadow-sm border border-farma-forest/5'
                                        : 'text-farma-forest/50 hover:text-farma-forest'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-farma-forest/10">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-farma-forest/50 uppercase tracking-widest">
                            Total Farms
                        </span>
                        <div className="w-10 h-10 rounded-lg bg-farma-forest/5 flex items-center justify-center text-farma-forest/40 shadow-sm">
                            <IconFarm />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-farma-forest tabular-nums">{farmGroups.length}</span>
                        <span className="text-[10px] font-bold text-farma-forest/40 uppercase tracking-wider">Active</span>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-farma-forest/10">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-farma-forest/50 uppercase tracking-widest">
                            Total Pens
                        </span>
                        <div className="w-10 h-10 rounded-lg bg-farma-green/10 flex items-center justify-center text-farma-green shadow-sm">
                            <IconPen />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-farma-forest tabular-nums">{totalUnits}</span>
                        <span className="text-[10px] font-bold text-farma-green uppercase bg-farma-green/10 px-2 py-0.5 rounded-md tracking-wider">Units</span>
                    </div>
                </div>

                <div className="bg-farma-gold rounded-xl p-6 shadow-sm border border-farma-gold-hover">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-farma-forest/70 uppercase tracking-widest">
                            Global Max Capacity
                        </span>
                        <div className="w-10 h-10 rounded-lg bg-white/20 text-farma-forest flex items-center justify-center shadow-sm">
                            <IconCapacity />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-farma-forest tabular-nums tracking-tight">{totalCapacity.toLocaleString()}</span>
                        <span className="text-[10px] font-bold text-farma-forest/80 uppercase tracking-wider">Head</span>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="bg-farma-cream border border-farma-forest/10 rounded-xl p-24 text-center shadow-sm">
                    <div className="w-10 h-10 border-4 border-farma-green/20 border-t-farma-green rounded-full animate-spin mx-auto mb-6"></div>
                    <h3 className="text-lg font-bold text-farma-forest mb-1">Loading Infrastructure...</h3>
                    <p className="text-xs text-farma-forest/50 font-medium">Gathering global pen data from all connected facilities.</p>
                </div>
            ) : filteredGroups.length > 0 ? (
                <div className="space-y-8">
                    {filteredGroups.map(({ farm, sections }) => (
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
                                        {sections.length} Pens Here
                                    </span>
                                </div>
                            </div>

                            <div className="overflow-x-auto bg-white">
                                <table className="w-full text-left text-sm text-farma-forest min-w-[800px]">
                                    <thead className="bg-farma-sand/50 border-b border-farma-forest/10 text-[10px] font-bold uppercase tracking-widest text-farma-forest/60">
                                        <tr>
                                            <th className="px-6 py-4 whitespace-nowrap">Pen ID</th>
                                            <th className="px-6 py-4 whitespace-nowrap">Pen Name</th>
                                            <th className="px-6 py-4 whitespace-nowrap">Category</th>
                                            <th className="px-6 py-4 whitespace-nowrap">Focus</th>
                                            <th className="px-6 py-4 whitespace-nowrap">Capacity</th>
                                            <th className="px-6 py-4 whitespace-nowrap text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-farma-forest/5">
                                        {sections.length > 0 ? (
                                            sections.map((sec) => (
                                                <tr
                                                    key={sec.id}
                                                    onClick={() => navigate(String(sec.id))}
                                                    className="group hover:bg-farma-cream transition-colors cursor-pointer"
                                                >
                                                    <td className="px-6 py-4 text-xs font-bold text-farma-forest/40 tabular-nums">
                                                        #{sec.id.toString().padStart(4, '0')}
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-farma-forest text-sm group-hover:text-farma-green transition-colors">
                                                        {sec.name}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2.5 py-1 rounded-md bg-farma-forest/5 text-farma-forest/70 text-[9px] font-bold uppercase tracking-widest border border-farma-forest/5">
                                                            {sec.animalCategory}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-bold text-farma-forest/60 uppercase tracking-wider">
                                                        {sec.productionType}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs font-bold text-farma-forest bg-farma-sand/50 px-2.5 py-1 rounded-md border border-farma-forest/10 group-hover:bg-farma-gold/10 group-hover:border-farma-gold/20 group-hover:text-farma-gold transition-colors tabular-nums">
                                                            {sec.capacity.toLocaleString()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button className="px-4 py-2 rounded-lg bg-white border border-farma-forest/10 text-farma-forest/80 text-[10px] font-bold uppercase tracking-widest group-hover:bg-farma-green group-hover:text-white group-hover:border-farma-green shadow-sm transition-colors duration-300">
                                                            Open Pen →
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center bg-white">
                                                    <span className="text-farma-forest/50 font-bold text-xs">
                                                        No pens match the current filter in this farm.
                                                    </span>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-farma-cream border border-farma-forest/10 rounded-xl p-20 text-center flex flex-col items-center justify-center shadow-sm">
                    <div className="w-16 h-16 rounded-full bg-farma-sand flex items-center justify-center text-farma-forest/30 mb-6 shadow-inner border border-farma-forest/5">
                        <IconEmptyState />
                    </div>
                    <h3 className="text-xl font-bold text-farma-forest mb-2">
                        {searchTerm || selectedFarmId !== 'ALL' ? 'No Results Found' : 'No Infrastructure Found'}
                    </h3>
                    <p className="text-sm text-farma-forest/60 font-medium max-w-sm leading-relaxed mb-6">
                        {searchTerm || selectedFarmId !== 'ALL'
                            ? `We couldn't find any farms or pens matching your current search and filter settings.`
                            : isProprietor 
                                ? 'You have not added any farms or pens yet. Head over to the Farm Setup page to create your first one.' 
                                : 'You have not been assigned to manage any farms or pens yet.'}
                    </p>

                    {(searchTerm || selectedFarmId !== 'ALL') && (
                        <button
                            type="button"
                            onClick={() => { setSearchTerm(''); setSelectedCategory('ALL'); setSelectedFarmId('ALL'); }}
                            className="px-5 py-2.5 bg-white border border-farma-forest/10 rounded-lg text-farma-green hover:bg-farma-forest/5 font-bold text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                        >
                            Clear All Filters
                        </button>
                    )}
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
            <div className="p-32 text-center flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-farma-green/20 border-t-farma-green rounded-full animate-spin mb-6"></div>
                <span className="text-farma-forest/50 text-xs font-bold uppercase tracking-widest">
                    Loading pen details...
                </span>
            </div>
        );
    }

    if (!section) {
        return (
            <div className="bg-farma-cream border border-farma-terracotta/20 rounded-xl p-16 text-center shadow-sm flex flex-col items-center max-w-xl mx-auto mt-16">
                <div className="w-16 h-16 rounded-full bg-farma-terracotta/10 text-farma-terracotta flex items-center justify-center mb-6 shadow-inner">
                    <IconErrorLarge />
                </div>
                <h3 className="text-2xl font-bold text-farma-forest mb-2">Pen Not Found</h3>
                <p className="text-farma-forest/60 mb-8 text-sm font-medium max-w-sm leading-relaxed">
                    The requested pen could not be found or you do not have permission to view its logs.
                </p>
                <button 
                    onClick={() => navigate('..', { relative: 'path' })} 
                    className="px-6 py-3 bg-farma-forest text-white rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-farma-green-light transition-colors cursor-pointer"
                >
                    Return to Global View
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

// ==========================================
// Reusable SVG Components
// ==========================================

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

const IconSearch = () => (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const IconFarm = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-8a2 2 0 012-2h4a2 2 0 012 2v8M13 21h8M15 21v-4a2 2 0 012-2h0a2 2 0 012 2v4M13 13h8M13 9h8M3 13h8M3 9h8M3 5h18" />
    </svg>
);

const IconPen = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

const IconCapacity = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
);

const IconFarmHeader = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const IconEmptyState = () => (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

const IconErrorLarge = () => (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);