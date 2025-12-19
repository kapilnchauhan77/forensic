import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { SunIcon as SunSolid, MoonIcon as MoonSolid } from '@heroicons/react/24/solid';
import { useTheme } from '../contexts/ThemeContext';

const themes = [
  { id: 'light', name: 'Light', icon: SunIcon },
  { id: 'dark', name: 'Dark', icon: MoonIcon },
  { id: 'system', name: 'System', icon: ComputerDesktopIcon },
] as const;

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center justify-center w-10 h-10 rounded-xl
        bg-gray-100 hover:bg-gray-200
        dark:bg-zinc-800 dark:hover:bg-zinc-700
        text-gray-600 hover:text-gray-900
        dark:text-zinc-400 dark:hover:text-zinc-100
        transition-all duration-200 group">
        {resolvedTheme === 'dark' ? (
          <MoonSolid className="h-5 w-5 text-purple-400 group-hover:scale-110 transition-transform" />
        ) : (
          <SunSolid className="h-5 w-5 text-amber-500 group-hover:scale-110 transition-transform" />
        )}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95 translate-y-1"
        enterTo="transform opacity-100 scale-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="transform opacity-100 scale-100 translate-y-0"
        leaveTo="transform opacity-0 scale-95 translate-y-1"
      >
        <Menu.Items className="absolute right-0 mt-2 w-44 origin-top-right rounded-xl
          bg-white dark:bg-zinc-800
          shadow-xl
          border border-gray-200 dark:border-zinc-700
          focus:outline-none overflow-hidden z-50 p-1">
          {themes.map((item) => (
            <Menu.Item key={item.id}>
              {({ active }) => (
                <button
                  onClick={() => setTheme(item.id)}
                  className={`
                    flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-150
                    ${active ? 'bg-gray-100 dark:bg-zinc-700' : ''}
                    ${theme === item.id
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-700 dark:text-zinc-300'
                    }
                  `}
                >
                  <item.icon className={`h-5 w-5 ${
                    theme === item.id
                      ? 'text-indigo-500'
                      : 'text-gray-400 dark:text-zinc-500'
                  }`} />
                  <span className="flex-1 text-left">{item.name}</span>
                  {theme === item.id && (
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  )}
                </button>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

// Simple toggle button variant for mobile
export function ThemeToggleButton() {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center w-10 h-10 rounded-xl
        bg-gray-100 hover:bg-gray-200
        dark:bg-zinc-800 dark:hover:bg-zinc-700
        transition-all duration-300 overflow-hidden group"
      aria-label="Toggle theme"
    >
      <div className={`absolute transition-all duration-300 transform ${
        resolvedTheme === 'dark'
          ? 'opacity-100 rotate-0 scale-100'
          : 'opacity-0 rotate-90 scale-50'
      }`}>
        <MoonSolid className="h-5 w-5 text-purple-400" />
      </div>
      <div className={`absolute transition-all duration-300 transform ${
        resolvedTheme === 'light'
          ? 'opacity-100 rotate-0 scale-100'
          : 'opacity-0 -rotate-90 scale-50'
      }`}>
        <SunSolid className="h-5 w-5 text-amber-500" />
      </div>
    </button>
  );
}
