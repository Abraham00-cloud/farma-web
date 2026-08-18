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
            
            {/* Navigation Header & Quick Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#101B14]/10 pb-5">
                <button
                    type="button"
                    onClick={() => navigate('..', { relative: 'path' })}
                    className="text-xs font-bold text-[#101B14]/70 hover:text-[#101B14] flex items-center space-x-2 cursor-pointer transition-colors w-fit"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Back to All Farms and Pens</span>
                </button>

                {!activeBatch && (
                    <button
                        type="button"
                        onClick={onStockSection}
                        className="px-6 py-3 rounded-lg bg-[#D9A63E] hover:bg-[#c99834] text-[#101B14] font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                        <span>+ Stock New Birds</span>
                    </button>
                )}
            </div>

            {/* Main Pen Overview Banner */}
            <div className="bg-[#FBF9F5] border border-[#101B14]/10 rounded-xl p-6 sm:p-8 shadow-xs relative overflow-hidden space-y-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div>
                        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                            <h2 className="text-3xl font-extrabold text-[#101B14] tracking-tight font-['Fraunces',serif]">
                                {section.name}
                            </h2>
                            <span
                                className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${
                                    activeBatch
                                        ? 'bg-[#D9A63E]/15 text-[#101B14] border border-[#D9A63E]/30'
                                        : 'bg-[#3F6B47]/15 text-[#3F6B47] border border-[#3F6B47]/30'
                                }`}
                            >
                                {activeBatch ? 'OCCUPIED' : 'READY / AVAILABLE'}
                            </span>
                        </div>
                        <p className="text-xs text-[#101B14]/60 font-mono mt-2 flex items-center gap-2 flex-wrap">
                            <span>Animal Type: <strong className="text-[#101B14]">{section.animalCategory}</strong></span>
                            <span>•</span>
                            <span>Purpose: <strong className="text-[#101B14]">{section.productionType}</strong></span>
                            <span>•</span>
                            <span>Pen ID: <strong className="text-[#101B14]">#{section.id}</strong></span>
                        </p>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-[#101B14]/10 text-left md:text-right shadow-xs shrink-0">
                        <span className="text-[10px] font-mono font-bold text-[#101B14]/50 uppercase tracking-widest block mb-1">
                            Maximum Bird Capacity
                        </span>
                        <span className="text-2xl font-extrabold font-mono text-[#101B14]">
                            {section.capacity.toLocaleString()} <span className="text-xs font-sans font-bold text-[#101B14]/60 uppercase">Birds</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Currently Active Flock Card */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-[#101B14] font-['Fraunces',serif]">
                    Active Flock
                </h3>

                {activeBatch ? (
                    <div
                        onClick={() => navigate(`batches/${activeBatch.id}`)}
                        className="bg-[#FBF9F5] border-2 border-[#3F6B47] rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-5 group"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <span className="text-[10px] font-mono font-bold text-[#3F6B47] uppercase tracking-widest block mb-1">
                                    ACTIVE BATCH #{activeBatch.id}
                                </span>
                                <h4 className="text-xl font-extrabold text-[#101B14] group-hover:text-[#3F6B47] transition-colors">
                                    {activeBatch.batchNumber}
                                </h4>
                            </div>
                            <button
                                type="button"
                                className="px-5 py-2.5 rounded-lg bg-[#3F6B47] text-white text-xs font-bold uppercase tracking-wider group-hover:bg-[#2d4f34] transition-colors shadow-xs w-fit"
                            >
                                View Flock Details →
                            </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#101B14]/10 font-mono text-xs">
                            <div className="bg-white p-3.5 rounded-lg border border-[#101B14]/10">
                                <span className="text-[#101B14]/50 text-[10px] block font-bold uppercase tracking-wider mb-1">Current Population</span>
                                <span className="font-extrabold text-[#101B14] text-base">
                                    {activeBatch.currentCount.toLocaleString()} <span className="text-[10px] font-sans font-normal text-[#101B14]/50">/ {activeBatch.initialCount.toLocaleString()}</span>
                                </span>
                            </div>
                            <div className="bg-white p-3.5 rounded-lg border border-[#101B14]/10">
                                <span className="text-[#101B14]/50 text-[10px] block font-bold uppercase tracking-wider mb-1">Total Mortality</span>
                                <span className="font-extrabold text-[#E76F51] text-base">
                                    {activeBatch.mortalityCount} Birds
                                </span>
                            </div>
                            <div className="bg-white p-3.5 rounded-lg border border-[#101B14]/10">
                                <span className="text-[#101B14]/50 text-[10px] block font-bold uppercase tracking-wider mb-1">Placement Date</span>
                                <span className="font-bold text-[#101B14]">{activeBatch.startDate}</span>
                            </div>
                            <div className="bg-white p-3.5 rounded-lg border border-[#101B14]/10">
                                <span className="text-[#101B14]/50 text-[10px] block font-bold uppercase tracking-wider mb-1">Expected Harvest</span>
                                <span className="font-bold text-[#101B14]">{activeBatch.expectedEndDate}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-[#FBF9F5] border border-[#101B14]/15 border-dashed rounded-xl p-10 text-center space-y-4 shadow-xs">
                        <div className="w-16 h-16 rounded-full bg-[#ECE6D6] flex items-center justify-center text-[#101B14]/30 mx-auto">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-[#101B14]">No Active Flock in This Pen</h4>
                            <p className="text-xs text-[#101B14]/60 font-medium max-w-sm mx-auto mt-1">
                                This pen is currently empty and clean. You can stock a new flock batch whenever you are ready.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onStockSection}
                            className="px-6 py-3 rounded-lg bg-[#D9A63E] hover:bg-[#c99834] text-[#101B14] font-extrabold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer inline-flex items-center space-x-2"
                        >
                            <span>+ Stock New Birds</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Historical Batches Ledger */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-[#101B14] font-['Fraunces',serif]">
                    Past Batches
                </h3>

                <div className="bg-[#FBF9F5] border border-[#101B14]/10 rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-[#101B14] min-w-[800px]">
                            {/* Table Header using Darker Cream Tone */}
                            <thead className="bg-[#DFD8C4] border-b-2 border-[#101B14]/15 text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/80 shadow-xs">
                                <tr>
                                    <th className="px-6 py-5 whitespace-nowrap">Batch Number</th>
                                    <th className="px-6 py-5 whitespace-nowrap">Placement Date</th>
                                    <th className="px-6 py-5 whitespace-nowrap">Harvest Date</th>
                                    <th className="px-6 py-5 whitespace-nowrap">Initial Stock</th>
                                    <th className="px-6 py-5 whitespace-nowrap">Mortality</th>
                                    <th className="px-6 py-5 whitespace-nowrap">Status</th>
                                    <th className="px-6 py-5 whitespace-nowrap text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#101B14]/10 bg-[#FBF9F5] font-mono text-xs">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-[#101B14]/50">
                                            Loading past flock history...
                                        </td>
                                    </tr>
                                ) : pastBatches.length > 0 ? (
                                    pastBatches.map((b) => (
                                        <tr 
                                            key={b.id} 
                                            onClick={() => navigate(`batches/${b.id}`)}
                                            className="group hover:bg-[#ECE6D6] hover:border-l-4 hover:border-l-[#3F6B47] transition-all cursor-pointer"
                                        >
                                            <td className="px-6 py-5 font-bold text-[#101B14] text-sm group-hover:text-[#3F6B47] transition-colors">
                                                {b.batchNumber}
                                            </td>
                                            <td className="px-6 py-5 font-medium">{b.startDate}</td>
                                            <td className="px-6 py-5 font-medium">{b.actualEndDate || b.expectedEndDate}</td>
                                            <td className="px-6 py-5 font-bold">{b.initialCount.toLocaleString()}</td>
                                            <td className="px-6 py-5 text-[#E76F51] font-bold">{b.mortalityCount}</td>
                                            <td className="px-6 py-5">
                                                <span className="px-3 py-1 rounded-full bg-[#101B14]/5 text-[#101B14]/70 text-[10px] font-bold uppercase border border-[#101B14]/10">
                                                    COMPLETED
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right font-sans">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`batches/${b.id}`);
                                                    }}
                                                    className="px-4 py-2 rounded-lg bg-white border border-[#101B14]/15 text-[#101B14] text-xs font-bold uppercase tracking-wider group-hover:bg-[#3F6B47] group-hover:text-white group-hover:border-[#3F6B47] shadow-xs transition-all duration-300"
                                                >
                                                    View Details →
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center bg-[#FBF9F5]">
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <svg className="w-10 h-10 text-[#101B14]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="text-[#101B14]/60 font-bold text-sm font-sans">
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