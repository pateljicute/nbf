import { PageLayout } from '@/components/layout/page-layout';

export default function TermsPage() {
    return (
        <PageLayout>
            <div className="bg-white min-h-screen pt-24 pb-12">
                <div className="max-w-4xl mx-auto px-6 md:px-12">
                    <h1 className="text-4xl md:text-5xl font-serif font-medium text-neutral-900 mb-8">Terms of Service</h1>
                    <p className="text-neutral-500 mb-12">Last updated: November 29, 2024</p>

                    <div className="prose prose-neutral max-w-none">
                        <p>
                            Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the NBFHOMES website (the "Service") operated by NBFHOMES ("us", "we", or "our").
                        </p>

                        <h3>1. Acceptance of Terms</h3>
                        <p>
                            By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the terms then you may not access the Service.
                        </p>

                        <h3>2. Description of Service</h3>
                        <p>
                            NBFHOMES provides an online platform that connects property owners with potential tenants for rental properties without brokerage fees. We act as an intermediary to facilitate these connections but are not a party to any rental agreement.
                        </p>

                        <h3>3. User Accounts</h3>
                        <p>
                            When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
                        </p>

                        <h3>4. Content</h3>
                        <p>
                            Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post to the Service, including its legality, reliability, and appropriateness.
                        </p>

                        <h3>5. Prohibited Uses</h3>
                        <p>
                            You may not use the Service for any illegal or unauthorized purpose. You agree not to post listings that are fake, misleading, or discriminatory.
                        </p>

                        <h3>6. Limitation of Liability</h3>
                        <p>
                            In no event shall NBFHOMES, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
                        </p>

                        <h3>7. Changes</h3>
                        <p>
                            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect.
                        </p>

                        <h3>8. Contact Us</h3>
                        <p>
                            If you have any questions about these Terms, please contact us at legal@nbfhomes.com.
                        </p>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
