import React from 'react';

export default function CookiePolicy() {
    return (
        <div className="min-h-screen bg-neutral-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 md:p-12">
                <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-6">Cookie Policy</h1>
                <p className="text-neutral-500 mb-8">Last Updated: January 18, 2026</p>

                <div className="prose prose-neutral max-w-none space-y-8">
                    <section>
                        <h2 className="text-xl font-bold text-neutral-900 mb-4">1. Introduction</h2>
                        <p className="text-neutral-600 leading-relaxed">
                            This Cookie Policy explains how NBF Homes ("we", "us", or "our") uses cookies and similar tracking technologies when you visit our website. By using our services, you consent to the use of cookies as described in this policy.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-neutral-900 mb-4">2. What are Cookies?</h2>
                        <p className="text-neutral-600 leading-relaxed">
                            Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit a website. They help the website recognize your device and remember your preferences and actions over time.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-neutral-900 mb-4">3. How We Use Cookies</h2>
                        <p className="text-neutral-600 leading-relaxed mb-4">
                            We use cookies for the following purposes:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-neutral-600">
                            <li><strong>Essential Cookies:</strong> Necessary for the operation of our website, such as authentication and security.</li>
                            <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website by collecting and reporting information anonymously.</li>
                            <li><strong>Functionality Cookies:</strong> Allow us to remember choices you make (such as your user name, language, or the region you are in) and provide enhanced, more personal features.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-neutral-900 mb-4">4. Managing Cookies</h2>
                        <p className="text-neutral-600 leading-relaxed">
                            You can control and/or delete cookies as you wish. You can delete all cookies that are already on your computer and you can set most browsers to prevent them from be placed. If you do this, however, you may have to manually adjust some preferences every time you visit a site and some services and functionalities may not work.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-neutral-900 mb-4">5. Contact Us</h2>
                        <p className="text-neutral-600 leading-relaxed">
                            If you have any questions about our Cookie Policy, please contact us at nbfhomes@gmail.com.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
