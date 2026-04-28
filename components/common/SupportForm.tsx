'use client';

import { Mail, Phone, Send, Loader2, User, AlertCircle, Clock, CheckCircle2, Shield, HeadphonesIcon, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { submitSupportRequestAction, checkSupportCooldownAction } from '@/app/support-actions';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';

const COOLDOWN_KEY = 'nbf_support_last_submit';
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

function formatTimeRemaining(ms: number) {
    const h = Math.floor(ms / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (h > 0) return `${h}h ${m}m`;
    return `${m} minutes`;
}

export function SupportForm() {
    const { user } = useAuth();
    const router = useRouter();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        subject: 'Account Ban Appeal',
        message: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [cooldownRemaining, setCooldownRemaining] = useState(0);
    const [isCooldownChecking, setIsCooldownChecking] = useState(true);

    // Auto-fill user data
    useEffect(() => {
        if (user) {
            const nameParts = (user.user_metadata?.full_name || user.user_metadata?.name || '').split(' ');
            setFormData(prev => ({
                ...prev,
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                email: user.email || '',
                phoneNumber: user.user_metadata?.phone_number || ''
            }));

            // Check server-side cooldown for logged-in users
            checkSupportCooldownAction(user.email || '', user.id).then(result => {
                if (!result.canSubmit) {
                    const remaining = ((result.hoursRemaining || 0) * 60 * 60 + (result.minutesRemaining || 0) * 60) * 1000;
                    setCooldownRemaining(remaining);
                }
                setIsCooldownChecking(false);
            });
        } else {
            // For guests: check localStorage
            const lastSubmit = localStorage.getItem(COOLDOWN_KEY);
            if (lastSubmit) {
                const elapsed = Date.now() - parseInt(lastSubmit);
                if (elapsed < COOLDOWN_MS) {
                    setCooldownRemaining(COOLDOWN_MS - elapsed);
                }
            }
            setIsCooldownChecking(false);
        }
    }, [user]);

    // Live countdown timer
    useEffect(() => {
        if (cooldownRemaining <= 0) return;
        const interval = setInterval(() => {
            setCooldownRemaining(prev => {
                const next = prev - 1000;
                if (next <= 0) { clearInterval(interval); return 0; }
                return next;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [cooldownRemaining]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (cooldownRemaining > 0) {
            toast.error(`Please wait ${formatTimeRemaining(cooldownRemaining)} before submitting again.`);
            return;
        }
        setIsSubmitting(true);
        try {
            const result = await submitSupportRequestAction({ ...formData, userId: user?.id });

            if (!result.success) {
                if (result.cooldown) {
                    const remaining = ((result.hoursRemaining || 0) * 60 * 60 + (result.minutesRemaining || 0) * 60) * 1000;
                    setCooldownRemaining(remaining);
                    toast.error(`Already submitted! Wait ${formatTimeRemaining(remaining)}`);
                } else {
                    toast.error(result.error || 'Failed to submit. Please try again.');
                }
            } else {
                // Save cooldown timestamp to localStorage for guests
                localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
                setCooldownRemaining(COOLDOWN_MS);
                setSubmitted(true);
            }
        } catch {
            toast.error('An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Success State ──────────────────────────────────────────────────────
    if (submitted) {
        return (
            <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-10 max-w-xl mx-auto text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">Request Received!</h2>
                <p className="text-neutral-500 mb-2">Our team will review your appeal within <strong>24 hours</strong>.</p>
                <p className="text-sm text-neutral-400 mb-8">You can submit another request after 24 hours.</p>
                <button
                    onClick={() => router.push('/')}
                    className="px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors"
                >
                    Return to Home
                </button>
            </div>
        );
    }

    // ── Cooldown State ─────────────────────────────────────────────────────
    if (!isCooldownChecking && cooldownRemaining > 0) {
        return (
            <div className="bg-white rounded-3xl shadow-sm border border-amber-100 p-10 max-w-xl mx-auto text-center">
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-10 h-10 text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">Request Already Sent</h2>
                <p className="text-neutral-500 mb-4">You have already submitted a support request recently. Please wait before sending another.</p>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
                    <p className="text-xs text-amber-600 font-bold uppercase tracking-wider mb-1">Time Remaining</p>
                    <p className="text-4xl font-bold text-amber-700 tabular-nums">
                        {formatTimeRemaining(cooldownRemaining)}
                    </p>
                </div>
                <p className="text-sm text-neutral-400">Our team is reviewing your previous request. We'll get back to you shortly.</p>
                <button
                    onClick={() => router.push('/')}
                    className="mt-6 px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors"
                >
                    Go to Homepage
                </button>
            </div>
        );
    }

    // ── Main Form ──────────────────────────────────────────────────────────
    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Header Card */}
            <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-3xl p-8 mb-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <HeadphonesIcon className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-semibold text-red-100 uppercase tracking-wider">Support Centre</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">Submit an Appeal</h1>
                    <p className="text-red-100 text-sm leading-relaxed">
                        Banned or having issues? Fill the form below. We review all requests within 24 hours.
                    </p>
                    {/* Trust badges */}
                    <div className="flex flex-wrap gap-3 mt-5">
                        {['Strictly Confidential', '24h Response', 'Zero Brokerage'].map(badge => (
                            <span key={badge} className="flex items-center gap-1.5 bg-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                                <Shield className="w-3 h-3" /> {badge}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden">
                {/* Warning Banner */}
                <div className="px-8 pt-8">
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-sm text-amber-800">
                            You can only submit <strong>one request per 24 hours</strong>. Make sure to explain your issue clearly.
                        </p>
                    </div>
                </div>

                <form className="px-8 pb-8 space-y-5" onSubmit={handleSubmit}>
                    {/* Name row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="firstName" className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                                First Name *
                            </label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <input
                                    type="text" id="firstName" required
                                    value={formData.firstName} onChange={handleChange}
                                    placeholder="John"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm bg-neutral-50 focus:bg-white"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="lastName" className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                                Last Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <input
                                    type="text" id="lastName"
                                    value={formData.lastName} onChange={handleChange}
                                    placeholder="Doe"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm bg-neutral-50 focus:bg-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                            Email Address *
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="email" id="email" required
                                value={formData.email} onChange={handleChange}
                                readOnly={!!user}
                                placeholder="you@example.com"
                                className={`w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm ${user ? 'bg-neutral-100 text-neutral-500 cursor-not-allowed' : 'bg-neutral-50 focus:bg-white'}`}
                            />
                        </div>
                        {user && <p className="text-xs text-neutral-400 mt-1">Auto-filled from your account</p>}
                    </div>

                    {/* Phone */}
                    <div>
                        <label htmlFor="phoneNumber" className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                            Phone Number
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="tel" id="phoneNumber"
                                value={formData.phoneNumber} onChange={handleChange}
                                placeholder="+91 99999 99999"
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm bg-neutral-50 focus:bg-white"
                            />
                        </div>
                    </div>

                    {/* Subject */}
                    <div>
                        <label htmlFor="subject" className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                            Reason / Subject *
                        </label>
                        <select
                            id="subject" required
                            value={formData.subject} onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm bg-neutral-50 focus:bg-white appearance-none"
                        >
                            <option value="Account Ban Appeal">🚫 Account Ban Appeal</option>
                            <option value="Property Removed">🏠 Property Removed — Appeal</option>
                            <option value="Technical Issue">🛠 Technical Issue</option>
                            <option value="Billing / Payment">💳 Billing / Payment</option>
                            <option value="Other Support">💬 Other Support</option>
                        </select>
                    </div>

                    {/* Message */}
                    <div>
                        <label htmlFor="message" className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                            Explain Your Issue *
                        </label>
                        <textarea
                            id="message" required rows={5}
                            value={formData.message} onChange={handleChange}
                            placeholder="Describe your situation clearly. Include any relevant details (dates, screenshots, etc.)..."
                            className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm bg-neutral-50 focus:bg-white resize-none"
                        />
                        <p className="text-xs text-neutral-400 mt-1">{formData.message.length}/500 characters</p>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isSubmitting || isCooldownChecking}
                        className="w-full py-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-red-600/20 hover:shadow-red-600/30 hover:-translate-y-0.5 active:translate-y-0"
                    >
                        {isSubmitting
                            ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
                            : <><Send className="w-5 h-5" /> Submit Appeal <ChevronRight className="w-4 h-4" /></>
                        }
                    </button>

                    <p className="text-center text-xs text-neutral-400">
                        One submission per 24 hours • Strictly confidential
                    </p>
                </form>
            </div>
        </div>
    );
}
