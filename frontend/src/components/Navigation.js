import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, X, Home, User, Users, Shield, 
  ChevronDown, LogOut, GraduationCap 
} from 'lucide-react';
import { Button } from './ui/button';

const Navigation = ({ 
  variant = 'default', // 'default', 'admin', 'coach', 'player', 'minimal'
  user = null,
  onLogout = null
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path) => location.pathname === path;

  const navLinks = {
    default: [
      { label: 'Home', path: '/', icon: Home },
      { label: 'Player Portal', path: '/player/login', icon: User },
      { label: 'Coach Portal', path: '/coach/login', icon: GraduationCap },
    ],
    minimal: [
      { label: 'Home', path: '/', icon: Home },
    ]
  };

  const adminLinks = [
    { label: 'Dashboard', path: '/admin', icon: Shield },
    { label: 'Pipeline', path: '/admin/pipeline', icon: Users },
    { label: 'Players', path: '/admin/players', icon: User },
    { label: 'Coaches', path: '/admin/coaches', icon: GraduationCap },
  ];

  const coachLinks = [
    { label: 'Dashboard', path: '/coach/dashboard', icon: Shield },
    { label: 'Messages', path: '/coach/messages', icon: Users },
    { label: 'Compare', path: '/coach/compare', icon: User },
  ];

  const playerLinks = [
    { label: 'My Profile', path: '/player/portal', icon: User },
    { label: 'Connections', path: '/player/connections', icon: Users },
  ];

  const getLinks = () => {
    if (variant === 'admin') return adminLinks;
    if (variant === 'coach') return coachLinks;
    if (variant === 'player') return playerLinks;
    if (variant === 'minimal') return navLinks.minimal;
    return navLinks.default;
  };

  const links = getLinks();

  // Render different styles based on variant
  if (variant === 'admin' || variant === 'coach' || variant === 'player') {
    // Dashboard-style navigation (sidebar + top bar)
    return (
      <>
        {/* Mobile Top Bar */}
        <header className="lg:hidden sticky top-0 z-50 bg-[#121212]/95 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#0134bd] to-[#fb6c1d] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="font-heading font-bold text-white">EliteGBB</span>
            </Link>
            <div className="flex items-center gap-2">
              {user && (
                <span className="text-white/60 text-sm hidden sm:block">
                  {user.name || user.email}
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
          
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="border-t border-white/10 px-4 py-4 space-y-2">
              {links.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(link.path) 
                      ? 'bg-[#0134bd] text-white' 
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-white/10 pt-2 mt-2">
                <Link
                  to="/"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <Home className="w-5 h-5" />
                  Landing Page
                </Link>
                <Link
                  to="/player/login"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <User className="w-5 h-5" />
                  Player Login
                </Link>
                <Link
                  to="/coach/login"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <GraduationCap className="w-5 h-5" />
                  Coach Login
                </Link>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors w-full"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              )}
            </div>
          )}
        </header>

        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-[#121212] border-r border-white/10 flex-col z-40">
          <div className="p-6 border-b border-white/10">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0134bd] to-[#fb6c1d] rounded-xl rotate-6 group-hover:rotate-12 transition-transform duration-300" />
                <div className="absolute inset-0 bg-[#0b0b0b] rounded-xl flex items-center justify-center">
                  <span className="text-lg font-black text-elite-gradient">E</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-white tracking-tight">EliteGBB</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
                  {variant === 'admin' ? 'Admin Portal' : variant === 'coach' ? 'Coach Portal' : 'Player Portal'}
                </span>
              </div>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {links.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(link.path) 
                    ? 'bg-[#0134bd] text-white' 
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </Link>
            ))}
            
            {/* Public Links Section */}
            <div className="pt-4 mt-4 border-t border-white/10">
              <p className="px-4 text-xs uppercase tracking-wider text-white/40 mb-2">Navigate</p>
              <Link
                to="/"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              >
                <Home className="w-5 h-5" />
                Landing Page
              </Link>
              <Link
                to="/player/login"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              >
                <User className="w-5 h-5" />
                Player Login
              </Link>
              <Link
                to="/coach/login"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              >
                <GraduationCap className="w-5 h-5" />
                Coach Login
              </Link>
            </div>
          </nav>

          {user && (
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-[#0134bd] flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{user.name || user.email}</p>
                  <p className="text-white/50 text-xs capitalize">{user.role || variant}</p>
                </div>
                {onLogout && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onLogout}
                    className="text-white/50 hover:text-red-400"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </aside>
      </>
    );
  }

  // Default/Marketing-style navigation
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled ? 'bg-[#0b0b0b]/95 backdrop-blur-md border-b border-white/10 py-3' : 'bg-transparent py-5'
    }`}>
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 bg-gradient-to-br from-[#0134bd] to-[#fb6c1d] rounded-xl rotate-6 group-hover:rotate-12 transition-transform duration-300" />
              <div className="absolute inset-0 bg-[#0b0b0b] rounded-xl flex items-center justify-center">
                <span className="text-lg font-black text-white">E</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white tracking-tight">EliteGBB</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Elite Recruiting</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {links.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors flex items-center gap-2 ${
                  isActive(link.path) ? 'text-[#fb6c1d]' : 'text-gray-400 hover:text-white'
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/player/login"
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Player Login
            </Link>
            <Link
              to="/coach/login"
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Coach Login
            </Link>
            <Link
              to="/intake"
              className="btn-elite text-sm px-5 py-2.5"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 py-4 border-t border-white/10 space-y-2">
            {links.map(link => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(link.path) 
                    ? 'bg-[#0134bd] text-white' 
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </Link>
            ))}
            <div className="border-t border-white/10 pt-2 mt-2 space-y-2">
              <Link
                to="/player/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <User className="w-5 h-5" />
                Player Login
              </Link>
              <Link
                to="/coach/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <GraduationCap className="w-5 h-5" />
                Coach Login
              </Link>
              <Link
                to="/intake"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-[#0134bd] to-[#012aa3] text-white font-medium"
              >
                <ChevronDown className="w-5 h-5 rotate-[-90deg]" />
                Get Started
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
