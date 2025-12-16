import { useEffect, useState } from 'react';
import { pipelineApi } from '../services/api';
import type { PipelineConfig, PipelineVersion } from '../types';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

export default function Settings() {
  const { user } = useAuth();
  const [pipelineConfigs, setPipelineConfigs] = useState<PipelineConfig[]>([]);
  const [pipelineVersion, setPipelineVersion] = useState<PipelineVersion | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [configs, version] = await Promise.all([
        pipelineApi.listConfigs(),
        pipelineApi.getCurrentVersion(),
      ]);
      setPipelineConfigs(configs);
      setPipelineVersion(version);
    } catch (error) {
      toast.error('Failed to load pipeline configurations');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure platform settings and processing parameters
        </p>
      </div>

      <div className="space-y-6">
        {/* User Info */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Account Information</h2>
          </div>
          <div className="px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Username</dt>
                <dd className="mt-1 text-sm text-gray-900">{user?.username}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Role</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{user?.role}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Agency</dt>
                <dd className="mt-1 text-sm text-gray-900">{user?.agency || 'Not specified'}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Pipeline Configurations */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Enhancement Pipeline Configurations</h2>
            <p className="mt-1 text-sm text-gray-500">
              Available presets for fingerprint enhancement processing
            </p>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forensic-600"></div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {pipelineConfigs.map((config) => (
                <div key={config.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {config.display_name}
                        {config.is_default && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-forensic-100 text-forensic-800">
                            Default
                          </span>
                        )}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">{config.description}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${config.artifact_risk_level === 'high' ? 'bg-red-100 text-red-800' : ''}
                        ${config.artifact_risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${config.artifact_risk_level === 'low' ? 'bg-green-100 text-green-800' : ''}
                      `}>
                        {config.artifact_risk_level} risk
                      </span>
                      <span className="text-xs text-gray-500">v{config.version}</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <details className="text-sm">
                      <summary className="cursor-pointer text-forensic-600 hover:text-forensic-700">
                        View configuration
                      </summary>
                      <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto">
                        {JSON.stringify(config.config, null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Info */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">System Information</h2>
          </div>
          <div className="px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="font-medium text-gray-500">Platform Version</dt>
                <dd className="mt-1 text-gray-900">1.0.0</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Pipeline Version</dt>
                <dd className="mt-1 text-gray-900">{pipelineVersion?.version || '1.0.0'}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Classification Model</dt>
                <dd className="mt-1 text-gray-900">{pipelineVersion?.gemini_model || 'Loading...'}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Enhancement Engine</dt>
                <dd className="mt-1 text-gray-900">OpenCV 4.9</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Forensic Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Forensic Use Notice</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  This platform is a decision-support tool for forensic practitioners. All enhancement
                  and classification results should be verified by qualified examiners before use in
                  legal proceedings. Original images are preserved immutably for chain-of-custody
                  requirements. All actions are logged for audit purposes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
