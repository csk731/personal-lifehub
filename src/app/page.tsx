'use client';
import { TopBar } from '@/components/dashboard/TopBar';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setIsLoggedIn(true);
        router.push('/dashboard');
      } else {
        setIsLoggedIn(false);
      }
    });
  }, [router]);

  if (isLoggedIn === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center select-none">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <svg 
                viewBox="0 0 24 24" 
                className="w-5 h-5 text-white"
                fill="currentColor"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="ml-3 text-xl font-medium text-white tracking-tight">
              LifeHub
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-white/70 hover:text-white transition-colors text-sm">Features</a>
            <a href="#how-it-works" className="text-white/70 hover:text-white transition-colors text-sm">How it Works</a>
          </div>
          <Link 
            href="/auth" 
            className="px-6 py-2 bg-white text-black rounded-full font-medium hover:bg-white/90 transition-colors text-sm"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section - Apple Style */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-8xl md:text-9xl font-bold mb-8 tracking-tight">
            LifeHub
          </h1>
          <p className="text-3xl md:text-4xl font-light mb-12 text-white/80 tracking-wide">
            Your life. Organized.
          </p>
          <p className="text-xl md:text-2xl text-white/60 mb-16 max-w-2xl mx-auto leading-relaxed font-light">
            The all-in-one dashboard that brings together everything you need to stay productive, mindful, and organized.
          </p>
          
          <Link 
            href="/auth" 
            className="inline-block px-12 py-4 bg-white text-black rounded-full text-xl font-medium hover:bg-white/90 transition-all duration-300 hover:scale-105"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Features Section - Apple Style */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-32">
            <h2 className="text-6xl md:text-7xl font-bold mb-8 tracking-tight">
              Everything you need.
            </h2>
            <p className="text-2xl md:text-3xl text-white/60 max-w-3xl mx-auto font-light">
              Powerful tools designed to help you stay organized, productive, and mindful.
            </p>
          </div>

          {/* Large Feature Cards - Apple Style */}
          <div className="space-y-32">
            {/* Tasks */}
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1">
                <h3 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
                  Task Management
                </h3>
                <p className="text-2xl text-white/70 mb-8 font-light leading-relaxed">
                  Create, organize, and track tasks with smart categorization, priorities, and progress tracking. Never miss a deadline again.
                </p>
                <ul className="space-y-4 text-xl text-white/60 font-light">
                  <li>• Smart task categorization</li>
                  <li>• Priority levels & deadlines</li>
                  <li>• Progress tracking</li>
                  <li>• Reminder notifications</li>
                </ul>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="w-80 h-80 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-3xl border border-blue-500/30 flex items-center justify-center">
                  <span className="text-8xl">✓</span>
                </div>
              </div>
            </div>

            {/* Mood */}
            <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
              <div className="flex-1">
                <h3 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
                  Mood Tracking
                </h3>
                <p className="text-2xl text-white/70 mb-8 font-light leading-relaxed">
                  Track your daily mood and emotional patterns. Gain insights into your mental well-being with beautiful visualizations.
                </p>
                <ul className="space-y-4 text-xl text-white/60 font-light">
                  <li>• Daily mood logging</li>
                  <li>• Mood pattern analysis</li>
                  <li>• Emotional insights</li>
                  <li>• Wellness recommendations</li>
                </ul>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="w-80 h-80 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-3xl border border-purple-500/30 flex items-center justify-center">
                  <span className="text-8xl">😊</span>
                </div>
              </div>
            </div>

            {/* Finance */}
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1">
                <h3 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
                  Finance Tracking
                </h3>
                <p className="text-2xl text-white/70 mb-8 font-light leading-relaxed">
                  Monitor your income, expenses, and savings with detailed analytics. Take control of your financial future.
                </p>
                <ul className="space-y-4 text-xl text-white/60 font-light">
                  <li>• Income & expense tracking</li>
                  <li>• Budget management</li>
                  <li>• Financial analytics</li>
                  <li>• Savings goals</li>
                </ul>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="w-80 h-80 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-3xl border border-green-500/30 flex items-center justify-center">
                  <span className="text-8xl">💰</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
              <div className="flex-1">
                <h3 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
                  Quick Notes
                </h3>
                <p className="text-2xl text-white/70 mb-8 font-light leading-relaxed">
                  Capture ideas, organize thoughts, and keep important information at your fingertips. Everything you need to stay productive.
                </p>
                <ul className="space-y-4 text-xl text-white/60 font-light">
                  <li>• Rich text notes</li>
                  <li>• Smart organization</li>
                  <li>• Quick search</li>
                  <li>• Categories & tags</li>
                </ul>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="w-80 h-80 bg-gradient-to-br from-pink-500/20 to-pink-600/20 rounded-3xl border border-pink-500/30 flex items-center justify-center">
                  <span className="text-8xl">📝</span>
                </div>
              </div>
            </div>

            {/* Calendar */}
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1">
                <h3 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
                  Calendar & Events
                </h3>
                <p className="text-2xl text-white/70 mb-8 font-light leading-relaxed">
                  Manage your schedule, events, and appointments. Stay on top of your commitments with smart reminders.
                </p>
                <ul className="space-y-4 text-xl text-white/60 font-light">
                  <li>• Event management</li>
                  <li>• Calendar integration</li>
                  <li>• Smart reminders</li>
                  <li>• Multiple calendars</li>
                </ul>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="w-80 h-80 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-3xl border border-orange-500/30 flex items-center justify-center">
                  <span className="text-8xl">📅</span>
                </div>
              </div>
            </div>

            {/* Weather */}
            <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
              <div className="flex-1">
                <h3 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
                  Weather Updates
                </h3>
                <p className="text-2xl text-white/70 mb-8 font-light leading-relaxed">
                  Get real-time weather information and forecasts. Plan your day with accurate weather data at your fingertips.
                </p>
                <ul className="space-y-4 text-xl text-white/60 font-light">
                  <li>• Real-time weather</li>
                  <li>• Daily forecasts</li>
                  <li>• Location-based</li>
                  <li>• Weather alerts</li>
                </ul>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="w-80 h-80 bg-gradient-to-br from-sky-500/20 to-sky-600/20 rounded-3xl border border-sky-500/30 flex items-center justify-center">
                  <span className="text-8xl">🌤️</span>
                </div>
              </div>
            </div>

            {/* Habits */}
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1">
                <h3 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
                  Habit Tracker
                </h3>
                <p className="text-2xl text-white/70 mb-8 font-light leading-relaxed">
                  Build lasting habits and track your progress. Create positive routines and achieve your goals with consistency.
                </p>
                <ul className="space-y-4 text-xl text-white/60 font-light">
                  <li>• Habit building</li>
                  <li>• Progress tracking</li>
                  <li>• Streak counting</li>
                  <li>• Goal setting</li>
                </ul>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="w-80 h-80 bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 rounded-3xl border border-indigo-500/30 flex items-center justify-center">
                  <span className="text-8xl">🎯</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview - Apple Style */}
      <section className="py-32 px-6 bg-white text-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-32">
            <h2 className="text-6xl md:text-7xl font-bold mb-8 tracking-tight">
              Beautiful Dashboard
            </h2>
            <p className="text-2xl md:text-3xl text-gray-600 max-w-3xl mx-auto font-light">
              Your personal command center, designed with elegance and functionality in mind.
            </p>
          </div>

          <div className="relative">
            <div className="bg-black rounded-3xl p-12 border border-gray-800 shadow-2xl max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Task Widget */}
                <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white font-semibold text-lg">Today's Tasks</h3>
                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <span className="text-blue-400 text-lg">✓</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 border-2 border-blue-400 rounded"></div>
                      <span className="text-white/80 text-sm">Complete project proposal</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 border-2 border-green-400 rounded bg-green-400"></div>
                      <span className="text-white/50 text-sm line-through">Team meeting</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 border-2 border-purple-400 rounded"></div>
                      <span className="text-white/80 text-sm">Review budget</span>
                    </div>
                  </div>
                </div>

                {/* Mood Widget */}
                <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white font-semibold text-lg">Mood Today</h3>
                    <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                      <span className="text-purple-400 text-xl">😊</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-6xl mb-4">😊</div>
                    <p className="text-white/80 text-sm">Feeling great!</p>
                    <div className="mt-4 flex justify-center space-x-2">
                      {['😢', '😐', '😊', '😄'].map((mood, i) => (
                        <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center ${i === 2 ? 'bg-purple-500/20' : 'bg-gray-800'}`}>
                          <span className="text-lg">{mood}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Calendar Widget */}
                <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white font-semibold text-lg">Upcoming</h3>
                    <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                      <span className="text-orange-400 text-lg">📅</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-orange-400 rounded-full"></div>
                      <span className="text-white/80 text-sm">Team meeting</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
                      <span className="text-white/80 text-sm">Doctor appointment</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-green-400 rounded-full"></div>
                      <span className="text-white/80 text-sm">Gym session</span>
                    </div>
                  </div>
                </div>

                {/* Weather Widget */}
                <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white font-semibold text-lg">Weather</h3>
                    <div className="w-10 h-10 bg-sky-500/20 rounded-xl flex items-center justify-center">
                      <span className="text-sky-400 text-lg">🌤️</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-5xl mb-4">🌤️</div>
                    <p className="text-white text-2xl font-semibold mb-2">72°F</p>
                    <p className="text-white/60 text-sm mb-2">Partly Cloudy</p>
                    <p className="text-white/40 text-xs">San Francisco</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Apple Style */}
      <section id="how-it-works" className="py-32 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-32">
            <h2 className="text-6xl md:text-7xl font-bold mb-8 tracking-tight">
              Get Started in Minutes
            </h2>
            <p className="text-2xl md:text-3xl text-white/60 max-w-3xl mx-auto font-light">
              Simple setup, powerful results. Start organizing your life today.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {[
              {
                step: '01',
                title: 'Create Account',
                description: 'Sign up with your email and create your personalized dashboard in seconds.',
                icon: '👤'
              },
              {
                step: '02',
                title: 'Choose Your Services',
                description: 'Select from tasks, mood tracking, finance management, notes, calendar, weather, and habits.',
                icon: '⚙️'
              },
              {
                step: '03',
                title: 'Start Organizing',
                description: 'Begin tracking your daily activities and watch your productivity soar.',
                icon: '🚀'
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center text-5xl mb-8 mx-auto">
                  {item.icon}
                </div>
                <div className="text-blue-400 font-bold text-lg mb-6">{item.step}</div>
                <h3 className="text-3xl font-bold mb-6 text-white">{item.title}</h3>
                <p className="text-xl text-white/60 leading-relaxed font-light">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Apple Style */}
      <section className="py-32 px-6 bg-white text-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-6xl md:text-7xl font-bold mb-8 tracking-tight">
            Ready to Transform Your Life?
          </h2>
          <p className="text-2xl md:text-3xl text-gray-600 mb-16 max-w-2xl mx-auto font-light">
            Join thousands of users who have already organized their lives with LifeHub.
          </p>
          <Link 
            href="/auth" 
            className="inline-block px-16 py-6 bg-black text-white rounded-full text-2xl font-medium hover:bg-gray-900 transition-all duration-300 hover:scale-105"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer - Apple Style */}
      <footer className="py-16 px-6 border-t border-gray-800 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <svg 
                  viewBox="0 0 24 24" 
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span className="text-xl font-medium text-white tracking-tight">LifeHub</span>
            </div>
            <div className="flex items-center space-x-8 text-white/60">
              <a href="#" className="hover:text-white transition-colors text-sm">Privacy</a>
              <a href="#" className="hover:text-white transition-colors text-sm">Terms</a>
              <a href="#" className="hover:text-white transition-colors text-sm">Support</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-white/40">
            <p className="text-sm">&copy; 2024 LifeHub. All rights reserved. Made with ❤️ for better productivity.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
