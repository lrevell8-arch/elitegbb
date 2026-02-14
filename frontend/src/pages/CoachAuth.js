import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCoachAuth } from '../context/CoachAuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Loader2, GraduationCap, UserPlus, LogIn } from 'lucide-react';

export default function CoachAuth() {
  const navigate = useNavigate();
  const { login, register } = useCoachAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  
  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regSchool, setRegSchool] = useState('');
  const [regTitle, setRegTitle] = useState('Head Coach');
  const [regState, setRegState] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(loginEmail, loginPassword);
      toast.success('Welcome to the Coach Portal!');
      navigate('/coach');
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.detail || 'Login failed';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await register({
        email: regEmail,
        password: regPassword,
        name: regName,
        school: regSchool,
        title: regTitle,
        state: regState
      });
      toast.success('Registration successful! Your account is pending verification.');
      setActiveTab('login');
      setLoginEmail(regEmail);
    } catch (error) {
      console.error('Register error:', error);
      toast.error(error.response?.data?.detail || 'Registration failed');
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
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-heading text-3xl font-bold uppercase text-white">Coach Portal</h1>
          <p className="text-white/50 mt-2">Access verified prospects</p>
        </div>

        {/* Auth Forms */}
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/5">
              <TabsTrigger value="login" className="data-[state=active]:bg-[#0134bd]">
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-[#0134bd]">
                <UserPlus className="w-4 h-4 mr-2" />
                Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    data-testid="coach-login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="input-dark"
                    placeholder="coach@university.edu"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <Link to="/forgot-password" className="text-[#fb6c1d] hover:underline text-xs">
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="login-password"
                    data-testid="coach-login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="input-dark"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  data-testid="coach-login-btn"
                  disabled={isLoading}
                  className="btn-primary w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Full Name</Label>
                    <Input
                      id="reg-name"
                      data-testid="coach-reg-name"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="input-dark"
                      placeholder="John Smith"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-title">Title</Label>
                    <Input
                      id="reg-title"
                      data-testid="coach-reg-title"
                      value={regTitle}
                      onChange={(e) => setRegTitle(e.target.value)}
                      className="input-dark"
                      placeholder="Head Coach"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-school">School/University</Label>
                  <Input
                    id="reg-school"
                    data-testid="coach-reg-school"
                    value={regSchool}
                    onChange={(e) => setRegSchool(e.target.value)}
                    className="input-dark"
                    placeholder="University of Oregon"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-state">State</Label>
                  <Input
                    id="reg-state"
                    data-testid="coach-reg-state"
                    value={regState}
                    onChange={(e) => setRegState(e.target.value)}
                    className="input-dark"
                    placeholder="Oregon"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input
                    id="reg-email"
                    data-testid="coach-reg-email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="input-dark"
                    placeholder="coach@university.edu"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input
                    id="reg-password"
                    data-testid="coach-reg-password"
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="input-dark"
                    placeholder="Min 8 characters"
                    minLength={8}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  data-testid="coach-register-btn"
                  disabled={isLoading}
                  className="btn-secondary w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
                <p className="text-xs text-white/40 text-center mt-4">
                  Your account will be verified by our team before you can access prospects.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Links */}
        <div className="mt-6 text-center space-y-2">
          <Link to="/intake" className="text-[#fb6c1d] hover:underline text-sm block">
            Register a player instead?
          </Link>
          <p className="text-white/30 text-sm">
            Hoop With Her © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
