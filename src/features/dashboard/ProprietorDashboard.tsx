import React, { useState, useEffect } from 'react';
import { Building2, AlertTriangle, TrendingUp, Wallet, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { fetchEnterpriseMetrics, type ProprietorDashboardMetrics } from '../../services/enterpriseAggregator';
import { authService } from '../../services/authService'; // <-- We use your real auth service now!

const ProprietorDashboard = () => {
  // Grab the logged-in proprietor's data straight from local storage using your service
  const authData = authService.getCurrentAuth(); 
  
  const [metrics, setMetrics] = useState<ProprietorDashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        // Extract the orgId using the exact interface from your AuthResponseDto
        const orgId = authData?.organisationId;
        if (!orgId) return;

        // Fetch the metrics (apiClient automatically handles the Bearer token)
        const data = await fetchEnterpriseMetrics(orgId);
        setMetrics(data);
      } catch (err) {
        console.error("Dashboard failed to load", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
    // We only need this to run once on mount, so the dependency array is empty
  }, []);

  if (loading || !metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#ECE6D6' }}>
        <p className="font-bold text-lg animate-pulse" style={{ color: '#101B14' }}>Crunching Enterprise Telemetry...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#ECE6D6', color: '#161F17' }}>
      
      {/* HEADER */}
      <div className="mb-8 flex justify-between items-end border-b-2 pb-4" style={{ borderColor: '#101B14' }}>
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: '#101B14' }}>Enterprise Overview</h1>
          <p className="text-sm font-bold uppercase tracking-widest mt-1" style={{ color: '#3F6B47' }}>
             Executive Suite
          </p>
        </div>
        <button className="px-4 py-2 rounded font-bold text-sm uppercase tracking-wide shadow-sm transition hover:opacity-90" 
                style={{ backgroundColor: '#101B14', color: '#D9A63E' }}>
          + Provision New Facility
        </button>
      </div>

      {/* KPI CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Live Biomass */}
        <div className="p-5 rounded-lg border shadow-sm" style={{ backgroundColor: '#F5F1E6', borderColor: 'rgba(16, 27, 20, 0.15)' }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase">Active Biomass</h3>
            <Activity size={20} style={{ color: '#3F6B47' }} />
          </div>
          <p className="text-3xl font-black">{metrics.totalBirds.toLocaleString()}</p>
          <p className="text-xs font-semibold mt-2 flex items-center text-red-600">
            <ArrowDownRight size={14} className="mr-1"/> {metrics.overallMortality}% Network Mortality
          </p>
        </div>

        {/* Warehouse Valuation */}
        <div className="p-5 rounded-lg border shadow-sm" style={{ backgroundColor: '#F5F1E6', borderColor: 'rgba(16, 27, 20, 0.15)' }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase">Warehouse Assets</h3>
            <Building2 size={20} style={{ color: '#D9A63E' }} />
          </div>
          <p className="text-3xl font-black">₦{(metrics.warehouseValuation / 1000000).toFixed(2)}M</p>
          <p className="text-xs font-semibold mt-2 flex items-center text-green-700">
            <ArrowUpRight size={14} className="mr-1"/> Feed & Medical Stock
          </p>
        </div>

        {/* Cashflow Margin */}
        <div className="p-5 rounded-lg border shadow-sm" style={{ backgroundColor: '#F5F1E6', borderColor: 'rgba(16, 27, 20, 0.15)' }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase">Net Margin (YTD)</h3>
            <Wallet size={20} style={{ color: '#3F6B47' }} />
          </div>
          <p className="text-3xl font-black">₦{((metrics.ytdRevenue - metrics.ytdExpense) / 1000000).toFixed(2)}M</p>
        </div>

        {/* System Alerts */}
        <div className="p-5 rounded-lg border shadow-sm" style={{ backgroundColor: '#F5F1E6', borderColor: 'rgba(16, 27, 20, 0.15)' }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase">Network Risk</h3>
            <AlertTriangle size={20} className={metrics.activeAlerts > 0 ? "text-red-600" : "text-green-600"} />
          </div>
          <p className="text-3xl font-black">{metrics.activeAlerts}</p>
          <p className="text-xs font-semibold mt-2 text-red-600">Unresolved Alerts</p>
        </div>
      </div>

      {/* BOTTOM SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* FACILITY NETWORK TABLE (Takes 2 Columns) */}
        <div className="lg:col-span-2 p-6 rounded-lg border shadow-sm" style={{ backgroundColor: '#F5F1E6', borderColor: 'rgba(16, 27, 20, 0.15)' }}>
          <h2 className="text-lg font-black mb-4 flex items-center" style={{ color: '#101B14' }}>
            <Building2 className="mr-2" size={20}/> Facility Network Directory
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2" style={{ borderColor: 'rgba(16,27,20,0.1)' }}>
                  <th className="pb-3 text-xs font-bold uppercase tracking-wider text-gray-500">Facility Name</th>
                  <th className="pb-3 text-xs font-bold uppercase tracking-wider text-gray-500">Assigned Manager</th>
                  <th className="pb-3 text-xs font-bold uppercase tracking-wider text-center text-gray-500">Active Batches</th>
                  <th className="pb-3 text-xs font-bold uppercase tracking-wider text-right text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {metrics.facilities.map((farm) => (
                  <tr key={farm.id} className="border-b last:border-0 hover:bg-white transition-colors" style={{ borderColor: 'rgba(16,27,20,0.05)' }}>
                    <td className="py-4 font-bold" style={{ color: '#101B14' }}>{farm.name}</td>
                    <td className="py-4 text-sm font-medium text-gray-600">{farm.manager}</td>
                    <td className="py-4 text-center font-bold">{farm.activeBatches}</td>
                    <td className="py-4 text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${
                        farm.status === 'OPTIMAL' ? 'bg-green-100 text-green-800' :
                        farm.status === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-gray-200 text-gray-800'
                      }`}>
                        {farm.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {metrics.facilities.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-sm font-bold text-gray-500">
                      No facilities provisioned yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* QUICK ACTIONS SIDEBAR (Takes 1 Column) */}
        <div className="p-6 rounded-lg border shadow-sm flex flex-col" style={{ backgroundColor: '#F5F1E6', borderColor: 'rgba(16, 27, 20, 0.15)' }}>
           <h2 className="text-lg font-black mb-4 flex items-center" style={{ color: '#101B14' }}>
            <TrendingUp className="mr-2" size={20}/> Executive Actions
          </h2>
          
          <div className="flex flex-col space-y-3 mt-2 flex-grow">
            <button className="w-full text-left px-4 py-3 rounded border font-bold text-sm transition hover:bg-white" style={{ borderColor: 'rgba(16,27,20,0.1)', color: '#101B14' }}>
              👥 Provision Facility Manager
            </button>
            <button className="w-full text-left px-4 py-3 rounded border font-bold text-sm transition hover:bg-white" style={{ borderColor: 'rgba(16,27,20,0.1)', color: '#101B14' }}>
              📥 Download Aggregate Ledger (CSV)
            </button>
            <button className="w-full text-left px-4 py-3 rounded border font-bold text-sm transition hover:bg-white" style={{ borderColor: 'rgba(16,27,20,0.1)', color: '#101B14' }}>
              📦 Global Inventory Transfer
            </button>
          </div>

          <div className="mt-6 p-4 rounded bg-opacity-50" style={{ backgroundColor: '#ECE6D6', borderLeft: '4px solid #3F6B47' }}>
             <p className="text-xs font-semibold text-gray-600 leading-relaxed">
               <strong>Note:</strong> Facility Managers cannot see cross-network financial data. Your macro-ledger remains securely scoped to the Proprietor token.
             </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProprietorDashboard;