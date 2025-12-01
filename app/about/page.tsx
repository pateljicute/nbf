import { PageLayout } from '@/components/layout/page-layout';
import Image from 'next/image';

export default function AboutPage() {
    return (
        <PageLayout>
            <div className="bg-neutral-50 min-h-screen">
                {/* Hero Section */}
                <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-black/40 z-10" />
                        <Image
                            src="/hero-background.jpg"
                            alt="About Us Hero"
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>
                    <div className="relative z-20 text-center text-white px-4 max-w-4xl mx-auto">
                        <h1 className="text-5xl md:text-7xl font-serif font-medium mb-6">Redefining Home Finding</h1>
                        <p className="text-xl md:text-2xl font-light opacity-90">
                            We are on a mission to eliminate brokerage and make housing accessible for everyone.
                        </p>
                    </div>
                </section>

                {/* Mission Section */}
                <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-500 mb-4">Our Mission</h2>
                            <h3 className="text-4xl font-serif font-medium text-neutral-900 mb-6">
                                Zero Brokerage. <br /> Zero Hassle.
                            </h3>
                            <div className="space-y-6 text-neutral-600 text-lg leading-relaxed">
                                <p>
                                    Finding a home in a new city shouldn't cost you a fortune in brokerage fees. NBFHOMES was born out of the frustration of dealing with middlemen and hidden costs.
                                </p>
                                <p>
                                    We built a platform where property owners and seekers connect directly. No agents, no commissions, just verified listings and transparent conversations.
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
