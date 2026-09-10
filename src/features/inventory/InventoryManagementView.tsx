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

    const [activeCategory, setActiveCategory] = useState<InventoryCategory | 'ALL'>('ALL');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [onlyLowStock, setOnlyLowStock] = useState<boolean>(false);

    const [showAddModal, setShowAddModal] = useState<boolean>(false);
    const [showAdjustModal, setShowAdjustModal] = useState<boolean>(false);
    const [showRestockModal, setShowRestockModal] = useState<boolean>(false);
    const [showSellModal, setShowSellModal] = useState<boolean>(false); // NEW
    
    const [selectedItem, setSelectedItem] = useState<InventoryResponseDto | null>(null);
    
    const [adjustAmount, setAdjustAmount] = useState<number | ''>('');
    const [restockQuantity, setRestockQuantity] = useState<number | ''>('');
    const [restockUnitPrice, setRestockUnitPrice] = useState<number | ''>('');
    
    // NEW: Sale State
    const [sellQuantity, setSellQuantity] = useState<number | ''>('');
    const [sellUnitPrice, setSellUnitPrice] = useState<number | ''>('');
    const [sellNotes, setSellNotes] = useState<string>('');

    const getDefaultExpiryDate = () =>
        new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

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
            setSuccessMessage('Item successfully added to inventory!');
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

    const handleAdjustStock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem || adjustAmount === '' || adjustAmount === 0) return;

        setSubmitting(true);
        setErrorMessage(null);

        try {
            await inventoryService.updateStockLevel(selectedItem.id, Number(adjustAmount));
            setSuccessMessage(`Stock updated successfully for ${selectedItem.name}!`);
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

    const handleRestock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem || restockQuantity === '' || restockUnitPrice === '') return;
        
        if (Number(restockQuantity) <= 0 || Number(restockUnitPrice) <= 0) {
            setErrorMessage("Both quantity bought and price must be greater than zero.");
            return;
        }

        setSubmitting(true);
        setErrorMessage(null);

        try {
            await inventoryService.restockInventory(selectedItem.id, Number(restockQuantity), Number(restockUnitPrice));
            setSuccessMessage(`Restocked ${selectedItem.name} successfully! New cost calculated.`);
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

    const handleSellProduce = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem || sellQuantity === '' || sellUnitPrice === '') return;
        
        if (Number(sellQuantity) <= 0 || Number(sellUnitPrice) <= 0) {
            setErrorMessage("Quantity sold and price must be greater than zero.");
            return;
        }

        if (Number(sellQuantity) > selectedItem.currentQuantity) {
            setErrorMessage(`You cannot sell more than the available stock (${selectedItem.currentQuantity}).`);
            return;
        }

        setSubmitting(true);
        setErrorMessage(null);

        try {
            await inventoryService.recordProduceSale({
                inventoryId: selectedItem.id,
                quantitySold: Number(sellQuantity),
                unitPrice: Number(sellUnitPrice),
                notes: sellNotes.trim() || undefined
            });
            setSuccessMessage(`Successfully recorded sale of ${sellQuantity} ${selectedItem.unit} of ${selectedItem.name}!`);
            setShowSellModal(false);
            setSelectedItem(null);
            setSellQuantity('');
            setSellUnitPrice('');
            setSellNotes('');
            await reloadCurrentFarmStock();
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setErrorMessage(typeof err.response?.data === 'string' ? err.response.data : err.response?.data?.message || 'Failed to record produce sale.');
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
    const produceCount = inventories.filter((i) => i.category === 'PRODUCE').length;
    const lowStockAlerts = inventories.filter((i) => i.isLowStock).length;

    return (
        <div className="space-y-6 lg:space-y-8 font-sans max-w-7xl mx-auto pb-12">
            
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-farma-forest/10 pb-5">
                <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-farma-forest tracking-tight">
                        {isProprietor ? 'Farm Inventory & Supplies' : 'My Farm Inventory'}
                    </h3>
                    <p className="text-sm text-farma-forest/70 font-medium mt-1">
                        Manage your feed, vaccines, medication, and equipment for each farm location.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="px-5 py-3 rounded-lg bg-farma-forest hover:bg-farma-green-light text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-colors flex items-center gap-2 cursor-pointer shrink-0"
                >
                    <IconBoxPlus />
                    <span>Add New Item</span>
                </button>
            </div>

            {errorMessage && (
                <div className="p-4 rounded-lg bg-farma-terracotta/10 border border-farma-terracotta/30 text-farma-terracotta text-sm font-semibold shadow-sm flex items-center gap-2">
                    <IconError />
                    {errorMessage}
                </div>
            )}
            {successMessage && (
                <div className="p-4 rounded-lg bg-farma-green/10 border border-farma-green/30 text-farma-green text-sm font-semibold shadow-sm flex items-center gap-2">
                    <IconCheck />
                    {successMessage}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-farma-sand border border-farma-forest/10 rounded-xl p-5 shadow-sm flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-farma-forest/60 uppercase tracking-widest block mb-2">
                        Select Farm
                    </span>
                    <select
                        value={selectedFarmId}
                        onChange={(e) => setSelectedFarmId(Number(e.target.value))}
                        disabled={!isProprietor && farms.length <= 1}
                        className="w-full px-3 py-2.5 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-xs font-bold focus:outline-none focus:ring-2 focus:ring-farma-green/30 transition-shadow shadow-sm cursor-pointer disabled:opacity-50"
                    >
                        {farms.map((f) => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                    </select>
                </div>

                <div className="bg-white border border-farma-forest/10 rounded-xl p-5 shadow-sm flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-farma-forest/60 uppercase tracking-widest block">
                        Total Stock Value
                    </span>
                    <div className="text-2xl font-bold text-farma-green mt-2 tabular-nums">
                        ₦{totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>

                <div className="bg-white border border-farma-forest/10 rounded-xl p-5 shadow-sm flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-farma-forest/60 uppercase tracking-widest block">
                        Total Items
                    </span>
                    <div className="text-2xl font-bold text-farma-forest mt-2 tabular-nums">
                        {feedCount} <span className="text-sm text-farma-forest/50 font-semibold">Feeds</span> / {medCount} <span className="text-sm text-farma-forest/50 font-semibold">Meds</span>
                    </div>
                </div>

                <div className="bg-white border border-farma-forest/10 rounded-xl p-5 shadow-sm flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-farma-forest/60 uppercase tracking-widest block">
                        Low Stock Warnings
                    </span>
                    <div className="text-2xl font-bold text-farma-terracotta mt-2 tabular-nums">
                        {lowStockAlerts} <span className="text-sm font-semibold">Items Low</span>
                    </div>
                </div>
            </div>

            <div className="bg-farma-cream border border-farma-forest/10 rounded-xl p-5 shadow-sm space-y-5">
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-farma-forest/10 pb-5">
                    <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
                        {(['ALL', 'FEED', 'MEDICINE', 'EQUIPMENT', 'PRODUCE', 'OTHER'] as const).map((cat) => {
                            const isActive = activeCategory === cat;
                            const count = cat === 'ALL' ? inventories.length : cat === 'FEED' ? feedCount : cat === 'MEDICINE' ? medCount : cat === 'PRODUCE' ? produceCount : inventories.filter(i => i.category === cat).length;
                            const label = cat === 'ALL' ? 'All Items' : cat === 'FEED' ? 'Feed' : cat === 'MEDICINE' ? 'Meds/Vax' : cat === 'EQUIPMENT' ? 'Equipment' : cat === 'PRODUCE' ? 'Produce' : 'Other';

                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
                                        isActive
                                            ? 'bg-farma-forest text-farma-cream shadow-sm'
                                            : 'bg-white border border-farma-forest/10 text-farma-forest/60 hover:bg-farma-forest/5 hover:text-farma-forest'
                                    }`}
                                >
                                    {label} ({count})
                                </button>
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        onClick={() => setOnlyLowStock(!onlyLowStock)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-colors cursor-pointer shrink-0 ${
                            onlyLowStock
                                ? 'bg-farma-terracotta/10 text-farma-terracotta border-farma-terracotta/30 shadow-sm'
                                : 'bg-white text-farma-forest/60 border-farma-forest/10 hover:bg-farma-forest/5 hover:text-farma-forest'
                        }`}
                    >
                        {onlyLowStock ? 'Low Stock Active' : 'Filter Low Stock'}
                    </button>
                </div>

                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <IconSearch />
                    </div>
                    <input
                        type="text"
                        placeholder="Search stock items by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-lg bg-white border border-farma-forest/15 text-farma-forest text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-farma-green/30 transition-shadow shadow-sm"
                    />
                </div>

                {loading ? (
                    <div className="py-16 text-center text-farma-forest/40 text-xs font-semibold uppercase tracking-widest flex flex-col items-center">
                        <div className="w-10 h-10 border-4 border-farma-green/20 border-t-farma-green rounded-full animate-spin mb-4"></div>
                        Loading inventory...
                    </div>
                ) : filteredInventories.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pt-2">
                        {filteredInventories.map((item) => {
                            const stockRatio = Math.min(100, Math.round((item.currentQuantity / ((item.lowStockThreshold || 1) * 5)) * 100));

                            return (
                                <div
                                    key={item.id}
                                    className={`bg-white border rounded-xl p-6 shadow-sm flex flex-col justify-between transition-shadow hover:shadow-md ${
                                        item.isLowStock ? 'border-farma-terracotta/30 bg-farma-terracotta/5' : 'border-farma-forest/10'
                                    }`}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="pr-2">
                                            <span className="text-[10px] font-bold text-farma-forest/50 uppercase tracking-widest block mb-1">
                                                {item.category}
                                            </span>
                                            <h4 className="text-lg font-bold text-farma-forest leading-tight">
                                                {item.name}
                                            </h4>
                                        </div>
                                        {item.isLowStock ? (
                                            <span className="px-2.5 py-1 rounded-md bg-farma-terracotta/10 text-farma-terracotta border border-farma-terracotta/20 text-[10px] font-bold uppercase tracking-wider shrink-0">
                                                Low Stock
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-1 rounded-md bg-farma-green/10 text-farma-green border border-farma-green/20 text-[10px] font-bold uppercase tracking-wider shrink-0">
                                                Normal
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-2 mb-5">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-bold text-farma-forest/60 uppercase tracking-wider">Current Stock</span>
                                            <span className="text-xl font-bold text-farma-forest tabular-nums">
                                                {item.currentQuantity.toLocaleString()} <span className="text-sm font-semibold text-farma-forest/50">{item.unit}</span>
                                            </span>
                                        </div>
                                        <div className="w-full bg-farma-forest/5 rounded-full h-2 overflow-hidden border border-farma-forest/5">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${item.isLowStock ? 'bg-farma-terracotta' : 'bg-farma-green'}`}
                                                style={{ width: `${Math.max(stockRatio, 2)}%` }}
                                            />
                                        </div>
                                        <div className="text-[10px] font-bold text-farma-forest/40 text-right tabular-nums">
                                            Warning At: {item.lowStockThreshold} {item.unit}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-farma-forest/10 mb-4">
                                        <div>
                                            <span className="text-[10px] font-bold text-farma-forest/50 uppercase tracking-widest block mb-0.5">Average Cost per Unit</span>
                                            <span className="font-bold text-farma-forest tabular-nums text-sm">
                                                ₦{Number(item.unitPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-farma-forest/50 uppercase tracking-widest block mb-0.5">Total Value</span>
                                            <span className="font-bold text-farma-green tabular-nums text-sm">
                                                ₦{(item.totalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-farma-forest/10">
                                        <span className="text-[10px] font-bold text-farma-forest/50 tabular-nums uppercase tracking-widest">
                                            Exp: <span className="text-farma-forest/80">{item.expiryDate || 'N/A'}</span>
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
                                                className="px-3 py-2 rounded-md bg-white border border-farma-forest/15 hover:border-farma-terracotta hover:bg-farma-terracotta/10 text-farma-forest hover:text-farma-terracotta text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
                                            >
                                                <IconAdjust /> Adjust
                                            </button>
                                            
                                            {/* Dynamic Button Rendering Based on Produce */}
                                            {item.category === 'PRODUCE' ? (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedItem(item);
                                                        setSellQuantity('');
                                                        setSellUnitPrice('');
                                                        setSellNotes('');
                                                        setErrorMessage(null);
                                                        setShowSellModal(true);
                                                    }}
                                                    className="px-3 py-2 rounded-md bg-farma-gold/10 border border-farma-gold/20 hover:bg-farma-gold text-farma-forest hover:text-white text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
                                                >
                                                    <IconBanknotes /> Sell
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedItem(item);
                                                        setRestockQuantity('');
                                                        setRestockUnitPrice('');
                                                        setErrorMessage(null);
                                                        setShowRestockModal(true);
                                                    }}
                                                    className="px-3 py-2 rounded-md bg-farma-green/10 border border-farma-green/20 hover:bg-farma-green text-farma-green hover:text-white text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
                                                >
                                                    <IconCart /> Restock
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-20 text-center flex flex-col items-center justify-center bg-white border border-farma-forest/10 rounded-xl mt-2">
                        <div className="w-16 h-16 rounded-full bg-farma-sand flex items-center justify-center text-farma-forest/30 mb-4 shadow-inner">
                            <IconEmptyState />
                        </div>
                        <h4 className="text-lg font-bold text-farma-forest">No Items Found</h4>
                        <span className="text-sm text-farma-forest/50 mt-1">No stock items found under "{activeCategory}" matching your criteria.</span>
                    </div>
                )}
            </div>

            {showAddModal && (
                 <div className="fixed inset-0 bg-farma-forest/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
                    <div className="bg-farma-cream border border-farma-forest/10 rounded-xl max-w-lg w-full shadow-2xl flex flex-col max-h-[95vh] relative overflow-hidden">
                        
                        <div className="h-1.5 w-full bg-farma-forest relative shrink-0 shadow-sm"></div>

                        <div className="flex items-center justify-between border-b border-farma-forest/10 p-6 bg-white shrink-0">
                            <div>
                                <h4 className="text-xl font-bold text-farma-forest tracking-tight">Add New Item</h4>
                                <p className="text-[10px] font-bold text-farma-forest/50 uppercase tracking-widest mt-1">
                                    Add feed, medicine, or tools
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowAddModal(false)}
                                className="text-farma-forest/40 hover:text-farma-terracotta hover:bg-farma-terracotta/10 bg-farma-forest/5 transition-colors p-2 rounded-lg cursor-pointer"
                            >
                                <IconClose />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            <form id="onboard-form" onSubmit={handleCreateInventory} className="space-y-5">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-2">Item Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Starter Feed Mash"
                                        value={itemForm.name}
                                        onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-farma-green/30 transition-shadow shadow-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-2">Category *</label>
                                        <select
                                            value={itemForm.category}
                                            onChange={(e) => setItemForm({ ...itemForm, category: e.target.value as InventoryCategory })}
                                            className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-farma-green/30 transition-shadow shadow-sm cursor-pointer"
                                        >
                                            <option value="FEED">Feed</option>
                                            <option value="MEDICINE">Medicine</option>
                                            <option value="VACCINE">Vaccine</option>
                                            <option value="EQUIPMENT">Equipment</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-2">Farm Location *</label>
                                        <select
                                            value={itemForm.farmId}
                                            onChange={(e) => setItemForm({ ...itemForm, farmId: Number(e.target.value) })}
                                            disabled={!isProprietor}
                                            className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-farma-green/30 transition-shadow shadow-sm cursor-pointer disabled:opacity-50"
                                        >
                                            {farms.map((f) => (
                                                <option key={f.id} value={f.id}>{f.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-2">Initial Qty *</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={itemForm.quantity}
                                            onChange={(e) => setItemForm({ ...itemForm, quantity: Number(e.target.value) })}
                                            className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm font-bold focus:outline-none focus:ring-2 focus:ring-farma-green/30 transition-shadow shadow-sm tabular-nums"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-2">Unit *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="bags/kg"
                                            value={itemForm.unit}
                                            onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-farma-green/30 transition-shadow shadow-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-2">Price (₦) *</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={itemForm.unitPrice}
                                            onChange={(e) => setItemForm({ ...itemForm, unitPrice: Number(e.target.value) })}
                                            className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm font-bold focus:outline-none focus:ring-2 focus:ring-farma-green/30 transition-shadow shadow-sm tabular-nums"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-2">Low Stock Warning At *</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={itemForm.lowStockThreshold}
                                            onChange={(e) => setItemForm({ ...itemForm, lowStockThreshold: Number(e.target.value) })}
                                            className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm font-bold focus:outline-none focus:ring-2 focus:ring-farma-green/30 transition-shadow shadow-sm tabular-nums"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-2">Expiry Date *</label>
                                        <input
                                            type="date"
                                            required
                                            value={itemForm.expiryDate}
                                            onChange={(e) => setItemForm({ ...itemForm, expiryDate: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm font-bold focus:outline-none focus:ring-2 focus:ring-farma-green/30 transition-shadow shadow-sm tabular-nums"
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-5 bg-farma-sand border-t border-farma-forest/10 shrink-0 flex items-center justify-end gap-3 z-10">
                            <button
                                type="button"
                                onClick={() => setShowAddModal(false)}
                                className="px-5 py-3 rounded-lg bg-transparent hover:bg-farma-forest/5 text-farma-forest/60 hover:text-farma-forest font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="onboard-form"
                                disabled={submitting}
                                className="px-6 py-3 rounded-lg bg-farma-forest hover:bg-farma-green-light text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
                            >
                                {submitting ? 'Saving...' : 'Save Item'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showAdjustModal && selectedItem && (
                <div className="fixed inset-0 bg-farma-forest/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
                    <div className="bg-farma-cream border border-farma-forest/20 rounded-xl max-w-sm w-full shadow-2xl flex flex-col relative overflow-hidden">
                        
                        <div className="h-1.5 w-full bg-farma-terracotta relative shrink-0 shadow-sm"></div>

                        <div className="flex items-center justify-between border-b border-farma-forest/10 p-6 bg-white shrink-0">
                            <div>
                                <h4 className="text-xl font-bold text-farma-forest tracking-tight">Adjust Stock Level</h4>
                                <p className="text-[10px] font-bold text-farma-terracotta uppercase tracking-widest mt-1 truncate max-w-[200px]">
                                    {selectedItem.name}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowAdjustModal(false)}
                                className="text-farma-forest/40 hover:text-farma-terracotta hover:bg-farma-terracotta/10 bg-farma-forest/5 transition-colors p-2 rounded-lg cursor-pointer"
                            >
                                <IconClose />
                            </button>
                        </div>

                        <div className="p-6 bg-white overflow-y-auto">
                            <form id="adjust-form" onSubmit={handleAdjustStock} className="space-y-6">
                                <div className="bg-farma-cream p-4 rounded-xl border border-farma-forest/10 flex flex-col items-center text-center">
                                    <span className="text-[10px] font-bold text-farma-forest/50 uppercase tracking-widest mb-1">Current Stock</span>
                                    <span className="text-3xl font-bold text-farma-forest tabular-nums">
                                        {selectedItem.currentQuantity.toLocaleString()} <span className="text-sm text-farma-forest/50 font-semibold">{selectedItem.unit}</span>
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-2">
                                        Amount to Add or Remove *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        required
                                        placeholder="e.g. -5 or +2"
                                        value={adjustAmount === '' ? '' : adjustAmount}
                                        onChange={(e) => setAdjustAmount(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-lg font-bold focus:outline-none focus:ring-2 focus:ring-farma-terracotta/30 transition-shadow shadow-sm tabular-nums text-center"
                                    />
                                    <p className="text-[10px] font-bold text-farma-forest/40 mt-2 text-center uppercase tracking-widest tabular-nums">
                                        New stock will be: <span className="text-farma-forest/70">{(selectedItem.currentQuantity + Number(adjustAmount || 0)).toLocaleString()}</span>
                                    </p>
                                </div>
                            </form>
                        </div>

                        <div className="p-5 bg-farma-sand border-t border-farma-forest/10 shrink-0 flex flex-col sm:flex-row items-center justify-end gap-3 z-10">
                            <button
                                type="button"
                                onClick={() => setShowAdjustModal(false)}
                                className="w-full sm:w-auto px-5 py-3 rounded-lg bg-transparent hover:bg-farma-forest/5 text-farma-forest/60 hover:text-farma-forest font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="adjust-form"
                                disabled={submitting || adjustAmount === '' || adjustAmount === 0}
                                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-farma-terracotta hover:bg-[#c6583d] text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
                            >
                                {submitting ? 'Updating...' : 'Update Stock'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showRestockModal && selectedItem && (
                <div className="fixed inset-0 bg-farma-forest/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
                    <div className="bg-farma-cream border border-farma-green/40 rounded-xl max-w-md w-full shadow-2xl flex flex-col relative overflow-hidden">
                        
                        <div className="h-1.5 w-full bg-farma-green relative shrink-0 shadow-sm"></div>

                        <div className="flex items-center justify-between border-b border-farma-forest/10 p-6 bg-white shrink-0">
                            <div>
                                <h4 className="text-xl font-bold text-farma-forest tracking-tight">Restock Item</h4>
                                <p className="text-[10px] font-bold text-farma-green uppercase tracking-widest mt-1 truncate max-w-[250px]">
                                    {selectedItem.name}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowRestockModal(false)}
                                className="text-farma-forest/40 hover:text-farma-terracotta hover:bg-farma-terracotta/10 bg-farma-forest/5 transition-colors p-2 rounded-lg cursor-pointer"
                            >
                                <IconClose />
                            </button>
                        </div>

                        <div className="p-6 bg-white overflow-y-auto">
                            <form id="restock-form" onSubmit={handleRestock} className="space-y-6">
                                
                                <div className="grid grid-cols-2 gap-4 bg-farma-cream p-4 rounded-xl border border-farma-forest/10 text-center">
                                    <div>
                                        <span className="text-[9px] font-bold text-farma-forest/50 uppercase tracking-widest mb-1 block">Current Stock</span>
                                        <span className="text-xl font-bold text-farma-forest tabular-nums">
                                            {selectedItem.currentQuantity.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="border-l border-farma-forest/10">
                                        <span className="text-[9px] font-bold text-farma-forest/50 uppercase tracking-widest mb-1 block">Current Cost</span>
                                        <span className="text-xl font-bold text-farma-forest tabular-nums">
                                            ₦{Number(selectedItem.unitPrice || 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-2">
                                            Quantity Bought ({selectedItem.unit}) *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0.1"
                                            required
                                            placeholder="e.g. 50"
                                            value={restockQuantity === '' ? '' : restockQuantity}
                                            onChange={(e) => setRestockQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                                            className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm font-bold focus:outline-none focus:ring-2 focus:ring-farma-green/30 transition-shadow shadow-sm tabular-nums"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-2">
                                            Price per Unit (₦) *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0.1"
                                            required
                                            placeholder="e.g. 12500"
                                            value={restockUnitPrice === '' ? '' : restockUnitPrice}
                                            onChange={(e) => setRestockUnitPrice(e.target.value === '' ? '' : Number(e.target.value))}
                                            className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm font-bold focus:outline-none focus:ring-2 focus:ring-farma-green/30 transition-shadow shadow-sm tabular-nums"
                                        />
                                    </div>
                                </div>
                                
                                {restockQuantity !== '' && restockUnitPrice !== '' && (
                                    <div className="pt-2">
                                        <div className="p-3 bg-farma-green/10 rounded-lg flex justify-between items-center border border-farma-green/20">
                                            <span className="text-[10px] font-bold text-farma-green uppercase tracking-wider">Total Cost Preview</span>
                                            <span className="font-bold text-farma-green tabular-nums">
                                                ₦{(Number(restockQuantity) * Number(restockUnitPrice)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>

                        <div className="p-5 bg-farma-sand border-t border-farma-forest/10 shrink-0 flex flex-col sm:flex-row items-center justify-end gap-3 z-10">
                            <button
                                type="button"
                                onClick={() => setShowRestockModal(false)}
                                className="w-full sm:w-auto px-5 py-3 rounded-lg bg-transparent hover:bg-farma-forest/5 text-farma-forest/60 hover:text-farma-forest font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="restock-form"
                                disabled={submitting || restockQuantity === '' || restockUnitPrice === '' || Number(restockQuantity) <= 0 || Number(restockUnitPrice) <= 0}
                                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-farma-green hover:bg-farma-green-light text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
                            >
                                {submitting ? 'Processing...' : 'Save Restock'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* NEW: SELL PRODUCE MODAL */}
            {showSellModal && selectedItem && (
                <div className="fixed inset-0 bg-farma-forest/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
                    <div className="bg-farma-cream border border-farma-gold/40 rounded-xl max-w-md w-full shadow-2xl flex flex-col relative overflow-hidden">
                        
                        <div className="h-1.5 w-full bg-farma-gold relative shrink-0 shadow-sm"></div>

                        <div className="flex items-center justify-between border-b border-farma-forest/10 p-6 bg-white shrink-0">
                            <div>
                                <h4 className="text-xl font-bold text-farma-forest tracking-tight">Sell Produce</h4>
                                <p className="text-[10px] font-bold text-farma-gold uppercase tracking-widest mt-1 truncate max-w-[250px]">
                                    {selectedItem.name}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowSellModal(false)}
                                className="text-farma-forest/40 hover:text-farma-terracotta hover:bg-farma-terracotta/10 bg-farma-forest/5 transition-colors p-2 rounded-lg cursor-pointer"
                            >
                                <IconClose />
                            </button>
                        </div>

                        <div className="p-6 bg-white overflow-y-auto">
                            <form id="sell-form" onSubmit={handleSellProduce} className="space-y-6">
                                
                                <div className="bg-farma-cream p-4 rounded-xl border border-farma-forest/10 flex flex-col items-center text-center">
                                    <span className="text-[10px] font-bold text-farma-forest/50 uppercase tracking-widest mb-1">Available to Sell</span>
                                    <span className="text-3xl font-bold text-farma-forest tabular-nums">
                                        {selectedItem.currentQuantity.toLocaleString()} <span className="text-sm text-farma-forest/50 font-semibold">{selectedItem.unit}</span>
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-2">
                                            Quantity Sold ({selectedItem.unit}) *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0.1"
                                            max={selectedItem.currentQuantity}
                                            required
                                            placeholder="e.g. 30"
                                            value={sellQuantity === '' ? '' : sellQuantity}
                                            onChange={(e) => setSellQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                                            className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm font-bold focus:outline-none focus:ring-2 focus:ring-farma-gold/30 transition-shadow shadow-sm tabular-nums"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-2">
                                            Price per Unit (₦) *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0.1"
                                            required
                                            placeholder="e.g. 150"
                                            value={sellUnitPrice === '' ? '' : sellUnitPrice}
                                            onChange={(e) => setSellUnitPrice(e.target.value === '' ? '' : Number(e.target.value))}
                                            className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm font-bold focus:outline-none focus:ring-2 focus:ring-farma-gold/30 transition-shadow shadow-sm tabular-nums"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-2">
                                        Sales Notes
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={sellNotes}
                                        onChange={(e) => setSellNotes(e.target.value)}
                                        placeholder="e.g. Sold to local market vendor."
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm focus:outline-none focus:ring-2 focus:ring-farma-gold/30 transition-shadow shadow-sm resize-none"
                                    />
                                </div>
                                
                                {sellQuantity !== '' && sellUnitPrice !== '' && (
                                    <div className="pt-2">
                                        <div className="p-3 bg-farma-gold/10 rounded-lg flex justify-between items-center border border-farma-gold/20">
                                            <span className="text-[10px] font-bold text-farma-forest/80 uppercase tracking-wider">Total Revenue Generated</span>
                                            <span className="font-bold text-farma-forest tabular-nums">
                                                ₦{(Number(sellQuantity) * Number(sellUnitPrice)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>

                        <div className="p-5 bg-farma-sand border-t border-farma-forest/10 shrink-0 flex flex-col sm:flex-row items-center justify-end gap-3 z-10">
                            <button
                                type="button"
                                onClick={() => setShowSellModal(false)}
                                className="w-full sm:w-auto px-5 py-3 rounded-lg bg-transparent hover:bg-farma-forest/5 text-farma-forest/60 hover:text-farma-forest font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="sell-form"
                                disabled={submitting || sellQuantity === '' || sellUnitPrice === '' || Number(sellQuantity) <= 0 || Number(sellUnitPrice) <= 0}
                                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-farma-gold hover:bg-[#c49332] text-farma-forest font-bold text-xs uppercase tracking-wider shadow-sm transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
                            >
                                {submitting ? 'Processing...' : 'Record Sale'}
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

const IconBoxPlus = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4M12 22V12m0 0V2m0 10h10M12 12H2" />
    </svg>
);

const IconError = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const IconCheck = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
);

const IconSearch = () => (
    <svg className="w-4 h-4 text-farma-forest/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const IconAdjust = () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
    </svg>
);

const IconCart = () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const IconBanknotes = () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const IconClose = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const IconEmptyState = () => (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
);