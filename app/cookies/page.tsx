import { PageLayout } from '@/components/layout/page-layout';

export default function CookiePolicyPage() {
    return (
        <PageLayout>
            <div className="bg-white min-h-screen pt-24 pb-12">
                <div className="max-w-4xl mx-auto px-6 md:px-12">
                    <h1 className="text-4xl md:text-5xl font-serif font-medium text-neutral-900 mb-8">Cookie Policy</h1>
                    <p className="text-neutral-500 mb-12">Last updated: November 29, 2024</p>

                    <div className="prose prose-neutral max-w-none">
                        <p>
                            This Cookie Policy explains what cookies are and how we use them. You should read this policy so you can understand what type of cookies we use, or the information we collect using cookies and how that information is used.
                        </p>

                        <h3>1. What are cookies?</h3>
                        <p>
                            Cookies are small text files that are sent to your web browser by a website you visit. A cookie file is stored in your web browser and allows the Service or a third-party to recognize you and make your next visit easier and the Service more useful to you.
                        </p>

                        <h3>2. How NBFHOMES uses cookies</h3>
                        <p>
                            When you use and access the Service, we may place a number of cookies files in your web browser. We use cookies for the following purposes:
                        </p>
                        <ul>
                            <li>To enable certain functions of the Service</li>
                            <li>To provide analytics</li>
                            <li>To store your preferences</li>
                            <li>To enable advertisements delivery, including behavioral advertising</li>
                        </ul>

                        <h3>3. Types of cookies we use</h3>
                        <ul>
                            <li><strong>Essential cookies:</strong> We may use essential cookies to authenticate users and prevent fraudulent use of user accounts.</li>
                            <li><strong>Preferences cookies:</strong> We may use preferences cookies to remember information that changes the way the Service behaves or looks, such as the "remember me" functionality of a registered user or a user's language preference.</li>
                            <li><strong>Analytics cookies:</strong> We may use analytics cookies to track information how the Service is used so that we can make improvements. We may also use analytics cookies to test new advertisements, pages, features or new functionality of the Service to see how our users react to them.</li>
                        </ul>

                        <h3>4. Your choices regarding cookies</h3>
                        <p>
                            If you'd like to delete cookies or instruct your web browser to delete or refuse cookies, please visit the help pages of your web browser. Please note, however, that if you delete cookies or refuse to accept them, you might not be able to use all of the features we offer, you may not be able to store your preferences, and some of our pages might not display properly.
                        </p>

                        <h3>5. Contact Us</h3>
                        <p>
                            If you have any questions about this Cookie Policy, please contact us at privacy@nbfhomes.com.
                        </p>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
