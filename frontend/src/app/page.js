'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { TrendingUp, ArrowRight, Shield, CheckCircle, Clock, Star, Sparkles, BarChart3, Zap } from 'lucide-react';

export default function Home() {
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    const animate = () => {
      [
        [titleRef, 300],
        [subtitleRef, 600],
        [ctaRef, 900],
      ].forEach(([ref, delay]) => {
        setTimeout(() => {
          if (ref.current) {
            ref.current.style.opacity = '1';
            ref.current.style.transform = 'translateY(0)';
          }
        }, delay);
      });
    };
    animate();

    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.opacity = '1';
          e.target.style.transform = 'translateY(0)';
        }
      }),
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 text-emerald-900 overflow-hidden relative">
      {/* Floating blobs */}
      <div className="floating-shape absolute w-80 h-80 bg-emerald-200 rounded-full filter blur-3xl opacity-20 top-24 left-16" />
      <div className="floating-shape absolute w-64 h-64 bg-teal-200 rounded-full filter blur-3xl opacity-15 bottom-24 right-16" />
      <div className="floating-shape absolute w-48 h-48 bg-cyan-200 rounded-full filter blur-3xl opacity-20 bottom-40 left-8" />

      {/* ── Header ── */}
      <header className="fixed top-0 w-full px-6 py-4 bg-white/95 backdrop-blur-md shadow-sm z-50 border-b border-emerald-100/50">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
              <TrendingUp className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
              BankAI
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-emerald-700 hover:text-emerald-900 font-medium transition-colors text-sm">Services</a>
            <a href="#about" className="text-emerald-700 hover:text-emerald-900 font-medium transition-colors text-sm">About</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-emerald-700 hover:text-emerald-900 font-medium transition-colors text-sm px-4 py-2 rounded-lg hover:bg-emerald-50">
              Sign In
            </Link>
            <Link href="/auth/register" className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm flex items-center gap-2">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="flex items-center justify-center min-h-screen px-6 text-center relative z-10 pt-20">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-xl">
              <TrendingUp className="text-white w-10 h-10" />
            </div>
          </div>

          <h1
            ref={titleRef}
            className="animate-fade-in text-5xl md:text-7xl font-extrabold mb-8 leading-tight text-gray-900"
          >
            AI-Powered
            <span className="block bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Financial Intelligence
            </span>
          </h1>

          <p
            ref={subtitleRef}
            className="animate-fade-in text-xl md:text-2xl mb-12 max-w-3xl mx-auto text-emerald-800/70 leading-relaxed font-medium"
          >
            Transform your bank statements into actionable insights with advanced AI analysis.
            Track spending, monitor scores, and take control of your finances.
          </p>

          <div
            ref={ctaRef}
            className="animate-fade-in flex flex-col md:flex-row gap-5 justify-center items-center"
          >
            <Link href="/auth/register">
              <button className="px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-lg flex items-center gap-3">
                <Sparkles className="w-5 h-5" />
                Start Analyzing Free
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link href="/auth/login">
              <button className="px-10 py-4 bg-white/90 text-emerald-700 font-bold rounded-full border-2 border-emerald-200 hover:bg-white hover:-translate-y-1 transition-all duration-300 text-lg">
                Sign In
              </button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-emerald-700/60 text-sm">
            {[
              [Shield, 'Bank-Grade Security'],
              [CheckCircle, 'AI Categorization'],
              [Clock, 'Real-Time Analysis'],
              [Star, '4.9★ Rated'],
            ].map(([Icon, label], i) => (
              <div key={i} className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="services" className="py-20 px-6 bg-white/90 backdrop-blur-md relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="animate-on-scroll text-4xl md:text-5xl font-bold text-emerald-800 mb-5">
              Everything You Need to Master Money
            </h2>
            <p className="animate-on-scroll text-lg text-emerald-700/70 max-w-2xl mx-auto">
              Our platform brings together AI analytics, spending tracking, and financial scoring in one intelligent dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {[
              { icon: Sparkles, gradient: 'from-emerald-400 to-teal-500', title: 'AI Insights', desc: 'Automatic categorization and personalized recommendations powered by machine learning.' },
              { icon: BarChart3, gradient: 'from-teal-400 to-cyan-500', title: 'Deep Analytics', desc: 'Visualize your spending trends, category breakdowns, and monthly comparisons at a glance.' },
              { icon: Shield, gradient: 'from-cyan-400 to-blue-500', title: 'Financial Score', desc: 'Get a real-time health score based on your savings rate, debt, and spending habits.' },
              { icon: TrendingUp, gradient: 'from-blue-400 to-indigo-500', title: 'Smart Tracking', desc: 'Track income vs expenses month-over-month with beautiful interactive charts.' },
              { icon: Star, gradient: 'from-purple-400 to-pink-500', title: 'Recurring Payments', desc: 'Automatically detect and monitor subscription and recurring billing patterns.' },
              { icon: Zap, gradient: 'from-green-400 to-emerald-500', title: 'Instant Upload', desc: 'Upload PDF bank statements and get a full analysis within seconds.' },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="animate-on-scroll group bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-md border border-white/20 text-center hover:-translate-y-2 transition-all duration-300"
                >
                  <div className={`w-14 h-14 bg-gradient-to-br ${f.gradient} rounded-2xl flex items-center justify-center shadow-lg mb-5 mx-auto group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-emerald-800 mb-3">{f.title}</h3>
                  <p className="text-emerald-700/70 text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-10 shadow-xl border border-white/30">
            <h2 className="animate-on-scroll text-3xl font-bold text-center text-emerald-800 mb-10">
              Trusted by Smart Savers
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                ['50K+', 'Statements Analyzed'],
                ['₹2Cr+', 'Expenses Tracked'],
                ['99.9%', 'Uptime'],
                ['4.9★', 'User Rating'],
              ].map(([val, label], i) => (
                <div key={i} className="animate-on-scroll">
                  <div className="text-3xl font-black text-emerald-700 mb-1">{val}</div>
                  <div className="text-sm text-emerald-600/60 font-medium">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="about" className="py-20 px-6 text-center relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl p-12 shadow-2xl text-white">
            <TrendingUp className="w-14 h-14 mx-auto mb-6 opacity-80" />
            <h2 className="animate-on-scroll text-4xl font-bold mb-5">
              Ready to Know Your Money?
            </h2>
            <p className="animate-on-scroll text-lg mb-8 opacity-90 leading-relaxed">
              Upload your first statement and let BankAI do the heavy lifting — categorizing, scoring, and revealing hidden patterns in minutes.
            </p>
            <Link href="/auth/register">
              <button className="px-12 py-5 bg-white text-emerald-700 font-bold rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-lg flex items-center gap-3 mx-auto">
                <TrendingUp className="w-5 h-5" />
                Get Started Today
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-t border-emerald-100/50 pt-12 pb-6">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-white w-4 h-4" />
                </div>
                <span className="font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">BankAI</span>
              </div>
              <p className="text-emerald-700/60 text-sm">AI-powered financial intelligence for everyone.</p>
            </div>
            <div>
              <h4 className="font-semibold text-emerald-800 mb-3">Product</h4>
              <div className="space-y-2 text-sm text-emerald-700/60">
                <div>Analytics Dashboard</div>
                <div>Financial Score</div>
                <div>Transaction Tracker</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-emerald-800 mb-3">Legal</h4>
              <div className="space-y-2 text-sm text-emerald-700/60">
                <div>Privacy Policy</div>
                <div>Terms of Service</div>
                <div>Data Security</div>
              </div>
            </div>
          </div>
          <div className="border-t border-emerald-100 pt-6 text-center text-sm text-emerald-600/50">
            © {new Date().getFullYear()} BankAI — Financial Intelligence Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
