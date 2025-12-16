import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  FingerPrintIcon,
  ChevronRightIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { casesApi } from '../services/api';
import type { Case, CaseListResponse } from '../types';
import toast from 'react-hot-toast';
import CreateCaseModal from '../components/CreateCaseModal';

export default function CaseList() {
  const [cases, setCases] = useState<Case[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const pageSize = 10;

  useEffect(() => {
    fetchCases();
  }, [page, search, statusFilter]);

  async function fetchCases() {
    setIsLoading(true);
    try {
      const response: CaseListResponse = await casesApi.list(
        page,
        pageSize,
        search || undefined,
        statusFilter || undefined
      );
      setCases(response.cases);
      setTotal(response.total);
    } catch (error) {
      toast.error('Failed to load cases');
    } finally {
      setIsLoading(false);
    }
  }

  const handleCreateCase = async (data: Partial<Case>) => {
    try {
      await casesApi.create(data);
      toast.success('Case created successfully');
      setIsCreateModalOpen(false);
      fetchCases();
    } catch (error) {
      toast.error('Failed to create case');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Cases</h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 hidden sm:block">
            Manage forensic cases and fingerprint evidence
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center rounded-lg bg-forensic-600 px-3 py-2 sm:px-4 sm:py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-forensic-500 active:bg-forensic-700 min-h-touch"
        >
          <PlusIcon className="h-5 w-5 sm:-ml-0.5 sm:mr-1.5" aria-hidden="true" />
          <span className="hidden sm:inline">New Case</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-4 sm:mb-6">
        {/* Mobile: Compact search with filter toggle */}
        <div className="flex gap-2 sm:hidden">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="block w-full rounded-lg border-0 py-2.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-forensic-600 text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center w-11 h-11 rounded-lg ring-1 ring-inset ${
              statusFilter ? 'bg-forensic-50 ring-forensic-300 text-forensic-600' : 'bg-white ring-gray-300 text-gray-500'
            }`}
          >
            <FunnelIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile: Expandable filter */}
        {showFilters && (
          <div className="mt-2 sm:hidden">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border-0 py-2.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-forensic-600 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="closed">Closed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        )}

        {/* Desktop: Full filters */}
        <div className="hidden sm:flex gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search cases..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-forensic-600 sm:text-sm sm:leading-6"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-forensic-600 sm:text-sm"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="closed">Closed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Cases List/Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-forensic-600"></div>
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-12 px-4">
            <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No cases</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new case.</p>
            <div className="mt-6">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center rounded-md bg-forensic-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-forensic-500 min-h-touch"
              >
                <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                New Case
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile: Card list */}
            <ul className="divide-y divide-gray-200 sm:hidden">
              {cases.map((caseItem) => (
                <li key={caseItem.id}>
                  <Link
                    to={`/cases/${caseItem.id}`}
                    className="block px-4 py-3 hover:bg-gray-50 active:bg-gray-100"
                  >
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
                      <ChevronRightIcon className="h-5 w-5 text-gray-400 ml-2 flex-shrink-0" />
                    </div>
                    <div className="flex items-center justify-between mt-2 pl-8">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center">
                          <FolderIcon className="h-3.5 w-3.5 mr-1" />
                          {caseItem.exhibit_count}
                        </span>
                        <span className="flex items-center">
                          <FingerPrintIcon className="h-3.5 w-3.5 mr-1" />
                          {caseItem.fingerprint_count}
                        </span>
                      </div>
                      <span className={`status-badge ${caseItem.status} text-xs`}>
                        {caseItem.status.replace('_', ' ')}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Desktop: Table */}
            <table className="hidden sm:table min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Case
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Evidence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cases.map((caseItem) => (
                  <tr key={caseItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/cases/${caseItem.id}`} className="block">
                        <div className="text-sm font-medium text-forensic-600 hover:text-forensic-800">
                          {caseItem.case_number}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {caseItem.title}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {caseItem.agency || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`status-badge ${caseItem.status}`}>
                        {caseItem.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <FolderIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {caseItem.exhibit_count} exhibits
                      </div>
                      <div className="flex items-center text-xs">
                        <FingerPrintIcon className="h-3 w-3 mr-1 text-gray-400" />
                        {caseItem.fingerprint_count} prints
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(caseItem.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                {/* Mobile pagination */}
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 min-h-touch"
                  >
                    Previous
                  </button>
                  <span className="flex items-center text-sm text-gray-700">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 min-h-touch"
                  >
                    Next
                  </button>
                </div>

                {/* Desktop pagination */}
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(page * pageSize, total)}</span> of{' '}
                      <span className="font-medium">{total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <CreateCaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateCase}
      />
    </div>
  );
}
