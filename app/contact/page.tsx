

import { PageLayout } from '@/components/layout/page-layout';
import { WhatsappContactForm } from '@/components/contact/whatsapp-contact-form';

// Server Component
export default function ContactPage() {
    return (
        <PageLayout>
            <div className="bg-neutral-50 min-h-screen pt-24 pb-12">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    {/* Header */}
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h1 className="text-4xl md:text-5xl font-serif font-medium text-neutral-900 mb-6">Get in Touch with NBF Homes</h1>
                        <p className="text-xl text-neutral-600">
                            Have questions about finding a home or listing your property? We're here to help.
                        </p>
                    </div>

                    <WhatsappContactForm />
                </div>
            </div>
        </PageLayout>
    );
}
