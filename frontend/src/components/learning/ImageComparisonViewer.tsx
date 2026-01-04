import { useState } from 'react';
import type { ImageComparisonPuzzle } from '../../data/learningCases';

interface ImageComparisonViewerProps {
  data: ImageComparisonPuzzle;
  onComplete: (success: boolean) => void;
  hints?: string[];
}

export default function ImageComparisonViewer({ data, onComplete, hints }: ImageComparisonViewerProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<'match' | 'no-match' | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<'left' | 'right' | null>(null);

  const handleSubmit = () => {
    if (!selectedAnswer) return;
    setShowResult(true);
    const isCorrect = selectedAnswer === data.correctAnswer;

    setTimeout(() => {
      onComplete(isCorrect);
    }, 1500);
  };

  const isCorrect = selectedAnswer === data.correctAnswer;

  return (
    <div className="space-y-6">
      <p className="text-lg font-medium text-gray-900 dark:text-white">
        {data.question}
      </p>

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left image */}
        <div className="relative">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 text-center">
            {data.leftLabel || 'Evidence Print'}
          </p>
          <div
            className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-zoom-in border-2 border-gray-200 dark:border-gray-700"
            onClick={() => setZoomedImage('left')}
          >
            <img
              src={data.leftImage}
              alt={data.leftLabel || 'Left fingerprint'}
              className="w-full h-full object-contain"
            />
            {/* Highlight areas for minutiae */}
            {data.highlightAreas && zoomedImage !== 'left' && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {data.highlightAreas.map((area, idx) => (
                  <circle
                    key={idx}
                    cx={`${area.x}%`}
                    cy={`${area.y}%`}
                    r={area.radius}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    className="animate-pulse"
                  />
                ))}
              </svg>
            )}
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              Click to zoom
            </div>
          </div>
        </div>

        {/* Right image */}
        <div className="relative">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 text-center">
            {data.rightLabel || 'Known Print'}
          </p>
          <div
            className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-zoom-in border-2 border-gray-200 dark:border-gray-700"
            onClick={() => setZoomedImage('right')}
          >
            <img
              src={data.rightImage}
              alt={data.rightLabel || 'Right fingerprint'}
              className="w-full h-full object-contain"
            />
            {data.highlightAreas && zoomedImage !== 'right' && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {data.highlightAreas.map((area, idx) => (
                  <circle
                    key={idx}
                    cx={`${area.x}%`}
                    cy={`${area.y}%`}
                    r={area.radius}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    className="animate-pulse"
                  />
                ))}
              </svg>
            )}
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              Click to zoom
            </div>
          </div>
        </div>
      </div>

      {/* Answer selection */}
      <div className="flex gap-4 justify-center">
        <button
          onClick={() => !showResult && setSelectedAnswer('match')}
          disabled={showResult}
          className={`
            flex-1 max-w-[200px] py-4 px-6 rounded-lg font-medium transition-all
            border-2
            ${selectedAnswer === 'match'
              ? showResult
                ? isCorrect
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-primary-300 dark:hover:border-primary-600'
            }
            ${showResult ? 'cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className="flex flex-col items-center gap-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Match</span>
          </div>
        </button>

        <button
          onClick={() => !showResult && setSelectedAnswer('no-match')}
          disabled={showResult}
          className={`
            flex-1 max-w-[200px] py-4 px-6 rounded-lg font-medium transition-all
            border-2
            ${selectedAnswer === 'no-match'
              ? showResult
                ? isCorrect
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-primary-300 dark:hover:border-primary-600'
            }
            ${showResult ? 'cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className="flex flex-col items-center gap-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>No Match</span>
          </div>
        </button>
      </div>

      {/* Result feedback */}
      {showResult && (
        <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <>
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium text-green-700 dark:text-green-300">Correct!</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="font-medium text-red-700 dark:text-red-300">Not quite right</span>
              </>
            )}
          </div>
          {data.explanation && (
            <p className={`mt-2 text-sm ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {data.explanation}
            </p>
          )}
        </div>
      )}

      {/* Hints */}
      {hints && hints.length > 0 && !showResult && (
        <div className="mt-4">
          {showHint ? (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {hints[0]}
              </p>
            </div>
          ) : (
            <button
              onClick={() => setShowHint(true)}
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              Need a hint?
            </button>
          )}
        </div>
      )}

      {/* Submit button */}
      {!showResult && (
        <button
          onClick={handleSubmit}
          disabled={!selectedAnswer}
          className={`
            w-full py-3 rounded-lg font-medium transition-all
            ${selectedAnswer
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
            }
          `}
        >
          Submit Answer
        </button>
      )}

      {/* Zoom modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={zoomedImage === 'left' ? data.leftImage : data.rightImage}
              alt={zoomedImage === 'left' ? data.leftLabel : data.rightLabel}
              className="w-full h-full object-contain rounded-lg"
            />
            {data.highlightAreas && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {data.highlightAreas.map((area, idx) => (
                  <circle
                    key={idx}
                    cx={`${area.x}%`}
                    cy={`${area.y}%`}
                    r={area.radius * 1.5}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3"
                  />
                ))}
              </svg>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
