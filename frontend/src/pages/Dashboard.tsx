import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderIcon,
  DocumentIcon,
  FingerPrintIcon,
  ClockIcon,
  ChevronRightIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { casesApi } from '../services/api';
import type { Case } from '../types';

interface Stats {
  totalCases: number;
  openCases: number;
  totalFingerprints: number;
  recentActivity: Case[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalCases: 0,
    openCases: 0,
    totalFingerprints: 0,
    recentActivity: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await casesApi.list(1, 5);
        const openCases = response.cases.filter(c => c.status === 'open' || c.status === 'in_progress');
        const totalFingerprints = response.cases.reduce((sum, c) => sum + c.fingerprint_count, 0);

        setStats({
          totalCases: response.total,
          openCases: openCases.length,
          totalFingerprints,
          recentActivity: response.cases.slice(0, 5),
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  const statCards = [
    {
      name: 'Total Cases',
      value: stats.totalCases,
      icon: FolderIcon,
      href: '/cases',
      gradient: 'from-cyan-500 to-cyan-600',
      lightBg: 'bg-cyan-50',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      change: null,
    },
    {
      name: 'Open Cases',
      value: stats.openCases,
      icon: DocumentIcon,
      href: '/cases?status=open',
      gradient: 'from-emerald-500 to-emerald-600',
      lightBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      change: stats.openCases > 0 ? '+' + stats.openCases : null,
    },
    {
      name: 'Fingerprints',
      value: stats.totalFingerprints,
      icon: FingerPrintIcon,
      href: '/cases',
      gradient: 'from-purple-500 to-purple-600',
      lightBg: 'bg-purple-50',
      iconColor: 'text-purple-600 dark:text-purple-400',
      change: null,
    },
  ];

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        {/* Skeleton Header */}
        <div className="mb-6 sm:mb-8">
          <div className="skeleton h-8 w-40 mb-2"></div>
          <div className="skeleton h-4 w-64"></div>
        </div>

        {/* Skeleton Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card"></div>
          ))}
        </div>

        {/* Skeleton Activity */}
        <div className="card p-6">
          <div className="skeleton h-6 w-32 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="skeleton-avatar"></div>
                <div className="flex-1 space-y-2">
                  <div className="skeleton-text w-1/3"></div>
                  <div className="skeleton-text w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg shadow-cyan-500/25">
            <SparklesIcon className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
        </div>
        <p className="text-sm sm:text-base text-gray-500 dark:text-zinc-400">
          Overview of your forensic analysis platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            to={stat.href}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 relative overflow-hidden hover:shadow-lg hover:border-gray-300 dark:hover:border-zinc-700 hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-xl ${stat.lightBg} dark:bg-zinc-800 transition-colors`}>
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} aria-hidden="true" />
              </div>
              {stat.change && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                  <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                  {stat.change}
                </span>
              )}
            </div>
            <div className="mt-4">
              <p className="text-4xl font-extrabold text-gray-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                {stat.value}
              </p>
              <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 mt-1">{stat.name}</p>
            </div>
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity rounded-b-2xl`} />
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-6 sm:mb-8 sm:hidden">
        <Link
          to="/cases"
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/25"
        >
          <FolderIcon className="h-5 w-5" />
          View Cases
        </Link>
        <Link
          to="/settings"
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 border-2 border-gray-200 dark:border-zinc-700"
        >
          Settings
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-gray-400 dark:text-zinc-500" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recent Cases</h3>
          </div>
          <Link
            to="/cases"
            className="text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 hidden sm:flex items-center"
          >
            View all
            <ChevronRightIcon className="h-4 w-4 ml-1" />
          </Link>
        </div>

        {stats.recentActivity.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <FolderIcon className="w-20 h-20 text-gray-300 dark:text-zinc-600 mb-6" />
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No cases yet</h4>
            <p className="text-gray-500 dark:text-zinc-400 max-w-sm">
              Create your first case to get started with fingerprint analysis
            </p>
            <Link to="/cases" className="mt-4 py-3 px-5 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:via-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25 transition-all duration-200">
              Create Case
            </Link>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-gray-200 dark:divide-zinc-800">
            {stats.recentActivity.map((caseItem) => (
              <li key={caseItem.id}>
                <Link
                  to={`/cases/${caseItem.id}`}
                  className="flex items-center gap-4 px-4 sm:px-6 py-4
                    hover:bg-gray-50 dark:hover:bg-zinc-800/50
                    active:bg-gray-100 dark:active:bg-zinc-800
                    transition-colors"
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 p-2 rounded-xl bg-gray-100 dark:bg-zinc-800">
                    <FolderIcon className="h-5 w-5 text-gray-500 dark:text-zinc-400" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 truncate">
                        {caseItem.case_number}
                      </p>
                      <span className={`status-badge ${caseItem.status}`}>
                        {caseItem.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-zinc-400 truncate mt-0.5">
                      {caseItem.title}
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="flex-shrink-0 flex items-center gap-3">
                    <div className="hidden sm:flex items-center text-sm text-gray-500 dark:text-zinc-400">
                      <FingerPrintIcon className="h-4 w-4 mr-1" />
                      {caseItem.fingerprint_count}
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-gray-400 dark:text-zinc-500" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Mobile: View all link */}
        {stats.recentActivity.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 sm:hidden">
            <Link
              to="/cases"
              className="text-sm font-medium text-cyan-600 dark:text-cyan-400 flex items-center justify-center min-h-[44px]"
            >
              View all cases
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
