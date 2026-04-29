import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiSun, FiMoon } from 'react-icons/fi';
import registerVideo from '../assets/bgregister.mp4';

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
    if (player1Ref.current) player1Ref.current.play().catch(() => {});
    const swapTime = duration - crossfade;

    const startLoop = () => {
      timeoutRef.current = setInterval(() => {
        setActivePlayer((prev) => {
          const next = prev === 1 ? 2 : 1;
          const nextPlayer = next === 1 ? player1Ref.current : player2Ref.current;
          if (nextPlayer) {
            nextPlayer.currentTime = 0;
            nextPlayer.play().catch(() => {});
          }
          return next;
        });
      }, swapTime);
    };
    startLoop();
    return () => clearInterval(timeoutRef.current);
  }, [duration, crossfade]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-900">
      <video
        ref={player1Ref}
        muted
        playsInline
        autoPlay
        loop
        preload="auto"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity ease-linear duration-[1000ms] ${activePlayer === 1 ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
      >
        <source src={src} type="video/mp4" />
      </video>
      <video
        ref={player2Ref}
        muted
        playsInline
        preload="auto"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity ease-linear duration-[1000ms] ${activePlayer === 2 ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
      >
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );
};

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+91',
    password: '',
    role: 'Engineer',
  });

  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { theme, toggleTheme } = useTheme();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    else if (formData.name.length < 2) newErrors.name = 'Name must be at least 2 characters';

    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';

    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, '')))
      newErrors.phone = 'Phone number must be 10 digits';

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6)
      newErrors.password = 'Password must be at least 6 characters';

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const fullPhoneNumber = formData.countryCode + formData.phone.replace(/\D/g, '');
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: fullPhoneNumber,
        password: formData.password,
        role: formData.role,
      };

      await register(
        userData.name,
        userData.email,
        userData.phone,
        userData.password,
        userData.role
      );
      toast.success('Registration successful!');
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      let errorMessage = 'Registration failed';
      if (err.response?.data) {
        const serverError = err.response.data;
        if (serverError.message) errorMessage = serverError.message;
        if (serverError.errors) {
          const fieldErrors = {};
          serverError.errors.forEach((error) => {
            if (error.path) fieldErrors[error.path] = error.msg;
          });
          setErrors(fieldErrors);
        }
        if (serverError.message && serverError.message.toLowerCase().includes('email')) {
          toast('Email already exists. Please login instead.', { icon: 'ℹ️', duration: 4000 });
          navigate('/login', { state: { email: formData.email, password: formData.password } });
          return;
        }
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const countryCodes = [
    { code: '+91', country: '🇮🇳 India', display: '+91' },
    { code: '+1', country: '🇺🇸 USA', display: '+1' },
    { code: '+971', country: '🇦🇪 UAE', display: '+971' },
    { code: '+966', country: '🇸🇦 Saudi Arabia', display: '+966' },
    { code: '+44', country: '🇬🇧 UK', display: '+44' },
    { code: '+61', country: '🇦🇺 Australia', display: '+61' },
  ];

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden font-sans text-slate-900 dark:text-white transition-colors duration-300">
      {/* 1. SEAMLESS BACKGROUND VIDEO */}
      <div className="absolute inset-0 z-[-1]">
        <SeamlessVideo src={registerVideo} duration={7000} crossfade={1500} />
      </div>

      {/* 2. THEME OVERLAY */}
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

      {/* 3. REGISTER CARD */}
      <div
        className="relative z-10 w-full max-w-lg p-8 sm:p-10 space-y-8 
        bg-white/80 dark:bg-slate-800/60 
        backdrop-blur-xl rounded-sm 
        shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] 
        border border-slate-200 dark:border-slate-700 
        transition-all duration-300"
      >
        {/* Decorative Caution Tape Strip (Top of Card) */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-600"></div>

        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
              Initialize Account
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Already registered?{' '}
              <Link
                to="/login"
                className="font-bold text-yellow-600 hover:text-yellow-500 dark:text-yellow-500 dark:hover:text-yellow-400 transition-colors underline decoration-yellow-500/50 decoration-2 underline-offset-4"
              >
                Access Dashboard
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider text-xs">
                Full Name
              </label>
              <div className="relative">
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className={`block w-full rounded-sm border px-4 py-3 
                    bg-slate-50 dark:bg-slate-800 
                    border-slate-300 dark:border-slate-700 
                    text-slate-900 dark:text-white 
                    placeholder-slate-400 
                    focus:border-yellow-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-yellow-500 
                    sm:text-sm transition-all font-mono 
                    ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="John Doe"
                />
                {errors.name && (
                  <p className="absolute -bottom-5 left-0 text-xs text-red-500 font-bold">
                    {errors.name}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider text-xs">
                Email address
              </label>
              <div className="relative">
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full rounded-sm border px-4 py-3 
                    bg-slate-50 dark:bg-slate-800 
                    border-slate-300 dark:border-slate-700 
                    text-slate-900 dark:text-white 
                    placeholder-slate-400 
                    focus:border-yellow-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-yellow-500 
                    sm:text-sm transition-all font-mono 
                    ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="john@example.com"
                />
                {errors.email && (
                  <p className="absolute -bottom-5 left-0 text-xs text-red-500 font-bold">
                    {errors.email}
                  </p>
                )}
              </div>
            </div>

            {/* Phone Group */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider text-xs">
                Phone Number
              </label>
              <div className="flex gap-3">
                <div className="w-28 flex-shrink-0">
                  <select
                    name="countryCode"
                    value={formData.countryCode}
                    onChange={handleChange}
                    className="block w-full rounded-sm border px-3 py-3 
                      bg-slate-50 dark:bg-slate-800 
                      border-slate-300 dark:border-slate-700 
                      text-slate-900 dark:text-white 
                      focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 
                      sm:text-sm font-mono cursor-pointer"
                  >
                    {countryCodes.map((country) => (
                      <option
                        key={country.code}
                        value={country.code}
                        className="bg-white dark:bg-slate-800"
                      >
                        {country.display}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative flex-1">
                  <input
                    name="phone"
                    type="text"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`block w-full rounded-sm border px-4 py-3 
                      bg-slate-50 dark:bg-slate-800 
                      border-slate-300 dark:border-slate-700 
                      text-slate-900 dark:text-white 
                      placeholder-slate-400 
                      focus:border-yellow-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-yellow-500 
                      sm:text-sm transition-all font-mono 
                      ${errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="1234567890"
                  />
                  {errors.phone && (
                    <p className="absolute -bottom-5 left-0 text-xs text-red-500 font-bold">
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider text-xs">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full rounded-sm border px-4 py-3 
                    bg-slate-50 dark:bg-slate-800 
                    border-slate-300 dark:border-slate-700 
                    text-slate-900 dark:text-white 
                    placeholder-slate-400 
                    focus:border-yellow-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-yellow-500 
                    sm:text-sm transition-all font-mono 
                    ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="absolute -bottom-5 left-0 text-xs text-red-500 font-bold">
                    {errors.password}
                  </p>
                )}
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider text-xs">
                Assign Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['Engineer', 'Admin'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setFormData({ ...formData, role })}
                    className={`flex items-center justify-center px-4 py-3 border rounded-sm text-sm font-bold uppercase tracking-wider transition-all ${
                      formData.role === role
                        ? 'bg-yellow-500/10 border-yellow-500 text-yellow-700 dark:text-yellow-400 ring-1 ring-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600'
                    }`}
                  >
                    {role === 'Engineer' ? '👷 Engineer' : '🛡️ Admin'}
                  </button>
                ))}
              </div>

              {/* Role Description */}
              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 px-1 border-l-2 border-slate-300 dark:border-slate-700 pl-2">
                {formData.role === 'Engineer'
                  ? 'Engineers can submit daily reports, view assigned sites, and update logs.'
                  : 'Admins have full access to manage users, sites, reports, and system settings.'}
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-sm shadow-lg text-lg font-bold text-slate-900 bg-yellow-500 hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 focus:ring-offset-white dark:focus:ring-offset-slate-900 disabled:opacity-70 disabled:cursor-not-allowed transition-all hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(234,179,8,0.4)]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-slate-900"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    INITIALIZING...
                  </span>
                ) : (
                  'CREATE ACCOUNT'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
