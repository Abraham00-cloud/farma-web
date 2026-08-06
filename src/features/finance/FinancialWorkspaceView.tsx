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
}

export const FinancialWorkspaceView: React.FC<FinancialWorkspaceViewProps> = ({ organisationId }) => {
    const [farms, setFarms] = useState<FarmResponseDto[]>([]);
    const [selectedFarmId, setSelectedFarmId] = useState<number | ''>('');
    const [batches, setBatches] = useState<BatchResponseDto[]>([]);
    const [selectedBatchId, setSelectedBatchId] = useState<number | 'ALL'>('ALL');

    // Sub-tab view mode: 'ANALYTICS' vs 'LEDGER'
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

    // Lazy default date generator
    const getTodayISOString = () => new Date().toISOString().split('T')[0];

    // Transaction Form State
    const [txForm, setTxForm] = useState<Omit<TransactionRequestDto, 'organisationId'>>(() => ({
        amount: 0,
        transactionType: 'CREDIT',
        transactionCategory: 'HARVEST_SALE',
        description: '',
        transactionDate: getTodayISOString(),
        isCashFlow: true,
        batchId: 0,
    }));

    // 1. Load Farm Facilities
    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            setLoading(true);
            try {
                const farmList = await infrastructureService.getFarmsByOrganisation(organisationId);
                if (isMounted && Array.isArray(farmList) && farmList.length > 0) {
                    setFarms(farmList);
                    setSelectedFarmId(farmList[0].id);
                }
            } catch {
                if (isMounted) {
                    setErrorMessage('Could not load farm facilities.');
                }
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
    }, [organisationId]);

    // 2. Fetch Batches when selected farm updates
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
                    if (flatBatches.length > 0) {
                        setTxForm((prev) => ({ ...prev, batchId: flatBatches[0].id }));
                    }
                }
            } catch {
                if (isMounted) {
                    setBatches([]);
                }
            }
        };

        fetchBatches();

        return () => {
            isMounted = false;
        };
    }, [selectedFarmId]);

    // 3. Sync Financial Engine Analytics & Transactions
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
                if (isMounted) {
                    setErrorMessage('Error synchronizing financial analytics.');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadData();

        return () => {
            isMounted = false;
        };
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
        if (!txForm.batchId || txForm.amount <= 0) return;

        setSubmitting(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        const payload: TransactionRequestDto = {
            ...txForm,
            organisationId,
            amount: Number(txForm.amount),
            batchId: Number(txForm.batchId),
        };

        try {
            await transactionService.createTransaction(payload);
            setSuccessMessage('Transaction recorded successfully!');
            setShowTxModal(false);
            setTxForm({
                amount: 0,
                transactionType: 'CREDIT',
                transactionCategory: 'HARVEST_SALE',
                description: '',
                transactionDate: getTodayISOString(),
                isCashFlow: true,
                batchId: batches.length > 0 ? batches[0].id : 0,
            });
            await reloadData();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setErrorMessage(
                    typeof err.response?.data === 'string'
                        ? err.response.data
                        : err.response?.data?.message || 'Failed to record transaction.'
                );
            } else {
                setErrorMessage('An unexpected error occurred.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Derived Analytics Values
    const activeRevenue = batchPnl
        ? batchPnl.totalRevenue || 0
        : farmOverview
            ? farmOverview.totalRevenue || 0
            : 0;

    const activeExpenses = batchPnl
        ? batchPnl.totalExpenses || 0
        : farmOverview
            ? farmOverview.totalExpenses || 0
            : 0;

    const activeNetProfit = batchPnl
        ? batchPnl.netProfitOrLoss || 0
        : farmOverview
            ? farmOverview.totalNetProfit || 0
            : 0;

    const activeMargin = batchPnl
        ? batchPnl.profitMarginPercentage || 0
        : farmOverview
            ? farmOverview.overallMarginPercentage || 0
            : 0;

    const expenseBreakdown = batchPnl
        ? batchPnl.expenseBreakdownChart || []
        : farmOverview
            ? farmOverview.expenseBreakdownChart || []
            : [];

    return (
        <div className="space-y-6">
            {/* 1. TOP EXECUTIVE HEADER BAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        Financial Intelligence & P&L Center
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                        Real-time unit economics, expense distribution charts, and cohort margins.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setShowTxModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider shadow-xs cursor-pointer flex items-center space-x-2"
                >
                    <span>💳 Post Sales Revenue / Expense</span>
                </button>
            </div>

            {/* Inline Feedback Alerts */}
            {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-mono">
                    🚨 {errorMessage}
                </div>
            )}

            {successMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono">
                    ✅ {successMessage}
                </div>
            )}

            {/* 2. MODE NAVIGATION TABS & FACILITY SCOPE PICKERS */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                    {/* View Mode Tabs */}
                    <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl w-fit">
                        <button
                            type="button"
                            onClick={() => setActiveTabMode('ANALYTICS')}
                            className={`px-4 py-2 rounded-lg text-xs font-extrabold transition cursor-pointer ${activeTabMode === 'ANALYTICS'
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            📊 Executive P&L Analytics
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTabMode('LEDGER')}
                            className={`px-4 py-2 rounded-lg text-xs font-extrabold transition cursor-pointer ${activeTabMode === 'LEDGER'
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            💳 Audit Transaction Ledger ({transactions.length})
                        </button>
                    </div>

                    {/* Scope Dropdowns */}
                    <div className="flex items-center space-x-3">
                        <select
                            value={selectedFarmId}
                            onChange={(e) => {
                                setSelectedFarmId(Number(e.target.value));
                                setSelectedBatchId('ALL');
                            }}
                            className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none"
                        >
                            {farms.map((f) => (
                                <option key={f.id} value={f.id}>
                                    🏢 {f.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedBatchId}
                            onChange={(e) =>
                                setSelectedBatchId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
                            }
                            className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none"
                        >
                            <option value="ALL">🌐 All Batches (Overview)</option>
                            {batches.map((b) => (
                                <option key={b.id} value={b.id}>
                                    🛖 {b.sectionName} (#{b.batchNumber})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* MODE 1: EXECUTIVE P&L ANALYTICS */}
                {activeTabMode === 'ANALYTICS' && (
                    <div className="space-y-6 pt-2">
                        {/* KPI Revenue vs Expense Gauge Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 shadow-xs">
                                <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase block">
                                    Total Harvest Revenue
                                </span>
                                <div className="text-3xl font-extrabold text-emerald-800 mt-1">
                                    ₦{activeRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                            </div>

                            <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-5 shadow-xs">
                                <span className="text-[10px] font-mono font-bold text-rose-800 uppercase block">
                                    Total Operational Expenses
                                </span>
                                <div className="text-3xl font-extrabold text-rose-800 mt-1">
                                    ₦{activeExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                            </div>

                            <div
                                className={`border rounded-2xl p-5 shadow-xs ${activeNetProfit >= 0
                                        ? 'bg-slate-900 text-white border-slate-800'
                                        : 'bg-rose-900 text-white border-rose-800'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                                        Net Profit / Margin
                                    </span>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${activeNetProfit >= 0
                                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                            }`}
                                    >
                                        {activeNetProfit >= 0 ? 'Profitable Cohort' : 'Deficit Warning'}
                                    </span>
                                </div>
                                <div className="text-3xl font-extrabold mt-1">
                                    {activeNetProfit >= 0 ? '+' : ''}₦
                                    {activeNetProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                                <span className="text-xs font-mono text-slate-400 mt-1 block">
                                    Net Profit Margin: {activeMargin.toFixed(1)}%
                                </span>
                            </div>
                        </div>

                        {/* Unit Economics Spotlight Cards */}
                        {batchPnl && (
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                                <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                                    🐣 Cohort Unit Economics Breakdown (Per Bird)
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
                                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                                        <span className="text-[10px] text-slate-400 uppercase block">
                                            Cost Per Bird
                                        </span>
                                        <span className="text-xl font-extrabold text-rose-600 block mt-1">
                                            ₦{(batchPnl.costPerBird || 0).toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                                        <span className="text-[10px] text-slate-400 uppercase block">
                                            Revenue Per Bird
                                        </span>
                                        <span className="text-xl font-extrabold text-emerald-700 block mt-1">
                                            ₦{(batchPnl.revenuePerBird || 0).toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                                        <span className="text-[10px] text-slate-400 uppercase block">
                                            Net Profit Per Bird
                                        </span>
                                        <span className="text-xl font-extrabold text-slate-900 block mt-1">
                                            ₦{(batchPnl.profitPerBird || 0).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Graphical Analytics Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left: Expense Category Graph Bars */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                                <div className="border-b border-slate-100 pb-3">
                                    <h4 className="text-base font-extrabold text-slate-900">
                                        📊 Expense Category Distribution
                                    </h4>
                                    <p className="text-xs text-slate-500 font-mono">
                                        Proportional analysis of operational capital
                                    </p>
                                </div>

                                {loading ? (
                                    <div className="py-8 text-center text-slate-400 font-mono text-xs">
                                        Calculating graph data...
                                    </div>
                                ) : expenseBreakdown.length > 0 ? (
                                    <div className="space-y-4 font-mono">
                                        {expenseBreakdown.map((item, idx) => {
                                            const pct = item.percentageOfTotalCost || 0;
                                            return (
                                                <div key={item.category || idx} className="space-y-1.5">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="font-extrabold text-slate-800">
                                                            {item.category}
                                                        </span>
                                                        <span className="text-slate-600 font-bold">
                                                            ₦{(item.totalAmount || 0).toLocaleString()} ({pct.toFixed(1)}%)
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
                                                        <div
                                                            className="bg-[#C2410C] h-full rounded-full transition-all duration-500"
                                                            style={{ width: `${Math.min(100, pct)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center text-slate-400 font-mono text-xs">
                                        No expense category records registered yet.
                                    </div>
                                )}
                            </div>

                            {/* Right: Cohort Profitability Matrix Cards */}
                            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                                <div className="border-b border-slate-100 pb-3">
                                    <h4 className="text-base font-extrabold text-slate-900">
                                        🛖 Cohort Performance Comparison Matrix
                                    </h4>
                                    <p className="text-xs text-slate-500 font-mono">
                                        Live P&L performance across all farm batches
                                    </p>
                                </div>

                                {loading ? (
                                    <div className="py-8 text-center text-slate-400 font-mono text-xs">
                                        Loading cohort matrices...
                                    </div>
                                ) : farmOverview && farmOverview.batchSummaries && farmOverview.batchSummaries.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {farmOverview.batchSummaries.map((b) => (
                                            <div
                                                key={b.batchId}
                                                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3"
                                            >
                                                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                                    <div>
                                                        <span className="text-base font-extrabold text-slate-900">
                                                            Batch #{b.batchNumber}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500 block font-mono">
                                                            {b.sectionName} • {b.breed}
                                                        </span>
                                                    </div>
                                                    <span className="px-2 py-0.5 rounded-full bg-white border text-[10px] font-bold text-slate-700">
                                                        {b.status}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                                                    <div>
                                                        <span className="text-[10px] text-slate-400 block uppercase">Revenue</span>
                                                        <span className="font-extrabold text-emerald-700">
                                                            ₦{(b.revenue || 0).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] text-slate-400 block uppercase">Expenses</span>
                                                        <span className="font-extrabold text-rose-600">
                                                            ₦{(b.expenses || 0).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="border-t border-slate-200 pt-2 flex items-center justify-between font-mono">
                                                    <span className="text-xs text-slate-500">Net Profit:</span>
                                                    <span
                                                        className={`text-sm font-extrabold ${(b.netProfit || 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'
                                                            }`}
                                                    >
                                                        {(b.netProfit || 0) >= 0 ? '+' : ''}₦{(b.netProfit || 0).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center text-slate-400 font-mono text-xs">
                                        No active cohort summaries available for comparison.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* MODE 2: AUDIT TRANSACTION LEDGER */}
                {activeTabMode === 'LEDGER' && (
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs mt-2">
                        <table className="w-full text-left text-xs font-sans text-slate-700">
                            <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="px-5 py-3.5">Date</th>
                                    <th className="px-5 py-3.5">Category & Description</th>
                                    <th className="px-5 py-3.5">Batch Ref</th>
                                    <th className="px-5 py-3.5">Flow Type</th>
                                    <th className="px-5 py-3.5 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-mono">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                                            Loading transaction entries...
                                        </td>
                                    </tr>
                                ) : transactions.length > 0 ? (
                                    transactions.map((tx, idx) => {
                                        const txId = tx.transactionId || idx;
                                        return (
                                            <tr key={txId} className="hover:bg-slate-50/80 transition">
                                                <td className="px-5 py-4 font-bold text-slate-900">{tx.transactionDate}</td>
                                                <td className="px-5 py-4">
                                                    <div className="font-bold text-slate-900">{tx.category}</div>
                                                    <span className="text-[10px] text-slate-500 block truncate max-w-xs">
                                                        {tx.description}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 font-bold text-slate-800">
                                                    {tx.batchNumber ? `#${tx.batchNumber}` : tx.batchId ? `Batch #${tx.batchId}` : 'General'}
                                                </td>
                                                <td className="px-5 py-4">
                                                    {tx.type === 'CREDIT' ? (
                                                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                                            🟢 INCOME
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                                                            🔴 EXPENSE
                                                        </span>
                                                    )}
                                                </td>
                                                <td
                                                    className={`px-5 py-4 text-right font-extrabold ${tx.type === 'CREDIT' ? 'text-emerald-700' : 'text-rose-600'
                                                        }`}
                                                >
                                                    {tx.type === 'CREDIT' ? '+' : '-'}₦
                                                    {(tx.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                                            No transaction receipts recorded under this selection scope.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Record Transaction Modal */}
            {showTxModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h4 className="text-base font-bold text-slate-900">Record Financial Receipt</h4>
                            <button
                                type="button"
                                onClick={() => setShowTxModal(false)}
                                className="text-slate-400 hover:text-slate-600 font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateTransaction} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Flow Type *</label>
                                    <select
                                        value={txForm.transactionType}
                                        onChange={(e) =>
                                            setTxForm({ ...txForm, transactionType: e.target.value as TransactionType })
                                        }
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold"
                                    >
                                        <option value="CREDIT">🟢 Income / Revenue</option>
                                        <option value="DEBIT">🔴 Expense / Purchase</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                                    <select
                                        value={txForm.transactionCategory}
                                        onChange={(e) =>
                                            setTxForm({
                                                ...txForm,
                                                transactionCategory: e.target.value as TransactionCategory,
                                            })
                                        }
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold"
                                    >
                                        <option value="HARVEST_SALE">Harvest Sale</option>
                                        <option value="LIVESTOCK_SALE">Livestock Sale</option>
                                        <option value="FEED_PURCHASE">Feed Purchase</option>
                                        <option value="MEDICINE_PURCHASE">Medicine Purchase</option>
                                        <option value="UTILITY_EXPENSE">Utility Expense</option>
                                        <option value="SALARY_EXPENSE">Salary Expense</option>
                                        <option value="OTHER_INCOME">Other Income</option>
                                        <option value="OTHER_EXPENSE">Other Expense</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Target Flock Batch *
                                </label>
                                <select
                                    value={txForm.batchId}
                                    onChange={(e) => setTxForm({ ...txForm, batchId: Number(e.target.value) })}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold"
                                >
                                    {batches.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            🛖 {b.sectionName} — Code: {b.batchNumber}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Amount (₦) *</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={txForm.amount || ''}
                                        onChange={(e) => setTxForm({ ...txForm, amount: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono font-bold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Transaction Date *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={txForm.transactionDate}
                                        onChange={(e) => setTxForm({ ...txForm, transactionDate: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Description / Audit Notes *
                                </label>
                                <textarea
                                    rows={2}
                                    required
                                    maxLength={250}
                                    placeholder="e.g. Sold 200 mature broilers at ₦4,500/bird."
                                    value={txForm.description}
                                    onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs"
                                />
                            </div>

                            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowTxModal(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !txForm.batchId || txForm.amount <= 0}
                                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                                >
                                    {submitting ? 'Posting...' : 'Record Transaction'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};