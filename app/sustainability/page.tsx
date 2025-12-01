import { PageLayout } from '@/components/layout/page-layout';
import { Leaf, Recycle, Sun, Wind } from 'lucide-react';

export default function SustainabilityPage() {
    return (
        <PageLayout>
            <div className="bg-neutral-50 min-h-screen">
                {/* Hero */}
                <section className="relative h-[70vh] flex items-center justify-center bg-[#1a4d2e] text-white overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1518531933037-9a82bf55f363?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center" />
                    <div className="relative z-10 text-center max-w-4xl px-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium uppercase tracking-widest mb-6">
                            <Leaf className="w-4 h-4" /> Sustainability
                        </div>
                        <h1 className="text-5xl md:text-7xl font-serif font-medium mb-8">Building a Greener Tomorrow</h1>
                        <p className="text-xl md:text-2xl font-light opacity-90 leading-relaxed">
                            We believe that finding a home shouldn't cost the Earth. We are committed to reducing the carbon footprint of real estate.
                        </p>
                    </div>
                </section>

                {/* Initiatives */}
                <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-24">
                        <div>
                            <h2 className="text-4xl font-serif font-medium text-neutral-900 mb-6">Paperless Transactions</h2>
                            <p className="text-lg text-neutral-600 leading-relaxed mb-6">
                                Traditional real estate involves mountains of paperwork. At NBFHOMES, we have digitized the entire process. From rental agreements to verification documents, everything is handled securely online.
                            </p>
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3 text-neutral-800 font-medium">
                                    <div className="w-2 h-2 rounded-full bg-green-600" />
                                    Saved 50,000+ sheets of paper in 2024
                                </li>
                                <li className="flex items-center gap-3 text-neutral-800 font-medium">
                                    <div className="w-2 h-2 rounded-full bg-green-600" />
                                    100% Digital Signatures
                                </li>
                            </ul>
                        </div>
                        <div className="bg-white p-12 rounded-3xl shadow-xl border border-neutral-100 flex items-center justify-center">
                            <Recycle className="w-48 h-48 text-green-600 opacity-20" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-2xl border border-neutral-200">
                            <Sun className="w-10 h-10 text-orange-500 mb-6" />
                            <h3 className="text-xl font-bold text-neutral-900 mb-3">Solar Powered Offices</h3>
                            <p className="text-neutral-600">Our headquarters and regional hubs run on 100% renewable solar energy.</p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl border border-neutral-200">
                            <Wind className="w-10 h-10 text-blue-500 mb-6" />
                            <h3 className="text-xl font-bold text-neutral-900 mb-3">Green Housing Badge</h3>
                            <p className="text-neutral-600">We highlight and promote properties that use eco-friendly materials and energy-efficient appliances.</p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl border border-neutral-200">
                            <Leaf className="w-10 h-10 text-green-500 mb-6" />
                            <h3 className="text-xl font-bold text-neutral-900 mb-3">Tree Planting</h3>
                            <p className="text-neutral-600">For every 100 homes rented through our platform, we plant a tree in an urban area.</p>
                        </div>
                    </div>
                </section>

                {/* Call to Action */}
                <section className="bg-neutral-900 text-white py-24 text-center">
                    <div className="max-w-3xl mx-auto px-6">
                        <h2 className="text-3xl md:text-4xl font-serif font-medium mb-6">Join the Movement</h2>
                        <p className="text-neutral-400 text-lg mb-8">
                            Are you a property owner with an eco-friendly home? List with us and get a special "Green Home" badge to attract conscious tenants.
                        </p>
                        <button className="px-8 py-4 bg-green-600 text-white font-bold rounded-full hover:bg-green-700 transition-colors">
                            List Green Property
                        </button>
                    </div>
                </section>
            </div>
        </PageLayout>
    );
}
