'use client';

import { useState, useEffect } from 'react';
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
  Clock
} from 'lucide-react';
import { getAuthHeaders } from '@/lib/utils';
import { TIMEZONE_OPTIONS, getDetectedTimezone, setUserTimezone } from '@/utils/timezone';

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
      window.location.href = '/auth';
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
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <p className="text-lg font-medium">Profile not found</p>
          </div>
          <button 
            onClick={fetchProfile}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-6">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                  {profile.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Avatar" 
                      className="w-20 h-20 rounded-full object-cover border-4 border-white"
                    />
                  ) : (
                    <User className="w-10 h-10 text-white" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {profile.full_name || 'Complete Your Profile'}
                </h1>
                <p className="text-gray-600 mb-3 flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  {profile.email}
                </p>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getCompletionColor(profile.profile_completion_percentage)}`}></div>
                    <span className="text-sm text-gray-600 font-medium">
                      {profile.profile_completion_percentage}% Complete
                    </span>
                  </div>
                  {hasUnsavedChanges && (
                    <span className="text-sm text-orange-600 flex items-center">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></div>
                      Unsaved changes
                    </span>
                  )}
                  {lastSaved && !hasUnsavedChanges && (
                    <span className="text-sm text-green-600 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Last saved {lastSaved.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ease-out ${
                profile.profile_completion_percentage >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                profile.profile_completion_percentage >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 
                'bg-gradient-to-r from-red-500 to-pink-500'
              }`}
              style={{ width: `${profile.profile_completion_percentage}%` }}
            ></div>
          </div>
        </div>

        {/* Enhanced Error Display - More Prominent */}
        {error && (
          <div className="bg-red-50 border-2 border-red-400 text-red-700 px-6 py-4 rounded-lg mb-6 flex items-center space-x-3 shadow-lg">
            <AlertTriangle className="w-6 h-6 flex-shrink-0 text-red-500" />
            <div className="flex-1">
              <p className="font-semibold text-red-800">Please fix the following errors:</p>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Error Summary - Show field errors prominently */}
        {Object.keys(fieldErrors).length > 0 && (
          <div className="bg-orange-50 border-2 border-orange-400 text-orange-700 px-6 py-4 rounded-lg mb-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-3">
              <AlertTriangle className="w-6 h-6 flex-shrink-0 text-orange-500" />
              <p className="font-semibold text-orange-800">
                {Object.keys(fieldErrors).length} field{Object.keys(fieldErrors).length > 1 ? 's' : ''} need{Object.keys(fieldErrors).length > 1 ? '' : 's'} attention:
              </p>
            </div>
            <ul className="list-disc list-inside space-y-1 text-orange-700">
              {Object.entries(fieldErrors).map(([field, message]) => (
                <li key={field} className="text-sm">
                  <span className="font-medium capitalize">{field.replace('_', ' ')}:</span> {message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 text-green-700 px-6 py-4 rounded-lg mb-6 flex items-center space-x-3 shadow-sm">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{success}</span>
            <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Form */}
        <form className="bg-white rounded-xl shadow-lg p-6 md:p-8 border border-gray-100" onSubmit={e => { e.preventDefault(); handleSave(); }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Basic Info */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-3 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Basic Information
              </h3>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700" htmlFor="full_name">
                  Full Name *
                </label>
                <input
                  id="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  aria-invalid={!!fieldErrors.full_name}
                  aria-describedby={fieldErrors.full_name ? 'full_name-error' : undefined}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    fieldErrors.full_name 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="Enter your full name"
                />
                {fieldErrors.full_name && (
                  <p className="text-sm text-red-600 flex items-center" id="full_name-error">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {fieldErrors.full_name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700" htmlFor="bio">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 resize-none"
                  placeholder="Tell us about yourself..."
                />
                <p className="text-xs text-gray-500">Share your story, interests, or what you're passionate about.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700" htmlFor="location">
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                  placeholder="City, Country"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700" htmlFor="website">
                  Website
                </label>
                <input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  aria-invalid={!!fieldErrors.website}
                  aria-describedby={fieldErrors.website ? 'website-error' : undefined}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    fieldErrors.website 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="https://yourwebsite.com"
                />
                {fieldErrors.website && (
                  <p className="text-sm text-red-600 flex items-center" id="website-error">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {fieldErrors.website}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700" htmlFor="phone">
                  Phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  aria-invalid={!!fieldErrors.phone}
                  aria-describedby={fieldErrors.phone ? 'phone-error' : undefined}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    fieldErrors.phone 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="+1 (555) 123-4567"
                />
                {fieldErrors.phone && (
                  <p className="text-sm text-red-600 flex items-center" id="phone-error">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {fieldErrors.phone}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700" htmlFor="date_of_birth">
                  Date of Birth
                </label>
                <input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  aria-invalid={!!fieldErrors.date_of_birth}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.date_of_birth ? 'border-red-500' : 'border-gray-300'}`}
                />
                {fieldErrors.date_of_birth && (
                  <p className="mt-1 text-xs text-red-600" id="date_of_birth-error">{fieldErrors.date_of_birth}</p>
                )}
              </div>
            </div>

            {/* Right Column - Professional & Preferences */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Professional & Preferences
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Occupation
                </label>
                <input
                  type="text"
                  value={formData.occupation}
                  onChange={(e) => handleInputChange('occupation', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="Software Engineer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="Company Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Education
                </label>
                <input
                  type="text"
                  value={formData.education}
                  onChange={(e) => handleInputChange('education', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="University, Degree"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Timezone</span>
                  </div>
                </label>
                <div className="space-y-2">
                  <select
                    value={formData.timezone}
                    onChange={(e) => {
                      handleInputChange('timezone', e.target.value);
                      setUserTimezone(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    {TIMEZONE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={(e) => {
                      const detected = getDetectedTimezone();
                      handleInputChange('timezone', detected);
                      setUserTimezone(detected);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                  >
                    <Clock className="w-3 h-3" />
                    <span>Auto-detect from system</span>
                  </button>
                  <p className="text-xs text-gray-500">
                    Current: {new Date().toLocaleString('en-US', { 
                      timeZone: formData.timezone,
                      timeZoneName: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Theme
                </label>
                <select
                  value={formData.theme}
                  onChange={(e) => handleInputChange('theme', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                  <option value="ru">Russian</option>
                  <option value="zh">Chinese</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                </select>
              </div>
            </div>
          </div>

          {/* Skills & Interests - Fixed Removal Buttons */}
          <div className="mt-8 space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-3 flex items-center">
              <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
              Skills & Interests
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Skills
                </label>
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Add a skill"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const target = e.target as HTMLInputElement;
                          if (target.value.trim()) {
                            addArrayItem('skills', target.value);
                            target.value = '';
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        if (input.value.trim()) {
                          addArrayItem('skills', input.value);
                          input.value = '';
                        }
                      }}
                      className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => removeArrayItem('skills', index)}
                          className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Interests
                </label>
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Add an interest"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const target = e.target as HTMLInputElement;
                          if (target.value.trim()) {
                            addArrayItem('interests', target.value);
                            target.value = '';
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        if (input.value.trim()) {
                          addArrayItem('interests', input.value);
                          input.value = '';
                        }
                      }}
                      className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                      >
                        <span>{interest}</span>
                        <button
                          type="button"
                          onClick={() => removeArrayItem('interests', index)}
                          className="text-green-600 hover:text-green-800 transition-colors p-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="mt-8 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Notification Preferences
            </h3>
            <div className="space-y-3">
              {Object.entries(formData.notification_preferences).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 capitalize">
                    {key.replace('_', ' ')} notifications
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handleNestedChange('notification_preferences', key, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="mt-8 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Privacy Settings
            </h3>
            <div className="space-y-3">
              {Object.entries(formData.privacy_settings).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 capitalize">
                    {key.replace('_', ' ')}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handleNestedChange('privacy_settings', key, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Social Links */}
          <div className="mt-8 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Social Links
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(formData.social_links).map(([platform, url]) => (
                <div key={platform}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                    {platform}
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => handleNestedChange('social_links', platform, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    placeholder={`https://${platform}.com/username`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced Save Button with Error Count */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              {Object.keys(fieldErrors).length > 0 && (
                <div className="flex items-center space-x-2 text-orange-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {Object.keys(fieldErrors).length} error{Object.keys(fieldErrors).length > 1 ? 's' : ''} to fix
                  </span>
                </div>
              )}
              {hasUnsavedChanges && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm">Unsaved changes</span>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={saving || Object.keys(fieldErrors).length > 0}
              className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>
                    {Object.keys(fieldErrors).length > 0 
                      ? `Fix ${Object.keys(fieldErrors).length} Error${Object.keys(fieldErrors).length > 1 ? 's' : ''}` 
                      : 'Save Changes'
                    }
                  </span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Delete Account Section */}
        <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-red-900">Delete Account</h3>
              <p className="text-sm text-red-700 mt-1">
                This action cannot be undone. All your data will be permanently deleted.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Account</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 