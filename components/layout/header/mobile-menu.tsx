'use client';

import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Collection } from '@/lib/types';
import { useBodyScrollLock } from '@/lib/hooks/use-body-scroll-lock';
import { Plus, User, Shield, Home, Building2, LogIn, Flag } from 'lucide-react';
import { InstallAppButton } from '@/components/layout/install-app-button';
import { useAuth } from '@/lib/auth-context';
import AuthModal from '@/components/auth/auth-modal';

interface MobileMenuProps {
  collections: Collection[];
  isAdmin?: boolean;
}

export default function MobileMenu({ collections, isAdmin }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  const openMobileMenu = () => setIsOpen(true);
  const closeMobileMenu = () => setIsOpen(false);

  const handleProtectedNav = (href: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    closeMobileMenu();
    window.location.href = href;
  };

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

                {/* Login Banner — show when not logged in */}
                {mounted && !user && (
                  <div className="mx-6 mt-4 p-3 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center justify-between gap-3">
                    <p className="text-xs text-neutral-600 font-medium">Login to post & manage properties</p>
                    <button
                      onClick={() => { setIsAuthModalOpen(true); }}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-xs font-bold rounded-full"
                    >
                      <LogIn className="w-3 h-3" /> Login
                    </button>
                  </div>
                )}

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

                    {/* All Properties — requires login */}
                    <button
                      onClick={() => handleProtectedNav('/properties')}
                      className="w-full flex items-center gap-4 px-2 py-3.5 text-base font-medium text-neutral-800 hover:text-neutral-900 rounded-lg active:bg-neutral-50 text-left"
                    >
                      <Building2 className="w-5 h-5 text-neutral-500" />
                      All Properties
                    </button>

                    {/* Post Property — requires login */}
                    <button
                      onClick={() => handleProtectedNav('/post-property')}
                      className="w-full flex items-center gap-4 px-2 py-3.5 text-base font-medium text-neutral-800 hover:text-neutral-900 rounded-lg active:bg-neutral-50 text-left"
                    >
                      <Plus className="w-5 h-5 text-neutral-500" />
                      <span className="flex-1">Post Property</span>
                      <span className="text-[9px] font-black bg-amber-400 text-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">FREE</span>
                    </button>

                    {/* Profile — requires login */}
                    <button
                      onClick={() => handleProtectedNav('/profile')}
                      className="w-full flex items-center gap-4 px-2 py-3.5 text-base font-medium text-neutral-800 hover:text-neutral-900 rounded-lg active:bg-neutral-50 text-left"
                    >
                      <User className="w-5 h-5 text-neutral-500" />
                      Profile
                    </button>

                    {/* My Reports — requires login */}
                    {user && (
                      <button
                        onClick={() => handleProtectedNav('/profile/reports')}
                        className="w-full flex items-center gap-4 px-2 py-3.5 text-base font-medium text-orange-600 hover:text-orange-700 rounded-lg active:bg-orange-50 text-left"
                      >
                        <Flag className="w-5 h-5 text-orange-500" />
                        My Reports
                      </button>
                    )}

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

                    {/* App Install Button - Replaced with Component */}
                    <div className="px-2 w-full">
                      <InstallAppButton />
                    </div>

                    {/* Property Types Section — all require login */}
                    <div>
                      <h4 className="px-2 mb-3 mt-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Property Types</h4>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleProtectedNav('/properties?type=Apartment')}
                          className="w-full text-left px-2 py-2.5 text-base font-medium text-neutral-600 hover:text-neutral-900 rounded-lg active:bg-neutral-50"
                        >
                          Apartments
                        </button>
                        <button
                          onClick={() => handleProtectedNav('/properties?type=PG')}
                          className="w-full text-left px-2 py-2.5 text-base font-medium text-neutral-600 hover:text-neutral-900 rounded-lg active:bg-neutral-50"
                        >
                          PG / Hostels
                        </button>
                        <button
                          onClick={() => handleProtectedNav('/properties?type=Private+Room')}
                          className="w-full text-left px-2 py-2.5 text-base font-medium text-neutral-600 hover:text-neutral-900 rounded-lg active:bg-neutral-50"
                        >
                          Private Rooms
                        </button>
                      </div>
                    </div>

                  </nav>
                </div>


              </motion.div>

            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
