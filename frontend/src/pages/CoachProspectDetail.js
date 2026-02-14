import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useCoachAuth } from '../context/CoachAuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  ArrowLeft, Loader2, User, Calendar, MapPin, 
  Bookmark, BookmarkCheck, ExternalLink, Video,
  GraduationCap, Trophy, Target, Brain
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function CoachProspectDetail() {
  const { playerId } = useParams();
  const { getAuthHeaders } = useCoachAuth();
  const [prospect, setProspect] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    fetchProspect();
  }, [fetchProspect]);

  const fetchProspect = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/coach/prospects/${playerId}`, {
        headers: getAuthHeaders()
      });
      setProspect(response.data);
      setIsSaved(response.data.is_saved);
    } catch (error) {
      console.error('Error fetching prospect:', error);
      toast.error('Failed to load prospect details');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, playerId]);

  const handleSaveToggle = async () => {
    try {
      if (isSaved) {
        await axios.delete(`${API_URL}/api/coach/saved-players/${playerId}`, {
          headers: getAuthHeaders()
        });
        toast.success('Player removed from your list');
      } else {
        await axios.post(
          `${API_URL}/api/coach/saved-players`,
          { player_id: playerId },
          { headers: getAuthHeaders() }
        );
        toast.success('Player saved to your list');
      }
      setIsSaved(!isSaved);
    } catch (error) {
      console.error('Error toggling save:', error);
      toast.error('Failed to update saved status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#fb6c1d] animate-spin" />
      </div>
    );
  }

  if (!prospect) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/50">Prospect not found</p>
          <Link to="/coach" className="text-[#fb6c1d] hover:underline mt-4 inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { player, intake } = prospect;

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#121212]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/coach">
              <Button variant="ghost" size="icon" data-testid="back-to-coach-dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-heading text-2xl font-bold uppercase text-white">
                {player?.player_name}
              </h1>
              <div className="flex items-center gap-3 text-sm text-white/50">
                <span>{player?.primary_position}{player?.secondary_position && `/${player.secondary_position}`}</span>
                <span>•</span>
                <span>Class of {player?.grad_class}</span>
              </div>
            </div>
          </div>
          
          <Button
            onClick={handleSaveToggle}
            data-testid="save-prospect-btn"
            className={isSaved ? 'btn-secondary' : 'btn-outline'}
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="w-4 h-4 mr-2" />
                Saved
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4 mr-2" />
                Save Player
              </>
            )}
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <div className="bg-[#121212] border border-white/10 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-white/10 bg-gradient-to-r from-[#0134bd]/20 to-transparent">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0134bd] to-[#fb6c1d] flex items-center justify-center">
                    <span className="font-heading font-black text-white text-3xl">
                      {player?.player_name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="font-heading text-3xl font-bold uppercase text-white">
                      {player?.player_name}
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-[#fb6c1d]/20 text-[#fb6c1d] border-[#fb6c1d]/30">
                        {player?.primary_position}
                      </Badge>
                      {player?.secondary_position && (
                        <Badge variant="outline" className="text-white/60">
                          {player.secondary_position}
                        </Badge>
                      )}
                      <Badge className="bg-[#0134bd]/20 text-[#0134bd] border-[#0134bd]/30">
                        Class of {player?.grad_class}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-6">
                {player?.height && (
                  <div>
                    <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Height</div>
                    <div className="text-white font-medium">{player.height}</div>
                  </div>
                )}
                {player?.school && (
                  <div>
                    <div className="text-xs text-white/40 uppercase tracking-wider mb-1">School</div>
                    <div className="text-white font-medium">{player.school}</div>
                  </div>
                )}
                {(player?.city || player?.state) && (
                  <div>
                    <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Location</div>
                    <div className="text-white font-medium">
                      {player.city}{player.state && `, ${player.state}`}
                    </div>
                  </div>
                )}
                {player?.gender && (
                  <div>
                    <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Gender</div>
                    <div className="text-white font-medium capitalize">{player.gender}</div>
                  </div>
                )}
                {intake?.level && (
                  <div>
                    <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Level</div>
                    <div className="text-white font-medium capitalize">{intake.level.replace('_', ' ')}</div>
                  </div>
                )}
                {intake?.team_names && (
                  <div className="col-span-2">
                    <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Teams</div>
                    <div className="text-white font-medium">{intake.team_names}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            {intake && (intake.ppg || intake.apg || intake.rpg) && (
              <div className="bg-[#121212] border border-white/10 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-white/10">
                  <h3 className="font-heading text-xl font-bold uppercase text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[#fb6c1d]" />
                    Stats Snapshot
                  </h3>
                </div>
                <div className="p-6 grid grid-cols-3 md:grid-cols-5 gap-6 text-center">
                  {intake.games_played && (
                    <div>
                      <div className="text-3xl font-heading font-bold text-[#fb6c1d]">{intake.games_played}</div>
                      <div className="text-xs text-white/40 uppercase">Games</div>
                    </div>
                  )}
                  {intake.ppg && (
                    <div>
                      <div className="text-3xl font-heading font-bold text-white">{intake.ppg}</div>
                      <div className="text-xs text-white/40 uppercase">PPG</div>
                    </div>
                  )}
                  {intake.apg && (
                    <div>
                      <div className="text-3xl font-heading font-bold text-white">{intake.apg}</div>
                      <div className="text-xs text-white/40 uppercase">APG</div>
                    </div>
                  )}
                  {intake.rpg && (
                    <div>
                      <div className="text-3xl font-heading font-bold text-white">{intake.rpg}</div>
                      <div className="text-xs text-white/40 uppercase">RPG</div>
                    </div>
                  )}
                  {intake.spg && (
                    <div>
                      <div className="text-3xl font-heading font-bold text-white">{intake.spg}</div>
                      <div className="text-xs text-white/40 uppercase">SPG</div>
                    </div>
                  )}
                </div>
                {(intake.fg_pct || intake.three_pct || intake.ft_pct) && (
                  <div className="px-6 pb-6 grid grid-cols-3 gap-6 text-center border-t border-white/10 pt-6">
                    {intake.fg_pct && (
                      <div>
                        <div className="text-xl font-heading font-bold text-white">{intake.fg_pct}%</div>
                        <div className="text-xs text-white/40 uppercase">FG%</div>
                      </div>
                    )}
                    {intake.three_pct && (
                      <div>
                        <div className="text-xl font-heading font-bold text-white">{intake.three_pct}%</div>
                        <div className="text-xs text-white/40 uppercase">3PT%</div>
                      </div>
                    )}
                    {intake.ft_pct && (
                      <div>
                        <div className="text-xl font-heading font-bold text-white">{intake.ft_pct}%</div>
                        <div className="text-xs text-white/40 uppercase">FT%</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Self Evaluation */}
            {intake && (intake.strength || intake.self_words) && (
              <div className="bg-[#121212] border border-white/10 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-white/10">
                  <h3 className="font-heading text-xl font-bold uppercase text-white flex items-center gap-2">
                    <Brain className="w-5 h-5 text-[#0134bd]" />
                    Player Profile
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  {intake.self_words && (
                    <div>
                      <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Self-Described</div>
                      <div className="text-white text-lg font-medium">{intake.self_words}</div>
                    </div>
                  )}
                  {intake.strength && (
                    <div>
                      <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Greatest Strength</div>
                      <div className="text-white/80">{intake.strength}</div>
                    </div>
                  )}
                  {intake.separation && (
                    <div>
                      <div className="text-xs text-white/40 uppercase tracking-wider mb-2">What Sets Them Apart</div>
                      <div className="text-white/80">{intake.separation}</div>
                    </div>
                  )}
                  {intake.pride_tags && intake.pride_tags.length > 0 && (
                    <div>
                      <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Strengths</div>
                      <div className="flex flex-wrap gap-2">
                        {intake.pride_tags.map(tag => (
                          <Badge key={tag} className="bg-[#fb6c1d]/20 text-[#fb6c1d] border-[#fb6c1d]/30">
                            {tag.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {intake.player_model && (
                    <div>
                      <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Player Model</div>
                      <div className="text-white/80">{intake.player_model}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Film Links */}
            {intake && (intake.film_links?.length > 0 || intake.highlight_links?.length > 0) && (
              <div className="bg-[#121212] border border-white/10 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-white/10">
                  <h3 className="font-heading font-bold uppercase text-white flex items-center gap-2">
                    <Video className="w-4 h-4 text-[#fb6c1d]" />
                    Film
                  </h3>
                </div>
                <div className="p-4 space-y-2">
                  {intake.film_links?.map((link, i) => (
                    <a
                      key={i}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm"
                    >
                      <ExternalLink className="w-4 h-4 text-[#0134bd]" />
                      <span className="text-white/80 truncate flex-1">Game Film {i + 1}</span>
                    </a>
                  ))}
                  {intake.highlight_links?.map((link, i) => (
                    <a
                      key={i}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm"
                    >
                      <ExternalLink className="w-4 h-4 text-[#fb6c1d]" />
                      <span className="text-white/80 truncate flex-1">Highlights {i + 1}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Goals */}
            {intake?.goal && (
              <div className="bg-[#121212] border border-white/10 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-white/10">
                  <h3 className="font-heading font-bold uppercase text-white flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#0134bd]" />
                    Goals
                  </h3>
                </div>
                <div className="p-4">
                  <Badge className="bg-[#0134bd]/20 text-[#0134bd] border-[#0134bd]/30">
                    {intake.goal.replace('_', ' ')}
                  </Badge>
                  {intake.colleges_interest && (
                    <div className="mt-4">
                      <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Interested Schools</div>
                      <div className="text-white/60 text-sm">{intake.colleges_interest}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Social */}
            {intake?.instagram_handle && (
              <div className="bg-[#121212] border border-white/10 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-white/10">
                  <h3 className="font-heading font-bold uppercase text-white">Social</h3>
                </div>
                <div className="p-4">
                  <a
                    href={`https://instagram.com/${intake.instagram_handle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#fb6c1d] hover:underline"
                  >
                    {intake.instagram_handle}
                  </a>
                </div>
              </div>
            )}

            {/* Contact CTA */}
            <div className="bg-gradient-to-br from-[#0134bd]/20 to-[#fb6c1d]/20 border border-white/10 rounded-xl p-6 text-center">
              <GraduationCap className="w-10 h-10 text-[#fb6c1d] mx-auto mb-3" />
              <h3 className="font-heading font-bold uppercase text-white mb-2">Interested?</h3>
              <p className="text-white/60 text-sm mb-4">
                Contact Hoop With Her for a coach-to-coach referral.
              </p>
              <a href="mailto:coaches@hoopwithher.com">
                <Button className="btn-secondary w-full">
                  Contact HWH
                </Button>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
