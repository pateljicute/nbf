import { PageLayout } from '@/components/layout/page-layout';

export default function TermsPage() {
    return (
        <PageLayout>
            <div className="bg-white min-h-screen pt-24 pb-12">
                <div className="max-w-4xl mx-auto px-6 md:px-12">
                    <h1 className="text-4xl md:text-5xl font-serif font-medium text-neutral-900 mb-8">Terms of Service</h1>
                    <p className="text-neutral-500 mb-12">Last Updated: January 18, 2026</p>

                    <div className="prose prose-neutral max-w-none">
                        <p>
                            Welcome to NBF Homes. By accessing our website (nbfhomes.in), you agree to follow these terms and conditions.
                        </p>

                        <h3>1. Nature of Service</h3>
                        <ul>
                            <li><strong>Information Platform:</strong> NBF Homes is a property listing platform that connects property owners with potential tenants.</li>
                            <li><strong>No Brokerage:</strong> We do not act as a broker or agent.</li>
                            <li><strong>Direct Connection:</strong> Our service allows users to contact each other directly via WhatsApp or phone.</li>
                        </ul>

                        <h3>2. User Responsibilities</h3>
                        <ul>
                            <li><strong>Accuracy:</strong> Owners are responsible for providing accurate property details, photos, and rent information.</li>
                            <li><strong>Verification:</strong> Tenants are advised to physically verify the property and the owner's identity before making any payments.</li>
                            <li><strong>Lawful Use:</strong> Users must not post any fraudulent, offensive, or illegal content.</li>
                        </ul>

                        <h3>3. Property Listings & Map Data</h3>
                        <ul>
                            <li><strong>Location Accuracy:</strong> While we provide a "Pick on Map" feature for ease of use, we do not guarantee the 100% accuracy of map coordinates provided by third-party services like Google Maps/Mapbox.</li>
                            <li><strong>Content Rights:</strong> By posting a property, owners grant NBF Homes the right to display that information publicly on the platform.</li>
                        </ul>

                        <h3>4. Limitation of Liability</h3>
                        <ul>
                            <li><strong>No Responsibility for Disputes:</strong> NBF Homes is not responsible for any disputes, financial losses, or disagreements that may arise between owners and tenants.</li>
                            <li><strong>Security:</strong> While we take measures to keep the platform secure, we are not liable for any technical issues or data breaches beyond our control.</li>
                        </ul>

                        <h3>5. Account Termination</h3>
                        <p>We reserve the right to remove any property listing or ban any user who violates these terms or engages in suspicious activity.</p>

                        <h3>6. Contact Us</h3>
                        <p>
                            For any questions regarding these Terms, please contact us at <a href="mailto:support@nbfhomes.com">support@nbfhomes.com</a>.
                        </p>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
