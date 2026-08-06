// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { infrastructureService } from '../../services/infrastructureService';
// import { batchService } from '../../services/batchService';
// import { userService } from '../../services/userService';
// import {
//     AnimalCategory,
//     ProductionType,
//     type FarmRequestDto,
//     type FarmResponseDto,
//     type SectionRequestDto,
//     type SectionResponseDto,
// } from '../../types/infrastructure';
// import { Breed, type BatchRequestDto } from '../../types/batch';
// import type { UserResponseDto } from '../../types/auth';

// interface ProvisioningWizardProps {
//     organisationId: number;
//     onProvisionComplete: () => void;
// }

// type ProvisionStep = 'FARM' | 'SECTION' | 'BATCH';

// export const ProvisioningWizard: React.FC<ProvisioningWizardProps> = ({
//     organisationId,
//     onProvisionComplete,
// }) => {
//     const [currentStep, setCurrentStep] = useState<ProvisionStep>('FARM');
//     const [loading, setLoading] = useState<boolean>(false);
//     const [errorMessage, setErrorMessage] = useState<string | null>(null);

//     // Available options from backend
//     const [managers, setManagers] = useState<UserResponseDto[]>([]);
//     const [createdFarms, setCreatedFarms] = useState<FarmResponseDto[]>([]);
//     const [availableSections, setAvailableSections] = useState<SectionResponseDto[]>([]);

//     // Form 1: Farm State
//     const [farmData, setFarmData] = useState<FarmRequestDto>({
//         name: '',
//         address: '',
//         managerId: 0,
//         organisationId: organisationId,
//         latitude: 7.3775, // Default Ibadan/Lagos region coordinates
//         longitude: 3.947,
//         isActive: true,
//     });

//     // Form 2: Section State
//     const [sectionData, setSectionData] = useState<SectionRequestDto>({
//         name: '',
//         farmId: 0,
//         animalCategory: AnimalCategory.POULTRY,
//         productionType: ProductionType.MEAT,
//         capacity: 5000,
//     });

//     // Form 3: Batch State initialized using a pure lazy initializer function
//     const [batchData, setBatchData] = useState<BatchRequestDto>(() => {
//         const today = new Date();
//         const futureHarvest = new Date(today.getTime() + 42 * 24 * 60 * 60 * 1000); // 42-day cycle

//         return {
//             batchNumber: '',
//             sectionId: 0,
//             initialCount: 2500,
//             startDate: today.toISOString().split('T')[0],
//             expectedEndDate: futureHarvest.toISOString().split('T')[0],
//             breed: Breed.ROSS_308,
//         };
//     });

//     // Load managers and existing farms on mount
//     useEffect(() => {
//         const loadInitialData = async () => {
//             try {
//                 const farmList = await infrastructureService.getFarmsByOrganisation(organisationId);
//                 setCreatedFarms(farmList);

//                 if (farmList.length > 0) {
//                     const sectionList = await infrastructureService.getAvailableSectionsByFarm(farmList[0].id).catch(() => []);
//                     setAvailableSections(sectionList);
//                 }

//                 const managerList = await userService.getManagersByOrganisation(organisationId).catch(() => []);
//                 setManagers(managerList);
//             } catch {
//                 // Fallback for initial clean state
//             }
//         };
//         loadInitialData();
//     }, [organisationId]);

//     // Handle Farm Provisioning
//     const handleCreateFarm = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setLoading(true);
//         setErrorMessage(null);

//         try {
//             const newFarm = await infrastructureService.createFarm(farmData);
//             setCreatedFarms((prev) => [...prev, newFarm]);
//             setSectionData((prev) => ({ ...prev, farmId: newFarm.id }));
//             setCurrentStep('SECTION');
//         } catch (err: unknown) {
//             if (axios.isAxiosError(err)) {
//                 setErrorMessage(err.response?.data?.message || 'Failed to register farm facility.');
//             } else {
//                 setErrorMessage('Unexpected system error during farm provisioning.');
//             }
//         } finally {
//             setLoading(false);
//         }
//     };

//     // Handle Section Provisioning
//     const handleCreateSection = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setLoading(true);
//         setErrorMessage(null);

