import { PageLayout } from '@/components/layout/page-layout';
import { Mail, MapPin, Phone, Send } from 'lucide-react';

export default function ContactPage() {
    return (
        <PageLayout>
            <div className="bg-neutral-50 min-h-screen pt-24 pb-12">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    {/* Header */}
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h1 className="text-4xl md:text-5xl font-serif font-medium text-neutral-900 mb-6">Get in Touch</h1>
                        <p className="text-xl text-neutral-600">
                            Have questions about finding a home or listing your property? We're here to help.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Contact Form */}
                        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-neutral-200">
                            <h2 className="text-2xl font-bold text-neutral-900 mb-6">Send us a message</h2>
                            <form className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="firstName" className="text-sm font-medium text-neutral-700">First Name</label>
                                        <input type="text" id="firstName" className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5" placeholder="John" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="lastName" className="text-sm font-medium text-neutral-700">Last Name</label>
                                        <input type="text" id="lastName" className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5" placeholder="Doe" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium text-neutral-700">Email</label>
                                    <input type="email" id="email" className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5" placeholder="john@example.com" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="subject" className="text-sm font-medium text-neutral-700">Subject</label>
                                    <select id="subject" className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5">
                                        <option>General Inquiry</option>
                                        <option>Support</option>
                                        <option>Partnership</option>
                                        <option>Report an Issue</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="message" className="text-sm font-medium text-neutral-700">Message</label>
                                    <textarea id="message" rows={4} className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/5" placeholder="How can we help you?" />
                                </div>
                                <button type="submit" className="w-full py-4 bg-neutral-900 text-white font-bold rounded-lg hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2">
                                    Send Message <Send className="w-4 h-4" />
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
                                            <p className="text-neutral-400">support@nbfhomes.com</p>
                                            <p className="text-neutral-400">partners@nbfhomes.com</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <Phone className="w-6 h-6 text-neutral-400 mt-1" />
                                        <div>
                                            <p className="font-medium">Phone</p>
                                            <p className="text-neutral-400">+91 80 1234 5678</p>
                                            <p className="text-neutral-400">Mon-Fri, 9am - 6pm IST</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <MapPin className="w-6 h-6 text-neutral-400 mt-1" />
                                        <div>
                                            <p className="font-medium">Office</p>
                                            <p className="text-neutral-400">
                                                123, Startup Hub, Indiranagar<br />
                                                Bangalore, Karnataka 560038<br />
                                                India
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
                </div>
            </div>
        </PageLayout>
    );
}
