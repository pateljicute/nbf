import { PageLayout } from '@/components/layout/page-layout';
import { Search, Book, MessageCircle, Settings } from 'lucide-react';

export default function HelpCenterPage() {
    return (
        <PageLayout>
            <div className="bg-neutral-50 min-h-screen">
                {/* Hero Search */}
                <div className="bg-neutral-900 text-white py-24 px-6 md:px-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-serif font-medium mb-8">How can we help you?</h1>
                    <div className="max-w-2xl mx-auto relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search for help articles..."
                            className="w-full pl-12 pr-4 py-4 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-white/50"
                        />
                    </div>
                </div>

                {/* Categories */}
                <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 -mt-12 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-2xl shadow-lg border border-neutral-100 hover:-translate-y-1 transition-transform cursor-pointer">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                                <Book className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-neutral-900 mb-2">Getting Started</h3>
                            <p className="text-neutral-600 mb-4">Learn the basics of creating an account and searching for properties.</p>
                            <span className="text-blue-600 font-medium text-sm">View 5 articles &rarr;</span>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-lg border border-neutral-100 hover:-translate-y-1 transition-transform cursor-pointer">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                                <MessageCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-neutral-900 mb-2">Messaging & Booking</h3>
                            <p className="text-neutral-600 mb-4">How to contact owners, schedule visits, and secure your home.</p>
                            <span className="text-green-600 font-medium text-sm">View 8 articles &rarr;</span>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-lg border border-neutral-100 hover:-translate-y-1 transition-transform cursor-pointer">
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                                <Settings className="w-6 h-6 text-orange-600" />
                            </div>
                            <h3 className="text-xl font-bold text-neutral-900 mb-2">Account & Settings</h3>
                            <p className="text-neutral-600 mb-4">Manage your profile, password, and notification preferences.</p>
                            <span className="text-orange-600 font-medium text-sm">View 4 articles &rarr;</span>
                        </div>
                    </div>
                </div>

                {/* Popular Articles */}
                <div className="max-w-4xl mx-auto px-6 md:px-12 pb-24">
                    <h2 className="text-2xl font-serif font-medium text-neutral-900 mb-8">Popular Articles</h2>
                    <div className="space-y-4">
                        {[
                            'How to verify your phone number',
                            'Tips for writing a great bio',
                            'Understanding the rental agreement',
                            'What to do if an owner doesn\'t respond',
                            'How to report a listing'
                        ].map((article, i) => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-neutral-200 hover:border-neutral-400 transition-colors cursor-pointer flex items-center justify-between">
                                <span className="text-neutral-700 font-medium">{article}</span>
                                <span className="text-neutral-400">&rarr;</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
