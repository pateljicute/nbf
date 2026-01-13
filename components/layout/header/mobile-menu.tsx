'use client';

import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
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
  installPrompt?: any;
  onInstallClick?: () => void;
  isInstalled?: boolean;
}


export default function MobileMenu({ collections, isAdmin, installPrompt, onInstallClick, isInstalled = false }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const openMobileMenu = () => setIsOpen(true);
  const closeMobileMenu = () => setIsOpen(false);

  // Lock body scroll when menu is open
  useBodyScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
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

      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Dark Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={closeMobileMenu}
                className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm"
                aria-hidden="true"
              />

              {/* Sidebar Drawer */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed top-0 left-0 z-[1001] w-[85%] max-w-[320px] h-full bg-white shadow-2xl flex flex-col"
              >
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-100">
                  <p className="text-xl font-bold tracking-tight text-neutral-900">Menu</p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full w-10 h-10 hover:bg-neutral-100 -mr-2"
                    aria-label="Close menu"
                    onClick={closeMobileMenu}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                  </Button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                  <nav className="flex flex-col gap-1">

                    <Link
                      href="/"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-4 px-2 py-3.5 text-base font-medium text-neutral-800 hover:text-neutral-900 rounded-lg active:bg-neutral-50"
                    >
                      <Home className="w-5 h-5 text-neutral-500" />
                      Home
                    </Link>

                    <Link
                      href="/properties"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-4 px-2 py-3.5 text-base font-medium text-neutral-800 hover:text-neutral-900 rounded-lg active:bg-neutral-50"
                    >
                      <Building2 className="w-5 h-5 text-neutral-500" />
                      All Properties
                    </Link>

                    <Link
                      href="/post-property"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-4 px-2 py-3.5 text-base font-medium text-neutral-800 hover:text-neutral-900 rounded-lg active:bg-neutral-50"
                    >
                      <Plus className="w-5 h-5 text-neutral-500" />
                      Post Property
                    </Link>

                    <Link
                      href="/profile"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-4 px-2 py-3.5 text-base font-medium text-neutral-800 hover:text-neutral-900 rounded-lg active:bg-neutral-50"
                    >
                      <User className="w-5 h-5 text-neutral-500" />
                      Profile
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={closeMobileMenu}
                        className="flex items-center gap-4 px-2 py-3.5 text-base font-medium text-neutral-800 hover:text-neutral-900 rounded-lg active:bg-neutral-50"
                      >
                        <Shield className="w-5 h-5 text-neutral-500" />
                        Admin Dashboard
                      </Link>
                    )}

                    {/* Divider */}
                    <div className="h-px bg-neutral-100 my-4" />

                    {/* App Install Button - Show if not installed */}
                    {!isInstalled && (
                      <button
                        onClick={() => {
                          onInstallClick?.();
                          closeMobileMenu();
                        }}
                        className="flex items-center gap-4 px-2 py-3.5 text-base font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg w-full text-left"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" /></svg>
                        Install NBF App
                      </button>
                    )}

                    {/* Property Types Section */}
                    <div>
                      <h4 className="px-2 mb-3 mt-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Property Types</h4>
                      <div className="flex flex-col gap-1">
                        <Link
                          href="/properties?type=Apartment"
                          onClick={closeMobileMenu}
                          className="px-2 py-2.5 text-base font-medium text-neutral-600 hover:text-neutral-900 rounded-lg active:bg-neutral-50"
                        >
                          Apartments
                        </Link>
                        <Link
                          href="/properties?type=PG"
                          onClick={closeMobileMenu}
                          className="px-2 py-2.5 text-base font-medium text-neutral-600 hover:text-neutral-900 rounded-lg active:bg-neutral-50"
                        >
                          PG / Hostels
                        </Link>
                        <Link
                          href="/properties?type=Private+Room"
                          onClick={closeMobileMenu}
                          className="px-2 py-2.5 text-base font-medium text-neutral-600 hover:text-neutral-900 rounded-lg active:bg-neutral-50"
                        >
                          Private Rooms
                        </Link>
                      </div>
                    </div>

                  </nav>
                </div>

                {/* Footer Button */}
                <div className="p-6 border-t border-neutral-100 bg-white">
                  <Link
                    href="/post-property"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-center w-full py-4 bg-neutral-900 text-white font-bold text-sm tracking-widest uppercase rounded-xl shadow-lg active:scale-95 transition-all"
                  >
                    List Your Property
                  </Link>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
