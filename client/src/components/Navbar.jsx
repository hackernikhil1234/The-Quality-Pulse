// components/Navbar.jsx - FIXED
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import ErrorBoundary from './ErrorBoundary';
import { FiSun, FiMoon, FiPower, FiMenu } from 'react-icons/fi';
import { FaHardHat, FaCog, FaHammer } from 'react-icons/fa';

export default function Navbar({ toggleSidebar }) {
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  
  const [theme, setTheme] = useState(() => {
    // Get theme from localStorage or default to device preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;

    // Check device preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!user) return null;

  // Add the CSS styles to the document head
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes move-stripes {
        from { background-position: 0 0; }
        to { background-position: 56px 0; }
      }
      .animate-hazard-stripes {
        background-image: repeating-linear-gradient(
          45deg,
          #eab308, /* Yellow-500 */
          #eab308 20px,
          #0f172a 20px, /* Slate-900 */
          #0f172a 40px
        );
        background-size: 56px 56px; 
        animation: move-stripes 2s linear infinite;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <>
      {/* 1. ANIMATED SAFETY STRIPE TOP BAR */}
      <div className="h-1.5 w-full animate-hazard-stripes opacity-90 sticky top-0 z-50 border-b border-slate-900 shadow-sm"></div>

      <nav 
        className={`sticky top-1.5 z-40 w-full transition-all duration-300 border-b ${
          isScrolled 
            ? 'bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-slate-300 dark:border-slate-700 shadow-md py-2' 
            : 'bg-white dark:bg-[#0f172a] border-slate-200 dark:border-slate-800 py-3'
        }`}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 transition-all">
            
            {/* --- LEFT: BRANDING & TOOLS --- */}
            <div className="flex items-center gap-6">
              {/* Mobile Menu */}
              <button onClick={toggleSidebar} className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                <FiMenu className="w-6 h-6" />
              </button>

              {/* Logo: Industrial Style */}
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="relative">
                  {/* Hard hat icon */}
                  <div className="relative bg-yellow-500 text-slate-900 p-2.5 rounded-sm shadow-[0_0_10px_rgba(234,179,8,0.3)] z-10">
                    <FaHardHat className="text-xl" />
                  </div>
                  {/* Rotating Gear */}
                  <div className="absolute -top-2 -right-2 text-slate-300 dark:text-slate-700 z-0">
                     <FaCog className="w-8 h-8 animate-spin duration-[10000ms]" /> 
                  </div>
                </div>
                
                <div className="hidden md:flex flex-col z-10">
                  <h1 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white leading-none font-mono flex items-center gap-2">
                    QUALITY<span className="text-yellow-500">PULSE</span>
                  </h1>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-bold bg-slate-900 text-yellow-500 px-1 rounded-sm uppercase tracking-wide border border-slate-700 font-mono">
                      SYSTEM v2.0
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* --- RIGHT: CONTROL PANEL --- */}
            <div className="flex items-center gap-3 sm:gap-5">
              
              {/* Theme Switch - Industrial Toggle Look */}
              <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-sm border border-slate-300 dark:border-slate-700 flex items-center shadow-inner">
                <button 
                  onClick={() => setTheme('light')} 
                  className={`p-1.5 rounded-sm transition-all ${theme === 'light' ? 'bg-white shadow-sm text-yellow-600 border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <FiSun className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setTheme('dark')} 
                  className={`p-1.5 rounded-sm transition-all ${theme === 'dark' ? 'bg-slate-700 shadow-sm text-yellow-400 border border-slate-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <FiMoon className="w-4 h-4" />
                </button>
              </div>

              {/* Notification Bell */}
              <div className="relative">
                <ErrorBoundary>
                  <NotificationBell />
                </ErrorBoundary>
              </div>

              {/* User ID Card */}
              <div className="flex items-center pl-4 border-l-2 border-slate-200 dark:border-slate-700 h-10">
                <div className="flex items-center gap-4 group">
                  
                  {/* Text Details */}
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-sm font-bold text-slate-800 dark:text-white leading-none group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors font-mono uppercase">
                      {user.name}
                    </span>
                    <span className="text-[10px] font-mono font-medium text-slate-500 uppercase mt-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-sm border border-slate-300 dark:border-slate-600">
                      ID: {user.role.substring(0,3).toUpperCase()}-8492
                    </span>
                  </div>

                  {/* Avatar Container */}
                  <div className="relative">
                    <div className="h-10 w-10 bg-slate-900 dark:bg-slate-800 rounded-sm flex items-center justify-center text-white font-bold text-lg shadow-sm border border-slate-300 dark:border-slate-600 group-hover:border-yellow-500 transition-colors relative overflow-hidden">
                      <span className="z-10 group-hover:text-yellow-500 transition-colors">{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                    {/* Role Icon Overlay */}
                    <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-slate-900 p-1 rounded-sm shadow-sm border border-white dark:border-slate-900 text-[8px] z-20">
                        <FaHammer />
                    </div>
                  </div>

                  {/* Logout - UPDATED: Matching Sidebar Colors (Slate/Gray) */}
                  <button 
                    onClick={logout} 
                    className="ml-2 h-10 px-4 flex items-center gap-2 rounded-sm 
                      bg-slate-50 dark:bg-slate-800
                      text-slate-600 dark:text-slate-300 
                      border border-slate-300 dark:border-slate-600
                      hover:bg-slate-900 hover:text-white hover:border-slate-900 dark:hover:bg-slate-700 dark:hover:text-white
                      hover:shadow-sm
                      active:scale-95 active:shadow-inner
                      transition-all duration-200 group/logout"
                    title="Terminate Session"
                  >
                  <div className="relative">
                      <FiPower className="w-4 h-4 font-bold" />
                      {/* LED indicator dot (Red for Power Off) */}
                      <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                    </div>
                    <span className="hidden xl:inline text-xs font-bold uppercase tracking-wider font-mono">
                      Log Out
                    </span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </nav>
    </>
  );
}