import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { usePlayerAuth } from '../context/PlayerAuthContext';
import { toast } from 'sonner';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import Navigation from '../components/Navigation';
import { Loader2, User } from 'lucide-react';

export default function PlayerLogin() {
  const navigate = useNavigate();
  const { login } = usePlayerAuth();
  const [playerKey, setPlayerKey] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(playerKey.toUpperCase(), password);
      toast.success('Welcome back!');
      navigate('/player');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.detail || 'Invalid player key or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      {/* Navigation */}
      <Navigation variant="minimal" />

      <div className="pt-24 pb-12 px-4 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md bg-[#121212] border-white/10">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-[#8f33e6] rounded-full flex items-center justify-center mb-4">
            <User className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">Player Portal</CardTitle>
          <CardDescription className="text-gray-400">
            Sign in to manage your profile and connect with coaches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="playerKey" className="text-white">Player Key</Label>
              <Input
                id="playerKey"
                type="text"
                placeholder="P-XXXXXX"
                value={playerKey}
                onChange={(e) => setPlayerKey(e.target.value.toUpperCase())}
                className="bg-[#1a1a1a] border-white/10 text-white placeholder:text-gray-500"
                required
              />
              <p className="text-xs text-gray-500">Enter the key provided when you registered</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#1a1a1a] border-white/10 text-white"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#8f33e6] hover:bg-[#8f33e6]/90 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            <p>Don't have an account?{' '}
              <Link to="/intake" className="text-[#8f33e6] hover:underline">
                Register here
              </Link>
            </p>
            <p className="mt-2">
              <Link to="/forgot-password" className="text-[#8f33e6] hover:underline">
                Forgot your password?
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
