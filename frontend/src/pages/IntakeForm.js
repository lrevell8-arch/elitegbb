import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Textarea } from '../components/ui/textarea';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const STEPS = [
  { id: 1, name: 'Player Info', short: 'Player' },
  { id: 2, name: 'Parent/Guardian', short: 'Parent' },
  { id: 3, name: 'Team Context', short: 'Team' },
  { id: 4, name: 'Stats', short: 'Stats' },
  { id: 5, name: 'Self Eval', short: 'Eval' },
  { id: 6, name: 'Film & Links', short: 'Film' },
  { id: 7, name: 'Goals', short: 'Goals' },
  { id: 8, name: 'Package', short: 'Package' },
  { id: 9, name: 'Consent', short: 'Consent' },
];

const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'];
// Generate graduation classes dynamically - current year through current year + 10
const currentYear = new Date().getFullYear();
const GRAD_CLASSES = Array.from({ length: 12 }, (_, i) => (currentYear + i).toString());
const LEVELS = ['middle_school', 'jv', 'varsity', 'aau', 'showcase'];
const ADVERSITY_RESPONSES = ['reset_immediately', 'need_a_moment', 'motivation'];
const IQ_RATINGS = ['yes', 'no', 'learning'];
const PRIDE_TAGS = ['ball_handling', 'defense', 'leadership', 'scoring', 'passing', 'emotional_control', 'hustle'];
const GOALS = ['exposure', 'tracking', 'evaluation', 'media', 'recruiting_prep'];

const PACKAGES = [
  { id: 'starter', name: 'Starter', price: 99, features: ['Recruiting One-Pager', 'Verified Prospect Badge'] },
  { id: 'development', name: 'Development', price: 199, features: ['Everything in Starter', 'Class Tracking Profile', 'Film Index'] },
  { id: 'elite_track', name: 'Elite Track', price: 399, features: ['Everything in Development', 'Coach Referral Note', 'Mid & End Season Updates', 'Priority Support'] },
];

