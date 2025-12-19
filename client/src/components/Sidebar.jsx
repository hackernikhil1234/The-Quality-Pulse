// components/Sidebar.jsx
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiGrid, 
  FiMap, 
  FiFileText, 
  FiBarChart2, 
  FiUser, 
  FiPlusSquare,
  FiShield,
  FiFilePlus
} from 'react-icons/fi';
import { FaHardHat } from 'react-icons/fa';

export default function Sidebar({ className = "" }) {
  const { user } = useAuth();
  const location = useLocation();

  // Define menu items with Icons
  const menuItems = [
    { 
      category: "Overview",
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: FiGrid, roles: ['Admin', 'Engineer'] },
        { path: '/analytics', label: 'Analytics', icon: FiBarChart2, roles: ['Admin', 'Engineer'] },
      ]
    },
    {
      category: "Field Operations",
      items: [
        { path: '/sites', label: 'Project Sites', icon: FiMap, roles: ['Admin', 'Engineer'] },
        { path: '/reports', label: 'Daily Reports', icon: FiFileText, roles: ['Admin', 'Engineer'] },
        { path: '/reports/create', label: 'Create Report', icon: FiFilePlus, roles: ['Engineer'] },
      ]
    },
    {
      category: "System Control",
      items: [
        { path: '/sites/create', label: 'New Project', icon: FiPlusSquare, roles: ['Admin'] },
        { path: '/admin', label: 'Admin Console', icon: FiShield, roles: ['Admin'] },
        { path: '/profile', label: 'My Profile', icon: FiUser, roles: ['Admin', 'Engineer'] },
      ]
    }
  ];

  // Helper to check active state
  const isActive = (path) => location.pathname === path;

  return (
    // 1. MAIN CONTAINER
    <aside className={`w-72 h-screen sticky top-0 flex flex-col shadow-2xl z-50 transition-all duration-300 
      bg-white dark:bg-slate-900 
      text-slate-600 dark:text-slate-300 
      border-r border-slate-200 dark:border-slate-800 
      ${className}`}>
      
      {/* --- DECORATIVE TOP STRIP (Caution Tape Theme) --- */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-600"></div>

      {/* --- LOGO HEADER --- */}
      <div className="h-20 flex items-center gap-4 px-6 relative transition-colors duration-300
        bg-white dark:bg-slate-900 
        border-b border-slate-200 dark:border-slate-800">
        
        {/* Logo Icon */}
        <div className="bg-yellow-500 p-2 rounded-sm text-slate-900 shadow-[0_0_15px_rgba(234,179,8,0.4)]">
          <FaHardHat className="text-xl" />
        </div>
        
        {/* Logo Text */}
        <div>
          <h1 className="text-lg font-black tracking-tighter leading-none uppercase text-slate-900 dark:text-white">
            Quality<span className="text-yellow-500">Pulse</span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
             <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
             <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 dark:text-slate-500">
               System Online
             </span>
          </div>
        </div>
      </div>

      {/* --- NAVIGATION CONTENT --- */}
      {/* Scrollbar hidden via CSS utility classes */}
      <div className="flex-1 overflow-y-auto py-8 px-4 space-y-8 
        [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        
        {menuItems.map((group, groupIndex) => {
          // Filter items based on user role
          const visibleItems = group.items.filter(item => item.roles.includes(user?.role));

          if (visibleItems.length === 0) return null;

          return (
            <div key={groupIndex}>
              {/* Category Label */}
              <h3 className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] mb-3 font-mono border-l-2 pl-3
                text-slate-400 dark:text-slate-500 
                border-slate-200 dark:border-slate-700">
                {group.category}
              </h3>
              
              <ul className="space-y-1">
                {visibleItems.map((item) => {
                  const active = isActive(item.path);
                  
                  return (
                    <li key={item.path}>
                      <Link 
                        to={item.path} 
                        className={`group relative flex items-center gap-3 px-3 py-3 rounded-sm transition-all duration-200 border border-transparent ${
                          active 
                            ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20' 
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white hover:border-slate-200 dark:hover:border-slate-700 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {/* Active Indicator Bar (Left) */}
                        {active && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                        )}

                        {/* Icon */}
                        <item.icon className={`text-lg transition-colors ${
                          active 
                            ? 'text-yellow-600 dark:text-yellow-500' 
                            : 'text-slate-400 group-hover:text-yellow-500 dark:text-slate-500'
                        }`} />
                        
                        {/* Label */}
                        <span className={`text-sm font-medium tracking-wide ${active ? 'font-bold' : ''}`}>
                          {item.label}
                        </span>
                        
                        {/* 'New' Badge - Show for both 'New Project' and 'Create Report' */}
                        {(item.label === 'New Project' || item.label === 'Create Report') && (
                          <span className="ml-auto text-[9px] bg-yellow-500 text-slate-900 px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider">
                            {item.label === 'New Project' ? 'New' : 'Quick'}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </aside>
  );
}