import { useAuth } from '../context/AuthContext';
import { usePlayerAuth } from '../context/PlayerAuthContext';
import { useCoachAuth } from '../context/CoachAuthContext';
import { Button } from './ui/button';
import { LogOut, Shield, User } from 'lucide-react';
import { toast } from 'sonner';

// JWT decode helper
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export default function ImpersonationBanner() {
  // Try to get auth from all contexts - some may fail if provider not available
  let adminAuth = { isImpersonating: false, originalAdmin: null, user: null, exitImpersonation: null };
  let playerAuth = { isImpersonating: false, player: null };
  let coachAuth = { isImpersonating: false, coach: null };

  try {
    adminAuth = useAuth() || adminAuth;
  } catch (e) {
    // Admin context not available (expected in player/coach portals)
  }

  try {
    playerAuth = usePlayerAuth() || playerAuth;
  } catch (e) {
    // Player context not available
  }

  try {
    coachAuth = useCoachAuth() || coachAuth;
  } catch (e) {
    // Coach context not available
  }

  // Determine if we're in impersonation mode and what the context is
  const isImpersonating = adminAuth.isImpersonating || playerAuth.isImpersonating || coachAuth.isImpersonating;

  // Check localStorage as fallback
  const isImpersonatingFlag = localStorage.getItem('hwh_impersonating') === 'true';
  const originalAdminData = localStorage.getItem('hwh_original_admin');
  const originalAdmin = adminAuth.originalAdmin || (originalAdminData ? JSON.parse(originalAdminData) : null);

  // Get current user info based on context
  let currentUser = null;
  let userType = '';

  if (playerAuth.player || (playerAuth.isImpersonating && playerAuth.player)) {
    currentUser = playerAuth.player;
    userType = 'Player';
  } else if (coachAuth.coach || (coachAuth.isImpersonating && coachAuth.coach)) {
    currentUser = coachAuth.coach;
    userType = 'Coach';
  } else if (adminAuth.user) {
    currentUser = adminAuth.user;
    userType = adminAuth.user.role === 'coach' ? 'Coach' : 'Player';
  }

  // If not impersonating, don't show banner
  if (!isImpersonating && !isImpersonatingFlag) {
    return null;
  }

  const handleExitImpersonation = async () => {
    try {
      // Clear impersonation data from localStorage
      localStorage.removeItem('hwh_impersonating');
      localStorage.removeItem('hwh_original_admin');
      localStorage.removeItem('hwh_player_token');
      localStorage.removeItem('hwh_coach_token');

      // Restore admin token if available
      if (originalAdmin?.token) {
        localStorage.setItem('hwh_token', originalAdmin.token);
      }

      toast.success('Returned to admin account');
      // Redirect back to admin dashboard
      window.location.href = '/admin';
    } catch (error) {
      console.error('Error exiting impersonation:', error);
      toast.error('Failed to return to admin account');
    }
  };

  const userName = currentUser?.name || currentUser?.player_name || currentUser?.email || currentUser?.player_key || 'Unknown';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-[#0134bd] to-[#fb6c1d] text-white py-2 px-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
            <Shield className="w-4 h-4" />
            <span className="font-medium text-sm">Admin Mode</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="text-sm">
              Viewing as <strong>{userType}</strong>: {userName}
            </span>
          </div>
          {originalAdmin?.user?.email && (
            <span className="text-xs text-white/70 hidden md:inline">
              (Admin: {originalAdmin.user.email})
            </span>
          )}
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleExitImpersonation}
          className="bg-white text-[#0134bd] hover:bg-white/90 font-medium"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Exit to Admin
        </Button>
      </div>
    </div>
  );
}
