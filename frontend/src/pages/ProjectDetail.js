import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { 
  ArrowLeft, Loader2, User, Calendar, MapPin, Check, 
  FileText, Download, Clock, Mail, ExternalLink, Copy,
  CheckCircle, Circle, Pencil
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const STATUSES = [
  { id: 'requested', label: 'Requested' },
  { id: 'in_review', label: 'In Review' },
  { id: 'drafting', label: 'Drafting' },
  { id: 'design', label: 'Design' },
  { id: 'delivered', label: 'Delivered' },
];

const DELIVERABLE_TYPES = {
  one_pager: 'Recruiting One-Pager',
  tracking_profile: 'Class Tracking Profile',
  referral_note: 'Coach-to-Coach Referral',
  film_index: 'Film Index',
  mid_season_update: 'Mid-Season Update',
  end_season_update: 'End-Season Update',
  verified_badge: 'Verified Prospect Badge'
};

const DELIVERABLE_STATUSES = ['pending', 'in_progress', 'complete'];

export default function ProjectDetail() {
  const { projectId } = useParams();
  const { getAuthHeaders, user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [generatingDeliverable, setGeneratingDeliverable] = useState(null);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const fetchProject = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/projects/${projectId}`, {
        headers: getAuthHeaders()
      });
      setProject(response.data);
      setNotes(response.data.notes || '');
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, projectId]);

  const updateStatus = async (newStatus) => {
    try {
      await axios.patch(
        `${API_URL}/api/admin/projects/${projectId}`,
        { status: newStatus },
        { headers: getAuthHeaders() }
      );
      setProject(prev => ({ ...prev, status: newStatus }));
      toast.success('Status updated');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const saveNotes = async () => {
    try {
      await axios.patch(
        `${API_URL}/api/admin/projects/${projectId}`,
        { notes },
        { headers: getAuthHeaders() }
      );
      setProject(prev => ({ ...prev, notes }));
      setEditingNotes(false);
      toast.success('Notes saved');
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes');
    }
  };

  const updateDeliverableStatus = async (deliverableId, newStatus) => {
    try {
      await axios.patch(
        `${API_URL}/api/admin/deliverables/${deliverableId}`,
        { status: newStatus },
        { headers: getAuthHeaders() }
      );
      setProject(prev => ({
        ...prev,
        deliverables: prev.deliverables.map(d => 
          d.id === deliverableId ? { ...d, status: newStatus } : d
        )
      }));
      toast.success('Deliverable updated');
    } catch (error) {
      console.error('Error updating deliverable:', error);
      toast.error('Failed to update deliverable');
    }
  };

  const generateDeliverable = async (deliverableType) => {
    setGeneratingDeliverable(deliverableType);
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/projects/${projectId}/generate/${deliverableType}`,
        {},
        { headers: getAuthHeaders() }
      );
      
      // Update the deliverable in state
      setProject(prev => ({
        ...prev,
        deliverables: prev.deliverables.map(d => 
          d.deliverable_type === deliverableType 
            ? { ...d, status: 'complete', file_url: response.data.file_url }
            : d
        )
      }));
      
      toast.success(`${DELIVERABLE_TYPES[deliverableType]} generated (mock)`);
    } catch (error) {
      console.error('Error generating deliverable:', error);
      toast.error('Failed to generate deliverable');
    } finally {
      setGeneratingDeliverable(null);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#fb6c1d] animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <p className="text-white/50">Project not found</p>
      </div>
    );
  }

  const { player, intake_submission, deliverables, reminders } = project;

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#121212]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin/pipeline">
              <Button variant="ghost" size="icon" data-testid="back-to-pipeline">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-heading text-2xl font-bold uppercase text-white">
                {player?.player_name}
              </h1>
              <div className="flex items-center gap-3 text-sm text-white/50">
                {player?.primary_position && <span>{player.primary_position}</span>}
                {player?.grad_class && <span>Class of {player.grad_class}</span>}
                {player?.school && <span>{player.school}</span>}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              project.payment_status === 'paid' 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {project.payment_status === 'paid' ? 'Paid' : 'Payment Pending'}
            </span>
            <Select value={project.status} onValueChange={updateStatus}>
              <SelectTrigger 
                data-testid="status-select"
                className={`w-[150px] badge-${project.status} border-2`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Player Info Card */}
            <div className="bg-[#121212] border border-white/10 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h2 className="font-heading text-xl font-bold uppercase text-white">Player Information</h2>
              </div>
              <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Full Name</div>
                  <div className="text-white">{player?.player_name}</div>
                </div>
                {player?.preferred_name && (
                  <div>
                    <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Nickname</div>
                    <div className="text-white">{player.preferred_name}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Class</div>
                  <div className="text-white">{player?.grad_class}</div>
                </div>
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Position</div>
                  <div className="text-white">
                    {player?.primary_position}
                    {player?.secondary_position && ` / ${player.secondary_position}`}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Height</div>
                  <div className="text-white">{player?.height || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Gender</div>
                  <div className="text-white capitalize">{player?.gender}</div>
                </div>
                {player?.school && (
                  <div>
                    <div className="text-xs text-white/40 uppercase tracking-wider mb-1">School</div>
                    <div className="text-white">{player.school}</div>
                  </div>
                )}
                {player?.city && (
                  <div>
                    <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Location</div>
                    <div className="text-white">{player.city}{player.state && `, ${player.state}`}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Info */}
            {intake_submission && (
              <div className="bg-[#121212] border border-white/10 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-white/10">
                  <h2 className="font-heading text-xl font-bold uppercase text-white">Contact Information</h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Parent/Guardian</div>
                    <div className="text-white">{intake_submission.parent_name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Email</div>
                    <div className="flex items-center gap-2">
                      <span className="text-white">{intake_submission.parent_email}</span>
                      <button
                        onClick={() => copyToClipboard(intake_submission.parent_email)}
                        className="text-white/30 hover:text-white"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {intake_submission.parent_phone && (
                    <div>
                      <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Phone</div>
                      <div className="text-white">{intake_submission.parent_phone}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stats */}
            {intake_submission && (intake_submission.ppg || intake_submission.games_played) && (
              <div className="bg-[#121212] border border-white/10 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-white/10">
                  <h2 className="font-heading text-xl font-bold uppercase text-white">Stats Snapshot</h2>
                </div>
                <div className="p-6 grid grid-cols-3 md:grid-cols-5 gap-6">
                  {intake_submission.games_played && (
                    <div className="text-center">
                      <div className="text-2xl font-heading font-bold text-[#fb6c1d]">{intake_submission.games_played}</div>
                      <div className="text-xs text-white/40 uppercase">Games</div>
                    </div>
                  )}
                  {intake_submission.ppg && (
                    <div className="text-center">
                      <div className="text-2xl font-heading font-bold text-white">{intake_submission.ppg}</div>
                      <div className="text-xs text-white/40 uppercase">PPG</div>
                    </div>
                  )}
                  {intake_submission.apg && (
                    <div className="text-center">
                      <div className="text-2xl font-heading font-bold text-white">{intake_submission.apg}</div>
                      <div className="text-xs text-white/40 uppercase">APG</div>
                    </div>
                  )}
                  {intake_submission.rpg && (
                    <div className="text-center">
                      <div className="text-2xl font-heading font-bold text-white">{intake_submission.rpg}</div>
                      <div className="text-xs text-white/40 uppercase">RPG</div>
                    </div>
                  )}
                  {intake_submission.spg && (
                    <div className="text-center">
                      <div className="text-2xl font-heading font-bold text-white">{intake_submission.spg}</div>
                      <div className="text-xs text-white/40 uppercase">SPG</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Self Evaluation */}
            {intake_submission && intake_submission.strength && (
              <div className="bg-[#121212] border border-white/10 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-white/10">
                  <h2 className="font-heading text-xl font-bold uppercase text-white">Self Evaluation</h2>
                </div>
                <div className="p-6 space-y-6">
                  {intake_submission.self_words && (
                    <div>
                      <div className="text-xs text-white/40 uppercase tracking-wider mb-2">3 Words</div>
                      <div className="text-white">{intake_submission.self_words}</div>
                    </div>
                  )}
                  {intake_submission.strength && (
                    <div>
                      <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Greatest Strength</div>
                      <div className="text-white/80">{intake_submission.strength}</div>
                    </div>
                  )}
                  {intake_submission.improvement && (
                    <div>
                      <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Area for Improvement</div>
                      <div className="text-white/80">{intake_submission.improvement}</div>
                    </div>
                  )}
                  {intake_submission.separation && (
                    <div>
                      <div className="text-xs text-white/40 uppercase tracking-wider mb-2">What Separates You</div>
                      <div className="text-white/80">{intake_submission.separation}</div>
                    </div>
                  )}
                  {intake_submission.pride_tags && intake_submission.pride_tags.length > 0 && (
                    <div>
                      <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Pride Tags</div>
                      <div className="flex flex-wrap gap-2">
                        {intake_submission.pride_tags.map(tag => (
                          <span key={tag} className="px-3 py-1 rounded-full bg-[#fb6c1d]/20 text-[#fb6c1d] text-sm">
                            {tag.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Film Links */}
            {intake_submission && (intake_submission.film_links?.length > 0 || intake_submission.highlight_links?.length > 0) && (
              <div className="bg-[#121212] border border-white/10 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-white/10">
                  <h2 className="font-heading text-xl font-bold uppercase text-white">Film & Links</h2>
                </div>
                <div className="p-6 space-y-4">
                  {intake_submission.film_links?.map((link, i) => (
                    <a
                      key={i}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-[#0134bd]" />
                      <span className="text-white/80 truncate flex-1">{link}</span>
                    </a>
                  ))}
                  {intake_submission.highlight_links?.map((link, i) => (
                    <a
                      key={i}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-[#fb6c1d]" />
                      <span className="text-white/80 truncate flex-1">{link}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Package Info */}
            <div className="bg-[#121212] border border-white/10 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h3 className="font-heading font-bold uppercase text-white">Package</h3>
              </div>
              <div className="p-4">
                <div className={`p-4 rounded-lg ${
                  project.package_type === 'elite_track' ? 'bg-[#fb6c1d]/10 border border-[#fb6c1d]/20' :
                  project.package_type === 'development' ? 'bg-[#0134bd]/10 border border-[#0134bd]/20' :
                  'bg-white/5 border border-white/10'
                }`}>
                  <div className="font-heading font-bold uppercase text-white">
                    {project.package_type?.replace('_', ' ')}
                  </div>
                  {project.amount_paid && (
                    <div className="text-[#fb6c1d] font-medium">${project.amount_paid}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Deliverables Checklist */}
            <div className="bg-[#121212] border border-white/10 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h3 className="font-heading font-bold uppercase text-white">Deliverables</h3>
              </div>
              <div className="p-4 space-y-3">
                {deliverables.map(d => (
                  <div 
                    key={d.id}
                    data-testid={`deliverable-${d.deliverable_type}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                  >
                    <div className="flex items-center gap-3">
                      {d.status === 'complete' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : d.status === 'in_progress' ? (
                        <Clock className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-white/30" />
                      )}
                      <span className="text-white text-sm">
                        {DELIVERABLE_TYPES[d.deliverable_type] || d.deliverable_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {d.file_url && (
                        <a
                          href={d.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0134bd] hover:text-[#0134bd]/80"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                      {d.status !== 'complete' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => generateDeliverable(d.deliverable_type)}
                          disabled={generatingDeliverable === d.deliverable_type}
                          className="text-xs"
                        >
                          {generatingDeliverable === d.deliverable_type ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            'Generate'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Internal Notes */}
            <div className="bg-[#121212] border border-white/10 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-heading font-bold uppercase text-white">Notes</h3>
                <button
                  onClick={() => setEditingNotes(!editingNotes)}
                  className="text-white/50 hover:text-white"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4">
                {editingNotes ? (
                  <div className="space-y-3">
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="input-dark min-h-[150px]"
                      placeholder="Add internal notes..."
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveNotes} className="btn-primary">
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingNotes(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-white/60 text-sm whitespace-pre-wrap">
                    {project.notes || 'No notes yet. Click the pencil to add.'}
                  </p>
                )}
              </div>
            </div>

            {/* Reminders */}
            {reminders.length > 0 && (
              <div className="bg-[#121212] border border-white/10 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-white/10">
                  <h3 className="font-heading font-bold uppercase text-white">Reminders</h3>
                </div>
                <div className="p-4 space-y-3">
                  {reminders.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <div className="flex items-center gap-3">
                        <Clock className={`w-4 h-4 ${r.sent ? 'text-green-500' : 'text-yellow-500'}`} />
                        <span className="text-white text-sm">
                          {r.reminder_type?.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-white/40 text-xs">
                        {new Date(r.scheduled_date).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
