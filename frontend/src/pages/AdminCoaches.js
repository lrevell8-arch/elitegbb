import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { 
  ArrowLeft, Loader2, GraduationCap, CheckCircle, XCircle,
  Mail, Building, MapPin, Plus, UserPlus
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC'
];

export default function AdminCoaches() {
  const { getAuthHeaders } = useAuth();
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, verified
  
  // Add Coach Dialog State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCoach, setNewCoach] = useState({
    name: '',
    email: '',
    school: '',
    title: '',
    state: '',
    password: '',
    is_verified: true
  });

  const fetchCoaches = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === 'pending') params.append('verified', 'false');
      if (filter === 'verified') params.append('verified', 'true');

      const response = await axios.get(`${API_URL}/api/admin/coaches?${params}`, {
        headers: getAuthHeaders()
      });
      setCoaches(response.data.coaches);
    } catch (error) {
      console.error('Error fetching coaches:', error);
      toast.error('Failed to load coaches');
    } finally {
      setLoading(false);
    }
  }, [filter, getAuthHeaders]);

  useEffect(() => {
    fetchCoaches();
  }, [fetchCoaches]);

  const toggleVerification = async (coachId) => {
    try {
      const response = await axios.patch(
        `${API_URL}/api/admin/coaches/${coachId}/verify`,
        {},
        { headers: getAuthHeaders() }
      );
      
      setCoaches(prev => 
        prev.map(c => c.id === coachId ? { ...c, is_verified: response.data.is_verified } : c)
      );
      
      toast.success(response.data.is_verified ? 'Coach verified' : 'Coach verification removed');
    } catch (error) {
      console.error('Error updating verification:', error);
      toast.error('Failed to update verification');
    }
  };

  const handleCreateCoach = async (e) => {
    e.preventDefault();
    
    if (!newCoach.name || !newCoach.email || !newCoach.school || !newCoach.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/coaches`,
        newCoach,
        { headers: getAuthHeaders() }
      );
      
      setCoaches(prev => [response.data.coach, ...prev]);
      toast.success('Coach created successfully');
      
      // Reset form and close dialog
      setNewCoach({
        name: '',
        email: '',
        school: '',
        title: '',
        state: '',
        password: '',
        is_verified: true
      });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error creating coach:', error);
      toast.error(error.response?.data?.error || 'Failed to create coach');
    } finally {
      setIsCreating(false);
    }
  };

  const pendingCount = coaches.filter(c => !c.is_verified).length;

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
              <h1 className="font-heading text-2xl font-bold uppercase text-white">Coach Management</h1>
              <p className="text-white/50 text-sm">
                {pendingCount > 0 && <span className="text-[#fb6c1d]">{pendingCount} pending verification</span>}
                {pendingCount === 0 && 'Manage coach portal access'}
              </p>
            </div>
          </div>
          
          {/* Add Coach Button */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Coach
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#121212] border-white/10 text-white sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-heading font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#fb6c1d]" />
                  Add New Coach
                </DialogTitle>
                <DialogDescription className="text-white/60">
                  Create a new coach account. The coach will be able to log in immediately.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateCoach} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter coach's full name"
                    value={newCoach.name}
                    onChange={(e) => setNewCoach({ ...newCoach, name: e.target.value })}
                    className="bg-[#0b0b0b] border-white/20 text-white placeholder:text-white/40"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="coach@university.edu"
                    value={newCoach.email}
                    onChange={(e) => setNewCoach({ ...newCoach, email: e.target.value })}
                    className="bg-[#0b0b0b] border-white/20 text-white placeholder:text-white/40"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="school" className="text-white">School/University *</Label>
                  <Input
                    id="school"
                    placeholder="University Name"
                    value={newCoach.school}
                    onChange={(e) => setNewCoach({ ...newCoach, school: e.target.value })}
                    className="bg-[#0b0b0b] border-white/20 text-white placeholder:text-white/40"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-white">Title</Label>
                    <Input
                      id="title"
                      placeholder="Head Coach"
                      value={newCoach.title}
                      onChange={(e) => setNewCoach({ ...newCoach, title: e.target.value })}
                      className="bg-[#0b0b0b] border-white/20 text-white placeholder:text-white/40"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-white">State</Label>
                    <Select
                      value={newCoach.state}
                      onValueChange={(value) => setNewCoach({ ...newCoach, state: value })}
                    >
                      <SelectTrigger className="bg-[#0b0b0b] border-white/20 text-white">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#121212] border-white/20">
                        {US_STATES.map(state => (
                          <SelectItem key={state} value={state} className="text-white hover:bg-white/10">
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Initial Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a secure password"
                    value={newCoach.password}
                    onChange={(e) => setNewCoach({ ...newCoach, password: e.target.value })}
                    className="bg-[#0b0b0b] border-white/20 text-white placeholder:text-white/40"
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-white/40">Minimum 8 characters. Coach can change this later.</p>
                </div>
                
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_verified"
                    checked={newCoach.is_verified}
                    onChange={(e) => setNewCoach({ ...newCoach, is_verified: e.target.checked })}
                    className="rounded border-white/20 bg-[#0b0b0b] text-[#fb6c1d] focus:ring-[#fb6c1d]"
                  />
                  <Label htmlFor="is_verified" className="text-white text-sm cursor-pointer">
                    Verify coach immediately
                  </Label>
                </div>
                
                <DialogFooter className="pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    className="border-white/20 text-white hover:bg-white/10"
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="btn-primary"
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Create Coach
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {['all', 'pending', 'verified'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                filter === f 
                  ? 'bg-[#0134bd] text-white' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {f}
              {f === 'pending' && pendingCount > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-[#fb6c1d] text-white text-xs">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Coaches List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#fb6c1d] animate-spin" />
          </div>
        ) : coaches.length === 0 ? (
          <div className="text-center py-20">
            <GraduationCap className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50 mb-4">No coaches found</p>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="btn-secondary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Coach
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {coaches.map(coach => (
              <div
                key={coach.id}
                data-testid={`coach-row-${coach.id}`}
                className="bg-[#121212] border border-white/10 rounded-xl p-6 card-hover"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      coach.is_verified 
                        ? 'bg-green-500/20' 
                        : 'bg-yellow-500/20'
                    }`}>
                      <GraduationCap className={`w-6 h-6 ${
                        coach.is_verified ? 'text-green-500' : 'text-yellow-500'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-bold text-white uppercase">
                          {coach.name}
                        </h3>
                        {coach.is_verified ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400">
                            Pending
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-white/50 mt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {coach.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {coach.school}
                        </span>
                        {coach.state && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {coach.state}
                          </span>
                        )}
                      </div>
                      <p className="text-white/40 text-xs mt-1">{coach.title}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-white/30 text-xs">
                      Registered: {new Date(coach.created_at).toLocaleDateString()}
                    </span>
                    <Button
                      onClick={() => toggleVerification(coach.id)}
                      data-testid={`verify-coach-btn-${coach.id}`}
                      className={coach.is_verified ? 'btn-outline' : 'btn-secondary'}
                    >
                      {coach.is_verified ? (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Revoke
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Verify
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