//         try {
//             const newSection = await infrastructureService.createSection(sectionData);
//             setAvailableSections((prev) => [...prev, newSection]);
//             setBatchData((prev) => ({
//                 ...prev,
//                 sectionId: newSection.id,
//                 batchNumber: `${newSection.name.toUpperCase().replace(/\s+/g, '')}-${Date.now().toString().slice(-4)}`,
//             }));
//             setCurrentStep('BATCH');
//         } catch (err: unknown) {
//             if (axios.isAxiosError(err)) {
//                 setErrorMessage(err.response?.data?.message || 'Failed to register farm section.');
//             } else {
//                 setErrorMessage('Unexpected system error during section creation.');
//             }
//         } finally {
//             setLoading(false);
//         }
//     };

//     // Handle Batch Provisioning
//     const handleCreateBatch = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setLoading(true);
//         setErrorMessage(null);

//         try {
//             await batchService.createBatch(batchData);
//             onProvisionComplete();
//         } catch (err: unknown) {
//             if (axios.isAxiosError(err)) {
//                 setErrorMessage(err.response?.data?.message || 'Failed to initialize livestock batch.');
//             } else {
//                 setErrorMessage('Unexpected system error during batch initialization.');
//             }
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="max-w-4xl mx-auto p-4 sm:p-6 text-[var(--color-agri-straw)] font-sans">
//             {/* Industrial Stepper Bar */}
//             <div className="bg-[var(--color-agri-surface)] border border-[var(--color-agri-border)] rounded-2xl p-4 mb-8 shadow-xl">
//                 <div className="flex items-center justify-between text-xs font-mono tracking-wider uppercase">
//                     <div
//                         className={`flex items-center space-x-2 ${currentStep === 'FARM'
//                                 ? 'text-[var(--color-agri-emerald)] font-bold'
//                                 : 'text-slate-500'
//                             }`}
//                     >
//                         <span className="w-6 h-6 rounded-lg bg-[var(--color-agri-slate)] border border-current flex items-center justify-center">
//                             01
//                         </span>
//                         <span>Facility (Farm)</span>
//                     </div>

//                     <div className="h-0.5 flex-1 mx-4 bg-[var(--color-agri-border)]" />

//                     <div
//                         className={`flex items-center space-x-2 ${currentStep === 'SECTION'
//                                 ? 'text-[var(--color-agri-emerald)] font-bold'
//                                 : 'text-slate-500'
//                             }`}
//                     >
//                         <span className="w-6 h-6 rounded-lg bg-[var(--color-agri-slate)] border border-current flex items-center justify-center">
//                             02
//                         </span>
//                         <span>Containment (Section)</span>
//                     </div>

//                     <div className="h-0.5 flex-1 mx-4 bg-[var(--color-agri-border)]" />

//                     <div
//                         className={`flex items-center space-x-2 ${currentStep === 'BATCH'
//                                 ? 'text-[var(--color-agri-emerald)] font-bold'
//                                 : 'text-slate-500'
//                             }`}
//                     >
//                         <span className="w-6 h-6 rounded-lg bg-[var(--color-agri-slate)] border border-current flex items-center justify-center">
//                             03
//                         </span>
//                         <span>Flock Stock (Batch)</span>
//                     </div>
//                 </div>
//             </div>

//             {/* Error Alert Box */}
//             {errorMessage && (
//                 <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs font-mono flex items-center space-x-3 shadow-lg">
//                     <span className="text-base">🚨</span>
//                     <span className="flex-1">{errorMessage}</span>
//                 </div>
//             )}

//             {/* STEP 1: FARM PROVISIONING */}
//             {currentStep === 'FARM' && (
//                 <form
//                     onSubmit={handleCreateFarm}
//                     className="bg-[var(--color-agri-surface)] border border-[var(--color-agri-border)] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6"
//                 >
//                     <div className="border-b border-[var(--color-agri-border)] pb-4">
//                         <h3 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
//                             <span>🚜</span>
//                             <span>Provision Physical Farm Facility</span>
//                         </h3>
//                         <p className="text-xs text-slate-400 mt-1">
//                             Establish top-level physical node with geofenced GPS coordinates for automatic local microclimate telemetry mapping.
//                         </p>
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                         <div>
//                             <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
//                                 Facility Name *
//                             </label>
//                             <input
//                                 type="text"
//                                 required
//                                 value={farmData.name}
//                                 onChange={(e) => setFarmData({ ...farmData, name: e.target.value })}
//                                 placeholder="e.g. Ibadan Sector-1 Commercial Site"
//                                 className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-agri-slate)] border border-[var(--color-agri-border)] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-agri-emerald)]"
//                             />
//                         </div>

