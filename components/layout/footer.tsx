import Link from 'next/link';
import { LogoSvg } from './header/logo-svg';
import { getCollections } from '@/lib/api';
import { Globe, Twitter, Linkedin, Facebook, Instagram, MessageCircle } from 'lucide-react';
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
              NBF Homes is India's growing property marketplace for Tier 1-4 cities. We help you find the best rental options in Mandsaur, Neemuch, Ratlam, and Indore with 0% brokerage fees.
            </p>
            <div className="flex items-center gap-5">
              <a href="https://x.com/nbfhomes" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
                <span className="sr-only">X (Twitter)</span>
              </a>
              <a href="https://www.linkedin.com/in/nbf-homes-2689b4381?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
                <span className="sr-only">LinkedIn</span>
              </a>
              <a href="https://www.facebook.com/share/17qdRqXzeN/" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
                <span className="sr-only">Facebook</span>
              </a>
              <a href="https://www.instagram.com/nbfhomes?igsh=djhqOGFxZ3B0YTdm" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
                <span className="sr-only">Instagram</span>
              </a>
              <a href="https://whatsapp.com/channel/0029Vb74TGqFnSzA8mE6wE0Y" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-white transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span className="sr-only">WhatsApp Channel</span>
              </a>
            </div>
          </div>

          {/* Links Columns */}
          <div className="md:col-span-8 grid grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Shop */}
            <div className="flex flex-col gap-6">
              <h4 className="font-serif text-lg font-medium">Properties</h4>
              <ul className="flex flex-col gap-4 text-neutral-400">
                <li><Link href="/properties" className="hover:text-white transition-colors">All Properties</Link></li>
                {collections.slice(0, 4).map((collection) => (
                  <li key={collection.handle}>
                    <Link href={`/properties?type=${encodeURIComponent(collection.title)}`} className="hover:text-white transition-colors capitalize">
                      {collection.title}
                    </Link>
                  </li>
                ))}
                <li><Link href="/properties?sort=newest" className="hover:text-white transition-colors">New Listings</Link></li>
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

            {/* SEO Targets / Nearby Locations */}
            <div className="flex flex-col gap-6">
              <h4 className="font-serif text-lg font-medium">Nearby Locations</h4>
              <ul className="flex flex-col gap-4 text-neutral-400 text-sm">
                {/* Primary */}
                <li><Link href="/properties?search=Mandsaur" className="hover:text-white transition-colors">PG in Mandsaur</Link></li>
                <li><Link href="/properties?search=Neemuch" className="hover:text-white transition-colors">Rooms in Neemuch</Link></li>
                <li><Link href="/properties?search=Ratlam" className="hover:text-white transition-colors">Flats in Ratlam</Link></li>
                <li><Link href="/properties?search=Jaora" className="hover:text-white transition-colors">Rentals in Jaora</Link></li>
                <li><Link href="/properties?search=Pratapgarh" className="hover:text-white transition-colors">Pratapgarh Housing</Link></li>
                {/* Secondary (Hidden on Mobile/Tablet if needed, strictly visible for SEO) */}
                <li><Link href="/properties?search=Indore" className="hover:text-white transition-colors">Indore</Link></li>
                <li><Link href="/properties?search=Ujjain" className="hover:text-white transition-colors">Ujjain</Link></li>
                <li><Link href="/properties?search=Kota" className="hover:text-white transition-colors">Kota</Link></li>
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
