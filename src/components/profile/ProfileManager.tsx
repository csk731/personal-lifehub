'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Mail, 
  MapPin, 
  Globe, 
  Phone, 
  Calendar, 
  Briefcase, 
  Building, 
  GraduationCap, 
  Settings, 
  Save, 
  X, 
  Camera, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  Edit3,
  Eye,
  EyeOff,
  Plus,
  Minus,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { getAuthHeaders } from '@/lib/utils';
import { TIMEZONE_OPTIONS, getDetectedTimezone, setUserTimezone } from '@/utils/timezone';
import { Button } from '../ui/Button';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  phone: string | null;
  date_of_birth: string | null;
  preferences: Record<string, any>;
  timezone: string;
  language: string;
  theme: string;
  notification_preferences: Record<string, any>;
  privacy_settings: Record<string, any>;
  social_links: Record<string, any>;
  skills: string[] | null;
  interests: string[] | null;
  occupation: string | null;
  company: string | null;
  education: string | null;
  last_active: string;
  profile_completion_percentage: number;
  created_at: string;
  updated_at: string;
}

interface ProfileFormData {
  full_name: string;
  bio: string;
  location: string;
  website: string;
  phone: string;
  date_of_birth: string;
  occupation: string;
  company: string;
  education: string;
  skills: string[];
  interests: string[];
  theme: string;
  language: string;
  timezone: string;
  notification_preferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy_settings: {
    profile_visible: boolean;
    show_email: boolean;
    show_phone: boolean;
  };
  social_links: {
    twitter: string;
    linkedin: string;
    github: string;
    instagram: string;
  };
}

