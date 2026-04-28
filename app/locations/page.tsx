import { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { PageLayout } from '@/components/layout/page-layout';
import { MapPin, Building, Home, Key, Store } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Property Directory & Locations | NBF Homes',
  description: 'Browse real estate properties for rent and sale across Mandsaur, Neemuch, Ratlam, and Indore. Find flats, houses, PGs, and commercial shops.',
  keywords: ['Property in Mandsaur', 'Real Estate Directory', 'Buy House Neemuch', 'Rent PG Ratlam', 'NBF Homes Locations'],
  alternates: {
    canonical: 'https://www.nbfhomes.in/locations',
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

const CITIES = [
  'Mandsaur',
  'Neemuch',
  'Ratlam',
  'Indore',
  'Ujjain',
  'Jaora',
  'Pratapgarh',
  'Kota',
  'Chittorgarh'
];

const RENT_CATEGORIES = [
  { name: 'PGs & Hostels', query: 'pg' },
  { name: 'Flats for Rent', query: 'flat' },
  { name: 'Rooms for Rent', query: 'room' },
  { name: 'Commercial Rent', query: 'commercial' }
];

const SALE_CATEGORIES = [
  { name: 'Houses for Sale', query: 'house' },
  { name: 'Villas for Sale', query: 'villa' },
  { name: 'Flats for Sale', query: 'flat' },
  { name: 'Plots / Land', query: 'plot' },
  { name: 'Commercial Shops', query: 'shop' }
];

export default function LocationsDirectory() {
  return (
    <PageLayout>
      <div className="bg-neutral-50 min-h-screen pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-3xl md:text-5xl font-black text-neutral-900 tracking-tight mb-4">
              Property <span className="text-black/50">Directory</span>
            </h1>
            <p className="text-lg text-neutral-600">
              Browse our comprehensive list of properties available for rent and sale across major cities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {CITIES.map((city) => (
              <div key={city} className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-6 border-b border-neutral-100 pb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-neutral-900">Properties in {city}</h2>
                </div>

                <div className="space-y-6">
                  {/* Rent Section */}
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-2">
                      <Key className="w-4 h-4" /> For Rent
                    </h3>
                    <ul className="space-y-2">
                      {RENT_CATEGORIES.map((cat) => (
                        <li key={cat.name}>
                          <Link 
                            href={`/properties?mode=rent&city=${encodeURIComponent(city)}&q=${encodeURIComponent(cat.query)}`}
                            className="text-neutral-600 hover:text-black hover:underline transition-colors block text-sm font-medium"
                          >
                            {cat.name} in {city}
                          </Link>
                        </li>
                      ))}
                      <li>
                        <Link 
                          href={`/properties?mode=rent&city=${encodeURIComponent(city)}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline transition-colors block text-sm font-bold mt-2"
                        >
                          View all rentals in {city} →
                        </Link>
                      </li>
                    </ul>
                  </div>

                  {/* Sell Section */}
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-2">
                      <Home className="w-4 h-4" /> For Sale
                    </h3>
                    <ul className="space-y-2">
                      {SALE_CATEGORIES.map((cat) => (
                        <li key={cat.name}>
                          <Link 
                            href={`/properties?mode=sell&city=${encodeURIComponent(city)}&q=${encodeURIComponent(cat.query)}`}
                            className="text-neutral-600 hover:text-black hover:underline transition-colors block text-sm font-medium"
                          >
                            {cat.name} in {city}
                          </Link>
                        </li>
                      ))}
                      <li>
                        <Link 
                          href={`/properties?mode=sell&city=${encodeURIComponent(city)}`}
                          className="text-[#e8202a] hover:text-red-800 hover:underline transition-colors block text-sm font-bold mt-2"
                        >
                          View all for sale in {city} →
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </PageLayout>
  );
}