//                         <div>
//                             <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
//                                 Designated Site Manager ID *
//                             </label>
//                             {managers.length > 0 ? (
//                                 <select
//                                     value={farmData.managerId}
//                                     onChange={(e) =>
//                                         setFarmData({ ...farmData, managerId: Number(e.target.value) })
//                                     }
//                                     className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-agri-slate)] border border-[var(--color-agri-border)] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-agri-emerald)]"
//                                 >
//                                     <option value={0}>Select Site Manager</option>
//                                     {managers.map((m) => (
//                                         <option key={m.id} value={m.id}>
//                                             {m.firstName} {m.lastName} ({m.email})
//                                         </option>
//                                     ))}
//                                 </select>
//                             ) : (
//                                 <input
//                                     type="number"
//                                     required
//                                     value={farmData.managerId || ''}
//                                     onChange={(e) =>
//                                         setFarmData({ ...farmData, managerId: Number(e.target.value) })
//                                     }
//                                     placeholder="Manager User ID (e.g. 1)"
//                                     className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-agri-slate)] border border-[var(--color-agri-border)] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-agri-emerald)]"
//                                 />
//                             )}
//                         </div>
//                     </div>

//                     <div>
//                         <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
//                             Physical Operational Address *
//                         </label>
//                         <input
//                             type="text"
//                             required
//                             value={farmData.address}
//                             onChange={(e) => setFarmData({ ...farmData, address: e.target.value })}
//                             placeholder="e.g. Km 14 Moniya-Iseyin Road, Akinyele LGA, Oyo State"
//                             className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-agri-slate)] border border-[var(--color-agri-border)] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-agri-emerald)]"
//                         />
//                     </div>

//                     {/* Telemetry Geofence Parameters */}
//                     <div className="p-4 rounded-xl bg-[var(--color-agri-slate)] border border-[var(--color-agri-border)] space-y-3">
//                         <span className="text-xs font-mono font-bold text-[var(--color-agri-emerald)] uppercase tracking-wider block">
//                             📡 Microclimate Geofence Coordinates
//                         </span>
//                         <div className="grid grid-cols-2 gap-4">
//                             <div>
//                                 <label className="block text-xs font-mono text-slate-400 mb-1">
//                                     Latitude (°N)
//                                 </label>
//                                 <input
//                                     type="number"
//                                     step="any"
//                                     required
//                                     value={farmData.latitude}
//                                     onChange={(e) =>
//                                         setFarmData({ ...farmData, latitude: parseFloat(e.target.value) })
//                                     }
//                                     className="w-full px-3 py-2 rounded-lg bg-[var(--color-agri-surface)] border border-[var(--color-agri-border)] text-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[var(--color-agri-emerald)]"
//                                 />
//                             </div>
//                             <div>
//                                 <label className="block text-xs font-mono text-slate-400 mb-1">
//                                     Longitude (°E)
//                                 </label>
//                                 <input
//                                     type="number"
//                                     step="any"
//                                     required
//                                     value={farmData.longitude}
//                                     onChange={(e) =>
//                                         setFarmData({ ...farmData, longitude: parseFloat(e.target.value) })
//                                     }
//                                     className="w-full px-3 py-2 rounded-lg bg-[var(--color-agri-surface)] border border-[var(--color-agri-border)] text-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[var(--color-agri-emerald)]"
//                                 />
//                             </div>
//                         </div>
//                     </div>

//                     <button
//                         type="submit"
//                         disabled={loading}
//                         className="w-full py-3.5 px-4 rounded-xl bg-[var(--color-agri-emerald)] hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
//                     >
//                         {loading ? (
//                             <span>Provisioning Facility Node...</span>
//                         ) : (
//                             <span>Commit Facility & Move to Containment (Section) →</span>
//                         )}
//                     </button>
//                 </form>
//             )}

