import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaCamera, 
  FaSave, 
  FaTimes, 
  FaKey,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaBriefcase,
  FaCalendarAlt,
  FaGlobe,
  FaEdit,
  FaTrash,
  FaArrowLeft
} from 'react-icons/fa';

export default function Profile() {
  const { user, updateUser, loading: authLoading, initialCheckDone } = useAuth();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localAvatar, setLocalAvatar] = useState(null);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+1',
    avatar: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Try to get user from localStorage if auth is loading
  const getCachedUser = () => {
    try {
      const cached = localStorage.getItem('user');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  };

  const cachedUser = getCachedUser();
  const displayUser = user || cachedUser;

  useEffect(() => {
    if (displayUser) {
      setFormData({
        name: displayUser.name || '',
        email: displayUser.email || '',
        phone: displayUser.phone || '',
        countryCode: displayUser.countryCode || '+1',
        avatar: displayUser.avatar || ''
      });
      
      // Load avatar from localStorage if exists
      const storedAvatar = localStorage.getItem(`avatar_${displayUser._id}`);
      if (storedAvatar) {
        setLocalAvatar(storedAvatar);
      }
    }
  }, [displayUser]);

  // Show loading only if auth is still checking AND we don't have cached user
  if (authLoading && !initialCheckDone && !cachedUser) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
        <Sidebar />
        <div className="flex-1">
          <Navbar />
          <div className="p-8">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
                <div className="mt-4 text-slate-600 dark:text-slate-400">Loading profile...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Only show "no user" if auth check is complete and no user (cached or current)
  if (!displayUser && initialCheckDone) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
        <Sidebar />
        <div className="flex-1">
          <Navbar />
          <div className="p-8">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="text-red-600 dark:text-red-400 mb-4">Please log in to view your profile</div>
                <button 
                  onClick={() => navigate('/login')}
                  className="px-6 py-3 rounded-lg font-medium transition-all duration-200
                    bg-gradient-to-r from-yellow-500 to-yellow-600 
                    text-slate-900
                    hover:from-yellow-600 hover:to-yellow-700 
                    hover:shadow-lg hover:shadow-yellow-500/25
                    active:scale-[0.99]
                    flex items-center mx-auto"
                >
                  Go to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default profile image URL
  const getDefaultAvatarUrl = () => {
    return 'https://www.pngall.com/wp-content/uploads/5/Profile-PNG-File.png';
  };

  const getAvatarUrl = () => {
    // Priority: localAvatar > displayUser.avatar > default avatar
    if (localAvatar) {
      return localAvatar;
    }
    
    // Check if displayUser has avatar
    if (displayUser?.avatar && displayUser.avatar !== '' && displayUser.avatar !== getDefaultAvatarUrl()) {
      // If it's a data URL (SVG or base64), return as is
      if (displayUser.avatar.startsWith('data:image/')) {
        return displayUser.avatar;
      }
      
      // If it's a relative path, construct URL
      if (displayUser.avatar.startsWith('/uploads/')) {
        return `http://localhost:5000${displayUser.avatar}`;
      }
      
      // If it's a full URL, return as is
      if (displayUser.avatar.startsWith('http')) {
        return displayUser.avatar;
      }
      
      return displayUser.avatar;
    }
    
    // Check formData avatar as fallback (but not if it's the default)
    if (formData.avatar && formData.avatar !== '' && formData.avatar !== getDefaultAvatarUrl()) {
      return formData.avatar;
    }
    
    // Return default avatar
    return getDefaultAvatarUrl();
  };

  const countryCodes = [
    { code: '+1', country: '🇺🇸 USA' },
    { code: '+91', country: '🇮🇳 India' },
    { code: '+44', country: '🇬🇧 UK' },
    { code: '+61', country: '🇦🇺 Australia' },
    { code: '+49', country: '🇩🇪 Germany' },
    { code: '+33', country: '🇫🇷 France' },
    { code: '+81', country: '🇯🇵 Japan' },
    { code: '+86', country: '🇨🇳 China' },
    { code: '+971', country: '🇦🇪 UAE' },
    { code: '+966', country: '🇸🇦 Saudi Arabia' }
  ];

  const handleEdit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    
    try {
      // If avatar is the default one, send empty string
      const avatarToSave = (localAvatar || formData.avatar) === getDefaultAvatarUrl() 
        ? '' 
        : (localAvatar || formData.avatar);
      
      const response = await api.put('/auth/profile', {
        name: formData.name,
        phone: formData.phone,
        countryCode: formData.countryCode,
        avatar: avatarToSave
      });
      
      // Update both the context and localStorage
      const updatedUser = { ...displayUser, ...response.data.user };
      if (updateUser && typeof updateUser === 'function') {
        updateUser(updatedUser);
      }
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast.success('Profile updated successfully!');
      setEditMode(false);
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      toast.success('Password changed successfully!');
      setPasswordMode(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Password change error:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image size should be less than 5MB');
      return;
    }
    
    setUploading(true);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Image = event.target.result;
      setLocalAvatar(base64Image);
      setFormData(prev => ({ ...prev, avatar: base64Image }));
      
      // Save to localStorage for offline use
      if (displayUser?._id) {
        localStorage.setItem(`avatar_${displayUser._id}`, base64Image);
      }
      
      try {
        const formData = new FormData();
        formData.append('images', file);
        
        const response = await api.post('/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.data.success && response.data.files.length > 0) {
          const newAvatar = response.data.files[0];
          
          // Update user profile with the new avatar
          await api.put('/auth/profile', {
            avatar: newAvatar
          });
          
          // Update user in auth context and localStorage
          const updatedUser = { ...displayUser, avatar: newAvatar };
          if (updateUser && typeof updateUser === 'function') {
            updateUser(updatedUser);
          }
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          setFormData(prev => ({ ...prev, avatar: newAvatar }));
          toast.success('Profile picture updated successfully!');
        }
      } catch (error) {
        console.error('Upload error:', error);
        // Still show success for local upload
        toast.success('Profile picture saved locally');
      }
      
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    reader.readAsDataURL(file);
  };

  const handleDeleteAvatar = async () => {
    try {
      // Clear local avatar
      setLocalAvatar(null);
      setFormData(prev => ({ ...prev, avatar: '' }));
      
      // Remove from localStorage
      if (displayUser?._id) {
        localStorage.removeItem(`avatar_${displayUser._id}`);
      }
      
      // Update user profile to remove avatar
      await api.put('/auth/profile', {
        avatar: ''
      });
      
      // Update user in auth context and localStorage
      const updatedUser = { ...displayUser, avatar: '' };
      if (updateUser && typeof updateUser === 'function') {
        updateUser(updatedUser);
      }
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast.success('Profile picture removed successfully!');
    } catch (error) {
      console.error('Delete avatar error:', error);
      toast.error('Failed to remove profile picture');
    }
  };

  const handleAvatarClick = () => {
    if (editMode && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setPasswordMode(false);
    if (displayUser) {
      setFormData({
        name: displayUser.name || '',
        email: displayUser.email || '',
        phone: displayUser.phone || '',
        countryCode: displayUser.countryCode || '+1',
        avatar: displayUser.avatar || ''
      });
    }
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const formatPhoneNumber = (phone) => {
    if (!phone || phone.trim() === '') return 'Not set';
    const countryCode = formData.countryCode || '+1';
    return `${countryCode} ${phone}`;
  };

  const getRoleBadgeColor = (role) => {
    switch(role?.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'engineer':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400';
    }
  };

  // Get current phone for display (use formData when in edit mode, otherwise displayUser data)
  const displayPhone = editMode ? formData.phone : displayUser.phone;
  const displayCountryCode = editMode ? formData.countryCode : displayUser.countryCode;
  
  // Check if current avatar is the default one
  const hasCustomAvatar = () => {
    const avatarUrl = getAvatarUrl();
    return avatarUrl !== getDefaultAvatarUrl() && 
           !avatarUrl.includes('Profile-PNG-File.png');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <div className="flex-1 overflow-hidden">
        <Navbar />
        
        <div className="p-6">
          {/* Header with Back Button */}
          <div className="flex items-start gap-4 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex-shrink-0 mt-4 p-2 rounded-lg transition-all duration-200 
                bg-white dark:bg-slate-800 
                border border-slate-200 dark:border-slate-700 
                text-yellow-600 dark:text-yellow-500 
                hover:bg-slate-100 dark:hover:bg-slate-700 
                hover:border-yellow-500/50 dark:hover:border-yellow-500/50
                hover:text-yellow-700 dark:hover:text-yellow-400"
              title="Go back"
            >
              <FaArrowLeft className="text-lg" />
            </button>

            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
                  <FaUser className="text-2xl text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Profile</h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    Manage your account information and settings
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Profile Card */}
            <div className="lg:col-span-2">
              <div className="p-6 transition-all duration-300
                bg-white dark:bg-slate-800 
                border border-slate-200 dark:border-slate-700 
                rounded-lg shadow-lg">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Avatar Section */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="w-48 h-48 rounded-2xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg bg-white">
                        <img 
                          src={getAvatarUrl()} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = getDefaultAvatarUrl();
                          }}
                        />
                      </div>
                      
                      {editMode && (
                        <div className="absolute -bottom-3 -right-3 flex gap-2">
                          <button
                            onClick={handleAvatarClick}
                            disabled={uploading}
                            className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300"
                            title="Change photo"
                          >
                            {uploading ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                              <FaCamera className="text-lg" />
                            )}
                          </button>
                          
                          {hasCustomAvatar() && (
                            <button
                              onClick={handleDeleteAvatar}
                              className="p-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full shadow-lg shadow-red-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300"
                              title="Remove photo"
                            >
                              <FaTrash className="text-lg" />
                            </button>
                          )}
                        </div>
                      )}
                      
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAvatarUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                    
                    <div className="mt-6 text-center">
                      <div className="text-xl font-bold text-slate-900 dark:text-white break-words">
                        {displayUser.name}
                      </div>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRoleBadgeColor(displayUser.role)}`}>
                          {displayUser.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Profile Information */}
                  <div className="flex-1">
                    {!editMode && !passwordMode ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl border border-blue-200 dark:border-blue-800/30">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <FaUser className="text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-600 dark:text-slate-400">Full Name</p>
                                <p className="text-lg font-semibold text-slate-900 dark:text-white truncate">{displayUser.name}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 rounded-xl border border-green-200 dark:border-green-800/30">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <FaEnvelope className="text-green-600 dark:text-green-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-600 dark:text-slate-400">Email Address</p>
                                <p className="text-lg font-semibold text-slate-900 dark:text-white truncate" title={displayUser.email}>
                                  {displayUser.email}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10 rounded-xl border border-purple-200 dark:border-purple-800/30">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <FaPhone className="text-purple-600 dark:text-purple-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-600 dark:text-slate-400">Phone Number</p>
                                <p className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                                  {displayUser.phone ? formatPhoneNumber(displayUser.phone) : 'Not set'}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/10 rounded-xl border border-amber-200 dark:border-amber-800/30">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                <FaBriefcase className="text-amber-600 dark:text-amber-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-600 dark:text-slate-400">Role</p>
                                <p className="text-lg font-semibold text-slate-900 dark:text-white truncate">{displayUser.role}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/20 dark:to-slate-800/10 rounded-xl border border-slate-200 dark:border-slate-800/30">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                              <FaCalendarAlt className="text-slate-600 dark:text-slate-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-600 dark:text-slate-400">Account Created</p>
                              <p className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                                {new Date(displayUser.createdAt || Date.now()).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                          <button
                            onClick={() => setEditMode(true)}
                            className="px-6 py-3 rounded-lg font-medium transition-all duration-200
                              bg-gradient-to-r from-yellow-500 to-yellow-600 
                              text-white
                              hover:from-yellow-600 hover:to-yellow-700 
                              hover:shadow-lg hover:shadow-yellow-500/25
                              active:scale-[0.99]
                              flex items-center gap-2"
                          >
                            <FaEdit />
                            Edit Profile
                          </button>
                          
                          <button
                            onClick={() => setPasswordMode(true)}
                            className="px-6 py-3 rounded-lg font-medium transition-all duration-200
                              bg-white dark:bg-slate-800 
                              border border-slate-200 dark:border-slate-700 
                              text-amber-600 dark:text-amber-500 
                              hover:bg-slate-100 dark:hover:bg-slate-700 
                              hover:border-amber-500/50 dark:hover:border-amber-500/50
                              hover:text-amber-700 dark:hover:text-amber-400
                              flex items-center gap-2"
                          >
                            <FaKey />
                            Change Password
                          </button>
                        </div>
                      </div>
                    ) : passwordMode ? (
                      <form onSubmit={handlePasswordChange} className="space-y-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <FaLock className="text-amber-500" />
                          Change Password
                        </h3>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              Current Password
                            </label>
                            <div className="relative">
                              <input
                                type={showPassword ? "text" : "password"}
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                className="w-full p-3 rounded-lg transition-all duration-200
                                  bg-white dark:bg-slate-800 
                                  border border-slate-300 dark:border-slate-600 
                                  text-slate-700 dark:text-slate-300
                                  focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-500 
                                  focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-500/30 pl-10 pr-10"
                                placeholder="Enter current password"
                                required
                                autoComplete="current-password"
                              />
                              <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                              >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                              </button>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              New Password
                            </label>
                            <div className="relative">
                              <input
                                type={showNewPassword ? "text" : "password"}
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                className="w-full p-3 rounded-lg transition-all duration-200
                                  bg-white dark:bg-slate-800 
                                  border border-slate-300 dark:border-slate-600 
                                  text-slate-700 dark:text-slate-300
                                  focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-500 
                                  focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-500/30 pl-10 pr-10"
                                placeholder="Enter new password"
                                required
                                autoComplete="new-password"
                              />
                              <FaKey className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                              <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                              >
                                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                              </button>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              Password must be at least 6 characters
                            </p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              Confirm New Password
                            </label>
                            <div className="relative">
                              <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                className="w-full p-3 rounded-lg transition-all duration-200
                                  bg-white dark:bg-slate-800 
                                  border border-slate-300 dark:border-slate-600 
                                  text-slate-700 dark:text-slate-300
                                  focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-500 
                                  focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-500/30 pl-10 pr-10"
                                placeholder="Confirm new password"
                                required
                                autoComplete="new-password"
                              />
                              <FaKey className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                              >
                                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-3 pt-4">
                          <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 rounded-lg font-medium transition-all duration-200
                              bg-gradient-to-r from-green-500 to-green-600 
                              text-white
                              hover:from-green-600 hover:to-green-700 
                              hover:shadow-lg hover:shadow-green-500/25
                              active:scale-[0.99]
                              flex items-center gap-2 flex-1"
                          >
                            {loading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Updating...
                              </>
                            ) : (
                              <>
                                <FaSave />
                                Update Password
                              </>
                            )}
                          </button>
                          
                          <button
                            type="button"
                            onClick={handleCancel}
                            className="px-6 py-3 rounded-lg font-medium transition-all duration-200
                              bg-white dark:bg-slate-800 
                              border border-slate-200 dark:border-slate-700 
                              text-red-600 dark:text-red-500 
                              hover:bg-slate-100 dark:hover:bg-slate-700 
                              hover:border-red-500/50 dark:hover:border-red-500/50
                              hover:text-red-700 dark:hover:text-red-400
                              flex items-center gap-2"
                          >
                            <FaTimes />
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <form onSubmit={handleEdit} className="space-y-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <FaUser className="text-blue-500" />
                          Edit Profile Information
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              Full Name
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full p-3 rounded-lg transition-all duration-200
                                  bg-white dark:bg-slate-800 
                                  border border-slate-300 dark:border-slate-600 
                                  text-slate-700 dark:text-slate-300
                                  focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-500 
                                  focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-500/30 pl-10"
                                placeholder="Enter your name"
                                required
                                autoComplete="name"
                              />
                              <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              Email Address
                            </label>
                            <div className="relative">
                              <input
                                type="email"
                                value={formData.email}
                                disabled
                                className="w-full p-3 rounded-lg transition-all duration-200
                                  bg-slate-50 dark:bg-slate-800 
                                  border border-slate-300 dark:border-slate-600 
                                  text-slate-700 dark:text-slate-300
                                  cursor-not-allowed truncate pl-10"
                                autoComplete="email"
                                title={formData.email}
                              />
                              <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              Email cannot be changed (used for login)
                            </p>
                          </div>
                          
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              Phone Number
                            </label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <select
                                  value={formData.countryCode}
                                  onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                                  className="w-full p-3 rounded-lg transition-all duration-200
                                    bg-white dark:bg-slate-800 
                                    border border-slate-300 dark:border-slate-600 
                                    text-slate-700 dark:text-slate-300
                                    focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-500 
                                    focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-500/30 pr-10 appearance-none"
                                >
                                  {countryCodes.map((code) => (
                                    <option key={code.code} value={code.code}>
                                      {code.country}
                                    </option>
                                  ))}
                                </select>
                                <FaGlobe className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                              </div>
                              <div className="relative flex-1">
                                <input
                                  type="tel"
                                  value={formData.phone}
                                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                                  className="w-full p-3 rounded-lg transition-all duration-200
                                    bg-white dark:bg-slate-800 
                                    border border-slate-300 dark:border-slate-600 
                                    text-slate-700 dark:text-slate-300
                                    focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-500 
                                    focus:ring-2 focus:ring-yellow-500/20 dark:focus:ring-yellow-500/30 pl-10"
                                  placeholder="Phone number"
                                  autoComplete="tel"
                                />
                                <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-3 pt-4">
                          <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 rounded-lg font-medium transition-all duration-200
                              bg-gradient-to-r from-blue-500 to-blue-600 
                              text-white
                              hover:from-blue-600 hover:to-blue-700 
                              hover:shadow-lg hover:shadow-blue-500/25
                              active:scale-[0.99]
                              flex items-center gap-2 flex-1"
                          >
                            {loading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <FaSave />
                                Save Changes
                              </>
                            )}
                          </button>
                          
                          <button
                            type="button"
                            onClick={handleCancel}
                            className="px-6 py-3 rounded-lg font-medium transition-all duration-200
                              bg-white dark:bg-slate-800 
                              border border-slate-200 dark:border-slate-700 
                              text-red-600 dark:text-red-500 
                              hover:bg-slate-100 dark:hover:bg-slate-700 
                              hover:border-red-500/50 dark:hover:border-red-500/50
                              hover:text-red-700 dark:hover:text-red-400
                              flex items-center gap-2"
                          >
                            <FaTimes />
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Account Status */}
            <div className="space-y-6">
              {/* Account Status */}
              <div className="p-6 transition-all duration-300
                bg-white dark:bg-slate-800 
                border border-slate-200 dark:border-slate-700 
                rounded-lg shadow-lg">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Account Status</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/30">
                    <span className="text-slate-700 dark:text-slate-300">Account Status</span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full text-sm font-medium">
                      Active
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800/30">
                    <span className="text-slate-700 dark:text-slate-300">Email</span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full text-sm font-medium">
                      Verified
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800/30">
                    <span className="text-slate-700 dark:text-slate-300">Phone</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${displayPhone ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400'}`}>
                      {displayPhone ? 'Set' : 'Not Set'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Account Info */}
              <div className="p-6 transition-all duration-300
                bg-white dark:bg-slate-800 
                border border-slate-200 dark:border-slate-700 
                rounded-lg shadow-lg">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Account Information</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">User ID:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-300">
                      {displayUser._id ? displayUser._id.substring(0, 8) + '...' : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Member Since:</span>
                    <span className="text-slate-800 dark:text-slate-300">
                      {new Date(displayUser.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Last Updated:</span>
                    <span className="text-slate-800 dark:text-slate-300">
                      {new Date(displayUser.updatedAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}