export function ProfileManager() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: '',
    bio: '',
    location: '',
    website: '',
    phone: '',
    date_of_birth: '',
    occupation: '',
    company: '',
    education: '',
    skills: [],
    interests: [],
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
    notification_preferences: {
      email: true,
      push: true,
      sms: false,
    },
    privacy_settings: {
      profile_visible: true,
      show_email: false,
      show_phone: false,
    },
    social_links: {
      twitter: '',
      linkedin: '',
      github: '',
      instagram: '',
    },
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ProfileFormData, string>>>({});

  // Auto-save indicator
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [newSkill, setNewSkill] = useState('');
  const [newInterest, setNewInterest] = useState('');

  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch('/api/profile', { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const data = await response.json();
      setProfile(data.profile);
      
      // Populate form data
      setFormData({
        full_name: data.profile.full_name || '',
        bio: data.profile.bio || '',
        location: data.profile.location || '',
        website: data.profile.website || '',
        phone: data.profile.phone || '',
        date_of_birth: data.profile.date_of_birth || '',
        occupation: data.profile.occupation || '',
        company: data.profile.company || '',
        education: data.profile.education || '',
        skills: data.profile.skills || [],
        interests: data.profile.interests || [],
        theme: data.profile.theme || 'light',
        language: data.profile.language || 'en',
        timezone: data.profile.timezone || 'UTC',
        notification_preferences: data.profile.notification_preferences || {
          email: true,
          push: true,
          sms: false,
        },
        privacy_settings: data.profile.privacy_settings || {
          profile_visible: true,
          show_email: false,
          show_phone: false,
        },
        social_links: data.profile.social_links || {
          twitter: '',
          linkedin: '',
          github: '',
          instagram: '',
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Validation function
  const validateForm = (data: ProfileFormData) => {
    const errors: Partial<Record<keyof ProfileFormData, string>> = {};
    if (!data.full_name.trim()) {
      errors.full_name = 'Full name is required.';
    }
    if (data.website && !/^https?:\/\//.test(data.website)) {
      errors.website = 'Website must start with http:// or https://';
    }
    if (data.phone && !/^\+?[0-9\-() ]{7,}$/.test(data.phone)) {
      errors.phone = 'Invalid phone number.';
    }
    if (data.date_of_birth && isNaN(Date.parse(data.date_of_birth))) {
      errors.date_of_birth = 'Invalid date.';
    }
    // Add more validation as needed
    return errors;
  };

  // Track changes for auto-save indicator
  useEffect(() => {
    if (profile) {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        phone: profile.phone || '',
        date_of_birth: profile.date_of_birth || '',
        occupation: profile.occupation || '',
        company: profile.company || '',
        education: profile.education || '',
        skills: profile.skills || [],
        interests: profile.interests || [],
        theme: profile.theme || 'light',
        language: profile.language || 'en',
        timezone: profile.timezone || 'UTC',
        notification_preferences: profile.notification_preferences || {
          email: true,
          push: true,
          sms: false,
        },
        privacy_settings: profile.privacy_settings || {
          profile_visible: true,
          show_email: false,
          show_phone: false,
        },
        social_links: profile.social_links || {
          twitter: '',
          linkedin: '',
          github: '',
          instagram: '',
        },
      });
      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, profile]);

  const handleSave = async () => {
    const errors = validateForm(formData);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError('Please fix the errors in the form.');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const headers = await getAuthHeaders();
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          throw new Error('Failed to update profile');
        }
        // Enhanced error handling for server-side validation
        if (errorData.details && Array.isArray(errorData.details)) {
          const newFieldErrors: Partial<Record<keyof ProfileFormData, string>> = {};
          let unmappedErrors: string[] = [];
          errorData.details.forEach((msg: string) => {
            if (/full name/i.test(msg)) newFieldErrors.full_name = msg;
            else if (/website/i.test(msg)) newFieldErrors.website = msg;
            else if (/phone/i.test(msg)) newFieldErrors.phone = msg;
            else if (/date of birth|date/i.test(msg)) newFieldErrors.date_of_birth = msg;
            else if (/bio/i.test(msg)) newFieldErrors.bio = msg;
            else if (/location/i.test(msg)) newFieldErrors.location = msg;
            else if (/occupation/i.test(msg)) newFieldErrors.occupation = msg;
            else if (/company/i.test(msg)) newFieldErrors.company = msg;
            else if (/education/i.test(msg)) newFieldErrors.education = msg;
            else unmappedErrors.push(msg);
          });
          setFieldErrors(newFieldErrors);
          setError(unmappedErrors.length > 0 ? unmappedErrors.join(' ') : 'Please fix the errors in the form.');
        } else {
        throw new Error(errorData.error || 'Failed to update profile');
      }
        setSaving(false);
        return;
      }
      const data = await response.json();
      setProfile(data.profile);
      setSuccess(data.message || 'Profile updated successfully');
      setFieldErrors({});
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setSaving(true);
      const headers = await getAuthHeaders();
      const response = await fetch('/api/profile', {
        method: 'DELETE',
        headers,
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete account');
      }
      
      // Redirect to auth page after successful deletion
      router.push('/auth');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof ProfileFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (parent: keyof ProfileFormData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }));
  };

  const addArrayItem = (field: 'skills' | 'interests', value: string) => {
    if (value && value.trim() && !formData[field].includes(value.trim())) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()],
      }));
    }
  };

  const removeArrayItem = (field: 'skills' | 'interests', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center min-h-[400px]"
      >
        <div className="text-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"
          ></motion.div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </motion.div>
    );
  }

  if (!profile) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
          <div className="text-red-500 mb-4">
          <AlertCircle className="w-12 h-12 mx-auto mb-2" />
          <p className="text-lg font-medium">Failed to load profile</p>
          </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
            onClick={fetchProfile}
          className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
          Try Again
        </motion.button>
      </motion.div>
    );
  }

  const hasErrors = Object.keys(fieldErrors).length > 0;
  const errorCount = Object.keys(fieldErrors).length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-6"
    >
        {/* Header */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Profile Settings</h1>
        <p className="text-gray-600 text-sm">Manage your personal information and preferences</p>
      </motion.div>

      {/* Error Summary */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl"
          >
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-800 font-medium text-sm">{error}</p>
                {hasErrors && (
                  <p className="text-red-600 text-xs mt-1">
                    {errorCount} field{errorCount !== 1 ? 's' : ''} need{errorCount !== 1 ? '' : 's'} attention
                  </p>
              )}
            </div>
          </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message */}
      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl"
          >
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-green-800 font-medium text-sm">{success}</p>
          </div>
          </motion.div>
        )}
      </AnimatePresence>

            <div className="space-y-6">
        {/* Basic Information */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="w-4 h-4 mr-2 text-blue-600" />
                Basic Information
          </h2>
              
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="space-y-1"
            >
              <label className="block text-sm font-medium text-gray-800">
                  Full Name *
                </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 text-sm ${
                    fieldErrors.full_name ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  placeholder="Enter your full name"
                />
                {fieldErrors.full_name && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-600 text-xs mt-1 flex items-center"
                  >
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {fieldErrors.full_name}
                  </motion.p>
                )}
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="space-y-1"
            >
              <label className="block text-sm font-medium text-gray-800">
                Email *
                </label>
              <div className="relative">
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 text-sm ${
                    fieldErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  placeholder="Enter your email"
                />
                {fieldErrors.email && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-600 text-xs mt-1 flex items-center"
                  >
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {fieldErrors.email}
                  </motion.p>
                )}
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="space-y-1"
            >
              <label className="block text-sm font-medium text-gray-800">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 text-sm ${
                    fieldErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  placeholder="Enter your phone number"
                />
                {fieldErrors.phone && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-600 text-xs mt-1 flex items-center"
                  >
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {fieldErrors.phone}
                  </motion.p>
                )}
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="space-y-1"
            >
              <label className="block text-sm font-medium text-gray-800">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white text-sm"
              />
            </motion.div>
          </div>
        </motion.section>

        {/* Additional Information */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Edit3 className="w-4 h-4 mr-2 text-purple-600" />
            Additional Information
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="space-y-1 lg:col-span-2"
            >
              <label className="block text-sm font-medium text-gray-800">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none text-gray-900 placeholder-gray-400 bg-white text-sm"
                  placeholder="Tell us about yourself..."
                />
            </motion.div>

            <div className="space-y-4">
              <motion.div 
                whileHover={{ scale: 1.01 }}
                className="space-y-1"
              >
                <label className="block text-sm font-medium text-gray-800">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 bg-white text-sm"
                    placeholder="Enter your location"
                />
              </div>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.01 }}
                className="space-y-1"
              >
                <label className="block text-sm font-medium text-gray-800">
                  Website
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                    className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 text-sm ${
                      fieldErrors.website ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                    }`}
                    placeholder="https://your-website.com"
                />
                  {fieldErrors.website && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-600 text-xs mt-1 flex items-center"
                    >
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {fieldErrors.website}
                    </motion.p>
                  )}
              </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Skills & Interests */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills & Interests</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Skills */}
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="space-y-3"
            >
              <label className="block text-sm font-medium text-gray-800">
                Skills
                </label>
              <div className="space-y-2">
                <div className="flex space-x-2">
                <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addArrayItem('skills', newSkill)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 bg-white text-sm"
                    placeholder="Add a skill..."
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addArrayItem('skills', newSkill)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Add
                  </motion.button>
              </div>
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence>
                    {(formData.skills || []).map((skill, index) => (
                      <motion.span
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                      >
                        {skill}
                        <motion.button
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.8 }}
                          onClick={() => removeArrayItem('skills', index)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-3 h-3" />
                        </motion.button>
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* Interests */}
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="space-y-3"
            >
              <label className="block text-sm font-medium text-gray-800">
                Interests
                </label>
              <div className="space-y-2">
                <div className="flex space-x-2">
                <input
                    type="text"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addArrayItem('interests', newInterest)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 bg-white text-sm"
                    placeholder="Add an interest..."
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addArrayItem('interests', newInterest)}
                    className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    Add
                  </motion.button>
              </div>
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence>
                    {(formData.interests || []).map((interest, index) => (
                      <motion.span
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs"
                      >
                        {interest}
                        <motion.button
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.8 }}
                          onClick={() => removeArrayItem('interests', index)}
                          className="ml-1 text-purple-600 hover:text-purple-800"
                        >
                          <X className="w-3 h-3" />
                        </motion.button>
                      </motion.span>
                    ))}
                  </AnimatePresence>
            </div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Professional Information & Social Links */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Professional Information */}
              <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Briefcase className="w-4 h-4 mr-2 text-green-600" />
                Professional Information
              </h2>
              
              <div className="space-y-3">
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  className="space-y-1"
                >
                  <label className="block text-sm font-medium text-gray-800">
                  Occupation
                </label>
                <input
                  type="text"
                  value={formData.occupation}
                  onChange={(e) => handleInputChange('occupation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 bg-white text-sm"
                    placeholder="Enter your job title"
                />
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  className="space-y-1"
                >
                  <label className="block text-sm font-medium text-gray-800">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 bg-white text-sm"
                    placeholder="Enter your company name"
                />
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  className="space-y-1"
                >
                  <label className="block text-sm font-medium text-gray-800">
                  Education
                </label>
                <input
                  type="text"
                  value={formData.education}
                  onChange={(e) => handleInputChange('education', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 bg-white text-sm"
                    placeholder="Enter your education background"
                />
                </motion.div>
              </div>
              </div>

            {/* Social Links */}
              <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Globe className="w-4 h-4 mr-2 text-indigo-600" />
                Social Links
              </h2>
              
              <div className="space-y-3">
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  className="space-y-1"
                >
                  <label className="block text-sm font-medium text-gray-800">
                    Twitter
                </label>
                  <input
                    type="url"
                    value={formData.social_links.twitter}
                    onChange={(e) => handleNestedChange('social_links', 'twitter', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 bg-white text-sm"
                    placeholder="https://twitter.com/username"
                  />
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  className="space-y-1"
                >
                  <label className="block text-sm font-medium text-gray-800">
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    value={formData.social_links.linkedin}
                    onChange={(e) => handleNestedChange('social_links', 'linkedin', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 bg-white text-sm"
                    placeholder="https://linkedin.com/in/username"
                  />
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  className="space-y-1"
                >
                  <label className="block text-sm font-medium text-gray-800">
                    GitHub
                  </label>
                  <input
                    type="url"
                    value={formData.social_links.github}
                    onChange={(e) => handleNestedChange('social_links', 'github', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 bg-white text-sm"
                    placeholder="https://github.com/username"
                  />
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  className="space-y-1"
                >
                  <label className="block text-sm font-medium text-gray-800">
                    Instagram
                  </label>
                  <input
                    type="url"
                    value={formData.social_links.instagram}
                    onChange={(e) => handleNestedChange('social_links', 'instagram', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 bg-white text-sm"
                    placeholder="https://instagram.com/username"
                  />
                </motion.div>
                </div>
              </div>
          </div>
        </motion.section>

        {/* Preferences & Privacy Settings */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Preferences */}
              <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="w-4 h-4 mr-2 text-orange-600" />
                Preferences
              </h2>
              
              <div className="space-y-4">
                {/* Appearance */}
                <div className="space-y-2">
                  <h3 className="text-base font-medium text-gray-900">Appearance</h3>
                  
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">
                  Theme
                </label>
                <select
                  value={formData.theme}
                  onChange={(e) => handleInputChange('theme', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white text-sm"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>

              <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">
                  Language
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white text-sm"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
          </div>

              <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">
                        Timezone
                </label>
                      <select
                        value={formData.timezone}
                        onChange={(e) => handleInputChange('timezone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white text-sm"
                      >
                        {TIMEZONE_OPTIONS.map((tz) => (
                          <option key={tz.value} value={tz.value}>
                            {tz.label}
                          </option>
                        ))}
                      </select>
                  </div>
                </div>
              </div>

                {/* Notifications */}
                <div className="space-y-2">
                  <h3 className="text-base font-medium text-gray-900">Notifications</h3>
                  
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={formData.notification_preferences.email}
                        onChange={(e) => handleNestedChange('notification_preferences', 'email', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-gray-800 text-sm">Email notifications</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                        checked={formData.notification_preferences.push}
                        onChange={(e) => handleNestedChange('notification_preferences', 'push', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                      <span className="text-gray-800 text-sm">Push notifications</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.notification_preferences.sms}
                        onChange={(e) => handleNestedChange('notification_preferences', 'sms', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-gray-800 text-sm">SMS notifications</span>
                  </label>
                </div>
                </div>
            </div>
          </div>

          {/* Privacy Settings */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Eye className="w-4 h-4 mr-2 text-teal-600" />
              Privacy Settings
              </h2>
              
            <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                    checked={formData.privacy_settings.profile_visible}
                    onChange={(e) => handleNestedChange('privacy_settings', 'profile_visible', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-800 text-sm">Make my profile visible to other users</span>
                  </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.privacy_settings.show_email}
                    onChange={(e) => handleNestedChange('privacy_settings', 'show_email', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-800 text-sm">Show my email address on my profile</span>
                  </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.privacy_settings.show_phone}
                    onChange={(e) => handleNestedChange('privacy_settings', 'show_phone', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-800 text-sm">Show my phone number on my profile</span>
                </label>
                </div>
            </div>
          </div>
        </motion.section>

        {/* Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving || hasErrors}
            className={`flex items-center justify-center space-x-2 px-6 py-2 rounded-lg font-semibold transition-all duration-300 text-sm ${
              saving || hasErrors
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/25'
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>
                  Save Changes
                  {hasErrors && ` (${errorCount} error${errorCount !== 1 ? 's' : ''})`}
                </span>
              </>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
              onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center justify-center space-x-2 px-6 py-2 border border-red-300 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-all duration-300 text-sm"
            >
              <Trash2 className="w-4 h-4" />
            <span>Delete Account</span>
          </motion.button>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
      {showDeleteConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
            <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Account</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
              </p>
                <div className="flex space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-800 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  onClick={handleDeleteAccount}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                >
                    Delete
                  </motion.button>
              </div>
            </div>
            </motion.div>
          </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
} 