import React, { useState, useEffect } from 'react';
import { batchService } from '../../services/batchService';
import type { SectionResponseDto } from '../../types/infrastructure';
import type { BatchResponseDto } from '../../types/batch';

interface SectionDetailViewProps {
    section: SectionResponseDto;
    onBack: () => void;
    onSelectBatch: (batch: BatchResponseDto) => void;
    onStockSection: () => void;
}

export const SectionDetailView: React.FC<SectionDetailViewProps> = ({
    section,
    onBack,
    onSelectBatch,
    onStockSection,
}) => {
    const [batches, setBatches] = useState<BatchResponseDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;

        const fetchSectionBatches = async () => {
            try {
                // Query directly by section ID
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
        <div className="space-y-6">
            {/* Top Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center space-x-1 cursor-pointer"
                >
                    <span>← Back to All Containment Fleet</span>
                </button>

                {!activeBatch && (
                    <button
                        type="button"
                        onClick={onStockSection}
                        className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition cursor-pointer"
                    >
                        + Stock New Flock Batch
                    </button>
                )}
            </div>

            {/* Section Spec Banner */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center space-x-3">
                            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                                {section.name}
                            </h2>
                            <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${activeBatch
                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    }`}
                            >
                                {activeBatch ? 'OCCUPIED' : 'UNLOCKED / AVAILABLE'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-1">
                            Category: {section.animalCategory} • Focus: {section.productionType} • Section ID: #{section.id}
                        </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-right">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
                            Holding Capacity
                        </span>
                        <span className="text-xl font-extrabold text-slate-900">
                            {section.capacity.toLocaleString()} Animals
                        </span>
                    </div>
                </div>
            </div>

            {/* Currently Active Cohort Card */}
            <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900">Active Flock Cohort</h3>

                {activeBatch ? (
                    <div
                        onClick={() => onSelectBatch(activeBatch)}
                        className="bg-white border-2 border-emerald-600 rounded-2xl p-5 shadow-sm hover:shadow-md transition cursor-pointer space-y-4 group"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase">
                                    ACTIVE BATCH #{activeBatch.id}
                                </span>
                                <h4 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition">
                                    {activeBatch.batchNumber}
                                </h4>
                            </div>
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">
                                View Deep Dossier →
                            </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 font-mono text-xs">
                            <div>
                                <span className="text-slate-400 text-[10px] block uppercase">Live Population</span>
                                <span className="font-bold text-slate-900 text-sm">
                                    {activeBatch.currentCount.toLocaleString()} / {activeBatch.initialCount.toLocaleString()}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-400 text-[10px] block uppercase">Mortalities Logged</span>
                                <span className="font-bold text-rose-600 text-sm">
                                    {activeBatch.mortalityCount} Head
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-400 text-[10px] block uppercase">Placed Date</span>
                                <span className="font-bold text-slate-800">{activeBatch.startDate}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 text-[10px] block uppercase">Expected Harvest</span>
                                <span className="font-bold text-slate-800">{activeBatch.expectedEndDate}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-8 text-center space-y-3">
                        <p className="text-xs font-mono text-slate-500">
                            This pen is currently empty and sanitized. Ready for a new flock placement.
                        </p>
                        <button
                            type="button"
                            onClick={onStockSection}
                            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition cursor-pointer"
                        >
                            + Stock New Flock Batch
                        </button>
                    </div>
                )}
            </div>

            {/* Historical Batch Cycles Ledger */}
            <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900">Historical Cycles Ledger</h3>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs font-sans text-slate-700">
                        <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="px-5 py-3.5">Batch Code</th>
                                <th className="px-5 py-3.5">Placed</th>
                                <th className="px-5 py-3.5">Harvested</th>
                                <th className="px-5 py-3.5">Initial Stock</th>
                                <th className="px-5 py-3.5">Casualties</th>
                                <th className="px-5 py-3.5">Status</th>
                                <th className="px-5 py-3.5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                                        Loading section history...
                                    </td>
                                </tr>
                            ) : pastBatches.length > 0 ? (
                                pastBatches.map((b) => (
                                    <tr key={b.id} className="hover:bg-slate-50/80 transition">
                                        <td className="px-5 py-4 font-bold text-slate-900">{b.batchNumber}</td>
                                        <td className="px-5 py-4">{b.startDate}</td>
                                        <td className="px-5 py-4">{b.actualEndDate || b.expectedEndDate}</td>
                                        <td className="px-5 py-4 font-bold">{b.initialCount.toLocaleString()}</td>
                                        <td className="px-5 py-4 text-rose-600 font-bold">{b.mortalityCount}</td>
                                        <td className="px-5 py-4">
                                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                                                COMPLETED
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() => onSelectBatch(b)}
                                                className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                                            >
                                                View Dossier →
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                                        No completed historical cycles recorded for this pen yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};