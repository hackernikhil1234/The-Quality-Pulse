import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiLock, FiLoader, FiCheckCircle, FiEye, FiEyeOff, FiAlertTriangle } from 'react-icons/fi';
import api from '../services/api';
import loginVideo from '../assets/bglogin.mp4';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new one.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, {
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });
      setSuccess(true);
      toast.success('Password reset successfully!');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || 'This reset link is invalid or has expired.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden font-sans">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={loginVideo} type="video/mp4" />
        </video>
      </div>
      <div className="absolute inset-0 bg-slate-900/75 z-0 backdrop-blur-[2px]" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md p-10 space-y-8 bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-sm shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] border border-slate-200 dark:border-slate-700">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-600" />

        {success ? (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center animate-pulse">
                <FiCheckCircle className="w-10 h-10 text-green-500" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                Password Reset!
              </h2>
              <p className="mt-3 text-sm text-slate-400">
                Your password has been updated. Redirecting you to login...
              </p>
            </div>
            <Link
              to="/login"
              className="inline-block px-6 py-3 bg-yellow-500 text-slate-900 font-bold rounded-sm hover:bg-yellow-400 transition-all"
            >
              Go to Login →
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center">
              <div className="inline-block mb-4 px-3 py-1 border border-yellow-500/30 rounded-full bg-yellow-500/10">
                <span className="text-yellow-600 dark:text-yellow-400 text-xs font-mono tracking-widest uppercase">
                  ● Set New Password
                </span>
              </div>
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase">
                Reset Password
              </h2>
              <p className="mt-3 text-sm text-slate-400 font-medium">
                Enter your new password below.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 rounded-sm bg-red-500/10 border border-red-500/30">
                <FiAlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-300">{error}</p>
                  {error.includes('expired') && (
                    <Link
                      to="/forgot-password"
                      className="text-xs text-yellow-400 hover:text-yellow-300 underline mt-1 inline-block"
                    >
                      Request a new reset link
                    </Link>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-yellow-400 transition-colors">
                  <FiLock className="h-5 w-5" />
                </div>
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className="block w-full pl-11 pr-11 py-4 rounded-sm border border-slate-600 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all sm:text-sm font-mono"
                  placeholder="New password (min 6 chars)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-yellow-400 transition-colors">
                  <FiLock className="h-5 w-5" />
                </div>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="block w-full pl-11 pr-4 py-4 rounded-sm border border-slate-600 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all sm:text-sm font-mono"
                  placeholder="Confirm new password"
                />
              </div>

              {/* Password strength indicator */}
              {formData.newPassword && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          formData.newPassword.length >= i * 3
                            ? i <= 1
                              ? 'bg-red-500'
                              : i <= 2
                                ? 'bg-yellow-500'
                                : i <= 3
                                  ? 'bg-blue-500'
                                  : 'bg-green-500'
                            : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    {formData.newPassword.length < 6
                      ? 'Too short'
                      : formData.newPassword.length < 10
                        ? 'Weak'
                        : formData.newPassword.length < 14
                          ? 'Good'
                          : 'Strong'}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !token}
                className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-bold rounded-sm text-slate-900 bg-yellow-500 hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-3">
                    <FiLoader className="animate-spin h-6 w-6" />
                    Resetting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    RESET PASSWORD{' '}
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                )}
              </button>
            </form>
          </>
        )}

        <div className="text-center">
          <Link
            to="/login"
            className="text-sm text-slate-500 hover:text-yellow-400 transition-colors"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
