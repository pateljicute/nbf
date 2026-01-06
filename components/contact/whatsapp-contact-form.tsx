'use client';

import { Mail, MapPin, Phone, Send, MessageCircle } from 'lucide-react';
import { useState } from 'react';

export function WhatsappContactForm() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        subject: 'General Inquiry',
        message: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const { firstName, lastName, email, subject, message } = formData;
        const name = `${firstName} ${lastName}`.trim();

        const whatsappUrl = `https://wa.me/917470724553?text=Name: ${encodeURIComponent(name)}%0AEmail: ${encodeURIComponent(email)}%0ASubject: ${encodeURIComponent(subject)}%0AMessage: ${encodeURIComponent(message)}`;

        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-neutral-200">
                <h2 className="text-2xl font-bold text-neutral-900 mb-6">Send us a message</h2>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="firstName" className="text-sm font-medium text-neutral-700">First Name</label>
                            <input
                                type="text"
                                id="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                                placeholder="John"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="lastName" className="text-sm font-medium text-neutral-700">Last Name</label>
                            <input
                                type="text"
                                id="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                                placeholder="Doe"
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-neutral-700">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                            placeholder="john@example.com"
                            required
                        />
                    </div>
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
                    <div className="space-y-2">
                        <label htmlFor="message" className="text-sm font-medium text-neutral-700">Message</label>
                        <textarea
                            id="message"
                            rows={4}
                            value={formData.message}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                            placeholder="How can we help you?"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full py-4 bg-[#25D366] text-white font-bold rounded-lg hover:bg-[#128C7E] transition-colors flex items-center justify-center gap-2">
                        Send Message via WhatsApp <MessageCircle className="w-5 h-5" />
                    </button>
                </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
                <div className="bg-neutral-900 text-white p-8 md:p-10 rounded-2xl">
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
