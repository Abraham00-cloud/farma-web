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
    
    const portalNamespace = pathname.split('/')[1];

    const [sections, setSections] = useState<SectionResponseDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);

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
        e.stopPropagation(); 
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

    const inputClassesGold = "w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm font-semibold focus:outline-none focus:ring-2 focus:border-farma-gold focus:ring-farma-gold/30 transition-shadow shadow-sm";
    const inputClassesGreen = "w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm font-semibold focus:outline-none focus:ring-2 focus:border-farma-green focus:ring-farma-green/30 transition-shadow shadow-sm";

    return (
        <div className="space-y-6 lg:space-y-8 font-sans max-w-7xl mx-auto pb-12">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-farma-forest/10 pb-5">
                <button
                    type="button"
                    onClick={onBack}
                    className="text-xs font-bold text-farma-forest/50 hover:text-farma-forest flex items-center space-x-2 cursor-pointer transition-colors w-fit uppercase tracking-wider"
                >
                    <IconBack />
                    <span>Back to Farms</span>
                </button>

                <button
                    type="button"
                    onClick={() => setShowSectionModal(true)}
                    className="px-6 py-3 rounded-lg bg-farma-gold hover:bg-farma-gold-hover text-farma-forest font-bold text-xs uppercase tracking-wider shadow-sm transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                >
                    <span>Add New Pen / House</span>
                </button>
            </div>

            <div className="bg-farma-cream border border-farma-forest/10 rounded-xl p-8 shadow-sm relative overflow-hidden space-y-8">
                
                <div className={`absolute top-0 inset-x-0 h-1.5 ${farm.isActive ? 'bg-farma-green' : 'bg-farma-terracotta'}`}></div>

                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                            <h2 className="text-3xl sm:text-4xl font-bold text-farma-forest tracking-tight">
                                {farm.name}
                            </h2>
                            <span
                                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest ${farm.isActive
                                        ? 'bg-farma-green/10 text-farma-green border border-farma-green/20'
                                        : 'bg-farma-terracotta/10 text-farma-terracotta border border-farma-terracotta/20'
                                    }`}
                            >
                                {farm.isActive ? 'Farm Active' : 'Farm Inactive'}
                            </span>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs">
                            <div className="flex items-start gap-2.5 text-farma-forest/70">
                                <div className="w-6 h-6 rounded-md bg-farma-sand flex items-center justify-center shrink-0 text-farma-forest/40 mt-0.5">
                                    <IconMapPin />
                                </div>
                                <span className="mt-1 font-medium">{farm.address}</span>
                            </div>
                            
                            <div className="flex items-center gap-2.5 text-farma-forest/70">
                                <div className="w-6 h-6 rounded-md bg-farma-sand flex items-center justify-center shrink-0 text-farma-forest/40">
                                    <IconLocation />
                                </div>
                                <span className="font-semibold bg-white px-3 py-1.5 rounded-lg border border-farma-forest/10 shadow-sm tabular-nums">
                                    GPS: {farm.latitude.toFixed(4)}, {farm.longitude.toFixed(4)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-6 bg-white p-4 rounded-xl border border-farma-forest/10 shadow-sm shrink-0">
                        <div>
                            <span className="text-farma-forest/40 block text-[10px] uppercase tracking-widest font-bold mb-1">Farm ID</span>
                            <span className="font-bold text-farma-forest text-lg tabular-nums">#{farm.id}</span>
                        </div>
                        <div className="h-10 w-px bg-farma-forest/10" />
                        <div>
                            <span className="text-farma-forest/40 block text-[10px] uppercase tracking-widest font-bold mb-1">Manager ID</span>
                            <span className="font-bold text-farma-green text-lg tabular-nums">#{farm.managerId}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-farma-forest/10">
                    <div className="bg-white p-5 rounded-xl border border-farma-forest/5 shadow-sm">
                        <span className="text-[10px] font-bold text-farma-forest/50 uppercase tracking-widest block mb-1">
                            Registered Pens
                        </span>
                        <div className="text-2xl font-bold text-farma-forest tabular-nums">
                            {sections.length} <span className="text-xs font-semibold text-farma-forest/40">Units</span>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-farma-forest/5 shadow-sm">
                        <span className="text-[10px] font-bold text-farma-forest/50 uppercase tracking-widest block mb-1">
                            Total Capacity
                        </span>
                        <div className="text-2xl font-bold text-farma-forest tabular-nums">
                            {sections.reduce((acc, curr) => acc + curr.capacity, 0).toLocaleString()} <span className="text-xs font-semibold text-farma-forest/40">Head</span>
                        </div>
                    </div>
                    <div className="bg-farma-green/5 p-5 rounded-xl border border-farma-green/10 shadow-sm">
                        <span className="text-[10px] font-bold text-farma-green uppercase tracking-widest block mb-1">
                            Active Flocks
                        </span>
                        <div className="text-2xl font-bold text-farma-green tabular-nums">
                            {sections.length} <span className="text-xs font-semibold opacity-60">Batches</span>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-farma-forest/5 shadow-sm">
                        <span className="text-[10px] font-bold text-farma-forest/50 uppercase tracking-widest block mb-1">
                            Biosecurity
                        </span>
                        <div className="text-2xl font-bold text-farma-green tabular-nums">
                            Level 1 <span className="text-xs font-semibold text-farma-forest/40">(Clean)</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xl font-bold text-farma-forest">
                        Containment Pens
                    </h3>
                    <span className="text-[10px] font-bold text-farma-forest/50 uppercase tracking-widest bg-white px-3 py-1.5 rounded-md border border-farma-forest/10 shadow-sm tabular-nums">
                        Total: {sections.length}
                    </span>
                </div>

                <div className="bg-farma-cream border border-farma-forest/10 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-farma-forest min-w-[800px]">
                            <thead className="bg-farma-sand/50 border-b border-farma-forest/10 text-[10px] font-bold uppercase tracking-widest text-farma-forest/60">
                                <tr>
                                    <th className="px-8 py-5 whitespace-nowrap">Pen ID</th>
                                    <th className="px-8 py-5 whitespace-nowrap">Designation</th>
                                    <th className="px-8 py-5 whitespace-nowrap">Category</th>
                                    <th className="px-8 py-5 whitespace-nowrap">Focus</th>
                                    <th className="px-8 py-5 whitespace-nowrap">Capacity</th>
                                    <th className="px-8 py-5 whitespace-nowrap text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-farma-forest/5 bg-transparent">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-16 text-center text-farma-forest/50 font-bold">
                                            Loading containment pens...
                                        </td>
                                    </tr>
                                ) : sections.length > 0 ? (
                                    sections.map((sec) => (
                                        <tr
                                            key={sec.id}
                                            onClick={() => navigate(`/${portalNamespace}/sections/${sec.id}`)}
                                            className="group hover:bg-white transition-colors cursor-pointer"
                                        >
                                            <td className="px-8 py-5 text-xs font-bold text-farma-forest/40 tabular-nums">
                                                #{sec.id}
                                            </td>
                                            <td className="px-8 py-5 font-bold text-farma-forest text-base group-hover:text-farma-green transition-colors">
                                                {sec.name}
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="px-3 py-1.5 rounded-md bg-farma-forest/5 text-farma-forest/70 text-[9px] font-bold uppercase tracking-widest border border-farma-forest/5">
                                                    {sec.animalCategory}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-xs font-bold text-farma-forest/60 uppercase tracking-wider">
                                                {sec.productionType}
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-sm font-bold text-farma-forest bg-farma-gold/10 px-3 py-1.5 rounded-md border border-farma-gold/20 tabular-nums">
                                                    {sec.capacity.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleOpenBatchModal(e, sec)}
                                                    className="px-5 py-2.5 rounded-lg bg-white border border-farma-forest/10 text-farma-forest/80 text-[10px] font-bold uppercase tracking-widest group-hover:bg-farma-green group-hover:text-white group-hover:border-farma-green shadow-sm transition-colors duration-300"
                                                >
                                                    Stock Birds
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-4">
                                                <div className="w-16 h-16 rounded-full bg-farma-sand flex items-center justify-center text-farma-forest/30 shadow-inner">
                                                    <IconEmptyState />
                                                </div>
                                                <p className="text-farma-forest/60 font-semibold text-sm">
                                                    No pens or houses registered under this farm yet.
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowSectionModal(true)}
                                                    className="text-farma-gold hover:text-farma-gold-hover font-bold text-xs uppercase tracking-wider pb-0.5 transition-colors cursor-pointer"
                                                >
                                                    Add First Pen / House
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

            {showSectionModal && (
                <div className="fixed inset-0 bg-farma-forest/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
                    <div className="bg-farma-cream border border-farma-forest/10 rounded-xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative">
                        <div className="h-1.5 w-full bg-farma-gold"></div>
                        
                        <div className="flex items-center justify-between border-b border-farma-forest/10 p-6 bg-white">
                            <div>
                                <h4 className="text-xl font-bold text-farma-forest tracking-tight">Add New Pen</h4>
                                <p className="text-[10px] font-bold text-farma-green uppercase tracking-widest mt-1.5">Register a containment zone</p>
                            </div>
                            <button onClick={() => setShowSectionModal(false)} className="text-farma-forest/40 hover:text-farma-terracotta hover:bg-farma-terracotta/10 bg-farma-forest/5 transition-colors p-2 rounded-lg cursor-pointer">
                                <IconClose />
                            </button>
                        </div>

                        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar">
                            {errorMessage && (
                                <div className="mb-6 p-4 rounded-lg bg-farma-terracotta/10 border border-farma-terracotta/20 text-farma-terracotta text-xs font-bold shadow-sm flex items-center gap-2">
                                    <IconWarning />
                                    {errorMessage}
                                </div>
                            )}

                            <form id="section-form" onSubmit={handleCreateSection} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/60 mb-1.5 pl-1">Pen / House Name *</label>
                                    <input type="text" required value={sectionForm.name} onChange={e => setSectionForm({...sectionForm, name: e.target.value})} placeholder="e.g. Broiler House A" className={inputClassesGold} />
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/60 mb-1.5 pl-1">Category</label>
                                        <select value={sectionForm.animalCategory} onChange={e => setSectionForm({...sectionForm, animalCategory: e.target.value as AnimalCategory})} className={`${inputClassesGold} cursor-pointer`}>
                                            <option value={AnimalCategory.POULTRY}>POULTRY</option>
                                            <option value={AnimalCategory.LIVESTOCK}>LIVESTOCK</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/60 mb-1.5 pl-1">Production</label>
                                        <select value={sectionForm.productionType} onChange={e => setSectionForm({...sectionForm, productionType: e.target.value as ProductionType})} className={`${inputClassesGold} cursor-pointer`}>
                                            <option value={ProductionType.Meat}>Meat</option>
                                            <option value={ProductionType.Milk}>Dairy</option>
                                            <option value={ProductionType.Egg}>Eggs</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/60 mb-1.5 pl-1">Max Capacity (Headcount) *</label>
                                    <input type="number" required min={1} value={sectionForm.capacity} onChange={e => setSectionForm({...sectionForm, capacity: Number(e.target.value)})} className={`${inputClassesGold} tabular-nums`} />
                                </div>
                            </form>
                        </div>

                        <div className="p-6 bg-farma-sand/50 border-t border-farma-forest/10 flex justify-end gap-3 shrink-0 z-10">
                            <button onClick={() => setShowSectionModal(false)} className="px-5 py-3 rounded-lg bg-transparent hover:bg-farma-forest/5 text-farma-forest/70 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer">Cancel</button>
                            <button type="submit" form="section-form" disabled={submitting} className="px-6 py-3 rounded-lg bg-farma-gold text-farma-forest font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-farma-gold-hover transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50">
                                {submitting ? 'Saving...' : 'Save Pen'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showBatchModal && selectedSectionForBatch && (
                <div className="fixed inset-0 bg-farma-forest/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
                    <div className="bg-farma-cream border border-farma-forest/10 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative">
                        <div className="h-1.5 w-full bg-farma-green"></div>
                        
                        <div className="flex items-center justify-between border-b border-farma-forest/10 p-6 bg-white">
                            <div>
                                <h4 className="text-xl font-bold text-farma-forest tracking-tight">Stock Livestock</h4>
                                <p className="text-[10px] font-bold text-farma-green uppercase tracking-widest mt-1.5">Deploy flock to {selectedSectionForBatch.name}</p>
                            </div>
                            <button onClick={() => {setShowBatchModal(false); setSelectedSectionForBatch(null);}} className="text-farma-forest/40 hover:text-farma-terracotta hover:bg-farma-terracotta/10 bg-farma-forest/5 transition-colors p-2 rounded-lg cursor-pointer">
                                <IconClose />
                            </button>
                        </div>

                        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar">
                            {errorMessage && (
                                <div className="mb-6 p-4 rounded-lg bg-farma-terracotta/10 border border-farma-terracotta/20 text-farma-terracotta text-xs font-bold shadow-sm flex items-center gap-2">
                                    <IconWarning />
                                    {errorMessage}
                                </div>
                            )}

                            <form id="batch-form" onSubmit={handleCreateBatch} className="space-y-6">
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/60 mb-1.5 pl-1">Initial Count *</label>
                                        <input type="number" required min={1} max={selectedSectionForBatch.capacity} value={batchForm.initialCount} onChange={e => setBatchForm({...batchForm, initialCount: Number(e.target.value)})} className={`${inputClassesGreen} tabular-nums`} />
                                        <span className="text-[9px] text-farma-forest/50 mt-1.5 pl-1 block font-bold uppercase tracking-widest tabular-nums">Max: {selectedSectionForBatch.capacity}</span>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/60 mb-1.5 pl-1">Breed</label>
                                        <select value={batchForm.breed} onChange={e => setBatchForm({...batchForm, breed: e.target.value as Breed})} className={`${inputClassesGreen} cursor-pointer`}>
                                            <option value={Breed.COBB_500}>COBB 500</option>
                                            <option value={Breed.ROSS_308}>ROSS 308</option>
                                            <option value={Breed.ISA_BROWN}>ISA BROWN</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/60 mb-1.5 pl-1">Start Date *</label>
                                        <input type="date" required value={batchForm.startDate} onChange={e => setBatchForm({...batchForm, startDate: e.target.value})} className={`${inputClassesGreen} tabular-nums cursor-pointer`} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/60 mb-1.5 pl-1">Est. End Date *</label>
                                        <input type="date" required value={batchForm.expectedEndDate} onChange={e => setBatchForm({...batchForm, expectedEndDate: e.target.value})} className={`${inputClassesGreen} tabular-nums cursor-pointer`} />
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-6 bg-farma-sand/50 border-t border-farma-forest/10 flex justify-end gap-3 shrink-0 z-10">
                            <button onClick={() => {setShowBatchModal(false); setSelectedSectionForBatch(null);}} className="px-5 py-3 rounded-lg bg-transparent hover:bg-farma-forest/5 text-farma-forest/70 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer">Cancel</button>
                            <button type="submit" form="batch-form" disabled={submitting} className="px-6 py-3 rounded-lg bg-farma-green text-white font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-farma-green-light transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50">
                                {submitting ? 'Stocking...' : 'Deploy Batch'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

// ==========================================
// Reusable SVG Components
// ==========================================

const IconBack = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const IconMapPin = () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const IconLocation = () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
);

const IconEmptyState = () => (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
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