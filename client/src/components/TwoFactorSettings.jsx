// client/src/components/TwoFactorSettings.jsx
import { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiShield, FiShieldOff, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

export default function TwoFactorSettings({ user }) {
  const [step, setStep] = useState('idle'); // idle | setup | verify
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(user?.twoFactorEnabled || false);

  const handleSetup = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/2fa/setup');
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep('verify');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start 2FA setup');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!otpToken || otpToken.length < 6) {
      toast.error('Please enter the 6-digit code from your authenticator app');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/2fa/verify', { token: otpToken });
      toast.success('✅ 2FA enabled successfully! Your account is now more secure.');
      setEnabled(true);
      setStep('idle');
      setQrCode(null);
      setOtpToken('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!window.confirm('Are you sure you want to disable Two-Factor Authentication? This will make your account less secure.')) return;
    setLoading(true);
    try {
      await api.post('/auth/2fa/disable');
      toast.success('2FA has been disabled.');
      setEnabled(false);
    } catch (err) {
      toast.error('Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2.5 rounded-lg ${enabled ? 'bg-green-100 dark:bg-green-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
          {enabled
            ? <FiShield className="w-5 h-5 text-green-600 dark:text-green-400" />
            : <FiShieldOff className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          }
        </div>
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white">Two-Factor Authentication (2FA)</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Add an extra layer of security using Google Authenticator or Authy
          </p>
        </div>
        <div className="ml-auto">
          <span className={`px-3 py-1 text-xs font-bold rounded-full ${enabled ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
            {enabled ? '✅ Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      {/* Step: Idle (ready to setup or disable) */}
      {step === 'idle' && (
        <div className="mt-4">
          {!enabled ? (
            <div>
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 mb-4">
                <div className="flex gap-2 items-start">
                  <FiAlertCircle className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Once enabled, you'll need your authenticator app every time you log in as Admin. Works with <strong>Google Authenticator</strong>, <strong>Authy</strong>, and any TOTP-compatible app.
                  </p>
                </div>
              </div>
              <button
                onClick={handleSetup}
                disabled={loading}
                className="px-5 py-2.5 rounded-lg font-semibold bg-slate-900 dark:bg-yellow-500 text-white dark:text-slate-900 hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                ) : <FiShield />}
                Enable 2FA
              </button>
            </div>
          ) : (
            <div>
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 mb-4 flex items-start gap-2">
                <FiCheckCircle className="text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700 dark:text-green-300">
                  Your account is protected with Two-Factor Authentication. You'll be prompted for a code on each login.
                </p>
              </div>
              <button
                onClick={handleDisable}
                disabled={loading}
                className="px-5 py-2.5 rounded-lg font-semibold bg-red-600 text-white hover:bg-red-700 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <FiShieldOff /> Disable 2FA
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step: QR Code Setup */}
      {step === 'verify' && qrCode && (
        <div className="mt-4 space-y-5">
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Step 1: Scan this QR code with your authenticator app
            </p>
            <div className="flex justify-center">
              <img src={qrCode} alt="2FA QR Code" className="w-44 h-44 rounded-lg border border-slate-300 dark:border-slate-600" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2">
              Or enter this key manually: <span className="font-mono font-bold text-slate-700 dark:text-slate-200 break-all">{secret}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Step 2: Enter the 6-digit code from your app
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                inputMode="numeric"
                maxLength="6"
                placeholder="000000"
                value={otpToken}
                onChange={e => setOtpToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-36 px-4 py-2.5 text-center text-2xl font-mono tracking-widest rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <button
                onClick={handleVerify}
                disabled={loading || otpToken.length < 6}
                className="px-5 py-2.5 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                ) : <FiCheckCircle />}
                Verify & Enable
              </button>
              <button
                onClick={() => { setStep('idle'); setQrCode(null); setOtpToken(''); }}
                className="px-4 py-2.5 rounded-lg font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
