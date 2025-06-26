'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { LogOut, HelpCircle, X, Home as HomeIcon, Bell, User, Settings as SettingsIcon } from 'lucide-react';
import { getAuthHeaders } from '@/lib/utils';
import { ProfileManager } from '../profile/ProfileManager';
import Link from 'next/link';

export function TopBar({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const [profile, setProfile] = useState<any>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

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
      const headers = await getAuthHeaders();
      const response = await fetch('/api/profile', { headers });
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      setProfile(data.profile);
    } catch (err) {
      setProfile(null);
    }
  };

  const handleSignOut = async () => {
    const { supabase } = await import('@/lib/supabase');
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  return (
    <>
      <div className="fixed top-0 left-0 w-full z-40 border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm bg-white/70 backdrop-blur-md">
        <div className="flex items-center space-x-3 select-none">
          <Image src="/file.svg" alt="LifeHub Logo" width={32} height={32} />
          <span className="text-xl font-bold text-gray-900">LifeHub</span>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4">
          {isLoggedIn ? (
            <>
              {/* Home Button */}
              <Link href="/dashboard" title="Home" className="p-2 rounded-lg hover:bg-gray-100 transition-colors group" aria-label="Home">
                <HomeIcon className="w-6 h-6 text-gray-700 group-hover:text-blue-600" />
                <span className="sr-only">Home</span>
                <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  Home
                </span>
              </Link>
              {/* Notifications */}
              <button
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative group"
                title="Notifications"
                aria-label="Notifications"
                tabIndex={0}
                onClick={() => alert('Notifications coming soon!')}
              >
                <Bell className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  Notifications
                </span>
              </button>
              {/* Help Button */}
              <button
                onClick={() => setShowHelpModal(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative group"
                title="Keyboard Shortcuts & Help"
                aria-label="Show keyboard shortcuts help"
              >
                <HelpCircle className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  Help
                </span>
              </button>
              {/* Profile Dropdown */}
              <div className="relative" ref={profileDropdownRef}>
                <button
                  className="flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-100 transition-colors group focus:outline-none"
                  onClick={() => setShowProfileDropdown(v => !v)}
                  aria-haspopup="true"
                  aria-expanded={showProfileDropdown}
                  aria-label="Open profile menu"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <span className="text-white text-sm font-medium">
                        {profile?.full_name?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                  <span className="hidden md:block max-w-[120px] truncate text-sm font-medium text-gray-900">
                    {profile?.full_name || 'User'}
                  </span>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600" fill="none" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-gray-100 flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
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
                    </div>
                    <button
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                      onClick={() => { setShowProfileDropdown(false); setTimeout(() => { setShowProfileModal(true); }, 200); }}
                    >
                      <User className="w-4 h-4 text-blue-600" />
                      <span>Profile</span>
                    </button>
                    <button
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                      onClick={() => { setShowProfileDropdown(false); alert('Settings coming soon!'); }}
                    >
                      <SettingsIcon className="w-4 h-4 text-purple-600" />
                      <span>Settings</span>
                    </button>
                    <button
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 transition-colors"
                      onClick={handleSignOut}
                    >
                      <LogOut className="w-4 h-4 text-red-600" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link href="/auth" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition text-base">Sign In</Link>
          )}
        </div>
      </div>
      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-8 animate-fade-in">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors z-10"
              aria-label="Close help modal"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold mb-4 text-gray-900">Keyboard Shortcuts & Help</h2>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li><span className="font-semibold">Ctrl/Cmd + N</span>: Add new widget</li>
              <li><span className="font-semibold">Ctrl/Cmd + T</span>: Go to tasks</li>
              <li><span className="font-semibold">Ctrl/Cmd + M</span>: Go to mood</li>
              <li><span className="font-semibold">Ctrl/Cmd + F</span>: Go to finance</li>
              <li><span className="font-semibold">?</span>: Open this help</li>
              <li><span className="font-semibold">Esc</span>: Close modals/menus</li>
            </ul>
            <div className="mt-6 text-xs text-gray-400 text-center">More help & tips coming soon!</div>
          </div>
        </div>
      )}
      {/* Profile Modal */}
      {isLoggedIn && showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors z-10"
              aria-label="Close profile modal"
            >
              <X className="w-6 h-6" />
            </button>
            <ProfileManager />
          </div>
        </div>
      )}
    </>
  );
} 