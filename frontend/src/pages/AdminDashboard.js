import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import Navigation from '../components/Navigation';
import { 
  Users, ClipboardList, LayoutGrid, Settings, LogOut, 
  TrendingUp, Clock, Package, ChevronRight, Loader2,
  Download, FileSpreadsheet, Home, GraduationCap, User,
  Upload, FileUp, X, CheckCircle, AlertCircle
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout, getAuthHeaders } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Bulk Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importType, setImportType] = useState('players'); // 'players' or 'coaches'
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

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

  // Bulk Import Handlers
  const handleImport = async () => {
    if (!importFile) {
      toast.error('Please select a file to import');
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const response = await axios.post(
        `${API_URL}/api/admin/import/${importType}`,
        formData,
        {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setImportResult(response.data);
      toast.success(`Import complete: ${response.data.created} ${importType} created`);
      
      // Refresh stats if players were imported
      if (importType === 'players' && response.data.created > 0) {
        fetchStats();
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error.response?.data?.detail || 'Import failed');
      setImportResult({
        error: error.response?.data?.detail || 'Import failed'
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = async (type, format = 'csv') => {
    try {
      const response = await axios.get(
        `${API_URL}/api/admin/import/${type}?format=${format}`,
        { headers: getAuthHeaders() }
      );

      if (format === 'csv' && response.data.template) {
        const blob = new Blob([response.data.template], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hwh_${type}_import_template.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Template downloaded');
      }
    } catch (error) {
      console.error('Template download error:', error);
      toast.error('Failed to download template');
    }
  };

  const resetImport = () => {
    setImportFile(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    resetImport();
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <button onClick={() => setShowImportModal(true)} className="block w-full text-left">
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6 hover:bg-purple-500/20 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center">
                          <Upload className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="font-heading font-bold text-white uppercase">Bulk Import</div>
                          <div className="text-white/50 text-sm">Import CSV/XLSX data</div>
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

              {/* Import Modal */}
              {showImportModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                      <div>
                        <h2 className="font-heading text-xl font-bold uppercase text-white flex items-center gap-2">
                          <Upload className="w-5 h-5 text-purple-500" />
                          Bulk Import
                        </h2>
                        <p className="text-white/50 text-sm mt-1">
                          Import players or coaches from CSV/XLSX files
                        </p>
                      </div>
                      <button onClick={closeImportModal} className="text-white/50 hover:text-white">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="p-6 space-y-6">
                      {/* Import Type Selection */}
                      <div>
                        <label className="text-white font-medium mb-3 block">Import Type</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => { setImportType('players'); resetImport(); }}
                            className={`p-4 rounded-xl border text-left transition-colors ${
                              importType === 'players'
                                ? 'bg-[#0134bd]/20 border-[#0134bd] text-white'
                                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                            }`}
                          >
                            <Users className="w-5 h-5 mb-2" />
                            <div className="font-medium">Players</div>
                            <div className="text-xs text-white/50 mt-1">Import player profiles</div>
                          </button>
                          <button
                            onClick={() => { setImportType('coaches'); resetImport(); }}
                            className={`p-4 rounded-xl border text-left transition-colors ${
                              importType === 'coaches'
                                ? 'bg-[#fb6c1d]/20 border-[#fb6c1d] text-white'
                                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                            }`}
                          >
                            <GraduationCap className="w-5 h-5 mb-2" />
                            <div className="font-medium">Coaches</div>
                            <div className="text-xs text-white/50 mt-1">Import coach accounts</div>
                          </button>
                        </div>
                      </div>

                      {/* Template Download */}
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-medium">Download Template</div>
                            <div className="text-white/50 text-sm">
                              Get the CSV template with required columns
                            </div>
                          </div>
                          <Button
                            onClick={() => downloadTemplate(importType, 'csv')}
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10"
                          >
                            <FileUp className="w-4 h-4 mr-2" />
                            CSV
                          </Button>
                        </div>
                        <div className="mt-3 text-xs text-white/40">
                          Required: {importType === 'players' 
                            ? 'player_name, grad_class, gender, school, city, state' 
                            : 'name, email, school, title, state'}
                        </div>
                      </div>

                      {/* File Upload */}
                      {!importResult ? (
                        <div>
                          <label className="text-white font-medium mb-3 block">Upload File</label>
                          <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-white/40 transition-colors">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".csv,.xlsx,.xls"
                              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                              className="hidden"
                            />
                            <Upload className="w-10 h-10 text-white/30 mx-auto mb-3" />
                            <p className="text-white/70 mb-2">
                              {importFile ? importFile.name : 'Drop your file here or click to browse'}
                            </p>
                            <p className="text-white/40 text-sm mb-4">Supports CSV, XLSX (max 5MB)</p>
                            <Button
                              onClick={() => fileInputRef.current?.click()}
                              variant="outline"
                              className="border-white/20 text-white hover:bg-white/10"
                            >
                              <FileUp className="w-4 h-4 mr-2" />
                              Select File
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* Import Results */
                        <div className="bg-white/5 rounded-xl p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            {importResult.error ? (
                              <AlertCircle className="w-5 h-5 text-red-500" />
                            ) : (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                            <span className="text-white font-medium">
                              {importResult.error ? 'Import Failed' : 'Import Complete'}
                            </span>
                          </div>
                          
                          {!importResult.error && (
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="bg-white/5 rounded-lg p-3">
                                <div className="text-white/50">Total Rows</div>
                                <div className="text-white font-bold text-lg">{importResult.total_rows || 0}</div>
                              </div>
                              <div className="bg-green-500/10 rounded-lg p-3">
                                <div className="text-green-400">Created</div>
                                <div className="text-green-500 font-bold text-lg">{importResult.created || 0}</div>
                              </div>
                              <div className="bg-yellow-500/10 rounded-lg p-3">
                                <div className="text-yellow-400">Skipped</div>
                                <div className="text-yellow-500 font-bold text-lg">{importResult.skipped || 0}</div>
                              </div>
                              <div className="bg-red-500/10 rounded-lg p-3">
                                <div className="text-red-400">Failed</div>
                                <div className="text-red-500 font-bold text-lg">{importResult.failed || 0}</div>
                              </div>
                            </div>
                          )}

                          {importResult.errors && importResult.errors.length > 0 && (
                            <div className="mt-3">
                              <div className="text-red-400 text-sm font-medium mb-2">Errors:</div>
                              <div className="max-h-32 overflow-y-auto space-y-1">
                                {importResult.errors.slice(0, 5).map((err, i) => (
                                  <div key={i} className="text-red-400/80 text-xs bg-red-500/10 rounded px-2 py-1">
                                    Row {err.row}: {err.error}
                                  </div>
                                ))}
                                {importResult.errors.length > 5 && (
                                  <div className="text-white/40 text-xs">
                                    ...and {importResult.errors.length - 5} more errors
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {importResult.created_records && importResult.created_records.length > 0 && (
                            <div className="mt-3">
                              <div className="text-green-400 text-sm font-medium mb-2">
                                Successfully Created ({importResult.created_records.length}):
                              </div>
                              <div className="max-h-32 overflow-y-auto space-y-1">
                                {importResult.created_records.slice(0, 5).map((record, i) => (
                                  <div key={i} className="text-green-400/80 text-xs bg-green-500/10 rounded px-2 py-1">
                                    {record.name || record.player_name} ({record.email || record.player_email})
                                  </div>
                                ))}
                                {importResult.created_records.length > 5 && (
                                  <div className="text-white/40 text-xs">
                                    ...and {importResult.created_records.length - 5} more
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="p-6 border-t border-white/10 flex gap-3">
                      {importResult ? (
                        <>
                          <Button
                            onClick={resetImport}
                            className="flex-1 bg-white/10 hover:bg-white/20 text-white"
                          >
                            Import Another File
                          </Button>
                          <Button
                            onClick={closeImportModal}
                            variant="ghost"
                            className="flex-1"
                          >
                            Close
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            onClick={handleImport}
                            disabled={!importFile || importing}
                            className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
                          >
                            {importing ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Importing...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Import {importType === 'players' ? 'Players' : 'Coaches'}
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={closeImportModal}
                            variant="ghost"
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </>
                      )}
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
