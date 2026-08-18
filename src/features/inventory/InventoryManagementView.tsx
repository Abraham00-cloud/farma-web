import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { infrastructureService } from '../../services/infrastructureService';
import { inventoryService } from '../../services/inventoryService';
import type { FarmResponseDto } from '../../types/infrastructure';
import type { InventoryRequestDto, InventoryResponseDto, InventoryCategory } from '../../types/inventory';

interface InventoryManagementViewProps {
    organisationId: number;
    userRole?: string;
    currentUserId?: number;
}

export const InventoryManagementView: React.FC<InventoryManagementViewProps> = ({ 
    organisationId, 
    userRole = 'PROPRIETOR', 
    currentUserId 
}) => {
    const isProprietor = userRole?.toUpperCase() === 'PROPRIETOR' || userRole?.toUpperCase() === 'ADMIN';

    const [farms, setFarms] = useState<FarmResponseDto[]>([]);
    const [selectedFarmId, setSelectedFarmId] = useState<number | ''>('');
    const [inventories, setInventories] = useState<InventoryResponseDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Active Category Tab
    const [activeCategory, setActiveCategory] = useState<InventoryCategory | 'ALL'>('ALL');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [onlyLowStock, setOnlyLowStock] = useState<boolean>(false);

    // Modal controls
    const [showAddModal, setShowAddModal] = useState<boolean>(false);
    
    // Split Action Modals
    const [showAdjustModal, setShowAdjustModal] = useState<boolean>(false);
    const [showRestockModal, setShowRestockModal] = useState<boolean>(false);
    
    const [selectedItem, setSelectedItem] = useState<InventoryResponseDto | null>(null);
    
    // Action States
    const [adjustAmount, setAdjustAmount] = useState<number | ''>('');
    const [restockQuantity, setRestockQuantity] = useState<number | ''>('');
    const [restockUnitPrice, setRestockUnitPrice] = useState<number | ''>('');

    // Helper function to derive default expiry date lazily
    const getDefaultExpiryDate = () =>
        new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // New Item Form State
    const [itemForm, setItemForm] = useState<InventoryRequestDto>(() => ({
        name: '',
        category: 'FEED',
        quantity: 0,
        unit: 'bags',
        farmId: 0,
        unitPrice: 0,
        lowStockThreshold: 10,
        expiryDate: getDefaultExpiryDate(),
    }));

    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            try {
                let farmList = await infrastructureService.getFarmsByOrganisation(organisationId);
                if (!isProprietor && currentUserId) {
                    farmList = farmList.filter((farm) => farm.managerId === currentUserId);
                }
                if (isMounted && farmList.length > 0) {
                    setFarms(farmList);
                    setSelectedFarmId(farmList[0].id);
                    setItemForm((prev) => ({ ...prev, farmId: farmList[0].id }));
                }
            } catch {
                // Fallback
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

        const fetchStockForFarm = async () => {
            setLoading(true);
            try {
                const items = await inventoryService.getInventoriesByFarm(Number(selectedFarmId));
                if (isMounted) setInventories(Array.isArray(items) ? items : []);
            } catch {
                if (isMounted) setInventories([]);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchStockForFarm();
        return () => { isMounted = false; };
    }, [selectedFarmId]);

    const reloadCurrentFarmStock = async () => {
        if (!selectedFarmId) return;
        try {
            const items = await inventoryService.getInventoriesByFarm(Number(selectedFarmId));
            setInventories(Array.isArray(items) ? items : []);
        } catch {
            setInventories([]);
        }
    };

    const handleCreateInventory = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            await inventoryService.createInventory(itemForm);
            setSuccessMessage('Inventory item successfully onboarded!');
            setShowAddModal(false);
            setItemForm({
                name: '',
                category: 'FEED',
                quantity: 0,
                unit: 'bags',
                farmId: selectedFarmId ? Number(selectedFarmId) : 0,
                unitPrice: 0,
                lowStockThreshold: 10,
                expiryDate: getDefaultExpiryDate(),
            });
            await reloadCurrentFarmStock();
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setErrorMessage(typeof err.response?.data === 'string' ? err.response.data : err.response?.data?.message || 'Failed to register item.');
            } else {
                setErrorMessage('An unexpected error occurred.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // ACTION 1: Manual Adjust (Spoilage/Errors)
    const handleAdjustStock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem || adjustAmount === '' || adjustAmount === 0) return;

        setSubmitting(true);
        setErrorMessage(null);

        try {
            await inventoryService.updateStockLevel(selectedItem.id, Number(adjustAmount));
            setSuccessMessage(`Stock adjusted successfully for ${selectedItem.name}!`);
            setShowAdjustModal(false);
            setSelectedItem(null);
            setAdjustAmount('');
            await reloadCurrentFarmStock();
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setErrorMessage(typeof err.response?.data === 'string' ? err.response.data : err.response?.data?.message || 'Failed to update stock.');
            } else {
                setErrorMessage('An unexpected error occurred.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // ACTION 2: Commercial Restock (Updates WAC)
    const handleRestock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem || restockQuantity === '' || restockUnitPrice === '') return;
        
        if (Number(restockQuantity) <= 0 || Number(restockUnitPrice) <= 0) {
            setErrorMessage("Both restock quantity and unit price must be strictly greater than zero.");
            return;
        }

        setSubmitting(true);
        setErrorMessage(null);

        try {
            await inventoryService.restockInventory(selectedItem.id, Number(restockQuantity), Number(restockUnitPrice));
            setSuccessMessage(`Restocked ${selectedItem.name} successfully! Valuation updated.`);
            setShowRestockModal(false);
            setSelectedItem(null);
            setRestockQuantity('');
            setRestockUnitPrice('');
            await reloadCurrentFarmStock();
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setErrorMessage(typeof err.response?.data === 'string' ? err.response.data : err.response?.data?.message || 'Failed to restock item.');
            } else {
                setErrorMessage('An unexpected error occurred.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const filteredInventories = inventories.filter((item) => {
        const matchesCategory = activeCategory === 'ALL' ? true : activeCategory === 'MEDICINE' ? item.category === 'MEDICINE' || item.category === 'VACCINE' : item.category === activeCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLowStock = onlyLowStock ? item.isLowStock : true;
        return matchesCategory && matchesSearch && matchesLowStock;
    });

    const totalValuation = inventories.reduce((acc, i) => acc + (i.totalValue || 0), 0);
    const feedCount = inventories.filter((i) => i.category === 'FEED').length;
    const medCount = inventories.filter((i) => i.category === 'MEDICINE' || i.category === 'VACCINE').length;
    const lowStockAlerts = inventories.filter((i) => i.isLowStock).length;

    return (
        <div className="space-y-6 lg:space-y-8 font-sans max-w-7xl mx-auto pb-12">
            
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-[#101B14]/10 pb-5">
                <div>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-[#101B14] tracking-tight font-['Fraunces',serif]">
                        {isProprietor ? 'Warehouse Supply & Material Ledger' : 'Site Warehouse & Consumables'}
                    </h3>
                    <p className="text-sm text-[#101B14]/70 font-medium mt-1">
                        Segmented stock management for feeds, vaccines, medication, and operational tools per farm site.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="px-5 py-3 rounded-lg bg-[#101B14] hover:bg-[#2A5C38] text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer shrink-0"
                >
                    <span>📦 Onboard New Material</span>
                </button>
            </div>

            {/* Alerts */}
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

            {/* KPI Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Farm Facility Picker */}
                <div className="bg-[#ECE6D6] border border-[#101B14]/10 rounded-xl p-5 shadow-xs flex flex-col justify-center">
                    <span className="text-[10px] font-mono font-bold text-[#101B14]/60 uppercase tracking-widest block mb-2">
                        Active Farm Facility
                    </span>
                    <select
                        value={selectedFarmId}
                        onChange={(e) => setSelectedFarmId(Number(e.target.value))}
                        disabled={!isProprietor && farms.length <= 1}
                        className="w-full px-3 py-2.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-[#2A5C38]/30 transition-all shadow-sm cursor-pointer appearance-none disabled:opacity-50"
                        style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23101B14' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                    >
                        {farms.map((f) => (
                            <option key={f.id} value={f.id}>🏢 {f.name}</option>
                        ))}
                    </select>
                </div>

                {/* Total Valuation */}
                <div className="bg-white border border-[#101B14]/10 rounded-xl p-5 shadow-xs flex flex-col justify-center">
                    <span className="text-[10px] font-mono font-bold text-[#101B14]/60 uppercase tracking-widest block">
                        Facility Asset Valuation
                    </span>
                    <div className="text-2xl font-extrabold text-[#2A5C38] mt-2 font-mono">
                        ₦{totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>

                {/* Stock Breakdown */}
                <div className="bg-white border border-[#101B14]/10 rounded-xl p-5 shadow-xs flex flex-col justify-center">
                    <span className="text-[10px] font-mono font-bold text-[#101B14]/60 uppercase tracking-widest block">
                        Consumable Stock Count
                    </span>
                    <div className="text-2xl font-extrabold text-[#101B14] mt-2 font-mono">
                        {feedCount} <span className="text-sm text-[#101B14]/50 font-sans">Feeds</span> / {medCount} <span className="text-sm text-[#101B14]/50 font-sans">Meds</span>
                    </div>
                </div>

                {/* Low Stock Alerts */}
                <div className="bg-white border border-[#101B14]/10 rounded-xl p-5 shadow-xs flex flex-col justify-center">
                    <span className="text-[10px] font-mono font-bold text-[#101B14]/60 uppercase tracking-widest block">
                        Low-Stock Alerts
                    </span>
                    <div className="text-2xl font-extrabold text-[#E76F51] mt-2 font-mono">
                        {lowStockAlerts} <span className="text-sm font-sans font-bold">Items Critical</span>
                    </div>
                </div>
            </div>

            {/* CATEGORY WORKSPACE NAVIGATION TABS */}
            <div className="bg-[#FBF9F5] border border-[#101B14]/10 rounded-xl p-5 shadow-xs space-y-5">
                
                {/* Navigation Tabs */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#101B14]/10 pb-5">
                    <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
                        {(['ALL', 'FEED', 'MEDICINE', 'EQUIPMENT', 'OTHER'] as const).map((cat) => {
                            const isActive = activeCategory === cat;
                            const count = cat === 'ALL' ? inventories.length : cat === 'FEED' ? feedCount : cat === 'MEDICINE' ? medCount : inventories.filter(i => i.category === cat).length;
                            const label = cat === 'ALL' ? 'All Items' : cat === 'FEED' ? '🌾 Feed' : cat === 'MEDICINE' ? '💊 Meds/Vax' : cat === 'EQUIPMENT' ? '🚜 Equip' : '📦 Other';

                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                                        isActive
                                            ? 'bg-[#101B14] text-[#FBF9F5] shadow-md'
                                            : 'bg-white border border-[#101B14]/10 text-[#101B14]/60 hover:bg-[#101B14]/5 hover:text-[#101B14]'
                                    }`}
                                >
                                    {label} ({count})
                                </button>
                            );
                        })}
                    </div>

                    {/* Low Stock Toggle */}
                    <button
                        type="button"
                        onClick={() => setOnlyLowStock(!onlyLowStock)}
                        className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer shrink-0 ${
                            onlyLowStock
                                ? 'bg-[#E76F51]/10 text-[#E76F51] border-[#E76F51]/30 shadow-sm'
                                : 'bg-white text-[#101B14]/60 border-[#101B14]/10 hover:bg-[#101B14]/5 hover:text-[#101B14]'
                        }`}
                    >
                        {onlyLowStock ? '⚠️ Low Stock Active' : 'Filter Low Stock'}
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-[#101B14]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search stock items by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 rounded-lg bg-white border border-[#101B14]/15 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#2A5C38] focus:ring-2 focus:ring-[#2A5C38]/30 transition-all shadow-sm"
                    />
                </div>

                {/* DETAILED MATERIAL STOCK LEDGER CARDS GRID */}
                {loading ? (
                    <div className="py-16 text-center text-[#101B14]/40 font-mono text-xs font-bold uppercase tracking-widest flex flex-col items-center">
                        <div className="w-10 h-10 border-4 border-[#2A5C38]/20 border-t-[#2A5C38] rounded-full animate-spin mb-4"></div>
                        Loading warehouse ledgers...
                    </div>
                ) : filteredInventories.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pt-2">
                        {filteredInventories.map((item) => {
                            const stockRatio = Math.min(100, Math.round((item.currentQuantity / ((item.lowStockThreshold || 1) * 5)) * 100));

                            return (
                                <div
                                    key={item.id}
                                    className={`bg-white border rounded-xl p-6 shadow-xs flex flex-col justify-between transition-all duration-300 hover:shadow-md ${
                                        item.isLowStock ? 'border-[#E76F51]/30 bg-[#E76F51]/5' : 'border-[#101B14]/10'
                                    }`}
                                >
                                    {/* Card Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="pr-2">
                                            <span className="text-[9px] font-mono font-extrabold text-[#101B14]/50 uppercase tracking-widest block mb-1">
                                                {item.category}
                                            </span>
                                            <h4 className="text-lg font-extrabold text-[#101B14] leading-tight font-['Fraunces',serif]">
                                                {item.name}
                                            </h4>
                                        </div>
                                        {item.isLowStock ? (
                                            <span className="px-2.5 py-1 rounded-md bg-[#E76F51]/10 text-[#E76F51] border border-[#E76F51]/20 text-[9px] font-extrabold uppercase tracking-wider shrink-0">
                                                Low Stock
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-1 rounded-md bg-[#2A5C38]/10 text-[#2A5C38] border border-[#2A5C38]/20 text-[9px] font-extrabold uppercase tracking-wider shrink-0">
                                                Normal
                                            </span>
                                        )}
                                    </div>

                                    {/* Quantity Visual Bar */}
                                    <div className="space-y-2 mb-5">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-bold text-[#101B14]/60 uppercase tracking-wider">Balance</span>
                                            <span className="text-xl font-extrabold text-[#101B14] font-mono">
                                                {item.currentQuantity.toLocaleString()} <span className="text-sm font-sans text-[#101B14]/50">Units</span>
                                            </span>
                                        </div>
                                        <div className="w-full bg-[#101B14]/5 rounded-full h-2 overflow-hidden border border-[#101B14]/5">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${item.isLowStock ? 'bg-[#E76F51]' : 'bg-[#2A5C38]'}`}
                                                style={{ width: `${Math.max(stockRatio, 2)}%` }} // Minimum 2% width so it's always visible
                                            />
                                        </div>
                                        <div className="text-[9px] font-mono font-bold text-[#101B14]/40 text-right">
                                            Threshold: {item.lowStockThreshold} Units
                                        </div>
                                    </div>

                                    {/* Financial Details */}
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#101B14]/10 mb-4">
                                        <div>
                                            <span className="text-[9px] font-extrabold text-[#101B14]/50 uppercase tracking-widest block mb-0.5">Unit Price (WAC)</span>
                                            <span className="font-bold text-[#101B14] font-mono text-sm">
                                                ₦{Number(item.unitPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] font-extrabold text-[#101B14]/50 uppercase tracking-widest block mb-0.5">Total Value</span>
                                            <span className="font-extrabold text-[#2A5C38] font-mono text-sm">
                                                ₦{(item.totalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Footer & Actions */}
                                    <div className="flex items-center justify-between pt-4 border-t border-[#101B14]/10">
                                        <span className="text-[10px] font-mono font-bold text-[#101B14]/50">
                                            Exp: <span className="text-[#101B14]/80">{item.expiryDate || 'N/A'}</span>
                                        </span>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedItem(item);
                                                    setAdjustAmount('');
                                                    setErrorMessage(null);
                                                    setShowAdjustModal(true);
                                                }}
                                                className="px-3 py-2 rounded-md bg-white border border-[#101B14]/15 hover:border-[#E76F51] hover:bg-[#E76F51]/10 text-[#101B14] hover:text-[#E76F51] text-[10px] font-extrabold uppercase tracking-widest cursor-pointer transition-all shadow-sm"
                                            >
                                                ⚖️ Adjust
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedItem(item);
                                                    setRestockQuantity('');
                                                    setRestockUnitPrice('');
                                                    setErrorMessage(null);
                                                    setShowRestockModal(true);
                                                }}
                                                className="px-3 py-2 rounded-md bg-[#2A5C38]/10 border border-[#2A5C38]/20 hover:bg-[#2A5C38] text-[#2A5C38] hover:text-white text-[10px] font-extrabold uppercase tracking-widest cursor-pointer transition-all shadow-sm"
                                            >
                                                🛒 Restock
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-20 text-center flex flex-col items-center justify-center bg-white border border-[#101B14]/10 rounded-xl mt-2">
                        <div className="w-16 h-16 rounded-full bg-[#ECE6D6] flex items-center justify-center text-[#101B14]/30 mb-4 shadow-inner">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <h4 className="text-lg font-extrabold text-[#101B14] font-['Fraunces',serif]">No Inventory Found</h4>
                        <span className="text-sm text-[#101B14]/50 mt-1">No stock items found under "{activeCategory}" matching your criteria.</span>
                    </div>
                )}
            </div>

            {/* Onboard Inventory Modal (Unchanged) */}
            {showAddModal && (
                 /* ... Keep your existing Add Modal perfectly intact ... */
                 <div className="fixed inset-0 bg-[#101B14]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
                    <div className="bg-[#FBF9F5] border border-[#101B14]/10 rounded-xl max-w-lg w-full shadow-2xl flex flex-col max-h-[95vh] relative overflow-hidden">
                        
                        <div className="h-2 w-full bg-[#101B14] relative shrink-0 shadow-sm"></div>

                        <div className="flex items-center justify-between border-b border-[#101B14]/10 p-6 bg-white shrink-0">
                            <div>
                                <h4 className="text-xl font-extrabold text-[#101B14] font-['Fraunces',serif] tracking-tight">Onboard Material</h4>
                                <p className="text-[10px] font-mono font-bold text-[#101B14]/50 uppercase tracking-widest mt-1.5">
                                    Register new stock items
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowAddModal(false)}
                                className="text-[#101B14]/40 hover:text-[#E76F51] hover:bg-[#E76F51]/10 bg-[#101B14]/5 transition-all p-2 rounded-full cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            <form id="onboard-form" onSubmit={handleCreateInventory} className="space-y-5">
                                <div>
                                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/70 mb-2">Item Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Cobb Broiler Finisher Mash"
                                        value={itemForm.name}
                                        onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                                        className="w-full px-4 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#2A5C38] focus:ring-2 focus:ring-[#2A5C38]/30 transition-all shadow-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/70 mb-2">Category *</label>
                                        <select
                                            value={itemForm.category}
                                            onChange={(e) => setItemForm({ ...itemForm, category: e.target.value as InventoryCategory })}
                                            className="w-full px-4 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#2A5C38] focus:ring-2 focus:ring-[#2A5C38]/30 transition-all shadow-sm appearance-none cursor-pointer"
                                            style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23101B14' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                                        >
                                            <option value="FEED">🌾 Feed Stock</option>
                                            <option value="MEDICINE">💊 Medicine</option>
                                            <option value="VACCINE">🧪 Vaccine</option>
                                            <option value="EQUIPMENT">🚜 Equipment</option>
                                            <option value="OTHER">📦 Other Resource</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/70 mb-2">Target Farm *</label>
                                        <select
                                            value={itemForm.farmId}
                                            onChange={(e) => setItemForm({ ...itemForm, farmId: Number(e.target.value) })}
                                            disabled={!isProprietor}
                                            className="w-full px-4 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#2A5C38] focus:ring-2 focus:ring-[#2A5C38]/30 transition-all shadow-sm appearance-none cursor-pointer disabled:opacity-50"
                                            style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23101B14' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                                        >
                                            {farms.map((f) => (
                                                <option key={f.id} value={f.id}>{f.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/70 mb-2">Initial Qty *</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={itemForm.quantity}
                                            onChange={(e) => setItemForm({ ...itemForm, quantity: Number(e.target.value) })}
                                            className="w-full px-4 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#2A5C38] focus:ring-2 focus:ring-[#2A5C38]/30 transition-all shadow-sm font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/70 mb-2">Unit *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="bags/kg"
                                            value={itemForm.unit}
                                            onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                                            className="w-full px-4 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#2A5C38] focus:ring-2 focus:ring-[#2A5C38]/30 transition-all shadow-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/70 mb-2">Price (₦) *</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={itemForm.unitPrice}
                                            onChange={(e) => setItemForm({ ...itemForm, unitPrice: Number(e.target.value) })}
                                            className="w-full px-4 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#2A5C38] focus:ring-2 focus:ring-[#2A5C38]/30 transition-all shadow-sm font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/70 mb-2">Low Stock Trigger *</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={itemForm.lowStockThreshold}
                                            onChange={(e) => setItemForm({ ...itemForm, lowStockThreshold: Number(e.target.value) })}
                                            className="w-full px-4 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#2A5C38] focus:ring-2 focus:ring-[#2A5C38]/30 transition-all shadow-sm font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/70 mb-2">Expiry Date *</label>
                                        <input
                                            type="date"
                                            required
                                            value={itemForm.expiryDate}
                                            onChange={(e) => setItemForm({ ...itemForm, expiryDate: e.target.value })}
                                            className="w-full px-4 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#2A5C38] focus:ring-2 focus:ring-[#2A5C38]/30 transition-all shadow-sm font-mono"
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-5 bg-[#ECE6D6] border-t border-[#101B14]/10 shrink-0 flex items-center justify-end gap-3 z-10">
                            <button
                                type="button"
                                onClick={() => setShowAddModal(false)}
                                className="px-5 py-3.5 rounded-lg bg-transparent hover:bg-[#101B14]/5 text-[#101B14]/60 hover:text-[#101B14] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="onboard-form"
                                disabled={submitting}
                                className="px-6 py-3.5 rounded-lg bg-[#101B14] hover:bg-[#2A5C38] text-white font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                            >
                                {submitting ? 'Saving...' : 'Register Item'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal 1: MANUAL ADJUSTMENT (Spoilage, Loss, Errors) */}
            {showAdjustModal && selectedItem && (
                <div className="fixed inset-0 bg-[#101B14]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
                    <div className="bg-[#FBF9F5] border border-[#101B14]/20 rounded-xl max-w-sm w-full shadow-2xl flex flex-col relative overflow-hidden">
                        
                        <div className="h-2 w-full bg-[#E76F51] relative shrink-0 shadow-sm"></div>

                        <div className="flex items-center justify-between border-b border-[#101B14]/10 p-6 bg-white shrink-0">
                            <div>
                                <h4 className="text-xl font-extrabold text-[#101B14] font-['Fraunces',serif] tracking-tight">Manual Adjustment</h4>
                                <p className="text-[10px] font-mono font-bold text-[#E76F51] uppercase tracking-widest mt-1.5 truncate max-w-[200px]">
                                    {selectedItem.name}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowAdjustModal(false)}
                                className="text-[#101B14]/40 hover:text-[#E76F51] hover:bg-[#E76F51]/10 bg-[#101B14]/5 transition-all p-2 rounded-full cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6 bg-white overflow-y-auto">
                            <form id="adjust-form" onSubmit={handleAdjustStock} className="space-y-6">
                                <div className="bg-[#FBF9F5] p-4 rounded-xl border border-[#101B14]/10 flex flex-col items-center text-center">
                                    <span className="text-[10px] font-extrabold text-[#101B14]/50 uppercase tracking-widest mb-1">Current Balance</span>
                                    <span className="text-3xl font-extrabold text-[#101B14] font-mono">
                                        {selectedItem.currentQuantity.toLocaleString()} <span className="text-sm text-[#101B14]/50 font-sans">Units</span>
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/70 mb-2">
                                        Adjustment Amount (+ or -) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        required
                                        placeholder="-5 (Spoilage) or +2 (Found)"
                                        value={adjustAmount === '' ? '' : adjustAmount}
                                        onChange={(e) => setAdjustAmount(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="w-full px-4 py-4 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-lg font-bold focus:outline-none focus:border-[#E76F51] focus:ring-2 focus:ring-[#E76F51]/30 transition-all shadow-sm font-mono text-center"
                                    />
                                    <p className="text-[10px] font-bold text-[#101B14]/40 mt-2 text-center">
                                        New balance will be: <span className="font-mono text-[#101B14]/70">{(selectedItem.currentQuantity + Number(adjustAmount || 0)).toLocaleString()}</span>
                                    </p>
                                </div>
                            </form>
                        </div>

                        <div className="p-5 bg-[#ECE6D6] border-t border-[#101B14]/10 shrink-0 flex flex-col sm:flex-row items-center justify-end gap-3 z-10">
                            <button
                                type="button"
                                onClick={() => setShowAdjustModal(false)}
                                className="w-full sm:w-auto px-5 py-3.5 rounded-lg bg-transparent hover:bg-[#101B14]/5 text-[#101B14]/60 hover:text-[#101B14] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="adjust-form"
                                disabled={submitting || adjustAmount === '' || adjustAmount === 0}
                                className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-[#E76F51] hover:bg-[#d45d40] text-white font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                            >
                                {submitting ? 'Applying...' : 'Apply Correction'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal 2: COMMERCIAL RESTOCK (Updates WAC) */}
            {showRestockModal && selectedItem && (
                <div className="fixed inset-0 bg-[#101B14]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
                    <div className="bg-[#FBF9F5] border border-[#2A5C38]/40 rounded-xl max-w-md w-full shadow-2xl flex flex-col relative overflow-hidden">
                        
                        <div className="h-2 w-full bg-[#2A5C38] relative shrink-0 shadow-sm"></div>

                        <div className="flex items-center justify-between border-b border-[#101B14]/10 p-6 bg-white shrink-0">
                            <div>
                                <h4 className="text-xl font-extrabold text-[#101B14] font-['Fraunces',serif] tracking-tight">Commercial Restock</h4>
                                <p className="text-[10px] font-mono font-bold text-[#2A5C38] uppercase tracking-widest mt-1.5 truncate max-w-[250px]">
                                    {selectedItem.name}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowRestockModal(false)}
                                className="text-[#101B14]/40 hover:text-[#E76F51] hover:bg-[#E76F51]/10 bg-[#101B14]/5 transition-all p-2 rounded-full cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6 bg-white overflow-y-auto">
                            <form id="restock-form" onSubmit={handleRestock} className="space-y-6">
                                
                                {/* Read-Only Current State */}
                                <div className="grid grid-cols-2 gap-4 bg-[#FBF9F5] p-4 rounded-xl border border-[#101B14]/10 text-center">
                                    <div>
                                        <span className="text-[9px] font-extrabold text-[#101B14]/50 uppercase tracking-widest mb-1 block">Current Stock</span>
                                        <span className="text-xl font-extrabold text-[#101B14] font-mono">
                                            {selectedItem.currentQuantity.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="border-l border-[#101B14]/10">
                                        <span className="text-[9px] font-extrabold text-[#101B14]/50 uppercase tracking-widest mb-1 block">Current WAC</span>
                                        <span className="text-xl font-extrabold text-[#101B14] font-mono">
                                            ₦{Number(selectedItem.unitPrice || 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Added Quantity Input */}
                                    <div>
                                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/70 mb-2">
                                            Added Quantity *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0.1"
                                            required
                                            placeholder="e.g. 50"
                                            value={restockQuantity === '' ? '' : restockQuantity}
                                            onChange={(e) => setRestockQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                                            className="w-full px-4 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#2A5C38] focus:ring-2 focus:ring-[#2A5C38]/30 transition-all shadow-sm font-mono"
                                        />
                                    </div>
                                    
                                    {/* New Price Input */}
                                    <div>
                                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/70 mb-2">
                                            New Unit Price (₦) *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0.1"
                                            required
                                            placeholder="e.g. 12500"
                                            value={restockUnitPrice === '' ? '' : restockUnitPrice}
                                            onChange={(e) => setRestockUnitPrice(e.target.value === '' ? '' : Number(e.target.value))}
                                            className="w-full px-4 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#2A5C38] focus:ring-2 focus:ring-[#2A5C38]/30 transition-all shadow-sm font-mono"
                                        />
                                    </div>
                                </div>
                                
                                {/* Preview Restock Total */}
                                {restockQuantity !== '' && restockUnitPrice !== '' && (
                                    <div className="pt-2">
                                        <div className="p-3 bg-[#2A5C38]/10 rounded-lg flex justify-between items-center border border-[#2A5C38]/20">
                                            <span className="text-[10px] font-bold text-[#2A5C38] uppercase tracking-wider">Purchase Cost Preview</span>
                                            <span className="font-extrabold text-[#2A5C38] font-mono">
                                                ₦{(Number(restockQuantity) * Number(restockUnitPrice)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>

                        <div className="p-5 bg-[#ECE6D6] border-t border-[#101B14]/10 shrink-0 flex flex-col sm:flex-row items-center justify-end gap-3 z-10">
                            <button
                                type="button"
                                onClick={() => setShowRestockModal(false)}
                                className="w-full sm:w-auto px-5 py-3.5 rounded-lg bg-transparent hover:bg-[#101B14]/5 text-[#101B14]/60 hover:text-[#101B14] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="restock-form"
                                disabled={submitting || restockQuantity === '' || restockUnitPrice === '' || Number(restockQuantity) <= 0 || Number(restockUnitPrice) <= 0}
                                className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-[#2A5C38] hover:bg-[#20472b] text-white font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                            >
                                {submitting ? 'Processing...' : 'Complete Restock'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};