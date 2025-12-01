import { PageLayout } from '@/components/layout/page-layout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function FAQsPage() {
    const faqs = [
        {
            category: 'General',
            items: [
                { q: 'What is NBFHOMES?', a: 'NBFHOMES is a zero-brokerage platform that connects property owners directly with tenants. We verify listings to ensure a safe and transparent experience.' },
                { q: 'Is it really free?', a: 'Yes! For tenants, searching and contacting owners is completely free. We do not charge any brokerage fees.' },
            ]
        },
        {
            category: 'For Tenants',
            items: [
                { q: 'How do I contact an owner?', a: 'Once you find a property you like, simply click on the "View Details" button to see the owner\'s contact information or send them a message directly through the platform.' },
                { q: 'Are the listings verified?', a: 'Yes, we have a strict verification process. We verify property documents and owner identity to ensure all listings on our platform are genuine.' },
                { q: 'Can I schedule a visit?', a: 'Absolutely. You can coordinate directly with the owner to schedule a visit at a time that works for both of you.' },
            ]
        },
        {
            category: 'For Owners',
            items: [
                { q: 'How do I list my property?', a: 'Click on the "Post Property" button, fill in the details about your property, upload photos, and submit. Your listing will go live after our verification team approves it.' },
                { q: 'How long does verification take?', a: 'Verification typically takes 24-48 hours. We may contact you for additional details during this process.' },
                { q: 'Can I edit my listing later?', a: 'Yes, you can manage your listings from your dashboard. You can update photos, price, and availability status at any time.' },
            ]
        }
    ];

    return (
        <PageLayout>
            <div className="bg-neutral-50 min-h-screen pt-24 pb-12">
                <div className="max-w-4xl mx-auto px-6 md:px-12">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-serif font-medium text-neutral-900 mb-6">Frequently Asked Questions</h1>
                        <p className="text-xl text-neutral-600">
                            Everything you need to know about NBFHOMES.
                        </p>
                    </div>

                    <div className="space-y-12">
                        {faqs.map((section, idx) => (
                            <div key={idx} className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
                                <h2 className="text-2xl font-serif font-medium text-neutral-900 mb-6">{section.category}</h2>
                                <Accordion type="single" collapsible className="w-full">
                                    {section.items.map((item, i) => (
                                        <AccordionItem key={i} value={`item-${idx}-${i}`}>
                                            <AccordionTrigger className="text-left text-lg font-medium text-neutral-800 hover:text-neutral-600 hover:no-underline">
                                                {item.q}
                                            </AccordionTrigger>
                                            <AccordionContent className="text-neutral-600 text-base leading-relaxed">
                                                {item.a}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 text-center">
                        <p className="text-neutral-600 mb-4">Still have questions?</p>
                        <a href="/contact" className="inline-block px-8 py-3 bg-neutral-900 text-white font-bold rounded-full hover:bg-neutral-800 transition-colors">
                            Contact Support
                        </a>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
