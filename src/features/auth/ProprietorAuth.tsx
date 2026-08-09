// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import type { AuthResponseDto } from '../../types/auth';

// interface ProprietorAuthProps {
//     onAuthSuccess: (data: AuthResponseDto) => void;
// }

// export const ProprietorAuth: React.FC<ProprietorAuthProps> = ({ onAuthSuccess }) => {
//     const navigate = useNavigate();
//     const [isRegistering, setIsRegistering] = useState(false);

//     // Form states and submission logic for Proprietor / Admin
//     return (
//         <div className="min-h-screen bg-[#0B0F19] text-[#F8FAFC] flex flex-col justify-center items-center p-6">
//             <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
//                 <div className="flex items-center justify-between mb-6">
//                     <button onClick={() => navigate('/')} className="text-xs font-mono text-slate-400 hover:text-white">
//                         ← Back to Home
//                     </button>
//                     <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full font-bold">
//                         Proprietor & Organization Portal
//                     </span>
//                 </div>

//                 <h2 className="font-['Fraunces',serif] text-2xl font-medium text-white mb-2">
//                     {isRegistering ? 'Register Enterprise Organization' : 'Proprietor Secure Login'}
//                 </h2>
//                 <p className="text-xs text-slate-400 mb-6">
//                     {isRegistering
//                         ? 'Establish your multi-tenant agribusiness workspace and administrative credentials.'
//                         : 'Access macro-level financial telemetry, P&L ledgers, and multi-farm oversight.'}
//                 </p>

//                 {/* Your Form fields for Proprietor login / register go here */}

//                 <div className="mt-6 text-center">
//                     <button
//                         onClick={() => setIsRegistering(!isRegistering)}
//                         className="text-xs font-mono text-emerald-400 hover:underline cursor-pointer"
//                     >
//                         {isRegistering ? 'Already have an organization? Sign in instead' : 'Need to register a new farm organization? Register here'}
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };