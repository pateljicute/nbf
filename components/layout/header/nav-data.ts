import { NavItem } from '@/lib/types';

export const navItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'All Properties', href: '/properties' },
];

export const categoryItems = [
  { label: 'All Properties', href: '/properties' },
  { label: 'Apartments', href: '/properties?type=Apartment' },
  { label: 'PG / Hostels', href: '/properties?type=PG' },
  { label: 'Private Rooms', href: '/properties?type=Private+Room' },
];
