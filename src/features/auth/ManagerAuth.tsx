// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import type { AuthResponseDto } from '../../types/auth';

// interface ManagerAuthProps {
//     onAuthSuccess: (data: AuthResponseDto) => void;
// }

// export const ManagerAuth: React.FC<ManagerAuthProps> = ({ onAuthSuccess }) => {
//     const navigate = useNavigate();

//     return (
//         <div className="min-h-screen bg-[#0B0F19] text-[#F8FAFC] flex flex-col justify-center items-center p-6">
//             <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
//                 <div className="flex items-center justify-between mb-6">
//                     <button onClick={() => navigate('/')} className="text-xs font-mono text-slate-400 hover:text-white">
//                         ← Back to Home
//                     </button>
//                     <span className="text-xs font-mono bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full font-bold">
//                         Site Manager Access
//                     </span>
//                 </div>

//                 <h2 className="font-['Fraunces',serif] text-2xl font-medium text-white mb-2">
//                     Site Manager Portal
//                 </h2>
//                 <p className="text-xs text-slate-400 mb-6">
//                     Sign in with your assigned operational credentials to access your designated farm warehouse and daily telemetry logs.
//                 </p>

//                 {/* Login-only form fields for Manager */}
//                 <div className="space-y-4">
//                     <div>
//                         <label className="block text-xs font-mono uppercase text-slate-400 mb-2">Manager Email or ID</label>
//                         <input type="text" placeholder="manager.ibadan@greenvalley.com" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500" />
//                     </div>
//                     <div>
//                         <label className="block text-xs font-mono uppercase text-slate-400 mb-2">Password</label>
//                         <input type="password" placeholder="••••••••" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500" />
//                     </div>
//                     <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition cursor-pointer mt-2">
//                         Sign In as Manager
//                     </button>
//                 </div>

//                 <div className="mt-6 text-center">
//                     <p className="text-[11px] font-mono text-slate-500">
//                         Note: Organisation registration is restricted to Proprietor accounts.
//                     </p>
//                 </div>
//             </div>
//         </div>
//     );
// };