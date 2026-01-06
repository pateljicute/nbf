import { PageLayout } from '@/components/layout/page-layout';

export default function AboutPage() {
    return (
        <PageLayout>
            <div className="bg-neutral-50 min-h-screen">
                {/* Hero Section */}
                <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-black/40 z-10" />
                        <img
                            src="https://res.cloudinary.com/dla8a0y7n/image/upload/f_auto,q_auto,w_1600/v1764658021/hero-background_jdgiur.jpg"
                            alt="About Us Hero"
                            className="absolute inset-0 w-full h-full object-cover"
                            loading="lazy"
                        />
                    </div>
                    <div className="relative z-20 text-center text-white px-4 max-w-4xl mx-auto">
                        <h1 className="text-5xl md:text-7xl font-serif font-medium mb-6">Redefining Home Finding</h1>
                        <p className="text-xl md:text-2xl font-light opacity-90">
                            We are on a mission to eliminate brokerage and make housing accessible for everyone.
                        </p>
                    </div>
                </section>

                {/* Features: Why NBF Homes? (Moved from Homepage) */}
                <section className="max-w-7xl mx-auto px-6 md:px-12 py-16">
                    <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-neutral-200">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-serif font-bold text-neutral-900 mb-4">Why NBF Homes?</h2>
                            <div className="w-20 h-1 bg-black mx-auto rounded-full" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                            <div className="flex flex-col items-center text-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" x2="20" y1="8" y2="14" /><line x1="23" x2="17" y1="11" y2="11" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-neutral-900">Direct Owner Contact</h3>
                                <p className="text-neutral-600 leading-relaxed">
                                    No middlemen. No hidden agents. Talk directly to property owners.
                                </p>
                            </div>
                            <div className="flex flex-col items-center text-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-green-600 mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-neutral-900">Verified Listings</h3>
                                <p className="text-neutral-600 leading-relaxed">
                                    Every room and PG is manually verified for quality and transparency.
                                </p>
                            </div>
                            <div className="flex flex-col items-center text-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M5 21V7l8-4 8 4v14" /><path d="M17 21v-8H7v8" /><line x1="22" x2="22" y1="11" y2="13" /><line x1="2" x2="2" y1="11" y2="13" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-neutral-900">Local Expertise</h3>
                                <p className="text-neutral-600 leading-relaxed">
                                    Specially designed for Tier 1 to Tier 4 cities like Mandsaur, Neemuch, and Ratlam.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Mission Section */}
                <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-500 mb-4">Our Mission</h2>
                            <h3 className="text-4xl font-serif font-medium text-neutral-900 mb-6">
                                Redefining Home Finding in Your City.
                            </h3>
                            <div className="space-y-6 text-neutral-600 text-lg leading-relaxed">
                                <p>
                                    Finding a budget-friendly home shouldn't be a struggle. NBF Homes was built to empower students and working professionals to find their next stay effortlessly.
                                </p>
                                <p>
                                    We bring transparency to the local rental market by eliminating brokerage entirely.
                                </p>
                            </div>
                        </div>
                        <div className="relative h-[500px] bg-neutral-200 rounded-2xl overflow-hidden">
                            {/* Placeholder for team or office image */}
                            <div className="absolute inset-0 flex items-center justify-center text-neutral-400">
                                <span className="text-lg">Mission Image</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="bg-neutral-900 text-white py-24">
                    <div className="max-w-7xl mx-auto px-6 md:px-12">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                            <div>
                                <div className="text-5xl font-serif font-bold mb-2">10k+</div>
                                <div className="text-neutral-400 uppercase tracking-widest text-sm">Happy Tenants</div>
                            </div>
                            <div>
                                <div className="text-5xl font-serif font-bold mb-2">₹0</div>
                                <div className="text-neutral-400 uppercase tracking-widest text-sm">Brokerage Paid</div>
                            </div>
                            <div>
                                <div className="text-5xl font-serif font-bold mb-2">50+</div>
                                <div className="text-neutral-400 uppercase tracking-widest text-sm">Cities Covered</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Values Section */}
                <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-4xl font-serif font-medium text-neutral-900 mb-6">Our Core Values</h2>
                        <p className="text-neutral-600 text-lg">
                            Everything we do is guided by our commitment to transparency, trust, and community.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { title: 'Transparency', desc: 'No hidden fees, no fine print. What you see is what you get.' },
                            { title: 'Trust', desc: 'Every listing is verified to ensure your safety and peace of mind.' },
                            { title: 'Community', desc: 'We build relationships, not just transactions. Join our growing family.' }
                        ].map((value, i) => (
                            <div key={i} className="bg-white p-8 rounded-xl border border-neutral-200 hover:shadow-lg transition-shadow">
                                <h3 className="text-xl font-bold text-neutral-900 mb-4">{value.title}</h3>
                                <p className="text-neutral-600">{value.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </PageLayout>
    );
}
