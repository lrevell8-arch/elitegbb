import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      toast.success('Reset link sent! Check your email.');
      setIsSubmitted(true);
    } catch (error) {
      console.error('Forgot password error:', error);
      // Don't show error message for security (user enumeration prevention)
      // Still show success message even if email doesn't exist
      toast.success('If an account exists with this email, a reset link has been sent.');
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#0134bd] to-[#fb6c1d] flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-heading text-3xl font-bold uppercase text-white">Reset Password</h1>
          <p className="text-white/50 mt-2">Hoop With Her Player Advantage™</p>
        </div>

        {/* Form */}
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-8">
          {isSubmitted ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Check Your Email</h2>
                <p className="text-white/60 text-sm">
                  If an account exists with <strong className="text-white">{email}</strong>,
                  we've sent a password reset link. Please check your inbox and spam folder.
                </p>
              </div>
              <div className="pt-4 border-t border-white/10">
                <p className="text-white/50 text-sm mb-4">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
                <Button
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail('');
                  }}
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  data-testid="forgot-password-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-dark"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <Button
                type="submit"
                data-testid="forgot-password-submit"
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Reset Link
                  </>
                )}
              </Button>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <Link
                  to="/admin/login"
                  className="text-[#fb6c1d] hover:underline text-sm flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Admin Login
                </Link>
                <Link
                  to="/coach/login"
                  className="text-[#fb6c1d] hover:underline text-sm flex items-center"
                >
                  Coach Login
                  <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
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
