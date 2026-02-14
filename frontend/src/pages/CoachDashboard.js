import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCoachAuth } from '../context/CoachAuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { 
  LogOut, Search, Filter, User, Calendar, MapPin, 
  ChevronRight, Bookmark, BookmarkCheck, Loader2,
  GraduationCap, BarChart3, Video, Crown, MessageSquare
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'];
const GRAD_CLASSES = ['2030', '2029', '2028', '2027', '2026', '2025'];

export default function CoachDashboard() {
  const navigate = useNavigate();
  const { coach, logout, getAuthHeaders } = useCoachAuth();
  const [prospects, setProspects] = useState([]);
  const [savedPlayers, setSavedPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('browse');
  const [filters, setFilters] = useState({
    search: '',
    grad_class: '',
    position: '',
    gender: '',
    state: '',
    min_ppg: ''
  });

  useEffect(() => {
    if (activeTab === 'browse') {
      fetchProspects();
    } else {
      fetchSavedPlayers();
    }
  }, [activeTab, fetchProspects, fetchSavedPlayers]);

  const fetchProspects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('page_size', 12);
      if (filters.search) params.append('search', filters.search);
      if (filters.grad_class) params.append('grad_class', filters.grad_class);
      if (filters.position) params.append('position', filters.position);
      if (filters.gender) params.append('gender', filters.gender);
      if (filters.state) params.append('state', filters.state);
      if (filters.min_ppg) params.append('min_ppg', filters.min_ppg);

      const response = await axios.get(`${API_URL}/api/coach/prospects?${params}`, {
        headers: getAuthHeaders()
      });
      setProspects(response.data.prospects);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Error fetching prospects:', error);
      if (error.response?.status === 403) {
        toast.error('Your account is pending verification');
      } else {
        toast.error('Failed to load prospects');
      }
    } finally {
      setLoading(false);
    }
  }, [page, filters, getAuthHeaders]);

  const fetchSavedPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/coach/saved-players`, {
        headers: getAuthHeaders()
      });
      setSavedPlayers(response.data.saved_players);
    } catch (error) {
      console.error('Error fetching saved players:', error);
      toast.error('Failed to load saved players');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const handleSavePlayer = async (playerId) => {
    try {
      await axios.post(
        `${API_URL}/api/coach/saved-players`,
        { player_id: playerId },
        { headers: getAuthHeaders() }
      );
      toast.success('Player saved to your list');
      // Refresh saved players if on that tab
      if (activeTab === 'saved') {
        fetchSavedPlayers();
      }
    } catch (error) {
      console.error('Error saving player:', error);
      toast.error('Failed to save player');
    }
  };

  const handleUnsavePlayer = async (playerId) => {
    try {
      await axios.delete(`${API_URL}/api/coach/saved-players/${playerId}`, {
        headers: getAuthHeaders()
      });
      toast.success('Player removed from your list');
      fetchSavedPlayers();
    } catch (error) {
      console.error('Error removing player:', error);
      toast.error('Failed to remove player');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      grad_class: '',
      position: '',
      gender: '',
      state: '',
      min_ppg: ''
    });
    setPage(1);
  };

  const handleLogout = () => {
    logout();
    navigate('/coach/login');
  };

  const ProspectCard = ({ prospect, isSaved = false, onSave, onUnsave }) => (
    <div className="bg-[#121212] border border-white/10 rounded-xl overflow-hidden card-hover">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-heading font-bold text-white uppercase text-lg">
              {prospect.player_name || prospect.player?.player_name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[#fb6c1d] font-medium">
                {prospect.primary_position || prospect.player?.primary_position}
                {(prospect.secondary_position || prospect.player?.secondary_position) && 
                  `/${prospect.secondary_position || prospect.player?.secondary_position}`}
              </span>
              <span className="text-white/40">•</span>
              <span className="text-white/60">Class of {prospect.grad_class || prospect.player?.grad_class}</span>
            </div>
          </div>
          <button
            onClick={() => isSaved ? onUnsave(prospect.id || prospect.player?.id) : onSave(prospect.id || prospect.player?.id)}
            className={`p-2 rounded-lg transition-colors ${
              isSaved ? 'bg-[#fb6c1d]/20 text-[#fb6c1d]' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
            }`}
            data-testid={`save-btn-${prospect.id || prospect.player?.id}`}
          >
            {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
          </button>
        </div>

        <div className="space-y-2 text-sm">
          {(prospect.school || prospect.player?.school) && (
            <div className="flex items-center gap-2 text-white/60">
              <GraduationCap className="w-4 h-4" />
              <span>{prospect.school || prospect.player?.school}</span>
            </div>
          )}
          {(prospect.city || prospect.player?.city || prospect.state || prospect.player?.state) && (
            <div className="flex items-center gap-2 text-white/60">
              <MapPin className="w-4 h-4" />
              <span>
                {prospect.city || prospect.player?.city}
                {(prospect.state || prospect.player?.state) && `, ${prospect.state || prospect.player?.state}`}
              </span>
            </div>
          )}
          {prospect.height || prospect.player?.height && (
            <div className="flex items-center gap-2 text-white/60">
              <User className="w-4 h-4" />
              <span>{prospect.height || prospect.player?.height}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        {prospect.stats && (prospect.stats.ppg || prospect.stats.apg || prospect.stats.rpg) && (
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
            {prospect.stats.ppg && (
              <div className="text-center">
                <div className="text-xl font-heading font-bold text-white">{prospect.stats.ppg}</div>
                <div className="text-xs text-white/40 uppercase">PPG</div>
              </div>
            )}
            {prospect.stats.apg && (
              <div className="text-center">
                <div className="text-xl font-heading font-bold text-white">{prospect.stats.apg}</div>
                <div className="text-xs text-white/40 uppercase">APG</div>
              </div>
            )}
            {prospect.stats.rpg && (
              <div className="text-center">
                <div className="text-xl font-heading font-bold text-white">{prospect.stats.rpg}</div>
                <div className="text-xs text-white/40 uppercase">RPG</div>
              </div>
            )}
            {prospect.has_film && (
              <div className="ml-auto">
                <Badge variant="outline" className="border-[#0134bd] text-[#0134bd]">
                  <Video className="w-3 h-3 mr-1" />
                  Film
                </Badge>
              </div>
            )}
          </div>
        )}

        <Link 
          to={`/coach/prospect/${prospect.id || prospect.player?.id}`}
          className="block mt-4"
        >
          <Button variant="ghost" className="w-full justify-between text-[#fb6c1d] hover:text-[#fb6c1d]/80 hover:bg-[#fb6c1d]/10">
            View Profile
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );

  const totalPages = Math.ceil(total / 12);

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#121212]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#0134bd] to-[#fb6c1d] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold uppercase text-white">Coach Portal</h1>
              <p className="text-white/50 text-sm">{coach?.school}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-white/60 text-sm hidden md:block">
              Welcome, {coach?.name}
            </span>
            <Link to="/coach/subscription">
              <Button variant="ghost" className="text-[#fb6c1d] hover:text-[#fb6c1d]/80">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade
              </Button>
            </Link>
            <Button
              variant="ghost"
              onClick={handleLogout}
              data-testid="coach-logout-btn"
              className="text-white/50 hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'browse' 
                ? 'bg-[#0134bd] text-white' 
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
            data-testid="tab-browse"
          >
            <Search className="w-4 h-4 inline mr-2" />
            Browse Prospects
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'saved' 
                ? 'bg-[#fb6c1d] text-white' 
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
            data-testid="tab-saved"
          >
            <Bookmark className="w-4 h-4 inline mr-2" />
            Saved Players ({savedPlayers.length})
          </button>
          <Link to="/coach/compare">
            <button className="px-6 py-3 rounded-lg font-medium transition-colors bg-white/5 text-white/60 hover:bg-white/10">
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Compare
            </button>
          </Link>
          <Link to="/coach/messages">
            <button className="px-6 py-3 rounded-lg font-medium transition-colors bg-white/5 text-white/60 hover:bg-white/10">
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Messages
            </button>
          </Link>
        </div>

        {activeTab === 'browse' && (
          <>
            {/* Filters */}
            <div className="bg-[#121212] border border-white/10 rounded-xl p-4 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    data-testid="coach-search-input"
                    placeholder="Search by name, school, city..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="input-dark pl-10"
                  />
                </div>
                
                <Select value={filters.grad_class} onValueChange={(v) => handleFilterChange('grad_class', v)}>
                  <SelectTrigger className="w-[120px] input-dark">
                    <SelectValue placeholder="Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRAD_CLASSES.map(gc => (
                      <SelectItem key={gc} value={gc}>{gc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.position} onValueChange={(v) => handleFilterChange('position', v)}>
                  <SelectTrigger className="w-[120px] input-dark">
                    <SelectValue placeholder="Position" />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map(pos => (
                      <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.gender} onValueChange={(v) => handleFilterChange('gender', v)}>
                  <SelectTrigger className="w-[120px] input-dark">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  data-testid="coach-state-filter"
                  placeholder="State"
                  value={filters.state}
                  onChange={(e) => handleFilterChange('state', e.target.value)}
                  className="w-[120px] input-dark"
                />

                <Input
                  data-testid="coach-ppg-filter"
                  type="number"
                  placeholder="Min PPG"
                  value={filters.min_ppg}
                  onChange={(e) => handleFilterChange('min_ppg', e.target.value)}
                  className="w-[100px] input-dark"
                />

                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="text-white/50 hover:text-white"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>

            {/* Results info */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-white/50">
                {total} verified prospect{total !== 1 ? 's' : ''} found
              </p>
            </div>
          </>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#fb6c1d] animate-spin" />
          </div>
        ) : activeTab === 'browse' ? (
          <>
            {prospects.length === 0 ? (
              <div className="text-center py-20">
                <User className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/50">No verified prospects found matching your criteria</p>
                <p className="text-white/30 text-sm mt-2">Try adjusting your filters</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {prospects.map(prospect => (
                    <ProspectCard 
                      key={prospect.id} 
                      prospect={prospect}
                      onSave={handleSavePlayer}
                      onUnsave={handleUnsavePlayer}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="btn-outline"
                    >
                      Previous
                    </Button>
                    <span className="text-white/50 text-sm px-4">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="btn-outline"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          // Saved players tab
          <>
            {savedPlayers.length === 0 ? (
              <div className="text-center py-20">
                <Bookmark className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/50">No saved players yet</p>
                <p className="text-white/30 text-sm mt-2">Browse prospects and save the ones you're interested in</p>
                <Button 
                  onClick={() => setActiveTab('browse')}
                  className="btn-primary mt-4"
                >
                  Browse Prospects
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedPlayers.map(sp => (
                  <ProspectCard 
                    key={sp.player?.id} 
                    prospect={sp}
                    isSaved={true}
                    onSave={handleSavePlayer}
                    onUnsave={handleUnsavePlayer}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