export default function IntakeForm() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Player Info
    player_name: '',
    preferred_name: '',
    dob: '',
    grad_class: '',
    gender: '',
    school: '',
    city: '',
    state: '',
    primary_position: '',
    secondary_position: '',
    jersey_number: '',
    height: '',
    weight: '',
    // Parent
    parent_name: '',
    parent_email: '',
    parent_phone: '',
    player_email: '',
    // Team
    level: '',
    team_names: '',
    league_region: '',
    // Stats
    games_played: '',
    ppg: '',
    apg: '',
    rpg: '',
    spg: '',
    bpg: '',
    fg_pct: '',
    three_pct: '',
    ft_pct: '',
    // Self Eval
    self_words: '',
    strength: '',
    improvement: '',
    separation: '',
    adversity_response: '',
    iq_self_rating: '',
    pride_tags: [],
    player_model: '',
    // Film
    film_links: '',
    highlight_links: '',
    instagram_handle: '',
    other_socials: '',
    // Goals
    goal: '',
    colleges_interest: '',
    // Package
    package_selected: '',
    // Consent
    consent_eval: false,
    consent_media: false,
    guardian_signature: '',
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePrideTagToggle = (tag) => {
    setFormData(prev => ({
      ...prev,
      pride_tags: prev.pride_tags.includes(tag)
        ? prev.pride_tags.filter(t => t !== tag)
        : [...prev.pride_tags, tag]
    }));
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (!formData.player_name || !formData.grad_class || !formData.gender || !formData.primary_position) {
          toast.error('Please fill in required fields: Name, Class, Gender, Position');
          return false;
        }
        break;
      case 2:
        if (!formData.parent_name || !formData.parent_email) {
          toast.error('Please fill in Parent Name and Email');
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parent_email)) {
          toast.error('Please enter a valid email address');
          return false;
        }
        break;
      case 8:
        if (!formData.package_selected) {
          toast.error('Please select a package');
          return false;
        }
        break;
      case 9:
        if (!formData.consent_eval || !formData.consent_media) {
          toast.error('Please accept both consent checkboxes');
          return false;
        }
        if (!formData.guardian_signature) {
          toast.error('Please provide guardian signature');
          return false;
        }
        break;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        film_links: formData.film_links ? formData.film_links.split('\n').filter(l => l.trim()) : [],
        highlight_links: formData.highlight_links ? formData.highlight_links.split('\n').filter(l => l.trim()) : [],
        games_played: formData.games_played ? parseInt(formData.games_played) : null,
        ppg: formData.ppg ? parseFloat(formData.ppg) : null,
        apg: formData.apg ? parseFloat(formData.apg) : null,
        rpg: formData.rpg ? parseFloat(formData.rpg) : null,
        spg: formData.spg ? parseFloat(formData.spg) : null,
        bpg: formData.bpg ? parseFloat(formData.bpg) : null,
        fg_pct: formData.fg_pct ? parseFloat(formData.fg_pct) : null,
        three_pct: formData.three_pct ? parseFloat(formData.three_pct) : null,
        ft_pct: formData.ft_pct ? parseFloat(formData.ft_pct) : null,
        signature_date: new Date().toISOString(),
      };

      const response = await axios.post(`${API_URL}/api/players`, submitData);
      
      if (response.data.payment_url) {
        // Redirect to Stripe checkout
        window.location.href = response.data.payment_url;
      } else {
        // No payment URL, go to success page
        navigate('/success', { state: { submission: response.data } });
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="font-heading text-3xl font-bold uppercase tracking-tight">Player Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="player_name">Player Name *</Label>
                <Input
                  id="player_name"
                  data-testid="player-name-input"
                  value={formData.player_name}
                  onChange={(e) => updateField('player_name', e.target.value)}
                  className="input-dark"
                  placeholder="Full legal name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferred_name">Preferred Name</Label>
                <Input
                  id="preferred_name"
                  data-testid="preferred-name-input"
                  value={formData.preferred_name}
                  onChange={(e) => updateField('preferred_name', e.target.value)}
                  className="input-dark"
                  placeholder="Nickname (optional)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  data-testid="dob-input"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => updateField('dob', e.target.value)}
                  className="input-dark"
                />
              </div>
              <div className="space-y-2">
                <Label>Graduation Class *</Label>
                <Select value={formData.grad_class} onValueChange={(v) => updateField('grad_class', v)}>
                  <SelectTrigger data-testid="grad-class-select" className="input-dark">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRAD_CLASSES.map(gc => (
                      <SelectItem key={gc} value={gc}>{gc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Gender *</Label>
                <Select value={formData.gender} onValueChange={(v) => updateField('gender', v)}>
                  <SelectTrigger data-testid="gender-select" className="input-dark">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="school">School</Label>
                <Input
                  id="school"
                  data-testid="school-input"
                  value={formData.school}
                  onChange={(e) => updateField('school', e.target.value)}
                  className="input-dark"
                  placeholder="Current school"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  data-testid="city-input"
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className="input-dark"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select value={formData.state} onValueChange={(v) => updateField('state', v)}>
                  <SelectTrigger data-testid="state-select" className="input-dark">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="AL">Alabama</SelectItem>
                    <SelectItem value="AK">Alaska</SelectItem>
                    <SelectItem value="AZ">Arizona</SelectItem>
                    <SelectItem value="AR">Arkansas</SelectItem>
                    <SelectItem value="CA">California</SelectItem>
                    <SelectItem value="CO">Colorado</SelectItem>
                    <SelectItem value="CT">Connecticut</SelectItem>
                    <SelectItem value="DE">Delaware</SelectItem>
                    <SelectItem value="FL">Florida</SelectItem>
                    <SelectItem value="GA">Georgia</SelectItem>
                    <SelectItem value="HI">Hawaii</SelectItem>
                    <SelectItem value="ID">Idaho</SelectItem>
                    <SelectItem value="IL">Illinois</SelectItem>
                    <SelectItem value="IN">Indiana</SelectItem>
                    <SelectItem value="IA">Iowa</SelectItem>
                    <SelectItem value="KS">Kansas</SelectItem>
                    <SelectItem value="KY">Kentucky</SelectItem>
                    <SelectItem value="LA">Louisiana</SelectItem>
                    <SelectItem value="ME">Maine</SelectItem>
                    <SelectItem value="MD">Maryland</SelectItem>
                    <SelectItem value="MA">Massachusetts</SelectItem>
                    <SelectItem value="MI">Michigan</SelectItem>
                    <SelectItem value="MN">Minnesota</SelectItem>
                    <SelectItem value="MS">Mississippi</SelectItem>
                    <SelectItem value="MO">Missouri</SelectItem>
                    <SelectItem value="MT">Montana</SelectItem>
                    <SelectItem value="NE">Nebraska</SelectItem>
                    <SelectItem value="NV">Nevada</SelectItem>
                    <SelectItem value="NH">New Hampshire</SelectItem>
                    <SelectItem value="NJ">New Jersey</SelectItem>
                    <SelectItem value="NM">New Mexico</SelectItem>
                    <SelectItem value="NY">New York</SelectItem>
                    <SelectItem value="NC">North Carolina</SelectItem>
                    <SelectItem value="ND">North Dakota</SelectItem>
                    <SelectItem value="OH">Ohio</SelectItem>
                    <SelectItem value="OK">Oklahoma</SelectItem>
                    <SelectItem value="OR">Oregon</SelectItem>
                    <SelectItem value="PA">Pennsylvania</SelectItem>
                    <SelectItem value="RI">Rhode Island</SelectItem>
                    <SelectItem value="SC">South Carolina</SelectItem>
                    <SelectItem value="SD">South Dakota</SelectItem>
                    <SelectItem value="TN">Tennessee</SelectItem>
                    <SelectItem value="TX">Texas</SelectItem>
                    <SelectItem value="UT">Utah</SelectItem>
                    <SelectItem value="VT">Vermont</SelectItem>
                    <SelectItem value="VA">Virginia</SelectItem>
                    <SelectItem value="WA">Washington</SelectItem>
                    <SelectItem value="WV">West Virginia</SelectItem>
                    <SelectItem value="WI">Wisconsin</SelectItem>
                    <SelectItem value="WY">Wyoming</SelectItem>
                    <SelectItem value="DC">Washington DC</SelectItem>
                    <SelectItem value="PR">Puerto Rico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Primary Position *</Label>
                <Select value={formData.primary_position} onValueChange={(v) => updateField('primary_position', v)}>
                  <SelectTrigger data-testid="primary-position-select" className="input-dark">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map(pos => (
                      <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Secondary Position</Label>
                <Select value={formData.secondary_position} onValueChange={(v) => updateField('secondary_position', v)}>
                  <SelectTrigger data-testid="secondary-position-select" className="input-dark">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map(pos => (
                      <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jersey_number">Jersey Number</Label>
                <Input
                  id="jersey_number"
                  data-testid="jersey-input"
                  value={formData.jersey_number}
                  onChange={(e) => updateField('jersey_number', e.target.value)}
                  className="input-dark"
                  placeholder="#"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height</Label>
                <Input
                  id="height"
                  data-testid="height-input"
                  value={formData.height}
                  onChange={(e) => updateField('height', e.target.value)}
                  className="input-dark"
                  placeholder="e.g., 5'8&quot;"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="font-heading text-3xl font-bold uppercase tracking-tight">Parent/Guardian</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="parent_name">Parent/Guardian Name *</Label>
                <Input
                  id="parent_name"
                  data-testid="parent-name-input"
                  value={formData.parent_name}
                  onChange={(e) => updateField('parent_name', e.target.value)}
                  className="input-dark"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent_email">Parent/Guardian Email *</Label>
                <Input
                  id="parent_email"
                  data-testid="parent-email-input"
                  type="email"
                  value={formData.parent_email}
                  onChange={(e) => updateField('parent_email', e.target.value)}
                  className="input-dark"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent_phone">Parent/Guardian Phone</Label>
                <Input
                  id="parent_phone"
                  data-testid="parent-phone-input"
                  type="tel"
                  value={formData.parent_phone}
                  onChange={(e) => updateField('parent_phone', e.target.value)}
                  className="input-dark"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="player_email">Player Email (optional)</Label>
                <Input
                  id="player_email"
                  data-testid="player-email-input"
                  type="email"
                  value={formData.player_email}
                  onChange={(e) => updateField('player_email', e.target.value)}
                  className="input-dark"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="font-heading text-3xl font-bold uppercase tracking-tight">Team Context</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Level</Label>
                <Select value={formData.level} onValueChange={(v) => updateField('level', v)}>
                  <SelectTrigger data-testid="level-select" className="input-dark">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map(level => (
                      <SelectItem key={level} value={level}>
                        {level.replace('_', ' ').toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="team_names">Team Name(s)</Label>
                <Input
                  id="team_names"
                  data-testid="team-names-input"
                  value={formData.team_names}
                  onChange={(e) => updateField('team_names', e.target.value)}
                  className="input-dark"
                  placeholder="School team, AAU team, etc."
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="league_region">League/Region</Label>
                <Input
                  id="league_region"
                  data-testid="league-region-input"
                  value={formData.league_region}
                  onChange={(e) => updateField('league_region', e.target.value)}
                  className="input-dark"
                  placeholder="e.g., Nike EYBL, AAU Circuit"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="font-heading text-3xl font-bold uppercase tracking-tight">Stats Snapshot</h2>
            <p className="text-white/60">Current season statistics (leave blank if not available)</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="games_played">Games Played</Label>
                <Input
                  id="games_played"
                  data-testid="games-played-input"
                  type="number"
                  value={formData.games_played}
                  onChange={(e) => updateField('games_played', e.target.value)}
                  className="input-dark"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ppg">PPG</Label>
                <Input
                  id="ppg"
                  data-testid="ppg-input"
                  type="number"
                  step="0.1"
                  value={formData.ppg}
                  onChange={(e) => updateField('ppg', e.target.value)}
                  className="input-dark"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apg">APG</Label>
                <Input
                  id="apg"
                  data-testid="apg-input"
                  type="number"
                  step="0.1"
                  value={formData.apg}
                  onChange={(e) => updateField('apg', e.target.value)}
                  className="input-dark"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rpg">RPG</Label>
                <Input
                  id="rpg"
                  data-testid="rpg-input"
                  type="number"
                  step="0.1"
                  value={formData.rpg}
                  onChange={(e) => updateField('rpg', e.target.value)}
                  className="input-dark"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spg">SPG</Label>
                <Input
                  id="spg"
                  data-testid="spg-input"
                  type="number"
                  step="0.1"
                  value={formData.spg}
                  onChange={(e) => updateField('spg', e.target.value)}
                  className="input-dark"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bpg">BPG</Label>
                <Input
                  id="bpg"
                  data-testid="bpg-input"
                  type="number"
                  step="0.1"
                  value={formData.bpg}
                  onChange={(e) => updateField('bpg', e.target.value)}
                  className="input-dark"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fg_pct">FG%</Label>
                <Input
                  id="fg_pct"
                  data-testid="fg-pct-input"
                  type="number"
                  step="0.1"
                  value={formData.fg_pct}
                  onChange={(e) => updateField('fg_pct', e.target.value)}
                  className="input-dark"
                  placeholder="e.g., 45.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="three_pct">3PT%</Label>
                <Input
                  id="three_pct"
                  data-testid="three-pct-input"
                  type="number"
                  step="0.1"
                  value={formData.three_pct}
                  onChange={(e) => updateField('three_pct', e.target.value)}
                  className="input-dark"
                  placeholder="e.g., 35.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ft_pct">FT%</Label>
                <Input
                  id="ft_pct"
                  data-testid="ft-pct-input"
                  type="number"
                  step="0.1"
                  value={formData.ft_pct}
                  onChange={(e) => updateField('ft_pct', e.target.value)}
                  className="input-dark"
                  placeholder="e.g., 75.0"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="font-heading text-3xl font-bold uppercase tracking-tight">Player Self Evaluation</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="self_words">Describe yourself in 3 words</Label>
                <Input
                  id="self_words"
                  data-testid="self-words-input"
                  value={formData.self_words}
                  onChange={(e) => updateField('self_words', e.target.value)}
                  className="input-dark"
                  placeholder="e.g., Competitive, Focused, Leader"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="strength">Greatest Strength</Label>
                <Textarea
                  id="strength"
                  data-testid="strength-input"
                  value={formData.strength}
                  onChange={(e) => updateField('strength', e.target.value)}
                  className="input-dark min-h-[100px]"
                  placeholder="What's your best attribute on the court?"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="improvement">Area for Improvement</Label>
                <Textarea
                  id="improvement"
                  data-testid="improvement-input"
                  value={formData.improvement}
                  onChange={(e) => updateField('improvement', e.target.value)}
                  className="input-dark min-h-[100px]"
                  placeholder="What are you working to improve?"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="separation">What Separates You</Label>
                <Textarea
                  id="separation"
                  data-testid="separation-input"
                  value={formData.separation}
                  onChange={(e) => updateField('separation', e.target.value)}
                  className="input-dark min-h-[100px]"
                  placeholder="What makes you different from other players?"
                />
              </div>
              <div className="space-y-2">
                <Label>How do you respond to adversity?</Label>
                <Select value={formData.adversity_response} onValueChange={(v) => updateField('adversity_response', v)}>
                  <SelectTrigger data-testid="adversity-select" className="input-dark">
                    <SelectValue placeholder="Select response" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reset_immediately">Reset Immediately</SelectItem>
                    <SelectItem value="need_a_moment">Need a Moment</SelectItem>
                    <SelectItem value="motivation">Use It as Motivation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Do you consider yourself a high basketball IQ player?</Label>
                <Select value={formData.iq_self_rating} onValueChange={(v) => updateField('iq_self_rating', v)}>
                  <SelectTrigger data-testid="iq-rating-select" className="input-dark">
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="learning">Still Learning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>What do you take pride in? (Select all that apply)</Label>
                <div className="flex flex-wrap gap-3 mt-2">
                  {PRIDE_TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      data-testid={`pride-tag-${tag}`}
                      onClick={() => handlePrideTagToggle(tag)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        formData.pride_tags.includes(tag)
                          ? 'bg-[#fb6c1d] text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {tag.replace('_', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="player_model">Player you model your game after</Label>
                <Input
                  id="player_model"
                  data-testid="player-model-input"
                  value={formData.player_model}
                  onChange={(e) => updateField('player_model', e.target.value)}
                  className="input-dark"
                  placeholder="e.g., A'ja Wilson, Sabrina Ionescu"
                />
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="font-heading text-3xl font-bold uppercase tracking-tight">Film & Links</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="film_links">Game Film Links</Label>
                <Textarea
                  id="film_links"
                  data-testid="film-links-input"
                  value={formData.film_links}
                  onChange={(e) => updateField('film_links', e.target.value)}
                  className="input-dark min-h-[120px]"
                  placeholder="Enter each link on a new line&#10;https://youtube.com/...&#10;https://hudl.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="highlight_links">Highlight Reel Links</Label>
                <Textarea
                  id="highlight_links"
                  data-testid="highlight-links-input"
                  value={formData.highlight_links}
                  onChange={(e) => updateField('highlight_links', e.target.value)}
                  className="input-dark min-h-[120px]"
                  placeholder="Enter each link on a new line"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram_handle">Instagram Handle</Label>
                <Input
                  id="instagram_handle"
                  data-testid="instagram-input"
                  value={formData.instagram_handle}
                  onChange={(e) => updateField('instagram_handle', e.target.value)}
                  className="input-dark"
                  placeholder="@username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="other_socials">Other Social Media</Label>
                <Textarea
                  id="other_socials"
                  data-testid="other-socials-input"
                  value={formData.other_socials}
                  onChange={(e) => updateField('other_socials', e.target.value)}
                  className="input-dark"
                  placeholder="Twitter, TikTok, etc."
                />
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="font-heading text-3xl font-bold uppercase tracking-tight">Goals</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Primary Goal</Label>
                <Select value={formData.goal} onValueChange={(v) => updateField('goal', v)}>
                  <SelectTrigger data-testid="goal-select" className="input-dark">
                    <SelectValue placeholder="Select your goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exposure">Exposure</SelectItem>
                    <SelectItem value="tracking">Tracking</SelectItem>
                    <SelectItem value="evaluation">Evaluation</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="recruiting_prep">Recruiting Prep</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="colleges_interest">Colleges of Interest (optional)</Label>
                <Textarea
                  id="colleges_interest"
                  data-testid="colleges-input"
                  value={formData.colleges_interest}
                  onChange={(e) => updateField('colleges_interest', e.target.value)}
                  className="input-dark min-h-[120px]"
                  placeholder="List any colleges you're interested in or that have shown interest"
                />
              </div>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="font-heading text-3xl font-bold uppercase tracking-tight">Select Your Package</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PACKAGES.map(pkg => (
                <button
                  key={pkg.id}
                  type="button"
                  data-testid={`package-${pkg.id}`}
                  onClick={() => updateField('package_selected', pkg.id)}
                  className={`p-6 rounded-xl border-2 text-left transition-all ${
                    formData.package_selected === pkg.id
                      ? 'border-[#fb6c1d] bg-[#fb6c1d]/10 shadow-[0_0_30px_rgba(251,108,29,0.2)]'
                      : 'border-white/10 bg-[#121212] hover:border-white/30'
                  }`}
                >
                  <div className="font-heading text-2xl font-bold uppercase">{pkg.name}</div>
                  <div className="text-3xl font-bold text-[#fb6c1d] my-3">${pkg.price}</div>
                  <ul className="space-y-2 text-sm text-white/70">
                    {pkg.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#fb6c1d]" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </div>
        );

      case 9:
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="font-heading text-3xl font-bold uppercase tracking-tight">Consent & Signature</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="consent_eval"
                  data-testid="consent-eval-checkbox"
                  checked={formData.consent_eval}
                  onCheckedChange={(checked) => updateField('consent_eval', checked)}
                />
                <Label htmlFor="consent_eval" className="text-sm text-white/80 leading-relaxed">
                  I consent to evaluation services and understand that this is informational and not a guarantee of recruiting outcomes.
                </Label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="consent_media"
                  data-testid="consent-media-checkbox"
                  checked={formData.consent_media}
                  onCheckedChange={(checked) => updateField('consent_media', checked)}
                />
                <Label htmlFor="consent_media" className="text-sm text-white/80 leading-relaxed">
                  I consent to the use of player photos, videos, and information for promotional and recruiting purposes.
                </Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardian_signature">Guardian Signature (Type full name) *</Label>
                <Input
                  id="guardian_signature"
                  data-testid="guardian-signature-input"
                  value={formData.guardian_signature}
                  onChange={(e) => updateField('guardian_signature', e.target.value)}
                  className="input-dark font-mono"
                  placeholder="Type your full legal name"
                />
              </div>
              <div className="bg-[#121212] border border-white/10 rounded-xl p-4 text-sm text-white/60">
                <p className="font-medium text-white mb-2">Disclaimer</p>
                <p>This evaluation is informational and not a guarantee of recruiting outcomes. Hoop With Her provides player tracking, evaluation, and media services to support the recruiting process but cannot guarantee college placement or scholarship offers.</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#121212]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#0134bd] to-[#fb6c1d] flex items-center justify-center">
              <span className="font-heading font-black text-white text-sm">HWH</span>
            </div>
            <div>
              <div className="font-heading font-bold text-white uppercase tracking-wide">Player Advantage™</div>
              <div className="text-xs text-white/50">Hoop With Her</div>
            </div>
          </div>
        </div>
      </header>

      {/* Step Progress */}
      <div className="border-b border-white/10 bg-[#0b0b0b] sticky top-[73px] z-40">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
            {STEPS.map((step, index) => (
              <button
                key={step.id}
                onClick={() => index < currentStep && setCurrentStep(step.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  currentStep === step.id
                    ? 'bg-[#fb6c1d] text-white'
                    : currentStep > step.id
                    ? 'bg-[#0134bd] text-white cursor-pointer'
                    : 'bg-white/10 text-white/50'
                }`}
              >
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-current">
                  {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                </span>
                <span className="hidden sm:inline text-sm font-medium">{step.short}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {renderStepContent()}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-8 border-t border-white/10">
          <Button
            type="button"
            data-testid="prev-step-btn"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="btn-outline"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep < STEPS.length ? (
            <Button
              type="button"
              data-testid="next-step-btn"
              onClick={nextStep}
              className="btn-primary"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              data-testid="submit-form-btn"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-secondary"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit & Pay
                  <Check className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
