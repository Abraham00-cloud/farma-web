import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { infrastructureService } from '../../services/infrastructureService';
import { userService } from '../../services/userService';
import { LocationPickerMap } from '../../components/common/LocationPickerMap';
import { FarmDetailView } from './FarmDetailView';
import type { FarmRequestDto, FarmResponseDto } from '../../types/infrastructure';
import type { UserResponseDto } from '../../types/auth';

interface FarmManagementViewProps {
    organisationId: number;
    proprietorId: number;
    userRole?: string;
    currentUserId?: number;
}

type FilterStatus = 'ALL' | 'ACTIVE' | 'INACTIVE';

export const FarmManagementView: React.FC<FarmManagementViewProps> = ({
    organisationId,
    proprietorId,
    userRole = 'PROPRIETOR',
    currentUserId,
}) => {
    const isProprietor = userRole?.toUpperCase() === 'PROPRIETOR' || userRole?.toUpperCase() === 'ADMIN';
    const navigate = useNavigate();

    const [farms, setFarms] = useState<FarmResponseDto[]>([]);
    const [managers, setManagers] = useState<UserResponseDto[]>([]);
    
    // UI States
    const [showModal, setShowModal] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [isFetching, setIsFetching] = useState<boolean>(true);
    const [geoLoading, setGeoLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [locationMode, setLocationMode] = useState<'gps' | 'map'>('gps');
    
    // Search & Filter States
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');

    const [formData, setFormData] = useState<Omit<FarmRequestDto, 'organisationId'>>({
        name: '',
        address: '',
        managerId: proprietorId,
        latitude: 6.5244,
        longitude: 3.3792,
        isActive: true,
    });

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            try {
                const [farmData, managerData] = await Promise.all([
                    infrastructureService.getFarmsByOrganisation(organisationId).catch(() => []),
                    isProprietor 
                        ? userService.getManagersByProprietor(proprietorId).catch(() => []) 
                        : Promise.resolve([]),
                ]);

                if (isMounted) {
                    if (isProprietor) {
                        setFarms(farmData);
                    } else if (currentUserId) {
                        setFarms(farmData.filter(farm => farm.managerId === currentUserId));
                    } else {
                        setFarms(farmData);
                    }

                    setManagers(managerData);
                    if (managerData.length > 0) {
                        setFormData((prev) => ({ ...prev, managerId: managerData[0].id }));
                    }
                }
            } catch {
                // Silently fallback on empty state
            } finally {
                if (isMounted) setIsFetching(false);
            }
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, [organisationId, proprietorId, isProprietor, currentUserId]);

    const filteredFarms = useMemo(() => {
        return farms.filter(farm => {
            const matchesSearch = 
                farm.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                farm.address.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = 
                filterStatus === 'ALL' || 
                (filterStatus === 'ACTIVE' && farm.isActive) || 
                (filterStatus === 'INACTIVE' && !farm.isActive);
            
            return matchesSearch && matchesStatus;
        });
    }, [farms, searchTerm, filterStatus]);

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your current browser.');
            return;
        }
        setGeoLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData((prev) => ({
                    ...prev,
                    latitude: Number(position.coords.latitude.toFixed(6)),
                    longitude: Number(position.coords.longitude.toFixed(6)),
                }));
                setGeoLoading(false);
            },
            (error) => {
                setGeoLoading(false);
                alert(`Failed to fetch position: ${error.message}`);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleCreateFarm = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage(null);

        try {
            await infrastructureService.createFarm({ ...formData, organisationId });
            setShowModal(false);
            
            setFormData({
                name: '',
                address: '',
                managerId: managers.length > 0 ? managers[0].id : proprietorId,
                latitude: 6.5244,
                longitude: 3.3792,
                isActive: true,
            });

            setIsFetching(true);
            const updatedFarms = await infrastructureService.getFarmsByOrganisation(organisationId);
            setFarms(isProprietor ? updatedFarms : updatedFarms.filter(f => f.managerId === currentUserId));
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setErrorMessage(err.response?.data?.message || 'Failed to register farm.');
            } else {
                setErrorMessage('An unexpected error occurred while saving the farm.');
            }
        } finally {
            setLoading(false);
            setIsFetching(false);
        }
    };

    const FarmListUI = (
        <div className="space-y-6 lg:space-y-8 font-sans max-w-7xl mx-auto pb-12">
            
            {/* Header & Strategic Command Ribbon */}
            <div className="flex flex-col gap-6 border-b-2 border-[#101B14]/10 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#D9A63E] animate-pulse shadow-[0_0_8px_rgba(217,166,62,0.6)]"></span>
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#D9A63E]">
                                Farm Operations
                            </span>
                        </div>
                        <h3 className="text-3xl md:text-4xl font-extrabold text-[#101B14] tracking-tight font-['Fraunces',serif]">
                            {isProprietor ? 'All Farm Sites' : 'My Assigned Farm'}
                        </h3>
                        <p className="text-sm text-[#101B14]/70 font-medium mt-2 max-w-xl leading-relaxed">
                            {isProprietor
                                ? 'Add and monitor physical farm sites, setup locations, and manage assigned managers across your entire business.'
                                : 'Access physical pen capacity, active flocks, and data for your assigned farm.'}
                        </p>
                    </div>

                    {isProprietor && (
                        <button
                            type="button"
                            onClick={() => setShowModal(true)}
                            className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-[#D9A63E] hover:bg-[#c99834] text-[#101B14] font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2.5 cursor-pointer shrink-0"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Add New Farm</span>
                        </button>
                    )}
                </div>

                {/* Micro-Analytics & Search/Filter Bar */}
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-end pt-2">
                    <div className="flex gap-4 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
                        <div className="bg-[#FBF9F5] border border-[#101B14]/10 p-4 rounded-xl flex flex-col justify-center min-w-[150px] shadow-xs">
                            <span className="text-[10px] font-mono font-bold text-[#3F6B47] uppercase tracking-widest mb-1">Active Sites</span>
                            <span className="text-2xl font-extrabold text-[#101B14] font-mono">
                                {isFetching ? '--' : farms.filter(f => f.isActive).length}
                            </span>
                        </div>
                        <div className="bg-[#FBF9F5] border border-[#101B14]/10 p-4 rounded-xl flex flex-col justify-center min-w-[150px] shadow-xs">
                            <span className="text-[10px] font-mono font-bold text-[#3F6B47] uppercase tracking-widest mb-1">Total Farms</span>
                            <span className="text-2xl font-extrabold text-[#101B14] font-mono">
                                {isFetching ? '--' : farms.length}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        <div className="relative w-full sm:w-64">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-[#101B14]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search farms..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-[#101B14]/15 text-[#101B14] text-sm focus:outline-none focus:ring-2 focus:ring-[#D9A63E] transition-all shadow-sm"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                            className="w-full sm:w-40 px-4 py-2.5 rounded-lg bg-white border border-[#101B14]/15 text-[#101B14] text-sm font-bold font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#D9A63E] transition-all appearance-none cursor-pointer shadow-sm"
                        >
                            <option value="ALL">All Status</option>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Grid of Farms */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isFetching ? (
                    [...Array(3)].map((_, idx) => (
                        <div key={idx} className="bg-[#FBF9F5] border border-[#101B14]/10 rounded-xl p-6 shadow-xs animate-pulse h-64 flex flex-col justify-between">
                            <div className="h-4 bg-[#101B14]/10 rounded w-1/3 mb-4"></div>
                            <div className="h-6 bg-[#101B14]/10 rounded w-3/4 mb-6"></div>
                            <div className="h-4 bg-[#101B14]/10 rounded w-full mb-2"></div>
                            <div className="h-4 bg-[#101B14]/10 rounded w-5/6"></div>
                        </div>
                    ))
                ) : filteredFarms.length > 0 ? (
                    filteredFarms.map((farm) => {
                        const assignedManager = managers.find((m) => m.id === farm.managerId);

                        return (
                            <div
                                key={farm.id}
                                onClick={() => navigate(farm.id.toString())}
                                className="bg-[#FBF9F5] border border-[#101B14]/10 rounded-xl shadow-xs hover:bg-[#ECE6D6] hover:border-l-4 hover:border-l-[#3F6B47] transition-all duration-300 cursor-pointer group flex flex-col relative overflow-hidden h-full min-h-[260px]"
                            >
                                <div className="p-6 flex flex-col flex-1">
                                    <div className="flex items-start justify-between mb-4 mt-1">
                                        <div className="pr-4">
                                            <span className="text-[9px] font-mono font-bold text-[#101B14]/50 uppercase tracking-widest flex items-center gap-1.5">
                                                FARM ID: #{farm.id.toString().padStart(4, '0')}
                                            </span>
                                            <h4 className="text-xl font-extrabold text-[#101B14] font-['Fraunces',serif] group-hover:text-[#3F6B47] transition-colors mt-2 leading-tight">
                                                {farm.name}
                                            </h4>
                                        </div>
                                        <span className={`shrink-0 px-2.5 py-1 rounded-[3px] text-[9px] font-extrabold uppercase tracking-widest ${farm.isActive
                                                ? 'bg-[#3F6B47]/10 text-[#3F6B47] border border-[#3F6B47]/20'
                                                : 'bg-[#E76F51]/10 text-[#E76F51] border border-[#E76F51]/20'
                                            }`}
                                        >
                                            {farm.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>

                                    <div className="space-y-4 text-xs font-mono flex-1 mb-6 mt-2">
                                        <div className="flex items-start gap-3 text-[#101B14]/70">
                                            <svg className="w-4 h-4 shrink-0 mt-0.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span className="leading-relaxed line-clamp-2" title={farm.address}>{farm.address}</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 text-[#101B14]/70">
                                            <svg className="w-4 h-4 shrink-0 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                            </svg>
                                            <span className="font-bold bg-white px-2 py-1 rounded border border-[#101B14]/10 tracking-wider shadow-sm">
                                                GPS: {farm.latitude.toFixed(4)}, {farm.longitude.toFixed(4)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-auto flex items-center justify-between border-t border-[#101B14]/10 pt-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase tracking-widest font-bold text-[#101B14]/50 mb-1">Assigned Manager</span>
                                            <span className="font-bold text-[#101B14]">
                                                {assignedManager
                                                    ? `${assignedManager.firstName} ${assignedManager.lastName}`
                                                    : `Unassigned (ID #${farm.managerId})`}
                                            </span>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center group-hover:bg-[#3F6B47] group-hover:text-white text-[#101B14]/40 border border-[#101B14]/10 transition-all shadow-sm">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full bg-[#FBF9F5] border border-[#101B14]/10 rounded-xl py-20 px-6 flex flex-col items-center justify-center text-center shadow-xs">
                        <div className="w-16 h-16 rounded-full bg-[#ECE6D6] flex items-center justify-center text-[#101B14]/30 mb-4 shadow-inner">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h4 className="text-xl font-bold text-[#101B14] font-['Fraunces',serif] mb-2">
                            {searchTerm || filterStatus !== 'ALL' ? 'No Matching Farms' : 'No Farms Found'}
                        </h4>
                        <p className="font-sans text-sm text-[#101B14]/60 max-w-md leading-relaxed mb-5">
                            {searchTerm || filterStatus !== 'ALL'
                                ? `No farm matches your current search "${searchTerm}" or filter settings.`
                                : isProprietor
                                    ? 'You have not added any farms yet. Add your first farm to begin managing your pens and flocks.'
                                    : 'You have not been assigned to manage any farms.'}
                        </p>
                        
                        {(searchTerm || filterStatus !== 'ALL') ? (
                            <button
                                type="button"
                                onClick={() => { setSearchTerm(''); setFilterStatus('ALL'); }}
                                className="text-[#3F6B47] hover:text-[#2d4f34] font-bold text-xs uppercase tracking-wider font-mono border-b border-[#3F6B47]/40 pb-0.5 transition-colors"
                            >
                                Clear Filters
                            </button>
                        ) : isProprietor ? (
                            <button
                                type="button"
                                onClick={() => setShowModal(true)}
                                className="text-[#D9A63E] hover:text-[#b88c34] font-bold text-xs uppercase tracking-wider font-mono border-b border-[#D9A63E]/30 pb-0.5 transition-colors"
                            >
                                + Add First Farm
                            </button>
                        ) : null}
                    </div>
                )}
            </div>

            {/* Modal functionality */}
            {showModal && isProprietor && (
                <div className="fixed inset-0 bg-[#101B14]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
                    <div className="bg-[#FBF9F5] border border-[#D9A63E]/40 rounded-xl max-w-xl w-full shadow-2xl flex flex-col max-h-[95vh] relative overflow-hidden">
                        
                        {/* Header Accent Line */}
                        <div className="h-2 w-full bg-[#D9A63E] relative shrink-0 shadow-sm"></div>

                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-[#101B14]/10 p-6 bg-white shrink-0">
                            <div>
                                <h4 className="text-2xl font-extrabold text-[#101B14] font-['Fraunces',serif] tracking-tight">Add New Farm</h4>
                                <p className="text-[10px] font-mono font-bold text-[#3F6B47] uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                                    Register farm location and details
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="text-[#101B14]/40 hover:text-[#E76F51] hover:bg-[#E76F51]/10 bg-[#101B14]/5 transition-all p-2 rounded-full cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            {errorMessage && (
                                <div className="mb-6 p-4 rounded-lg bg-[#E76F51]/10 border border-[#E76F51]/30 text-[#E76F51] text-sm font-bold flex items-start space-x-3 shadow-sm">
                                    <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <span className="leading-relaxed">{errorMessage}</span>
                                </div>
                            )}

                            <form id="farm-form" onSubmit={handleCreateFarm} className="space-y-8">
                                
                                {/* Details Section */}
                                <div className="space-y-4">
                                    <h5 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#101B14]/50 border-b border-[#101B14]/10 pb-2">Farm Details</h5>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-[#101B14]/70 mb-2">
                                            Farm Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g. Grand Valley Farm"
                                            className="w-full px-5 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#D9A63E] focus:ring-2 focus:ring-[#D9A63E]/50 transition-all shadow-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-[#101B14]/70 mb-2">
                                            Physical Address *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            placeholder="e.g. Plot 14 Industrial Layout"
                                            className="w-full px-5 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#D9A63E] focus:ring-2 focus:ring-[#D9A63E]/50 transition-all shadow-sm"
                                        />
                                    </div>
                                </div>

                                {/* Location Section */}
                                <div className="space-y-4">
                                    <h5 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#101B14]/50 border-b border-[#101B14]/10 pb-2">Location Setup</h5>
                                    
                                    <div className="flex gap-3 text-xs font-bold">
                                        <button
                                            type="button"
                                            onClick={() => setLocationMode('gps')}
                                            className={`flex-1 py-3 rounded-lg transition-all cursor-pointer uppercase tracking-wider border shadow-sm ${locationMode === 'gps'
                                                    ? 'bg-[#3F6B47] text-white border-[#3F6B47]'
                                                    : 'bg-white text-[#101B14]/70 border-[#101B14]/20 hover:bg-[#3F6B47]/10 hover:text-[#3F6B47] hover:border-[#3F6B47]/30'
                                                }`}
                                        >
                                            Use My Location
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setLocationMode('map')}
                                            className={`flex-1 py-3 rounded-lg transition-all cursor-pointer uppercase tracking-wider border shadow-sm ${locationMode === 'map'
                                                    ? 'bg-[#3F6B47] text-white border-[#3F6B47]'
                                                    : 'bg-white text-[#101B14]/70 border-[#101B14]/20 hover:bg-[#3F6B47]/10 hover:text-[#3F6B47] hover:border-[#3F6B47]/30'
                                                }`}
                                        >
                                            Pick from Map
                                        </button>
                                    </div>

                                    {locationMode === 'gps' && (
                                        <div className="bg-white p-5 rounded-lg border border-[#101B14]/10 shadow-sm space-y-4">
                                            <p className="text-sm text-[#101B14]/60 font-medium">
                                                If you are currently at the farm, click the button below to accurately record the GPS coordinates.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={handleGetCurrentLocation}
                                                disabled={geoLoading}
                                                className="w-full py-3.5 rounded-lg bg-[#3F6B47] hover:bg-[#2d4f34] text-white font-bold text-xs uppercase tracking-widest transition flex items-center justify-center space-x-2 cursor-pointer shadow-sm disabled:opacity-50"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span>{geoLoading ? 'Getting Location...' : 'Get Current Location'}</span>
                                            </button>
                                        </div>
                                    )}

                                    {locationMode === 'map' && (
                                        <div className="space-y-2 border border-[#101B14]/20 rounded-lg overflow-hidden shadow-sm">
                                            <div className="bg-[#DFD8C4] px-4 py-3 border-b border-[#101B14]/10">
                                                <p className="text-[10px] font-bold text-[#101B14]/80 uppercase tracking-widest">
                                                    Move the pin to select farm location
                                                </p>
                                            </div>
                                            <div className="h-72 w-full">
                                                <LocationPickerMap
                                                    latitude={formData.latitude}
                                                    longitude={formData.longitude}
                                                    onChange={(lat, lng) =>
                                                        setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }))
                                                    }
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 pt-2 font-mono text-[10px] uppercase tracking-widest text-[#101B14]/60">
                                        <div className="bg-white px-4 py-3 rounded-lg border border-[#101B14]/10 flex justify-between items-center shadow-sm">
                                            <span>Latitude:</span>
                                            <span className="font-extrabold text-[#101B14] text-xs">{formData.latitude}</span>
                                        </div>
                                        <div className="bg-white px-4 py-3 rounded-lg border border-[#101B14]/10 flex justify-between items-center shadow-sm">
                                            <span>Longitude:</span>
                                            <span className="font-extrabold text-[#101B14] text-xs">{formData.longitude}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Access Section */}
                                <div className="space-y-5">
                                    <h5 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#101B14]/50 border-b border-[#101B14]/10 pb-2">Access & Status</h5>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-[#101B14]/70 mb-2">
                                            Assign Manager *
                                        </label>
                                        <select
                                            required
                                            value={formData.managerId}
                                            onChange={(e) =>
                                                setFormData({ ...formData, managerId: Number(e.target.value) })
                                            }
                                            className="w-full px-5 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#D9A63E] focus:ring-2 focus:ring-[#D9A63E]/50 transition-all shadow-sm cursor-pointer"
                                        >
                                            {managers.length > 0 ? (
                                                managers.map((m) => (
                                                    <option key={m.id} value={m.id}>
                                                        {m.firstName} {m.lastName} (ID #{m.id})
                                                    </option>
                                                ))
                                            ) : (
                                                <option value={proprietorId}>Assign to Myself</option>
                                            )}
                                        </select>
                                    </div>

                                    {/* Clean Toggle Switch */}
                                    <div 
                                        className="flex items-center justify-between bg-white p-5 rounded-lg border border-[#101B14]/10 cursor-pointer shadow-sm hover:border-[#3F6B47]/40 transition-colors" 
                                        onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-[#101B14]">Farm Status: Active</span>
                                            <span className="text-xs text-[#101B14]/50 mt-1 font-medium">Turn this off if the farm is currently closed or unused.</span>
                                        </div>
                                        
                                        <div className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.isActive ? 'bg-[#3F6B47]' : 'bg-[#101B14]/20'}`}>
                                            <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 bg-[#ECE6D6] border-t border-[#101B14]/10 shrink-0 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-4 z-10">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="w-full sm:w-auto px-6 py-4 rounded-lg bg-transparent hover:bg-[#101B14]/5 text-[#101B14]/60 hover:text-[#101B14] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="farm-form"
                                disabled={loading}
                                className="w-full sm:w-auto px-8 py-4 rounded-lg bg-[#D9A63E] hover:bg-[#c99834] text-[#101B14] font-extrabold text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Save Farm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <Routes>
            <Route index element={FarmListUI} />
            <Route 
                path=":farmId/*" 
                element={<FarmDetailWrapper farms={farms} isFetching={isFetching} />} 
            />
        </Routes>
    );
};

const FarmDetailWrapper: React.FC<{ farms: FarmResponseDto[], isFetching: boolean }> = ({ farms, isFetching }) => {
    const { farmId } = useParams();
    const navigate = useNavigate();

    const farm = farms.find(f => f.id.toString() === farmId);

    if (isFetching) {
        return (
            <div className="p-24 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#3F6B47]/20 border-t-[#3F6B47] rounded-full animate-spin mb-6"></div>
                <span className="text-[#101B14]/60 text-sm font-bold uppercase tracking-widest font-mono">
                    Loading farm data...
                </span>
            </div>
        );
    }

    if (!farm) {
        return (
            <div className="bg-white border border-[#E76F51]/20 rounded-xl p-16 text-center shadow-xs flex flex-col items-center max-w-2xl mx-auto mt-12">
                 <div className="w-20 h-20 rounded-full bg-[#E76F51]/10 text-[#E76F51] flex items-center justify-center mb-6">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-2xl font-extrabold text-[#101B14] mb-3 font-['Fraunces',serif]">Farm Not Found</h3>
                <p className="text-[#101B14]/60 mb-8 text-sm font-medium">The requested farm does not exist or you do not have permission to view it.</p>
                <button 
                    onClick={() => navigate('..', { relative: 'path' })} 
                    className="px-6 py-3 bg-[#3F6B47] text-white rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-[#2d4f34] transition-colors"
                >
                    Return to All Farms
                </button>
            </div>
        );
    }

    return (
        <FarmDetailView 
            farm={farm} 
            onBack={() => navigate('..', { relative: 'path' })} 
        />
    );
};