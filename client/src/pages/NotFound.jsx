import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiAlertTriangle, FiHome, FiArrowLeft } from 'react-icons/fi';

export default function NotFound() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 font-sans px-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-yellow-400/5 rounded-full blur-3xl" />
      </div>

      {/* Caution tape top */}
      <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-yellow-500 via-black/20 to-yellow-500 bg-[repeating-linear-gradient(45deg,#eab308,#eab308_20px,#000_20px,#000_40px)]" />
      
      <div className="relative z-10 text-center max-w-lg space-y-6">
        {/* Giant 404 */}
        <div className="relative">
          <div className="text-[10rem] font-black leading-none text-yellow-500/10 select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-8xl font-black text-yellow-500 drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]">
              404
            </span>
          </div>
        </div>

        {/* Warning icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center animate-pulse">
            <FiAlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
            Page Not Found
          </h1>
          <p className="mt-3 text-slate-400 text-base leading-relaxed">
            The page you're looking for doesn't exist or has been moved. Please check the URL or navigate back to safety.
          </p>
        </div>

        {/* Separation line with caution styling */}
        <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-sm font-bold text-slate-900 bg-yellow-500 hover:bg-yellow-400 transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)]"
          >
            <FiArrowLeft className="h-4 w-4" />
            Go Back
          </button>

          <Link
            to={user ? '/dashboard' : '/login'}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-sm font-bold text-white border border-slate-600 hover:border-yellow-500/50 hover:text-yellow-400 transition-all"
          >
            <FiHome className="h-4 w-4" />
            {user ? 'Dashboard' : 'Login'}
          </Link>
        </div>

        <p className="text-xs text-slate-600 font-mono">
          SYSTEM v2.0 // QUALITY PULSE // STATUS: 404
        </p>
      </div>

      {/* Caution tape bottom */}
      <div className="absolute bottom-0 left-0 w-full h-3 bg-[repeating-linear-gradient(45deg,#eab308,#eab308_20px,#000_20px,#000_40px)]" />
    </div>
  );
}
