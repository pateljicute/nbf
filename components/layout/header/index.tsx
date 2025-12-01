'use client';

import { useState, useEffect } from 'react';
import MobileMenu from './mobile-menu';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LogoSvg } from './logo-svg';
import { NavItem } from '@/lib/types';
import { Collection } from '@/lib/types';
import { User } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import AuthModal from '@/components/auth/auth-modal';
import { NotificationBadge } from '@/components/ui/notification-badge';
import { useRealtime } from '@/lib/realtime-context';

export const navItems: NavItem[] = [
  {
    label: 'Home',
    href: '/',
  },
  {
    label: 'All Properties',
    href: '/shop',
  },
  {
    label: 'Post Property',
    href: '/post-property',
  },
];

interface HeaderProps {
  collections: Collection[];
}

export function Header({ collections }: HeaderProps) {
  const pathname = usePathname();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <header className="grid fixed top-0 left-0 z-50 grid-cols-3 items-start w-full p-sides md:grid-cols-12 md:gap-sides">
        <div className="block flex-none md:hidden">
          <MobileMenu collections={collections} />
        </div>
        <Link href="/" className="md:col-span-3 xl:col-span-2" prefetch>
          <LogoSvg className="w-auto h-8 max-md:place-self-center md:w-full md:h-auto max-w-[160px]" />
        </Link>
        <nav className="flex justify-end items-center md:col-span-9 xl:col-span-10 pointer-events-none">
          <div className="pointer-events-auto hidden md:flex items-center gap-1 p-1.5 bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-full transition-all hover:bg-white/95">
            <ul className="flex items-center">
              {navItems.map(item => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'block px-5 py-2.5 text-xs font-bold tracking-widest uppercase rounded-full transition-all duration-300',
                      item.href === '/post-property'
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg hover:shadow-xl hover:scale-105 animate-pulse'
                        : pathname === item.href
                          ? 'bg-black text-white shadow-md transform scale-105'
                          : 'text-neutral-600 hover:bg-neutral-100 hover:text-black'
                    )}
                    prefetch
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="w-px h-6 bg-neutral-200 mx-2" />
            {mounted && user && <NotificationBadge />}
            <div className="pr-1.5 pl-1">
              {mounted && user ? (
                <Link href="/profile" className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors text-neutral-900 overflow-hidden" title={user.email}>
                  {user.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </Link>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-black text-white rounded-full hover:bg-neutral-800 transition-colors"
                >
                  Login
                </button>
              )}
            </div>
          </div>

          {/* Mobile Cart - Visible only on mobile */}
          <div className="md:hidden pointer-events-auto">
            {mounted && user ? (
              <Link href="/profile" className="flex items-center justify-center w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors text-neutral-900 overflow-hidden">
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </Link>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors text-neutral-900"
              >
                <User className="w-5 h-5" />
              </button>
            )}
          </div>
        </nav>
      </header>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
