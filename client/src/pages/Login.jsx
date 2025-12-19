import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiLoader, FiSun, FiMoon } from 'react-icons/fi';
import loginVideo from '../assets/bglogin.mp4'; 

// --- THEME MANAGER HOOK ---
const useTheme = () => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // 1. Check if user has a saved theme preference
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
      // Use saved user preference
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      // 2. Check device preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const deviceTheme = prefersDark ? 'dark' : 'light';
      
      // 3. Check system time for smart theme (optional)
      const hour = new Date().getHours();
      const isNightTime = hour >= 18 || hour <= 6;
      
      // Decision logic: Device preference + time-based adjustment
      let initialTheme = deviceTheme;
      if (isNightTime && deviceTheme === 'light') {
        initialTheme = 'dark'; // Switch to dark at night even if device prefers light
      }
      
      setTheme(initialTheme);
      applyTheme(initialTheme);
      
      // Save initial theme to localStorage
      localStorage.setItem('theme', initialTheme);
    }
  }, []);

  const applyTheme = (themeToApply) => {
    const root = document.documentElement;
    if (themeToApply === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return { theme, toggleTheme };
};

// --- SEAMLESS VIDEO COMPONENT (Unchanged) ---
const SeamlessVideo = ({ src, duration = 7000, crossfade = 1000 }) => {
  const [activePlayer, setActivePlayer] = useState(1);
  const player1Ref = useRef(null);
  const player2Ref = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    player1Ref.current.play();
    const swapTime = duration - crossfade;

    const startLoop = () => {
      timeoutRef.current = setInterval(() => {
        setActivePlayer(prev => {
          const next = prev === 1 ? 2 : 1;
          const nextPlayer = next === 1 ? player1Ref.current : player2Ref.current;
          nextPlayer.currentTime = 0;
          nextPlayer.play();
          return next;
        });
      }, swapTime);
    };
    startLoop();
    return () => clearInterval(timeoutRef.current);
  }, [duration, crossfade]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
      <video ref={player1Ref} muted playsInline className={`absolute inset-0 w-full h-full object-cover transition-opacity ease-linear duration-[1000ms] ${activePlayer === 1 ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}><source src={src} type="video/mp4" /></video>
      <video ref={player2Ref} muted playsInline className={`absolute inset-0 w-full h-full object-cover transition-opacity ease-linear duration-[1000ms] ${activePlayer === 2 ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}><source src={src} type="video/mp4" /></video>
    </div>
  );
};

// --- MAIN LOGIN PAGE ---
export default function Login() {
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (location.state?.email) {
      setFormData({
        identifier: location.state.email,
        password: location.state.password || ''
      });
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.identifier.trim() || !formData.password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(formData.identifier, formData.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      if (err.response?.status === 401) {
        toast.error('Invalid credentials.');
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    // Outer container handles the dark/light context text colors
    <div className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden font-sans text-slate-900 dark:text-white transition-colors duration-300">
      
      {/* 1. SEAMLESS BACKGROUND VIDEO */}
      <div className="absolute inset-0 z-0">
        <SeamlessVideo src={loginVideo} duration={7000} crossfade={1500} />
      </div>

      {/* 2. THEME OVERLAY */}
      {/* Light Mode: White/60% opacity | Dark Mode: Slate-900/90% opacity to darken video */}
      <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/75 z-0 backdrop-blur-[2px] transition-colors duration-300" />

      {/* Theme Toggle Button - Top Right */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 z-20 p-3 rounded-full 
          bg-white/20 dark:bg-slate-800/40 
          backdrop-blur-md 
          border border-slate-300/30 dark:border-slate-600/30
          hover:bg-white/30 dark:hover:bg-slate-800/60
          hover:border-yellow-500/50 dark:hover:border-yellow-500/30
          transition-all duration-300 shadow-lg hover:shadow-xl"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? (
          <FiMoon className="h-5 w-5 text-slate-700 hover:text-yellow-600 transition-colors" />
        ) : (
          <FiSun className="h-5 w-5 text-yellow-400 hover:text-yellow-300 transition-colors" />
        )}
      </button>

      {/* 3. LOGIN CARD */}
      <div className="relative z-10 w-full max-w-md p-10 space-y-8 
        bg-white/80 dark:bg-slate-800/60 
        backdrop-blur-xl rounded-sm 
        shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] 
        border border-slate-200 dark:border-slate-700 
        transition-all duration-300">
        
        {/* Decorative Caution Tape Strip (Top of Card) */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-600"></div>

        <div className="text-center">
          <div className="inline-block mb-4 px-3 py-1 border border-yellow-500/30 rounded-full bg-yellow-500/10">
            <span className="text-yellow-600 dark:text-yellow-400 text-xs font-mono tracking-widest uppercase">● Secure Access</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
            Login
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 font-medium">
            Enter your credentials to access the site dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-5">
            {/* Email Field */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-yellow-600 dark:group-focus-within:text-yellow-400 transition-colors">
                <FiMail className="h-5 w-5" />
              </div>
              <input
                id="identifier"
                name="identifier"
                type="text"
                required
                disabled={loading}
                value={formData.identifier}
                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                className="block w-full pl-11 pr-4 py-4 rounded-sm 
                  border border-slate-300 dark:border-slate-600 
                  bg-slate-50 dark:bg-slate-900/50 
                  text-slate-900 dark:text-white 
                  placeholder-slate-400 
                  focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 
                  transition-all sm:text-sm font-mono"
                placeholder="Email ID / Username"
              />
            </div>

            {/* Password Field */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-yellow-600 dark:group-focus-within:text-yellow-400 transition-colors">
                <FiLock className="h-5 w-5" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                disabled={loading}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="block w-full pl-11 pr-4 py-4 rounded-sm 
                  border border-slate-300 dark:border-slate-600 
                  bg-slate-50 dark:bg-slate-900/50 
                  text-slate-900 dark:text-white 
                  placeholder-slate-400 
                  focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 
                  transition-all sm:text-sm font-mono"
                placeholder="Password"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
             <div className="flex items-center">
              <input 
                id="remember-me" 
                name="remember-me" 
                type="checkbox" 
                className="h-4 w-4 text-yellow-500 border-slate-300 dark:border-slate-600 rounded bg-slate-100 dark:bg-slate-800 focus:ring-yellow-500" 
              />
              <label htmlFor="remember-me" className="ml-2 block text-slate-700 dark:text-slate-300">Remember me</label>
            </div>
            <div>
              <Link to="/forgot-password" className="font-bold text-yellow-600 hover:text-yellow-700 dark:text-yellow-500 dark:hover:text-yellow-400 transition-colors">
                Recover Password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-bold rounded-sm 
              text-slate-900 bg-yellow-500 hover:bg-yellow-400 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 
              transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)]
              disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
               <span className="flex items-center gap-3">
                 <FiLoader className="animate-spin h-6 w-6" />
                 Authenticating...
               </span>
            ) : (
              <span className="flex items-center gap-2">
                LOGIN ACCESS <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
          New to the site?{' '}
          <Link to="/register" className="font-bold text-slate-900 dark:text-white hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors underline decoration-yellow-500 decoration-2 underline-offset-4">
            Initialize Account
          </Link>
        </p>
      </div>

      {/* Footer Copyright */}
      <div className="absolute bottom-4 text-xs text-slate-500 dark:text-slate-600 z-10 font-mono">
        SYSTEM v2.0 // QUALITY PULSE
      </div>
    </div>
  );
}