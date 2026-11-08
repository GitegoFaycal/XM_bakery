import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Package } from 'lucide-react';

const TABS = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/orders', label: 'Orders', icon: ClipboardList },
  { to: '/dashboard/products', label: 'Products & stock', icon: Package },
];

export default function AdminTabs() {
  return (
    <nav className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-stone-200 bg-white p-1">
      {TABS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              isActive ? 'bg-brand-700 text-white' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
            }`
          }
        >
          <Icon className="h-4 w-4" /> {label}
        </NavLink>
      ))}
    </nav>
  );
}
