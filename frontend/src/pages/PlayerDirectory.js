import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  ArrowLeft, Loader2, Search, User, Calendar, 
  MapPin, ChevronRight, CheckCircle, Filter
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'];
const GRAD_CLASSES = ['2030', '2029', '2028', '2027', '2026', '2025'];

export default function PlayerDirectory() {
  const { getAuthHeaders } = useAuth();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    grad_class: '',
    position: '',
    gender: '',
    verified: ''
  });

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('page_size', 20);
      if (filters.search) params.append('search', filters.search);
      if (filters.grad_class) params.append('grad_class', filters.grad_class);
      if (filters.position) params.append('position', filters.position);
      if (filters.gender) params.append('gender', filters.gender);
      if (filters.verified !== '') params.append('verified', filters.verified);

      const response = await axios.get(`${API_URL}/api/admin/players?${params}`, {
        headers: getAuthHeaders()
      });
      setPlayers(response.data.players);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Error fetching players:', error);
      toast.error('Failed to load players');
    } finally {
      setLoading(false);
    }
  }, [page, filters, getAuthHeaders]);

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
      verified: ''
    });
    setPage(1);
  };

  const toggleVerified = async (playerId) => {
    try {
      const response = await axios.patch(
        `${API_URL}/api/admin/players/${playerId}/verify`,
        {},
        { headers: getAuthHeaders() }
      );
      
      setPlayers(prev => 
        prev.map(p => p.id === playerId ? { ...p, verified: response.data.verified } : p)
      );
      
      toast.success('Player verification updated');
    } catch (error) {
      console.error('Error updating verification:', error);
      toast.error('Failed to update verification');
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#121212]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="ghost" size="icon" data-testid="back-to-dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-heading text-2xl font-bold uppercase text-white">Player Directory</h1>
              <p className="text-white/50 text-sm">{total} total players</p>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="border-b border-white/10 bg-[#121212]/50">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <Input
                data-testid="search-input"
                placeholder="Search players..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="input-dark pl-10"
              />
            </div>
            
            <Select value={filters.grad_class} onValueChange={(v) => handleFilterChange('grad_class', v)}>
              <SelectTrigger data-testid="filter-grad-class" className="w-[120px] input-dark">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                {GRAD_CLASSES.map(gc => (
                  <SelectItem key={gc} value={gc}>{gc}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.position} onValueChange={(v) => handleFilterChange('position', v)}>
              <SelectTrigger data-testid="filter-position" className="w-[120px] input-dark">
                <SelectValue placeholder="Position" />
              </SelectTrigger>
              <SelectContent>
                {POSITIONS.map(pos => (
                  <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.gender} onValueChange={(v) => handleFilterChange('gender', v)}>
              <SelectTrigger data-testid="filter-gender" className="w-[120px] input-dark">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="male">Male</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.verified} onValueChange={(v) => handleFilterChange('verified', v)}>
              <SelectTrigger data-testid="filter-verified" className="w-[120px] input-dark">
                <SelectValue placeholder="Verified" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Verified</SelectItem>
                <SelectItem value="false">Not Verified</SelectItem>
              </SelectContent>
            </Select>

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
      </div>

      {/* Player List */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#fb6c1d] animate-spin" />
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-20">
            <User className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50">No players found</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {players.map(player => (
                <div
                  key={player.id}
                  data-testid={`player-row-${player.id}`}
                  className="bg-[#121212] border border-white/10 rounded-xl p-4 lg:p-6 card-hover"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0134bd] to-[#fb6c1d] flex items-center justify-center flex-shrink-0">
                        <span className="font-heading font-bold text-white text-lg">
                          {player.player_name?.[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading font-bold text-white uppercase">
                            {player.player_name}
                          </h3>
                          {player.verified && (
                            <CheckCircle className="w-4 h-4 text-[#fb6c1d]" />
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-white/50 mt-1">
                          {player.primary_position && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {player.primary_position}
                              {player.secondary_position && `/${player.secondary_position}`}
                            </span>
                          )}
                          {player.grad_class && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Class of {player.grad_class}
                            </span>
                          )}
                          {player.school && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {player.school}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleVerified(player.id)}
                        data-testid={`verify-btn-${player.id}`}
                        className={player.verified ? 'text-[#fb6c1d]' : 'text-white/50'}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {player.verified ? 'Verified' : 'Verify'}
                      </Button>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        player.gender === 'female' 
                          ? 'bg-pink-500/10 text-pink-400' 
                          : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {player.gender}
                      </span>
                      {player.height && (
                        <span className="text-white/40 text-sm">{player.height}</span>
                      )}
                    </div>
                  </div>
                </div>
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
      </main>
    </div>
  );
}
