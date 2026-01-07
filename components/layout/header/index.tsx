'use client';

import { useState, useEffect } from 'react';
import MobileMenu from './mobile-menu';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LogoSvg } from './logo-svg';
import { NavItem } from '@/lib/types';
import { Collection } from '@/lib/types';
import { User, ChevronDown, Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { checkAdminStatus } from '@/app/actions';
import AuthModal from '@/components/auth/auth-modal';
import { NotificationBadge } from '@/components/ui/notification-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { navItems, categoryItems } from './nav-data';

interface HeaderProps {
  collections: Collection[];
}

export function Header({ collections }: HeaderProps) {
  const pathname = usePathname();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (user) {
      checkAdminStatus(user.id).then(setIsAdmin);
    }
  }, [user]);

  return (
    <>
      <header className="grid fixed top-0 left-0 z-50 grid-cols-3 items-center w-full p-2 md:p-sides md:grid-cols-12 md:gap-sides bg-white/10 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none border-b-0 transition-all duration-300">
        <div className="block flex-none md:hidden">
          <MobileMenu collections={collections} isAdmin={isAdmin} />
        </div>
        <Link href="/" className="md:col-span-3 xl:col-span-2 flex justify-center md:block pt-0" prefetch>
          <div className="md:hidden bg-white/20 backdrop-blur-md rounded-full px-2 py-0.5">
            <LogoSvg className="w-auto h-5" />
          </div>
          <LogoSvg className="hidden md:block w-full h-auto max-w-[160px]" />
        </Link>
        <nav className="flex justify-end items-center md:col-span-9 xl:col-span-10 pointer-events-none">
          <div className="pointer-events-auto hidden md:flex items-center gap-1 p-1.5 bg-white/60 backdrop-blur-xl border border-white/20 shadow-lg rounded-full transition-all hover:bg-white/95">
            <ul className="flex items-center gap-2">
              {navItems.map(item => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'block px-6 py-2.5 text-xs font-bold tracking-widest uppercase rounded-full transition-all duration-300',
                      pathname === item.href
                        ? 'bg-neutral-100 text-neutral-900 shadow-inner'
                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-black'
                    )}
                    prefetch
                  >
                    {item.label}
                  </Link>
                </li>
              ))}

              {/* Category Dropdown */}
              <li>
                <DropdownMenu>
                  <DropdownMenuTrigger suppressHydrationWarning className="flex items-center gap-1 px-6 py-2.5 text-xs font-bold tracking-widest uppercase rounded-full transition-all duration-300 text-neutral-600 hover:bg-neutral-50 hover:text-black outline-none">
                    Categories <ChevronDown className="w-3 h-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-white/95 backdrop-blur-xl border-white/20 shadow-xl rounded-xl p-2 mt-2">
                    {categoryItems.map((cat) => (
                      <DropdownMenuItem key={cat.href} asChild>
                        <Link
                          href={cat.href}
                          className="w-full cursor-pointer text-xs font-bold uppercase tracking-wider py-2.5 px-3 rounded-lg hover:bg-neutral-100 focus:bg-neutral-100 text-neutral-600 focus:text-black"
                        >
                          {cat.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>

              {isAdmin && (
                <li>
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold tracking-widest uppercase rounded-full transition-all duration-300 border border-neutral-200 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 hover:border-neutral-300"
                    prefetch
                  >
                    <Shield className="w-3 h-3" />
                    Admin Panel
                  </Link>
                </li>
              )}

              <li>
                <Link
                  href="/post-property"
                  className="block px-6 py-2.5 text-xs font-bold tracking-widest uppercase rounded-full transition-all duration-300 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg ml-4 hover:shadow-xl hover:scale-105 animate-pulse"
                  prefetch
                >
                  Post Property
                </Link>
              </li>
            </ul>
            <div className="w-px h-6 bg-neutral-200 mx-2" />
            {mounted && user && <NotificationBadge />}
            <div className="pr-1.5 pl-1">
              {mounted && user ? (
                <Link href="/profile" className="relative flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors text-neutral-900 overflow-hidden" title={user.email}>
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="Profile"
                      className="absolute inset-0 w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
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

          {/* Mobile Right Section: User */}
          <div className="md:hidden pointer-events-auto flex items-center gap-3">
            {mounted && user ? (
              <Link href="/profile" className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-colors text-neutral-900 overflow-hidden">
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Profile"
                    className="absolute inset-0 w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </Link>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-colors text-neutral-900"
              >
                <User className="w-4 h-4" />
              </button>
            )}
          </div>
        </nav>
      </header>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
