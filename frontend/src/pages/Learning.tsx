import { Link } from 'react-router-dom';
import {
  SparklesIcon,
  ClockIcon,
  TrophyIcon,
  PlayIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { learningCases, getTotalScenes, type Difficulty } from '../data/learningCases';
import { getAllLearningProgress } from '../hooks/useLearningProgress';

const difficultyColors: Record<Difficulty, string> = {
  beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const difficultyStars: Record<Difficulty, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

export default function Learning() {
  const allProgress = getAllLearningProgress();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTJ2Mmgydi0yem0tNiAwaDJ2MmgtMnYtMnptLTYgMGgydjJoLTJ2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-400/20 backdrop-blur-sm rounded-full border border-amber-400/40">
              <SparklesIcon className="h-4 w-4 text-amber-300" />
              <span className="text-sm font-semibold text-amber-200">Premium</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Interactive Learning</h1>
          <p className="text-white/80 max-w-xl">
            Solve forensic cases through immersive story-driven adventures. Learn about fingerprint
            analysis, evidence collection, and investigation techniques while having fun.
          </p>
        </div>
        {/* Decorative elements */}
        <div className="absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-4 top-4 h-24 w-24 rounded-full bg-amber-400/20 blur-2xl" />
      </div>

      {/* Cases Grid */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Available Cases</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {learningCases.map((caseStory) => {
            const progress = allProgress[caseStory.id];
            const totalScenes = getTotalScenes(caseStory);
            const completedScenes = progress?.completedScenes.length ?? 0;
            const progressPercent = progress ? Math.round((completedScenes / totalScenes) * 100) : 0;
            const hasStarted = !!progress;
            const isCompleted = progress?.isCompleted ?? false;

            return (
              <div
                key={caseStory.id}
                className="group relative bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-300 dark:hover:border-indigo-700"
              >
                {/* Case Cover */}
                <div className="relative h-40 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 overflow-hidden">
                  {/* Fingerprint pattern background */}
                  <div className="absolute inset-0 opacity-20">
                    <svg viewBox="0 0 200 200" className="h-full w-full">
                      <defs>
                        <pattern id="fingerprint-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                          <circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" strokeWidth="1" className="text-indigo-300" />
                          <circle cx="20" cy="20" r="10" fill="none" stroke="currentColor" strokeWidth="1" className="text-indigo-300" />
                          <circle cx="20" cy="20" r="5" fill="none" stroke="currentColor" strokeWidth="1" className="text-indigo-300" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#fingerprint-pattern)" />
                    </svg>
                  </div>
                  {/* Title overlay */}
                  <div className="absolute inset-0 flex items-end p-4">
                    <div>
                      <h3 className="text-xl font-bold text-white drop-shadow-lg">{caseStory.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColors[caseStory.difficulty]}`}>
                          {caseStory.difficulty.charAt(0).toUpperCase() + caseStory.difficulty.slice(1)}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`h-3 w-3 ${
                                i < difficultyStars[caseStory.difficulty]
                                  ? 'text-amber-400'
                                  : 'text-gray-500'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Completed badge */}
                  {isCompleted && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-green-500/90 backdrop-blur-sm rounded-full text-white text-xs font-medium">
                      <TrophyIcon className="h-3 w-3" />
                      Completed
                    </div>
                  )}
                </div>

                {/* Case Details */}
                <div className="p-4 space-y-4">
                  <p className="text-sm text-gray-600 dark:text-zinc-400 line-clamp-2">
                    {caseStory.description}
                  </p>

                  {/* Meta info */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-zinc-500">
                    <div className="flex items-center gap-1">
                      <ClockIcon className="h-4 w-4" />
                      {caseStory.estimatedTime}
                    </div>
                    <div className="flex items-center gap-1">
                      <TrophyIcon className="h-4 w-4" />
                      {caseStory.totalPoints} pts
                    </div>
                    {hasStarted && (
                      <div className="flex items-center gap-1 text-indigo-500">
                        <span>{progress.score} pts earned</span>
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  {hasStarted && !isCompleted && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-zinc-500">Progress</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium">{progressPercent}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Action button */}
                  <Link
                    to={`/learning/${caseStory.id}`}
                    className={`flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl font-medium transition-all duration-200 ${
                      isCompleted
                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300'
                        : hasStarted
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4" />
                        Replay
                      </>
                    ) : hasStarted ? (
                      <>
                        <PlayIcon className="h-4 w-4" />
                        Continue
                      </>
                    ) : (
                      <>
                        <PlayIcon className="h-4 w-4" />
                        Start Case
                      </>
                    )}
                  </Link>
                </div>
              </div>
            );
          })}

          {/* Coming Soon Card */}
          <div className="relative bg-gray-50 dark:bg-zinc-900/50 rounded-2xl border-2 border-dashed border-gray-300 dark:border-zinc-700 overflow-hidden">
            <div className="h-40 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center">
              <SparklesIcon className="h-12 w-12 text-gray-400 dark:text-zinc-600" />
            </div>
            <div className="p-4 text-center">
              <h3 className="text-lg font-semibold text-gray-500 dark:text-zinc-500">More Cases Coming</h3>
              <p className="text-sm text-gray-400 dark:text-zinc-600 mt-1">
                New forensic adventures are being developed
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Stats */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Learning Journey</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {Object.values(allProgress).filter(p => p.isCompleted).length}
            </div>
            <div className="text-xs text-gray-500 dark:text-zinc-500 mt-1">Cases Completed</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {Object.values(allProgress).reduce((acc, p) => acc + p.score, 0)}
            </div>
            <div className="text-xs text-gray-500 dark:text-zinc-500 mt-1">Total Points</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
            <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
              {Object.keys(allProgress).length}
            </div>
            <div className="text-xs text-gray-500 dark:text-zinc-500 mt-1">Cases Started</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {learningCases.length}
            </div>
            <div className="text-xs text-gray-500 dark:text-zinc-500 mt-1">Total Available</div>
          </div>
        </div>
      </div>
    </div>
  );
}
