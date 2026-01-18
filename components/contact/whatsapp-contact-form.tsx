'use client';

import { Mail, MapPin, Phone, Send, MessageCircle, AlertTriangle, Loader2, User } from 'lucide-react';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { submitInquiryAction } from '@/app/actions';
import { toast } from 'sonner';

import { useAuth } from '@/lib/auth-context';

function ContactFormContent() {
    const searchParams = useSearchParams();
    const propertyId = searchParams.get('propertyId');
    const propertyHandle = searchParams.get('handle');
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        subject: propertyId ? `Report for Property: ${propertyHandle || propertyId}` : 'General Inquiry',
        reportReason: 'Incorrect Information',
        message: ''
    });

    // Auto-fill user data when available
    useState(() => {
        if (user) {
            const nameParts = (user.user_metadata?.full_name || user.user_metadata?.name || '').split(' ');
            setFormData(prev => ({
                ...prev,
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                email: user.email || '',
                phoneNumber: user.user_metadata?.phone_number || '' // If available in metadata
            }));
        }
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        });
    };

    const handleReasonChange = (reason: string) => {
        setFormData({ ...formData, reportReason: reason });
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const { firstName, lastName, email, phoneNumber, subject, message, reportReason } = formData;

        // Combine Reason with Message for database storage if needed, or separate field if schema allows.
        // For now, we prepend it to the message or subject for clarity in Admin Panel.
        const finalMessage = propertyId ? `[Reason: ${reportReason}] ${message}` : message;

        try {
            // Save to Database
            const result = await submitInquiryAction({
                firstName,
                lastName,
                email,
                subject,
                message: finalMessage,
                phoneNumber: phoneNumber,
                propertyId: propertyId || undefined
            });

            if (!result.success) {
                console.error('Failed to save inquiry:', result.error);
                toast.error('Failed to submit report. Please try again.');
            } else {
                toast.success(propertyId ? 'Report submitted successfully!' : 'Message sent successfully!');
                if (!propertyId) {
                    setFormData({ firstName: '', lastName: '', email: '', phoneNumber: '', subject: 'General Inquiry', reportReason: '', message: '' });
                }
            }
        } catch (error) {
            console.error('Error in contact form:', error);
            toast.error('An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const reportReasons = [
        "Incorrect Information",
        "Property Sold/Rented Out",
        "Fraudulent Listing",
        "Owner Not Responding",
        "Other"
    ];

    return (
        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-neutral-200">
            <h2 className={`text-2xl font-bold mb-6 ${propertyId ? 'text-red-600' : 'text-neutral-900'}`}>
                {propertyId ? 'Report this Property' : 'Send us a message'}
            </h2>

            {propertyId && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-800">
                        Please provide details about the issue with this property. We take reports seriously and investigate all claims.
                    </p>
                </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="firstName" className="text-sm font-medium text-neutral-700">First Name</label>
                        <div className="relative">
                            <input
                                type="text"
                                id="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                className="w-full pl-11 pr-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                                placeholder="John"
                                required
                            />
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="lastName" className="text-sm font-medium text-neutral-700">Last Name</label>
                        <div className="relative">
                            <input
                                type="text"
                                id="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                className="w-full pl-11 pr-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                                placeholder="Doe"
                                required
                            />
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-neutral-700">Email</label>
                    <div className="relative">
                        <input
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full pl-11 pr-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                            placeholder="john@example.com"
                            required
                        />
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="phoneNumber" className="text-sm font-medium text-neutral-700">Phone Number (Optional)</label>
                    <div className="relative">
                        <input
                            type="tel"
                            id="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            className="w-full pl-11 pr-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                            placeholder="+91 99999 99999"
                        />
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    </div>
                </div>

                {propertyId && (
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-neutral-700">Reason for Reporting</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {reportReasons.map((reason) => (
                                <button
                                    key={reason}
                                    type="button"
                                    onClick={() => handleReasonChange(reason)}
                                    className={`px-4 py-2 text-sm text-left rounded-lg border transition-all ${formData.reportReason === reason
                                        ? 'bg-red-50 border-red-200 text-red-700 font-medium ring-1 ring-red-200'
                                        : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                                        }`}
                                >
                                    {reason}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {!propertyId && (
                    <div className="space-y-2">
                        <label htmlFor="subject" className="text-sm font-medium text-neutral-700">Subject</label>
                        <select
                            id="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                        >
                            <option>General Inquiry</option>
                            <option>Support</option>
                            <option>Partnership</option>
                            <option>Report an Issue</option>
                        </select>
                    </div>
                )}

                <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium text-neutral-700">
                        {propertyId ? 'Additional Details' : 'Message'}
                    </label>
                    <textarea
                        id="message"
                        rows={4}
                        value={formData.message}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                        placeholder={propertyId ? "Please provide more details about why you are reporting this property..." : "How can we help you?"}
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-4 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${propertyId ? 'bg-red-600 hover:bg-red-700' : 'bg-neutral-900 hover:bg-neutral-800'
                        }`}
                >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (propertyId ? <AlertTriangle className="w-5 h-5" /> : <Send className="w-5 h-5" />)}
                    {isSubmitting ? 'Sending...' : (propertyId ? 'Submit Report' : 'Send Message')}
                </button>
            </form>
        </div>
    );
}

export function WhatsappContactForm() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Suspense fallback={<div className="bg-white h-96 rounded-2xl animate-pulse" />}>
                <ContactFormContent />
            </Suspense>

            {/* Contact Info */}
            <div className="space-y-8">
                <div className="bg-white border border-neutral-200 p-8 md:p-10 rounded-2xl">
                    <h3 className="text-2xl font-serif font-medium mb-6">Contact Information</h3>
                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <Mail className="w-6 h-6 text-neutral-400 mt-1" />
                            <div>
                                <p className="font-medium">Email</p>
                                <p className="text-neutral-400">nbfhomes@gmail.com</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <Phone className="w-6 h-6 text-neutral-400 mt-1" />
                            <div>
                                <p className="font-medium">Phone</p>
                                <p className="text-neutral-400">+91 7470724553</p>
                                <p className="text-neutral-400">Mon-Fri, 9am - 6pm IST</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <MapPin className="w-6 h-6 text-neutral-400 mt-1" />
                            <div>
                                <p className="font-medium">Office</p>
                                <p className="text-neutral-400">
                                    Mandsaur, Madhya Pradesh (Tier-3 City Hub)
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-neutral-200">
                    <h3 className="text-xl font-bold text-neutral-900 mb-4">Frequently Asked Questions</h3>
                    <p className="text-neutral-600 mb-4">
                        Find quick answers to common questions about our platform, booking process, and policies.
                    </p>
                    <a href="/faqs" className="text-neutral-900 font-medium underline hover:text-neutral-600">
                        Visit FAQ Page
                    </a>
                </div>
            </div>
        </div>
    );
}
