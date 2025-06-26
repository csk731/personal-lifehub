'use client';
import { TopBar } from '@/components/dashboard/TopBar';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setIsLoggedIn(true);
        window.location.href = '/dashboard';
      } else {
        setIsLoggedIn(false);
      }
    });
  }, []);

  if (isLoggedIn === null) {
    return null; // or a loading spinner
  }

  // If logged in, don't render the landing page (redirect will happen)
  if (isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <TopBar isLoggedIn={false} />
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-32 pb-16">
        {/* Hero Section */}
        <section className="relative text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4 drop-shadow-lg">
            Organize Your Life, Effortlessly
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            LifeHub brings all your tasks, moods, and finances into one beautiful dashboard. Experience clarity, focus, and peace of mind—every day.
          </p>
          {/* Unique SVG Illustration */}
          <div className="flex justify-center mb-8">
            <svg width="320" height="120" viewBox="0 0 320 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-xl animate-pulse-slow">
              <rect x="10" y="20" width="300" height="80" rx="20" fill="#e0e7ff" />
              <rect x="30" y="40" width="60" height="40" rx="10" fill="#a5b4fc" />
              <rect x="110" y="40" width="60" height="40" rx="10" fill="#fca5a5" />
              <rect x="190" y="40" width="60" height="40" rx="10" fill="#6ee7b7" />
              <rect x="270" y="40" width="20" height="40" rx="6" fill="#fcd34d" />
              <circle cx="60" cy="60" r="8" fill="#6366f1" />
              <circle cx="140" cy="60" r="8" fill="#ef4444" />
              <circle cx="220" cy="60" r="8" fill="#10b981" />
            </svg>
          </div>
          {/* Animated Dashboard Preview (placeholder) */}
          <div className="flex justify-center mb-8">
            <div className="w-full max-w-xl rounded-2xl shadow-2xl bg-white/80 p-6 animate-fade-in">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 w-32 bg-blue-200 rounded mb-2 animate-pulse" />
                  <div className="h-3 w-48 bg-blue-100 rounded mb-4 animate-pulse" />
                  <div className="h-3 w-40 bg-blue-100 rounded mb-2 animate-pulse" />
                  <div className="h-3 w-36 bg-blue-100 rounded mb-2 animate-pulse" />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="h-8 w-32 bg-green-200 rounded-lg animate-pulse" />
                  <div className="h-8 w-32 bg-purple-200 rounded-lg animate-pulse" />
                  <div className="h-8 w-32 bg-yellow-200 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#features" className="px-10 py-4 bg-white/80 text-blue-700 rounded-xl text-xl font-bold shadow-lg hover:bg-blue-100 transition border border-blue-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400">See Features</a>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="max-w-4xl w-full mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/80 rounded-xl shadow p-6 flex flex-col items-center">
              <span className="bg-blue-100 text-blue-600 rounded-full p-3 mb-4">
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path d="M6 3v18M18 3v18M3 6h18M3 18h18" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/></svg>
              </span>
              <h3 className="font-semibold text-lg mb-2">Customizable Widgets</h3>
              <p className="text-gray-600">Add, remove, and arrange widgets for tasks, mood, finance, and more to create your perfect dashboard.</p>
            </div>
            <div className="bg-white/80 rounded-xl shadow p-6 flex flex-col items-center">
              <span className="bg-green-100 text-green-600 rounded-full p-3 mb-4">
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path d="M12 8v4l3 3" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"/></svg>
              </span>
              <h3 className="font-semibold text-lg mb-2">Smart Insights</h3>
              <p className="text-gray-600">Get personalized recommendations and insights based on your tracked data and habits.</p>
            </div>
            <div className="bg-white/80 rounded-xl shadow p-6 flex flex-col items-center">
              <span className="bg-purple-100 text-purple-600 rounded-full p-3 mb-4">
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#7c3aed" strokeWidth="2"/><path d="M8 12l2 2 4-4" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round"/></svg>
              </span>
              <h3 className="font-semibold text-lg mb-2">Secure & Private</h3>
              <p className="text-gray-600">Your data is encrypted and private. Only you have access to your personal information.</p>
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="max-w-4xl w-full mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">How It Works</h2>
          <ol className="space-y-6 text-lg text-gray-700">
            <li><span className="font-bold text-blue-600">1.</span> Sign up and create your account.</li>
            <li><span className="font-bold text-blue-600">2.</span> Add widgets to your dashboard for tasks, mood, finance, and more.</li>
            <li><span className="font-bold text-blue-600">3.</span> Track your progress and get smart insights every day.</li>
            <li><span className="font-bold text-blue-600">4.</span> Enjoy a more organized, productive, and mindful life!</li>
          </ol>
        </section>

        {/* Testimonials Section */}
        <section className="max-w-4xl w-full mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">What Our Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/90 rounded-xl shadow p-6 flex flex-col items-center">
              <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="User 1" className="w-16 h-16 rounded-full mb-4 border-4 border-blue-100" />
              <p className="text-gray-700 italic mb-2">“LifeHub helped me finally stay on top of my goals. The widgets are a game changer!”</p>
              <span className="font-semibold text-blue-700">— Alex P.</span>
            </div>
            <div className="bg-white/90 rounded-xl shadow p-6 flex flex-col items-center">
              <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="User 2" className="w-16 h-16 rounded-full mb-4 border-4 border-green-100" />
              <p className="text-gray-700 italic mb-2">“I love the mood tracker and finance tools. Everything is so easy and beautiful.”</p>
              <span className="font-semibold text-green-700">— Priya S.</span>
            </div>
            <div className="bg-white/90 rounded-xl shadow p-6 flex flex-col items-center">
              <img src="https://randomuser.me/api/portraits/men/65.jpg" alt="User 3" className="w-16 h-16 rounded-full mb-4 border-4 border-purple-100" />
              <p className="text-gray-700 italic mb-2">“The insights and reminders keep me motivated every day. Highly recommend!”</p>
              <span className="font-semibold text-purple-700">— Jordan L.</span>
            </div>
          </div>
        </section>

        {/* Trust & Security Section */}
        <section className="max-w-4xl w-full mb-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Trusted & Secure</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#2563eb" strokeWidth="2"/><path d="M8 12l2 2 4-4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/></svg>
              <span className="text-gray-700 font-semibold">End-to-End Encryption</span>
            </div>
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" stroke="#16a34a" strokeWidth="2"/><path d="M8 12l2 2 4-4" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"/></svg>
              <span className="text-gray-700 font-semibold">Private by Design</span>
            </div>
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 text-purple-500" fill="none" viewBox="0 0 24 24"><path d="M12 2l7 7-7 7-7-7 7-7z" stroke="#a21caf" strokeWidth="2"/><path d="M12 9v4" stroke="#a21caf" strokeWidth="2" strokeLinecap="round"/></svg>
              <span className="text-gray-700 font-semibold">Trusted by 10,000+ users</span>
            </div>
          </div>
        </section>
      </main>
      {/* Sticky CTA */}
      <div className="fixed bottom-6 right-6 z-50">
        <Link href="/auth" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-lg font-bold shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400">
          Start Your Journey →
        </Link>
      </div>
      <footer className="w-full text-center text-gray-500 py-6 border-t border-gray-200 bg-white/70 mt-auto">
        &copy; {new Date().getFullYear()} LifeHub. All rights reserved.
      </footer>
    </div>
  );
}
