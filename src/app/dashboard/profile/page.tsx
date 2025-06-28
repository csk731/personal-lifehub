'use client';

import { ProfileManager } from '@/components/profile/ProfileManager';
import { TopBar } from '@/components/dashboard/TopBar';
import { Suspense, useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { getAuthHeaders } from '@/lib/utils';

function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      {/* Error/Success Message Skeleton */}
      <div className="animate-fade-in skeleton-stagger-1">
        <Skeleton className="h-16 rounded-2xl animate-shimmer" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Skeleton */}
        <div className="lg:col-span-2 space-y-8">
          {/* Basic Information Skeleton */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm animate-fade-in skeleton-stagger-2">
            <div className="flex items-center mb-6">
              <Skeleton className="w-10 h-10 rounded-xl mr-4 animate-shimmer" delay={200} />
              <div className="flex-1">
                <Skeleton className="h-6 w-48 mb-2 animate-shimmer" delay={300} />
                <Skeleton className="h-4 w-64 animate-shimmer" delay={400} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24 animate-shimmer" delay={500 + (i * 50)} />
                  <Skeleton className="h-12 rounded-xl animate-shimmer" delay={600 + (i * 50)} />
                </div>
              ))}
            </div>
          </div>

          {/* Social Links Skeleton */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm animate-fade-in skeleton-stagger-3">
            <div className="flex items-center mb-6">
              <Skeleton className="w-10 h-10 rounded-xl mr-4 animate-shimmer" delay={200} />
              <div className="flex-1">
                <Skeleton className="h-6 w-32 mb-2 animate-shimmer" delay={300} />
                <Skeleton className="h-4 w-56 animate-shimmer" delay={400} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20 animate-shimmer" delay={500 + (i * 100)} />
                  <Skeleton className="h-12 rounded-xl animate-shimmer" delay={600 + (i * 100)} />
                </div>
              ))}
            </div>
          </div>

          {/* Skills & Interests Skeleton */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm animate-fade-in skeleton-stagger-4">
            <div className="flex items-center mb-6">
              <Skeleton className="w-10 h-10 rounded-xl mr-4 animate-shimmer" delay={200} />
              <div className="flex-1">
                <Skeleton className="h-6 w-36 mb-2 animate-shimmer" delay={300} />
                <Skeleton className="h-4 w-52 animate-shimmer" delay={400} />
              </div>
            </div>
            <div className="space-y-6">
              <div className="space-y-3">
                <Skeleton className="h-4 w-16 animate-shimmer" delay={500} />
                <div className="flex flex-wrap gap-2">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-20 rounded-full animate-shimmer" delay={600 + (i * 100)} />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-12 flex-1 rounded-xl animate-shimmer" delay={1000} />
                  <Skeleton className="h-12 w-20 rounded-xl animate-shimmer" delay={1100} />
                </div>
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-20 animate-shimmer" delay={1200} />
                <div className="flex flex-wrap gap-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-24 rounded-full animate-shimmer" delay={1300 + (i * 100)} />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-12 flex-1 rounded-xl animate-shimmer" delay={1600} />
                  <Skeleton className="h-12 w-20 rounded-xl animate-shimmer" delay={1700} />
                </div>
              </div>
            </div>
          </div>

          {/* Professional Information Skeleton */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm animate-fade-in skeleton-stagger-5">
            <div className="flex items-center mb-6">
              <Skeleton className="w-10 h-10 rounded-xl mr-4 animate-shimmer" delay={200} />
              <div className="flex-1">
                <Skeleton className="h-6 w-44 mb-2 animate-shimmer" delay={300} />
                <Skeleton className="h-4 w-60 animate-shimmer" delay={400} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-28 animate-shimmer" delay={500 + (i * 100)} />
                  <Skeleton className="h-12 rounded-xl animate-shimmer" delay={600 + (i * 100)} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Skeleton */}
        <div className="space-y-8">
          {/* Profile Completion Skeleton */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm animate-fade-in skeleton-stagger-2">
            <div className="flex items-center mb-4">
              <Skeleton className="w-8 h-8 rounded-lg mr-3 animate-shimmer" delay={200} />
              <Skeleton className="h-6 w-32 animate-shimmer" delay={300} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20 animate-shimmer" delay={400} />
                <Skeleton className="h-4 w-12 animate-shimmer" delay={500} />
              </div>
              <Skeleton className="h-2 rounded-full animate-shimmer" delay={600} />
              <Skeleton className="h-3 w-48 animate-shimmer" delay={700} />
            </div>
          </div>

          {/* Preferences Skeleton */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm animate-fade-in skeleton-stagger-3">
            <div className="flex items-center mb-4">
              <Skeleton className="w-8 h-8 rounded-lg mr-3 animate-shimmer" delay={200} />
              <Skeleton className="h-6 w-24 animate-shimmer" delay={300} />
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-16 animate-shimmer" delay={400 + (i * 100)} />
                  <Skeleton className="h-12 rounded-xl animate-shimmer" delay={500 + (i * 100)} />
                </div>
              ))}
            </div>
          </div>

          {/* Privacy Settings Skeleton */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm animate-fade-in skeleton-stagger-4">
            <div className="flex items-center mb-4">
              <Skeleton className="w-8 h-8 rounded-lg mr-3 animate-shimmer" delay={200} />
              <Skeleton className="h-6 w-28 animate-shimmer" delay={300} />
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="w-4 h-4 rounded animate-shimmer" delay={400 + (i * 100)} />
                  <Skeleton className="h-4 w-48 animate-shimmer" delay={500 + (i * 100)} />
                </div>
              ))}
            </div>
          </div>

          {/* Notifications Skeleton */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm animate-fade-in skeleton-stagger-5">
            <div className="flex items-center mb-4">
              <Skeleton className="w-8 h-8 rounded-lg mr-3 animate-shimmer" delay={200} />
              <Skeleton className="h-6 w-26 animate-shimmer" delay={300} />
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="w-4 h-4 rounded animate-shimmer" delay={400 + (i * 100)} />
                  <Skeleton className="h-4 w-32 animate-shimmer" delay={500 + (i * 100)} />
                </div>
              ))}
            </div>
          </div>

          {/* Save Button Skeleton */}
          <div className="sticky top-8 animate-fade-in skeleton-stagger-6">
            <Skeleton className="h-12 rounded-xl animate-shimmer" delay={200} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Client component that handles the async loading
function ClientProfileManager() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Fetch actual profile data
        const headers = await getAuthHeaders();
        const response = await fetch('/api/profile', { headers });
        
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        
        const data = await response.json();
        setProfile(data.profile);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return <ProfileSkeleton />;
  }

  return <ProfileManager initialProfile={profile} />;
}

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-white">
      <TopBar isLoggedIn={true} />
      
      <main className="pt-16">
        {/* Header Section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
                Profile Settings
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
                Manage your personal information, preferences, and account settings
              </p>
            </div>

            {/* Profile Content */}
            <ClientProfileManager />
      </div>
        </section>
      </main>
    </div>
  );
} 