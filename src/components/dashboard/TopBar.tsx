'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { LogOut, HelpCircle, X, Home as HomeIcon, User } from 'lucide-react';
import { getAuthHeaders } from '@/lib/utils';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export function TopBar({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [profile, setProfile] = useState<any>(null);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch profile data from your API
        const response = await fetch('/api/profile', {
          headers: {
            'Authorization': `Bearer ${user.access_token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setProfile(data.profile);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 w-full z-40 border-b border-white/20 px-4 py-3 flex items-center justify-between bg-white/80 backdrop-blur-xl shadow-lg min-w-[320px]"
      >
        <motion.div 
          className="flex items-center space-x-3 select-none min-w-0"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="flex-shrink-0"
          >
            <Image src="/file.svg" alt="LifeHub Logo" width={32} height={32} />
          </motion.div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
            LifeHub
          </span>
        </motion.div>
        
        <div className="flex items-center space-x-2 md:space-x-4 min-w-0">
          {isLoggedIn ? (
            <>
              {/* Home Button */}
              <motion.div 
                className="relative group flex-shrink-0"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/dashboard" title="Home" className="p-2 rounded-xl hover:bg-white/50 transition-all duration-300 block backdrop-blur-sm min-w-[40px] min-h-[40px] flex items-center justify-center" aria-label="Home">
                  <HomeIcon className="w-6 h-6 text-gray-700 group-hover:text-blue-600 transition-colors duration-300" />
                  <span className="sr-only">Home</span>
                </Link>
                <motion.span 
                  initial={{ opacity: 0, y: 10 }}
                  whileHover={{ opacity: 1, y: 0 }}
                  className="absolute left-1/2 top-full mt-2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 pointer-events-none whitespace-nowrap z-50 shadow-xl"
                >
                  Home
                </motion.span>
              </motion.div>
              
              {/* Help Button */}
              <motion.div 
                className="relative group flex-shrink-0"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <button
                  onClick={() => setShowHelpModal(true)}
                  className="p-2 rounded-xl hover:bg-white/50 transition-all duration-300 group min-w-[40px] min-h-[40px] flex items-center justify-center"
                  title="Help"
                  aria-label="Show help"
                >
                  <HelpCircle className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors duration-300" />
                </button>
                <motion.span 
                  initial={{ opacity: 0, y: 10 }}
                  whileHover={{ opacity: 1, y: 0 }}
                  className="absolute left-1/2 top-full mt-2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 pointer-events-none whitespace-nowrap z-50 shadow-xl"
                >
                  Help
                </motion.span>
              </motion.div>
              
              {/* Profile Dropdown */}
              <motion.div 
                className="relative flex-shrink-0" 
                ref={profileDropdownRef}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <button
                  className="flex items-center space-x-2 p-2 rounded-xl hover:bg-white/50 transition-all duration-300 group focus:outline-none min-w-[80px]"
                  onClick={() => setShowProfileDropdown(v => !v)}
                  aria-haspopup="true"
                  aria-expanded={showProfileDropdown}
                  aria-label="Open profile menu"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0"
                  >
                    <User className="w-4 h-4 text-white" />
                  </motion.div>
                  <motion.svg 
                    animate={{ rotate: showProfileDropdown ? 180 : 0 }}
                    className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors duration-300 flex-shrink-0" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </motion.svg>
                </button>
                
                <AnimatePresence>
                  {showProfileDropdown && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute right-0 mt-3 w-64 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 py-3 z-50 min-w-[200px]"
                    >
                      <motion.div 
                        className="px-4 py-3 border-b border-gray-100/50 flex items-center space-x-3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                          {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <span className="text-white text-sm font-medium">
                              {profile?.full_name?.charAt(0) || 'U'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{profile?.full_name || 'User'}</p>
                          <p className="text-xs text-gray-500 truncate">{profile?.email || ''}</p>
                        </div>
                      </motion.div>
                      
                      <motion.button
                        whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors duration-200 min-w-[200px]"
                        onClick={() => { setShowProfileDropdown(false); router.push('/dashboard/profile'); }}
                      >
                        <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span>Profile</span>
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-red-50 transition-colors duration-200 min-w-[200px]"
                        onClick={handleSignOut}
                      >
                        <LogOut className="w-4 h-4 text-red-600 flex-shrink-0" />
                        <span>Sign Out</span>
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </>
          ) : (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/auth" className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-base">
                Sign In
              </Link>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelpModal && (
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
              className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full p-8"
            >
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowHelpModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-300 z-10"
                aria-label="Close help modal"
              >
                <X className="w-6 h-6" />
              </motion.button>
              <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-2xl font-bold mb-6 text-gray-900"
              >
                Help
              </motion.h2>
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-gray-700 text-sm space-y-4"
              >
                <p className="mb-4">Welcome to LifeHub! Here are some tips to get you started:</p>
                <ul className="space-y-3 list-none">
                  <motion.li 
                    whileHover={{ x: 5 }}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Use the navigation menu to switch between different sections</span>
                  </motion.li>
                  <motion.li 
                    whileHover={{ x: 5 }}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Subscribe to services to customize your dashboard experience</span>
                  </motion.li>
                  <motion.li 
                    whileHover={{ x: 5 }}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                  >
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Click on your profile picture to access your profile settings</span>
                  </motion.li>
                  <motion.li 
                    whileHover={{ x: 5 }}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                  >
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Use the search and filter options to find what you need quickly</span>
                  </motion.li>
                </ul>
              </motion.div>
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-6 text-xs text-gray-400 text-center"
              >
                More features and tips coming soon!
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 