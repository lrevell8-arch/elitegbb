import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useCoachAuth } from '../context/CoachAuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Check, Crown, Zap, Shield, ArrowLeft, Loader2,
  Users, MessageSquare, BarChart3, Download, Star
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function CoachSubscription() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { coach, getAuthHeaders } = useCoachAuth();
  const [tiers, setTiers] = useState(null);
  const [currentTier, setCurrentTier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingTier, setProcessingTier] = useState(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (sessionId) {
      activateSubscription(sessionId);
    }
  }, [activateSubscription, sessionId]);

  const fetchData = useCallback(async () => {
    try {
      const [tiersRes, statusRes] = await Promise.all([
        axios.get(`${API_URL}/api/coach/subscription/tiers`),
        axios.get(`${API_URL}/api/coach/subscription/status`, {
          headers: getAuthHeaders()
        })
      ]);
      setTiers(tiersRes.data.tiers);
      setCurrentTier(statusRes.data);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      toast.error('Failed to load subscription info');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const activateSubscription = useCallback(async (sid) => {
    try {
      await axios.post(
        `${API_URL}/api/coach/subscription/activate?session_id=${sid}`,
        {},
        { headers: getAuthHeaders() }
      );
      toast.success('Subscription activated successfully!');
      fetchData();
      // Remove session_id from URL
      navigate('/coach/subscription', { replace: true });
    } catch (error) {
      console.error('Error activating subscription:', error);
      toast.error('Failed to activate subscription');
    }
  }, [fetchData, getAuthHeaders, navigate]);

  const handleSubscribe = async (tierKey) => {
    setProcessingTier(tierKey);
    try {
      const response = await axios.post(
        `${API_URL}/api/coach/subscription/checkout?tier=${tierKey}`,
        {},
        { headers: getAuthHeaders() }
      );
      
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to start checkout');
    } finally {
      setProcessingTier(null);
    }
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'basic': return <Zap className="w-6 h-6" />;
      case 'premium': return <Star className="w-6 h-6" />;
      case 'elite': return <Crown className="w-6 h-6" />;
      default: return <Shield className="w-6 h-6" />;
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'basic': return 'from-blue-500 to-blue-600';
      case 'premium': return 'from-purple-500 to-purple-600';
      case 'elite': return 'from-[#fb6c1d] to-amber-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#fb6c1d] animate-spin" />
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
              <h1 className="font-heading text-2xl font-bold uppercase text-white">Subscription</h1>
              <p className="text-white/50 text-sm">Choose your plan</p>
            </div>
          </div>
          
          {currentTier?.tier && currentTier.tier !== 'free' && (
            <Badge className={`bg-gradient-to-r ${getTierColor(currentTier.tier)} text-white px-4 py-2`}>
              {getTierIcon(currentTier.tier)}
              <span className="ml-2 font-bold uppercase">{currentTier.tier_info?.name || currentTier.tier}</span>
            </Badge>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 lg:px-8 py-12">
        {/* Current Status */}
        {currentTier?.tier && currentTier.tier !== 'free' && (
          <div className="mb-12 p-6 rounded-2xl bg-gradient-to-r from-[#0134bd]/20 to-[#fb6c1d]/20 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-xl font-bold text-white uppercase">Your Current Plan</h2>
                <p className="text-white/60 mt-1">
                  {currentTier.tier_info?.name} • {currentTier.status === 'active' ? 'Active' : 'Inactive'}
                </p>
                {currentTier.expires && (
                  <p className="text-white/40 text-sm mt-1">
                    Renews on {new Date(currentTier.expires).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${getTierColor(currentTier.tier)} flex items-center justify-center`}>
                {getTierIcon(currentTier.tier)}
              </div>
            </div>
          </div>
        )}

        {/* Tier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers && Object.entries(tiers).map(([key, tier]) => {
            const isCurrentTier = currentTier?.tier === key;
            const isPopular = key === 'premium';
            
            return (
              <div
                key={key}
                data-testid={`tier-card-${key}`}
                className={`relative rounded-2xl overflow-hidden ${
                  isPopular ? 'border-2 border-[#fb6c1d]' : 'border border-white/10'
                } ${isCurrentTier ? 'ring-2 ring-green-500' : ''}`}
              >
                {isPopular && (
                  <div className="absolute top-0 left-0 right-0 bg-[#fb6c1d] text-white text-xs font-bold uppercase text-center py-1">
                    Most Popular
                  </div>
                )}
                
                <div className={`p-6 ${isPopular ? 'pt-10' : ''}`}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getTierColor(key)} flex items-center justify-center mb-4`}>
                    {getTierIcon(key)}
                  </div>
                  
                  <h3 className="font-heading text-2xl font-bold uppercase text-white">
                    {tier.name}
                  </h3>
                  
                  <div className="mt-4 mb-6">
                    <span className="text-4xl font-heading font-bold text-white">${tier.price}</span>
                    <span className="text-white/50">/month</span>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <Check className={`w-5 h-5 flex-shrink-0 ${
                          key === 'elite' ? 'text-[#fb6c1d]' : 
                          key === 'premium' ? 'text-purple-400' : 
                          'text-blue-400'
                        }`} />
                        <span className="text-white/80">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    onClick={() => handleSubscribe(key)}
                    disabled={isCurrentTier || processingTier === key}
                    data-testid={`subscribe-btn-${key}`}
                    className={`w-full ${
                      isCurrentTier ? 'bg-green-500/20 text-green-400 cursor-default' :
                      key === 'elite' ? 'btn-secondary' :
                      key === 'premium' ? 'bg-purple-600 hover:bg-purple-700 text-white' :
                      'btn-primary'
                    }`}
                  >
                    {processingTier === key ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isCurrentTier ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Current Plan
                      </>
                    ) : (
                      `Subscribe to ${tier.name}`
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison */}
        <div className="mt-16">
          <h2 className="font-heading text-2xl font-bold uppercase text-white text-center mb-8">
            Feature Comparison
          </h2>
          
          <div className="bg-[#121212] border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="p-4 text-left text-white/60 font-medium">Feature</th>
                  <th className="p-4 text-center text-blue-400 font-medium">Basic</th>
                  <th className="p-4 text-center text-purple-400 font-medium">Premium</th>
                  <th className="p-4 text-center text-[#fb6c1d] font-medium">Elite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  { feature: 'Browse Verified Prospects', basic: true, premium: true, elite: true },
                  { feature: 'Save Players', basic: '25', premium: '∞', elite: '∞' },
                  { feature: 'Basic Stats View', basic: true, premium: true, elite: true },
                  { feature: 'Contact Info Access', basic: false, premium: true, elite: true },
                  { feature: 'Full Film Links', basic: false, premium: true, elite: true },
                  { feature: 'Export Lists', basic: false, premium: true, elite: true },
                  { feature: 'Direct Messaging', basic: false, premium: false, elite: true },
                  { feature: 'Prospect Comparison', basic: false, premium: false, elite: true },
                  { feature: 'Coach Referrals', basic: false, premium: false, elite: true },
                  { feature: 'Priority Support', basic: false, premium: false, elite: true },
                ].map((row, i) => (
                  <tr key={i}>
                    <td className="p-4 text-white">{row.feature}</td>
                    {['basic', 'premium', 'elite'].map(tier => (
                      <td key={tier} className="p-4 text-center">
                        {row[tier] === true ? (
                          <Check className={`w-5 h-5 mx-auto ${
                            tier === 'elite' ? 'text-[#fb6c1d]' :
                            tier === 'premium' ? 'text-purple-400' :
                            'text-blue-400'
                          }`} />
                        ) : row[tier] === false ? (
                          <span className="text-white/20">—</span>
                        ) : (
                          <span className="text-white/60">{row[tier]}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
