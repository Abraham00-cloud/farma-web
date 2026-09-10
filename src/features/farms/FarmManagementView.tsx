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
    
    const [showModal, setShowModal] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [isFetching, setIsFetching] = useState<boolean>(true);
    const [geoLoading, setGeoLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [locationMode, setLocationMode] = useState<'gps' | 'map'>('gps');
    
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

    const inputClasses = "w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm font-semibold focus:outline-none focus:border-farma-gold focus:ring-2 focus:ring-farma-gold/30 transition-shadow shadow-sm";

    const FarmListUI = (
        <div className="space-y-6 lg:space-y-8 font-sans max-w-7xl mx-auto pb-12">
            
            <div className="flex flex-col gap-6 border-b border-farma-forest/10 pb-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
                    <div>
                        <h3 className="text-3xl md:text-4xl font-bold text-farma-forest tracking-tight">
                            {isProprietor ? 'All Farm Sites' : 'My Assigned Farm'}
                        </h3>
                        <p className="text-sm text-farma-forest/70 font-medium mt-2 max-w-xl leading-relaxed">
                            {isProprietor
                                ? 'Add and monitor physical farm sites, setup locations, and manage assigned managers across your entire business.'
                                : 'Access physical pen capacity, active flocks, and data for your assigned farm.'}
                        </p>
                    </div>

                    {isProprietor && (
                        <button
                            type="button"
                            onClick={() => setShowModal(true)}
                            className="w-full sm:w-auto px-6 py-4 rounded-xl bg-farma-gold hover:bg-farma-gold-hover text-farma-forest font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center space-x-2.5 cursor-pointer shrink-0 shadow-sm"
                        >
                            <IconPlus />
                            <span>Add New Farm</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
                <div className="flex gap-4 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 custom-scrollbar">
                    <div className="bg-farma-cream border border-farma-forest/10 p-4 rounded-xl flex flex-col justify-center min-w-[140px] shadow-sm">
                        <span className="text-[10px] font-bold text-farma-green uppercase tracking-widest mb-1">Active Sites</span>
                        <span className="text-2xl font-bold text-farma-forest tabular-nums">
                            {isFetching ? '--' : farms.filter(f => f.isActive).length}
                        </span>
                    </div>
                    <div className="bg-farma-cream border border-farma-forest/10 p-4 rounded-xl flex flex-col justify-center min-w-[140px] shadow-sm">
                        <span className="text-[10px] text-farma-forest/50 font-bold uppercase tracking-widest mb-1">Total Farms</span>
                        <span className="text-2xl font-bold text-farma-forest tabular-nums">
                            {isFetching ? '--' : farms.length}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto bg-farma-cream p-3 rounded-xl border border-farma-forest/10 shadow-sm">
                    
                    <div className="relative w-full sm:w-64">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-farma-forest/40 pointer-events-none">
                            <IconSearch />
                        </div>
                        <input
                            type="text"
                            placeholder="Search farms..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-farma-forest/10 text-farma-forest text-sm focus:outline-none focus:border-farma-gold focus:ring-2 focus:ring-farma-gold/20 transition-shadow shadow-sm"
                        />
                    </div>
                    
                    <div className="flex items-center bg-farma-sand/60 p-1 rounded-lg border border-farma-forest/10 shrink-0">
                        {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                                    filterStatus === status
                                        ? 'bg-farma-forest text-farma-gold shadow-sm'
                                        : 'text-farma-forest/60 hover:text-farma-forest'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isFetching ? (
                    [...Array(3)].map((_, idx) => (
                        <div key={idx} className="bg-farma-cream border border-farma-forest/10 rounded-xl p-8 shadow-sm animate-pulse h-64 flex flex-col justify-between">
                            <div className="h-4 bg-farma-forest/10 rounded w-1/3 mb-4"></div>
                            <div className="h-6 bg-farma-forest/10 rounded w-3/4 mb-6"></div>
                            <div className="h-4 bg-farma-forest/10 rounded w-full mb-2"></div>
                            <div className="h-4 bg-farma-forest/10 rounded w-5/6"></div>
                        </div>
                    ))
                ) : filteredFarms.length > 0 ? (
                    filteredFarms.map((farm) => {
                        const assignedManager = managers.find((m) => m.id === farm.managerId);

                        return (
                            <div
                                key={farm.id}
                                onClick={() => navigate(farm.id.toString())}
                                className={`bg-farma-cream border border-farma-forest/10 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex flex-col relative overflow-hidden h-full min-h-[260px] ${!farm.isActive ? 'opacity-75 grayscale-[20%]' : ''}`}
                            >
                                <div className={`absolute top-0 inset-x-0 h-1.5 ${farm.isActive ? 'bg-farma-green' : 'bg-farma-forest/20'}`}></div>

                                <div className="p-6 flex flex-col flex-1">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="pr-4">
                                            <span className="text-[10px] font-bold text-farma-forest/40 uppercase tracking-widest flex items-center gap-1.5 tabular-nums">
                                                FARM ID: #{farm.id.toString().padStart(4, '0')}
                                            </span>
                                            <h4 className="text-xl font-bold text-farma-forest group-hover:text-farma-green transition-colors mt-2 leading-tight">
                                                {farm.name}
                                            </h4>
                                        </div>
                                        <span className={`shrink-0 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest ${farm.isActive
                                                ? 'bg-farma-green/10 text-farma-green border border-farma-green/20'
                                                : 'bg-farma-forest/5 text-farma-forest/50 border border-farma-forest/10'
                                            }`}
                                        >
                                            {farm.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>

                                    <div className="space-y-4 text-xs flex-1 mb-6 mt-2">
                                        <div className="flex items-start gap-3 text-farma-forest/70 font-medium">
                                            <div className="w-6 h-6 rounded-md bg-farma-sand flex items-center justify-center shrink-0 text-farma-forest/40 mt-0.5">
                                                <IconMapPin />
                                            </div>
                                            <span className="leading-relaxed line-clamp-2 mt-1">{farm.address}</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 text-farma-forest/70">
                                            <div className="w-6 h-6 rounded-md bg-farma-sand flex items-center justify-center shrink-0 text-farma-forest/40">
                                                <IconLocation />
                                            </div>
                                            <span className="font-semibold text-farma-forest tabular-nums">
                                                {farm.latitude.toFixed(4)}, {farm.longitude.toFixed(4)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-auto flex items-center justify-between border-t border-farma-forest/10 pt-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase tracking-widest font-bold text-farma-forest/40 mb-1">Assigned Manager</span>
                                            <span className="font-semibold text-farma-forest text-sm flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-md bg-farma-forest text-farma-gold flex items-center justify-center text-[9px] font-bold">
                                                    {assignedManager ? assignedManager.firstName.charAt(0) : '?'}
                                                </div>
                                                {assignedManager
                                                    ? `${assignedManager.firstName} ${assignedManager.lastName}`
                                                    : 'Unassigned'}
                                            </span>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center group-hover:bg-farma-green group-hover:text-white text-farma-forest/30 border border-farma-forest/10 transition-colors shadow-sm">
                                            <IconArrowRight />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full bg-farma-cream border border-farma-forest/10 rounded-xl py-24 px-6 flex flex-col items-center justify-center text-center shadow-sm">
                        <div className="w-16 h-16 rounded-full bg-farma-sand flex items-center justify-center text-farma-forest/30 mb-6 shadow-inner border border-farma-forest/5">
                            <IconEmptyState />
                        </div>
                        <h4 className="text-xl font-bold text-farma-forest mb-2">
                            {searchTerm || filterStatus !== 'ALL' ? 'No Matching Farms' : 'No Farms Found'}
                        </h4>
                        <p className="text-sm text-farma-forest/60 max-w-md leading-relaxed mb-6 font-medium">
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
                                className="px-5 py-2.5 bg-white border border-farma-forest/10 rounded-lg text-farma-green hover:bg-farma-forest/5 font-bold text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                            >
                                Clear Filters
                            </button>
                        ) : isProprietor ? (
                            <button
                                type="button"
                                onClick={() => setShowModal(true)}
                                className="px-6 py-3 bg-farma-gold text-farma-forest rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-farma-gold-hover transition-colors shadow-sm cursor-pointer"
                            >
                                Add First Farm
                            </button>
                        ) : null}
                    </div>
                )}
            </div>

            {showModal && isProprietor && (
                <div className="fixed inset-0 bg-farma-forest/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
                    <div className="bg-farma-cream border border-farma-forest/10 rounded-xl max-w-xl w-full shadow-2xl flex flex-col max-h-[95vh] relative overflow-hidden">
                        
                        <div className="h-1.5 w-full bg-farma-gold relative shrink-0"></div>

                        <div className="flex items-center justify-between border-b border-farma-forest/10 p-6 bg-white shrink-0">
                            <div>
                                <h4 className="text-xl font-bold text-farma-forest tracking-tight">Add New Farm</h4>
                                <p className="text-[10px] font-bold text-farma-green uppercase tracking-widest mt-1.5">
                                    Register farm location and details
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="text-farma-forest/40 hover:text-farma-terracotta hover:bg-farma-terracotta/10 bg-farma-forest/5 transition-colors p-2 rounded-lg cursor-pointer"
                            >
                                <IconClose />
                            </button>
                        </div>

                        <div className="p-6 sm:p-8 overflow-y-auto flex-1 custom-scrollbar">
                            {errorMessage && (
                                <div className="mb-6 p-4 rounded-lg bg-farma-terracotta/10 border border-farma-terracotta/30 text-farma-terracotta text-xs font-bold flex items-start space-x-3 shadow-sm">
                                    <IconWarning />
                                    <span className="leading-relaxed">{errorMessage}</span>
                                </div>
                            )}

                            <form id="farm-form" onSubmit={handleCreateFarm} className="space-y-8">
                                
                                <div className="space-y-5">
                                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-farma-forest/40 border-b border-farma-forest/10 pb-2">Farm Details</h5>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/60 mb-1.5 pl-1">
                                            Farm Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g. Grand Valley Farm"
                                            className={inputClasses}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/60 mb-1.5 pl-1">
                                            Physical Address *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            placeholder="e.g. Plot 14 Industrial Layout"
                                            className={inputClasses}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-farma-forest/40 border-b border-farma-forest/10 pb-2">Location Setup</h5>
                                    
                                    <div className="flex bg-farma-sand/50 p-1.5 rounded-lg border border-farma-forest/10">
                                        <button
                                            type="button"
                                            onClick={() => setLocationMode('gps')}
                                            className={`flex-1 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${locationMode === 'gps'
                                                    ? 'bg-white text-farma-green shadow-sm border border-farma-forest/5'
                                                    : 'text-farma-forest/50 hover:text-farma-forest'
                                                }`}
                                        >
                                            Use GPS
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setLocationMode('map')}
                                            className={`flex-1 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${locationMode === 'map'
                                                    ? 'bg-white text-farma-green shadow-sm border border-farma-forest/5'
                                                    : 'text-farma-forest/50 hover:text-farma-forest'
                                                }`}
                                        >
                                            Pick from Map
                                        </button>
                                    </div>

                                    {locationMode === 'gps' && (
                                        <div className="bg-white p-6 rounded-xl border border-farma-forest/10 shadow-sm space-y-4">
                                            <p className="text-sm text-farma-forest/60 font-medium">
                                                If you are currently physically at the farm, click the button below to accurately record the GPS coordinates.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={handleGetCurrentLocation}
                                                disabled={geoLoading}
                                                className="w-full py-3.5 rounded-lg bg-farma-forest hover:bg-farma-green-light text-white font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center space-x-3 cursor-pointer disabled:opacity-50"
                                            >
                                                <IconGPS />
                                                <span>{geoLoading ? 'Acquiring GPS...' : 'Get Current Location'}</span>
                                            </button>
                                        </div>
                                    )}

                                    {locationMode === 'map' && (
                                        <div className="space-y-2 border border-farma-forest/10 rounded-xl overflow-hidden shadow-sm">
                                            <div className="bg-farma-sand/50 px-5 py-3 border-b border-farma-forest/5">
                                                <p className="text-[10px] font-bold text-farma-forest/60 uppercase tracking-widest">
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

                                    <div className="grid grid-cols-2 gap-4 pt-2 text-[10px] uppercase tracking-widest text-farma-forest/50">
                                        <div className="bg-white px-4 py-3 rounded-lg border border-farma-forest/10 flex justify-between items-center shadow-sm">
                                            <span className="font-bold">Lat:</span>
                                            <span className="font-bold text-farma-forest tabular-nums">{formData.latitude}</span>
                                        </div>
                                        <div className="bg-white px-4 py-3 rounded-lg border border-farma-forest/10 flex justify-between items-center shadow-sm">
                                            <span className="font-bold">Lng:</span>
                                            <span className="font-bold text-farma-forest tabular-nums">{formData.longitude}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-farma-forest/40 border-b border-farma-forest/10 pb-2">Access & Status</h5>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/60 mb-1.5 pl-1">
                                            Assign Manager *
                                        </label>
                                        <select
                                            required
                                            value={formData.managerId}
                                            onChange={(e) =>
                                                setFormData({ ...formData, managerId: Number(e.target.value) })
                                            }
                                            className={`${inputClasses} cursor-pointer`}
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

                                    <div 
                                        className="flex items-center justify-between bg-white p-5 rounded-lg border border-farma-forest/10 cursor-pointer shadow-sm hover:border-farma-green/40 transition-colors" 
                                        onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-farma-forest">Farm Status: {formData.isActive ? 'Active' : 'Inactive'}</span>
                                            <span className="text-xs text-farma-forest/50 mt-1 font-medium">Turn this off if the farm is currently closed or unused.</span>
                                        </div>
                                        
                                        <div className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${formData.isActive ? 'bg-farma-green' : 'bg-farma-forest/20'}`}>
                                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-300 ease-in-out ${formData.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-5 bg-farma-sand/50 border-t border-farma-forest/10 shrink-0 flex items-center justify-end gap-3 z-10">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="px-5 py-3 rounded-lg bg-transparent hover:bg-farma-forest/5 text-farma-forest/70 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="farm-form"
                                disabled={loading}
                                className="px-6 py-3 rounded-lg bg-farma-gold text-farma-forest font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-farma-gold-hover transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
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
            <div className="p-32 text-center flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-farma-green/20 border-t-farma-green rounded-full animate-spin mb-6"></div>
                <span className="text-farma-forest/50 text-xs font-bold uppercase tracking-widest">
                    Loading farm data...
                </span>
            </div>
        );
    }

    if (!farm) {
        return (
            <div className="bg-farma-cream border border-farma-terracotta/20 rounded-xl p-16 text-center shadow-sm flex flex-col items-center max-w-xl mx-auto mt-16">
                 <div className="w-16 h-16 rounded-full bg-farma-terracotta/10 text-farma-terracotta flex items-center justify-center mb-6 shadow-inner">
                    <IconErrorLarge />
                </div>
                <h3 className="text-2xl font-bold text-farma-forest mb-2">Farm Not Found</h3>
                <p className="text-farma-forest/60 mb-8 text-sm font-medium max-w-sm leading-relaxed">
                    The requested farm does not exist, or you do not have permission to view its telemetry.
                </p>
                <button 
                    onClick={() => navigate('..', { relative: 'path' })} 
                    className="px-6 py-3 bg-farma-forest text-white rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-farma-green-light transition-colors cursor-pointer"
                >
                    Return to Dashboard
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

// ==========================================
// Reusable SVG Components
// ==========================================

const IconPlus = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
    </svg>
);

const IconSearch = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const IconMapPin = () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const IconLocation = () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
);

const IconArrowRight = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
    </svg>
);

const IconEmptyState = () => (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

const IconClose = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const IconWarning = () => (
    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

const IconGPS = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const IconErrorLarge = () => (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);