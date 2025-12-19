import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  ChevronRightIcon,
  FingerPrintIcon,
  CloudArrowUpIcon,
  PlayIcon,
  CameraIcon,
  XMarkIcon,
  TrashIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { exhibitsApi, fingerprintsApi, casesApi } from '../services/api';
import type { Exhibit, Fingerprint, Case, EnhancementMethod } from '../types';
import toast from 'react-hot-toast';

export default function ExhibitDetail() {
  const { exhibitId } = useParams<{ exhibitId: string }>();
  const [exhibit, setExhibit] = useState<Exhibit | null>(null);
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [fingerprints, setFingerprints] = useState<Fingerprint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoRefDesktop = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  // Enhancement method state
  const [selectedEnhancementMethod, setSelectedEnhancementMethod] = useState<EnhancementMethod>('auto');
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processingFingerprintId, setProcessingFingerprintId] = useState<string | null>(null);
  const [isProcessingInProgress, setIsProcessingInProgress] = useState(false);

  useEffect(() => {
    if (exhibitId) {
      fetchData();
    }
  }, [exhibitId]);

  async function fetchData() {
    setIsLoading(true);
    try {
      const exhibitResponse = await exhibitsApi.get(exhibitId!);
      setExhibit(exhibitResponse);
      setFingerprints((exhibitResponse as any).fingerprints || []);

      // Fetch case details
      const caseResponse = await casesApi.get(exhibitResponse.case_id);
      setCaseData(caseResponse);
    } catch (error) {
      toast.error('Failed to load exhibit details');
    } finally {
      setIsLoading(false);
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const totalFiles = acceptedFiles.length;
      let uploadedCount = 0;

      for (const file of acceptedFiles) {
        await fingerprintsApi.upload(exhibitId!, file);
        uploadedCount++;
        setUploadProgress(Math.round((uploadedCount / totalFiles) * 100));
      }

      toast.success(`Uploaded ${totalFiles} fingerprint(s)`);
      fetchData();
    } catch (error) {
      toast.error('Failed to upload fingerprints');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [exhibitId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.tiff', '.tif', '.bmp'],
    },
    disabled: isUploading,
  });

  // Effect to attach stream to video element when both are ready
  useEffect(() => {
    if (isCameraOpen && cameraStream) {
      setIsCameraReady(false);

      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        // Attach to mobile video ref
        if (videoRef.current) {
          videoRef.current.srcObject = cameraStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().then(() => {
              setIsCameraReady(true);
            }).catch(err => {
              console.error('Error playing mobile video:', err);
            });
          };
        }

        // Attach to desktop video ref
        if (videoRefDesktop.current) {
          videoRefDesktop.current.srcObject = cameraStream;
          videoRefDesktop.current.onloadedmetadata = () => {
            videoRefDesktop.current?.play().then(() => {
              setIsCameraReady(true);
            }).catch(err => {
              console.error('Error playing desktop video:', err);
            });
          };
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isCameraOpen, cameraStream]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Camera functions
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      setCameraStream(stream);
      setIsCameraOpen(true);
    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('Unable to access camera. Please check permissions.');
    }
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
    setCapturedImage(null);
    setIsCameraReady(false);
  };

  const switchCamera = async () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);

    // Close current stream and reopen with new facing mode
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: newMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      setCameraStream(stream);
    } catch (error) {
      console.error('Camera switch error:', error);
      toast.error('Unable to switch camera');
    }
  };

  const capturePhoto = () => {
    // Use whichever video element is active (mobile or desktop)
    const video = videoRef.current?.srcObject ? videoRef.current : videoRefDesktop.current;

    if (video && canvasRef.current && video.videoWidth > 0) {
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/png');
        setCapturedImage(imageData);
      }
    } else {
      toast.error('Camera not ready yet. Please wait.');
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const uploadCapturedPhoto = async () => {
    if (!capturedImage) return;

    setIsUploading(true);
    try {
      // Convert base64 to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const file = new File([blob], `camera_capture_${Date.now()}.png`, { type: 'image/png' });

      await fingerprintsApi.upload(exhibitId!, file);
      toast.success('Captured image uploaded successfully');
      closeCamera();
      fetchData();
    } catch (error) {
      toast.error('Failed to upload captured image');
    } finally {
      setIsUploading(false);
    }
  };

  const openProcessModal = (fingerprintId: string | null = null) => {
    setProcessingFingerprintId(fingerprintId);
    setShowProcessModal(true);
  };

  const handleProcessFingerprint = async () => {
    if (!processingFingerprintId && fingerprints.filter(fp => fp.status === 'pending').length === 0) {
      toast.error('No pending fingerprints to process');
      return;
    }

    setIsProcessingInProgress(true);
    try {
      if (processingFingerprintId) {
        // Process single fingerprint
        await fingerprintsApi.process(processingFingerprintId, {
          enhancement_method: selectedEnhancementMethod,
        });
        toast.success('Processing started');
      } else {
        // Process all pending
        const pendingPrints = fingerprints.filter(fp => fp.status === 'pending');
        for (const fp of pendingPrints) {
          await fingerprintsApi.process(fp.id, {
            enhancement_method: selectedEnhancementMethod,
          });
        }
        toast.success(`Started processing ${pendingPrints.length} fingerprint(s)`);
      }
      setShowProcessModal(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to start processing');
    } finally {
      setIsProcessingInProgress(false);
    }
  };

  const handleProcessAll = () => {
    openProcessModal(null);
  };

  const handleDeleteFingerprint = async (fingerprintId: string, filename: string) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await fingerprintsApi.delete(fingerprintId);
      toast.success('Fingerprint deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete fingerprint');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 dark:bg-zinc-700 text-gray-800 dark:text-zinc-200';
      case 'queued': return 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300';
      case 'processing': return 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300';
      case 'completed': return 'bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-300';
      case 'failed': return 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300';
      default: return 'bg-gray-100 dark:bg-zinc-700 text-gray-800 dark:text-zinc-200';
    }
  };

  const getQualityColor = (score: number | null) => {
    if (score === null) return '';
    if (score >= 70) return 'text-green-600 dark:text-green-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  if (!exhibit) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Exhibit not found</h3>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb - Responsive */}
      <nav className="flex mb-4 overflow-x-auto scrollbar-hide" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-1 sm:space-x-2 whitespace-nowrap">
          <li>
            <Link to="/cases" className="text-gray-400 dark:text-zinc-500 hover:text-gray-500 dark:hover:text-zinc-400 text-xs sm:text-sm">Cases</Link>
          </li>
          <ChevronRightIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 dark:text-zinc-500 flex-shrink-0" />
          <li>
            <Link to={`/cases/${caseData?.id}`} className="text-gray-400 dark:text-zinc-500 hover:text-gray-500 dark:hover:text-zinc-400 text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">
              {caseData?.case_number}
            </Link>
          </li>
          <ChevronRightIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 dark:text-zinc-500 flex-shrink-0" />
          <li className="text-xs sm:text-sm font-medium text-gray-500 dark:text-zinc-400 truncate">{exhibit.exhibit_number}</li>
        </ol>
      </nav>

      {/* Exhibit Header - Mobile Optimized */}
      <div className="bg-white dark:bg-zinc-900 shadow dark:shadow-zinc-900/50 rounded-lg mb-4 sm:mb-6 border border-gray-200 dark:border-zinc-800">
        <div className="px-4 py-4 sm:px-6 sm:py-5">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{exhibit.exhibit_number}</h1>
          {exhibit.description && (
            <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400 line-clamp-2 sm:line-clamp-none">{exhibit.description}</p>
          )}
          <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 text-sm">
            {exhibit.location_collected && (
              <div>
                <dt className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400">Location</dt>
                <dd className="text-sm text-gray-900 dark:text-white truncate">{exhibit.location_collected}</dd>
              </div>
            )}
            {exhibit.collector_name && (
              <div>
                <dt className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400">Collector</dt>
                <dd className="text-sm text-gray-900 dark:text-white truncate">{exhibit.collector_name}</dd>
              </div>
            )}
            {exhibit.collection_date && (
              <div>
                <dt className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400">Date</dt>
                <dd className="text-sm text-gray-900 dark:text-white">
                  {new Date(exhibit.collection_date).toLocaleDateString()}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400">Fingerprints</dt>
              <dd className="text-sm text-gray-900 dark:text-white">{fingerprints.length}</dd>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Zone - Mobile Optimized */}
      <div className="mb-4 sm:mb-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* File Upload Option */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-4 sm:p-6 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-gray-300 dark:border-zinc-700 hover:border-indigo-400 dark:hover:border-indigo-500 active:bg-gray-50 dark:active:bg-zinc-800'}
              ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            <CloudArrowUpIcon className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-gray-400 dark:text-zinc-500" />
            {isUploading && !isCameraOpen ? (
              <div className="mt-2 sm:mt-3">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400">Uploading... {uploadProgress}%</p>
                <div className="mt-2 w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-1.5 sm:h-2">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <p className="mt-2 text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Upload</p>
                <p className="mt-0.5 sm:mt-1 text-xs text-gray-500 dark:text-zinc-400 hidden sm:block">
                  {isDragActive ? 'Drop images here' : 'Drag & drop or tap'}
                </p>
              </>
            )}
          </div>

          {/* Camera Capture Option */}
          <div
            onClick={openCamera}
            className={`border-2 border-dashed rounded-xl p-4 sm:p-6 text-center cursor-pointer transition-colors
              border-gray-300 dark:border-zinc-700 hover:border-indigo-400 dark:hover:border-indigo-500 active:bg-indigo-50 dark:active:bg-indigo-500/10
              ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <CameraIcon className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-gray-400 dark:text-zinc-500" />
            <p className="mt-2 text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Camera</p>
            <p className="mt-0.5 sm:mt-1 text-xs text-gray-500 dark:text-zinc-400 hidden sm:block">
              Capture directly
            </p>
          </div>
        </div>
      </div>

      {/* Camera Modal - Full Screen on Mobile */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black">
          {/* Mobile: Full screen camera */}
          <div className="h-full flex flex-col sm:hidden">
            {/* Camera View */}
            <div className="flex-1 relative bg-black">
              {!capturedImage ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    webkit-playsinline="true"
                    className="w-full h-full object-cover"
                    style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                  />
                  {/* Loading indicator while camera initializes */}
                  {!isCameraReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto"></div>
                        <p className="mt-3 text-white text-sm">Starting camera...</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <img
                  src={capturedImage}
                  alt="Captured fingerprint"
                  className="w-full h-full object-contain bg-black"
                />
              )}
              <canvas ref={canvasRef} className="hidden" />

              {/* Top controls */}
              <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
                <button
                  onClick={closeCamera}
                  className="p-2 rounded-full bg-black/30 text-white min-h-touch min-w-touch flex items-center justify-center"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
                {!capturedImage && (
                  <button
                    onClick={switchCamera}
                    className="p-2 rounded-full bg-black/30 text-white min-h-touch min-w-touch flex items-center justify-center"
                  >
                    <ArrowPathIcon className="h-6 w-6" />
                  </button>
                )}
              </div>
            </div>

            {/* Bottom controls */}
            <div className="bg-black px-6 py-6 pb-safe-bottom">
              {!capturedImage ? (
                <div className="flex justify-center">
                  <button
                    onClick={capturePhoto}
                    className="w-20 h-20 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <div className="w-16 h-16 rounded-full border-4 border-gray-900" />
                  </button>
                </div>
              ) : (
                <div className="flex justify-center space-x-6">
                  <button
                    onClick={retakePhoto}
                    className="px-6 py-3 text-sm font-medium text-white bg-gray-700 rounded-lg min-h-touch"
                  >
                    Retake
                  </button>
                  <button
                    onClick={uploadCapturedPhoto}
                    disabled={isUploading}
                    className="px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-lg min-h-touch disabled:opacity-50 flex items-center"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Uploading
                      </>
                    ) : (
                      'Use Photo'
                    )}
                  </button>
                </div>
              )}
              <p className="mt-4 text-xs text-gray-400 text-center">
                Position fingerprint in center with good lighting
              </p>
            </div>
          </div>

          {/* Desktop: Modal layout */}
          <div className="hidden sm:flex min-h-full items-center justify-center p-4 bg-black bg-opacity-75">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-3xl w-full overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-zinc-800">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Capture Fingerprint</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={switchCamera}
                    className="p-2 text-gray-400 dark:text-zinc-500 hover:text-gray-500 dark:hover:text-zinc-400 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
                    title="Switch camera"
                  >
                    <ArrowPathIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={closeCamera}
                    className="p-2 text-gray-400 dark:text-zinc-500 hover:text-gray-500 dark:hover:text-zinc-400 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Camera View / Preview */}
              <div className="relative aspect-video bg-black">
                {!capturedImage ? (
                  <>
                    <video
                      ref={videoRefDesktop}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-contain"
                      style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                    />
                    {/* Loading indicator */}
                    {!isCameraReady && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto"></div>
                          <p className="mt-3 text-white text-sm">Starting camera...</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <img
                    src={capturedImage}
                    alt="Captured fingerprint"
                    className="w-full h-full object-contain"
                  />
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Camera Controls */}
              <div className="px-4 py-4 bg-gray-50 dark:bg-zinc-800 flex justify-center space-x-4">
                {!capturedImage ? (
                  <>
                    <button
                      onClick={closeCamera}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-200 bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={capturePhoto}
                      className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-500 flex items-center"
                    >
                      <CameraIcon className="h-5 w-5 mr-2" />
                      Capture
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={retakePhoto}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-200 bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-600"
                    >
                      Retake
                    </button>
                    <button
                      onClick={uploadCapturedPhoto}
                      disabled={isUploading}
                      className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-500 flex items-center disabled:opacity-50"
                    >
                      {isUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                          Use Photo
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>

              {/* Instructions */}
              <div className="px-4 py-3 bg-gray-100 dark:bg-zinc-800/50 border-t border-gray-200 dark:border-zinc-800">
                <p className="text-xs text-gray-500 dark:text-zinc-400 text-center">
                  Position the fingerprint in the center of the frame. Ensure good lighting and focus.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fingerprints List */}
      <div className="bg-white dark:bg-zinc-900 shadow dark:shadow-zinc-900/50 rounded-lg border border-gray-200 dark:border-zinc-800">
        <div className="px-4 py-4 sm:px-6 sm:py-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-gray-200 dark:border-zinc-800">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">Fingerprints</h2>
          {fingerprints.some(fp => fp.status === 'pending') && (
            <button
              onClick={handleProcessAll}
              className="inline-flex items-center justify-center rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500 active:bg-cyan-700 min-h-touch w-full sm:w-auto"
            >
              <PlayIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
              Process All Pending
            </button>
          )}
        </div>

        {fingerprints.length === 0 ? (
          <div className="text-center py-12 px-4">
            <FingerPrintIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-zinc-600" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No fingerprints</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
              Upload or capture fingerprint images to begin analysis.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4">
            {fingerprints.map((fp) => (
              <div
                key={fp.id}
                className="relative bg-gray-50 dark:bg-zinc-800 rounded-lg overflow-hidden hover:shadow-md dark:hover:shadow-zinc-900/50 active:shadow-inner transition-shadow"
              >
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDeleteFingerprint(fp.id, fp.original_filename);
                  }}
                  className="absolute top-2 right-2 z-10 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 active:bg-red-800 shadow-md transition-colors min-h-touch min-w-touch flex items-center justify-center"
                  title="Delete fingerprint"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>

                <Link to={`/fingerprints/${fp.id}`} className="block">
                  <div className="aspect-square bg-gray-200 dark:bg-zinc-700 flex items-center justify-center">
                    {fp.original_url ? (
                      <img
                        src={fp.original_url}
                        alt={fp.original_filename}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <FingerPrintIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 dark:text-zinc-500" />
                    )}
                  </div>
                  <div className="p-2 sm:p-3">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                      {fp.original_filename}
                    </p>
                    <div className="mt-1.5 sm:mt-2 flex items-center justify-between flex-wrap gap-1">
                      <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(fp.status)}`}>
                        {fp.status}
                      </span>
                      {fp.quality_score !== null && (
                        <span className={`text-xs font-medium ${getQualityColor(fp.quality_score)}`}>
                          Q: {fp.quality_score.toFixed(0)}
                        </span>
                      )}
                    </div>
                    {fp.pattern_type && (
                      <div className="mt-1.5 sm:mt-2">
                        <span className="pattern-badge text-xs py-0.5 px-1.5 sm:px-2">
                          {fp.pattern_type.replace('_', ' ')}
                          {fp.pattern_confidence && (
                            <span className="ml-1 opacity-75">
                              ({(fp.pattern_confidence * 100).toFixed(0)}%)
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    {fp.status === 'pending' && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          openProcessModal(fp.id);
                        }}
                        className="mt-2 w-full inline-flex justify-center items-center rounded-lg bg-cyan-600 px-2 py-2 text-xs font-medium text-white hover:bg-cyan-500 active:bg-cyan-700 min-h-touch"
                      >
                        <PlayIcon className="h-3 w-3 mr-1" />
                        Process
                      </button>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Process Modal with Enhancement Method Selection */}
      {showProcessModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500/75 dark:bg-zinc-950/80 transition-opacity" onClick={() => setShowProcessModal(false)} />

            <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-zinc-900 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white dark:bg-zinc-900 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-500/20 sm:mx-0 sm:h-10 sm:w-10">
                    <PlayIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
                    <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                      {processingFingerprintId ? 'Process Fingerprint' : `Process All Pending (${fingerprints.filter(fp => fp.status === 'pending').length})`}
                    </h3>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                        Enhancement Method
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-start p-3 border border-gray-200 dark:border-zinc-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                          <input
                            type="radio"
                            name="enhancementMethod"
                            value="auto"
                            checked={selectedEnhancementMethod === 'auto'}
                            onChange={() => setSelectedEnhancementMethod('auto')}
                            className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="ml-3">
                            <span className="block text-sm font-medium text-gray-900 dark:text-white">Auto (Recommended)</span>
                            <span className="block text-xs text-gray-500 dark:text-zinc-400">Uses AI enhancement when available, falls back to traditional methods</span>
                          </div>
                        </label>

                        <label className="flex items-start p-3 border border-gray-200 dark:border-zinc-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                          <input
                            type="radio"
                            name="enhancementMethod"
                            value="gemini"
                            checked={selectedEnhancementMethod === 'gemini'}
                            onChange={() => setSelectedEnhancementMethod('gemini')}
                            className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="ml-3">
                            <span className="block text-sm font-medium text-gray-900 dark:text-white">
                              AI Enhancement (Gemini)
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300">
                                AI
                              </span>
                            </span>
                            <span className="block text-xs text-gray-500 dark:text-zinc-400">Advanced AI-powered reconstruction for smudged or damaged prints</span>
                          </div>
                        </label>

                        <label className="flex items-start p-3 border border-gray-200 dark:border-zinc-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                          <input
                            type="radio"
                            name="enhancementMethod"
                            value="opencv"
                            checked={selectedEnhancementMethod === 'opencv'}
                            onChange={() => setSelectedEnhancementMethod('opencv')}
                            className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="ml-3">
                            <span className="block text-sm font-medium text-gray-900 dark:text-white">Traditional (OpenCV)</span>
                            <span className="block text-xs text-gray-500 dark:text-zinc-400">Classic image processing algorithms (Gabor filters, CLAHE)</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-zinc-800 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={handleProcessFingerprint}
                  disabled={isProcessingInProgress}
                  className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto disabled:opacity-50"
                >
                  {isProcessingInProgress ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <PlayIcon className="h-4 w-4 mr-2" />
                      Start Processing
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowProcessModal(false)}
                  disabled={isProcessingInProgress}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-zinc-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-600 sm:mt-0 sm:w-auto disabled:opacity-50"
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
