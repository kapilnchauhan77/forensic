import { useState, useMemo } from 'react';
import {
  PuzzlePieceIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

interface QuizQuestion {
  id: number;
  question: string;
  questionType?: 'text' | 'image-identify' | 'image-compare';
  image?: string;
  imageAlt?: string;
  options: string[];
  optionImages?: string[];
  correctAnswer: number;
  explanation: string;
  explanationImage?: string;
}

const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "What percentage of the population has loop fingerprint patterns?",
    options: ["5-10%", "30-35%", "60-65%", "80-85%"],
    correctAnswer: 2,
    explanation: "Loop patterns are the most common, found in approximately 60-65% of the population. They are characterized by ridges that enter from one side, curve around, and exit from the same side."
  },
  {
    id: 2,
    question: "Which fingerprint pattern is the rarest?",
    options: ["Plain Arch", "Tented Arch", "Ulnar Loop", "Plain Whorl"],
    correctAnswer: 1,
    explanation: "Tented Arch is the rarest pattern, found in only about 1% of the population. It has a sharp upthrust in the center, forming a tent-like shape."
  },
  {
    id: 3,
    question: "How many delta points does a whorl pattern have?",
    options: ["None", "One", "Two or more", "Exactly three"],
    correctAnswer: 2,
    explanation: "Whorl patterns have two or more delta points. A delta is the point where three ridge systems meet, and whorls require at least two deltas for classification."
  },
  {
    id: 4,
    question: "When do fingerprints begin forming in the womb?",
    options: ["Weeks 1-5", "Weeks 10-16", "Weeks 20-25", "Weeks 30-35"],
    correctAnswer: 1,
    explanation: "Fingerprints begin forming around weeks 10-16 of gestation. By week 17, the patterns are fully formed and remain unchanged for life."
  },
  {
    id: 5,
    question: "What structures influence fingerprint pattern type during fetal development?",
    options: ["Hair follicles", "Volar pads", "Nail beds", "Bone structure"],
    correctAnswer: 1,
    explanation: "Volar pads are small mounds that develop on fingertips during fetal development. Their size and shape (high/round vs low/flat) determine whether whorls, loops, or arches form."
  },
  {
    id: 6,
    question: "Why do identical twins have different fingerprints?",
    options: [
      "Different DNA sequences",
      "Random factors during development",
      "Different blood types",
      "They actually have identical fingerprints"
    ],
    correctAnswer: 1,
    explanation: "Even identical twins have different fingerprints because of random (stochastic) factors during development, including micro-movements in the womb, different positions, and cellular-level random events."
  },
  {
    id: 7,
    question: "What does ACE-V stand for in fingerprint examination?",
    options: [
      "Analyze, Compare, Evaluate, Verify",
      "Analysis, Comparison, Evaluation, Verification",
      "Acquire, Classify, Examine, Validate",
      "Assess, Check, Examine, Verify"
    ],
    correctAnswer: 1,
    explanation: "ACE-V stands for Analysis, Comparison, Evaluation, and Verification - the standard methodology for fingerprint examination used worldwide."
  },
  {
    id: 8,
    question: "What are latent fingerprints?",
    options: [
      "Prints visible to the naked eye",
      "Prints left in soft materials",
      "Invisible prints from sweat and oils",
      "Prints made with ink"
    ],
    correctAnswer: 2,
    explanation: "Latent prints are invisible prints left by natural skin secretions (sweat, oils). They require development techniques like powders, chemicals, or alternative light sources to be visualized."
  },
  {
    id: 9,
    question: "What does AFIS stand for?",
    options: [
      "Advanced Fingerprint Imaging System",
      "Automated Fingerprint Identification System",
      "Analytical Forensic Investigation Software",
      "American Fingerprint Information Service"
    ],
    correctAnswer: 1,
    explanation: "AFIS stands for Automated Fingerprint Identification System - computerized systems used by forensic labs to search fingerprint databases and find potential matches."
  },
  {
    id: 10,
    question: "What are the three levels of fingerprint detail?",
    options: [
      "Core, Delta, Ridge",
      "Pattern, Minutiae, Pores",
      "Arch, Loop, Whorl",
      "Primary, Secondary, Tertiary"
    ],
    correctAnswer: 1,
    explanation: "The three levels are: Level 1 (Pattern Type - overall flow), Level 2 (Minutiae Points - ridge endings, bifurcations), and Level 3 (Pores & Ridge Shape - microscopic details)."
  },
  {
    id: 11,
    question: "What is a minutiae point?",
    options: [
      "The center of a whorl pattern",
      "A specific ridge characteristic used for identification",
      "The outer boundary of a fingerprint",
      "A type of fingerprint pattern"
    ],
    correctAnswer: 1,
    explanation: "Minutiae are specific points where ridge characteristics occur, such as ridge endings, bifurcations (splits), dots, islands, and bridges. They are the primary features used for fingerprint matching."
  },
  {
    id: 12,
    question: "Are fingerprints permanent?",
    options: [
      "No, they change every few years",
      "Yes, unless the dermis is deeply damaged",
      "Only until age 50",
      "They fade with age"
    ],
    correctAnswer: 1,
    explanation: "Fingerprints are permanent because the pattern is anchored in the dermis (deeper skin layer). Only deep scarring that destroys the dermal layer can permanently alter fingerprints."
  },
  // Image-based questions for pattern identification
  {
    id: 13,
    question: "Identify the fingerprint pattern shown in the image above:",
    questionType: 'image-identify',
    image: '/images/fingerprints/patterns/whorl-plain.svg',
    imageAlt: 'Fingerprint sample showing circular ridge pattern with two deltas',
    options: ['Plain Arch', 'Ulnar Loop', 'Plain Whorl', 'Tented Arch'],
    correctAnswer: 2,
    explanation: "This is a Plain Whorl pattern, characterized by circular ridges forming a complete circuit with two deltas. Notice how the ridges form concentric circles around the core."
  },
  {
    id: 14,
    question: "What fingerprint pattern is displayed in the image?",
    questionType: 'image-identify',
    image: '/images/fingerprints/patterns/loop-ulnar.svg',
    imageAlt: 'Fingerprint sample showing ridges that loop and exit on one side',
    options: ['Radial Loop', 'Ulnar Loop', 'Double Loop Whorl', 'Plain Arch'],
    correctAnswer: 1,
    explanation: "This is an Ulnar Loop pattern. The ridges enter from one side, curve around, and exit from the same side. It's called 'ulnar' because the loop opens toward the ulnar bone (little finger side)."
  },
  {
    id: 15,
    question: "Examine the fingerprint pattern. Which type is this?",
    questionType: 'image-identify',
    image: '/images/fingerprints/patterns/arch-plain.svg',
    imageAlt: 'Fingerprint sample showing ridges flowing in a wave pattern from side to side',
    options: ['Plain Arch', 'Tented Arch', 'Radial Loop', 'Plain Whorl'],
    correctAnswer: 0,
    explanation: "This is a Plain Arch pattern - the rarest basic pattern type. Notice how the ridges rise gently in the center and flow from one side to the other without forming a loop or whorl."
  },
  {
    id: 16,
    question: "This fingerprint pattern features a sharp spike in the center. What is it?",
    questionType: 'image-identify',
    image: '/images/fingerprints/patterns/arch-tented.svg',
    imageAlt: 'Fingerprint sample showing ridges with a sharp upward thrust in the center',
    options: ['Plain Arch', 'Ulnar Loop', 'Tented Arch', 'Central Pocket Whorl'],
    correctAnswer: 2,
    explanation: "This is a Tented Arch pattern. Unlike plain arches, tented arches have ridges that make a sharp upward thrust in the center, creating a tent-like appearance. They typically have one delta."
  },
  {
    id: 17,
    question: "How many delta points can you identify in this whorl pattern?",
    questionType: 'image-identify',
    image: '/images/fingerprints/patterns/whorl-double.svg',
    imageAlt: 'Double loop whorl fingerprint pattern',
    options: ['None', 'One', 'Two', 'Three'],
    correctAnswer: 2,
    explanation: "This Double Loop Whorl has two delta points - the triangular formations where three ridge systems meet. All whorl patterns require at least two deltas for classification."
  },
  {
    id: 18,
    question: "What technique is being demonstrated in this forensic image?",
    questionType: 'image-identify',
    image: '/images/fingerprints/evidence/powder-dusting.svg',
    imageAlt: 'Black powder being applied to a surface with a brush to reveal fingerprints',
    options: ['Chemical fuming', 'Powder dusting', 'Ninhydrin treatment', 'UV illumination'],
    correctAnswer: 1,
    explanation: "This shows the powder dusting technique - one of the most common methods for developing latent prints on non-porous surfaces. The powder adheres to the oils and sweat deposits, making the print visible."
  },
];

