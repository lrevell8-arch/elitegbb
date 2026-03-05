import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePlayerAuth } from '../context/PlayerAuthContext';
import { toast } from 'sonner';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { WatermarkOverlay } from '../components/ui/watermark-overlay';
import { Separator } from '../components/ui/separator';
import {
  Loader2,
  User,
  Camera,
  Save,
  Lock,
  Users,
  School,
  MapPin,
  Calendar,
  TrendingUp,
  LogOut,
  Mail,
  Phone,
  Sparkles,
  Crown,
  Star,
  ArrowRight,
  Lock as LockIcon,
  Check
} from 'lucide-react';

export default function PlayerPortal() {
  const { player, updateProfile, uploadImage, changePassword, logout, loading: authLoading } = usePlayerAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const fileInputRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    player_name: '',
    preferred_name: '',
    player_email: '',
    school: '',
    city: '',
    state: '',
    primary_position: '',
    secondary_position: '',
    height: '',
    weight: '',
    jersey_number: '',
    team_names: '',
    level: '',
    ppg: '',
    apg: '',
    rpg: '',
    parent_name: '',
    parent_email: '',
    parent_phone: ''
  });

  // Password state
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    if (player) {
      setFormData({
        player_name: player.player_name || '',
        preferred_name: player.preferred_name || '',
        player_email: player.player_email || '',
        school: player.school || '',
        city: player.city || '',
        state: player.state || '',
        primary_position: player.primary_position || '',
        secondary_position: player.secondary_position || '',
        height: player.height || '',
        weight: player.weight || '',
        jersey_number: player.jersey_number || '',
        team_names: player.team_names || '',
        level: player.level || '',
        ppg: player.ppg || '',
        apg: player.apg || '',
        rpg: player.rpg || '',
        parent_name: player.parent_name || '',
        parent_email: player.parent_email || '',
        parent_phone: player.parent_phone || ''
      });
    }
  }, [player]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        try {
          await uploadImage(base64String);
          toast.success('Profile image updated successfully');
        } catch (error) {
          console.error('Upload error:', error);
          toast.error('Failed to upload image');
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File read error:', error);
      toast.error('Failed to read image file');
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile(formData);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(passwordData.current_password, passwordData.new_password);
      toast.success('Password changed successfully');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      console.error('Password change error:', error);
      toast.error(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#8f33e6]" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <Card className="bg-[#121212] border-white/10">
          <CardContent className="p-6">
            <p className="text-white">Please log in to access your portal.</p>
            <Button asChild className="mt-4 bg-[#8f33e6] hover:bg-[#8f33e6]/90">
              <Link to="/player/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if player is on free tier
  const isFreeTier = player.package_selected === 'free' || player.payment_status === 'free' || !player.package_selected;
  
  // Package display info
  const packageInfo = {
    'free': { name: 'Free Preview', color: '#8f33e6', icon: Sparkles },
    'starter': { name: 'Starter', color: '#fb6c1d', icon: Star },
    'development': { name: 'Development', color: '#0134bd', icon: Crown },
    'elite_track': { name: 'Elite Track', color: '#fb6c1d', icon: Crown }
  };
  
  const currentPackage = packageInfo[player.package_selected] || packageInfo['free'];
  const PackageIcon = currentPackage.icon;

  return (
    <div className="min-h-screen bg-[#0b0b0b] pb-12">
      {/* Header */}
      <div className="bg-[#121212] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <WatermarkOverlay isFreeTier={isFreeTier} watermarkText="FREE PROFILE">
                  <Avatar className="h-20 w-20 border-2 border-[#8f33e6]">
                    <AvatarImage src={player.profile_image_url} />
                    <AvatarFallback className="bg-[#1a1a1a] text-white text-xl">
                      {player.player_name?.split(' ').map(n => n[0]).join('') || <User />}
                    </AvatarFallback>
                  </Avatar>
                </WatermarkOverlay>
                <button
                  onClick={handleImageClick}
                  disabled={isUploading}
                  className="absolute bottom-0 right-0 p-1.5 bg-[#8f33e6] rounded-full hover:bg-[#8f33e6]/80 transition-colors disabled:opacity-50"
                  style={{ zIndex: 30 }}
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {player.preferred_name || player.player_name}
                </h1>
                <p className="text-gray-400">Player Key: {player.player_key}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-sm text-[#8f33e6]">Class of {player.grad_class}</span>
                  <span className="text-gray-600">|</span>
                  <span className="text-sm text-gray-400">{player.gender}</span>
                  <span className="text-gray-600">|</span>
                  <span 
                    className="text-sm px-2 py-0.5 rounded-full flex items-center gap-1"
                    style={{ 
                      backgroundColor: `${currentPackage.color}20`,
                      color: currentPackage.color 
                    }}
                  >
                    <PackageIcon className="w-3 h-3" />
                    {currentPackage.name}
                  </span>
                </div>
              </div>
            </div>
            <Button
              onClick={logout}
              variant="outline"
              className="border-white/10 text-white hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Upgrade Banner for Free Tier */}
      {isFreeTier && (
        <div className="bg-gradient-to-r from-[#8f33e6]/20 via-[#fb6c1d]/20 to-[#8f33e6]/20 border-b border-[#8f33e6]/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#8f33e6]/20 rounded-lg">
                  <Sparkles className="w-5 h-5 text-[#8f33e6]" />
                </div>
                <div>
                  <p className="text-white font-medium">You're on the Free Preview plan</p>
                  <p className="text-sm text-white/60">Upgrade to unlock verified status, full analytics, and priority coach connections</p>
                </div>
              </div>
              <Button 
                asChild
                className="bg-gradient-to-r from-[#8f33e6] to-[#fb6c1d] hover:opacity-90 text-white whitespace-nowrap"
              >
                <Link to="/intake">
                  Upgrade Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-[#121212] border border-white/10 flex-wrap h-auto">
            <TabsTrigger value="profile" className="data-[state=active]:bg-[#8f33e6] data-[state=active]:text-white">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-[#8f33e6] data-[state=active]:text-white">
              <TrendingUp className="w-4 h-4 mr-2" />
              Stats
            </TabsTrigger>
            <TabsTrigger value="connections" className="data-[state=active]:bg-[#8f33e6] data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Connections
            </TabsTrigger>
            {isFreeTier && (
              <TabsTrigger value="upgrade" className="data-[state=active]:bg-[#fb6c1d] data-[state=active]:text-white">
                <Sparkles className="w-4 h-4 mr-2" />
                Upgrade
              </TabsTrigger>
            )}
            <TabsTrigger value="security" className="data-[state=active]:bg-[#8f33e6] data-[state=active]:text-white">
              <Lock className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="bg-[#121212] border-white/10">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">Profile Information</CardTitle>
                  <CardDescription className="text-gray-400">
                    Manage your personal and contact information
                  </CardDescription>
                </div>
                <Button
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                  disabled={isSaving}
                  className="bg-[#8f33e6] hover:bg-[#8f33e6]/90 text-white"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isEditing ? 'Save Changes' : 'Edit Profile'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Player Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-[#8f33e6]" />
                    Player Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-400">Full Name</Label>
                      {isEditing ? (
                        <Input
                          value={formData.player_name}
                          onChange={(e) => setFormData({ ...formData, player_name: e.target.value })}
                          className="bg-[#1a1a1a] border-white/10 text-white"
                        />
                      ) : (
                        <p className="text-white">{player.player_name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-400">Preferred Name</Label>
                      {isEditing ? (
                        <Input
                          value={formData.preferred_name}
                          onChange={(e) => setFormData({ ...formData, preferred_name: e.target.value })}
                          className="bg-[#1a1a1a] border-white/10 text-white"
                        />
                      ) : (
                        <p className="text-white">{player.preferred_name || '-'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-400">Email</Label>
                      {isEditing ? (
                        <Input
                          type="email"
                          value={formData.player_email}
                          onChange={(e) => setFormData({ ...formData, player_email: e.target.value })}
                          className="bg-[#1a1a1a] border-white/10 text-white"
                        />
                      ) : (
                        <p className="text-white">{player.player_email || '-'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-400">Jersey Number</Label>
                      {isEditing ? (
                        <Input
                          value={formData.jersey_number}
                          onChange={(e) => setFormData({ ...formData, jersey_number: e.target.value })}
                          className="bg-[#1a1a1a] border-white/10 text-white"
                        />
                      ) : (
                        <p className="text-white">{player.jersey_number || '-'}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                {/* School Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <School className="w-5 h-5 text-[#8f33e6]" />
                    School Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-400">School</Label>
                      {isEditing ? (
                        <Input
                          value={formData.school}
                          onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                          className="bg-[#1a1a1a] border-white/10 text-white"
                        />
                      ) : (
                        <p className="text-white">{player.school || '-'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-400">City</Label>
                      {isEditing ? (
                        <Input
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="bg-[#1a1a1a] border-white/10 text-white"
                        />
                      ) : (
                        <p className="text-white">{player.city || '-'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-400">State</Label>
                      {isEditing ? (
                        <Input
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          className="bg-[#1a1a1a] border-white/10 text-white"
                        />
                      ) : (
                        <p className="text-white">{player.state || '-'}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                {/* Parent Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#8f33e6]" />
                    Parent/Guardian Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-400">Parent Name</Label>
                      {isEditing ? (
                        <Input
                          value={formData.parent_name}
                          onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                          className="bg-[#1a1a1a] border-white/10 text-white"
                        />
                      ) : (
                        <p className="text-white">{player.parent_name || '-'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-400">Parent Email</Label>
                      {isEditing ? (
                        <Input
                          type="email"
                          value={formData.parent_email}
                          onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                          className="bg-[#1a1a1a] border-white/10 text-white"
                        />
                      ) : (
                        <p className="text-white">{player.parent_email || '-'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-400">Parent Phone</Label>
                      {isEditing ? (
                        <Input
                          value={formData.parent_phone}
                          onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                          className="bg-[#1a1a1a] border-white/10 text-white"
                        />
                      ) : (
                        <p className="text-white">{player.parent_phone || '-'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats">
            <Card className="bg-[#121212] border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Basketball Statistics</CardTitle>
                <CardDescription className="text-gray-400">
                  Update your performance metrics and physical stats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-[#1a1a1a] border-white/10">
                    <CardContent className="p-4">
                      <Label className="text-gray-400">Height</Label>
                      {isEditing ? (
                        <Input
                          value={formData.height}
                          onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                          className="bg-[#121212] border-white/10 text-white mt-2"
                          placeholder={`5'10"`}
                        />
                      ) : (
                        <p className="text-2xl font-bold text-white mt-2">{player.height || '-'}</p>
                      )}
                    </CardContent>
                  </Card>
                  <Card className="bg-[#1a1a1a] border-white/10">
                    <CardContent className="p-4">
                      <Label className="text-gray-400">Weight</Label>
                      {isEditing ? (
                        <Input
                          value={formData.weight}
                          onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                          className="bg-[#121212] border-white/10 text-white mt-2"
                          placeholder="150 lbs"
                        />
                      ) : (
                        <p className="text-2xl font-bold text-white mt-2">{player.weight || '-'}</p>
                      )}
                    </CardContent>
                  </Card>
                  <Card className="bg-[#1a1a1a] border-white/10">
                    <CardContent className="p-4">
                      <Label className="text-gray-400">Primary Position</Label>
                      {isEditing ? (
                        <Input
                          value={formData.primary_position}
                          onChange={(e) => setFormData({ ...formData, primary_position: e.target.value })}
                          className="bg-[#121212] border-white/10 text-white mt-2"
                        />
                      ) : (
                        <p className="text-2xl font-bold text-white mt-2">{player.primary_position || '-'}</p>
                      )}
                    </CardContent>
                  </Card>
                  <Card className="bg-[#1a1a1a] border-white/10">
                    <CardContent className="p-4">
                      <Label className="text-gray-400">Secondary Position</Label>
                      {isEditing ? (
                        <Input
                          value={formData.secondary_position}
                          onChange={(e) => setFormData({ ...formData, secondary_position: e.target.value })}
                          className="bg-[#121212] border-white/10 text-white mt-2"
                        />
                      ) : (
                        <p className="text-2xl font-bold text-white mt-2">{player.secondary_position || '-'}</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Separator className="bg-white/10" />

                <h3 className="text-lg font-semibold text-white">Per Game Stats</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-400">Points Per Game (PPG)</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.ppg}
                        onChange={(e) => setFormData({ ...formData, ppg: e.target.value })}
                        className="bg-[#1a1a1a] border-white/10 text-white"
                      />
                    ) : (
                      <p className="text-xl text-white">{player.ppg || '-'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-400">Assists Per Game (APG)</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.apg}
                        onChange={(e) => setFormData({ ...formData, apg: e.target.value })}
                        className="bg-[#1a1a1a] border-white/10 text-white"
                      />
                    ) : (
                      <p className="text-xl text-white">{player.apg || '-'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-400">Rebounds Per Game (RPG)</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.rpg}
                        onChange={(e) => setFormData({ ...formData, rpg: e.target.value })}
                        className="bg-[#1a1a1a] border-white/10 text-white"
                      />
                    ) : (
                      <p className="text-xl text-white">{player.rpg || '-'}</p>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-[#8f33e6] hover:bg-[#8f33e6]/90 text-white"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Stats
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Connections Tab */}
          <TabsContent value="connections">
            <Card className="bg-[#121212] border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  Coach Connections
                  {isFreeTier && (
                    <span className="px-2 py-0.5 bg-[#8f33e6]/20 text-[#8f33e6] text-xs rounded-full flex items-center gap-1">
                      <LockIcon className="w-3 h-3" />
                      Limited
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  View coaches who have saved your profile and manage your connections
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isFreeTier ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-[#8f33e6]/10 flex items-center justify-center mx-auto mb-4">
                      <LockIcon className="w-8 h-8 text-[#8f33e6]" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Upgrade to See All Connections</h3>
                    <p className="text-gray-400 max-w-sm mx-auto mb-4">
                      Free Preview shows basic profile visibility. Upgrade to see which coaches have viewed and saved your profile.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <Button 
                        asChild
                        variant="outline"
                        className="border-[#8f33e6]/50 text-[#8f33e6] hover:bg-[#8f33e6]/10"
                      >
                        <Link to="/intake">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Upgrade to Starter
                        </Link>
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                      Free profiles are visible to coaches, but connection details require a paid plan
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Connection management coming soon!</p>
                    <p className="text-sm mt-2">You'll be able to see which coaches are interested and connect with them.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upgrade Tab - Only for Free Tier */}
          {isFreeTier && (
            <TabsContent value="upgrade">
              <Card className="bg-[#121212] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#fb6c1d]" />
                    Upgrade Your Account
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Unlock premium features to maximize your recruiting potential
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Starter Package */}
                    <div className="bg-[#1a1a1a] border border-[#fb6c1d]/30 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Star className="w-5 h-5 text-[#fb6c1d]" />
                        <h3 className="text-lg font-bold text-white">Starter</h3>
                      </div>
                      <p className="text-3xl font-bold text-[#fb6c1d] mb-4">$99</p>
                      <ul className="space-y-2 text-sm text-white/70 mb-4">
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-[#fb6c1d] mt-0.5" />
                          Recruiting One-Pager
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-[#fb6c1d] mt-0.5" />
                          Verified Prospect Badge
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-[#fb6c1d] mt-0.5" />
                          Full Coach Network Access
                        </li>
                      </ul>
                      <Button 
                        asChild
                        className="w-full bg-[#fb6c1d] hover:bg-[#fb6c1d]/90 text-white"
                      >
                        <Link to="/intake">Choose Starter</Link>
                      </Button>
                    </div>

                    {/* Development Package */}
                    <div className="bg-[#1a1a1a] border border-[#0134bd]/30 rounded-xl p-5 relative">
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0134bd] text-white text-xs font-bold px-3 py-1 rounded-full">
                        POPULAR
                      </span>
                      <div className="flex items-center gap-2 mb-3">
                        <Crown className="w-5 h-5 text-[#0134bd]" />
                        <h3 className="text-lg font-bold text-white">Development</h3>
                      </div>
                      <p className="text-3xl font-bold text-[#0134bd] mb-4">$199</p>
                      <ul className="space-y-2 text-sm text-white/70 mb-4">
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-[#0134bd] mt-0.5" />
                          Everything in Starter
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-[#0134bd] mt-0.5" />
                          Class Tracking Profile
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-[#0134bd] mt-0.5" />
                          Film Index & Analytics
                        </li>
                      </ul>
                      <Button 
                        asChild
                        className="w-full bg-[#0134bd] hover:bg-[#0134bd]/90 text-white"
                      >
                        <Link to="/intake">Choose Development</Link>
                      </Button>
                    </div>

                    {/* Elite Track Package */}
                    <div className="bg-[#1a1a1a] border border-[#fb6c1d]/30 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Crown className="w-5 h-5 text-[#fb6c1d]" />
                        <h3 className="text-lg font-bold text-white">Elite Track</h3>
                      </div>
                      <p className="text-3xl font-bold text-[#fb6c1d] mb-4">$399</p>
                      <ul className="space-y-2 text-sm text-white/70 mb-4">
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-[#fb6c1d] mt-0.5" />
                          Everything in Development
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-[#fb6c1d] mt-0.5" />
                          Coach Referral Note
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-[#fb6c1d] mt-0.5" />
                          Mid & End Season Updates
                        </li>
                      </ul>
                      <Button 
                        asChild
                        className="w-full bg-gradient-to-r from-[#fb6c1d] to-[#8f33e6] hover:opacity-90 text-white"
                      >
                        <Link to="/intake">Choose Elite</Link>
                      </Button>
                    </div>
                  </div>

                  <div className="bg-[#8f33e6]/10 border border-[#8f33e6]/20 rounded-xl p-4">
                    <p className="text-sm text-white/80 text-center">
                      <span className="font-semibold text-[#8f33e6]">Current Plan:</span> Free Preview
                      <span className="mx-2">|</span>
                      <Link to="/intake" className="text-[#fb6c1d] hover:underline">
                        Upgrade now to unlock your full potential
                      </Link>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="bg-[#121212] border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Security Settings</CardTitle>
                <CardDescription className="text-gray-400">
                  Change your password and manage account security
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="current_password" className="text-white">Current Password</Label>
                    <Input
                      id="current_password"
                      type="password"
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                      className="bg-[#1a1a1a] border-white/10 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new_password" className="text-white">New Password</Label>
                    <Input
                      id="new_password"
                      type="password"
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                      className="bg-[#1a1a1a] border-white/10 text-white"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password" className="text-white">Confirm New Password</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                      className="bg-[#1a1a1a] border-white/10 text-white"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isChangingPassword}
                    className="bg-[#8f33e6] hover:bg-[#8f33e6]/90 text-white"
                  >
                    {isChangingPassword ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Lock className="w-4 h-4 mr-2" />
                    )}
                    Change Password
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
