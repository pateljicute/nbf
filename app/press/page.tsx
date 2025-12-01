'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { Download, Mail, X } from 'lucide-react';
import { useState } from 'react';

export default function PressPage() {
    const [showModal, setShowModal] = useState(false);

    const newsItems = [
        {
            source: 'TechCrunch',
            date: 'Oct 24, 2024',
            title: 'NBFHOMES raises Series A to revolutionize rental market in India',
            excerpt: 'The zero-brokerage platform is expanding to 20 new cities with its verified listing model.'
        },
        {
            source: 'Forbes',
            date: 'Sep 15, 2024',
            title: 'Top 30 Startups to Watch in 2025',
            excerpt: 'NBFHOMES makes the list for its innovative approach to solving the urban housing crisis.'
        },
        {
            source: 'The Economic Times',
            date: 'Aug 01, 2024',
            title: 'How NBFHOMES is saving tenants millions in brokerage fees',
            excerpt: 'A deep dive into the business model that is disrupting the traditional real estate agent network.'
        }
    ];

    return (
        <PageLayout>
            <div className="bg-white min-h-screen pt-24">
                {/* Header */}
                <section className="max-w-7xl mx-auto px-6 md:px-12 mb-24">
                    <h1 className="text-5xl md:text-7xl font-serif font-medium text-neutral-900 mb-8">Newsroom</h1>
                    <p className="text-xl text-neutral-600 max-w-2xl leading-relaxed">
                        Latest updates, press releases, and media resources from NBFHOMES.
                    </p>
                </section>

                {/* Featured News */}
                <section className="max-w-7xl mx-auto px-6 md:px-12 mb-24">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {newsItems.map((item, i) => (
                            <div key={i} className="flex flex-col p-8 bg-neutral-50 rounded-2xl">
                                <div className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-4">{item.source}</div>
                                <h3 className="text-2xl font-serif font-medium text-neutral-900 mb-4 leading-tight">{item.title}</h3>
                                <p className="text-neutral-600 mb-6 flex-1">{item.excerpt}</p>
                                <div className="text-sm text-neutral-500">{item.date}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Media Kit & Contact */}
                <section className="bg-neutral-900 text-white py-24">
                    <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-16">
                        <div>
                            <h2 className="text-3xl font-serif font-medium mb-6">Media Kit</h2>
                            <p className="text-neutral-400 mb-8 text-lg">
                                Download our official brand assets, logos, and executive headshots for media use.
                            </p>
                            <button 
                                onClick={() => setShowModal(true)}
                                className="flex items-center gap-3 px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-neutral-200 transition-colors"
                            >
                                <Download className="w-5 h-5" />
                                Download Assets (ZIP)
                            </button>
                        </div>
                        <div>
                            <h2 className="text-3xl font-serif font-medium mb-6">Press Contact</h2>
                            <p className="text-neutral-400 mb-8 text-lg">
                                For press inquiries, interviews, or partnership opportunities, please reach out to our communications team.
                            </p>
                            <a href="mailto:press@nbfhomes.com" className="flex items-center gap-3 text-xl font-medium hover:text-neutral-300 transition-colors">
                                <Mail className="w-6 h-6" />
                                press@nbfhomes.com
                            </a>
                        </div>
                    </div>
                </section>
            </div>

            {/* Media Kit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-neutral-900">Media Kit</h3>
                            <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-neutral-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-neutral-600 mb-6">
                            Our media kit is currently being prepared. Please contact our press team at press@nbfhomes.com for immediate media inquiries.
                        </p>
                        <button
                            onClick={() => setShowModal(false)}
                            className="w-full px-4 py-2 text-sm font-medium text-white bg-black hover:bg-neutral-800 rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </PageLayout>
    );
}
