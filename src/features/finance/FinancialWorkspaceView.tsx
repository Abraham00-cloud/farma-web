import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { infrastructureService } from '../../services/infrastructureService';
import { batchService } from '../../services/batchService';
import { financeService } from '../../services/financeService';
import { transactionService } from '../../services/transactionService';
import type { FarmResponseDto } from '../../types/infrastructure';
import type { BatchResponseDto } from '../../types/batch';
import type { FarmFinancialOverviewDto, BatchFinancialPnlResponseDto, ValuationRequestDto, ValuationResponseDto } from '../../types/finance';
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

    const [activeTabMode, setActiveTabMode] = useState<'ANALYTICS' | 'LEDGER' | 'ESTIMATOR'>('ANALYTICS');

    const [farmOverview, setFarmOverview] = useState<FarmFinancialOverviewDto | null>(null);
    const [batchPnl, setBatchPnl] = useState<BatchFinancialPnlResponseDto | null>(null);
    const [transactions, setTransactions] = useState<TransactionResponseDto[]>([]);

    const [valForm, setValForm] = useState<ValuationRequestDto>({
        scope: 'ORGANISATION', 
        scopeId: organisationId,
        projectedPricePerKg: 3500,
        projectedPricePerProduceUnit: 120,
    });
    const [valResult, setValResult] = useState<ValuationResponseDto | null>(null);
    const [valLoading, setValLoading] = useState(false);

    // --- Searchable Dropdown State ---
    const [flockSearchQuery, setFlockSearchQuery] = useState('');
    const [isFlockDropdownOpen, setIsFlockDropdownOpen] = useState(false);
    const flockDropdownRef = useRef<HTMLDivElement>(null);

    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [showTxModal, setShowTxModal] = useState<boolean>(false);
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

    const [exportForm, setExportForm] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: getTodayISOString()
    });

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (flockDropdownRef.current && !flockDropdownRef.current.contains(event.target as Node)) {
                setIsFlockDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                if (isMounted) setErrorMessage('Could not load farms.');
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
                    
                    if (valForm.scope === 'BATCH' && valForm.scopeId === 0 && flatBatches.length > 0) {
                        setValForm(prev => ({ ...prev, scopeId: flatBatches[0].id }));
                    }
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
            if (activeTabMode === 'ESTIMATOR') return;

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
                if (isMounted) setErrorMessage('Error loading financial data.');
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        loadData();
        return () => { isMounted = false; };
    }, [selectedFarmId, selectedBatchId, organisationId, activeTabMode]);

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
            setSuccessMessage('Record saved successfully!');
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
                setErrorMessage(typeof err.response?.data === 'string' ? err.response.data : err.response?.data?.message || 'Failed to save record.');
            } else {
                setErrorMessage('An unexpected error occurred.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleExport = async (e: React.FormEvent) => {
        e.preventDefault();
        setExporting(true);
        setErrorMessage(null);
        try {
            await transactionService.exportLedgerToCsv(organisationId, exportForm.startDate, exportForm.endDate);
            setShowExportModal(false);
            setSuccessMessage('Report downloaded successfully!');
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch {
            setErrorMessage('Failed to generate report. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    const handleRunValuation = async (e: React.FormEvent) => {
        e.preventDefault();
        setValLoading(true);
        setErrorMessage(null);

        try {
            const data = await financeService.calculateProjectedValuation({
                scope: valForm.scope,
                scopeId: valForm.scope === 'ORGANISATION' ? organisationId : valForm.scopeId,
                projectedPricePerKg: Number(valForm.projectedPricePerKg),
                projectedPricePerProduceUnit: Number(valForm.projectedPricePerProduceUnit),
            });
            setValResult(data);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setErrorMessage(err.response?.data?.message || 'Failed to calculate projections.');
            } else {
                setErrorMessage('An unexpected error occurred.');
            }
        } finally {
            setValLoading(false);
        }
    };

    const activeRevenue = batchPnl ? batchPnl.totalRevenue || 0 : farmOverview ? farmOverview.totalRevenue || 0 : 0;
    const activeExpenses = batchPnl ? batchPnl.totalExpenses || 0 : farmOverview ? farmOverview.totalExpenses || 0 : 0;
    const activeNetProfit = batchPnl ? batchPnl.netProfitOrLoss || 0 : farmOverview ? farmOverview.totalNetProfit || 0 : 0;
    const activeMargin = batchPnl ? batchPnl.profitMarginPercentage || 0 : farmOverview ? farmOverview.overallMarginPercentage || 0 : 0;
    const expenseBreakdown = batchPnl ? batchPnl.expenseBreakdownChart || [] : farmOverview ? farmOverview.expenseBreakdownChart || [] : [];
    
    const isValProfitable = valResult && valResult.projectedNetProfit >= 0;
    const isValidValuation = valForm.scope === 'ORGANISATION' || valForm.scopeId > 0;

    // Filter batches for the search dropdown
    const filteredBatches = batches.filter(b => 
        b.batchNumber.toLowerCase().includes(flockSearchQuery.toLowerCase()) || 
        b.sectionName.toLowerCase().includes(flockSearchQuery.toLowerCase())
    );

    // Helper to get the display name for the selected batch
    const getSelectedBatchDisplay = () => {
        if (selectedBatchId === 'ALL') return 'All Flocks (Overview)';
        const b = batches.find(b => b.id === selectedBatchId);
        return b ? `${b.sectionName} (#${b.batchNumber})` : 'Select Flock';
    };

    const getEstimatorBatchDisplay = () => {
        if (valForm.scopeId === 0) return '-- Choose a Flock --';
        const b = batches.find(b => b.id === valForm.scopeId);
        return b ? `${b.sectionName} (#${b.batchNumber})` : '-- Choose a Flock --';
    };

    return (
        <div className="space-y-6 lg:space-y-8 font-sans max-w-7xl mx-auto pb-12">

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-farma-forest/10 pb-5">
                <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-farma-forest tracking-tight">
                        {isProprietor ? 'Farm Finances & Profit' : 'My Farm Finances'}
                    </h3>
                    <p className="text-sm text-farma-forest/70 font-medium mt-1">
                        Track your income, expenses, and farm profits in real-time.
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={() => setShowExportModal(true)}
                        className="px-4 py-2.5 rounded-lg bg-white border border-farma-forest/20 hover:bg-farma-cream text-farma-forest font-bold text-xs uppercase tracking-wider shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
                    >
                        <IconDownload />
                        <span className="hidden sm:inline">Download Report</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowTxModal(true)}
                        className="px-4 py-2.5 rounded-lg bg-farma-gold hover:bg-farma-gold-hover text-farma-forest font-bold text-xs uppercase tracking-wider shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
                    >
                        <IconPlus />
                        <span>Add Record</span>
                    </button>
                </div>
            </div>

            {errorMessage && (
                <div className="p-4 rounded-lg bg-farma-terracotta/10 border border-farma-terracotta/30 text-farma-terracotta text-sm font-semibold shadow-sm">
                    {errorMessage}
                </div>
            )}
            {successMessage && (
                <div className="p-4 rounded-lg bg-farma-green/10 border border-farma-green/30 text-farma-green text-sm font-semibold shadow-sm flex items-center gap-2">
                    <IconCheck />
                    {successMessage}
                </div>
            )}

            <div className="bg-farma-cream border border-farma-forest/10 rounded-xl p-5 shadow-sm space-y-5">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 border-b border-farma-forest/10 pb-5">

                    <div className="flex items-center space-x-2 bg-white border border-farma-forest/10 p-1.5 rounded-lg w-fit shrink-0 overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => setActiveTabMode('ANALYTICS')}
                            className={`px-5 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${activeTabMode === 'ANALYTICS'
                                    ? 'bg-farma-forest text-white shadow-sm'
                                    : 'text-farma-forest/60 hover:text-farma-forest hover:bg-farma-forest/5'
                                }`}
                        >
                            Analytics
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTabMode('LEDGER')}
                            className={`px-5 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${activeTabMode === 'LEDGER'
                                    ? 'bg-farma-forest text-white shadow-sm'
                                    : 'text-farma-forest/60 hover:text-farma-forest hover:bg-farma-forest/5'
                                }`}
                        >
                            Records ({transactions.length})
                        </button>
                        
                        {isProprietor && (
                            <button
                                type="button"
                                onClick={() => setActiveTabMode('ESTIMATOR')}
                                className={`px-5 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${activeTabMode === 'ESTIMATOR'
                                        ? 'bg-farma-gold text-farma-forest shadow-sm'
                                        : 'text-farma-forest/60 hover:text-farma-gold hover:bg-farma-forest/5'
                                    }`}
                            >
                                <IconCalculator /> Profit Forecaster
                            </button>
                        )}
                    </div>

                    {activeTabMode !== 'ESTIMATOR' && (
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                            <div className="w-full sm:w-auto flex flex-col">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-farma-forest/50 mb-1 ml-1">Select Farm</span>
                                <select
                                    value={selectedFarmId}
                                    onChange={(e) => {
                                        setSelectedFarmId(Number(e.target.value));
                                        setSelectedBatchId('ALL');
                                    }}
                                    disabled={!isProprietor && farms.length <= 1}
                                    className="w-full sm:w-64 px-4 py-2.5 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-farma-green/30 transition-shadow shadow-sm cursor-pointer disabled:opacity-50"
                                >
                                    {farms.map((f) => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="w-full sm:w-auto flex flex-col relative" ref={flockDropdownRef}>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-farma-forest/50 mb-1 ml-1">Select Flock</span>
                                <button 
                                    type="button"
                                    onClick={() => setIsFlockDropdownOpen(!isFlockDropdownOpen)}
                                    className="w-full sm:w-64 px-4 py-2.5 text-left rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-farma-green/30 transition-shadow shadow-sm flex items-center justify-between"
                                >
                                    <span className="truncate">{getSelectedBatchDisplay()}</span>
                                    <IconChevronDown />
                                </button>

                                {isFlockDropdownOpen && (
                                    <div className="absolute top-[60px] left-0 w-full bg-white border border-farma-forest/20 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col max-h-[300px]">
                                        <div className="p-2 border-b border-farma-forest/10 bg-farma-cream sticky top-0">
                                            <input 
                                                type="text" 
                                                placeholder="Search flocks..."
                                                value={flockSearchQuery}
                                                onChange={(e) => setFlockSearchQuery(e.target.value)}
                                                className="w-full px-3 py-2 text-sm bg-white border border-farma-forest/20 rounded-md focus:outline-none focus:ring-1 focus:ring-farma-green/50"
                                            />
                                        </div>
                                        <div className="overflow-y-auto flex-1">
                                            <div 
                                                onClick={() => { setSelectedBatchId('ALL'); setIsFlockDropdownOpen(false); setFlockSearchQuery(''); }}
                                                className={`px-4 py-3 text-sm cursor-pointer border-b border-farma-forest/5 ${selectedBatchId === 'ALL' ? 'bg-farma-forest/5 font-bold text-farma-forest' : 'text-farma-forest/80 hover:bg-farma-cream'}`}
                                            >
                                                All Flocks (Overview)
                                            </div>
                                            {filteredBatches.length > 0 ? (
                                                filteredBatches.map(b => (
                                                    <div 
                                                        key={b.id}
                                                        onClick={() => { setSelectedBatchId(b.id); setIsFlockDropdownOpen(false); setFlockSearchQuery(''); }}
                                                        className={`px-4 py-3 text-sm cursor-pointer border-b border-farma-forest/5 ${selectedBatchId === b.id ? 'bg-farma-forest/5 font-bold text-farma-forest' : 'text-farma-forest/80 hover:bg-farma-cream'}`}
                                                    >
                                                        {b.sectionName} <span className="text-farma-forest/50 text-xs ml-1">(#{b.batchNumber})</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-4 py-4 text-sm text-farma-forest/50 text-center italic">No matching flocks</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {activeTabMode === 'ESTIMATOR' && (
                    <div className="pt-2 animate-fade-in">
                        <div className="mb-6">
                            <h4 className="text-xl font-bold text-farma-forest">Profit Forecaster</h4>
                            <p className="text-xs text-farma-forest/60 font-semibold mt-1">See how much profit you'll make when you sell your current flock at today's market prices.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            
                            <form onSubmit={handleRunValuation} className="lg:col-span-5 space-y-6 bg-white p-6 rounded-xl border border-farma-forest/10 shadow-sm h-fit">
                                
                                <div className="bg-farma-forest/5 rounded-xl p-4 border border-farma-forest/10 space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-2">What do you want to calculate?</label>
                                        <select
                                            value={valForm.scope}
                                            onChange={(e) => {
                                                const newScope = e.target.value as 'BATCH' | 'FARM' | 'ORGANISATION';
                                                setValForm({
                                                    ...valForm,
                                                    scope: newScope,
                                                    scopeId: newScope === 'ORGANISATION' ? organisationId :
                                                             newScope === 'FARM' ? Number(selectedFarmId || farms[0]?.id) :
                                                             (batches.length > 0 ? batches[0].id : 0)
                                                });
                                            }}
                                            className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-farma-gold/30 transition-shadow cursor-pointer"
                                        >
                                            <option value="ORGANISATION">My Entire Business (All Farms)</option>
                                            <option value="FARM">A Specific Farm Location</option>
                                            <option value="BATCH">A Specific Flock / Pen</option>
                                        </select>
                                    </div>

                                    {valForm.scope !== 'ORGANISATION' && (
                                        <div className={`grid grid-cols-1 gap-4 border-t border-farma-forest/10 pt-4 mt-2 ${valForm.scope === 'BATCH' ? 'sm:grid-cols-2' : ''}`}>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-2">Select Farm</label>
                                                <select
                                                    value={selectedFarmId}
                                                    onChange={(e) => {
                                                        const newFarmId = Number(e.target.value);
                                                        setSelectedFarmId(newFarmId);
                                                        if (valForm.scope === 'FARM') {
                                                            setValForm(prev => ({...prev, scopeId: newFarmId}));
                                                        } else {
                                                            setValForm(prev => ({...prev, scopeId: 0})); 
                                                        }
                                                    }}
                                                    disabled={!isProprietor && farms.length <= 1}
                                                    className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-farma-gold/30 transition-shadow cursor-pointer disabled:opacity-50"
                                                >
                                                    {farms.map((f) => (
                                                        <option key={f.id} value={f.id}>{f.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {valForm.scope === 'BATCH' && (
                                                <div className="relative" ref={flockDropdownRef}>
                                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-2">Select Flock</label>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setIsFlockDropdownOpen(!isFlockDropdownOpen)}
                                                        className="w-full px-4 py-3 text-left rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-farma-gold/30 transition-shadow flex items-center justify-between"
                                                    >
                                                        <span className="truncate">{getEstimatorBatchDisplay()}</span>
                                                        <IconChevronDown />
                                                    </button>

                                                    {isFlockDropdownOpen && (
                                                        <div className="absolute top-[65px] left-0 w-full bg-white border border-farma-forest/20 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col max-h-[250px]">
                                                            <div className="p-2 border-b border-farma-forest/10 bg-farma-cream sticky top-0">
                                                                <input 
                                                                    type="text" 
                                                                    placeholder="Search flocks..."
                                                                    value={flockSearchQuery}
                                                                    onChange={(e) => setFlockSearchQuery(e.target.value)}
                                                                    className="w-full px-3 py-2 text-sm bg-white border border-farma-forest/20 rounded-md focus:outline-none focus:ring-1 focus:ring-farma-green/50"
                                                                />
                                                            </div>
                                                            <div className="overflow-y-auto flex-1">
                                                                {filteredBatches.length > 0 ? (
                                                                    filteredBatches.map(b => (
                                                                        <div 
                                                                            key={b.id}
                                                                            onClick={() => { setValForm({ ...valForm, scopeId: b.id }); setIsFlockDropdownOpen(false); setFlockSearchQuery(''); }}
                                                                            className={`px-4 py-3 text-sm cursor-pointer border-b border-farma-forest/5 ${valForm.scopeId === b.id ? 'bg-farma-forest/5 font-bold text-farma-forest' : 'text-farma-forest/80 hover:bg-farma-cream'}`}
                                                                        >
                                                                            {b.sectionName} <span className="text-farma-forest/50 text-xs ml-1">(#{b.batchNumber})</span>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="px-4 py-4 text-sm text-farma-forest/50 text-center italic">No matching flocks</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="space-y-4 pt-2">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-gold mb-2">
                                            Expected Meat Price (₦ / kg)
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={valForm.projectedPricePerKg || ''}
                                            onChange={(e) => setValForm({ ...valForm, projectedPricePerKg: Number(e.target.value) })}
                                            className="w-full px-4 py-3 rounded-lg bg-farma-gold/5 border border-farma-gold/30 text-farma-forest text-sm font-bold focus:outline-none focus:ring-2 focus:ring-farma-gold/50 transition-shadow tabular-nums"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-gold mb-2">
                                            Expected Produce Price (₦ / unit)
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={valForm.projectedPricePerProduceUnit || ''}
                                            onChange={(e) => setValForm({ ...valForm, projectedPricePerProduceUnit: Number(e.target.value) })}
                                            className="w-full px-4 py-3 rounded-lg bg-farma-gold/5 border border-farma-gold/30 text-farma-forest text-sm font-bold focus:outline-none focus:ring-2 focus:ring-farma-gold/50 transition-shadow tabular-nums"
                                        />
                                    </div>
                                </div>
                                
                                <button
                                    type="submit"
                                    disabled={valLoading || !isValidValuation}
                                    className="w-full py-4 rounded-lg bg-farma-forest hover:bg-farma-green-light text-white font-bold text-xs uppercase tracking-widest shadow-md transition-colors disabled:opacity-50 cursor-pointer mt-4 flex justify-center items-center gap-2"
                                >
                                    {valLoading ? (
                                        <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> Calculating...</>
                                    ) : !isValidValuation ? 'Please Select a Target' : 'Calculate Profit'}
                                </button>
                            </form>
                            
                            <div className="lg:col-span-7 bg-farma-sand-dark border border-farma-forest/10 rounded-xl overflow-hidden shadow-sm flex flex-col h-fit">
                                <div className="p-5 border-b border-farma-forest/10 flex justify-between items-center bg-white/40">
                                    <h5 className="font-bold text-farma-forest">Your Profit Forecast</h5>
                                    {valResult && (
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-farma-forest/60 bg-white px-2 py-1 rounded shadow-sm max-w-[200px] truncate">
                                            {valResult.scopeName}
                                        </span>
                                    )}
                                </div>
                                
                                <div className="p-6 flex-1 flex flex-col justify-center">
                                    {!valResult && !valLoading ? (
                                        <div className="text-center text-farma-forest/40 py-8">
                                            <IconCalculatorLarge />
                                            <p className="mt-3 text-xs font-semibold uppercase tracking-widest leading-relaxed">
                                                Select what you want to calculate and <br/> enter your selling prices to estimate your profit.
                                            </p>
                                        </div>
                                    ) : valResult ? (
                                        <div className="space-y-6">
                                            
                                            {/* WHAT YOU HAVE TO SELL */}
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="bg-white p-3 rounded-lg border border-farma-forest/10 text-center">
                                                    <span className="text-[9px] font-bold uppercase tracking-widest text-farma-forest/50 block mb-1">Live Birds to Sell</span>
                                                    <span className="text-lg font-bold text-farma-forest tabular-nums">{valResult.liveBirds.toLocaleString()}</span>
                                                </div>
                                                <div className="bg-white p-3 rounded-lg border border-farma-forest/10 text-center">
                                                    <span className="text-[9px] font-bold uppercase tracking-widest text-farma-forest/50 block mb-1">Est. Total Weight</span>
                                                    <span className="text-lg font-bold text-farma-forest tabular-nums">
                                                        {valResult.totalWeightKg.toLocaleString(undefined, { maximumFractionDigits: 1 })}<span className="text-xs text-farma-forest/40">kg</span>
                                                    </span>
                                                </div>
                                                <div className="bg-white p-3 rounded-lg border border-farma-forest/10 text-center">
                                                    <span className="text-[9px] font-bold uppercase tracking-widest text-farma-forest/50 block mb-1">Stocked Produce</span>
                                                    <span className="text-lg font-bold text-farma-forest tabular-nums">{valResult.produceUnits.toLocaleString()}</span>
                                                </div>
                                            </div>
                                            
                                            {/* THE MATH */}
                                            <div className="bg-white rounded-xl border border-farma-forest/10 p-5 space-y-4 shadow-sm relative">
                                                
                                                <div className="flex justify-between items-center group">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-farma-green opacity-50"></div>
                                                        <div>
                                                            <span className="text-xs font-bold text-farma-forest/70 uppercase tracking-wider block">Money Already Made</span>
                                                            <span className="text-[9px] font-semibold text-farma-forest/40 uppercase tracking-widest">From past egg or bird sales</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm font-bold text-farma-forest tabular-nums">₦{(valResult.realizedRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                </div>
                                                
                                                <div className="flex justify-between items-center group">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-farma-gold opacity-80"></div>
                                                        <div>
                                                            <span className="text-xs font-bold text-farma-forest/70 uppercase tracking-wider block">Expected Future Sales</span>
                                                            <span className="text-[9px] font-semibold text-farma-forest/40 uppercase tracking-widest">Selling remaining birds & produce</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm font-bold text-farma-gold tabular-nums">+ ₦{(valResult.totalUnsoldAssetValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                </div>
                                                
                                                <div className="flex justify-between items-center pt-3 border-t-2 border-dashed border-farma-forest/10">
                                                    <span className="text-xs font-bold text-farma-forest uppercase tracking-wider">Total Expected Revenue</span>
                                                    <span className="text-lg font-bold text-farma-forest tabular-nums">₦{(valResult.totalProjectedRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                </div>

                                                <div className="flex justify-between items-center pt-3 border-t border-farma-forest/10">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-farma-terracotta"></div>
                                                        <div>
                                                            <span className="text-xs font-bold text-farma-terracotta uppercase tracking-wider block">Money Spent (Costs)</span>
                                                            <span className="text-[9px] font-semibold text-farma-terracotta/60 uppercase tracking-widest">All feed, meds, and expenses</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm font-bold text-farma-terracotta tabular-nums">- ₦{(valResult.actualSunkCosts || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            </div>
                                            
                                            {/* THE BOTTOM LINE */}
                                            <div className={`p-5 rounded-xl border-2 shadow-sm ${isValProfitable ? 'bg-farma-green/10 border-farma-green/30' : 'bg-farma-terracotta/10 border-farma-terracotta/30'}`}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isValProfitable ? 'text-farma-green' : 'text-farma-terracotta'}`}>
                                                        Estimated Net {isValProfitable ? 'Profit' : 'Loss'}
                                                    </span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isValProfitable ? 'bg-farma-green text-white' : 'bg-farma-terracotta text-white'}`}>
                                                        {valResult.profitMargin.toFixed(1)}% Margin
                                                    </span>
                                                </div>
                                                <span className={`text-4xl font-bold tabular-nums tracking-tighter ${isValProfitable ? 'text-farma-green' : 'text-farma-terracotta'}`}>
                                                    {isValProfitable ? '' : '- '}₦{Math.abs(valResult.projectedNetProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTabMode === 'ANALYTICS' && (
                    <div className="space-y-6 pt-2">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                            <div className="bg-farma-green/5 border border-farma-green/20 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                                <span className="text-xs font-semibold text-farma-green uppercase tracking-widest block mb-1">
                                    Total Income
                                </span>
                                <div className="text-3xl font-bold text-farma-green tabular-nums">
                                    ₦{activeRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                            </div>

                            <div className="bg-farma-terracotta/5 border border-farma-terracotta/20 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                                <span className="text-xs font-semibold text-farma-terracotta uppercase tracking-widest block mb-1">
                                    Total Expenses
                                </span>
                                <div className="text-3xl font-bold text-farma-terracotta tabular-nums">
                                    ₦{activeExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                            </div>

                            <div className={`rounded-xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden ${activeNetProfit >= 0 ? 'bg-farma-forest border border-farma-forest' : 'bg-farma-forest border border-farma-terracotta'}`}>
                                <div className="flex items-center justify-between relative z-10 mb-2">
                                    <span className="text-xs font-semibold text-white/60 uppercase tracking-widest">
                                        Net Profit
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${activeNetProfit >= 0
                                            ? 'text-farma-green border-farma-green/30 bg-white'
                                            : 'text-farma-terracotta border-farma-terracotta/30 bg-white'
                                        }`}>
                                        {activeNetProfit >= 0 ? 'Profit' : 'Loss'}
                                    </span>
                                </div>
                                <div className={`text-3xl font-bold tabular-nums relative z-10 ${activeNetProfit >= 0 ? 'text-white' : 'text-farma-terracotta'}`}>
                                    {activeNetProfit >= 0 ? '+' : ''}₦{activeNetProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                                <span className="text-[10px] font-bold text-farma-gold mt-2 relative z-10 block uppercase tracking-widest">
                                    Profit Margin: {activeMargin.toFixed(1)}%
                                </span>
                            </div>
                        </div>

                        {batchPnl && (
                            <div className="bg-farma-sand border border-farma-forest/10 rounded-xl p-5 shadow-sm space-y-4">
                                <div>
                                    <h4 className="text-sm font-bold uppercase text-farma-forest tracking-widest flex items-center gap-2">
                                        Flock Economics (Per Bird)
                                    </h4>
                                    <p className="text-[10px] font-semibold text-farma-forest/60 mt-1 uppercase tracking-widest">
                                        Shows how much you spent and made for each bird in this flock.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="bg-white border border-farma-forest/10 rounded-lg p-5 shadow-sm">
                                        <span className="text-[10px] text-farma-forest/50 font-bold uppercase tracking-widest block mb-1">
                                            Cost (Per Bird)
                                        </span>
                                        <span className="text-2xl font-bold text-farma-terracotta tabular-nums block">
                                            ₦{(batchPnl.costPerBird || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>

                                    <div className="bg-white border border-farma-forest/10 rounded-lg p-5 shadow-sm">
                                        <span className="text-[10px] text-farma-forest/50 font-bold uppercase tracking-widest block mb-1">
                                            Income (Per Bird)
                                        </span>
                                        <span className="text-2xl font-bold text-farma-green tabular-nums block">
                                            ₦{(batchPnl.revenuePerBird || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>

                                    <div className="bg-white border border-farma-forest/10 rounded-lg p-5 shadow-sm border-l-4 border-l-farma-forest">
                                        <span className="text-[10px] text-farma-forest/50 font-bold uppercase tracking-widest block mb-1">
                                            Profit (Per Bird)
                                        </span>
                                        <span className="text-2xl font-bold text-farma-forest tabular-nums block">
                                            ₦{(batchPnl.profitPerBird || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="bg-white border border-farma-forest/10 rounded-xl p-6 shadow-sm flex flex-col h-full">
                                <div className="border-b border-farma-forest/10 pb-4 mb-5">
                                    <h4 className="text-lg font-bold text-farma-forest">
                                        Expense Breakdown
                                    </h4>
                                    <p className="text-xs text-farma-forest/50 font-medium mt-1">
                                        Where your money is being spent
                                    </p>
                                </div>

                                {loading ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                                        <div className="w-8 h-8 border-4 border-farma-green/20 border-t-farma-green rounded-full animate-spin mb-3"></div>
                                        <span className="text-farma-forest/40 text-xs font-semibold uppercase tracking-widest">Loading data...</span>
                                    </div>
                                ) : expenseBreakdown.length > 0 ? (
                                    <div className="space-y-5">
                                        {expenseBreakdown.map((item, idx) => {
                                            const pct = item.percentageOfTotalCost || 0;
                                            return (
                                                <div key={item.category || idx} className="space-y-2">
                                                    <div className="flex justify-between items-end">
                                                        <span className="font-semibold text-farma-forest text-xs">
                                                            {item.category.replace('_', ' ')}
                                                        </span>
                                                        <div className="text-right">
                                                            <span className="text-farma-forest font-semibold text-xs tabular-nums block">
                                                                ₦{(item.totalAmount || 0).toLocaleString()}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-farma-terracotta">
                                                                {pct.toFixed(1)}% of total
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="w-full bg-farma-forest/5 rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className="bg-farma-terracotta h-full rounded-full transition-all duration-1000 ease-out"
                                                            style={{ width: `${Math.min(100, pct)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-center">
                                        <span className="text-farma-forest/40 text-xs font-semibold uppercase tracking-widest">No expenses recorded yet.</span>
                                    </div>
                                )}
                            </div>

                            <div className="lg:col-span-2 bg-white border border-farma-forest/10 rounded-xl p-6 shadow-sm h-full">
                                <div className="border-b border-farma-forest/10 pb-4 mb-5">
                                    <h4 className="text-lg font-bold text-farma-forest">
                                        Flock Comparison
                                    </h4>
                                    <p className="text-xs text-farma-forest/50 font-medium mt-1">
                                        Compare income and profit across different flocks
                                    </p>
                                </div>

                                {loading ? (
                                    <div className="py-12 flex flex-col items-center justify-center text-center">
                                        <div className="w-8 h-8 border-4 border-farma-green/20 border-t-farma-green rounded-full animate-spin mb-3"></div>
                                    </div>
                                ) : farmOverview && farmOverview.batchSummaries && farmOverview.batchSummaries.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {farmOverview.batchSummaries.map((b) => (
                                            <div
                                                key={b.batchId}
                                                className="bg-farma-cream border border-farma-forest/10 rounded-lg p-5 hover:shadow-md transition-shadow duration-300"
                                            >
                                                <div className="flex items-start justify-between border-b border-farma-forest/10 pb-3 mb-4">
                                                    <div>
                                                        <span className="text-[10px] font-bold text-farma-forest/50 uppercase tracking-widest block mb-1">
                                                            {b.sectionName}
                                                        </span>
                                                        <h5 className="text-sm font-bold text-farma-forest leading-none">
                                                            Batch #{b.batchNumber}
                                                        </h5>
                                                    </div>
                                                    <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest bg-white border border-farma-forest/10 text-farma-forest/70 shadow-sm">
                                                        {b.status}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                    <div>
                                                        <span className="text-[10px] text-farma-forest/50 font-bold block uppercase tracking-widest mb-1">Revenue</span>
                                                        <span className="font-bold text-farma-green text-sm tabular-nums">
                                                            ₦{(b.revenue || 0).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] text-farma-forest/50 font-bold block uppercase tracking-widest mb-1">Expenses</span>
                                                        <span className="font-bold text-farma-terracotta text-sm tabular-nums">
                                                            ₦{(b.expenses || 0).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="bg-white rounded-md p-3 border border-farma-forest/5 flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-farma-forest/60 uppercase tracking-widest">Net Profit</span>
                                                    <span className={`text-sm font-bold tabular-nums ${(b.netProfit || 0) >= 0 ? 'text-farma-green' : 'text-farma-terracotta'}`}>
                                                        {(b.netProfit || 0) >= 0 ? '+' : ''}₦{(b.netProfit || 0).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 flex flex-col items-center justify-center text-center">
                                        <div className="w-12 h-12 rounded-full bg-farma-sand flex items-center justify-center text-farma-forest/30 mb-4 shadow-inner">
                                            <IconEmpty />
                                        </div>
                                        <span className="text-farma-forest/50 font-semibold text-sm">No flock data available.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTabMode === 'LEDGER' && (
                    <div className="bg-white border border-farma-forest/10 rounded-xl overflow-hidden shadow-sm mt-2">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-farma-forest min-w-[700px]">
                                <thead className="bg-farma-sand text-farma-forest/60 uppercase text-[10px] font-bold tracking-widest border-b border-farma-forest/10">
                                    <tr>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Category & Details</th>
                                        <th className="px-6 py-4">Flock Ref</th>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4 text-right">Amount (₦)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-farma-forest/5">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-16 text-center text-farma-forest/40 font-semibold tracking-widest uppercase text-xs">
                                                Loading records...
                                            </td>
                                        </tr>
                                    ) : transactions.length > 0 ? (
                                        transactions.map((tx, idx) => {
                                            const txId = tx.transactionId || idx;
                                            return (
                                                <tr key={txId} className="hover:bg-farma-cream transition-colors">
                                                    <td className="px-6 py-4 font-semibold text-farma-forest whitespace-nowrap tabular-nums">{tx.transactionDate}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-farma-forest mb-1">{tx.category.replace('_', ' ')}</div>
                                                        <span className="text-xs text-farma-forest/60 block truncate max-w-[250px]" title={tx.description}>
                                                            {tx.description}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-semibold text-farma-forest/70 tabular-nums">
                                                        {tx.batchNumber ? `#${tx.batchNumber}` : tx.batchId ? `Batch #${tx.batchId}` : 'General Farm Expense'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {tx.type === 'CREDIT' ? (
                                                            <span className="px-2.5 py-1 rounded-md bg-farma-green/10 text-farma-green border border-farma-green/20 text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-farma-green"></span> Income
                                                            </span>
                                                        ) : (
                                                            <span className="px-2.5 py-1 rounded-md bg-farma-terracotta/10 text-farma-terracotta border border-farma-terracotta/20 text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-farma-terracotta"></span> Expense
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className={`px-6 py-4 text-right font-bold tabular-nums ${tx.type === 'CREDIT' ? 'text-farma-green' : 'text-farma-terracotta'}`}>
                                                        {tx.type === 'CREDIT' ? '+' : '-'} {(tx.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-16 text-center">
                                                <span className="text-farma-forest/40 font-semibold text-sm block">No records found for this selection.</span>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {showExportModal && (
                <div className="fixed inset-0 bg-farma-forest/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-farma-cream rounded-xl max-w-sm w-full shadow-2xl flex flex-col overflow-hidden border border-farma-forest/20">
                        <div className="p-6 bg-white border-b border-farma-forest/10">
                            <h4 className="text-xl font-bold text-farma-forest">Download Report</h4>
                            <p className="text-[10px] font-bold text-farma-forest/50 uppercase tracking-widest mt-1">
                                Select Date Range
                            </p>
                        </div>

                        <form onSubmit={handleExport} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-2">Start Date *</label>
                                <input
                                    type="date"
                                    required
                                    value={exportForm.startDate}
                                    onChange={(e) => setExportForm({ ...exportForm, startDate: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg bg-white border border-farma-forest/20 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-farma-forest/30"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-2">End Date *</label>
                                <input
                                    type="date"
                                    required
                                    value={exportForm.endDate}
                                    onChange={(e) => setExportForm({ ...exportForm, endDate: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg bg-white border border-farma-forest/20 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-farma-forest/30"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowExportModal(false)} className="flex-1 py-3 bg-transparent text-farma-forest/60 font-bold text-xs uppercase tracking-wider hover:bg-farma-forest/5 rounded-lg transition-colors cursor-pointer">
                                    Cancel
                                </button>
                                <button type="submit" disabled={exporting} className="flex-1 py-3 bg-farma-forest text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm hover:bg-farma-green-light transition-colors cursor-pointer disabled:opacity-50">
                                    {exporting ? 'Generating...' : 'Download CSV'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showTxModal && (
                <div className="fixed inset-0 bg-farma-forest/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
                    <div className="bg-farma-cream border border-farma-forest/20 rounded-xl max-w-lg w-full shadow-2xl flex flex-col max-h-[95vh] relative overflow-hidden">

                        <div className={`h-1.5 w-full shrink-0 shadow-sm transition-colors duration-300 ${txForm.transactionType === 'CREDIT' ? 'bg-farma-green' : 'bg-farma-terracotta'}`}></div>

                        <div className="flex items-center justify-between border-b border-farma-forest/10 p-6 bg-white shrink-0">
                            <div>
                                <h4 className="text-xl font-bold text-farma-forest tracking-tight">Add Record</h4>
                                <p className="text-[10px] font-bold text-farma-forest/50 uppercase tracking-widest mt-1">
                                    Add a new income or expense record
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowTxModal(false)}
                                className="text-farma-forest/40 hover:text-farma-terracotta hover:bg-farma-terracotta/10 bg-farma-forest/5 transition-colors p-2 rounded-lg cursor-pointer"
                            >
                                <IconClose />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            <form id="tx-form" onSubmit={handleCreateTransaction} className="space-y-6">

                                <div className="bg-white border border-farma-forest/10 rounded-lg p-5 shadow-sm text-center flex flex-col items-center">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-farma-forest/50 mb-2">Amount to Record</span>
                                    <div className={`text-4xl font-bold tabular-nums tracking-tighter ${txForm.transactionType === 'CREDIT' ? 'text-farma-green' : 'text-farma-terracotta'}`}>
                                        {txForm.transactionType === 'CREDIT' ? '+' : '-'} ₦{Number(txForm.amount || 0).toLocaleString()}
                                    </div>
                                    <span className="text-[10px] font-semibold text-farma-forest/40 uppercase tracking-widest mt-2">
                                        {txForm.transactionType === 'CREDIT' ? 'Will be recorded as Income' : 'Will be recorded as Expense'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-2">Record Type *</label>
                                        <select
                                            value={txForm.transactionType}
                                            onChange={(e) => setTxForm({ ...txForm, transactionType: e.target.value as TransactionType })}
                                            className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm font-semibold focus:outline-none focus:border-farma-gold focus:ring-2 focus:ring-farma-gold/30 transition-shadow shadow-sm cursor-pointer"
                                        >
                                            <option value="CREDIT">Income (+)</option>
                                            <option value="DEBIT">Expense (-)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-2">Category *</label>
                                        <select
                                            value={txForm.transactionCategory}
                                            onChange={(e) => setTxForm({ ...txForm, transactionCategory: e.target.value as TransactionCategory })}
                                            className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm font-semibold focus:outline-none focus:border-farma-gold focus:ring-2 focus:ring-farma-gold/30 transition-shadow shadow-sm cursor-pointer"
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

                                <div className="relative">
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-2">
                                        Select Flock (Optional)
                                    </label>
                                    <select
                                        value={txForm.batchId}
                                        onChange={(e) => setTxForm({ ...txForm, batchId: e.target.value === '' ? '' : Number(e.target.value) })}
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm font-semibold focus:outline-none focus:border-farma-gold focus:ring-2 focus:ring-farma-gold/30 transition-shadow shadow-sm cursor-pointer"
                                    >
                                        <option value="">General Farm Record</option>
                                        {batches.map((b) => (
                                            <option key={b.id} value={b.id}>{b.sectionName} — Batch #{b.batchNumber}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-2">Amount (₦) *</label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={txForm.amount || ''}
                                            onChange={(e) => setTxForm({ ...txForm, amount: Number(e.target.value) })}
                                            className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-base font-bold focus:outline-none focus:border-farma-gold focus:ring-2 focus:ring-farma-gold/30 transition-shadow shadow-sm tabular-nums"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-2">Date *</label>
                                        <input
                                            type="date"
                                            required
                                            value={txForm.transactionDate}
                                            onChange={(e) => setTxForm({ ...txForm, transactionDate: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm font-semibold focus:outline-none focus:border-farma-gold focus:ring-2 focus:ring-farma-gold/30 transition-shadow shadow-sm tabular-nums"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-2">
                                        Description / Notes *
                                    </label>
                                    <textarea
                                        rows={3}
                                        required
                                        maxLength={250}
                                        placeholder="e.g. Sold 200 chickens at ₦4,500 each."
                                        value={txForm.description}
                                        onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm focus:outline-none focus:border-farma-gold focus:ring-2 focus:ring-farma-gold/30 transition-shadow shadow-sm resize-none"
                                    />
                                </div>
                            </form>
                        </div>

                        <div className="p-5 bg-farma-sand border-t border-farma-forest/10 shrink-0 flex items-center justify-end gap-3 z-10">
                            <button
                                type="button"
                                onClick={() => setShowTxModal(false)}
                                className="px-5 py-3 rounded-lg bg-transparent hover:bg-farma-forest/5 text-farma-forest/60 hover:text-farma-forest font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="tx-form"
                                disabled={submitting || txForm.amount <= 0}
                                className={`px-6 py-3 rounded-lg text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50 ${txForm.transactionType === 'CREDIT' ? 'bg-farma-green hover:bg-farma-green-light' : 'bg-farma-terracotta hover:bg-[#c6583d]'
                                    }`}
                            >
                                {submitting ? 'Saving...' : 'Save Record'}
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

const IconDownload = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const IconPlus = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
    </svg>
);

const IconCheck = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const IconClose = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const IconEmpty = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const IconCalculator = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
);

const IconCalculatorLarge = () => (
    <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
);

const IconChevronDown = () => (
    <svg className="w-4 h-4 text-farma-forest/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
    </svg>
);  