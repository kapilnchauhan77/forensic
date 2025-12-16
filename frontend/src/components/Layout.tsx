import { Fragment, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  FolderIcon,
  Cog6ToothIcon,
  FingerPrintIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import MobileNav from './MobileNav';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Cases', href: '/cases', icon: FolderIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen-dvh">
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
            <div className="fixed inset-0 bg-gray-900/80" />
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
                      className="-m-2.5 p-2.5 min-h-touch min-w-touch flex items-center justify-center"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-forensic-900 px-6 pb-4 pt-safe-top">
                  <div className="flex h-16 shrink-0 items-center">
                    <FingerPrintIcon className="h-8 w-8 text-white" />
                    <span className="ml-2 text-white font-semibold">Forensics</span>
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {navigation.map((item) => (
                            <li key={item.name}>
                              <Link
                                to={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={classNames(
                                  location.pathname === item.href
                                    ? 'bg-forensic-800 text-white'
                                    : 'text-forensic-200 hover:text-white hover:bg-forensic-800',
                                  'group flex gap-x-3 rounded-md p-3 text-sm leading-6 font-semibold min-h-touch items-center'
                                )}
                              >
                                <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                                {item.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                      <li className="mt-auto">
                        <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold leading-6 text-white">
                          <div className="h-10 w-10 rounded-full bg-forensic-700 flex items-center justify-center text-lg">
                            {user?.username?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <span aria-hidden="true">{user?.username}</span>
                            <p className="text-xs text-forensic-300 capitalize">{user?.role}</p>
                          </div>
                          <button
                            onClick={logout}
                            className="text-forensic-300 hover:text-white min-h-touch min-w-touch flex items-center justify-center"
                            title="Logout"
                          >
                            <ArrowRightOnRectangleIcon className="h-6 w-6" />
                          </button>
                        </div>
                      </li>
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-forensic-900 px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <FingerPrintIcon className="h-8 w-8 text-white" />
            <span className="ml-2 text-white font-semibold text-lg">Fingerprint Forensics</span>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={classNames(
                          location.pathname === item.href
                            ? 'bg-forensic-800 text-white'
                            : 'text-forensic-200 hover:text-white hover:bg-forensic-800',
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                        )}
                      >
                        <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="mt-auto">
                <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold leading-6 text-white">
                  <div className="h-8 w-8 rounded-full bg-forensic-700 flex items-center justify-center">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <span className="sr-only">Your profile</span>
                    <span aria-hidden="true">{user?.username}</span>
                    <p className="text-xs text-forensic-300 capitalize">{user?.role}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="text-forensic-300 hover:text-white"
                    title="Logout"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  </button>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="lg:pl-72">
        {/* Mobile header */}
        <div className="sticky top-0 z-40 flex h-14 sm:h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden min-h-touch min-w-touch flex items-center justify-center"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="h-6 w-px bg-gray-900/10 lg:hidden" aria-hidden="true" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            {/* Mobile title */}
            <div className="flex flex-1 items-center lg:hidden">
              <FingerPrintIcon className="h-6 w-6 text-forensic-600" />
              <span className="ml-2 font-semibold text-gray-900 text-sm sm:text-base">FP Forensics</span>
            </div>
            <div className="hidden lg:flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <span className="hidden sm:block text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              <span className="sm:hidden text-xs text-gray-500">
                {new Date().toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        <main className="py-4 sm:py-6 lg:py-10 pb-20 lg:pb-10">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileNav />
    </div>
  );
}
