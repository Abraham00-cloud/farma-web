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
    const [showRestockModal, setShowRestockModal] = useState<boolean>(false);
    const [selectedItemForRestock, setSelectedItemForRestock] = useState<InventoryResponseDto | null>(null);
    const [restockAmount, setRestockAmount] = useState<number>(0);

    // Helper function to derive default expiry date lazily
    const getDefaultExpiryDate = () =>
        new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // New Item Form State (Lazily initialized)
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

    // 1. Initial Load: Fetch Farms with Role Scoping
    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            try {
                let farmList = await infrastructureService.getFarmsByOrganisation(organisationId);

                // 🔒 ROLE SCOPING: Filter farms if user is a Manager
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
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        init();

        return () => {
            isMounted = false;
        };
    }, [organisationId, isProprietor, currentUserId]);

    // 2. Fetch inventory whenever selectedFarmId changes
    useEffect(() => {
        let isMounted = true;

        if (!selectedFarmId) return;

        const fetchStockForFarm = async () => {
            setLoading(true);
            try {
                const items = await inventoryService.getInventoriesByFarm(Number(selectedFarmId));
                if (isMounted) {
                    setInventories(Array.isArray(items) ? items : []);
                }
            } catch {
                if (isMounted) {
                    setInventories([]);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchStockForFarm();

        return () => {
            isMounted = false;
        };
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
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setErrorMessage(
                    typeof err.response?.data === 'string'
                        ? err.response.data
                        : err.response?.data?.message || 'Failed to register inventory item.'
                );
            } else {
                setErrorMessage('An unexpected error occurred.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleAdjustStock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItemForRestock || restockAmount === 0) return;

        setSubmitting(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            await inventoryService.updateStockLevel(selectedItemForRestock.id, restockAmount);
            setSuccessMessage(`Stock updated successfully for ${selectedItemForRestock.name}!`);
            setShowRestockModal(false);
            setSelectedItemForRestock(null);
            setRestockAmount(0);
            await reloadCurrentFarmStock();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setErrorMessage(
                    typeof err.response?.data === 'string'
                        ? err.response.data
                        : err.response?.data?.message || 'Failed to update stock level.'
                );
            } else {
                setErrorMessage('An unexpected error occurred.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Category Filtering Logic
    const filteredInventories = inventories.filter((item) => {
        const matchesCategory =
            activeCategory === 'ALL'
                ? true
                : activeCategory === 'MEDICINE'
                    ? item.category === 'MEDICINE' || item.category === 'VACCINE'
                    : item.category === activeCategory;

        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLowStock = onlyLowStock ? item.isLowStock : true;

        return matchesCategory && matchesSearch && matchesLowStock;
    });

    // KPI Calculations
    const totalValuation = inventories.reduce((acc, i) => acc + (i.totalValue || 0), 0);
    const feedCount = inventories.filter((i) => i.category === 'FEED').length;
    const medCount = inventories.filter((i) => i.category === 'MEDICINE' || i.category === 'VACCINE').length;
    const lowStockAlerts = inventories.filter((i) => i.isLowStock).length;

    return (
        <div className="space-y-6">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        {isProprietor ? 'Warehouse Supply & Material Ledger' : 'Site Warehouse & Consumables'}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                        Segmented stock management for feeds, vaccines, medication, and operational tools per farm site.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider shadow-xs cursor-pointer flex items-center space-x-2"
                >
                    <span>📦 Onboard New Material Stock</span>
                </button>
            </div>

            {/* Alerts */}
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

            {/* Farm Warehouse Selector & KPI Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Farm Facility Picker Card */}
                <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        Active Farm Facility
                    </span>
                    <select
                        value={selectedFarmId}
                        onChange={(e) => setSelectedFarmId(Number(e.target.value))}
                        disabled={!isProprietor && farms.length <= 1}
                        className="w-full mt-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                    >
                        {farms.map((f) => (
                            <option key={f.id} value={f.id}>
                                🏢 {f.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Total Valuation */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        Facility Asset Valuation
                    </span>
                    <div className="text-2xl font-extrabold text-emerald-700 mt-1">
                        ₦{totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>

                {/* Stock Breakdown */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        Consumable Stock Count
                    </span>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1">
                        {feedCount} Feeds / {medCount} Meds
                    </div>
                </div>

                {/* Low Stock Alerts */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        Low-Stock Reorder Triggers
                    </span>
                    <div className="text-2xl font-extrabold text-rose-600 mt-1">
                        {lowStockAlerts} Items Critical
                    </div>
                </div>
            </div>

            {/* CATEGORY WORKSPACE NAVIGATION TABS */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
                {/* Navigation Tabs */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => setActiveCategory('ALL')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeCategory === 'ALL'
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            All Items ({inventories.length})
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveCategory('FEED')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeCategory === 'FEED'
                                    ? 'bg-[#C2410C] text-white shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            🌾 Feed Stock ({feedCount})
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveCategory('MEDICINE')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeCategory === 'MEDICINE'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            💊 Meds & Vaccines ({medCount})
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveCategory('EQUIPMENT')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeCategory === 'EQUIPMENT'
                                    ? 'bg-purple-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            🚜 Equipment
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveCategory('OTHER')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeCategory === 'OTHER'
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            📦 Other Supplies
                        </button>
                    </div>

                    {/* Low Stock Toggle */}
                    <button
                        type="button"
                        onClick={() => setOnlyLowStock(!onlyLowStock)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${onlyLowStock
                                ? 'bg-rose-50 text-rose-700 border-rose-300'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                    >
                        {onlyLowStock ? '⚠️ Showing Low Stock Only' : 'Filter Low Stock'}
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="🔍 Search stock items by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                    />
                </div>

                {/* DETAILED MATERIAL STOCK LEDGER CARDS GRID */}
                {loading ? (
                    <div className="py-12 text-center text-slate-400 font-mono text-xs">
                        Loading warehouse material ledgers...
                    </div>
                ) : filteredInventories.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                        {filteredInventories.map((item) => {
                            const stockRatio = Math.min(
                                100,
                                Math.round((item.currentQuantity / (item.lowStockThreshold * 2 || 1)) * 100)
                            );

                            return (
                                <div
                                    key={item.id}
                                    className={`bg-white border rounded-2xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition ${item.isLowStock ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200'
                                        }`}
                                >
                                    {/* Card Header */}
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                                                Category: {item.category}
                                            </span>
                                            <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                                                {item.name}
                                            </h4>
                                        </div>
                                        {item.isLowStock ? (
                                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold">
                                                ⚠️ Low Stock
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                                                Stock Normal
                                            </span>
                                        )}
                                    </div>

                                    {/* Quantity Visual Bar */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-mono">
                                            <span className="text-slate-500">Current Balance:</span>
                                            <span className="font-extrabold text-slate-900">
                                                {item.currentQuantity.toLocaleString()} Units
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${item.isLowStock ? 'bg-rose-500' : 'bg-emerald-500'
                                                    }`}
                                                style={{ width: `${stockRatio}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-mono text-slate-400 block text-right">
                                            Reorder Threshold: {item.lowStockThreshold} Units
                                        </span>
                                    </div>

                                    {/* Financial & Expiry Details */}
                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 font-mono text-xs">
                                        <div>
                                            <span className="text-[10px] text-slate-400 block uppercase">Unit Price</span>
                                            <span className="font-bold text-slate-800">
                                                ₦{Number(item.unitPrice || 0).toLocaleString()}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 block uppercase">Total Valuation</span>
                                            <span className="font-extrabold text-emerald-700">
                                                ₦{(item.totalValue || 0).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Footer & Action */}
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                        <span className="text-[10px] font-mono text-slate-400">
                                            📅 Exp: {item.expiryDate || 'N/A'}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedItemForRestock(item);
                                                setRestockAmount(0);
                                                setShowRestockModal(true);
                                            }}
                                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer transition"
                                        >
                                            ⚡ Adjust Stock
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-12 text-center text-slate-400 font-mono text-xs">
                        No stock items found under category "{activeCategory}" matching your criteria.
                    </div>
                )}
            </div>

            {/* Onboard Inventory Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h4 className="text-base font-bold text-slate-900">Onboard New Material Stock</h4>
                            <button
                                type="button"
                                onClick={() => setShowAddModal(false)}
                                className="text-slate-400 hover:text-slate-600 font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateInventory} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Item Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Cobb Broiler Finisher Mash"
                                    value={itemForm.name}
                                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                                    <select
                                        value={itemForm.category}
                                        onChange={(e) =>
                                            setItemForm({ ...itemForm, category: e.target.value as InventoryCategory })
                                        }
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                                    >
                                        <option value="FEED">🌾 Feed Stock</option>
                                        <option value="MEDICINE">💊 Medicine</option>
                                        <option value="VACCINE">🧪 Vaccine</option>
                                        <option value="EQUIPMENT">🚜 Equipment</option>
                                        <option value="OTHER">📦 Other Resource</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Target Farm *</label>
                                    <select
                                        value={itemForm.farmId}
                                        onChange={(e) => setItemForm({ ...itemForm, farmId: Number(e.target.value) })}
                                        disabled={!isProprietor}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-50"
                                    >
                                        {farms.map((f) => (
                                            <option key={f.id} value={f.id}>
                                                {f.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Initial Qty *</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={itemForm.quantity}
                                        onChange={(e) => setItemForm({ ...itemForm, quantity: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Unit *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="bags/kg/vials"
                                        value={itemForm.unit}
                                        onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Unit Price (₦) *</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={itemForm.unitPrice}
                                        onChange={(e) => setItemForm({ ...itemForm, unitPrice: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Low Stock Limit *</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={itemForm.lowStockThreshold}
                                        onChange={(e) =>
                                            setItemForm({ ...itemForm, lowStockThreshold: Number(e.target.value) })
                                        }
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={itemForm.expiryDate}
                                        onChange={(e) => setItemForm({ ...itemForm, expiryDate: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : 'Register Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Adjust Stock Level Modal */}
            {showRestockModal && selectedItemForRestock && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h4 className="text-base font-bold text-slate-900">Adjust Stock Balance</h4>
                                <p className="text-xs text-slate-500 font-mono">{selectedItemForRestock.name}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowRestockModal(false)}
                                className="text-slate-400 hover:text-slate-600 font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleAdjustStock} className="space-y-4">
                            <div>
                                <span className="text-xs text-slate-500 block">Current Balance:</span>
                                <span className="text-lg font-extrabold text-slate-900 font-mono">
                                    {selectedItemForRestock.currentQuantity.toLocaleString()} Units
                                </span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Adjustment Amount (Use + to Restock, - to Deduct) *
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    placeholder="e.g. +50 for delivery, -5 for damage"
                                    value={restockAmount || ''}
                                    onChange={(e) => setRestockAmount(Number(e.target.value))}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                                />
                            </div>

                            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowRestockModal(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || restockAmount === 0}
                                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                                >
                                    {submitting ? 'Applying...' : 'Apply Stock Adjustment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};