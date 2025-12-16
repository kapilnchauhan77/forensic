import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronRightIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowsPointingOutIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { fingerprintsApi, exhibitsApi, casesApi, exportApi } from '../services/api';
import type { Fingerprint, Exhibit, Case, ProcessingResult } from '../types';
import toast from 'react-hot-toast';

export default function FingerprintViewer() {
  const { fingerprintId } = useParams<{ fingerprintId: string }>();
  const [fingerprint, setFingerprint] = useState<Fingerprint | null>(null);
  const [exhibit, setExhibit] = useState<Exhibit | null>(null);
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [viewMode, setViewMode] = useState<'original' | 'enhanced' | 'comparison'>('comparison');
  const [selectedResult, setSelectedResult] = useState<ProcessingResult | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  // Touch gesture state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const touchStartRef = useRef<{ x: number; y: number; zoom: number; distance: number } | null>(null);
  const lastPanRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (fingerprintId) {
      fetchData();
    }
  }, [fingerprintId]);

  async function fetchData() {
    setIsLoading(true);
    try {
      const fpResponse = await fingerprintsApi.get(fingerprintId!);
      setFingerprint(fpResponse);

      // Set primary result as selected
      const primary = fpResponse.processing_results?.find(r => r.is_primary);
      if (primary) {
        setSelectedResult(primary);
      }

      // Fetch exhibit and case
      const exhibitResponse = await exhibitsApi.get(fpResponse.exhibit_id);
      setExhibit(exhibitResponse);

      const caseResponse = await casesApi.get(exhibitResponse.case_id);
      setCaseData(caseResponse);
    } catch (error) {
      toast.error('Failed to load fingerprint details');
    } finally {
      setIsLoading(false);
    }
  }

  // Touch event handlers for pinch-to-zoom and pan
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch gesture start
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      touchStartRef.current = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
        zoom,
        distance
      };
    } else if (e.touches.length === 1) {
      // Pan gesture start
      touchStartRef.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
        zoom,
        distance: 0
      };
    }
  }, [zoom, pan]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!touchStartRef.current) return;

    if (e.touches.length === 2) {
      // Pinch gesture
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      const scale = distance / touchStartRef.current.distance;
      const newZoom = Math.max(0.5, Math.min(4, touchStartRef.current.zoom * scale));
      setZoom(newZoom);
    } else if (e.touches.length === 1 && zoom > 1) {
      // Pan gesture (only when zoomed in)
      const newX = e.touches[0].clientX - touchStartRef.current.x;
      const newY = e.touches[0].clientY - touchStartRef.current.y;
      setPan({ x: newX, y: newY });
      lastPanRef.current = { x: newX, y: newY };
    }
  }, [zoom]);

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
  }, []);

  // Touch slider handler
  const handleSliderTouch = useCallback((e: React.TouchEvent) => {
    const container = containerRef.current;
    if (!container) return;

    const touch = e.touches[0];
    const rect = container.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percent);
  }, []);

  const handleReprocess = async () => {
    try {
      await fingerprintsApi.reprocess(fingerprintId!, undefined, true);
      toast.success('Reprocessing started');
      fetchData();
    } catch (error) {
      toast.error('Failed to start reprocessing');
    }
  };

  const handleDownloadReport = async () => {
    try {
      const report = await exportApi.getFingerprintReport(fingerprintId!);
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fingerprint_${fingerprint?.original_filename}_report.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Report downloaded');
    } catch (error) {
      toast.error('Failed to download report');
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const getQualityBadgeClass = (score: number | null) => {
    if (score === null) return 'quality-badge';
    if (score >= 70) return 'quality-badge high';
    if (score >= 40) return 'quality-badge medium';
    return 'quality-badge low';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-forensic-600"></div>
      </div>
    );
  }

  if (!fingerprint) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Fingerprint not found</h3>
      </div>
    );
  }

  const originalUrl = fingerprint.original_url;
  const enhancedUrl = selectedResult?.enhanced_url;

  // Fullscreen viewer
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        {/* Controls */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent">
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full bg-black/30 text-white min-h-touch min-w-touch flex items-center justify-center"
          >
            <ChevronRightIcon className="h-6 w-6 rotate-180" />
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
              className="p-2 rounded-full bg-black/30 text-white min-h-touch min-w-touch flex items-center justify-center"
            >
              <MagnifyingGlassMinusIcon className="h-5 w-5" />
            </button>
            <span className="text-white text-sm min-w-[50px] text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(z => Math.min(4, z + 0.25))}
              className="p-2 rounded-full bg-black/30 text-white min-h-touch min-w-touch flex items-center justify-center"
            >
              <MagnifyingGlassPlusIcon className="h-5 w-5" />
            </button>
            <button
              onClick={resetView}
              className="p-2 rounded-full bg-black/30 text-white min-h-touch min-w-touch flex items-center justify-center"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Image viewer with touch gestures */}
        <div
          ref={viewerRef}
          className="w-full h-full flex items-center justify-center overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'none' }}
        >
          <img
            src={viewMode === 'enhanced' && enhancedUrl ? enhancedUrl : originalUrl || ''}
            alt={viewMode === 'enhanced' ? 'Enhanced' : 'Original'}
            className="max-w-none"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transition: touchStartRef.current ? 'none' : 'transform 0.1s ease-out'
            }}
            draggable={false}
          />
        </div>

        {/* Bottom view mode toggle */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 pb-safe-bottom flex justify-center bg-gradient-to-t from-black/70 to-transparent">
          <div className="flex items-center space-x-2 bg-black/50 rounded-full p-1">
            <button
              onClick={() => setViewMode('original')}
              className={`px-4 py-2 text-sm rounded-full transition-colors ${viewMode === 'original' ? 'bg-white text-black' : 'text-white'}`}
            >
              Original
            </button>
            {enhancedUrl && (
              <button
                onClick={() => setViewMode('enhanced')}
                className={`px-4 py-2 text-sm rounded-full transition-colors ${viewMode === 'enhanced' ? 'bg-white text-black' : 'text-white'}`}
              >
                Enhanced
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Breadcrumb - Responsive */}
      <nav className="flex mb-4 overflow-x-auto scrollbar-hide" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm whitespace-nowrap">
          <li>
            <Link to="/cases" className="text-gray-400 hover:text-gray-500">Cases</Link>
          </li>
          <ChevronRightIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
          <li>
            <Link to={`/cases/${caseData?.id}`} className="text-gray-400 hover:text-gray-500 truncate max-w-[80px] sm:max-w-none">
              {caseData?.case_number}
            </Link>
          </li>
          <ChevronRightIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
          <li>
            <Link to={`/exhibits/${exhibit?.id}`} className="text-gray-400 hover:text-gray-500 truncate max-w-[80px] sm:max-w-none">
              {exhibit?.exhibit_number}
            </Link>
          </li>
          <ChevronRightIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
          <li className="font-medium text-gray-500 truncate max-w-[100px] sm:max-w-none">{fingerprint.original_filename}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Viewer */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Toolbar - Mobile optimized */}
            <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200">
              {/* Mobile: Compact toolbar */}
              <div className="flex sm:hidden items-center justify-between">
                <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide">
                  <button
                    onClick={() => setViewMode('original')}
                    className={`px-2.5 py-1.5 text-xs rounded-lg whitespace-nowrap ${viewMode === 'original' ? 'bg-forensic-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    Original
                  </button>
                  <button
                    onClick={() => setViewMode('enhanced')}
                    disabled={!enhancedUrl}
                    className={`px-2.5 py-1.5 text-xs rounded-lg whitespace-nowrap ${viewMode === 'enhanced' ? 'bg-forensic-600 text-white' : 'bg-gray-100 text-gray-700'} disabled:opacity-50`}
                  >
                    Enhanced
                  </button>
                  <button
                    onClick={() => setViewMode('comparison')}
                    disabled={!enhancedUrl}
                    className={`px-2.5 py-1.5 text-xs rounded-lg whitespace-nowrap ${viewMode === 'comparison' ? 'bg-forensic-600 text-white' : 'bg-gray-100 text-gray-700'} disabled:opacity-50`}
                  >
                    Compare
                  </button>
                </div>
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-lg bg-gray-100 text-gray-700 ml-2"
                >
                  <ArrowsPointingOutIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Desktop: Full toolbar */}
              <div className="hidden sm:flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('original')}
                    className={`px-3 py-1 text-sm rounded ${viewMode === 'original' ? 'bg-forensic-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Original
                  </button>
                  <button
                    onClick={() => setViewMode('enhanced')}
                    disabled={!enhancedUrl}
                    className={`px-3 py-1 text-sm rounded ${viewMode === 'enhanced' ? 'bg-forensic-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} disabled:opacity-50`}
                  >
                    Enhanced
                  </button>
                  <button
                    onClick={() => setViewMode('comparison')}
                    disabled={!enhancedUrl}
                    className={`px-3 py-1 text-sm rounded ${viewMode === 'comparison' ? 'bg-forensic-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} disabled:opacity-50`}
                  >
                    Compare
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}
                    className="p-1 rounded hover:bg-gray-100"
                    title="Zoom out"
                  >
                    <MagnifyingGlassMinusIcon className="h-5 w-5 text-gray-500" />
                  </button>
                  <span className="text-sm text-gray-500 min-w-[50px] text-center">{Math.round(zoom * 100)}%</span>
                  <button
                    onClick={() => setZoom(z => Math.min(4, z + 0.25))}
                    className="p-1 rounded hover:bg-gray-100"
                    title="Zoom in"
                  >
                    <MagnifyingGlassPlusIcon className="h-5 w-5 text-gray-500" />
                  </button>
                  <button
                    onClick={resetView}
                    className="p-1 rounded hover:bg-gray-100"
                    title="Reset zoom"
                  >
                    <ArrowPathIcon className="h-5 w-5 text-gray-500" />
                  </button>
                  <button
                    onClick={toggleFullscreen}
                    className="p-1 rounded hover:bg-gray-100"
                    title="Fullscreen"
                  >
                    <ArrowsPointingOutIcon className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>

            {/* Image Viewer */}
            <div
              ref={containerRef}
              className="relative bg-gray-900 overflow-hidden"
              style={{ height: 'clamp(300px, 50vh, 500px)' }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {viewMode === 'comparison' && originalUrl && enhancedUrl ? (
                <div className="relative w-full h-full">
                  {/* Enhanced image (full) */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img
                      src={enhancedUrl}
                      alt="Enhanced"
                      className="max-w-full max-h-full object-contain"
                      style={{ transform: `scale(${zoom})` }}
                      draggable={false}
                    />
                  </div>
                  {/* Original image (clipped) */}
                  <div
                    className="absolute inset-0 overflow-hidden flex items-center justify-center"
                    style={{ width: `${sliderPosition}%` }}
                  >
                    <img
                      src={originalUrl}
                      alt="Original"
                      className="max-h-full object-contain"
                      style={{ transform: `scale(${zoom})` }}
                      draggable={false}
                    />
                  </div>
                  {/* Slider */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-lg"
                    style={{ left: `${sliderPosition}%` }}
                    onMouseDown={() => {
                      const container = containerRef.current;
                      if (!container) return;

                      const handleMove = (moveEvent: MouseEvent) => {
                        const rect = container.getBoundingClientRect();
                        const x = moveEvent.clientX - rect.left;
                        const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
                        setSliderPosition(percent);
                      };

                      const handleUp = () => {
                        document.removeEventListener('mousemove', handleMove);
                        document.removeEventListener('mouseup', handleUp);
                      };

                      document.addEventListener('mousemove', handleMove);
                      document.addEventListener('mouseup', handleUp);
                    }}
                    onTouchMove={handleSliderTouch}
                  >
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow">
                      <div className="flex space-x-0.5">
                        <div className="w-0.5 h-5 bg-gray-400 rounded"></div>
                        <div className="w-0.5 h-5 bg-gray-400 rounded"></div>
                      </div>
                    </div>
                  </div>
                  {/* Labels */}
                  <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 text-white text-xs rounded">
                    Original
                  </div>
                  <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 text-white text-xs rounded">
                    Enhanced
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center overflow-hidden">
                  <img
                    src={viewMode === 'enhanced' && enhancedUrl ? enhancedUrl : originalUrl || ''}
                    alt={viewMode === 'enhanced' ? 'Enhanced' : 'Original'}
                    className="max-w-full max-h-full object-contain"
                    style={{
                      transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                    }}
                    draggable={false}
                  />
                </div>
              )}

              {/* Mobile hint */}
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 sm:hidden">
                <span className="px-2 py-1 bg-black/50 text-white text-xs rounded">
                  Pinch to zoom
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Details Panel - Collapsible on mobile */}
        <div className="space-y-4 sm:space-y-6">
          {/* Mobile: Collapsible trigger */}
          <button
            className="w-full lg:hidden flex items-center justify-between p-4 bg-white shadow rounded-lg"
            onClick={() => setShowDetails(!showDetails)}
          >
            <span className="font-medium text-gray-900">Details & Classification</span>
            <ChevronDownIcon className={`h-5 w-5 text-gray-500 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
          </button>

          <div className={`space-y-4 sm:space-y-6 ${showDetails ? 'block' : 'hidden lg:block'}`}>
            {/* Status & Actions */}
            <div className="bg-white shadow rounded-lg p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <span className={`status-badge ${fingerprint.status}`}>
                  {fingerprint.status}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={handleReprocess}
                    className="inline-flex items-center px-3 py-1.5 text-xs rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 min-h-touch"
                    title="Reprocess"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-1" />
                    Reprocess
                  </button>
                  <button
                    onClick={handleDownloadReport}
                    className="inline-flex items-center px-3 py-1.5 text-xs rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 min-h-touch"
                    title="Download Report"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                    Report
                  </button>
                </div>
              </div>

              {fingerprint.processing_error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
                    <p className="ml-2 text-sm text-red-700">{fingerprint.processing_error}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Classification */}
            {fingerprint.pattern_type && (
              <div className="bg-white shadow rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Classification</h3>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="pattern-badge capitalize">
                      {fingerprint.pattern_type.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-gray-500">
                      {fingerprint.pattern_confidence
                        ? `${(fingerprint.pattern_confidence * 100).toFixed(0)}% confidence`
                        : ''}
                    </span>
                  </div>
                  {fingerprint.classification_rationale && (
                    <p className="text-sm text-gray-600 border-l-2 border-forensic-200 pl-3">
                      {fingerprint.classification_rationale}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Quality */}
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Quality Assessment</h3>
              {fingerprint.quality_score !== null ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={getQualityBadgeClass(fingerprint.quality_score)}>
                      Score: {fingerprint.quality_score.toFixed(0)}/100
                    </span>
                  </div>

                  {/* Quality bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        fingerprint.quality_score >= 70 ? 'bg-green-500' :
                        fingerprint.quality_score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${fingerprint.quality_score}%` }}
                    />
                  </div>

                  {fingerprint.quality_issues && fingerprint.quality_issues.length > 0 && (
                    <div className="space-y-1">
                      {fingerprint.quality_issues.map((issue, idx) => (
                        <div
                          key={idx}
                          className={`text-xs p-2 rounded ${
                            issue.severity === 'high' ? 'bg-red-50 text-red-700' :
                            issue.severity === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                            'bg-gray-50 text-gray-700'
                          }`}
                        >
                          {issue.description}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Not assessed yet</p>
              )}
            </div>

            {/* Enhancement Results */}
            {fingerprint.processing_results && fingerprint.processing_results.length > 0 && (
              <div className="bg-white shadow rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Enhancement Results</h3>
                <div className="space-y-2">
                  {fingerprint.processing_results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => setSelectedResult(result)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedResult?.id === result.id
                          ? 'border-forensic-500 bg-forensic-50'
                          : 'border-gray-200 hover:border-gray-300 active:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">
                          {result.enhancement_preset.replace('_', ' ')}
                        </span>
                        {result.is_primary && (
                          <CheckCircleIcon className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center text-xs text-gray-500 gap-2">
                        {result.quality_improvement !== null && (
                          <span className={result.quality_improvement >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {result.quality_improvement >= 0 ? '+' : ''}{result.quality_improvement.toFixed(1)} quality
                          </span>
                        )}
                        {result.artifact_risk_level && (
                          <span className={`
                            ${result.artifact_risk_level === 'high' ? 'text-red-600' : ''}
                            ${result.artifact_risk_level === 'medium' ? 'text-yellow-600' : ''}
                            ${result.artifact_risk_level === 'low' ? 'text-green-600' : ''}
                          `}>
                            {result.artifact_risk_level} risk
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* File Info */}
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">File Information</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Filename</dt>
                  <dd className="text-gray-900 truncate max-w-[150px] sm:max-w-[200px]" title={fingerprint.original_filename}>
                    {fingerprint.original_filename}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Dimensions</dt>
                  <dd className="text-gray-900">
                    {fingerprint.image_width}x{fingerprint.image_height}
                  </dd>
                </div>
                {fingerprint.dpi && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">DPI</dt>
                    <dd className="text-gray-900">{fingerprint.dpi}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-gray-500">Size</dt>
                  <dd className="text-gray-900">
                    {(fingerprint.file_size_bytes / 1024).toFixed(1)} KB
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Print Type</dt>
                  <dd className="text-gray-900 capitalize">
                    {fingerprint.print_type.replace('_', ' ')}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">SHA-256</dt>
                  <dd className="text-gray-900 font-mono text-xs truncate max-w-[150px] sm:max-w-[200px]" title={fingerprint.original_hash_sha256}>
                    {fingerprint.original_hash_sha256.substring(0, 16)}...
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
