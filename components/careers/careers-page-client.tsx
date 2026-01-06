'use client';

import { ArrowRight, Code, MapPin, TrendingUp, Users, Globe, Laptop, Zap, Heart } from 'lucide-react';

export function CareersPageClient() {
    const positions = [
        {
            title: 'Full Stack Developer',
            department: 'Engineering',
            location: 'Remote / Mandsaur Hub',
            type: 'Full-time',
            icon: <Code className="w-6 h-6" />
        },
        {
            title: 'City Manager - Mandsaur & Neemuch',
            department: 'Operations',
            location: 'On-field / Hybrid',
            type: 'Full-time',
            icon: <MapPin className="w-6 h-6" />
        },
        {
            title: 'Digital Marketing Specialist',
            department: 'Marketing',
            location: 'Remote',
            type: 'Full-time',
            icon: <Globe className="w-6 h-6" />
        }
    ];

    const handleApply = (jobTitle: string) => {
        const message = `Hi NBF Homes, I am interested in the ${jobTitle} role. Here is my basic info...`;
        const waLink = `https://wa.me/917470724553?text=${encodeURIComponent(message)}`;
        window.open(waLink, '_blank');
    };

    return (
        <div className="bg-white min-h-screen pt-24">
            {/* Header */}
            <section className="max-w-7xl mx-auto px-6 md:px-12 mb-24 text-center">
                <h1 className="text-5xl md:text-7xl font-serif font-medium text-neutral-900 mb-8">
                    Build the Future of <br /> Local Housing with Us
                </h1>
                <p className="text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed">
                    We're changing the way you search for a home in Tier 3 and Tier 4 cities. If you want to make real estate transparent, join us.
                </p>
            </section>

            {/* Why Join NBFHOMES? */}
            <section className="bg-neutral-50 py-24">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <h2 className="text-3xl font-serif font-medium text-neutral-900 mb-12 text-center">Why Join NBFHOMES?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {[
                            {
                                title: 'Impact-First',
                                desc: 'Your work will directly help students and professionals who are looking for homes in new cities without brokerage.',
                                icon: <Heart className="w-6 h-6 text-red-500" />
                            },
                            {
                                title: 'Work with Freedom',
                                desc: "We are a 'Remote First' team. You can work with us from Mandsaur, Neemuch, Indore or any corner of the world.",
                                icon: <Laptop className="w-6 h-6 text-blue-500" />
                            },
                            {
                                title: 'Growth & Ownership',
                                desc: 'We are looking for partners, not just employees. Your suggestions and hard work will directly determine the future of the company.',
                                icon: <TrendingUp className="w-6 h-6 text-green-500" />
                            },
                            {
                                title: 'Technology Driven',
                                desc: 'We are bringing the small town real estate market online using cutting edge technology.',
                                icon: <Zap className="w-6 h-6 text-yellow-500" />
                            }
                        ].map((benefit, i) => (
                            <div key={i} className="bg-white p-8 rounded-xl border border-neutral-200 flex flex-col gap-4 hover:shadow-lg transition-shadow">
                                <div className="w-12 h-12 rounded-lg bg-neutral-50 flex items-center justify-center">
                                    {benefit.icon}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-neutral-900 mb-2">{benefit.title}</h3>
                                    <p className="text-neutral-600 leading-relaxed">{benefit.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Open Positions */}
            <section className="py-24 max-w-5xl mx-auto px-6 md:px-12">
                <h2 className="text-3xl font-serif font-medium text-neutral-900 mb-12">Open Positions</h2>
                <div className="space-y-4">
                    {positions.map((job, i) => (
                        <div key={i} className="group flex flex-col md:flex-row items-center justify-between p-6 bg-white border border-neutral-200 rounded-xl hover:border-neutral-900 transition-colors cursor-pointer">
                            <div className="flex items-center gap-6 w-full md:w-auto">
                                <div className="p-3 bg-neutral-100 rounded-lg text-neutral-900 group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                                    {job.icon}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-neutral-900">{job.title}</h3>
                                    <div className="flex items-center gap-4 text-sm text-neutral-500 mt-1">
                                        <span>{job.department}</span>
                                        <span>•</span>
                                        <span>{job.location}</span>
                                        <span>•</span>
                                        <span>{job.type}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleApply(job.title)}
                                className="mt-4 md:mt-0 flex items-center text-neutral-900 font-medium group-hover:translate-x-2 transition-transform bg-transparent border-none cursor-pointer"
                            >
                                Apply Now <ArrowRight className="ml-2 w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
