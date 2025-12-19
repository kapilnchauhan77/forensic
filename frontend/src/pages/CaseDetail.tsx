import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  PlusIcon,
  FolderIcon,
  FingerPrintIcon,
  ArrowDownTrayIcon,
  ChevronRightIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { casesApi, exhibitsApi, exportApi } from '../services/api';
import type { Case, Exhibit } from '../types';
import toast from 'react-hot-toast';
import CreateExhibitModal from '../components/CreateExhibitModal';

export default function CaseDetail() {
  const { caseId } = useParams<{ caseId: string }>();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [exhibits, setExhibits] = useState<Exhibit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportLoading, setIsExportLoading] = useState(false);
  const [isCreateExhibitModalOpen, setIsCreateExhibitModalOpen] = useState(false);

  useEffect(() => {
    if (caseId) {
      fetchData();
    }
  }, [caseId]);

  async function fetchData() {
    setIsLoading(true);
    try {
      const [caseResponse, exhibitsResponse] = await Promise.all([
        casesApi.get(caseId!),
        exhibitsApi.listForCase(caseId!),
      ]);
      setCaseData(caseResponse);
      setExhibits(exhibitsResponse);
    } catch (error) {
      toast.error('Failed to load case details');
    } finally {
      setIsLoading(false);
    }
  }

  const handleCreateExhibit = async (data: { exhibit_number: string; description?: string }) => {
    try {
      await exhibitsApi.create({ ...data, case_id: caseId! });
      toast.success('Exhibit created successfully');
      setIsCreateExhibitModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to create exhibit');
    }
  };

  const handleExportEvidencePack = async () => {
    setIsExportLoading(true);
    try {
      const blob = await exportApi.downloadEvidencePack(caseId!);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `case_${caseData?.case_number}_evidence_pack.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Evidence pack downloaded');
    } catch (error) {
      toast.error('Failed to export evidence pack');
    } finally {
      setIsExportLoading(false);
    }
  };

  const handleDeleteExhibit = async (exhibit: Exhibit) => {
    if (!window.confirm(`Are you sure you want to delete exhibit "${exhibit.exhibit_number}"? This will also delete all fingerprints associated with this exhibit. This action cannot be undone.`)) {
      return;
    }

    try {
      await exhibitsApi.delete(exhibit.id);
      toast.success('Exhibit deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete exhibit');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Case not found</h3>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex mb-4" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          <li>
            <Link to="/cases" className="text-gray-400 dark:text-zinc-500 hover:text-gray-500 dark:hover:text-zinc-400">
              Cases
            </Link>
          </li>
          <ChevronRightIcon className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
          <li className="text-sm font-medium text-gray-500 dark:text-zinc-400">{caseData.case_number}</li>
        </ol>
      </nav>

      {/* Case Header */}
      <div className="bg-white dark:bg-zinc-900 shadow dark:shadow-zinc-900/50 rounded-lg mb-6 border border-gray-200 dark:border-zinc-800">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{caseData.case_number}</h1>
            <p className="mt-1 text-lg text-gray-600 dark:text-zinc-400">{caseData.title}</p>
            <div className="mt-2 flex items-center space-x-4">
              <span className={`status-badge ${caseData.status}`}>
                {caseData.status.replace('_', ' ')}
              </span>
              <span className="text-sm text-gray-500 dark:text-zinc-400">
                {caseData.source_type.replace('_', ' ')}
              </span>
              {caseData.agency && (
                <span className="text-sm text-gray-500 dark:text-zinc-400">{caseData.agency}</span>
              )}
            </div>
          </div>
          <button
            onClick={handleExportEvidencePack}
            disabled={isExportLoading}
            className="inline-flex items-center rounded-md bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400 dark:text-zinc-500" />
            {isExportLoading ? 'Exporting...' : 'Export Evidence Pack'}
          </button>
        </div>

        {caseData.description && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-zinc-800 sm:px-6">
            <p className="text-sm text-gray-600 dark:text-zinc-400">{caseData.description}</p>
          </div>
        )}

        <div className="px-4 py-3 border-t border-gray-200 dark:border-zinc-800 sm:px-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <dt className="text-xs font-medium text-gray-500 dark:text-zinc-400">Exhibits</dt>
            <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{caseData.exhibit_count}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 dark:text-zinc-400">Fingerprints</dt>
            <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{caseData.fingerprint_count}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 dark:text-zinc-400">Created</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {new Date(caseData.created_at).toLocaleDateString()}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 dark:text-zinc-400">Operator</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">{caseData.operator_name || 'Unknown'}</dd>
          </div>
        </div>
      </div>

      {/* Exhibits Section */}
      <div className="bg-white dark:bg-zinc-900 shadow dark:shadow-zinc-900/50 rounded-lg border border-gray-200 dark:border-zinc-800">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200 dark:border-zinc-800">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Exhibits</h2>
          <button
            onClick={() => setIsCreateExhibitModalOpen(true)}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Add Exhibit
          </button>
        </div>

        {exhibits.length === 0 ? (
          <div className="text-center py-12">
            <FolderIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-zinc-600" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No exhibits</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">Add exhibits to organize fingerprint evidence.</p>
            <div className="mt-6">
              <button
                onClick={() => setIsCreateExhibitModalOpen(true)}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                Add Exhibit
              </button>
            </div>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-gray-200 dark:divide-zinc-800">
            {exhibits.map((exhibit) => (
              <li key={exhibit.id}>
                <div className="flex items-center hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                  <Link
                    to={`/exhibits/${exhibit.id}`}
                    className="flex-1 block"
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FolderIcon className="h-5 w-5 text-gray-400 dark:text-zinc-500 mr-3" />
                          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                            {exhibit.exhibit_number}
                          </p>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-zinc-400">
                          <FingerPrintIcon className="mr-1 h-4 w-4 text-gray-400 dark:text-zinc-500" />
                          {exhibit.fingerprint_count} fingerprints
                          <ChevronRightIcon className="ml-2 h-5 w-5 text-gray-400 dark:text-zinc-500" />
                        </div>
                      </div>
                      {exhibit.description && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-500 dark:text-zinc-400">{exhibit.description}</p>
                        </div>
                      )}
                      {(exhibit.location_collected || exhibit.collection_date) && (
                        <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-zinc-400 space-x-4">
                          {exhibit.location_collected && (
                            <span>Location: {exhibit.location_collected}</span>
                          )}
                          {exhibit.collection_date && (
                            <span>
                              Collected: {new Date(exhibit.collection_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="pr-4">
                    <button
                      onClick={() => handleDeleteExhibit(exhibit)}
                      className="p-2 text-gray-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete exhibit"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <CreateExhibitModal
        isOpen={isCreateExhibitModalOpen}
        onClose={() => setIsCreateExhibitModalOpen(false)}
        onSubmit={handleCreateExhibit}
      />
    </div>
  );
}
