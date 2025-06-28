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
  Loader2,
  Target,
  Bell
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

interface ProfileManagerProps {
  initialProfile?: Profile;
}

export function ProfileManager({ initialProfile }: ProfileManagerProps) {
  const [profile, setProfile] = useState<Profile | null>(initialProfile || null);
  const [loading, setLoading] = useState(!initialProfile);
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

  // Initialize form data when profile is provided
  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
      setFormData({
        full_name: initialProfile.full_name || '',
        bio: initialProfile.bio || '',
        location: initialProfile.location || '',
        website: initialProfile.website || '',
        phone: initialProfile.phone || '',
        date_of_birth: initialProfile.date_of_birth || '',
        occupation: initialProfile.occupation || '',
        company: initialProfile.company || '',
        education: initialProfile.education || '',
        skills: initialProfile.skills || [],
        interests: initialProfile.interests || [],
        theme: initialProfile.theme || 'light',
        language: initialProfile.language || 'en',
        timezone: initialProfile.timezone || 'UTC',
        notification_preferences: initialProfile.notification_preferences || {
          email: true,
          push: true,
          sms: false,
        },
        privacy_settings: initialProfile.privacy_settings || {
          profile_visible: true,
          show_email: false,
          show_phone: false,
        },
        social_links: {
          twitter: initialProfile.social_links?.twitter || '',
          linkedin: initialProfile.social_links?.linkedin || '',
          github: initialProfile.social_links?.github || '',
          instagram: initialProfile.social_links?.instagram || '',
        },
      });
    }
  }, [initialProfile]);

  // Only fetch profile if no initial data is provided
  useEffect(() => {
    if (!initialProfile) {
      fetchProfile();
    }
  }, [initialProfile]);

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
        social_links: {
          twitter: data.profile.social_links?.twitter || '',
          linkedin: data.profile.social_links?.linkedin || '',
          github: data.profile.social_links?.github || '',
          instagram: data.profile.social_links?.instagram || '',
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
      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
        // Scroll to top to show error message
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const data = await response.json();
      setProfile(data.profile);
      setSuccess(data.message || 'Profile updated successfully');
      setFieldErrors({});
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
      
      // Clear the input field after adding
      if (field === 'skills') {
        setNewSkill('');
      } else if (field === 'interests') {
        setNewInterest('');
      }
    }
  };

  const removeArrayItem = (field: 'skills' | 'interests', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

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
      className="space-y-8"
    >
      {/* Error Summary */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-4"
          >
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
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
            className="bg-green-50 border border-green-200 rounded-2xl p-4"
          >
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-green-800 font-medium text-sm">{success}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Basic Information */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
          >
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
                <p className="text-gray-600 text-sm">Your personal details and contact information</p>
              </div>
            </div>
              
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 ${
                    fieldErrors.full_name ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                  }`}
                  placeholder="Enter your full name"
                />
                {fieldErrors.full_name && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-600 text-xs flex items-center"
                  >
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {fieldErrors.full_name}
                  </motion.p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed"
                  placeholder="Enter your email"
                />
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 ${
                    fieldErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                  }`}
                  placeholder="Enter your phone number"
                />
                {fieldErrors.phone && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-600 text-xs flex items-center"
                  >
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {fieldErrors.phone}
                  </motion.p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 bg-gray-50"
                  placeholder="Enter your location"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 ${
                    fieldErrors.website ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                  }`}
                  placeholder="https://your-website.com"
                />
                {fieldErrors.website && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-600 text-xs flex items-center"
                  >
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {fieldErrors.website}
                  </motion.p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 bg-gray-50 resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>
          </motion.section>

          {/* Professional Information */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
          >
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                <Briefcase className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Professional Information</h2>
                <p className="text-gray-600 text-sm">Your work and educational background</p>
              </div>
            </div>
              
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Occupation
                </label>
                <input
                  type="text"
                  value={formData.occupation}
                  onChange={(e) => handleInputChange('occupation', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 bg-gray-50"
                  placeholder="e.g., Software Engineer"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 bg-gray-50"
                  placeholder="e.g., Apple Inc."
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Education
                </label>
                <input
                  type="text"
                  value={formData.education}
                  onChange={(e) => handleInputChange('education', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 bg-gray-50"
                  placeholder="e.g., Bachelor's in Computer Science"
                />
              </div>
            </div>
          </motion.section>

          {/* Social Links */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
          >
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mr-4">
                <Globe className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Social Links</h2>
                <p className="text-gray-600 text-sm">Your social media and professional profiles</p>
              </div>
            </div>
              
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Twitter
                </label>
                <input
                  type="url"
                  value={formData.social_links.twitter}
                  onChange={(e) => handleNestedChange('social_links', 'twitter', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 bg-gray-50"
                  placeholder="https://twitter.com/username"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  LinkedIn
                </label>
                <input
                  type="url"
                  value={formData.social_links.linkedin}
                  onChange={(e) => handleNestedChange('social_links', 'linkedin', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 bg-gray-50"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  GitHub
                </label>
                <input
                  type="url"
                  value={formData.social_links.github}
                  onChange={(e) => handleNestedChange('social_links', 'github', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 bg-gray-50"
                  placeholder="https://github.com/username"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Instagram
                </label>
                <input
                  type="url"
                  value={formData.social_links.instagram}
                  onChange={(e) => handleNestedChange('social_links', 'instagram', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 bg-gray-50"
                  placeholder="https://instagram.com/username"
                />
              </div>
            </div>
          </motion.section>

          {/* Skills & Interests */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
          >
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Skills & Interests</h2>
                <p className="text-gray-600 text-sm">Your expertise and hobbies</p>
              </div>
            </div>
              
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Skills
                  </label>
                  <button
                    onClick={() => addArrayItem('skills', newSkill)}
                    disabled={!newSkill.trim()}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addArrayItem('skills', newSkill)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 bg-gray-50"
                    placeholder="Add a skill..."
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {skill}
                      <button
                        onClick={() => removeArrayItem('skills', index)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.span>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Interests
                  </label>
                  <button
                    onClick={() => addArrayItem('interests', newInterest)}
                    disabled={!newInterest.trim()}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addArrayItem('interests', newInterest)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 bg-gray-50"
                    placeholder="Add an interest..."
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.interests.map((interest, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                    >
                      {interest}
                      <button
                        onClick={() => removeArrayItem('interests', index)}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.span>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Profile Completion */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
          >
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                <CheckCircle className="w-4 h-4 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Profile Completion</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completion</span>
                <span className="text-sm font-medium text-gray-900">{profile.profile_completion_percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getCompletionColor(profile.profile_completion_percentage)}`}
                  style={{ width: `${profile.profile_completion_percentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">
                Complete your profile to unlock additional features
              </p>
            </div>
          </motion.section>

          {/* Preferences */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
          >
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                <Settings className="w-4 h-4 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Preferences</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Theme
                </label>
                <select
                  value={formData.theme}
                  onChange={(e) => handleInputChange('theme', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-gray-50"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Language
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-gray-50"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Timezone
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-gray-50"
                >
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.section>

          {/* Privacy Settings */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
          >
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
                <Eye className="w-4 h-4 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Privacy Settings</h3>
            </div>
            
            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.privacy_settings.profile_visible}
                  onChange={(e) => handleNestedChange('privacy_settings', 'profile_visible', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700 text-sm">Make my profile visible to other users</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.privacy_settings.show_email}
                  onChange={(e) => handleNestedChange('privacy_settings', 'show_email', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700 text-sm">Show my email address on my profile</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.privacy_settings.show_phone}
                  onChange={(e) => handleNestedChange('privacy_settings', 'show_phone', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700 text-sm">Show my phone number on my profile</span>
              </label>
            </div>
          </motion.section>

          {/* Notification Preferences */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
          >
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                <Bell className="w-4 h-4 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            </div>
            
            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notification_preferences.email}
                  onChange={(e) => handleNestedChange('notification_preferences', 'email', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700 text-sm">Email notifications</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notification_preferences.push}
                  onChange={(e) => handleNestedChange('notification_preferences', 'push', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700 text-sm">Push notifications</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notification_preferences.sms}
                  onChange={(e) => handleNestedChange('notification_preferences', 'sms', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700 text-sm">SMS notifications</span>
              </label>
            </div>
          </motion.section>

          {/* Save Button */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="sticky top-8"
          >
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
            
            {lastSaved && (
              <p className="text-xs text-gray-500 text-center mt-2">
                Last saved: {lastSaved.toLocaleTimeString()}
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
} 