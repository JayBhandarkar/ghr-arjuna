'use client';

import { useState, useEffect } from 'react';
import {
    User, Lock, Trash2, Shield, Save,
    CheckCircle, AlertCircle, Loader2, Eye, EyeOff, TrendingUp
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { auth } from '@/lib/api';

/* ── tiny helpers ── */
function Toggle({ id, checked, onChange, color = 'bg-emerald-500' }) {
    return (
        <button
            id={id}
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-300 ${checked ? color : 'bg-gray-200'}`}
        >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${checked ? 'translate-x-5' : ''}`} />
        </button>
    );
}

function SectionCard({ children, className = '' }) {
    return (
        <section className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6 ${className}`}>
            {children}
        </section>
    );
}

function SectionHeader({ icon: Icon, label, iconBg, iconColor }) {
    return (
        <div className="flex items-center gap-3">
            <div className={`p-2 ${iconBg} rounded-xl`}><Icon className={`w-5 h-5 ${iconColor}`} /></div>
            <h2 className="text-lg font-semibold text-gray-900">{label}</h2>
        </div>
    );
}

function Alert({ type, message }) {
    const styles = {
        success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        error: 'bg-red-50 border-red-200 text-red-700',
    };
    const Icon = type === 'success' ? CheckCircle : AlertCircle;
    return (
        <div className={`flex items-start gap-2 p-3 rounded-xl border text-sm ${styles[type]}`}>
            <Icon className="w-4 h-4 mt-0.5 shrink-0" />
            {message}
        </div>
    );
}

/* ────────────────────────────────────────────── */
export default function SettingsPage() {
    const { user, login: refreshAuth } = useAuth();

    /* Profile state — pre-populated from context / API */
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [annualIncome, setAnnualIncome] = useState('');

    /* Password */
    const [oldPwd, setOldPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [showPwd, setShowPwd] = useState(false);

    /* UI feedback */
    const [profileStatus, setProfileStatus] = useState(null);
    const [pwdStatus, setPwdStatus] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [pwdLoading, setPwdLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [fetching, setFetching] = useState(true);

    /* ── Fetch fresh profile from API on mount ── */
    useEffect(() => {
        const loadProfile = async () => {
            try {
                // Use context data immediately so the form is not empty
                if (user) {
                    setName(user.name || '');
                    setEmail(user.email || '');
                }
                // Also fetch fresh data from the backend (in case email was changed elsewhere)
                const { data } = await auth.getProfile();
                if (data?.user) {
                    setName(data.user.name || '');
                    setEmail(data.user.email || '');
                    setAnnualIncome(data.user.annualIncome ? String(data.user.annualIncome) : '');
                }
            } catch (err) {
                // If token is invalid we'll just keep the context values
                if (user) {
                    setName(user.name || '');
                    setEmail(user.email || '');
                    setAnnualIncome(user.annualIncome ? String(user.annualIncome) : '');
                }
            } finally {
                setFetching(false);
            }
        };

        loadProfile();
    }, [user]);

    /* ── Save profile ── */
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setProfileStatus(null);
        setProfileLoading(true);
        try {
            const { data } = await auth.updateProfile({
                name,
                email,
                ...(annualIncome !== '' && { annualIncome: Number(annualIncome) }),
            });
            // Refresh the auth context so navbar/sidebar also update
            refreshAuth(data);
            setProfileStatus({ type: 'success', message: 'Profile updated successfully!' });
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to update profile.';
            setProfileStatus({ type: 'error', message: msg });
        } finally {
            setProfileLoading(false);
            setTimeout(() => setProfileStatus(null), 4000);
        }
    };

    /* ── Save password ── */
    const handleSavePassword = async (e) => {
        e.preventDefault();
        setPwdStatus(null);

        if (newPwd !== confirmPwd) {
            setPwdStatus({ type: 'error', message: 'New passwords do not match.' });
            return;
        }
        if (newPwd.length < 6) {
            setPwdStatus({ type: 'error', message: 'Password must be at least 6 characters.' });
            return;
        }

        setPwdLoading(true);
        try {
            await auth.changePassword({ oldPassword: oldPwd, newPassword: newPwd });
            setPwdStatus({ type: 'success', message: 'Password updated successfully!' });
            setOldPwd('');
            setNewPwd('');
            setConfirmPwd('');
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to update password.';
            setPwdStatus({ type: 'error', message: msg });
        } finally {
            setPwdLoading(false);
            setTimeout(() => setPwdStatus(null), 5000);
        }
    };

    const displayInitial = name ? name.charAt(0).toUpperCase() : (email ? email.charAt(0).toUpperCase() : '?');

    return (
        <div className="space-y-8 max-w-3xl">
            {/* ── Page Header ── */}
            <div className="bg-white border border-gray-200 rounded-2xl px-6 py-5 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-500 text-sm mt-1">Manage your account, security and preferences.</p>
            </div>

            {/* ── Profile Information ── */}
            <SectionCard>
                <SectionHeader icon={User} label="Profile Information" iconBg="bg-emerald-50" iconColor="text-emerald-600" />

                {/* Avatar + current info */}
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-2xl font-black select-none shrink-0 shadow-md">
                        {fetching ? <Loader2 className="w-6 h-6 animate-spin opacity-70" /> : displayInitial}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 text-base">{fetching ? '…' : (name || 'User')}</p>
                        <p className="text-gray-400 text-sm">{fetching ? '…' : (email || '')}</p>
                        <span className="inline-block mt-1 px-2.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                            Verified
                        </span>
                    </div>
                </div>

                {profileStatus && <Alert type={profileStatus.type} message={profileStatus.message} />}

                <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                            <input
                                id="profile-name"
                                type="text"
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                disabled={fetching}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50
                  focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-gray-900
                  disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                            />
                        </div>
                        <div>
                            <label htmlFor="profile-email" className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                            <input
                                id="profile-email"
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                disabled={fetching}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50
                  focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-gray-900
                  disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                            />
                        </div>
                    </div>

                    {/* Annual Income */}
                    <div>
                        <label htmlFor="profile-income" className="block text-sm font-medium text-gray-700 mb-1.5">
                            Annual Income
                            <span className="text-gray-400 font-normal text-xs ml-1">(optional — updates your dashboard charts)</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium pointer-events-none">$</span>
                            <input
                                id="profile-income"
                                type="number"
                                min="0"
                                step="1000"
                                value={annualIncome}
                                onChange={e => setAnnualIncome(e.target.value)}
                                disabled={fetching}
                                placeholder="e.g. 75000"
                                className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50
                  focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-gray-900
                  disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                            />
                        </div>
                        {annualIncome && Number(annualIncome) > 0 && (
                            <p className="text-xs text-emerald-600 mt-1">
                                ≈ ${Math.round(Number(annualIncome) / 12).toLocaleString()}/month · Dashboard charts will update on save
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={profileLoading || fetching}
                        className="flex items-center gap-2 py-2.5 px-5 bg-gradient-to-r from-emerald-500 to-teal-500
              hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-sm
              hover:shadow-md transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {profileLoading
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                            : <><Save className="w-4 h-4" /> Save Profile</>
                        }
                    </button>
                </form>
            </SectionCard>

            {/* ── Change Password ── */}
            <SectionCard>
                <SectionHeader icon={Lock} label="Change Password" iconBg="bg-yellow-50" iconColor="text-yellow-600" />

                {pwdStatus && <Alert type={pwdStatus.type} message={pwdStatus.message} />}

                <form onSubmit={handleSavePassword} className="space-y-4">
                    {[
                        { label: 'Current Password', val: oldPwd, set: setOldPwd, id: 'old-pwd' },
                        { label: 'New Password', val: newPwd, set: setNewPwd, id: 'new-pwd' },
                        { label: 'Confirm Password', val: confirmPwd, set: setConfirmPwd, id: 'conf-pwd' },
                    ].map(f => (
                        <div key={f.id}>
                            <label htmlFor={f.id} className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                            <div className="relative">
                                <input
                                    id={f.id}
                                    type={showPwd ? 'text' : 'password'}
                                    value={f.val}
                                    onChange={e => f.set(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50
                    focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-gray-900 pr-10 transition-all"
                                />
                                {f.id === 'old-pwd' && (
                                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    {newPwd && confirmPwd && newPwd !== confirmPwd && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Passwords do not match.
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={pwdLoading || !oldPwd || !newPwd || newPwd !== confirmPwd}
                        className="flex items-center gap-2 py-2.5 px-5 bg-gradient-to-r from-emerald-500 to-teal-500
              hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-sm
              hover:shadow-md transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {pwdLoading
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</>
                            : <><Shield className="w-4 h-4" /> Update Password</>
                        }
                    </button>
                </form>
            </SectionCard>

            {/* ── Danger Zone ── */}
            <SectionCard className="border-red-200">
                <SectionHeader icon={Trash2} label="Data & Privacy" iconBg="bg-red-50" iconColor="text-red-600" />
                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                    <p className="text-sm font-semibold text-red-700 mb-1">Delete Account Data</p>
                    <p className="text-xs text-red-500 mb-4">
                        Permanently deletes all your transactions, analytics, and account information. This action cannot be undone.
                    </p>
                    {!deleteConfirm ? (
                        <button
                            onClick={() => setDeleteConfirm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors"
                        >
                            <Trash2 className="w-4 h-4" /> Delete My Data
                        </button>
                    ) : (
                        <div className="flex items-center gap-3 flex-wrap">
                            <p className="text-xs text-red-700 font-semibold">Are you absolutely sure?</p>
                            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs rounded-xl font-semibold transition-colors">
                                Confirm Delete
                            </button>
                            <button
                                onClick={() => setDeleteConfirm(false)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-xl font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </SectionCard>
        </div>
    );
}
