'use client';

import { useAuth } from '@/contexts/AuthContext';
import { LoginPage } from '@/components/LoginPage';
import { LandingPage } from '@/components/LandingPage';
import { TopicLessons } from '@/components/TopicLessons';
import { Sparkles, LogOut, User } from 'lucide-react';
import { useState } from 'react';

export function MainApp() {
  const { user, loading, logout } = useAuth();
  const [showLanding, setShowLanding] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user && showLanding) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight">K-Vocal AI</h1>
          </div>

          <div className="hidden sm:block text-xs md:text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Powered by Gemini AI
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {user.image ? (
                <img src={user.image} alt={user.name} className="w-8 h-8 rounded-full border border-gray-200" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
              )}
              <span className="hidden md:block text-sm font-medium text-gray-700">{user.name}</span>
            </div>
            <button
              onClick={logout}
              title="Đăng xuất"
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 md:px-5 py-4 md:py-6">
        <TopicLessons />
      </main>
    </div>
  );
}
