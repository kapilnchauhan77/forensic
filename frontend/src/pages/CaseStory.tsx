import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  TrophyIcon,
  LightBulbIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';
import {
  getCaseById,
  getSceneById,
  getFirstScene,
  getTotalScenes,
  type Scene,
  type Chapter,
  type NarrativeContent,
  type ChoiceContent,
  type PuzzleContent,
  type InfoContent,
  type PatternMatchPuzzle,
  type EvidenceSelectPuzzle,
  type SequencePuzzle,
} from '../data/learningCases';
import { useLearningProgress } from '../hooks/useLearningProgress';

export default function CaseStory() {
  const { caseId } = useParams<{ caseId: string }>();

  const caseStory = caseId ? getCaseById(caseId) : undefined;
  const { progress, saveProgress, initializeProgress, resetProgress } = useLearningProgress(
    caseId || ''
  );

  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [showFeedback, setShowFeedback] = useState<{ message: string; isCorrect: boolean } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Initialize or restore progress
  useEffect(() => {
    if (!caseStory) return;

    if (progress) {
      // Restore position
      const found = getSceneById(caseStory, progress.currentScene);
      if (found) {
        setCurrentChapter(found.chapter);
        setCurrentScene(found.scene);
        setIsCompleted(progress.isCompleted);
      }
    } else {
      // Start fresh
      const first = getFirstScene(caseStory);
      if (first) {
        initializeProgress(first.chapter.id, first.scene.id);
        setCurrentChapter(first.chapter);
        setCurrentScene(first.scene);
      }
    }
  }, [caseStory, progress, initializeProgress]);

  const goToScene = useCallback(
    (sceneId: string) => {
      if (!caseStory) return;

      if (sceneId === 'end') {
        // Case completed
        saveProgress({ isCompleted: true });
        setIsCompleted(true);
        return;
      }

      const found = getSceneById(caseStory, sceneId);
      if (found) {
        setCurrentChapter(found.chapter);
        setCurrentScene(found.scene);
        setShowFeedback(null);
        setShowHint(false);

        // Mark scene as completed and save position
        const completedScenes = progress?.completedScenes || [];
        if (!completedScenes.includes(found.scene.id)) {
          completedScenes.push(found.scene.id);
        }
        saveProgress({
          currentChapter: found.chapter.id,
          currentScene: found.scene.id,
          completedScenes,
        });
      }
    },
    [caseStory, progress, saveProgress]
  );

  const addPoints = useCallback(
    (points: number) => {
      const currentScore = progress?.score || 0;
      saveProgress({ score: currentScore + points });
    },
    [progress, saveProgress]
  );

  const handleRestart = () => {
    resetProgress();
    if (caseStory) {
      const first = getFirstScene(caseStory);
      if (first) {
        initializeProgress(first.chapter.id, first.scene.id);
        setCurrentChapter(first.chapter);
        setCurrentScene(first.scene);
        setIsCompleted(false);
      }
    }
  };

  if (!caseStory) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Case not found</h2>
        <Link to="/learning" className="text-indigo-600 dark:text-indigo-400 hover:underline mt-2 inline-block">
          Back to Learning
        </Link>
      </div>
    );
  }

  if (!currentScene || !currentChapter) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const totalScenes = getTotalScenes(caseStory);
  const completedCount = progress?.completedScenes.length || 0;
  const progressPercent = Math.round((completedCount / totalScenes) * 100);

  // Completion Screen
  if (isCompleted) {
    const finalScore = progress?.score || 0;
    const maxScore = caseStory.totalPoints;
    const scorePercent = Math.round((finalScore / maxScore) * 100);

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-8 text-white text-center">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-white/20 mb-6">
            <TrophyIcon className="h-10 w-10 text-amber-300" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Case Solved!</h1>
          <p className="text-white/80 mb-6">You've completed "{caseStory.title}"</p>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
            <div className="text-5xl font-bold mb-2">{finalScore}</div>
            <div className="text-sm text-white/70">out of {maxScore} points</div>
            <div className="mt-4 h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full"
                style={{ width: `${scorePercent}%` }}
              />
            </div>
            <div className="mt-2 text-sm">
              {scorePercent >= 90 ? 'Excellent!' : scorePercent >= 70 ? 'Great job!' : scorePercent >= 50 ? 'Good effort!' : 'Keep practicing!'}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRestart}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-medium transition-colors"
            >
              <ArrowPathIcon className="h-5 w-5" />
              Play Again
            </button>
            <Link
              to="/learning"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-indigo-600 hover:bg-white/90 rounded-xl font-medium transition-colors"
            >
              More Cases
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/learning"
          className="flex items-center gap-2 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span className="hidden sm:inline">Exit Case</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <TrophyIcon className="h-5 w-5 text-amber-500" />
            <span className="font-semibold text-gray-900 dark:text-white">{progress?.score || 0}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-gray-900 dark:text-white">{currentChapter.title}</span>
          <span className="text-gray-500 dark:text-zinc-400">{progressPercent}% complete</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Scene Content */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
        {currentScene.type === 'narrative' && (
          <NarrativeScene
            content={currentScene.content as NarrativeContent}
            onContinue={() => goToScene((currentScene.content as NarrativeContent).nextScene)}
          />
        )}

        {currentScene.type === 'choice' && (
          <ChoiceScene
            content={currentScene.content as ChoiceContent}
            showFeedback={showFeedback}
            onChoice={(option) => {
              if (option.points) addPoints(option.points);
              if (option.feedback) {
                setShowFeedback({ message: option.feedback, isCorrect: true });
                setTimeout(() => goToScene(option.nextScene), 1500);
              } else {
                goToScene(option.nextScene);
              }
            }}
          />
        )}

        {currentScene.type === 'puzzle' && (
          <PuzzleScene
            content={currentScene.content as PuzzleContent}
            showHint={showHint}
            onShowHint={() => setShowHint(true)}
            onSuccess={() => {
              addPoints((currentScene.content as PuzzleContent).points);
              setShowFeedback({ message: 'Correct!', isCorrect: true });
              setTimeout(() => goToScene((currentScene.content as PuzzleContent).successScene), 1500);
            }}
            onFail={() => {
              setShowFeedback({ message: 'Not quite right. Try again!', isCorrect: false });
              setTimeout(() => {
                setShowFeedback(null);
                goToScene((currentScene.content as PuzzleContent).failScene);
              }, 1500);
            }}
          />
        )}

        {currentScene.type === 'info' && (
          <InfoScene
            content={currentScene.content as InfoContent}
            onContinue={() => goToScene((currentScene.content as InfoContent).nextScene)}
          />
        )}

        {/* Feedback Toast */}
        {showFeedback && (
          <div
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in ${
              showFeedback.isCorrect
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {showFeedback.isCorrect ? (
              <CheckCircleIcon className="h-5 w-5" />
            ) : (
              <XCircleIcon className="h-5 w-5" />
            )}
            {showFeedback.message}
          </div>
        )}
      </div>
    </div>
  );
}

