import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderIcon,
  DocumentIcon,
  FingerPrintIcon,
  ClockIcon,
  ChevronRightIcon,
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
    { name: 'Total Cases', value: stats.totalCases, icon: FolderIcon, href: '/cases', color: 'bg-forensic-500' },
    { name: 'Open Cases', value: stats.openCases, icon: DocumentIcon, href: '/cases?status=open', color: 'bg-green-500' },
    { name: 'Fingerprints', value: stats.totalFingerprints, icon: FingerPrintIcon, href: '/cases', color: 'bg-purple-500' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-forensic-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-xs sm:text-sm text-gray-500">
          Overview of your forensic analysis platform
        </p>
      </div>

      {/* Stats - Mobile: Horizontal scroll, Desktop: Grid */}
      <div className="mb-4 sm:mb-8">
        {/* Mobile: Horizontal scrollable cards */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:hidden scrollbar-hide">
          {statCards.map((stat) => (
            <Link
              key={stat.name}
              to={stat.href}
              className="flex-shrink-0 w-32 rounded-xl bg-white p-4 shadow-sm active:shadow-inner"
            >
              <div className={`${stat.color} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
                <stat.icon className="h-5 w-5 text-white" aria-hidden="true" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.name}</p>
            </Link>
          ))}
        </div>

        {/* Desktop: Grid layout */}
        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {statCards.map((stat) => (
            <Link
              key={stat.name}
              to={stat.href}
              className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6 hover:shadow-md transition-shadow"
            >
              <dt>
                <div className={`absolute rounded-md ${stat.color} p-3`}>
                  <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <p className="ml-16 truncate text-sm font-medium text-gray-500">{stat.name}</p>
              </dt>
              <dd className="ml-16 flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </dd>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-medium leading-6 text-gray-900 flex items-center">
            <ClockIcon className="h-5 w-5 mr-2 text-gray-400" />
            Recent Cases
          </h3>
        </div>
        <ul role="list" className="divide-y divide-gray-200">
          {stats.recentActivity.length === 0 ? (
            <li className="px-4 py-8 text-center text-gray-500 text-sm">
              No cases yet. Create your first case to get started.
            </li>
          ) : (
            stats.recentActivity.map((caseItem) => (
              <li key={caseItem.id}>
                <Link
                  to={`/cases/${caseItem.id}`}
                  className="block hover:bg-gray-50 active:bg-gray-100"
                >
                  {/* Mobile layout */}
                  <div className="px-4 py-3 sm:hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center min-w-0 flex-1">
                        <FolderIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-forensic-600 truncate">
                            {caseItem.case_number}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {caseItem.title}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center ml-3">
                        <span className={`status-badge ${caseItem.status} text-xs`}>
                          {caseItem.status.replace('_', ' ')}
                        </span>
                        <ChevronRightIcon className="h-5 w-5 text-gray-400 ml-2" />
                      </div>
                    </div>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden sm:block px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FolderIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <p className="truncate text-sm font-medium text-forensic-600">
                          {caseItem.case_number}
                        </p>
                      </div>
                      <div className="ml-2 flex flex-shrink-0">
                        <span className={`status-badge ${caseItem.status}`}>
                          {caseItem.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="text-sm text-gray-500">{caseItem.title}</p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <FingerPrintIcon className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                        {caseItem.fingerprint_count} fingerprints
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
        {stats.recentActivity.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 sm:px-6">
            <Link
              to="/cases"
              className="text-sm font-medium text-forensic-600 hover:text-forensic-500 flex items-center justify-center sm:justify-end min-h-touch"
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
