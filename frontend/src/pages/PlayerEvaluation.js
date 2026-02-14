import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Loader2, ArrowLeft, Printer, Mail, Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function PlayerEvaluation() {
  const { projectId } = useParams();
  const { getAuthHeaders } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/projects/${projectId}`, {
        headers: getAuthHeaders()
      });
      setProject(response.data);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
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
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center text-white">
        Project not found
      </div>
    );
  }

  const { player, intake_submission } = project;

  return (
    <div className="min-h-screen bg-neutral-900 print:bg-white">
      {/* Navigation Header - Hidden on Print */}
      <div className="sticky top-0 z-50 bg-[#121212] border-b border-white/10 p-4 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link to={`/admin/projects/${projectId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5 text-white" />
            </Button>
          </Link>
          <h1 className="text-white font-heading font-bold uppercase tracking-tight">
            Evaluation Packet: {player?.player_name}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handlePrint} className="bg-[#fb6c1d] hover:bg-[#fb6c1d]/90 text-white font-bold uppercase">
            <Printer className="w-4 h-4 mr-2" />
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Packet Container */}
      <div className="max-w-[8.5in] mx-auto my-8 bg-white shadow-2xl print:my-0 print:shadow-none">
        
        {/* PAGE 1: FRONT COVER */}
        <div className="relative h-[11in] w-full flex flex-col items-center justify-center overflow-hidden border-b border-gray-200 page-break-after-always">
          {/* Background Texture */}
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ 
              backgroundImage: 'url(https://images.unsplash.com/photo-1674917470371-4797a55dd303?crop=entropy&cs=srgb&fm=jpg&q=85)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          ></div>
          
          <div className="z-10 text-center px-12">
            <div className="mb-12">
              <img 
                src="https://placehold.co/400x160/ffffff/0134bd?text=HOOP+WITH+HER" 
                alt="Hoop With Her Logo" 
                className="mx-auto w-64"
              />
            </div>
            
            <h1 className="font-heading text-6xl font-black text-[#0134bd] uppercase tracking-tighter leading-none mb-4">
              🏀 Hoop With Her® <br />Player Scouting & <br />Development Packet
            </h1>
            
            <div className="h-2 w-32 bg-[#fb6c1d] mx-auto mb-8"></div>
            
            <p className="text-2xl font-medium text-gray-700 uppercase tracking-tight">
              Evaluating & Developing Middle School <br />Girls' Basketball Talent
            </p>
            
            <div className="mt-16">
              <div className="text-gray-400 uppercase tracking-widest text-sm mb-2">Prepared For</div>
              <div className="text-3xl font-bold text-gray-900 uppercase border-b-4 border-[#0134bd] inline-block px-8 py-2">
                {player?.player_name}
              </div>
              <div className="mt-4 text-xl text-gray-600">
                Class of {player?.grad_class} • {player?.school || 'Unattached'}
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-12 text-gray-400 font-mono text-xs">
            © {new Date().getFullYear()} HOOP WITH HER® PLAYER ADVANTAGE™
          </div>
        </div>

        {/* PAGE 2-3: FULL SCOUTING REPORT (Detailed) */}
        <div className="p-[0.5in] h-[11in] w-full flex flex-col border-b border-gray-200 page-break-after-always">
          <header className="flex justify-between items-end border-b-4 border-[#0134bd] pb-4 mb-8">
            <div>
              <h2 className="font-heading text-4xl font-black text-[#0134bd] uppercase">Full Scouting Report</h2>
              <p className="text-gray-500 font-bold uppercase tracking-widest">Player Analysis & Evaluation</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{player?.player_name}</div>
              <div className="text-gray-500">Class of {player?.grad_class}</div>
            </div>
          </header>

          <div className="grid grid-cols-2 gap-x-12 gap-y-8 flex-1">
            {/* Player Information */}
            <section>
              <h3 className="bg-[#0134bd] text-white px-3 py-1 font-heading text-xl font-bold uppercase mb-3">Player Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex border-b border-gray-100 py-1">
                  <span className="w-32 font-bold text-gray-500 uppercase text-xs">Name:</span>
                  <span className="text-gray-900 font-bold">{player?.player_name}</span>
                </div>
                <div className="flex border-b border-gray-100 py-1">
                  <span className="w-32 font-bold text-gray-500 uppercase text-xs">Grade/Age:</span>
                  <span className="text-gray-900">{player?.grad_class} / {player?.dob ? new Date().getFullYear() - new Date(player.dob).getFullYear() : 'N/A'}</span>
                </div>
                <div className="flex border-b border-gray-100 py-1">
                  <span className="w-32 font-bold text-gray-500 uppercase text-xs">Height/Weight:</span>
                  <span className="text-gray-900">{player?.height || 'N/A'} / {player?.weight || 'N/A'}</span>
                </div>
                <div className="flex border-b border-gray-100 py-1">
                  <span className="w-32 font-bold text-gray-500 uppercase text-xs">Position(s):</span>
                  <span className="text-gray-900">{player?.primary_position} {player?.secondary_position && `/ ${player.secondary_position}`}</span>
                </div>
                <div className="flex border-b border-gray-100 py-1">
                  <span className="w-32 font-bold text-gray-500 uppercase text-xs">Team/School:</span>
                  <span className="text-gray-900 font-bold">{player?.school}</span>
                </div>
                <div className="flex border-b border-gray-100 py-1">
                  <span className="w-32 font-bold text-gray-500 uppercase text-xs">Handedness:</span>
                  <span className="text-orange-500 font-bold italic">..................................</span>
                </div>
              </div>
            </section>

            {/* Physical Profile */}
            <section>
              <h3 className="bg-[#0134bd] text-white px-3 py-1 font-heading text-xl font-bold uppercase mb-3">Physical Profile</h3>
              <div className="space-y-4 text-sm mt-4">
                <div>
                  <div className="font-bold text-gray-500 uppercase text-xs mb-1">Athleticism:</div>
                  <div className="text-orange-500 border-b border-dotted border-orange-300 h-6"></div>
                </div>
                <div>
                  <div className="font-bold text-gray-500 uppercase text-xs mb-1">Strength/Frame:</div>
                  <div className="text-orange-500 border-b border-dotted border-orange-300 h-6"></div>
                </div>
                <div>
                  <div className="font-bold text-gray-500 uppercase text-xs mb-1">Endurance:</div>
                  <div className="text-orange-500 border-b border-dotted border-orange-300 h-6"></div>
                </div>
              </div>
            </section>

            {/* Skill Assessment - Offense */}
            <section>
              <h3 className="bg-[#0134bd] text-white px-3 py-1 font-heading text-xl font-bold uppercase mb-3">Skill Assessment – Offense</h3>
              <div className="space-y-4 text-sm mt-4">
                <div className="flex items-center gap-2">
                  <span className="w-24 font-bold text-gray-500 uppercase text-xs">Ball Handling:</span>
                  <span className="flex-1 border-b border-dotted border-orange-300 h-5"></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-24 font-bold text-gray-500 uppercase text-xs">Shooting:</span>
                  <span className="flex-1 border-b border-dotted border-orange-300 h-5"></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-24 font-bold text-gray-500 uppercase text-xs">Finishing:</span>
                  <span className="flex-1 border-b border-dotted border-orange-300 h-5"></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-24 font-bold text-gray-500 uppercase text-xs">Passing:</span>
                  <span className="flex-1 border-b border-dotted border-orange-300 h-5"></span>
                </div>
              </div>
            </section>

            {/* Skill Assessment - Defense */}
            <section>
              <h3 className="bg-[#0134bd] text-white px-3 py-1 font-heading text-xl font-bold uppercase mb-3">Skill Assessment – Defense</h3>
              <div className="space-y-4 text-sm mt-4">
                <div className="flex items-center gap-2">
                  <span className="w-24 font-bold text-gray-500 uppercase text-xs">On-Ball:</span>
                  <span className="flex-1 border-b border-dotted border-orange-300 h-5"></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-24 font-bold text-gray-500 uppercase text-xs">Help/Rotations:</span>
                  <span className="flex-1 border-b border-dotted border-orange-300 h-5"></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-24 font-bold text-gray-500 uppercase text-xs">Rebounding:</span>
                  <span className="flex-1 border-b border-dotted border-orange-300 h-5"></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-24 font-bold text-gray-500 uppercase text-xs">Hustle:</span>
                  <span className="flex-1 border-b border-dotted border-orange-300 h-5"></span>
                </div>
              </div>
            </section>
          </div>
          <footer className="mt-auto pt-8 flex justify-between text-[10px] text-gray-400 font-mono">
            <span>PLAYER SCOUTING & DEVELOPMENT PACKET</span>
            <span>PAGE 2</span>
          </footer>
        </div>

        {/* PAGE 3: FULL SCOUTING REPORT (Continued) */}
        <div className="p-[0.5in] h-[11in] w-full flex flex-col border-b border-gray-200 page-break-after-always">
          <div className="grid grid-cols-2 gap-x-12 gap-y-8 flex-1">
            {/* Basketball IQ */}
            <section>
              <h3 className="bg-[#0134bd] text-white px-3 py-1 font-heading text-xl font-bold uppercase mb-3">Basketball IQ</h3>
              <div className="space-y-4 text-sm mt-4">
                <div className="flex items-center gap-2">
                  <span className="w-32 font-bold text-gray-500 uppercase text-xs">Decision-Making:</span>
                  <span className="flex-1 border-b border-dotted border-orange-300 h-5"></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-32 font-bold text-gray-500 uppercase text-xs">Awareness:</span>
                  <span className="flex-1 border-b border-dotted border-orange-300 h-5"></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-32 font-bold text-gray-500 uppercase text-xs">Transition Play:</span>
                  <span className="flex-1 border-b border-dotted border-orange-300 h-5"></span>
                </div>
              </div>
            </section>

            {/* Statistical Snapshot */}
            <section>
              <h3 className="bg-[#0134bd] text-white px-3 py-1 font-heading text-xl font-bold uppercase mb-3">Statistical Snapshot</h3>
              <div className="grid grid-cols-4 gap-2 mt-4">
                <div className="border border-gray-200 p-2 text-center">
                  <div className="text-xs text-gray-400 uppercase">PTS</div>
                  <div className="font-bold text-lg">{intake_submission?.ppg || '-'}</div>
                </div>
                <div className="border border-gray-200 p-2 text-center">
                  <div className="text-xs text-gray-400 uppercase">REB</div>
                  <div className="font-bold text-lg">{intake_submission?.rpg || '-'}</div>
                </div>
                <div className="border border-gray-200 p-2 text-center">
                  <div className="text-xs text-gray-400 uppercase">AST</div>
                  <div className="font-bold text-lg">{intake_submission?.apg || '-'}</div>
                </div>
                <div className="border border-gray-200 p-2 text-center">
                  <div className="text-xs text-gray-400 uppercase">STL</div>
                  <div className="font-bold text-lg">{intake_submission?.spg || '-'}</div>
                </div>
                <div className="border border-gray-200 p-2 text-center">
                  <div className="text-xs text-gray-400 uppercase">FG%</div>
                  <div className="font-bold text-lg">{intake_submission?.fg_pct ? intake_submission.fg_pct + '%' : '-'}</div>
                </div>
                <div className="border border-gray-200 p-2 text-center">
                  <div className="text-xs text-gray-400 uppercase">3PT%</div>
                  <div className="font-bold text-lg">{intake_submission?.three_pct ? intake_submission.three_pct + '%' : '-'}</div>
                </div>
                <div className="border border-gray-200 p-2 text-center">
                  <div className="text-xs text-gray-400 uppercase">FT%</div>
                  <div className="font-bold text-lg">{intake_submission?.ft_pct ? intake_submission.ft_pct + '%' : '-'}</div>
                </div>
                <div className="border border-gray-200 p-2 text-center">
                  <div className="text-xs text-gray-400 uppercase">BLK</div>
                  <div className="font-bold text-lg">{intake_submission?.bpg || '-'}</div>
                </div>
              </div>
            </section>

            {/* Intangibles */}
            <section className="col-span-2">
              <h3 className="bg-[#0134bd] text-white px-3 py-1 font-heading text-xl font-bold uppercase mb-3">Intangibles</h3>
              <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm mt-4">
                <div className="flex items-center gap-2">
                  <span className="w-32 font-bold text-gray-500 uppercase text-xs">Leadership:</span>
                  <span className="flex-1 border-b border-dotted border-orange-300 h-5"></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-32 font-bold text-gray-500 uppercase text-xs">Coachability:</span>
                  <span className="flex-1 border-b border-dotted border-orange-300 h-5"></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-32 font-bold text-gray-500 uppercase text-xs">Competitiveness:</span>
                  <span className="flex-1 border-b border-dotted border-orange-300 h-5"></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-32 font-bold text-gray-500 uppercase text-xs">Team Play:</span>
                  <span className="flex-1 border-b border-dotted border-orange-300 h-5"></span>
                </div>
              </div>
            </section>

            {/* Strengths & Development */}
            <section className="col-span-2 grid grid-cols-2 gap-x-12">
              <div>
                <h3 className="bg-[#0134bd] text-white px-3 py-1 font-heading text-xl font-bold uppercase mb-3">Strengths</h3>
                <div className="min-h-[150px] p-3 bg-gray-50 border border-gray-200 text-sm text-gray-700 italic">
                  {intake_submission?.strength || 'No additional notes provided.'}
                </div>
              </div>
              <div>
                <h3 className="bg-[#0134bd] text-white px-3 py-1 font-heading text-xl font-bold uppercase mb-3">Development Areas</h3>
                <div className="min-h-[150px] p-3 bg-gray-50 border border-gray-200 text-sm text-gray-700 italic">
                  {intake_submission?.improvement || 'No additional notes provided.'}
                </div>
              </div>
            </section>

            {/* Projection */}
            <section className="col-span-2">
              <h3 className="bg-[#0134bd] text-white px-3 py-1 font-heading text-xl font-bold uppercase mb-3">Projection</h3>
              <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm mt-4">
                <div>
                  <div className="font-bold text-gray-500 uppercase text-xs mb-1">Short-Term Role:</div>
                  <div className="border-b border-dotted border-orange-300 h-8"></div>
                </div>
                <div>
                  <div className="font-bold text-gray-500 uppercase text-xs mb-1">Long-Term Potential:</div>
                  <div className="border-b border-dotted border-orange-300 h-8"></div>
                </div>
              </div>
            </section>
          </div>
          <footer className="mt-auto pt-8 flex justify-between text-[10px] text-gray-400 font-mono">
            <span>PLAYER SCOUTING & DEVELOPMENT PACKET</span>
            <span>PAGE 3</span>
          </footer>
        </div>

        {/* PAGE 4: QUICK SCOUT SHEET */}
        <div className="p-[0.5in] h-[11in] w-full flex flex-col border-b border-gray-200 page-break-after-always">
          <header className="bg-[#fb6c1d] text-white p-4 mb-6 flex justify-between items-center">
            <h2 className="font-heading text-3xl font-black uppercase">Quick Scout Sheet</h2>
            <div className="text-sm font-bold uppercase tracking-widest">Courtside Reference</div>
          </header>

          <div className="grid grid-cols-2 gap-x-8 gap-y-6 flex-1">
            {/* Player Info (Compact) */}
            <div className="bg-gray-100 p-4 rounded-lg flex gap-4">
              <div className="w-20 h-20 bg-gray-300 flex items-center justify-center font-heading text-2xl font-black text-gray-500">
                PHOTO
              </div>
              <div className="flex-1 space-y-1">
                <div className="font-black text-xl leading-none uppercase">{player?.player_name}</div>
                <div className="text-xs font-bold text-[#0134bd] uppercase">Class of {player?.grad_class} • {player?.primary_position}</div>
                <div className="text-[10px] text-gray-500 uppercase">{player?.school} • {player?.height}</div>
              </div>
            </div>

            {/* Physical/Athletic */}
            <div className="border border-gray-200 p-4">
              <h4 className="font-bold text-xs uppercase text-gray-400 mb-2">Physical / Athletic</h4>
              <div className="border-b border-dotted border-gray-300 h-6"></div>
              <div className="border-b border-dotted border-gray-300 h-6 mt-2"></div>
            </div>

            {/* Skills Checkboxes */}
            <div className="col-span-2 grid grid-cols-4 gap-4">
              {['Ball Handling', 'Shooting', 'Defense', 'Rebounding'].map(skill => (
                <div key={skill} className="flex items-center gap-3 border border-gray-200 p-3">
                  <div className="w-6 h-6 border-2 border-[#fb6c1d] rounded"></div>
                  <span className="font-bold text-xs uppercase text-gray-700">{skill}</span>
                </div>
              ))}
            </div>

            {/* Key Skills Analysis */}
            <div className="col-span-2">
               <h4 className="font-bold text-xs uppercase text-gray-400 mb-2">Key Skills Notes</h4>
               <div className="border-b border-dotted border-gray-300 h-6"></div>
               <div className="border-b border-dotted border-gray-300 h-6 mt-2"></div>
            </div>

            {/* Stats (Compact) */}
            <div className="col-span-2 grid grid-cols-8 gap-1">
              {['PTS', 'REB', 'AST', 'STL', 'BLK', 'FG%', '3P%', 'FT%'].map(stat => (
                <div key={stat} className="border border-gray-200 p-1 text-center">
                  <div className="text-[8px] text-gray-400 uppercase font-bold">{stat}</div>
                  <div className="font-black text-xs">___</div>
                </div>
              ))}
            </div>

            {/* Strengths & Development (Orange Boxes) */}
            <div className="bg-[#fb6c1d]/10 border-2 border-[#fb6c1d] p-4">
              <h4 className="font-black text-sm uppercase text-[#fb6c1d] mb-2">Key Strengths</h4>
              <div className="h-24"></div>
            </div>
            <div className="bg-[#fb6c1d]/10 border-2 border-[#fb6c1d] p-4">
              <h4 className="font-black text-sm uppercase text-[#fb6c1d] mb-2">Development Needs</h4>
              <div className="h-24"></div>
            </div>

            {/* Intangibles & Projection */}
            <div className="border border-gray-200 p-4">
              <h4 className="font-bold text-xs uppercase text-gray-400 mb-2">Intangibles</h4>
              <div className="border-b border-dotted border-gray-300 h-6"></div>
              <div className="border-b border-dotted border-gray-300 h-6 mt-2"></div>
            </div>
            <div className="border border-gray-200 p-4">
              <h4 className="font-bold text-xs uppercase text-gray-400 mb-2">Projection</h4>
              <div className="border-b border-dotted border-gray-300 h-6"></div>
              <div className="border-b border-dotted border-gray-300 h-6 mt-2"></div>
            </div>
          </div>
          <footer className="mt-auto pt-8 flex justify-between text-[10px] text-gray-400 font-mono">
            <span>PLAYER SCOUTING & DEVELOPMENT PACKET</span>
            <span>PAGE 4</span>
          </footer>
        </div>

        {/* PAGE 5: COACH'S NOTES */}
        <div className="p-[0.5in] h-[11in] w-full flex flex-col border-b border-gray-200 page-break-after-always relative">
          <header className="border-b-4 border-[#0134bd] pb-4 mb-8">
            <h2 className="font-heading text-4xl font-black text-[#0134bd] uppercase">Coach's Notes</h2>
          </header>
          
          <div className="flex-1 w-full bg-lined-page flex flex-col pt-2">
            {Array.from({ length: 28 }).map((_, i) => (
              <div key={i} className="h-8 border-b border-gray-200 w-full"></div>
            ))}
          </div>

          {/* Watermark */}
          <div className="absolute bottom-12 right-12 opacity-10 pointer-events-none">
             <img 
                src="https://placehold.co/200x80/ffffff/0134bd?text=HOOP+WITH+HER" 
                alt="Watermark" 
                className="w-48 grayscale"
              />
          </div>

          <footer className="mt-auto pt-8 flex justify-between text-[10px] text-gray-400 font-mono">
            <span>PLAYER SCOUTING & DEVELOPMENT PACKET</span>
            <span>PAGE 5</span>
          </footer>
        </div>

        {/* PAGE 6: DEVELOPMENT FRAMEWORK REFERENCE */}
        <div className="p-[0.5in] h-[11in] w-full flex flex-col border-b border-gray-200 page-break-after-always">
          <header className="border-b-4 border-[#0134bd] pb-4 mb-8">
            <h2 className="font-heading text-4xl font-black text-[#0134bd] uppercase">Development Framework</h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Skills Assessment Guide for Coaches</p>
          </header>

          <div className="grid grid-cols-2 gap-6 flex-1">
            <div className="bg-[#fb6c1d]/5 border border-[#fb6c1d]/20 p-4 rounded-xl">
              <h4 className="font-heading text-xl font-bold text-[#0134bd] uppercase mb-2">Ball Handling</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Evaluates ability to handle pressure, use both hands effectively, change of pace, and maintain control in transition. Look for "eyes up" and functional dribble moves.
              </p>
            </div>
            <div className="bg-[#fb6c1d]/5 border border-[#fb6c1d]/20 p-4 rounded-xl">
              <h4 className="font-heading text-xl font-bold text-[#0134bd] uppercase mb-2">Shooting</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Assessment of form, range, consistency, and ability to shoot off the catch vs. off the dribble. Evaluate shot selection and confidence from different zones.
              </p>
            </div>
            <div className="bg-[#fb6c1d]/5 border border-[#fb6c1d]/20 p-4 rounded-xl">
              <h4 className="font-heading text-xl font-bold text-[#0134bd] uppercase mb-2">Defense</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                On-ball containment, defensive stance, lateral quickness, and help-side awareness. Note communication, rotations, and ability to guard multiple positions.
              </p>
            </div>
            <div className="bg-[#fb6c1d]/5 border border-[#fb6c1d]/20 p-4 rounded-xl">
              <h4 className="font-heading text-xl font-bold text-[#0134bd] uppercase mb-2">Finishing</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Ability to finish at the rim with either hand, use of glass, touch on floaters, and performance through contact. Evaluate creativity in the paint.
              </p>
            </div>
            <div className="bg-[#fb6c1d]/5 border border-[#fb6c1d]/20 p-4 rounded-xl">
              <h4 className="font-heading text-xl font-bold text-[#0134bd] uppercase mb-2">Basketball IQ</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Understanding of game situations, clock management, spacing, and play recognition. Look for players who make their teammates better through positioning.
              </p>
            </div>
            <div className="bg-[#fb6c1d]/5 border border-[#fb6c1d]/20 p-4 rounded-xl">
              <h4 className="font-heading text-xl font-bold text-[#0134bd] uppercase mb-2">Intangibles</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                The "unmeasurables": leadership, coachability, response to adversity, and bench energy. These traits often define long-term success at the next level.
              </p>
            </div>
          </div>

          <div className="mt-8 p-6 bg-[#0134bd] text-white rounded-xl">
             <h4 className="font-heading text-2xl font-black uppercase mb-2 text-center">Development Philosphy</h4>
             <p className="text-sm text-center italic opacity-80">
               "Skill development is a journey, not a destination. Our framework focuses on building functional, game-ready skills that translate to the highest levels of competition."
             </p>
          </div>

          <footer className="mt-auto pt-8 flex justify-between text-[10px] text-gray-400 font-mono">
            <span>PLAYER SCOUTING & DEVELOPMENT PACKET</span>
            <span>PAGE 6</span>
          </footer>
        </div>

        {/* PAGE 7: BACK COVER */}
        <div className="relative h-[11in] w-full flex flex-col items-center justify-center overflow-hidden border-b border-gray-200">
          {/* Background Texture */}
          <div 
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{ 
              backgroundImage: 'url(https://images.unsplash.com/photo-1674917470371-4797a55dd303?crop=entropy&cs=srgb&fm=jpg&q=85)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          ></div>
          
          <div className="z-10 text-center px-12 max-w-2xl">
            <div className="mb-12">
              <img 
                src="https://placehold.co/300x120/ffffff/0134bd?text=HOOP+WITH+HER" 
                alt="Hoop With Her Logo" 
                className="mx-auto w-48"
              />
            </div>
            
            <h2 className="font-heading text-4xl font-black text-[#0134bd] uppercase tracking-tighter mb-6">
              Our Mission
            </h2>
            
            <p className="text-2xl font-medium text-gray-700 leading-relaxed mb-12">
              "Empowering girls through basketball by providing opportunities, exposure, and elite-level training."
            </p>
            
            <div className="h-1 w-32 bg-[#fb6c1d] mx-auto mb-12"></div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <span className="font-bold text-[#0134bd]">Website:</span>
                <span>www.hoopwithher.com</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <span className="font-bold text-[#0134bd]">Email:</span>
                <span>team@hoopwithher.com</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <span className="font-bold text-[#0134bd]">Socials:</span>
                <span>@hoopwithher</span>
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-12 text-gray-400 font-mono text-[10px] uppercase tracking-[0.2em]">
            Elite Evaluation • Class Tracking • Recruiting Prep
          </div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          body {
            background: white !important;
          }
          .page-break-after-always {
            page-break-after: always;
          }
          @page {
            size: 8.5in 11in;
            margin: 0;
          }
        }
        .bg-lined-page {
          background-image: linear-gradient(#e5e7eb 1px, transparent 1px);
          background-size: 100% 2rem;
        }
      `}</style>
    </div>
  );
}
