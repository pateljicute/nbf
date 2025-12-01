import { PageLayout } from '@/components/layout/page-layout';
import { Shield, Lock, Eye, AlertTriangle } from 'lucide-react';

export default function SafetyPage() {
    return (
        <PageLayout>
            <div className="bg-white min-h-screen pt-24 pb-12">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                            <Shield className="w-8 h-8 text-blue-600" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-serif font-medium text-neutral-900 mb-6">Safety First</h1>
                        <p className="text-xl text-neutral-600">
                            Your safety is our top priority. Here are some guidelines to ensure a secure experience on NBFHOMES.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-24">
                        <div className="bg-neutral-50 p-8 rounded-2xl border border-neutral-200">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="p-3 bg-white rounded-lg shadow-sm">
                                    <Lock className="w-6 h-6 text-neutral-900" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-neutral-900 mb-2">Secure Payments</h3>
                                    <p className="text-neutral-600 leading-relaxed">
                                        Never transfer money directly to a bank account before visiting the property and signing an agreement. Use our secure payment gateway for token amounts if available, or ensure you have a valid receipt.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-neutral-50 p-8 rounded-2xl border border-neutral-200">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="p-3 bg-white rounded-lg shadow-sm">
                                    <Eye className="w-6 h-6 text-neutral-900" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-neutral-900 mb-2">Visit in Person</h3>
                                    <p className="text-neutral-600 leading-relaxed">
                                        Always visit the property in person to verify its condition and amenities. We recommend visiting during the day and taking a friend or family member along.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-neutral-50 p-8 rounded-2xl border border-neutral-200">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="p-3 bg-white rounded-lg shadow-sm">
                                    <Shield className="w-6 h-6 text-neutral-900" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-neutral-900 mb-2">Verify Identity</h3>
                                    <p className="text-neutral-600 leading-relaxed">
                                        Ask for identification proof from the owner or landlord before signing any documents. Ensure the person showing the property is authorized to do so.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-neutral-50 p-8 rounded-2xl border border-neutral-200">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="p-3 bg-white rounded-lg shadow-sm">
                                    <AlertTriangle className="w-6 h-6 text-neutral-900" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-neutral-900 mb-2">Report Suspicious Activity</h3>
                                    <p className="text-neutral-600 leading-relaxed">
                                        If you encounter a listing that seems fake, or if a user behaves inappropriately, please report it immediately using the "Report" button on the listing page or contact our support.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8 md:p-12 text-center">
                        <h2 className="text-2xl font-serif font-medium text-neutral-900 mb-4">Need immediate assistance?</h2>
                        <p className="text-neutral-600 mb-8 max-w-2xl mx-auto">
                            Our trust and safety team is available 24/7 to help you with any concerns.
                        </p>
                        <a href="/contact" className="inline-block px-8 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-colors">
                            Contact Trust & Safety
                        </a>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
