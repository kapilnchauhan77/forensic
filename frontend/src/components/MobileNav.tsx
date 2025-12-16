import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  FolderIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  FolderIcon as FolderIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
} from '@heroicons/react/24/solid';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon, activeIcon: HomeIconSolid },
  { name: 'Cases', href: '/cases', icon: FolderIcon, activeIcon: FolderIconSolid },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, activeIcon: Cog6ToothIconSolid },
];

export default function MobileNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden pb-safe-bottom">
      <div className="flex justify-around items-center h-16">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href ||
            (item.href !== '/' && location.pathname.startsWith(item.href));
          const Icon = isActive ? item.activeIcon : item.icon;

          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full min-w-touch btn-touch ${
                isActive ? 'text-forensic-600' : 'text-gray-500'
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs mt-1 font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
