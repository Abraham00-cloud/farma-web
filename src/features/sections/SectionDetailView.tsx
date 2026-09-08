import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { batchService } from '../../services/batchService';
import type { SectionResponseDto } from '../../types/infrastructure';
import type { BatchResponseDto } from '../../types/batch';

interface SectionDetailViewProps {
    section: SectionResponseDto;
    onStockSection: () => void;
}

export const SectionDetailView: React.FC<SectionDetailViewProps> = ({
    section,
    onStockSection,
}) => {
    const navigate = useNavigate();
    const [batches, setBatches] = useState<BatchResponseDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;

        const fetchSectionBatches = async () => {
            try {
                const sectionBatches = await batchService.getBatchesBySection(section.id);
                if (isMounted) {
                    setBatches(sectionBatches);
                }
            } catch {
                // Fallback state
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchSectionBatches();

        return () => {
            isMounted = false;
        };
    }, [section.id]);

    const activeBatch = batches.find((b) => b.status === 'ACTIVE');
    const pastBatches = batches.filter((b) => b.status === 'COMPLETED');

    return (
        <div className="space-y-8 font-sans max-w-7xl mx-auto pb-16">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-farma-forest/10 pb-6">
                <button
                    type="button"
                    onClick={() => navigate('..', { relative: 'path' })}
                    className="text-[10px] font-bold text-farma-forest/50 hover:text-farma-forest uppercase tracking-widest flex items-center space-x-2 cursor-pointer transition-colors w-fit"
                >
                    <IconBack />
                    <span>Back to Infrastructure</span>
                </button>

                {!activeBatch && (
                    <button
                        type="button"
                        onClick={onStockSection}
                        className="px-6 py-3 rounded-lg bg-farma-gold text-farma-forest font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-farma-gold-hover transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                    >
                        <span>Stock New Birds</span>
                    </button>
                )}
            </div>

            <div className="bg-farma-cream border border-farma-forest/10 rounded-xl p-8 shadow-sm relative overflow-hidden space-y-8">
                
                <div className={`absolute top-0 inset-x-0 h-1.5 ${activeBatch ? 'bg-farma-green' : 'bg-farma-gold'}`}></div>

                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-4 flex-wrap gap-y-2">
                            <h2 className="text-3xl sm:text-4xl font-bold text-farma-forest tracking-tight">
                                {section.name}
                            </h2>
                            <span
                                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest border ${
                                    activeBatch
                                        ? 'bg-farma-green/10 text-farma-green border-farma-green/20'
                                        : 'bg-farma-gold/10 text-farma-gold border-farma-gold/20'
                                }`}
                            >
                                {activeBatch ? 'Currently Occupied' : 'Ready for Stocking'}
                            </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                            <div className="bg-white px-3 py-1.5 rounded-md border border-farma-forest/10 shadow-sm flex items-center gap-2">
                                <span className="text-farma-forest/40 font-bold uppercase tracking-widest text-[9px]">Animal:</span>
                                <span className="text-farma-forest font-bold uppercase tracking-wider">{section.animalCategory}</span>
                            </div>
                            <div className="bg-white px-3 py-1.5 rounded-md border border-farma-forest/10 shadow-sm flex items-center gap-2">
                                <span className="text-farma-forest/40 font-bold uppercase tracking-widest text-[9px]">Purpose:</span>
                                <span className="text-farma-forest font-bold uppercase tracking-wider">{section.productionType}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-6 bg-white p-5 rounded-xl border border-farma-forest/10 shadow-sm shrink-0">
                        <div>
                            <span className="text-farma-forest/40 block text-[10px] font-bold uppercase tracking-widest mb-1">
                                Pen ID
                            </span>
                            <span className="font-bold text-farma-forest text-xl tabular-nums">
                                #{section.id.toString().padStart(4, '0')}
                            </span>
                        </div>
                        <div className="h-10 w-px bg-farma-forest/10" />
                        <div>
                            <span className="text-farma-forest/40 block text-[10px] font-bold uppercase tracking-widest mb-1">
                                Maximum Capacity
                            </span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="font-bold text-farma-forest text-xl tabular-nums">
                                    {section.capacity.toLocaleString()}
                                </span>
                                <span className="text-xs font-bold text-farma-forest/50 uppercase tracking-wider">Birds</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-5">
                <h3 className="text-xl font-bold text-farma-forest">
                    Active Flock
                </h3>

                {activeBatch ? (
                    <div
                        onClick={() => navigate(`batches/${activeBatch.id}`)}
                        className="bg-white border border-farma-green rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow cursor-pointer space-y-8 group relative overflow-hidden"
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-lg bg-farma-green/10 border border-farma-green/20 flex items-center justify-center text-farma-green shadow-inner">
                                    <IconFlock />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-farma-green uppercase tracking-widest block mb-1">
                                        Active Batch
                                    </span>
                                    <h4 className="text-xl font-bold text-farma-forest group-hover:text-farma-green transition-colors tabular-nums">
                                        {activeBatch.batchNumber}
                                    </h4>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="px-5 py-2.5 rounded-lg bg-farma-forest text-white text-xs font-bold uppercase tracking-wider group-hover:bg-farma-green-light transition-colors shadow-sm w-fit flex items-center gap-2"
                            >
                                <span>View Flock Details</span>
                                <span>→</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                            <div className="bg-farma-cream p-5 rounded-lg border border-farma-forest/5 shadow-sm">
                                <span className="text-farma-forest/50 text-[10px] block font-bold uppercase tracking-widest mb-1.5">
                                    Current Population
                                </span>
                                <div className="flex items-baseline gap-2">
                                    <span className="font-bold text-farma-forest text-2xl tabular-nums">
                                        {activeBatch.currentCount.toLocaleString()}
                                    </span>
                                    <span className="text-xs font-semibold text-farma-forest/40 tabular-nums">
                                        / {activeBatch.initialCount.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-farma-terracotta/5 p-5 rounded-lg border border-farma-terracotta/10 shadow-sm">
                                <span className="text-farma-terracotta/70 text-[10px] block font-bold uppercase tracking-widest mb-1.5">
                                    Total Mortality
                                </span>
                                <div className="flex items-baseline gap-2">
                                    <span className="font-bold text-farma-terracotta text-2xl tabular-nums">
                                        {activeBatch.mortalityCount}
                                    </span>
                                    <span className="text-xs font-bold text-farma-terracotta/60 uppercase tracking-wider">
                                        Birds
                                    </span>
                                </div>
                            </div>

                            <div className="bg-farma-cream p-5 rounded-lg border border-farma-forest/5 shadow-sm">
                                <span className="text-farma-forest/50 text-[10px] block font-bold uppercase tracking-widest mb-1.5">
                                    Placement Date
                                </span>
                                <span className="font-bold text-farma-forest text-lg tabular-nums">
                                    {activeBatch.startDate}
                                </span>
                            </div>

                            <div className="bg-farma-cream p-5 rounded-lg border border-farma-forest/5 shadow-sm">
                                <span className="text-farma-forest/50 text-[10px] block font-bold uppercase tracking-widest mb-1.5">
                                    Expected Harvest
                                </span>
                                <span className="font-bold text-farma-forest text-lg tabular-nums">
                                    {activeBatch.expectedEndDate}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-farma-cream border border-farma-forest/15 border-dashed rounded-xl p-16 text-center space-y-4 shadow-sm flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-farma-sand flex items-center justify-center text-farma-forest/30 mx-auto shadow-inner border border-farma-forest/5">
                            <IconEmptyFlock />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-farma-forest">No Active Flock in This Pen</h4>
                            <p className="text-sm text-farma-forest/50 font-medium max-w-sm mx-auto mt-2 leading-relaxed">
                                This pen is currently empty, sanitized, and available. You can deploy a new batch of livestock whenever you are ready.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onStockSection}
                            className="mt-2 px-6 py-3 rounded-lg bg-farma-gold text-farma-forest font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-farma-gold-hover transition-colors cursor-pointer inline-flex items-center space-x-2"
                        >
                            <span>Stock New Birds</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="space-y-5">
                <h3 className="text-xl font-bold text-farma-forest">
                    Historical Batches
                </h3>

                <div className="bg-farma-cream border border-farma-forest/10 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-farma-forest min-w-[800px]">
                            <thead className="bg-farma-sand/50 border-b border-farma-forest/10 text-[10px] font-bold uppercase tracking-widest text-farma-forest/60">
                                <tr>
                                    <th className="px-6 py-4 whitespace-nowrap">Batch Number</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Placement Date</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Harvest Date</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Initial Stock</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Mortality</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Status</th>
                                    <th className="px-6 py-4 whitespace-nowrap text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-farma-forest/5 bg-transparent">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center text-farma-forest/50 font-bold">
                                            Loading historical ledger...
                                        </td>
                                    </tr>
                                ) : pastBatches.length > 0 ? (
                                    pastBatches.map((b) => (
                                        <tr 
                                            key={b.id} 
                                            onClick={() => navigate(`batches/${b.id}`)}
                                            className="group hover:bg-white transition-colors cursor-pointer"
                                        >
                                            <td className="px-6 py-4 font-bold text-farma-forest text-sm group-hover:text-farma-green transition-colors tabular-nums">
                                                {b.batchNumber}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-farma-forest/70 tabular-nums">{b.startDate}</td>
                                            <td className="px-6 py-4 font-medium text-farma-forest/70 tabular-nums">{b.actualEndDate || b.expectedEndDate}</td>
                                            <td className="px-6 py-4 font-bold text-farma-forest tabular-nums">{b.initialCount.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-farma-terracotta font-bold tabular-nums">{b.mortalityCount}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 rounded-md bg-farma-forest/5 text-farma-forest/70 text-[9px] font-bold uppercase tracking-widest border border-farma-forest/5">
                                                    COMPLETED
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`batches/${b.id}`);
                                                    }}
                                                    className="px-4 py-2 rounded-lg bg-white border border-farma-forest/10 text-farma-forest/80 text-[10px] font-bold uppercase tracking-widest group-hover:bg-farma-green group-hover:text-white group-hover:border-farma-green shadow-sm transition-colors duration-300"
                                                >
                                                    Open Ledger →
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <IconHistoryEmpty />
                                                <span className="text-farma-forest/60 font-semibold text-sm">
                                                    No past completed batches recorded for this pen yet.
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
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

const IconFlock = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
);

const IconEmptyFlock = () => (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
);

const IconHistoryEmpty = () => (
    <svg className="w-10 h-10 text-farma-forest/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);