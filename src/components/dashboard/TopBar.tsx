'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { LogOut, HelpCircle, X, Home as HomeIcon, User, Settings, ChevronDown } from 'lucide-react';
import { getAuthHeaders } from '@/lib/utils';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '../ui/Skeleton';

export function TopBar({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn) fetchProfile();
  }, [isLoggedIn]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    }
    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileDropdown]);

  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      const headers = await getAuthHeaders();
      
      // Check if we have a valid authorization header
      const authHeader = 'Authorization' in headers ? headers.Authorization : null;
      if (!authHeader) {
        setProfileLoading(false);
        return;
      }
      
      const response = await fetch('/api/profile', { headers });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
      } else {
        console.error('Failed to fetch profile:', response.status);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      <div className="fixed top-0 left-0 w-full z-40 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <motion.div 
            className="flex items-center select-none"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Link href="/dashboard" className="flex items-center">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <svg 
                  viewBox="0 0 24 24" 
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span className="ml-3 text-lg font-medium text-gray-900 tracking-tight">
                LifeHub
              </span>
            </Link>
          </motion.div>
          
          {/* Navigation */}
          <div className="flex items-center space-x-6">
            {isLoggedIn ? (
              <>
                {/* Home Link */}
                <Link 
                  href="/dashboard" 
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium"
                >
                  Home
                </Link>
                
                {/* Help Button */}
                <button
                  onClick={() => setShowHelpModal(true)}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium"
                >
                  Help
                </button>
                
                {/* Profile Dropdown */}
                <div className="relative" ref={profileDropdownRef}>
                  {profileLoading ? (
                    <div className="flex items-center space-x-2">
                      <Skeleton variant="circular" width={24} height={24} />
                      <Skeleton variant="text" width={60} height={16} />
                      <Skeleton variant="circular" width={12} height={12} />
                    </div>
                  ) : (
                    <>
                      <button
                        className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium"
                        onClick={() => setShowProfileDropdown(v => !v)}
                        aria-haspopup="true"
                        aria-expanded={showProfileDropdown}
                      >
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                          {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Avatar" className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <span className="text-xs text-gray-600 font-medium">
                              {profile?.full_name?.charAt(0) || 'U'}
                            </span>
                          )}
                        </div>
                        <span>{profile?.full_name?.split(' ')[0] || 'User'}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showProfileDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      
                      <AnimatePresence>
                        {showProfileDropdown && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
                          >
                            {/* Profile Info */}
                            <div className="px-4 py-3 border-b border-gray-100">
                              <p className="text-sm font-medium text-gray-900">{profile?.full_name || 'User'}</p>
                              <p className="text-xs text-gray-500">{profile?.email || ''}</p>
                            </div>
                            
                            {/* Menu Items */}
                            <div className="py-1">
                              <button
                                className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                                onClick={() => { setShowProfileDropdown(false); router.push('/dashboard/profile'); }}
                              >
                                <User className="w-4 h-4" />
                                <span>Profile</span>
                              </button>
                              
                              <div className="border-t border-gray-100 my-1"></div>
                              
                              <button
                                className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                                onClick={handleSignOut}
                              >
                                <LogOut className="w-4 h-4" />
                                <span>Sign Out</span>
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>
              </>
            ) : (
              <Link 
                href="/auth" 
                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors duration-200 text-sm"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelpModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            >
              <button
                onClick={() => setShowHelpModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                aria-label="Close help modal"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Help & Support
              </h2>
              
              <div className="text-gray-600 text-sm space-y-4">
                <p>Welcome to LifeHub! Here are some tips to get you started:</p>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Use the navigation menu to switch between different sections</span>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Subscribe to services to customize your dashboard experience</span>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Click on your profile to access settings and preferences</span>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Use search and filters to find what you need quickly</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center">
                  Need more help? Contact support at help@lifehub.com
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 