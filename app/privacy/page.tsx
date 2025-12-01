import { PageLayout } from '@/components/layout/page-layout';

export default function PrivacyPage() {
    return (
        <PageLayout>
            <div className="bg-white min-h-screen pt-24 pb-12">
                <div className="max-w-4xl mx-auto px-6 md:px-12">
                    <h1 className="text-4xl md:text-5xl font-serif font-medium text-neutral-900 mb-8">Privacy Policy</h1>
                    <p className="text-neutral-500 mb-12">Last updated: November 29, 2024</p>

                    <div className="prose prose-neutral max-w-none">
                        <p>
                            NBFHOMES ("us", "we", or "our") operates the NBFHOMES website (the "Service"). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
                        </p>

                        <h3>1. Information Collection and Use</h3>
                        <p>
                            We collect several different types of information for various purposes to provide and improve our Service to you.
                        </p>
                        <h4>Types of Data Collected</h4>
                        <ul>
                            <li><strong>Personal Data:</strong> While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you ("Personal Data"). This may include Email address, First name and last name, Phone number, Address, State, Province, ZIP/Postal code, City.</li>
                            <li><strong>Usage Data:</strong> We may also collect information how the Service is accessed and used ("Usage Data").</li>
                        </ul>

                        <h3>2. Use of Data</h3>
                        <p>
                            NBFHOMES uses the collected data for various purposes:
                        </p>
                        <ul>
                            <li>To provide and maintain the Service</li>
                            <li>To notify you about changes to our Service</li>
                            <li>To allow you to participate in interactive features of our Service when you choose to do so</li>
                            <li>To provide customer care and support</li>
                            <li>To provide analysis or valuable information so that we can improve the Service</li>
                            <li>To monitor the usage of the Service</li>
                            <li>To detect, prevent and address technical issues</li>
                        </ul>

                        <h3>3. Transfer of Data</h3>
                        <p>
                            Your information, including Personal Data, may be transferred to — and maintained on — computers located outside of your state, province, country or other governmental jurisdiction where the data protection laws may differ than those from your jurisdiction.
                        </p>

                        <h3>4. Security of Data</h3>
                        <p>
                            The security of your data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
                        </p>

                        <h3>5. Service Providers</h3>
                        <p>
                            We may employ third party companies and individuals to facilitate our Service ("Service Providers"), to provide the Service on our behalf, to perform Service-related services or to assist us in analyzing how our Service is used.
                        </p>

                        <h3>6. Links to Other Sites</h3>
                        <p>
                            Our Service may contain links to other sites that are not operated by us. If you click on a third party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit.
                        </p>

                        <h3>7. Contact Us</h3>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us at privacy@nbfhomes.com.
                        </p>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
