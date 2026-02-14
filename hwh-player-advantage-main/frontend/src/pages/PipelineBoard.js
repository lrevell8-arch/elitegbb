import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { 
  ArrowLeft, Loader2, GripVertical, User, Calendar, 
  MapPin, ChevronRight
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const STATUSES = [
  { id: 'requested', label: 'Requested', color: 'border-blue-500', bg: 'bg-blue-500/10' },
  { id: 'in_review', label: 'In Review', color: 'border-yellow-500', bg: 'bg-yellow-500/10' },
  { id: 'drafting', label: 'Drafting', color: 'border-purple-500', bg: 'bg-purple-500/10' },
  { id: 'design', label: 'Design', color: 'border-pink-500', bg: 'bg-pink-500/10' },
  { id: 'delivered', label: 'Delivered', color: 'border-green-500', bg: 'bg-green-500/10' },
];

export default function PipelineBoard() {
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState(null);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/projects`, {
        headers: getAuthHeaders()
      });
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const updateProjectStatus = async (projectId, newStatus) => {
    try {
      await axios.patch(
        `${API_URL}/api/admin/projects/${projectId}`,
        { status: newStatus },
        { headers: getAuthHeaders() }
      );
      
      setProjects(prev => 
        prev.map(p => p.id === projectId ? { ...p, status: newStatus } : p)
      );
      
      toast.success('Project status updated');
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDragStart = (e, project) => {
    setDraggedItem(project);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    if (draggedItem && draggedItem.status !== targetStatus) {
      updateProjectStatus(draggedItem.id, targetStatus);
    }
    setDraggedItem(null);
  };

  const getProjectsByStatus = (status) => {
    return projects.filter(p => p.status === status);
  };

  const ProjectCard = ({ project }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, project)}
      onClick={() => navigate(`/admin/projects/${project.id}`)}
      data-testid={`project-card-${project.id}`}
      className="bg-[#0b0b0b] border border-white/10 rounded-lg p-4 cursor-pointer hover:border-white/20 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-white/30 group-hover:text-white/50 cursor-grab" />
          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
            project.package_type === 'elite_track' ? 'bg-[#fb6c1d]/20 text-[#fb6c1d]' :
            project.package_type === 'development' ? 'bg-[#0134bd]/20 text-[#0134bd]' :
            'bg-white/10 text-white/70'
          }`}>
            {project.package_type?.replace('_', ' ')}
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/50" />
      </div>
      
      {project.player && (
        <>
          <div className="font-heading font-bold text-white uppercase mb-2 line-clamp-1">
            {project.player.player_name}
          </div>
          <div className="flex items-center gap-4 text-xs text-white/50">
            {project.player.primary_position && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {project.player.primary_position}
              </span>
            )}
            {project.player.grad_class && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                '{project.player.grad_class?.slice(-2)}
              </span>
            )}
          </div>
          {project.player.school && (
            <div className="flex items-center gap-1 text-xs text-white/40 mt-2">
              <MapPin className="w-3 h-3" />
              {project.player.school}
            </div>
          )}
        </>
      )}
      
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
        <span className={`text-xs ${
          project.payment_status === 'paid' ? 'text-green-400' : 'text-yellow-400'
        }`}>
          {project.payment_status === 'paid' ? 'Paid' : 'Pending Payment'}
        </span>
        <span className="text-xs text-white/30">
          {new Date(project.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#121212]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-full mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="ghost" size="icon" data-testid="back-to-dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-heading text-2xl font-bold uppercase text-white">Pipeline</h1>
              <p className="text-white/50 text-sm">{projects.length} total projects</p>
            </div>
          </div>
        </div>
      </header>

      {/* Kanban Board */}
      <main className="p-4 lg:p-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#fb6c1d] animate-spin" />
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STATUSES.map(status => (
              <div
                key={status.id}
                data-testid={`column-${status.id}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status.id)}
                className={`flex-shrink-0 w-80 kanban-column ${status.bg}`}
              >
                <div className={`p-4 border-b-2 ${status.color}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold uppercase text-white text-sm">
                      {status.label}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/70 text-xs font-medium">
                      {getProjectsByStatus(status.id).length}
                    </span>
                  </div>
                </div>
                <div className="p-4 space-y-3 min-h-[300px]">
                  {getProjectsByStatus(status.id).map(project => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                  {getProjectsByStatus(status.id).length === 0 && (
                    <div className="text-center py-8 text-white/30 text-sm">
                      No projects
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
