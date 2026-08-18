import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { infrastructureService } from '../../services/infrastructureService';
import { batchService } from '../../services/batchService';
import { financeService } from '../../services/financeService';
import { transactionService } from '../../services/transactionService';
import type { FarmResponseDto } from '../../types/infrastructure';
import type { BatchResponseDto } from '../../types/batch';
import type { FarmFinancialOverviewDto, BatchFinancialPnlResponseDto } from '../../types/finance';
import type {
    TransactionRequestDto,
    TransactionResponseDto,
    TransactionCategory,
    TransactionType,
} from '../../types/transaction';

interface FinancialWorkspaceViewProps {
    organisationId: number;
    userRole?: string;
    currentUserId?: number;
}

export const FinancialWorkspaceView: React.FC<FinancialWorkspaceViewProps> = ({
    organisationId,
    userRole = 'PROPRIETOR',
    currentUserId
}) => {
    const isProprietor = userRole?.toUpperCase() === 'PROPRIETOR' || userRole?.toUpperCase() === 'ADMIN';

    const [farms, setFarms] = useState<FarmResponseDto[]>([]);
    const [selectedFarmId, setSelectedFarmId] = useState<number | ''>('');
    const [batches, setBatches] = useState<BatchResponseDto[]>([]);
    const [selectedBatchId, setSelectedBatchId] = useState<number | 'ALL'>('ALL');

    // Sub-tab view mode
    const [activeTabMode, setActiveTabMode] = useState<'ANALYTICS' | 'LEDGER'>('ANALYTICS');

    // Analytics Data States
    const [farmOverview, setFarmOverview] = useState<FarmFinancialOverviewDto | null>(null);
    const [batchPnl, setBatchPnl] = useState<BatchFinancialPnlResponseDto | null>(null);
    const [transactions, setTransactions] = useState<TransactionResponseDto[]>([]);

    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Modal Control
    const [showTxModal, setShowTxModal] = useState<boolean>(false);

    // NEW: Export Modal Control
    const [showExportModal, setShowExportModal] = useState<boolean>(false);
    const [exporting, setExporting] = useState<boolean>(false);

    const getTodayISOString = () => new Date().toISOString().split('T')[0];

    const [txForm, setTxForm] = useState<Omit<TransactionRequestDto, 'organisationId' | 'batchId' | 'farmId'> & { batchId: number | '' }>({
        amount: 0,
        transactionType: 'CREDIT',
        transactionCategory: 'LIVESTOCK_SALE',
        description: '',
        transactionDate: getTodayISOString(),
        isCashFlow: true,
        batchId: '',
    });

    // NEW: Export Form State (Defaults to 1st of current month to today)
    const [exportForm, setExportForm] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: getTodayISOString()
    });

    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            setLoading(true);
            try {
                let farmList = await infrastructureService.getFarmsByOrganisation(organisationId);
                if (!isProprietor && currentUserId) {
                    farmList = farmList.filter((farm) => farm.managerId === currentUserId);
                }
                if (isMounted && Array.isArray(farmList) && farmList.length > 0) {
                    setFarms(farmList);
                    setSelectedFarmId(farmList[0].id);
                }
            } catch {
                if (isMounted) setErrorMessage('Could not load farm facilities.');
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        init();
        return () => { isMounted = false; };
    }, [organisationId, isProprietor, currentUserId]);

    useEffect(() => {
        let isMounted = true;
        if (!selectedFarmId) return;

        const fetchBatches = async () => {
            try {
                const sections = await infrastructureService.getSectionsByFarm(Number(selectedFarmId));
                const batchPromises = (sections || []).map((sec) =>
                    batchService.getBatchesBySection(sec.id).catch(() => [])
                );
                const nested = await Promise.all(batchPromises);
                const flatBatches = nested.flat();

                if (isMounted) {
                    setBatches(flatBatches);
                    setTxForm((prev) => ({ ...prev, batchId: '' }));
                }
            } catch {
                if (isMounted) setBatches([]);
            }
        };
        fetchBatches();
        return () => { isMounted = false; };
    }, [selectedFarmId]);

    useEffect(() => {
        let isMounted = true;
        if (!selectedFarmId) return;

        const loadData = async () => {
            setLoading(true);
            setErrorMessage(null);
            try {
                if (selectedBatchId !== 'ALL') {
                    const bId = Number(selectedBatchId);
                    const [pnlData, txList] = await Promise.all([
                        financeService.getBatchPnl(bId).catch(() => null),
                        transactionService.getBatchLedger(bId, organisationId).catch(() => []),
                    ]);
                    if (isMounted) {
                        setBatchPnl(pnlData);
                        setFarmOverview(null);
                        setTransactions(Array.isArray(txList) ? txList : []);
                    }
                } else {
                    const fId = Number(selectedFarmId);
                    const [overviewData, txList] = await Promise.all([
                        financeService.getFarmOverview(fId).catch(() => null),
                        transactionService.getFarmTransactions(fId, organisationId).catch(() => []),
                    ]);
                    if (isMounted) {
                        setFarmOverview(overviewData);
                        setBatchPnl(null);
                        setTransactions(Array.isArray(txList) ? txList : []);
                    }
                }
            } catch {
                if (isMounted) setErrorMessage('Error synchronizing financial analytics.');
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        loadData();
        return () => { isMounted = false; };
    }, [selectedFarmId, selectedBatchId, organisationId]);

    const reloadData = async () => {
        if (!selectedFarmId) return;
        try {
            if (selectedBatchId !== 'ALL') {
                const bId = Number(selectedBatchId);
                const [pnlData, txList] = await Promise.all([
                    financeService.getBatchPnl(bId),
                    transactionService.getBatchLedger(bId, organisationId),
                ]);
                setBatchPnl(pnlData);
                setTransactions(Array.isArray(txList) ? txList : []);
            } else {
                const fId = Number(selectedFarmId);
                const [overviewData, txList] = await Promise.all([
                    financeService.getFarmOverview(fId),
                    transactionService.getFarmTransactions(fId, organisationId),
                ]);
                setFarmOverview(overviewData);
                setTransactions(Array.isArray(txList) ? txList : []);
            }
        } catch {
            // Fallback
        }
    };

    const handleCreateTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (txForm.amount <= 0) return;

        setSubmitting(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        const payload: TransactionRequestDto = {
            ...txForm,
            organisationId,
            farmId: selectedFarmId ? Number(selectedFarmId) : undefined,
            amount: Number(txForm.amount),
            batchId: txForm.batchId === '' ? undefined : Number(txForm.batchId),
        };

        try {
            await transactionService.createTransaction(payload);
            setSuccessMessage('Transaction recorded successfully!');
            setShowTxModal(false);

            setTxForm({
                amount: 0,
                transactionType: 'CREDIT',
                transactionCategory: 'LIVESTOCK_SALE',
                description: '',
                transactionDate: getTodayISOString(),
                isCashFlow: true,
                batchId: '',
            });
            await reloadData();
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setErrorMessage(typeof err.response?.data === 'string' ? err.response.data : err.response?.data?.message || 'Failed to record transaction.');
            } else {
                setErrorMessage('An unexpected error occurred.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // NEW: Handle CSV Export
    const handleExport = async (e: React.FormEvent) => {
        e.preventDefault();
        setExporting(true);
        setErrorMessage(null);
        try {
            await transactionService.exportLedgerToCsv(organisationId, exportForm.startDate, exportForm.endDate);
            setShowExportModal(false);
            setSuccessMessage('Audit downloaded successfully!');
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch {
            setErrorMessage('Failed to generate audit CSV. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    // Derived Analytics Values
    const activeRevenue = batchPnl ? batchPnl.totalRevenue || 0 : farmOverview ? farmOverview.totalRevenue || 0 : 0;
    const activeExpenses = batchPnl ? batchPnl.totalExpenses || 0 : farmOverview ? farmOverview.totalExpenses || 0 : 0;
    const activeNetProfit = batchPnl ? batchPnl.netProfitOrLoss || 0 : farmOverview ? farmOverview.totalNetProfit || 0 : 0;
    const activeMargin = batchPnl ? batchPnl.profitMarginPercentage || 0 : farmOverview ? farmOverview.overallMarginPercentage || 0 : 0;
    const expenseBreakdown = batchPnl ? batchPnl.expenseBreakdownChart || [] : farmOverview ? farmOverview.expenseBreakdownChart || [] : [];

    return (
        <div className="space-y-6 lg:space-y-8 font-sans max-w-7xl mx-auto pb-12">

            {/* 1. TOP EXECUTIVE HEADER BAR */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-[#101B14]/10 pb-5">
                <div>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-[#101B14] tracking-tight font-['Fraunces',serif]">
                        {isProprietor ? 'Financial Intelligence & P&L' : 'Site Financials & Ledger'}
                    </h3>
                    <p className="text-sm text-[#101B14]/70 font-medium mt-1">
                        Real-time unit economics, expense tracking, and cohort profitability margins.
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {/* NEW: Export Button */}
                    <button
                        type="button"
                        onClick={() => setShowExportModal(true)}
                        className="px-5 py-3 rounded-lg bg-white border border-[#101B14]/20 hover:bg-[#FBF9F5] text-[#101B14] font-extrabold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center space-x-2 cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span className="hidden sm:inline">Export Audit</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowTxModal(true)}
                        className="px-5 py-3 rounded-lg bg-[#D9A63E] hover:bg-[#c99834] text-[#101B14] font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Post Receipt</span>
                    </button>
                </div>
            </div>

            {/* Inline Feedback Alerts */}
            {errorMessage && (
                <div className="p-4 rounded-xl bg-[#E76F51]/10 border border-[#E76F51]/30 text-[#E76F51] text-xs font-bold shadow-sm">
                    {errorMessage}
                </div>
            )}
            {successMessage && (
                <div className="p-4 rounded-xl bg-[#2A5C38]/10 border border-[#2A5C38]/30 text-[#2A5C38] text-xs font-bold shadow-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {successMessage}
                </div>
            )}

            {/* 2. MODE NAVIGATION TABS & SCOPE PICKERS */}
            <div className="bg-[#FBF9F5] border border-[#101B14]/10 rounded-xl p-5 shadow-xs space-y-5">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 border-b border-[#101B14]/10 pb-5">

                    {/* View Mode Tabs */}
                    <div className="flex items-center space-x-2 bg-white border border-[#101B14]/10 p-1.5 rounded-lg w-fit shrink-0">
                        <button
                            type="button"
                            onClick={() => setActiveTabMode('ANALYTICS')}
                            className={`px-5 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${activeTabMode === 'ANALYTICS'
                                    ? 'bg-[#101B14] text-white shadow-sm'
                                    : 'text-[#101B14]/60 hover:text-[#101B14] hover:bg-[#101B14]/5'
                                }`}
                        >
                            📊 Analytics
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTabMode('LEDGER')}
                            className={`px-5 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${activeTabMode === 'LEDGER'
                                    ? 'bg-[#101B14] text-white shadow-sm'
                                    : 'text-[#101B14]/60 hover:text-[#101B14] hover:bg-[#101B14]/5'
                                }`}
                        >
                            💳 Ledger ({transactions.length})
                        </button>
                    </div>

                    {/* Scope Dropdowns */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                        <div className="w-full sm:w-auto flex flex-col">
                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#101B14]/50 mb-1 ml-1">Facility Scope</span>
                            <select
                                value={selectedFarmId}
                                onChange={(e) => {
                                    setSelectedFarmId(Number(e.target.value));
                                    setSelectedBatchId('ALL');
                                }}
                                disabled={!isProprietor && farms.length <= 1}
                                className="w-full sm:w-64 px-4 py-3 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#2A5C38]/30 transition-all shadow-sm appearance-none cursor-pointer disabled:opacity-50"
                                style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23101B14' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                            >
                                {farms.map((f) => (
                                    <option key={f.id} value={f.id}>🏢 {f.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="w-full sm:w-auto flex flex-col">
                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#101B14]/50 mb-1 ml-1">Cohort Scope</span>
                            <select
                                value={selectedBatchId}
                                onChange={(e) => setSelectedBatchId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                                className="w-full sm:w-64 px-4 py-3 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#2A5C38]/30 transition-all shadow-sm appearance-none cursor-pointer"
                                style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23101B14' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                            >
                                <option value="ALL">🌐 All Batches (Overview)</option>
                                {batches.map((b) => (
                                    <option key={b.id} value={b.id}>🛖 {b.sectionName} (#{b.batchNumber})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* MODE 1: EXECUTIVE P&L ANALYTICS */}
                {activeTabMode === 'ANALYTICS' && (
                    <div className="space-y-6 pt-2">
                        {/* KPI Revenue vs Expense Gauge Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                            {/* Revenue Card */}
                            <div className="bg-[#2A5C38]/5 border border-[#2A5C38]/20 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                                <span className="text-[10px] font-mono font-bold text-[#2A5C38] uppercase tracking-widest block mb-1">
                                    Gross Revenue (Inflow)
                                </span>
                                <div className="text-3xl font-extrabold text-[#2A5C38] font-mono">
                                    ₦{activeRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                            </div>

                            {/* Expenses Card */}
                            <div className="bg-[#E76F51]/5 border border-[#E76F51]/20 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                                <span className="text-[10px] font-mono font-bold text-[#E76F51] uppercase tracking-widest block mb-1">
                                    Operational Expenses
                                </span>
                                <div className="text-3xl font-extrabold text-[#E76F51] font-mono">
                                    ₦{activeExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                            </div>

                            {/* Net Profit Card */}
                            <div className={`rounded-2xl p-6 shadow-xs flex flex-col justify-between relative overflow-hidden ${activeNetProfit >= 0 ? 'bg-[#101B14] border border-[#101B14]' : 'bg-[#101B14] border border-[#E76F51]'
                                }`}>
                                {/* Background Accent */}
                                <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20 -mr-10 -mt-10 ${activeNetProfit >= 0 ? 'bg-[#D9A63E]' : 'bg-[#E76F51]'
                                    }`}></div>

                                <div className="flex items-center justify-between relative z-10 mb-2">
                                    <span className="text-[10px] font-mono font-bold text-white/60 uppercase tracking-widest">
                                        Bottom Line Profit
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-widest border ${activeNetProfit >= 0
                                            ? 'bg-[#2A5C38]/20 text-[#2A5C38] border-[#2A5C38]/30 bg-white'
                                            : 'bg-[#E76F51]/20 text-[#E76F51] border-[#E76F51]/30 bg-white'
                                        }`}>
                                        {activeNetProfit >= 0 ? 'Profitable' : 'Deficit'}
                                    </span>
                                </div>
                                <div className={`text-3xl font-extrabold font-mono relative z-10 ${activeNetProfit >= 0 ? 'text-white' : 'text-[#E76F51]'}`}>
                                    {activeNetProfit >= 0 ? '+' : ''}₦{activeNetProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                                <span className="text-[10px] font-mono font-bold text-[#D9A63E] mt-2 relative z-10 block">
                                    Net Margin: {activeMargin.toFixed(1)}%
                                </span>
                            </div>
                        </div>

                        {/* Unit Economics Spotlight Cards (Only visible if specific batch selected) */}
                        {batchPnl && (
                            <div className="bg-[#ECE6D6] border border-[#101B14]/10 rounded-2xl p-6 shadow-inner space-y-4">
                                <div>
                                    <h4 className="text-sm font-extrabold uppercase text-[#101B14] tracking-widest flex items-center gap-2">
                                        <span>🧬</span> Cohort Unit Economics
                                    </h4>
                                    <p className="text-[10px] font-bold text-[#101B14]/60 font-mono mt-1">
                                        Breeds true financial efficiency by dividing total financials by the initial population count.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="bg-white border border-[#101B14]/10 rounded-xl p-5 shadow-sm">
                                        <span className="text-[10px] text-[#101B14]/50 font-bold uppercase tracking-widest block mb-1">
                                            Cost to Raise (Per Bird)
                                        </span>
                                        <span className="text-2xl font-extrabold text-[#E76F51] font-mono block">
                                            ₦{(batchPnl.costPerBird || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>

                                    <div className="bg-white border border-[#101B14]/10 rounded-xl p-5 shadow-sm">
                                        <span className="text-[10px] text-[#101B14]/50 font-bold uppercase tracking-widest block mb-1">
                                            Revenue (Per Bird)
                                        </span>
                                        <span className="text-2xl font-extrabold text-[#2A5C38] font-mono block">
                                            ₦{(batchPnl.revenuePerBird || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>

                                    <div className="bg-white border border-[#101B14]/10 rounded-xl p-5 shadow-sm border-l-4 border-l-[#101B14]">
                                        <span className="text-[10px] text-[#101B14]/50 font-bold uppercase tracking-widest block mb-1">
                                            Net Profit (Per Bird)
                                        </span>
                                        <span className="text-2xl font-extrabold text-[#101B14] font-mono block">
                                            ₦{(batchPnl.profitPerBird || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Graphical Analytics Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left: Expense Category Graph Bars */}
                            <div className="bg-white border border-[#101B14]/10 rounded-2xl p-6 shadow-xs flex flex-col h-full">
                                <div className="border-b border-[#101B14]/10 pb-4 mb-5">
                                    <h4 className="text-lg font-extrabold text-[#101B14] font-['Fraunces',serif]">
                                        Capital Distribution
                                    </h4>
                                    <p className="text-[10px] text-[#101B14]/50 font-bold uppercase tracking-widest mt-1">
                                        Where operational capital is spent
                                    </p>
                                </div>

                                {loading ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                                        <div className="w-8 h-8 border-4 border-[#2A5C38]/20 border-t-[#2A5C38] rounded-full animate-spin mb-3"></div>
                                        <span className="text-[#101B14]/40 font-mono text-[10px] font-bold uppercase tracking-widest">Crunching numbers...</span>
                                    </div>
                                ) : expenseBreakdown.length > 0 ? (
                                    <div className="space-y-5">
                                        {expenseBreakdown.map((item, idx) => {
                                            const pct = item.percentageOfTotalCost || 0;
                                            return (
                                                <div key={item.category || idx} className="space-y-2">
                                                    <div className="flex justify-between items-end">
                                                        <span className="font-extrabold text-[#101B14] text-xs">
                                                            {item.category.replace('_', ' ')}
                                                        </span>
                                                        <div className="text-right">
                                                            <span className="text-[#101B14] font-bold text-xs font-mono block">
                                                                ₦{(item.totalAmount || 0).toLocaleString()}
                                                            </span>
                                                            <span className="text-[9px] font-mono font-bold text-[#E76F51]">
                                                                {pct.toFixed(1)}% of total
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="w-full bg-[#101B14]/5 rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className="bg-[#E76F51] h-full rounded-full transition-all duration-1000 ease-out"
                                                            style={{ width: `${Math.min(100, pct)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-center">
                                        <span className="text-[#101B14]/40 font-mono text-[10px] font-bold uppercase tracking-widest">No expenses recorded yet.</span>
                                    </div>
                                )}
                            </div>

                            {/* Right: Cohort Profitability Matrix Cards */}
                            <div className="lg:col-span-2 bg-white border border-[#101B14]/10 rounded-2xl p-6 shadow-xs h-full">
                                <div className="border-b border-[#101B14]/10 pb-4 mb-5">
                                    <h4 className="text-lg font-extrabold text-[#101B14] font-['Fraunces',serif]">
                                        Cohort Performance Matrix
                                    </h4>
                                    <p className="text-[10px] text-[#101B14]/50 font-bold uppercase tracking-widest mt-1">
                                        Comparative financial overview across facility batches
                                    </p>
                                </div>

                                {loading ? (
                                    <div className="py-12 flex flex-col items-center justify-center text-center">
                                        <div className="w-8 h-8 border-4 border-[#2A5C38]/20 border-t-[#2A5C38] rounded-full animate-spin mb-3"></div>
                                    </div>
                                ) : farmOverview && farmOverview.batchSummaries && farmOverview.batchSummaries.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {farmOverview.batchSummaries.map((b) => (
                                            <div
                                                key={b.batchId}
                                                className="bg-[#FBF9F5] border border-[#101B14]/10 rounded-xl p-5 hover:shadow-md transition-shadow duration-300"
                                            >
                                                <div className="flex items-start justify-between border-b border-[#101B14]/10 pb-3 mb-4">
                                                    <div>
                                                        <span className="text-[9px] font-mono font-extrabold text-[#101B14]/50 uppercase tracking-widest block mb-1">
                                                            {b.sectionName}
                                                        </span>
                                                        <h5 className="text-base font-extrabold text-[#101B14] leading-none">
                                                            Batch #{b.batchNumber}
                                                        </h5>
                                                    </div>
                                                    <span className="px-2 py-1 rounded text-[9px] font-extrabold uppercase tracking-widest bg-white border border-[#101B14]/10 text-[#101B14]/70 shadow-sm">
                                                        {b.status}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 text-xs font-mono mb-4">
                                                    <div>
                                                        <span className="text-[9px] text-[#101B14]/50 font-bold block uppercase tracking-widest mb-1">Revenue</span>
                                                        <span className="font-bold text-[#2A5C38] text-sm">
                                                            ₦{(b.revenue || 0).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[9px] text-[#101B14]/50 font-bold block uppercase tracking-widest mb-1">Expenses</span>
                                                        <span className="font-bold text-[#E76F51] text-sm">
                                                            ₦{(b.expenses || 0).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="bg-white rounded-lg p-3 border border-[#101B14]/5 flex items-center justify-between font-mono">
                                                    <span className="text-[10px] font-bold text-[#101B14]/60 uppercase tracking-widest">Net Profit</span>
                                                    <span className={`text-base font-extrabold ${(b.netProfit || 0) >= 0 ? 'text-[#2A5C38]' : 'text-[#E76F51]'}`}>
                                                        {(b.netProfit || 0) >= 0 ? '+' : ''}₦{(b.netProfit || 0).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 flex flex-col items-center justify-center text-center">
                                        <div className="w-16 h-16 rounded-full bg-[#ECE6D6] flex items-center justify-center text-[#101B14]/30 mb-4 shadow-inner">
                                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <span className="text-[#101B14]/50 font-bold text-sm">No cohort summaries available for comparison.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* MODE 2: AUDIT TRANSACTION LEDGER */}
                {activeTabMode === 'LEDGER' && (
                    <div className="bg-white border border-[#101B14]/10 rounded-2xl overflow-hidden shadow-xs mt-2">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs font-sans text-[#101B14] min-w-[700px]">
                                <thead className="bg-[#ECE6D6] text-[#101B14]/60 font-mono uppercase text-[9px] font-extrabold tracking-widest border-b border-[#101B14]/10">
                                    <tr>
                                        <th className="px-6 py-4">Audit Date</th>
                                        <th className="px-6 py-4">Category & Details</th>
                                        <th className="px-6 py-4">Batch Ref</th>
                                        <th className="px-6 py-4">Flow</th>
                                        <th className="px-6 py-4 text-right">Amount (₦)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#101B14]/5 font-mono">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-16 text-center text-[#101B14]/40 font-bold tracking-widest uppercase text-[10px]">
                                                Loading transaction ledger...
                                            </td>
                                        </tr>
                                    ) : transactions.length > 0 ? (
                                        transactions.map((tx, idx) => {
                                            const txId = tx.transactionId || idx;
                                            return (
                                                <tr key={txId} className="hover:bg-[#FBF9F5] transition-colors">
                                                    <td className="px-6 py-4 font-bold text-[#101B14] whitespace-nowrap">{tx.transactionDate}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-extrabold text-[#101B14] mb-1">{tx.category.replace('_', ' ')}</div>
                                                        <span className="text-[10px] font-sans text-[#101B14]/60 block truncate max-w-[250px]" title={tx.description}>
                                                            {tx.description}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-[#101B14]/70">
                                                        {tx.batchNumber ? `#${tx.batchNumber}` : tx.batchId ? `Batch #${tx.batchId}` : 'General / Facility'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {tx.type === 'CREDIT' ? (
                                                            <span className="px-2.5 py-1 rounded-md bg-[#2A5C38]/10 text-[#2A5C38] border border-[#2A5C38]/20 text-[9px] font-extrabold uppercase tracking-widest inline-flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-[#2A5C38]"></span> Income
                                                            </span>
                                                        ) : (
                                                            <span className="px-2.5 py-1 rounded-md bg-[#E76F51]/10 text-[#E76F51] border border-[#E76F51]/20 text-[9px] font-extrabold uppercase tracking-widest inline-flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-[#E76F51]"></span> Expense
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className={`px-6 py-4 text-right font-extrabold text-sm ${tx.type === 'CREDIT' ? 'text-[#2A5C38]' : 'text-[#E76F51]'}`}>
                                                        {tx.type === 'CREDIT' ? '+' : '-'} {(tx.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-16 text-center">
                                                <span className="text-[#101B14]/40 font-bold font-sans text-sm block">No transaction receipts recorded under this scope.</span>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* NEW: Export Date Window Modal */}
            {showExportModal && (
                <div className="fixed inset-0 bg-[#101B14]/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#FBF9F5] rounded-2xl max-w-sm w-full shadow-2xl flex flex-col overflow-hidden border border-[#101B14]/20">
                        <div className="p-6 bg-white border-b border-[#101B14]/10">
                            <h4 className="text-xl font-extrabold text-[#101B14] font-['Fraunces',serif]">Audit Download</h4>
                            <p className="text-[10px] font-mono font-bold text-[#101B14]/50 uppercase tracking-widest mt-1">
                                Select Financial Time Window
                            </p>
                        </div>

                        <form onSubmit={handleExport} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/70 mb-2">From Date *</label>
                                <input
                                    type="date"
                                    required
                                    value={exportForm.startDate}
                                    onChange={(e) => setExportForm({ ...exportForm, startDate: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg bg-white border border-[#101B14]/20 text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-[#101B14]/30"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/70 mb-2">To Date *</label>
                                <input
                                    type="date"
                                    required
                                    value={exportForm.endDate}
                                    onChange={(e) => setExportForm({ ...exportForm, endDate: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg bg-white border border-[#101B14]/20 text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-[#101B14]/30"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowExportModal(false)} className="flex-1 py-3.5 bg-transparent text-[#101B14]/60 font-bold text-xs uppercase tracking-wider hover:bg-[#101B14]/5 rounded-lg transition-colors cursor-pointer">
                                    Cancel
                                </button>
                                <button type="submit" disabled={exporting} className="flex-1 py-3.5 bg-[#101B14] text-white font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-md hover:bg-[#3F6B47] transition-colors cursor-pointer disabled:opacity-50">
                                    {exporting ? 'Generating...' : 'Download CSV'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Record Transaction Modal */}
            {showTxModal && (
                <div className="fixed inset-0 bg-[#101B14]/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
                    <div className="bg-[#FBF9F5] border border-[#101B14]/20 rounded-2xl max-w-lg w-full shadow-2xl flex flex-col max-h-[95vh] relative overflow-hidden">

                        {/* Dynamic Top Indicator Bar based on Flow Type */}
                        <div className={`h-2 w-full shrink-0 shadow-sm transition-colors duration-300 ${txForm.transactionType === 'CREDIT' ? 'bg-[#2A5C38]' : 'bg-[#E76F51]'}`}></div>

                        <div className="flex items-center justify-between border-b border-[#101B14]/10 p-6 bg-white shrink-0">
                            <div>
                                <h4 className="text-xl font-extrabold text-[#101B14] font-['Fraunces',serif] tracking-tight">Record Receipt</h4>
                                <p className="text-[10px] font-mono font-bold text-[#101B14]/50 uppercase tracking-widest mt-1.5">
                                    Update general ledger instantly
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowTxModal(false)}
                                className="text-[#101B14]/40 hover:text-[#E76F51] hover:bg-[#E76F51]/10 bg-[#101B14]/5 transition-all p-2 rounded-full cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            <form id="tx-form" onSubmit={handleCreateTransaction} className="space-y-6">

                                {/* LIVE RECEIPT PREVIEW */}
                                <div className="bg-white border border-[#101B14]/10 rounded-xl p-5 shadow-sm text-center flex flex-col items-center">
                                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#101B14]/50 mb-2">Live Receipt Posting Amount</span>
                                    <div className={`text-4xl font-extrabold font-mono tracking-tighter ${txForm.transactionType === 'CREDIT' ? 'text-[#2A5C38]' : 'text-[#E76F51]'}`}>
                                        {txForm.transactionType === 'CREDIT' ? '+' : '-'} ₦{Number(txForm.amount || 0).toLocaleString()}
                                    </div>
                                    <span className="text-[10px] font-bold text-[#101B14]/40 uppercase mt-2">
                                        Will post as {txForm.transactionType === 'CREDIT' ? 'Revenue' : 'Expense'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/70 mb-2">Flow Direction *</label>
                                        <select
                                            value={txForm.transactionType}
                                            onChange={(e) => setTxForm({ ...txForm, transactionType: e.target.value as TransactionType })}
                                            className="w-full px-4 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#D9A63E] focus:ring-2 focus:ring-[#D9A63E]/30 transition-all shadow-sm appearance-none cursor-pointer"
                                            style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23101B14' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                                        >
                                            <option value="CREDIT">🟢 Income (+)</option>
                                            <option value="DEBIT">🔴 Expense (-)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/70 mb-2">Category *</label>
                                        <select
                                            value={txForm.transactionCategory}
                                            onChange={(e) => setTxForm({ ...txForm, transactionCategory: e.target.value as TransactionCategory })}
                                            className="w-full px-4 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#D9A63E] focus:ring-2 focus:ring-[#D9A63E]/30 transition-all shadow-sm appearance-none cursor-pointer"
                                            style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23101B14' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                                        >
                                            {txForm.transactionType === 'CREDIT' ? (
                                                <>
                                                    <option value="LIVESTOCK_SALE">Livestock Sale</option>
                                                    <option value="OTHER_INCOME">Other Income</option>
                                                </>
                                            ) : (
                                                <>
                                                    <option value="FEED_PURCHASE">Feed Purchase</option>
                                                    <option value="MEDICINE_PURCHASE">Medicine Purchase</option>
                                                    <option value="VACCINE_PURCHASE">Vaccine Purchase</option>
                                                    <option value="EQUIPMENT_PURCHASE">Equipment Purchase</option>
                                                    <option value="LABOR_COST">Labor Cost</option>
                                                    <option value="UTILITY_BILL">Utility Bill</option>
                                                    <option value="OTHER_EXPENSE">Other Expense</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/70 mb-2">
                                        Target Cohort (Cost Center)
                                    </label>
                                    <select
                                        value={txForm.batchId}
                                        onChange={(e) => setTxForm({ ...txForm, batchId: e.target.value === '' ? '' : Number(e.target.value) })}
                                        className="w-full px-4 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#D9A63E] focus:ring-2 focus:ring-[#D9A63E]/30 transition-all shadow-sm appearance-none cursor-pointer"
                                        style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23101B14' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                                    >
                                        <option value="">🏢 General Facility (Overhead)</option>
                                        {batches.map((b) => (
                                            <option key={b.id} value={b.id}>🛖 {b.sectionName} — Batch #{b.batchNumber}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/70 mb-2">Amount (₦) *</label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={txForm.amount || ''}
                                            onChange={(e) => setTxForm({ ...txForm, amount: Number(e.target.value) })}
                                            className="w-full px-4 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-lg font-extrabold focus:outline-none focus:border-[#D9A63E] focus:ring-2 focus:ring-[#D9A63E]/30 transition-all shadow-sm font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/70 mb-2">Transaction Date *</label>
                                        <input
                                            type="date"
                                            required
                                            value={txForm.transactionDate}
                                            onChange={(e) => setTxForm({ ...txForm, transactionDate: e.target.value })}
                                            className="w-full px-4 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#D9A63E] focus:ring-2 focus:ring-[#D9A63E]/30 transition-all shadow-sm font-mono"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/70 mb-2">
                                        Audit Narrative / Description *
                                    </label>
                                    <textarea
                                        rows={3}
                                        required
                                        maxLength={250}
                                        placeholder="e.g. Sold 200 mature broilers at ₦4,500/bird to distributor."
                                        value={txForm.description}
                                        onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
                                        className="w-full px-4 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm focus:outline-none focus:border-[#D9A63E] focus:ring-2 focus:ring-[#D9A63E]/30 transition-all shadow-sm resize-none"
                                    />
                                </div>
                            </form>
                        </div>

                        <div className="p-5 bg-[#ECE6D6] border-t border-[#101B14]/10 shrink-0 flex items-center justify-end gap-3 z-10">
                            <button
                                type="button"
                                onClick={() => setShowTxModal(false)}
                                className="px-5 py-3.5 rounded-lg bg-transparent hover:bg-[#101B14]/5 text-[#101B14]/60 hover:text-[#101B14] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="tx-form"
                                disabled={submitting || txForm.amount <= 0}
                                className={`px-6 py-3.5 rounded-lg text-white font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 ${txForm.transactionType === 'CREDIT' ? 'bg-[#2A5C38] hover:bg-[#1f452a]' : 'bg-[#E76F51] hover:bg-[#c6583d]'
                                    }`}
                            >
                                {submitting ? 'Posting...' : 'Confirm & Post Receipt'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};