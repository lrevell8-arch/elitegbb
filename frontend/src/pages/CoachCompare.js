import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useCoachAuth } from '../context/CoachAuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { 
  ArrowLeft, Loader2, BarChart3, Plus, X, Search,
  Crown, Lock, Trophy, Target, TrendingUp
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function CoachCompare() {
  const { getAuthHeaders } = useCoachAuth();
  const [hasAccess, setHasAccess] = useState(null);
  const [prospects, setProspects] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    checkAccess();
    fetchProspects();
  }, [checkAccess, fetchProspects]);

  const checkAccess = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/coach/subscription/status`, {
        headers: getAuthHeaders()
      });
      setHasAccess(response.data.tier === 'elite');
    } catch (error) {
      setHasAccess(false);
    }
  }, [getAuthHeaders]);

  const fetchProspects = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/coach/prospects?page_size=50`, {
        headers: getAuthHeaders()
      });
      setProspects(response.data.prospects);
    } catch (error) {
      console.error('Error fetching prospects');
    }
  }, [getAuthHeaders]);

  const searchProspects = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    try {
      const response = await axios.get(`${API_URL}/api/coach/prospects?search=${query}&page_size=10`, {
        headers: getAuthHeaders()
      });
      setSearchResults(response.data.prospects.filter(p => !selectedIds.includes(p.id)));
    } catch (error) {
      console.error('Search error');
    } finally {
      setSearching(false);
    }
  }, [getAuthHeaders, selectedIds]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchProspects(searchQuery);
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchProspects, searchQuery, selectedIds]);

  const addPlayer = (player) => {
    if (selectedIds.length >= 5) {
      toast.error('Maximum 5 players for comparison');
      return;
    }
    setSelectedIds(prev => [...prev, player.id]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removePlayer = (playerId) => {
    setSelectedIds(prev => prev.filter(id => id !== playerId));
    setComparison(null);
  };

  const runComparison = async () => {
    if (selectedIds.length < 2) {
      toast.error('Select at least 2 players to compare');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/coach/compare`,
        { player_ids: selectedIds },
        { headers: getAuthHeaders() }
      );
      setComparison(response.data);
    } catch (error) {
      if (error.response?.status === 403) {
        setHasAccess(false);
      } else {
        toast.error('Comparison failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const getSelectedPlayers = () => {
    return selectedIds.map(id => prospects.find(p => p.id === id)).filter(Boolean);
  };

  if (hasAccess === false) {
    return (
      <div className="min-h-screen bg-[#0b0b0b]">
        <header className="sticky top-0 z-40 bg-[#121212]/80 backdrop-blur-md border-b border-white/10">
          <div className="max-w-6xl mx-auto px-4 lg:px-8 py-4 flex items-center gap-4">
            <Link to="/coach">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-heading text-2xl font-bold uppercase text-white">Compare Prospects</h1>
          </div>
        </header>
        
        <main className="max-w-6xl mx-auto px-4 lg:px-8 py-16">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-[#fb6c1d]/20 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-[#fb6c1d]" />
            </div>
            <h2 className="font-heading text-3xl font-bold uppercase text-white mb-4">
              Elite Feature
            </h2>
            <p className="text-white/60 max-w-md mx-auto mb-8">
              The prospect comparison tool is available exclusively for Elite subscribers.
              Compare stats, skills, and profiles side-by-side.
            </p>
            <Link to="/coach/subscription">
              <Button className="btn-secondary">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Elite
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#121212]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/coach">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-heading text-2xl font-bold uppercase text-white">Compare Prospects</h1>
              <p className="text-white/50 text-sm">Select 2-5 players to compare</p>
            </div>
          </div>
          
          <Button
            onClick={runComparison}
            disabled={selectedIds.length < 2 || loading}
            className="btn-secondary"
            data-testid="run-comparison-btn"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <BarChart3 className="w-4 h-4 mr-2" />
                Compare ({selectedIds.length})
              </>
            )}
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 lg:px-8 py-8">
        {/* Player Selection */}
        <div className="mb-8">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="compare-search-input"
              placeholder="Search prospects to add..."
              className="input-dark pl-10"
            />
            
            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#121212] border border-white/10 rounded-xl overflow-hidden z-10 max-h-60 overflow-y-auto">
                {searchResults.map(player => (
                  <button
                    key={player.id}
                    onClick={() => addPlayer(player)}
                    className="w-full p-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-white font-medium">{player.player_name}</span>
                        <span className="text-white/40 ml-2">
                          {player.primary_position} • Class of {player.grad_class}
                        </span>
                      </div>
                      <Plus className="w-4 h-4 text-[#fb6c1d]" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Players */}
          <div className="flex flex-wrap gap-2">
            {getSelectedPlayers().map(player => (
              <div
                key={player.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0134bd]/20 border border-[#0134bd]/30"
              >
                <span className="text-white text-sm">{player.player_name}</span>
                <button
                  onClick={() => removePlayer(player.id)}
                  className="text-white/50 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {selectedIds.length < 5 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-dashed border-white/20 text-white/40 text-sm">
                <Plus className="w-4 h-4" />
                Add player ({5 - selectedIds.length} remaining)
              </div>
            )}
          </div>
        </div>

        {/* Comparison Results */}
        {comparison && (
          <div className="space-y-6 animate-fade-in">
            {/* Insights */}
            {comparison.insights?.length > 0 && (
              <div className="bg-gradient-to-r from-[#0134bd]/20 to-[#fb6c1d]/20 border border-white/10 rounded-xl p-6">
                <h3 className="font-heading text-lg font-bold uppercase text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#fb6c1d]" />
                  Key Insights
                </h3>
                <ul className="space-y-2">
                  {comparison.insights.map((insight, i) => (
                    <li key={i} className="flex items-center gap-2 text-white/80">
                      <Target className="w-4 h-4 text-[#fb6c1d]" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Stats Comparison Table */}
            <div className="bg-[#121212] border border-white/10 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h3 className="font-heading text-lg font-bold uppercase text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#fb6c1d]" />
                  Stats Comparison
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="p-4 text-left text-white/60 font-medium">Stat</th>
                      {comparison.comparisons.map(c => (
                        <th key={c.player.id} className="p-4 text-center text-white font-medium">
                          <div className="font-heading uppercase">{c.player.player_name}</div>
                          <div className="text-xs text-white/40 mt-1">
                            {c.player.primary_position} • '{c.player.grad_class?.slice(-2)}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[
                      { key: 'games_played', label: 'Games' },
                      { key: 'ppg', label: 'PPG', highlight: true },
                      { key: 'apg', label: 'APG' },
                      { key: 'rpg', label: 'RPG' },
                      { key: 'spg', label: 'SPG' },
                      { key: 'bpg', label: 'BPG' },
                      { key: 'fg_pct', label: 'FG%', suffix: '%' },
                      { key: 'three_pct', label: '3PT%', suffix: '%' },
                      { key: 'ft_pct', label: 'FT%', suffix: '%' },
                    ].map(stat => {
                      const values = comparison.comparisons.map(c => c.stats[stat.key]).filter(v => v != null);
                      const maxValue = Math.max(...values);
                      
                      return (
                        <tr key={stat.key}>
                          <td className="p-4 text-white/60">{stat.label}</td>
                          {comparison.comparisons.map(c => {
                            const value = c.stats[stat.key];
                            const isMax = value === maxValue && value != null;
                            
                            return (
                              <td key={c.player.id} className="p-4 text-center">
                                <span className={`text-lg font-heading font-bold ${
                                  isMax ? 'text-[#fb6c1d]' : 'text-white'
                                }`}>
                                  {value != null ? `${value}${stat.suffix || ''}` : '—'}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Profile Comparison */}
            <div className="bg-[#121212] border border-white/10 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h3 className="font-heading text-lg font-bold uppercase text-white">
                  Player Profiles
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {comparison.comparisons.map(c => (
                  <div key={c.player.id} className="bg-white/5 rounded-xl p-4">
                    <h4 className="font-heading font-bold text-white uppercase mb-3">
                      {c.player.player_name}
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-white/40 uppercase mb-1">School</div>
                        <div className="text-white/80 text-sm">{c.player.school || '—'}</div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-white/40 uppercase mb-1">Height</div>
                        <div className="text-white/80 text-sm">{c.player.height || '—'}</div>
                      </div>
                      
                      {c.profile.self_words && (
                        <div>
                          <div className="text-xs text-white/40 uppercase mb-1">Self-Described</div>
                          <div className="text-white/80 text-sm">{c.profile.self_words}</div>
                        </div>
                      )}
                      
                      {c.profile.pride_tags?.length > 0 && (
                        <div>
                          <div className="text-xs text-white/40 uppercase mb-1">Strengths</div>
                          <div className="flex flex-wrap gap-1">
                            {c.profile.pride_tags.map(tag => (
                              <Badge key={tag} className="bg-[#fb6c1d]/20 text-[#fb6c1d] text-xs">
                                {tag.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!comparison && selectedIds.length === 0 && (
          <div className="text-center py-20">
            <BarChart3 className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h2 className="font-heading text-2xl font-bold uppercase text-white mb-2">
              Compare Prospects
            </h2>
            <p className="text-white/50 max-w-md mx-auto">
              Search and select 2-5 verified prospects to compare their stats, 
              skills, and profiles side-by-side.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
