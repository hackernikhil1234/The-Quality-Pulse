import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiMail, FiLoader, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';
import api from '../services/api';
import loginVideo from '../assets/bglogin.mp4';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSent(true);
    } catch (err) {
      // Even on error we show success to prevent email enumeration
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden font-sans text-slate-900 dark:text-white transition-colors duration-300">

      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src={loginVideo} type="video/mp4" />
        </video>
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-slate-900/75 z-0 backdrop-blur-[2px]" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md p-10 space-y-8 bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-sm shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] border border-slate-200 dark:border-slate-700 transition-all duration-300">
        
        {/* Yellow accent stripe */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-600" />

        {!sent ? (
          <>
            <div className="text-center">
              <div className="inline-block mb-4 px-3 py-1 border border-yellow-500/30 rounded-full bg-yellow-500/10">
                <span className="text-yellow-600 dark:text-yellow-400 text-xs font-mono tracking-widest uppercase">● Account Recovery</span>
              </div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Forgot Password</h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 font-medium">
                Enter your registered email address. We'll send you a secure link to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-yellow-600 dark:group-focus-within:text-yellow-400 transition-colors">
                  <FiMail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-4 rounded-sm border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all sm:text-sm font-mono"
                  placeholder="your-email@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-bold rounded-sm text-slate-900 bg-yellow-500 hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-3">
                    <FiLoader className="animate-spin h-6 w-6" />
                    Sending Link...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    SEND RESET LINK <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                <FiCheckCircle className="w-10 h-10 text-green-500" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Check Your Email</h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                If an account is registered with <strong>{email}</strong>, you'll receive a password reset link shortly.
              </p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
                The link expires in 1 hour. Check your spam folder if you don't see it.
              </p>
            </div>
            <button
              onClick={() => setSent(false)}
              className="text-sm text-yellow-600 hover:text-yellow-500 dark:text-yellow-400 transition-colors underline decoration-yellow-500 underline-offset-4"
            >
              Try a different email
            </button>
          </div>
        )}

        <div className="text-center pt-2">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors"
          >
            <FiArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
