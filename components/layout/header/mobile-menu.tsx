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

  // Close menu when route changes
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
          <>
            {/* Backdrop - darker for better focus */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={closeMobileMenu}
              aria-hidden="true"
            />

            {/* Panel - Solid White, clean layout */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="fixed inset-y-0 left-0 z-[100] w-[85%] max-w-[320px] h-screen bg-white shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-5 border-b border-neutral-100">
                <p className="text-lg font-bold tracking-tight text-neutral-900">Menu</p>
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-full w-8 h-8 hover:bg-neutral-100"
                  aria-label="Close menu"
                  onClick={closeMobileMenu}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </Button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto py-6 px-4">
                <nav className="flex flex-col gap-2">
                  <Link
                    href="/"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 px-4 py-3 text-base font-medium text-neutral-800 rounded-xl hover:bg-neutral-50 transition-colors"
                  >
                    <Home className="w-5 h-5 text-neutral-500" />
                    Home
                  </Link>

                  <Link
                    href="/properties"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 px-4 py-3 text-base font-medium text-neutral-800 rounded-xl hover:bg-neutral-50 transition-colors"
                  >
                    <Building2 className="w-5 h-5 text-neutral-500" />
                    All Properties
                  </Link>

                  <Link
                    href="/post-property"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 px-4 py-3 text-base font-medium text-neutral-800 rounded-xl hover:bg-neutral-50 transition-colors"
                  >
                    <Plus className="w-5 h-5 text-neutral-500" />
                    Post Property
                  </Link>

                  <Link
                    href="/profile"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 px-4 py-3 text-base font-medium text-neutral-800 rounded-xl hover:bg-neutral-50 transition-colors"
                  >
                    <User className="w-5 h-5 text-neutral-500" />
                    Profile
                  </Link>

                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 px-4 py-3 text-base font-medium text-neutral-800 rounded-xl hover:bg-neutral-50 transition-colors"
                    >
                      <Shield className="w-5 h-5 text-neutral-500" />
                      Admin Dashboard
                    </Link>
                  )}
                </nav>

                <div className="my-6 border-t border-neutral-100" />

                <div className="px-2">
                  <h4 className="px-2 mb-3 text-xs font-bold text-neutral-400 uppercase tracking-wider">Property Types</h4>
                  <div className="flex flex-col gap-1">
                    <Link
                      href="/properties?type=Apartment"
                      onClick={closeMobileMenu}
                      className="px-4 py-2.5 text-sm font-medium text-neutral-600 rounded-lg hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
                    >
                      Apartments
                    </Link>
                    <Link
                      href="/properties?type=PG"
                      onClick={closeMobileMenu}
                      className="px-4 py-2.5 text-sm font-medium text-neutral-600 rounded-lg hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
                    >
                      PG / Hostels
                    </Link>
                    <Link
                      href="/properties?type=Private+Room"
                      onClick={closeMobileMenu}
                      className="px-4 py-2.5 text-sm font-medium text-neutral-600 rounded-lg hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
                    >
                      Private Rooms
                    </Link>
                  </div>
                </div>
              </div>

              {/* Footer CTA */}
              <div className="p-4 border-t border-neutral-100 bg-neutral-50/50">
                <Link
                  href="/post-property"
                  onClick={closeMobileMenu}
                  className="flex items-center justify-center w-full py-3 bg-neutral-900 text-white font-bold rounded-xl text-sm uppercase tracking-wider shadow-sm active:scale-95 transition-all"
                >
                  List Your Property
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
