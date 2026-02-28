'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  TrendingUp, User, Mail, Lock, Eye, EyeOff,
  AlertCircle, CheckCircle, Loader2, DollarSign
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { auth } from '@/lib/api';

const INCOME_PRESETS = [
  { label: '$25,000', value: 25000 },
  { label: '$50,000', value: 50000 },
  { label: '$75,000', value: 75000 },
  { label: '$1,00,000', value: 100000 },
  { label: '$1,50,000', value: 150000 },
  { label: '$2,00,000+', value: 200000 },
];

export default function Register() {
  const router = useRouter();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    annualIncome: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const setPreset = (value) =>
    setFormData(prev => ({ ...prev, annualIncome: String(value) }));

  const passwordStrength = (pw) => {
    if (!pw) return null;
    if (pw.length < 6) return { label: 'Too short', color: 'bg-red-400', width: '25%' };
    if (pw.length < 8) return { label: 'Weak', color: 'bg-orange-400', width: '50%' };
    if (/[A-Z]/.test(pw) && /[0-9]/.test(pw))
      return { label: 'Strong', color: 'bg-emerald-500', width: '100%' };
    return { label: 'Fair', color: 'bg-yellow-400', width: '75%' };
  };

  const strength = passwordStrength(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await auth.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        annualIncome: Number(formData.annualIncome),
      });
      login(data);
      router.push('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 px-4 py-10 relative overflow-hidden">
      {/* Blobs */}
      <div className="absolute w-72 h-72 bg-emerald-200 rounded-full filter blur-3xl opacity-20 top-8 left-8 pointer-events-none" />
      <div className="absolute w-64 h-64 bg-teal-200 rounded-full filter blur-3xl opacity-15 bottom-8 right-8 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-xl mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
            BankAI
          </h1>
          <p className="text-gray-500 text-sm mt-1">Create your free account</p>
        </div>

        {/* Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Get started</h2>
            <p className="text-gray-500 text-sm mt-1">Your income data personalizes your financial dashboard</p>
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl mb-5 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="name" name="name" type="text" required
                  value={formData.name} onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50
                    focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-gray-900 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="email" name="email" type="email" required autoComplete="email"
                  value={formData.email} onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50
                    focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-gray-900 transition-all"
                />
              </div>
            </div>

            {/* Annual Income */}
            <div>
              <label htmlFor="annualIncome" className="block text-sm font-medium text-gray-700 mb-1.5">
                Annual Income
                <span className="text-gray-400 font-normal ml-1 text-xs">(optional — personalises your dashboard)</span>
              </label>
              {/* Quick preset buttons */}
              <div className="flex flex-wrap gap-2 mb-2">
                {INCOME_PRESETS.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPreset(p.value)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${Number(formData.annualIncome) === p.value
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400 hover:text-emerald-600'
                      }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="annualIncome" name="annualIncome" type="number"
                  min="1" step="1000"
                  value={formData.annualIncome} onChange={handleChange}
                  placeholder="e.g. 75000 (optional)"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50
                    focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-gray-900 transition-all"
                />
              </div>
              {formData.annualIncome && Number(formData.annualIncome) > 0 && (
                <p className="text-xs text-emerald-600 mt-1">
                  ≈ ${Math.round(Number(formData.annualIncome) / 12).toLocaleString()}/month
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="password" name="password" type={showPassword ? 'text' : 'password'} required
                  value={formData.password} onChange={handleChange}
                  placeholder="Min. 6 characters"
                  className="w-full pl-10 pr-11 py-2.5 border border-gray-200 rounded-xl bg-gray-50
                    focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-gray-900 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {strength && (
                <div className="mt-2">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`} style={{ width: strength.width }} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{strength.label}</p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="confirmPassword" name="confirmPassword"
                  type={showPassword ? 'text' : 'password'} required
                  value={formData.confirmPassword} onChange={handleChange}
                  placeholder="Re-enter password"
                  className="w-full pl-10 pr-11 py-2.5 border border-gray-200 rounded-xl bg-gray-50
                    focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-gray-900 transition-all"
                />
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <CheckCircle className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-6
                bg-gradient-to-r from-emerald-500 to-teal-500
                hover:from-emerald-600 hover:to-teal-600
                text-white font-semibold rounded-xl shadow-md hover:shadow-lg
                transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
                : 'Create Account'
              }
            </button>
          </form>

          <p className="text-center mt-6 text-gray-500 text-sm">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-emerald-600 hover:text-emerald-700 font-semibold">Sign in</Link>
          </p>
        </div>

        <p className="text-center mt-4 text-xs text-gray-400">
          <Link href="/" className="hover:text-emerald-600 transition-colors">← Back to homepage</Link>
        </p>
      </div>
    </div>
  );
}