export default function Quiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  // Shuffle questions on quiz start
  const shuffledQuestions = useMemo(() => {
    return [...quizQuestions].sort(() => Math.random() - 0.5);
  }, [quizComplete]); // Reshuffle when quiz restarts

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return;
    setSelectedAnswer(answerIndex);
  };

  const handleCheckAnswer = () => {
    if (selectedAnswer === null) return;
    setShowResult(true);
    if (selectedAnswer === shuffledQuestions[currentQuestion].correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < shuffledQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizComplete(true);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setQuizComplete(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-2xl mb-4">
          <PuzzlePieceIcon className="h-8 w-8 text-teal-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Fingerprint Knowledge Quiz
        </h1>
        <p className="text-gray-600 dark:text-zinc-400 max-w-2xl mx-auto">
          Test your knowledge about fingerprints, forensics, and identification science.
        </p>
      </div>

      {/* Quiz Content */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-700 p-4 sm:p-6 lg:p-8">
        {!quizComplete ? (
          <div className="max-w-2xl mx-auto">
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-500 dark:text-zinc-400 mb-2">
                <span>Question {currentQuestion + 1} of {shuffledQuestions.length}</span>
                <span>Score: {score}/{currentQuestion + (showResult ? 1 : 0)}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
                <div
                  className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestion + (showResult ? 1 : 0)) / shuffledQuestions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question card */}
            <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-6 mb-6">
              {/* Question image (for image-identify questions) */}
              {shuffledQuestions[currentQuestion].image && (
                <div className="mb-4 flex justify-center">
                  <div className="relative bg-white dark:bg-zinc-900 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
                    <img
                      src={shuffledQuestions[currentQuestion].image}
                      alt={shuffledQuestions[currentQuestion].imageAlt || 'Question image'}
                      className="max-h-48 w-auto object-contain mx-auto"
                    />
                    <div className="absolute bottom-2 right-2 p-1 bg-gray-100 dark:bg-zinc-800 rounded-full">
                      <MagnifyingGlassIcon className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
                    </div>
                  </div>
                </div>
              )}

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {shuffledQuestions[currentQuestion].question}
              </h3>

              {/* Options */}
              <div className="space-y-3">
                {shuffledQuestions[currentQuestion].options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrect = index === shuffledQuestions[currentQuestion].correctAnswer;
                  const showCorrectness = showResult;

                  let buttonClass = 'w-full text-left px-4 py-3 rounded-lg border-2 transition-all duration-200 flex items-center gap-3';

                  if (showCorrectness) {
                    if (isCorrect) {
                      buttonClass += ' border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300';
                    } else if (isSelected && !isCorrect) {
                      buttonClass += ' border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300';
                    } else {
                      buttonClass += ' border-gray-200 dark:border-zinc-600 text-gray-500 dark:text-zinc-500';
                    }
                  } else {
                    if (isSelected) {
                      buttonClass += ' border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300';
                    } else {
                      buttonClass += ' border-gray-200 dark:border-zinc-600 hover:border-teal-300 dark:hover:border-teal-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700';
                    }
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={showResult}
                      className={buttonClass}
                    >
                      <span className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-600 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="flex-1">{option}</span>
                      {showCorrectness && isCorrect && (
                        <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0" />
                      )}
                      {showCorrectness && isSelected && !isCorrect && (
                        <XCircleIcon className="w-6 h-6 text-red-500 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Explanation (shown after answering) */}
            {showResult && (
              <div className={`rounded-xl p-4 mb-6 ${
                selectedAnswer === shuffledQuestions[currentQuestion].correctAnswer
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-start gap-3">
                  {selectedAnswer === shuffledQuestions[currentQuestion].correctAnswer ? (
                    <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircleIcon className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-semibold mb-1 ${
                      selectedAnswer === shuffledQuestions[currentQuestion].correctAnswer
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-red-700 dark:text-red-300'
                    }`}>
                      {selectedAnswer === shuffledQuestions[currentQuestion].correctAnswer ? 'Correct!' : 'Incorrect'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">
                      {shuffledQuestions[currentQuestion].explanation}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-center gap-4">
              {!showResult ? (
                <button
                  onClick={handleCheckAnswer}
                  disabled={selectedAnswer === null}
                  className={`px-6 py-3 rounded-xl font-medium transition-all ${
                    selectedAnswer !== null
                      ? 'bg-teal-500 text-white hover:bg-teal-600 shadow-lg shadow-teal-500/25'
                      : 'bg-gray-200 dark:bg-zinc-700 text-gray-400 dark:text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  Check Answer
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-3 rounded-xl font-medium bg-teal-500 text-white hover:bg-teal-600 shadow-lg shadow-teal-500/25 transition-all"
                >
                  {currentQuestion < shuffledQuestions.length - 1 ? 'Next Question' : 'See Results'}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Quiz complete - show results */
          <div className="max-w-md mx-auto text-center">
            <div className="mb-6">
              <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center ${
                score >= shuffledQuestions.length * 0.8
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : score >= shuffledQuestions.length * 0.5
                    ? 'bg-yellow-100 dark:bg-yellow-900/30'
                    : 'bg-red-100 dark:bg-red-900/30'
              }`}>
                <span className={`text-4xl font-bold ${
                  score >= shuffledQuestions.length * 0.8
                    ? 'text-green-600 dark:text-green-400'
                    : score >= shuffledQuestions.length * 0.5
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                }`}>
                  {Math.round((score / shuffledQuestions.length) * 100)}%
                </span>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {score >= shuffledQuestions.length * 0.8
                ? 'Excellent!'
                : score >= shuffledQuestions.length * 0.5
                  ? 'Good Job!'
                  : 'Keep Learning!'}
            </h3>
            <p className="text-gray-600 dark:text-zinc-400 mb-6">
              You scored {score} out of {shuffledQuestions.length} questions correctly.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={handleRestartQuiz}
                className="px-6 py-3 rounded-xl font-medium bg-teal-500 text-white hover:bg-teal-600 shadow-lg shadow-teal-500/25 transition-all flex items-center justify-center gap-2"
              >
                <ArrowPathIcon className="w-5 h-5" />
                Try Again
              </button>
              <Link
                to="/about"
                className="px-6 py-3 rounded-xl font-medium bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all"
              >
                Review Material
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
