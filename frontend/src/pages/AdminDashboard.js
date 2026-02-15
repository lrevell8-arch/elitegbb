import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import Navigation from '../components/Navigation';
import { 
  Users, ClipboardList, LayoutGrid, Settings, LogOut, 
  TrendingUp, Clock, Package, ChevronRight, Loader2,
  Download, FileSpreadsheet, Home, GraduationCap, User
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout, getAuthHeaders } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/stats`, {
        headers: getAuthHeaders()
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const handleExport = async (exportType, format) => {
    setExporting(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/export`,
        { export_type: exportType, format },
        { headers: getAuthHeaders() }
      );
      
      if (format === 'csv' && response.data.csv_content) {
        // Download CSV
        const blob = new Blob([response.data.csv_content], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hwh_${exportType}_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success(`Exported ${response.data.count} ${exportType}`);
      } else {
        // Download JSON
        const blob = new Blob([JSON.stringify(response.data.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hwh_${exportType}_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success(`Exported ${response.data.count} ${exportType}`);
      }
      
      setShowExportModal(false);
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const StatusCard = ({ status, count, color }) => (
    <div className={`bg-[#121212] border border-white/10 rounded-xl p-4 card-hover`}>
      <div className={`text-xs font-bold uppercase tracking-wider ${color} mb-2`}>
        {status.replace('_', ' ')}
      </div>
      <div className="text-3xl font-heading font-bold text-white">{count}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      {/* Navigation */}
      <Navigation 
        variant="admin" 
        user={user} 
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">

        <div className="p-6 lg:p-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-heading text-4xl font-bold uppercase text-white tracking-tight">Dashboard</h1>
            <p className="text-white/50 mt-1">Welcome back, {user?.name || 'Admin'}</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#fb6c1d] animate-spin" />
            </div>
          ) : (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-[#121212] border border-white/10 rounded-xl p-6 card-hover">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[#0134bd]/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-[#0134bd]" />
                    </div>
                    <span className="text-white/50 text-sm">Total Players</span>
                  </div>
                  <div className="text-4xl font-heading font-bold text-white">{stats?.total_players || 0}</div>
                </div>

                <div className="bg-[#121212] border border-white/10 rounded-xl p-6 card-hover">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[#fb6c1d]/20 flex items-center justify-center">
                      <ClipboardList className="w-5 h-5 text-[#fb6c1d]" />
                    </div>
                    <span className="text-white/50 text-sm">Active Projects</span>
                  </div>
                  <div className="text-4xl font-heading font-bold text-white">{stats?.total_projects || 0}</div>
                </div>

                <div className="bg-[#121212] border border-white/10 rounded-xl p-6 card-hover">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <span className="text-white/50 text-sm">This Week</span>
                  </div>
                  <div className="text-4xl font-heading font-bold text-white">{stats?.recent_submissions || 0}</div>
                </div>

                <div className="bg-[#121212] border border-white/10 rounded-xl p-6 card-hover">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Package className="w-5 h-5 text-purple-500" />
                    </div>
                    <span className="text-white/50 text-sm">Delivered</span>
                  </div>
                  <div className="text-4xl font-heading font-bold text-white">
                    {stats?.projects_by_status?.delivered || 0}
                  </div>
                </div>
              </div>

              {/* Pipeline Status */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading text-xl font-bold uppercase text-white">Pipeline Status</h2>
                  <Link to="/admin/pipeline">
                    <Button variant="ghost" className="text-[#fb6c1d] hover:text-[#fb6c1d]/80">
                      View All <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <StatusCard 
                    status="Requested" 
                    count={stats?.projects_by_status?.requested || 0} 
                    color="text-blue-400" 
                  />
                  <StatusCard 
                    status="In Review" 
                    count={stats?.projects_by_status?.in_review || 0} 
                    color="text-yellow-400" 
                  />
                  <StatusCard 
                    status="Drafting" 
                    count={stats?.projects_by_status?.drafting || 0} 
                    color="text-purple-400" 
                  />
                  <StatusCard 
                    status="Design" 
                    count={stats?.projects_by_status?.design || 0} 
                    color="text-pink-400" 
                  />
                  <StatusCard 
                    status="Delivered" 
                    count={stats?.projects_by_status?.delivered || 0} 
                    color="text-green-400" 
                  />
                </div>
              </div>

              {/* Packages Breakdown */}
              <div className="mb-8">
                <h2 className="font-heading text-xl font-bold uppercase text-white mb-4">Packages</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#121212] border border-white/10 rounded-xl p-6 card-hover">
                    <div className="text-sm text-white/50 uppercase tracking-wider mb-2">Starter</div>
                    <div className="text-3xl font-heading font-bold text-white">
                      {stats?.packages_breakdown?.starter || 0}
                    </div>
                    <div className="text-[#fb6c1d] text-sm mt-1">$99</div>
                  </div>
                  <div className="bg-[#121212] border border-white/10 rounded-xl p-6 card-hover">
                    <div className="text-sm text-white/50 uppercase tracking-wider mb-2">Development</div>
                    <div className="text-3xl font-heading font-bold text-white">
                      {stats?.packages_breakdown?.development || 0}
                    </div>
                    <div className="text-[#fb6c1d] text-sm mt-1">$199</div>
                  </div>
                  <div className="bg-[#121212] border border-white/10 rounded-xl p-6 card-hover">
                    <div className="text-sm text-white/50 uppercase tracking-wider mb-2">Elite Track</div>
                    <div className="text-3xl font-heading font-bold text-white">
                      {stats?.packages_breakdown?.elite_track || 0}
                    </div>
                    <div className="text-[#fb6c1d] text-sm mt-1">$399</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h2 className="font-heading text-xl font-bold uppercase text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link to="/admin/pipeline" className="block">
                    <div className="bg-[#0134bd]/10 border border-[#0134bd]/20 rounded-xl p-6 hover:bg-[#0134bd]/20 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-[#0134bd] flex items-center justify-center">
                          <ClipboardList className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="font-heading font-bold text-white uppercase">View Pipeline</div>
                          <div className="text-white/50 text-sm">Manage project workflow</div>
                        </div>
                      </div>
                    </div>
                  </Link>
                  <Link to="/admin/players" className="block">
                    <div className="bg-[#fb6c1d]/10 border border-[#fb6c1d]/20 rounded-xl p-6 hover:bg-[#fb6c1d]/20 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-[#fb6c1d] flex items-center justify-center">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="font-heading font-bold text-white uppercase">Player Directory</div>
                          <div className="text-white/50 text-sm">Search and filter players</div>
                        </div>
                      </div>
                    </div>
                  </Link>
                  <button onClick={() => setShowExportModal(true)} className="block w-full text-left">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 hover:bg-green-500/20 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
                          <Download className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="font-heading font-bold text-white uppercase">Export Data</div>
                          <div className="text-white/50 text-sm">Download players & projects</div>
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Export Modal */}
              {showExportModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-md">
                    <div className="p-6 border-b border-white/10">
                      <h2 className="font-heading text-xl font-bold uppercase text-white flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-green-500" />
                        Export Data
                      </h2>
                      <p className="text-white/50 text-sm mt-1">
                        Download your data as CSV or JSON
                      </p>
                    </div>
                    
                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="text-white font-medium mb-3">Export Players</h3>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleExport('players', 'csv')}
                            disabled={exporting}
                            className="flex-1 bg-white/10 hover:bg-white/20"
                          >
                            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'CSV'}
                          </Button>
                          <Button
                            onClick={() => handleExport('players', 'json')}
                            disabled={exporting}
                            className="flex-1 bg-white/10 hover:bg-white/20"
                          >
                            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'JSON'}
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-white font-medium mb-3">Export Projects</h3>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleExport('projects', 'csv')}
                            disabled={exporting}
                            className="flex-1 bg-white/10 hover:bg-white/20"
                          >
                            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'CSV'}
                          </Button>
                          <Button
                            onClick={() => handleExport('projects', 'json')}
                            disabled={exporting}
                            className="flex-1 bg-white/10 hover:bg-white/20"
                          >
                            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'JSON'}
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-white font-medium mb-3">Export Submissions</h3>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleExport('submissions', 'csv')}
                            disabled={exporting}
                            className="flex-1 bg-white/10 hover:bg-white/20"
                          >
                            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'CSV'}
                          </Button>
                          <Button
                            onClick={() => handleExport('submissions', 'json')}
                            disabled={exporting}
                            className="flex-1 bg-white/10 hover:bg-white/20"
                          >
                            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'JSON'}
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 border-t border-white/10">
                      <Button
                        variant="ghost"
                        onClick={() => setShowExportModal(false)}
                        className="w-full"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
