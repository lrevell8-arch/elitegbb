import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Loader2, Lock, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);

  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
      toast.error('Invalid or missing reset token');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/auth/reset-password`, {
        token,
        new_password: newPassword
      });

      toast.success('Password reset successful!');
      setIsSuccess(true);
    } catch (error) {
      console.error('Reset password error:', error);
      const message = error.response?.data?.detail || 'Failed to reset password';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#0134bd] to-[#fb6c1d] flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-heading text-3xl font-bold uppercase text-white">Invalid Link</h1>
          </div>

          <div className="bg-[#121212] border border-white/10 rounded-2xl p-8 text-center">
            <p className="text-white/60 mb-6">
              This password reset link is invalid or has expired.
            </p>
            <Link to="/forgot-password">
              <Button className="btn-primary w-full">
                Request New Reset Link
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#0134bd] to-[#fb6c1d] flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-heading text-3xl font-bold uppercase text-white">Set New Password</h1>
          <p className="text-white/50 mt-2">Hoop With Her Player Advantage™</p>
        </div>

        {/* Form */}
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-8">
          {isSuccess ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Password Reset Complete!</h2>
                <p className="text-white/60 text-sm">
                  Your password has been successfully updated. You can now log in with your new password.
                </p>
              </div>
              <div className="space-y-3 pt-4">
                <Link to="/admin/login">
                  <Button className="btn-primary w-full mb-3">
                    Log in as Admin
                  </Button>
                </Link>
                <Link to="/coach/login">
                  <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                    Log in as Coach
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    data-testid="reset-password-new"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-dark pr-10"
                    placeholder="Min 8 characters"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    data-testid="reset-password-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-dark pr-10"
                    placeholder="Re-enter password"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-red-400 text-xs">Passwords do not match</p>
                )}
              </div>

              <Button
                type="submit"
                data-testid="reset-password-submit"
                disabled={isLoading || newPassword !== confirmPassword || newPassword.length < 8}
                className="btn-primary w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Reset Password
                  </>
                )}
              </Button>

              <div className="text-center pt-4 border-t border-white/10">
                <Link
                  to="/forgot-password"
                  className="text-[#fb6c1d] hover:underline text-sm flex items-center justify-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Forgot Password
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-white/30 text-sm mt-6">
          Hoop With Her © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