//             {/* STEP 2: SECTION PROVISIONING */}
//             {currentStep === 'SECTION' && (
//                 <form
//                     onSubmit={handleCreateSection}
//                     className="bg-[var(--color-agri-surface)] border border-[var(--color-agri-border)] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6"
//                 >
//                     <div className="border-b border-[var(--color-agri-border)] pb-4">
//                         <h3 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
//                             <span>🏠</span>
//                             <span>Provision Containment Unit (Pen / Section)</span>
//                         </h3>
//                         <p className="text-xs text-slate-400 mt-1">
//                             Define isolated biosecurity housing parameters, animal categories, and maximum structural carrying capacity.
//                         </p>
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                         <div>
//                             <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
//                                 Parent Farm Facility *
//                             </label>
//                             <select
//                                 value={sectionData.farmId}
//                                 onChange={(e) =>
//                                     setSectionData({ ...sectionData, farmId: Number(e.target.value) })
//                                 }
//                                 className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-agri-slate)] border border-[var(--color-agri-border)] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-agri-emerald)]"
//                             >
//                                 {createdFarms.map((f) => (
//                                     <option key={f.id} value={f.id}>
//                                         {f.name} (ID: {f.id})
//                                     </option>
//                                 ))}
//                             </select>
//                         </div>

//                         <div>
//                             <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
//                                 Section / Pen Identifier *
//                             </label>
//                             <input
//                                 type="text"
//                                 required
//                                 value={sectionData.name}
//                                 onChange={(e) => setSectionData({ ...sectionData, name: e.target.value })}
//                                 placeholder="e.g. Broiler Pen 1 - Sector Alpha"
//                                 className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-agri-slate)] border border-[var(--color-agri-border)] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-agri-emerald)]"
//                             />
//                         </div>
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                         <div>
//                             <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
//                                 Biological Category *
//                             </label>
//                             <select
//                                 value={sectionData.animalCategory}
//                                 onChange={(e) =>
//                                     setSectionData({
//                                         ...sectionData,
//                                         animalCategory: e.target.value as AnimalCategory,
//                                     })
//                                 }
//                                 className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-agri-slate)] border border-[var(--color-agri-border)] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-agri-emerald)]"
//                             >
//                                 <option value={AnimalCategory.POULTRY}>POULTRY</option>
//                                 <option value={AnimalCategory.LIVESTOCK}>LIVESTOCK</option>
//                                 <option value={AnimalCategory.SWINE}>SWINE</option>
//                             </select>
//                         </div>

//                         <div>
//                             <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
//                                 Production Stream *
//                             </label>
//                             <select
//                                 value={sectionData.productionType}
//                                 onChange={(e) =>
//                                     setSectionData({
//                                         ...sectionData,
//                                         productionType: e.target.value as ProductionType,
//                                     })
//                                 }
//                                 className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-agri-slate)] border border-[var(--color-agri-border)] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-agri-emerald)]"
//                             >
//                                 <option value={ProductionType.MEAT}>MEAT (Broiler)</option>
//                                 <option value={ProductionType.EGG}>EGG (Layer)</option>
//                                 <option value={ProductionType.MILK}>MILK (Dairy)</option>
//                                 <option value={ProductionType.BREEDING}>BREEDING</option>
//                             </select>
//                         </div>

//                         <div>
//                             <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
//                                 Max Unit Capacity *
//                             </label>
//                             <input
//                                 type="number"
//                                 min={1}
//                                 required
//                                 value={sectionData.capacity}
//                                 onChange={(e) =>
//                                     setSectionData({ ...sectionData, capacity: Number(e.target.value) })
//                                 }
//                                 className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-agri-slate)] border border-[var(--color-agri-border)] text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-agri-emerald)]"
//                             />
//                         </div>
//                     </div>

//                     <button
//                         type="submit"
//                         disabled={loading}
//                         className="w-full py-3.5 px-4 rounded-xl bg-[var(--color-agri-emerald)] hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
//                     >
//                         {loading ? (
//                             <span>Configuring Section Unit...</span>
//                         ) : (
//                             <span>Commit Section & Proceed to Batch Stocking →</span>
//                         )}
//                     </button>
//                 </form>
//             )}

