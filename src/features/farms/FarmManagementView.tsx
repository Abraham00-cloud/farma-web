import React, { useState, useEffect } from 'react';
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

export const FarmManagementView: React.FC<FarmManagementViewProps> = ({
    organisationId,
    proprietorId,
    userRole = 'PROPRIETOR',
    currentUserId,
}) => {
    const isProprietor = userRole?.toUpperCase() === 'PROPRIETOR' || userRole?.toUpperCase() === 'ADMIN';

    const [farms, setFarms] = useState<FarmResponseDto[]>([]);
    const [selectedFarm, setSelectedFarm] = useState<FarmResponseDto | null>(null);
    const [managers, setManagers] = useState<UserResponseDto[]>([]);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [geoLoading, setGeoLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [locationMode, setLocationMode] = useState<'gps' | 'map'>('gps');

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
                    // 🔒 ROLE SCOPING LOGIC:
                    // If PROPRIETOR -> Show all farms in organisation
                    // If MANAGER -> Filter only farms where farm.managerId matches the logged-in manager ID
                    if (isProprietor) {
                        setFarms(farmData);
                    } else if (currentUserId) {
                        const scopedFarms = farmData.filter(farm => farm.managerId === currentUserId);
                        setFarms(scopedFarms);
                    } else {
                        setFarms(farmData);
                    }

                    setManagers(managerData);
                    if (managerData.length > 0) {
                        setFormData((prev) => ({ ...prev, managerId: managerData[0].id }));
                    }
                }
            } catch {
                // Fallback
            }
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, [organisationId, proprietorId, isProprietor, currentUserId]);

    if (selectedFarm) {
        return (
            <FarmDetailView
                farm={selectedFarm}
                onBack={() => setSelectedFarm(null)}
            />
        );
    }

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

        const payload: FarmRequestDto = {
            ...formData,
            organisationId,
        };

        try {
            await infrastructureService.createFarm(payload);
            setShowModal(false);
            setFormData({
                name: '',
                address: '',
                managerId: managers.length > 0 ? managers[0].id : proprietorId,
                latitude: 6.5244,
                longitude: 3.3792,
                isActive: true,
            });

            const updatedFarms = await infrastructureService.getFarmsByOrganisation(organisationId);
            if (isProprietor) {
                setFarms(updatedFarms);
            } else if (currentUserId) {
                setFarms(updatedFarms.filter(f => f.managerId === currentUserId));
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setErrorMessage(
                    err.response?.data?.message || 'Failed to register farm facility.'
                );
            } else {
                setErrorMessage('An unexpected error occurred while saving the farm.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Action Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        {isProprietor ? 'Farm Facilities' : 'My Assigned Farm Facility'}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                        {isProprietor
                            ? 'Click on any farm facility to open its operational workspace and manage pens/flocks.'
                            : 'Access physical pen capacity, active flock batches, and telemetry for your assigned site.'}
                    </p>
                </div>

                {/* 🔒 "+ Add New Farm" Button is rendered ONLY for Proprietors */}
                {isProprietor && (
                    <button
                        type="button"
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2.5 rounded-xl bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold text-xs uppercase tracking-wider shadow-sm transition flex items-center justify-center space-x-2 cursor-pointer"
                    >
                        <span>+ Add New Farm</span>
                    </button>
                )}
            </div>

            {/* Farms Data Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {farms.length > 0 ? (
                    farms.map((farm) => {
                        const assignedManager = managers.find((m) => m.id === farm.managerId);

                        return (
                            <div
                                key={farm.id}
                                onClick={() => setSelectedFarm(farm)}
                                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-[#C2410C] hover:shadow-md transition space-y-4 cursor-pointer group"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                                            Facility #{farm.id}
                                        </span>
                                        <h4 className="text-base font-bold text-slate-900 group-hover:text-[#C2410C] transition mt-0.5">
                                            {farm.name}
                                        </h4>
                                    </div>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${farm.isActive
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                                            }`}
                                    >
                                        {farm.isActive ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                </div>

                                <div className="space-y-2 text-xs font-mono">
                                    <div className="flex justify-between py-1 border-b border-slate-100">
                                        <span className="text-slate-500">Address:</span>
                                        <span className="font-bold text-slate-800 truncate max-w-[180px]">
                                            {farm.address}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-100">
                                        <span className="text-slate-500">GPS Coordinates:</span>
                                        <span className="font-bold text-slate-800">
                                            {farm.latitude.toFixed(4)}, {farm.longitude.toFixed(4)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-slate-500">Assigned Manager:</span>
                                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                            {assignedManager
                                                ? `${assignedManager.firstName} ${assignedManager.lastName}`
                                                : `Manager #${farm.managerId}`}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-2 text-right">
                                    <span className="text-[11px] font-bold text-[#C2410C] group-hover:underline">
                                        Open Operations Hub →
                                    </span>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-10 text-center font-mono text-xs text-slate-400">
                        {isProprietor
                            ? 'No farm facilities registered yet. Click "+ Add New Farm" to create your first site.'
                            : 'No farm facility currently assigned to your manager account.'}
                    </div>
                )}
            </div>

            {/* Add Farm Modal (Proprietor Only) */}
            {showModal && isProprietor && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h4 className="text-base font-bold text-slate-900">Add Farm Facility</h4>
                                <p className="text-xs text-slate-500">Register site location & assign a manager.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer p-1"
                            >
                                ✕
                            </button>
                        </div>

                        {errorMessage && (
                            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-mono">
                                🚨 {errorMessage}
                            </div>
                        )}

                        <form onSubmit={handleCreateFarm} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Farm Facility Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Grand Valley Farm Site A"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#C2410C] focus:bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Physical Address / Landmark *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="e.g. Plot 14 Industrial Layout, Ibadan"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#C2410C] focus:bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-700">
                                    Set Geofence Bearings
                                </label>

                                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                                    <button
                                        type="button"
                                        onClick={() => setLocationMode('gps')}
                                        className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${locationMode === 'gps'
                                                ? 'bg-white text-slate-900 shadow-xs font-bold'
                                                : 'text-slate-500 hover:text-slate-900'
                                            }`}
                                    >
                                        📍 GPS Auto-Detect
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLocationMode('map')}
                                        className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${locationMode === 'map'
                                                ? 'bg-white text-slate-900 shadow-xs font-bold'
                                                : 'text-slate-500 hover:text-slate-900'
                                            }`}
                                    >
                                        🗺️ Interactive Map
                                    </button>
                                </div>

                                {locationMode === 'gps' && (
                                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                                        <p className="text-[11px] text-slate-500">
                                            If you are currently on site, click below to grab your device's live coordinates.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleGetCurrentLocation}
                                            disabled={geoLoading}
                                            className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                                        >
                                            <span>📍</span>
                                            <span>{geoLoading ? 'Acquiring GPS...' : 'Use My Current Location'}</span>
                                        </button>
                                    </div>
                                )}

                                {locationMode === 'map' && (
                                    <div className="space-y-2">
                                        <p className="text-[11px] text-slate-500">
                                            Click anywhere on the map to place the location pin:
                                        </p>
                                        <LocationPickerMap
                                            latitude={formData.latitude}
                                            longitude={formData.longitude}
                                            onChange={(lat, lng) =>
                                                setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }))
                                            }
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px] text-slate-500">
                                    <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                                        <span>Lat: </span>
                                        <span className="font-bold text-slate-800">{formData.latitude}</span>
                                    </div>
                                    <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                                        <span>Lng: </span>
                                        <span className="font-bold text-slate-800">{formData.longitude}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Assign Manager *
                                </label>
                                <select
                                    required
                                    value={formData.managerId}
                                    onChange={(e) =>
                                        setFormData({ ...formData, managerId: Number(e.target.value) })
                                    }
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#C2410C] focus:bg-white"
                                >
                                    {managers.length > 0 ? (
                                        managers.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.firstName} {m.lastName} (#{m.id})
                                            </option>
                                        ))
                                    ) : (
                                        <option value={proprietorId}>Self (Proprietor #{proprietorId})</option>
                                    )}
                                </select>
                            </div>

                            <div className="flex items-center space-x-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) =>
                                        setFormData({ ...formData, isActive: e.target.checked })
                                    }
                                    className="w-4 h-4 text-[#C2410C] rounded-md border-slate-300 focus:ring-[#C2410C]"
                                />
                                <label htmlFor="isActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                                    Mark Facility as Active
                                </label>
                            </div>

                            <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2.5 rounded-xl bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-bold uppercase tracking-wider shadow-xs transition cursor-pointer disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : 'Save Farm Facility'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};