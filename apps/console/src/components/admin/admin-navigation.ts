import { KeyRound, LayoutDashboard, Rocket } from 'lucide-react';

export type AdminNavKey = 'overview' | 'licenses' | 'versions';

export const adminNavigation = [
  {
    key: 'overview',
    href: '/dashboard',
    label: 'Overview',
    description: 'Products and API surface',
    icon: LayoutDashboard,
  },
  {
    key: 'licenses',
    href: '/dashboard/licenses',
    label: 'Licenses',
    description: 'Keys, devices, limits',
    icon: KeyRound,
  },
  {
    key: 'versions',
    href: '/dashboard/versions',
    label: 'Versions',
    description: 'Release metadata',
    icon: Rocket,
  },
] as const;
