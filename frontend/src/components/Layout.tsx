import { Fragment, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  FolderIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronRightIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import MobileNav from './MobileNav';
import ThemeToggle from './ThemeToggle';
import ClarioLogo from './ClarioLogo';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Cases', href: '/cases', icon: FolderIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  { name: 'About', href: '/about', icon: InformationCircleIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 transition-colors duration-300">
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>

                {/* Mobile sidebar content */}
                <div className="flex grow flex-col overflow-y-auto bg-zinc-900">
                  {/* Logo */}
                  <div className="flex h-20 items-center px-6 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                      <ClarioLogo size={32} />
                      <div>
                        <span className="text-white font-bold text-lg">Clario</span>
                        <p className="text-xs text-zinc-400">Analysis Platform</p>
                      </div>
                    </div>
                  </div>

                  {/* Navigation */}
                  <nav className="flex-1 px-4 py-6">
                    <ul className="space-y-2">
                      {navigation.map((item) => (
                        <li key={item.name}>
                          <Link
                            to={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`
                              flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-200
                              ${isActive(item.href)
                                ? 'bg-indigo-600/20 text-white border border-indigo-500/40'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                              }
                            `}
                          >
                            <item.icon className={`h-5 w-5 ${isActive(item.href) ? 'text-indigo-400' : ''}`} />
                            <span className="flex-1">{item.name}</span>
                            {isActive(item.href) && (
                              <ChevronRightIcon className="h-4 w-4 text-indigo-400" />
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>

                  {/* User section */}
                  <div className="p-4 border-t border-zinc-800">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                        {user?.username?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{user?.username}</p>
                        <p className="text-xs text-zinc-400 capitalize">{user?.role}</p>
                      </div>
                      <button
                        onClick={logout}
                        className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                        title="Logout"
                      >
                        <ArrowRightOnRectangleIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col overflow-y-auto bg-zinc-900 border-r border-zinc-800">
          {/* Logo */}
          <div className="flex h-20 items-center px-6 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <ClarioLogo size={32} />
              <div>
                <span className="text-white font-bold text-lg">Clario</span>
                <p className="text-xs text-zinc-400">Analysis Platform</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6">
            <p className="px-4 mb-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Menu</p>
            <ul className="space-y-1.5">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
                      ${isActive(item.href)
                        ? 'bg-indigo-600/20 text-white border border-indigo-500/40'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }
                    `}
                  >
                    <item.icon className={`h-5 w-5 ${isActive(item.href) ? 'text-indigo-400' : ''}`} />
                    <span className="flex-1">{item.name}</span>
                    {isActive(item.href) && (
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-zinc-800">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.username}</p>
                <p className="text-xs text-zinc-400 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="lg:pl-72">
        {/* Top header bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4
          bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl
          border-b border-gray-200 dark:border-zinc-800
          px-4 sm:px-6 lg:px-8 transition-colors duration-200">

          {/* Mobile menu button */}
          <button
            type="button"
            className="lg:hidden p-2 -ml-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100
              dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800
              transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* Separator */}
          <div className="h-6 w-px bg-gray-200 dark:bg-zinc-700 lg:hidden" />

          {/* Mobile title */}
          <div className="flex items-center gap-2 lg:hidden">
            <ClarioLogo size={24} />
            <span className="font-bold text-gray-900 dark:text-white">Clario</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <ThemeToggle />

            {/* Date (hidden on mobile) */}
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400">
              <div className="w-px h-5 bg-gray-200 dark:bg-zinc-700" />
              <span>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="py-6 lg:py-8 pb-24 lg:pb-8">
          <div className="px-4 sm:px-6 lg:px-8 animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileNav />
    </div>
  );
}
