import { PageLayout } from '@/components/layout/page-layout';
import { ArrowRight, Briefcase, Code, Megaphone } from 'lucide-react';

export default function CareersPage() {
    const positions = [
        {
            title: 'Senior Frontend Engineer',
            department: 'Engineering',
            location: 'Remote / Bangalore',
            type: 'Full-time',
            icon: <Code className="w-6 h-6" />
        },
        {
            title: 'Product Designer',
            department: 'Design',
            location: 'Bangalore',
            type: 'Full-time',
            icon: <Briefcase className="w-6 h-6" />
        },
        {
            title: 'Marketing Manager',
            department: 'Marketing',
            location: 'Remote',
            type: 'Full-time',
            icon: <Megaphone className="w-6 h-6" />
        }
    ];

    return (
        <PageLayout>
            <div className="bg-white min-h-screen pt-24">
                {/* Header */}
                <section className="max-w-7xl mx-auto px-6 md:px-12 mb-24 text-center">
                    <h1 className="text-5xl md:text-7xl font-serif font-medium text-neutral-900 mb-8">
                        Build the Future of <br /> Housing with Us
                    </h1>
                    <p className="text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed">
                        We're looking for passionate individuals who want to solve real-world problems and make finding a home a joy, not a chore.
                    </p>
                </section>

                {/* Benefits Grid */}
                <section className="bg-neutral-50 py-24">
                    <div className="max-w-7xl mx-auto px-6 md:px-12">
                        <h2 className="text-3xl font-serif font-medium text-neutral-900 mb-12 text-center">Why Join NBFHOMES?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { title: 'Remote First', desc: 'Work from anywhere. We believe in output, not hours.' },
                                { title: 'Health & Wellness', desc: 'Comprehensive health insurance for you and your family.' },
                                { title: 'Learning Budget', desc: 'Annual stipend for courses, books, and conferences.' },
                                { title: 'Competitive Pay', desc: 'Top-tier salary and equity packages.' },
                                { title: 'Team Retreats', desc: 'Quarterly meetups in exotic locations to bond and brainstorm.' },
                                { title: 'Impact', desc: 'Your work directly affects thousands of people finding their homes.' }
                            ].map((benefit, i) => (
                                <div key={i} className="bg-white p-8 rounded-xl border border-neutral-200">
                                    <h3 className="text-lg font-bold text-neutral-900 mb-2">{benefit.title}</h3>
                                    <p className="text-neutral-600 text-sm">{benefit.desc}</p>
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
                                <a href={`mailto:careers@nbfhomes.com?subject=Application for ${job.title}`} className="mt-4 md:mt-0 flex items-center text-neutral-900 font-medium group-hover:translate-x-2 transition-transform">
                                    Apply Now <ArrowRight className="ml-2 w-4 h-4" />
                                </a>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </PageLayout>
    );
}
