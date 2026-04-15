import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { LogIn, Lock, User, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
export default function Login() {
  const login = useAuthStore(s => s.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(username, password);
    if (result.success) {
      toast.success('Login successful! Welcome to the ZIFA Admin Portal.');
    } else {
      setError(result.error || 'Login failed');
      toast.error(result.error || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* ── LEFT: Login Form ── */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center px-12 py-16 bg-white">
        <div className="max-w-md w-full mx-auto">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <img src="/logo-2.png" alt="ZIFA Logo" className="w-10 h-10 rounded-full object-contain" />
            <span className="font-black text-zifa-green text-xl tracking-tight">ZIFA</span>
          </div>

          <p className="text-sm font-bold text-zifa-green uppercase tracking-widest mb-2">Admin Portal</p>
          <h1 className="text-4xl font-black text-gray-900 mb-2 leading-tight">Welcome back</h1>
          <p className="text-gray-400 text-sm mb-10">Sign in to manage fixtures, payments and schedules.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="w-4 h-4 text-gray-400" />
              </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Username"
                required
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zifa-green focus:border-transparent transition"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-4 h-4 text-gray-400" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zifa-green focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-between bg-zifa-green text-white px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-green-800 transition disabled:opacity-60"
            >
              <span>{loading ? 'Signing in…' : 'Sign in'}</span>
              <LogIn className="w-4 h-4" />
            </button>
          </form>

          <p className="text-gray-400 text-xs mt-8 text-center">
            Southern Region Soccer League — Administration System
          </p>
        </div>
      </div>

      {/* ── RIGHT: ZIFA Branding Panel ── */}
      <div className="hidden lg:flex w-[55%] relative overflow-hidden flex-col items-center justify-center"
        style={{ background: 'linear-gradient(145deg, #0d3d19 0%, #1a5928 40%, #2d7a3a 80%, #3a9247 100%)' }}
      >
        {/* Soccer ball pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          {[...Array(30)].map((_, i) => (
            <div key={i} className="absolute rounded-full border-2 border-white"
              style={{
                width: `${40 + (i * 23) % 120}px`,
                height: `${40 + (i * 23) % 120}px`,
                top: `${(i * 137) % 110 - 10}%`,
                left: `${(i * 89) % 110 - 10}%`,
                opacity: 0.4 + (i % 3) * 0.2,
              }}
            />
          ))}
        </div>

        {/* Yellow wave accent */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-zifa-yellow" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-zifa-yellow opacity-40" />

        <div className="relative z-10 flex flex-col items-center text-center px-12">
          {/* Dual logos */}
          <div className="flex items-center gap-8 mb-12">
            <div className="flex flex-col items-center gap-2">
              <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center border-4 border-zifa-yellow shadow-2xl overflow-hidden">
                <img src="/logo-2.png" alt="Southern Region Logo" className="w-[85%] h-[85%] object-contain" />
              </div>
            </div>

            <div className="text-white opacity-30 text-4xl font-thin">✦</div>

            <div className="flex flex-col items-center gap-2">
              <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center border-4 border-zifa-yellow shadow-2xl overflow-hidden">
                <img src="/logo-1.jpg" alt="ZIFA Logo" className="w-[85%] h-[85%] object-contain" />
              </div>
            </div>
          </div>

          <div className="text-zifa-yellow text-xs font-bold uppercase tracking-widest mb-3 opacity-80">
            Powered by Pacific Breeze
          </div>
          <h2 className="text-white text-5xl font-black leading-none tracking-tight mb-2">
            SOUTHERN<br />REGION<br />
            <span className="text-zifa-yellow">SOCCER</span><br />
            LEAGUE
          </h2>
          <p className="text-white/50 text-sm mt-6 font-medium">
            Official Match Administration Portal
          </p>
        </div>
      </div>
    </div>
  );
}
