'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, BookOpen, Mic, Award, Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('demo@kvoice.ai');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">K-Vocal AI</h1>
          <p className="text-gray-500 text-sm">Luyện phát âm tiếng Hàn thông minh với AI</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: BookOpen, label: 'Bài học AI', desc: '40+ chủ đề' },
            { icon: Mic, label: 'Luyện nói', desc: 'Đánh giá thực' },
            { icon: Award, label: 'Theo dõi', desc: 'Tiến trình bạn' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
              <Icon className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-xs font-semibold text-gray-800">{label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">Đăng nhập</h2>
          </div>
          <p className="text-sm text-gray-500 mb-5">Nhập thông tin để truy cập ứng dụng</p>

          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              placeholder="Email..."
              autoComplete="email"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="Mật khẩu..."
                autoComplete="current-password"
                className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">Powered by Google Gemini AI</p>
      </div>
    </div>
  );
}
