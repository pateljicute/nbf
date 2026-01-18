import { PageLayout } from '@/components/layout/page-layout';

export default function PrivacyPage() {
    return (
        <PageLayout>
            <div className="bg-white min-h-screen pt-24 pb-12">
                <div className="max-w-4xl mx-auto px-6 md:px-12">
                    <h1 className="text-4xl md:text-5xl font-serif font-medium text-neutral-900 mb-8">Privacy Policy</h1>
                    <p className="text-neutral-500 mb-12">Last Updated: January 18, 2026</p>

                    <div className="prose prose-neutral max-w-none">
                        <p>
                            NBFHOMES ("us", "we", or "our") operates the NBFHOMES website (the "Service"). This policy explains how we keep your data safe and private.
                        </p>

                        <h3>1. Information Collection and Use</h3>
                        <p>We collect information to provide a better property searching experience.</p>
                        <ul>
                            <li><strong>Personal Data:</strong> We collect your Name, Phone Number, and Email only for account verification and connecting you with potential tenants/owners.</li>
                            <li><strong>Property Data:</strong> We store property details (Photos, Rent, Amenities) to display them on our service.</li>
                            <li><strong>Location Data:</strong> We use GPS and Map services to help you 'Pick on Map' and show properties in cities like Mandsaur or Neemuch.</li>
                        </ul>

                        <h3>2. Data Privacy & Direct Connection</h3>
                        <p>We respect your privacy and do not sell your personal data to third parties.</p>
                        <ul>
                            <li><strong>WhatsApp & Contact:</strong> Your phone number is only used to enable the "Contact" or "WhatsApp" button, allowing direct communication between owners and tenants without any middleman or brokerage.</li>
                            <li><strong>Visibility Control:</strong> Only the information you choose to provide in the "Property Listing" (like address and price) is shown to the public.</li>
                        </ul>

                        <h3>3. Data Security</h3>
                        <p>The security of your data is our priority.</p>
                        <ul>
                            <li>We use secure database systems (Supabase) to store your information and prevent unauthorized access.</li>
                            <li>While we strive to use commercially acceptable means to protect your Personal Data, no method of transmission over the Internet is 100% secure.</li>
                        </ul>

                        <h3>4. Your Choices</h3>
                        <ul>
                            <li><strong>Edit/Delete:</strong> Owners have the full right to edit their property details or delete their listing whenever they want.</li>
                            <li><strong>Location Access:</strong> You can choose to provide or deny location permissions, but some features like 'Pick on Map' may not function without it.</li>
                        </ul>

                        <h3>5. Contact Us</h3>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@nbfhomes.in.com">privacy@nbfhomes.in.com</a>.
                        </p>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