//             {/* STEP 3: BATCH PROVISIONING */}
//             {currentStep === 'BATCH' && (
//                 <form
//                     onSubmit={handleCreateBatch}
//                     className="bg-[var(--color-agri-surface)] border border-[var(--color-agri-border)] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6"
//                 >
//                     <div className="border-b border-[var(--color-agri-border)] pb-4">
//                         <h3 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
//                             <span>🐣</span>
//                             <span>Initialize Biological Batch Stock</span>
//                         </h3>
//                         <p className="text-xs text-slate-400 mt-1">
//                             Stock an active unblocked section unit with day-old chicks/stock, locking the section until harvest completion.
//                         </p>
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                         <div>
//                             <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
//                                 Generated Batch Registry Code *
//                             </label>
//                             <input
//                                 type="text"
//                                 required
//                                 value={batchData.batchNumber}
//                                 onChange={(e) =>
//                                     setBatchData({ ...batchData, batchNumber: e.target.value })
//                                 }
//                                 className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-agri-slate)] border border-[var(--color-agri-border)] text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-agri-emerald)]"
//                             />
//                         </div>

//                         <div>
//                             <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
//                                 Target Unblocked Section *
//                             </label>
//                             {availableSections.length > 0 ? (
//                                 <select
//                                     value={batchData.sectionId}
//                                     onChange={(e) =>
//                                         setBatchData({ ...batchData, sectionId: Number(e.target.value) })
//                                     }
//                                     className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-agri-slate)] border border-[var(--color-agri-border)] text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-agri-emerald)]"
//                                 >
//                                     {availableSections.map((sec) => (
//                                         <option key={sec.id} value={sec.id}>
//                                             {sec.name} (Capacity: {sec.capacity})
//                                         </option>
//                                     ))}
//                                 </select>
//                             ) : (
//                                 <input
//                                     type="number"
//                                     required
//                                     readOnly
//                                     value={batchData.sectionId}
//                                     className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-agri-slate)]/60 border border-[var(--color-agri-border)] text-slate-400 text-sm font-mono cursor-not-allowed"
//                                 />
//                             )}
//                         </div>
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                         <div>
//                             <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
//                                 Initial Stock Count (Day-Olds) *
//                             </label>
//                             <input
//                                 type="number"
//                                 min={1}
//                                 required
//                                 value={batchData.initialCount}
//                                 onChange={(e) =>
//                                     setBatchData({ ...batchData, initialCount: Number(e.target.value) })
//                                 }
//                                 className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-agri-slate)] border border-[var(--color-agri-border)] text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-agri-emerald)]"
//                             />
//                         </div>

//                         <div>
//                             <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
//                                 Genetic Breed Profile *
//                             </label>
//                             <select
//                                 value={batchData.breed}
//                                 onChange={(e) =>
//                                     setBatchData({ ...batchData, breed: e.target.value as Breed })
//                                 }
//                                 className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-agri-slate)] border border-[var(--color-agri-border)] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-agri-emerald)]"
//                             >
//                                 <option value={Breed.ROSS_308}>ROSS 308 (High Meat Yield)</option>
//                                 <option value={Breed.COBB_500}>COBB 500 (Efficient FCR)</option>
//                                 <option value={Breed.HUBBARD}>HUBBARD (Hardy Strain)</option>
//                                 <option value={Breed.ISA_BROWN}>ISA BROWN (High Egg Rate)</option>
//                                 <option value={Breed.NOILER}>NOILER (Dual Purpose)</option>
//                             </select>
//                         </div>
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                         <div>
//                             <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
//                                 Placement Start Date *
//                             </label>
//                             <input
//                                 type="date"
//                                 required
//                                 value={batchData.startDate}
//                                 onChange={(e) =>
//                                     setBatchData({ ...batchData, startDate: e.target.value })
//                                 }
//                                 className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-agri-slate)] border border-[var(--color-agri-border)] text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-agri-emerald)]"
//                             />
//                         </div>

//                         <div>
//                             <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
//                                 Target Harvest Completion Date *
//                             </label>
//                             <input
//                                 type="date"
//                                 required
//                                 value={batchData.expectedEndDate}
//                                 onChange={(e) =>
//                                     setBatchData({ ...batchData, expectedEndDate: e.target.value })
//                                 }
//                                 className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-agri-slate)] border border-[var(--color-agri-border)] text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-agri-emerald)]"
//                             />
//                         </div>
//                     </div>

//                     <button
//                         type="submit"
//                         disabled={loading}
//                         className="w-full py-3.5 px-4 rounded-xl bg-[var(--color-agri-emerald)] hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
//                     >
//                         {loading ? (
//                             <span>Locking Section & Stocking Batch...</span>
//                         ) : (
//                             <span>Finalize Provisioning & Launch Facility Dashboard →</span>
//                         )}
//                     </button>
//                 </form>
//             )}
//         </div>
//     );
// };