'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Collection } from '@/lib/types';
import { useBodyScrollLock } from '@/lib/hooks/use-body-scroll-lock';
import { Plus, User, Shield, Home, Building2 } from 'lucide-react';

interface MobileMenuProps {
  collections: Collection[];
  isAdmin?: boolean;
}

export default function MobileMenu({ collections, isAdmin }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const openMobileMenu = () => setIsOpen(true);
  const closeMobileMenu = () => setIsOpen(false);

  // Lock body scroll when menu is open
  useBodyScrollLock(isOpen);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  useEffect(() => {
    closeMobileMenu();
  }, [pathname]);

  return (
    <>
      <button
        onClick={openMobileMenu}
        aria-label="Open mobile menu"
        className="p-2 md:hidden text-neutral-900 transition-opacity hover:opacity-70"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" x2="20" y1="12" y2="12" />
          <line x1="4" x2="20" y1="6" y2="6" />
          <line x1="4" x2="20" y1="18" y2="18" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-0 z-[100] w-full h-full bg-white/95 backdrop-blur-xl flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-neutral-100/50">
              <p className="text-xl font-bold tracking-tight text-neutral-900">Menu</p>
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full w-10 h-10 hover:bg-neutral-100"
                aria-label="Close menu"
                onClick={closeMobileMenu}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </Button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto py-8 px-6">
              <nav className="flex flex-col gap-2">

                {/* Admin Button */}
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 px-4 py-4 mb-4 text-base font-bold text-neutral-900 bg-neutral-50 border border-neutral-200 rounded-xl shadow-sm hover:shadow-md transition-all"
                  >
                    <Shield className="w-5 h-5 text-neutral-900" />
                    Admin Dashboard
                  </Link>
                )}

                {/* Main Links */}
                <Link
                  href="/"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-4 px-2 py-4 text-lg font-medium text-neutral-900 border-b border-neutral-100 hover:text-neutral-600 transition-colors"
                >
                  <Home className="w-6 h-6 text-neutral-400" />
                  Home
                </Link>

                <Link
                  href="/properties"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-4 px-2 py-4 text-lg font-medium text-neutral-900 border-b border-neutral-100 hover:text-neutral-600 transition-colors"
                >
                  <Building2 className="w-6 h-6 text-neutral-400" />
                  All Properties
                </Link>

                <Link
                  href="/post-property"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-4 px-2 py-4 text-lg font-medium text-neutral-900 border-b border-neutral-100 hover:text-neutral-600 transition-colors"
                >
                  <Plus className="w-6 h-6 text-neutral-400" />
                  Post Property
                </Link>

                <Link
                  href="/profile"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-4 px-2 py-4 text-lg font-medium text-neutral-900 border-b border-neutral-100 hover:text-neutral-600 transition-colors"
                >
                  <User className="w-6 h-6 text-neutral-400" />
                  Profile
                </Link>

                {/* Property Types Sub-menu */}
                <div className="mt-8 px-2">
                  <h4 className="mb-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Explore by Category</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <Link
                      href="/properties?type=Apartment"
                      onClick={closeMobileMenu}
                      className="flex items-center justify-between px-4 py-3 text-base font-medium text-neutral-700 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors"
                    >
                      Apartments
                      <span className="text-neutral-400 text-lg">→</span>
                    </Link>
                    <Link
                      href="/properties?type=PG"
                      onClick={closeMobileMenu}
                      className="flex items-center justify-between px-4 py-3 text-base font-medium text-neutral-700 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors"
                    >
                      PG / Hostels
                      <span className="text-neutral-400 text-lg">→</span>
                    </Link>
                    <Link
                      href="/properties?type=Private+Room"
                      onClick={closeMobileMenu}
                      className="flex items-center justify-between px-4 py-3 text-base font-medium text-neutral-700 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors"
                    >
                      Private Rooms
                      <span className="text-neutral-400 text-lg">→</span>
                    </Link>
                  </div>
                </div>
              </nav>
            </div>

            {/* Footer CTA */}
            <div className="p-6 border-t border-neutral-100 bg-white/50 backdrop-blur-sm">
              <Link
                href="/post-property"
                onClick={closeMobileMenu}
                className="flex items-center justify-center w-full py-4 bg-neutral-900 text-white font-bold rounded-xl text-base shadow-lg active:scale-95 transition-all"
              >
                List Your Property
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
