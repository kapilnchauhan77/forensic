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
  EyeIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { fingerprintsApi, exhibitsApi, casesApi, exportApi } from '../services/api';
import type { Fingerprint, Exhibit, Case, ProcessingResult, EnhancementMethod } from '../types';
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
  const [showReprocessModal, setShowReprocessModal] = useState(false);
  const [selectedEnhancementMethod, setSelectedEnhancementMethod] = useState<EnhancementMethod>('auto');
  const [isReprocessing, setIsReprocessing] = useState(false);
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
    setIsReprocessing(true);
    try {
      await fingerprintsApi.reprocess(fingerprintId!, {
        enhancement_method: selectedEnhancementMethod,
        force: true,
      });
      toast.success('Reprocessing started');
      setShowReprocessModal(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to start reprocessing');
    } finally {
      setIsReprocessing(false);
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

  const getQualityColor = (score: number | null) => {
    if (score === null) return 'neutral';
    if (score >= 70) return 'success';
    if (score >= 40) return 'warning';
    return 'danger';
  };

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <div className="skeleton h-4 w-64 mb-4"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <div className="skeleton h-[400px] rounded-2xl"></div>
          </div>
          <div className="space-y-4">
            <div className="skeleton h-32 rounded-2xl"></div>
            <div className="skeleton h-48 rounded-2xl"></div>
            <div className="skeleton h-40 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!fingerprint) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <ExclamationTriangleIcon className="w-20 h-20 text-amber-500 mb-6" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Fingerprint not found</h3>
        <p className="text-gray-500 dark:text-zinc-400 max-w-sm">
          The fingerprint you're looking for doesn't exist or has been removed.
        </p>
        <Link to="/cases" className="mt-4 py-3 px-5 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:via-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25 transition-all duration-200">
          Back to Cases
        </Link>
      </div>
    );
  }

  const originalUrl = fingerprint.original_url;
  const enhancedUrl = selectedResult?.enhanced_url;

  // Fullscreen viewer
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-zinc-950">
        {/* Controls */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent">
          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-xl bg-white/10 backdrop-blur-xl text-white hover:bg-white/20 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl rounded-xl p-1">
            <button
              onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
              className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
            >
              <MagnifyingGlassMinusIcon className="h-5 w-5" />
            </button>
            <span className="text-white text-sm font-medium min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(z => Math.min(4, z + 0.25))}
              className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
            >
              <MagnifyingGlassPlusIcon className="h-5 w-5" />
            </button>
            <div className="w-px h-6 bg-white/20" />
            <button
              onClick={resetView}
              className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
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
          <div className="flex items-center gap-1 bg-white/10 backdrop-blur-xl rounded-xl p-1">
            <button
              onClick={() => setViewMode('original')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                viewMode === 'original'
                  ? 'bg-white text-zinc-900'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Original
            </button>
            {enhancedUrl && (
              <button
                onClick={() => setViewMode('enhanced')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  viewMode === 'enhanced'
                    ? 'bg-white text-zinc-900'
                    : 'text-white hover:bg-white/10'
                }`}
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
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex mb-4 overflow-x-auto scrollbar-hide" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-sm whitespace-nowrap">
          <li>
            <Link to="/cases" className="text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors">
              Cases
            </Link>
          </li>
          <ChevronRightIcon className="h-4 w-4 text-gray-400 dark:text-zinc-500 flex-shrink-0" />
          <li>
            <Link to={`/cases/${caseData?.id}`} className="text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors truncate max-w-[100px]">
              {caseData?.case_number}
            </Link>
          </li>
          <ChevronRightIcon className="h-4 w-4 text-gray-400 dark:text-zinc-500 flex-shrink-0" />
          <li>
            <Link to={`/exhibits/${exhibit?.id}`} className="text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors truncate max-w-[100px]">
              {exhibit?.exhibit_number}
            </Link>
          </li>
          <ChevronRightIcon className="h-4 w-4 text-gray-400 dark:text-zinc-500 flex-shrink-0" />
          <li className="font-medium text-gray-700 dark:text-zinc-200 truncate max-w-[120px]">
            {fingerprint.original_filename}
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Viewer */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            {/* Toolbar */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                {/* View mode buttons */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('original')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                      viewMode === 'original'
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <EyeIcon className="h-4 w-4 inline mr-1.5" />
                    Original
                  </button>
                  <button
                    onClick={() => setViewMode('enhanced')}
                    disabled={!enhancedUrl}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                      viewMode === 'enhanced'
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <AdjustmentsHorizontalIcon className="h-4 w-4 inline mr-1.5" />
                    Enhanced
                  </button>
                  <button
                    onClick={() => setViewMode('comparison')}
                    disabled={!enhancedUrl}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                      viewMode === 'comparison'
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-gray-200'
                    }`}
                  >
                    Compare
                  </button>
                </div>

                {/* Zoom controls */}
                <div className="hidden sm:flex items-center gap-1">
                  <button
                    onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}
                    className="p-2 rounded-lg text-white0 hover:text-zinc-900 hover:bg-gray-100 dark:hover:text-gray-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Zoom out"
                  >
                    <MagnifyingGlassMinusIcon className="h-5 w-5" />
                  </button>
                  <span className="text-sm text-white0 dark:text-gray-400 min-w-[50px] text-center font-medium">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={() => setZoom(z => Math.min(4, z + 0.25))}
                    className="p-2 rounded-lg text-white0 hover:text-zinc-900 hover:bg-gray-100 dark:hover:text-gray-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Zoom in"
                  >
                    <MagnifyingGlassPlusIcon className="h-5 w-5" />
                  </button>
                  <div className="w-px h-5 bg-gray-200 dark:bg-zinc-700 mx-1" />
                  <button
                    onClick={resetView}
                    className="p-2 rounded-lg text-white0 hover:text-zinc-900 hover:bg-gray-100 dark:hover:text-gray-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Reset zoom"
                  >
                    <ArrowPathIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 rounded-lg text-white0 hover:text-zinc-900 hover:bg-gray-100 dark:hover:text-gray-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Fullscreen"
                  >
                    <ArrowsPointingOutIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Mobile fullscreen button */}
                <button
                  onClick={toggleFullscreen}
                  className="sm:hidden p-2 rounded-lg bg-gray-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                >
                  <ArrowsPointingOutIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Image Viewer */}
            <div
              ref={containerRef}
              className="relative bg-zinc-950 overflow-hidden"
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
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                  >
                    <img
                      src={originalUrl}
                      alt="Original"
                      className="max-w-full max-h-full object-contain"
                      style={{ transform: `scale(${zoom})` }}
                      draggable={false}
                    />
                  </div>
                  {/* Slider */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize shadow-lg"
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
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg">
                      <div className="flex space-x-0.5">
                        <div className="w-0.5 h-4 bg-gray-400 rounded"></div>
                        <div className="w-0.5 h-4 bg-gray-400 rounded"></div>
                      </div>
                    </div>
                  </div>
                  {/* Labels */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-lg">
                    Original
                  </div>
                  <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-lg">
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
                <span className="px-3 py-1.5 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-lg">
                  Pinch to zoom
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Details Panel */}
        <div className="space-y-4">
          {/* Mobile: Collapsible trigger */}
          <button
            className="w-full lg:hidden flex items-center justify-between p-4 card"
            onClick={() => setShowDetails(!showDetails)}
          >
            <span className="font-semibold text-zinc-900 dark:text-white">Details & Classification</span>
            <ChevronDownIcon className={`h-5 w-5 text-white0 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`} />
          </button>

          <div className={`space-y-4 ${showDetails ? 'block' : 'hidden lg:block'}`}>
            {/* Status & Actions */}
            <div className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <span className={`status-badge ${fingerprint.status}`}>
                  {fingerprint.status}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowReprocessModal(true)}
                    className="btn-secondary text-sm flex items-center gap-1.5"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                    Reprocess
                  </button>
                  <button
                    onClick={handleDownloadReport}
                    className="btn-secondary text-sm flex items-center gap-1.5"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    Report
                  </button>
                </div>
              </div>

              {fingerprint.processing_error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl">
                  <div className="flex gap-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-rose-500 flex-shrink-0" />
                    <p className="text-sm text-rose-700 dark:text-rose-300">{fingerprint.processing_error}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Classification */}
            {fingerprint.pattern_type && (
              <div className="card p-4">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Classification</h3>
                <div className="space-y-3">
                  {/* Evidence Type & Detail Level badges */}
                  <div className="flex flex-wrap gap-2">
                    {fingerprint.evidence_type && fingerprint.evidence_type.toLowerCase() !== 'unknown' && (
                      <span className={`badge ${
                        fingerprint.evidence_type.toLowerCase() === 'latent' ? 'badge-primary' :
                        fingerprint.evidence_type.toLowerCase() === 'patent' ? 'badge-warning' :
                        fingerprint.evidence_type.toLowerCase() === 'plastic' ? 'badge-success' :
                        'badge-neutral'
                      }`}>
                        {fingerprint.evidence_type.charAt(0).toUpperCase() + fingerprint.evidence_type.slice(1).toLowerCase()} Print
                      </span>
                    )}
                    {fingerprint.detail_level && (
                      <span className={`badge ${
                        fingerprint.detail_level.toLowerCase() === 'level_3' ? 'badge-success' :
                        fingerprint.detail_level.toLowerCase() === 'level_2' ? 'badge-warning' :
                        'badge-neutral'
                      }`}>
                        {fingerprint.detail_level.toLowerCase() === 'level_1' ? 'Level 1' :
                         fingerprint.detail_level.toLowerCase() === 'level_2' ? 'Level 2' :
                         'Level 3'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="pattern-badge capitalize">
                        {fingerprint.pattern_type.replace('_', ' ')}
                      </span>
                      {fingerprint.pattern_subtype && fingerprint.pattern_subtype !== 'unknown' && (
                        <span className="text-xs text-white0 dark:text-gray-400 capitalize">
                          {fingerprint.pattern_subtype.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-white0 dark:text-gray-400">
                      {fingerprint.pattern_confidence
                        ? `${(fingerprint.pattern_confidence * 100).toFixed(0)}%`
                        : ''}
                    </span>
                  </div>

                  {/* FBI/NCIC Codes */}
                  {(fingerprint.ncic_code || fingerprint.henry_value !== null) && (
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200 dark:border-zinc-700">
                      {fingerprint.ncic_code && (
                        <span className="inline-flex items-center px-2.5 py-1 text-xs font-mono bg-gray-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg">
                          NCIC: {fingerprint.ncic_code}
                        </span>
                      )}
                      {fingerprint.henry_value !== null && (
                        <span className="inline-flex items-center px-2.5 py-1 text-xs font-mono bg-gray-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg">
                          Henry: {fingerprint.henry_value}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Singular Points */}
                  {(fingerprint.core_count !== null || fingerprint.delta_count !== null) && (
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-zinc-700">
                      <div className="text-center p-3 bg-white dark:bg-zinc-800 rounded-xl">
                        <div className="text-2xl font-bold text-zinc-900 dark:text-white">{fingerprint.core_count ?? 0}</div>
                        <div className="text-xs text-white0 dark:text-gray-400">Core{fingerprint.core_count !== 1 ? 's' : ''}</div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-zinc-800 rounded-xl">
                        <div className="text-2xl font-bold text-zinc-900 dark:text-white">{fingerprint.delta_count ?? 0}</div>
                        <div className="text-xs text-white0 dark:text-gray-400">Delta{fingerprint.delta_count !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                  )}

                  {fingerprint.classification_rationale && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 border-l-2 border-cyan-400 pl-3 pt-3">
                      {fingerprint.classification_rationale}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Quality */}
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Quality Assessment</h3>
              {fingerprint.quality_score !== null ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`quality-badge ${getQualityColor(fingerprint.quality_score) === 'success' ? 'high' : getQualityColor(fingerprint.quality_score) === 'warning' ? 'medium' : 'low'}`}>
                      Score: {fingerprint.quality_score.toFixed(0)}/100
                    </span>
                  </div>

                  {/* Quality bar */}
                  <div className="progress-bar">
                    <div
                      className={`progress-fill progress-fill-${getQualityColor(fingerprint.quality_score)}`}
                      style={{ width: `${fingerprint.quality_score}%` }}
                    />
                  </div>

                  {fingerprint.quality_issues && fingerprint.quality_issues.length > 0 && (
                    <div className="space-y-2">
                      {fingerprint.quality_issues.map((issue, idx) => (
                        <div
                          key={idx}
                          className={`text-xs p-2.5 rounded-lg ${
                            issue.severity === 'high' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300' :
                            issue.severity === 'medium' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' :
                            'bg-gray-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          {issue.description}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-white0 dark:text-gray-400">Not assessed yet</p>
              )}
            </div>

            {/* Enhancement Results */}
            {fingerprint.processing_results && fingerprint.processing_results.length > 0 && (
              <div className="card p-4">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Enhancement Results</h3>
                <div className="space-y-2">
                  {fingerprint.processing_results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => setSelectedResult(result)}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                        selectedResult?.id === result.id
                          ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                          : 'border-gray-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-zinc-900 dark:text-white capitalize">
                            {result.enhancement_preset.replace('_', ' ')}
                          </span>
                          {result.enhancement_method === 'gemini' && (
                            <span className="badge badge-primary text-xs">AI</span>
                          )}
                          {result.enhancement_method === 'opencv' && (
                            <span className="badge badge-neutral text-xs">OpenCV</span>
                          )}
                        </div>
                        {result.is_primary && (
                          <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                        {result.quality_improvement !== null && (
                          <span className={result.quality_improvement >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                            {result.quality_improvement >= 0 ? '+' : ''}{result.quality_improvement.toFixed(1)} quality
                          </span>
                        )}
                        {result.artifact_risk_level && (
                          <span className={`
                            ${result.artifact_risk_level === 'high' ? 'text-rose-600 dark:text-rose-400' : ''}
                            ${result.artifact_risk_level === 'medium' ? 'text-amber-600 dark:text-amber-400' : ''}
                            ${result.artifact_risk_level === 'low' ? 'text-emerald-600 dark:text-emerald-400' : ''}
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
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">File Information</h3>
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-white0 dark:text-gray-400">Filename</dt>
                  <dd className="text-zinc-900 dark:text-white truncate max-w-[160px] font-medium" title={fingerprint.original_filename}>
                    {fingerprint.original_filename}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-white0 dark:text-gray-400">Dimensions</dt>
                  <dd className="text-zinc-900 dark:text-white">
                    {fingerprint.image_width}x{fingerprint.image_height}
                  </dd>
                </div>
                {fingerprint.dpi && (
                  <div className="flex justify-between">
                    <dt className="text-white0 dark:text-gray-400">DPI</dt>
                    <dd className="text-zinc-900 dark:text-white">{fingerprint.dpi}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-white0 dark:text-gray-400">Size</dt>
                  <dd className="text-zinc-900 dark:text-white">
                    {(fingerprint.file_size_bytes / 1024).toFixed(1)} KB
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-white0 dark:text-gray-400">Print Type</dt>
                  <dd className="text-zinc-900 dark:text-white capitalize">
                    {fingerprint.print_type.replace('_', ' ')}
                  </dd>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-zinc-700">
                  <dt className="text-white0 dark:text-gray-400">SHA-256</dt>
                  <dd className="text-zinc-700 dark:text-zinc-300 font-mono text-xs truncate max-w-[140px]" title={fingerprint.original_hash_sha256}>
                    {fingerprint.original_hash_sha256.substring(0, 16)}...
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Reprocess Modal */}
      {showReprocessModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-zinc-900/75 backdrop-blur-sm transition-opacity" onClick={() => setShowReprocessModal(false)} />

            <div className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 text-left shadow-elevated transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-cyan-100 dark:bg-cyan-900/50">
                    <ArrowPathIcon className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                      Reprocess Fingerprint
                    </h3>
                    <p className="text-sm text-white0 dark:text-gray-400">
                      Choose an enhancement method
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { id: 'auto', name: 'Auto (Recommended)', desc: 'AI when available, traditional fallback' },
                    { id: 'gemini', name: 'AI Enhancement', desc: 'Advanced AI reconstruction', badge: 'AI' },
                    { id: 'opencv', name: 'Traditional', desc: 'Classic Gabor filters & CLAHE' },
                  ].map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedEnhancementMethod === method.id
                          ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                          : 'border-gray-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="enhancementMethod"
                        value={method.id}
                        checked={selectedEnhancementMethod === method.id}
                        onChange={() => setSelectedEnhancementMethod(method.id as EnhancementMethod)}
                        className="mt-1 h-4 w-4 text-cyan-600 focus:ring-cyan-500"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-zinc-900 dark:text-white">{method.name}</span>
                          {method.badge && <span className="badge badge-primary text-xs">{method.badge}</span>}
                        </div>
                        <span className="text-xs text-white0 dark:text-gray-400">{method.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="px-6 py-4 bg-white dark:bg-zinc-800 flex flex-col sm:flex-row-reverse gap-3">
                <button
                  onClick={handleReprocess}
                  disabled={isReprocessing}
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  {isReprocessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Processing...
                    </>
                  ) : (
                    'Start Reprocessing'
                  )}
                </button>
                <button
                  onClick={() => setShowReprocessModal(false)}
                  disabled={isReprocessing}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
