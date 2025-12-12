import Link from 'next/link';
import { LogoSvg } from './header/logo-svg';
import { getCollections } from '@/lib/api';
import { Facebook, Instagram, Linkedin, Twitter, Globe } from 'lucide-react';
import { CONTACT_LINKS } from '@/lib/constants';

const getSocialLink = (label: string) => CONTACT_LINKS.find(l => l.label === label)?.href || '#';

export async function Footer() {
  const collections = await getCollections();

  return (
    <footer className="bg-neutral-950 text-white pt-24 pb-12 mt-auto">
      <div className="max-w-[1920px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-24">
          {/* Brand Column */}
          <div className="md:col-span-4 flex flex-col gap-8">
            <Link href="/" className="block w-48">
              <LogoSvg className="w-full h-auto text-white fill-white" />
            </Link>
            <p className="text-neutral-400 text-lg leading-relaxed max-w-sm">
              Find your perfect room or PG on India's largest property marketplace.
            </p>
            <div className="flex gap-6">
              <Link href={getSocialLink('Instagram')} target="_blank" className="text-white hover:text-neutral-400 transition-colors"><Instagram size={24} /></Link>
              <Link href={getSocialLink('X')} target="_blank" className="text-white hover:text-neutral-400 transition-colors"><Twitter size={24} /></Link>
              <Link href={getSocialLink('LinkedIn')} target="_blank" className="text-white hover:text-neutral-400 transition-colors"><Linkedin size={24} /></Link>
              <Link href={getSocialLink('Facebook')} target="_blank" className="text-white hover:text-neutral-400 transition-colors"><Facebook size={24} /></Link>
            </div>
          </div>

          {/* Links Columns */}
          <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Shop */}
            <div className="flex flex-col gap-6">
              <h4 className="font-serif text-lg font-medium">Properties</h4>
              <ul className="flex flex-col gap-4 text-neutral-400">
                <li><Link href="/shop" className="hover:text-white transition-colors">All Properties</Link></li>
                {collections.slice(0, 4).map((collection) => (
                  <li key={collection.handle}>
                    <Link href={`/search/${collection.handle}`} className="hover:text-white transition-colors capitalize">
                      {collection.title}
                    </Link>
                  </li>
                ))}
                <li><Link href="/shop/new-arrivals" className="hover:text-white transition-colors">New Listings</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div className="flex flex-col gap-6">
              <h4 className="font-serif text-lg font-medium">Company</h4>
              <ul className="flex flex-col gap-4 text-neutral-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>

                <li><Link href="/sustainability" className="hover:text-white transition-colors">Sustainability</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div className="flex flex-col gap-6">
              <h4 className="font-serif text-lg font-medium">Support</h4>
              <ul className="flex flex-col gap-4 text-neutral-400">
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors">FAQs</Link></li>
                <li><Link href="/safety" className="hover:text-white transition-colors">Safety Tips</Link></li>
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div className="flex flex-col gap-6">
              <h4 className="font-serif text-lg font-medium">Legal</h4>
              <ul className="flex flex-col gap-4 text-neutral-400">
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-neutral-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-neutral-500 text-sm">
            © {new Date().getFullYear()} NBFHOMES. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <button className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm cursor-pointer">
              <Globe size={16} />
              <span>India (INR)</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