// Narrative Scene Component
function NarrativeScene({
  content,
  onContinue,
}: {
  content: NarrativeContent;
  onContinue: () => void;
}) {
  return (
    <div className="p-6 space-y-6">
      {content.speaker && (
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
            {content.speaker.charAt(0)}
          </div>
          <span className="font-semibold text-gray-900 dark:text-white">{content.speaker}</span>
        </div>
      )}
      <p className="text-lg text-gray-700 dark:text-zinc-300 leading-relaxed">{content.text}</p>
      <button
        onClick={onContinue}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
      >
        Continue
      </button>
    </div>
  );
}

// Choice Scene Component
function ChoiceScene({
  content,
  showFeedback,
  onChoice,
}: {
  content: ChoiceContent;
  showFeedback: { message: string; isCorrect: boolean } | null;
  onChoice: (option: ChoiceContent['options'][0]) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="p-6 space-y-6">
      <p className="text-lg text-gray-900 dark:text-white font-medium">{content.text}</p>
      <div className="space-y-3">
        {content.options.map((option) => (
          <button
            key={option.id}
            onClick={() => {
              if (!showFeedback) {
                setSelectedId(option.id);
                onChoice(option);
              }
            }}
            disabled={!!showFeedback}
            className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${
              selectedId === option.id
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-gray-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-zinc-800'
            } ${showFeedback ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <span className="text-gray-900 dark:text-white">{option.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Puzzle Scene Component
function PuzzleScene({
  content,
  showHint,
  onShowHint,
  onSuccess,
  onFail,
}: {
  content: PuzzleContent;
  showHint: boolean;
  onShowHint: () => void;
  onSuccess: () => void;
  onFail: () => void;
}) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <SparklesIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Puzzle</h3>
          <p className="text-gray-600 dark:text-zinc-400 mt-1">{content.instruction}</p>
        </div>
      </div>

      {/* Render puzzle based on type */}
      {content.data.type === 'pattern-match' && (
        <PatternMatchPuzzleComponent
          data={content.data as PatternMatchPuzzle}
          onSuccess={onSuccess}
          onFail={onFail}
        />
      )}

      {content.data.type === 'evidence-select' && (
        <EvidenceSelectPuzzleComponent
          data={content.data as EvidenceSelectPuzzle}
          onSuccess={onSuccess}
          onFail={onFail}
        />
      )}

      {content.data.type === 'sequence' && (
        <SequencePuzzleComponent
          data={content.data as SequencePuzzle}
          onSuccess={onSuccess}
          onFail={onFail}
        />
      )}

      {/* Hint */}
      {content.hints && content.hints.length > 0 && (
        <div className="pt-4 border-t border-gray-200 dark:border-zinc-800">
          {showHint ? (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <LightBulbIcon className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-200">{content.hints[0]}</p>
            </div>
          ) : (
            <button
              onClick={onShowHint}
              className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
              <LightBulbIcon className="h-4 w-4" />
              Need a hint?
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Pattern Match Puzzle
function PatternMatchPuzzleComponent({
  data,
  onSuccess,
  onFail,
}: {
  data: PatternMatchPuzzle;
  onSuccess: () => void;
  onFail: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSubmit = () => {
    if (selected === data.correctId) {
      onSuccess();
    } else {
      onFail();
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-900 dark:text-white font-medium">{data.question}</p>
      <div className="grid grid-cols-2 gap-3">
        {data.options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setSelected(opt.id)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              selected === opt.id
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-gray-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-700'
            }`}
          >
            <span className="text-sm font-medium text-gray-900 dark:text-white">{opt.label}</span>
          </button>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        disabled={!selected}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-zinc-700 text-white font-medium rounded-xl transition-colors disabled:cursor-not-allowed"
      >
        Submit Answer
      </button>
    </div>
  );
}

// Evidence Select Puzzle
function EvidenceSelectPuzzleComponent({
  data,
  onSuccess,
  onFail,
}: {
  data: EvidenceSelectPuzzle;
  onSuccess: () => void;
  onFail: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    const newSet = new Set(selected);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelected(newSet);
  };

  const handleSubmit = () => {
    const relevantItems = data.items.filter((item) => item.isRelevant);
    const correctIds = new Set(relevantItems.map((item) => item.id));

    // Check if selected matches exactly the relevant items
    const isCorrect =
      selected.size === correctIds.size &&
      Array.from(selected).every((id) => correctIds.has(id));

    if (isCorrect) {
      onSuccess();
    } else {
      onFail();
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-900 dark:text-white font-medium">{data.question}</p>
      <div className="space-y-2">
        {data.items.map((item) => (
          <button
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
              selected.has(item.id)
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-gray-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-700'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex-shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                  selected.has(item.id)
                    ? 'border-indigo-500 bg-indigo-500'
                    : 'border-gray-300 dark:border-zinc-600'
                }`}
              >
                {selected.has(item.id) && (
                  <CheckCircleIcon className="h-4 w-4 text-white" />
                )}
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">{item.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        disabled={selected.size === 0}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-zinc-700 text-white font-medium rounded-xl transition-colors disabled:cursor-not-allowed"
      >
        Submit Answer
      </button>
    </div>
  );
}

// Sequence Puzzle
function SequencePuzzleComponent({
  data,
  onSuccess,
  onFail,
}: {
  data: SequencePuzzle;
  onSuccess: () => void;
  onFail: () => void;
}) {
  const [order, setOrder] = useState<string[]>([]);
  const availableSteps = data.steps.filter((step) => !order.includes(step.id));

  const addToOrder = (id: string) => {
    setOrder([...order, id]);
  };

  const removeFromOrder = (index: number) => {
    const newOrder = [...order];
    newOrder.splice(index, 1);
    setOrder(newOrder);
  };

  const handleSubmit = () => {
    const correctOrder = data.steps
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((s) => s.id);

    const isCorrect = order.length === correctOrder.length &&
      order.every((id, idx) => id === correctOrder[idx]);

    if (isCorrect) {
      onSuccess();
    } else {
      onFail();
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-900 dark:text-white font-medium">{data.question}</p>

      {/* Selected order */}
      <div className="space-y-2">
        <p className="text-sm text-gray-500 dark:text-zinc-500">Your order (click to remove):</p>
        <div className="min-h-[60px] p-3 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl">
          {order.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-600 text-center py-2">
              Click items below to add them in order
            </p>
          ) : (
            <div className="space-y-2">
              {order.map((id, idx) => {
                const step = data.steps.find((s) => s.id === id);
                return (
                  <button
                    key={id}
                    onClick={() => removeFromOrder(idx)}
                    className="w-full flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-left hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                  >
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-500 text-white text-sm font-medium flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-gray-900 dark:text-white">{step?.text}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Available steps */}
      {availableSteps.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-zinc-500">Available steps:</p>
          <div className="space-y-2">
            {availableSteps.map((step) => (
              <button
                key={step.id}
                onClick={() => addToOrder(step.id)}
                className="w-full p-3 text-left border-2 border-gray-200 dark:border-zinc-700 rounded-lg hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all"
              >
                <span className="text-gray-900 dark:text-white">{step.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={order.length !== data.steps.length}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-zinc-700 text-white font-medium rounded-xl transition-colors disabled:cursor-not-allowed"
      >
        Submit Answer
      </button>
    </div>
  );
}

// Info Scene Component
function InfoScene({
  content,
  onContinue,
}: {
  content: InfoContent;
  onContinue: () => void;
}) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
          <InformationCircleIcon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{content.title}</h3>
        </div>
      </div>

      <p className="text-gray-700 dark:text-zinc-300 leading-relaxed">{content.text}</p>

      {content.bulletPoints && content.bulletPoints.length > 0 && (
        <ul className="space-y-3">
          {content.bulletPoints.map((point, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <CheckCircleIcon className="h-5 w-5 text-teal-500 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-zinc-300">{point}</span>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={onContinue}
        className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors"
      >
        Got it!
      </button>
    </div>
  );
}
