// Learning Cases Data Structure and Demo Case Content

// Type definitions
export type PatternType = 'arch' | 'loop' | 'whorl' | 'tented-arch';
export type PuzzleType = 'pattern-match' | 'evidence-select' | 'sequence';
export type SceneType = 'narrative' | 'choice' | 'puzzle' | 'info';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface PatternMatchPuzzle {
  type: 'pattern-match';
  targetPattern: PatternType;
  question: string;
  options: { id: string; pattern: PatternType; label: string }[];
  correctId: string;
}

export interface EvidenceSelectPuzzle {
  type: 'evidence-select';
  question: string;
  items: { id: string; name: string; description: string; isRelevant: boolean }[];
  requiredCorrect: number;
}

export interface SequencePuzzle {
  type: 'sequence';
  question: string;
  steps: { id: string; text: string; order: number }[];
}

export type PuzzleData = PatternMatchPuzzle | EvidenceSelectPuzzle | SequencePuzzle;

export interface NarrativeContent {
  text: string;
  speaker?: string;
  nextScene: string;
}

export interface ChoiceContent {
  text: string;
  options: {
    id: string;
    text: string;
    nextScene: string;
    points?: number;
    feedback?: string;
  }[];
}

export interface PuzzleContent {
  instruction: string;
  data: PuzzleData;
  successScene: string;
  failScene: string;
  hints?: string[];
  points: number;
}

export interface InfoContent {
  title: string;
  text: string;
  bulletPoints?: string[];
  nextScene: string;
}

export interface Scene {
  id: string;
  type: SceneType;
  content: NarrativeContent | ChoiceContent | PuzzleContent | InfoContent;
}

export interface Chapter {
  id: string;
  title: string;
  scenes: Scene[];
}

export interface CaseStory {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  estimatedTime: string;
  coverImage?: string;
  chapters: Chapter[];
  totalPoints: number;
}

export interface LearningProgress {
  caseId: string;
  currentChapter: string;
  currentScene: string;
  score: number;
  completedScenes: string[];
  startedAt: string;
  lastPlayedAt: string;
  isCompleted: boolean;
}

// Demo Case: "The Missing Heirloom"
export const demoCase: CaseStory = {
  id: 'missing-heirloom',
  title: 'The Missing Heirloom',
  description: 'A valuable antique ring has been stolen from the Westbrook Museum. Use your fingerprint expertise to help solve the case.',
  difficulty: 'beginner',
  estimatedTime: '15-20 min',
  totalPoints: 100,
  chapters: [
    {
      id: 'chapter-1',
      title: 'Chapter 1: The Crime Scene',
      scenes: [
        {
          id: 'intro',
          type: 'narrative',
          content: {
            text: "You receive an urgent call from Detective Sarah Chen. A priceless family heirloom - the Westbrook Diamond Ring - has been stolen from the museum's antiquities wing. Your expertise in fingerprint analysis is needed.",
            speaker: 'Narrator',
            nextScene: 'detective-briefing',
          } as NarrativeContent,
        },
        {
          id: 'detective-briefing',
          type: 'narrative',
          content: {
            text: "\"Thanks for coming so quickly. The theft occurred sometime between 10 PM last night and 6 AM this morning. We have three suspects - all had access to this wing. I need you to help us find fingerprint evidence.\"",
            speaker: 'Detective Chen',
            nextScene: 'where-to-start',
          } as NarrativeContent,
        },
        {
          id: 'where-to-start',
          type: 'choice',
          content: {
            text: 'Where would you like to begin your investigation?',
            options: [
              {
                id: 'display-case',
                text: 'Examine the display case where the ring was kept',
                nextScene: 'examine-display',
                points: 10,
                feedback: 'Excellent choice! The display case is the primary crime scene.',
              },
              {
                id: 'entry-points',
                text: 'Check the entry points to the wing',
                nextScene: 'examine-display',
                points: 5,
                feedback: 'Good thinking, but the display case might yield more direct evidence.',
              },
              {
                id: 'interview-first',
                text: 'Interview the suspects first',
                nextScene: 'examine-display',
                points: 0,
                feedback: "Let's gather physical evidence first before interviews.",
              },
            ],
          } as ChoiceContent,
        },
        {
          id: 'examine-display',
          type: 'narrative',
          content: {
            text: "You approach the display case. The glass has been carefully removed - no signs of forced entry. Using your flashlight at an oblique angle, you spot several fingerprints on the glass surface. Some are clearly visible, while others are barely perceptible.",
            speaker: 'Narrator',
            nextScene: 'print-types-info',
          } as NarrativeContent,
        },
        {
          id: 'print-types-info',
          type: 'info',
          content: {
            title: 'Types of Fingerprint Evidence',
            text: 'Fingerprints found at crime scenes are classified into three categories based on how visible they are:',
            bulletPoints: [
              'Latent Prints: Invisible to the naked eye, left by natural oils and sweat. Require development techniques to visualize.',
              'Patent Prints: Visible prints made when fingers touch a surface after contacting a colored substance (ink, blood, paint).',
              'Plastic Prints: Three-dimensional impressions left in soft materials like wax, soap, or putty.',
            ],
            nextScene: 'identify-print-puzzle',
          } as InfoContent,
        },
        {
          id: 'identify-print-puzzle',
          type: 'puzzle',
          content: {
            instruction: 'Based on what you learned, identify what type of print would be found on the smooth glass display case (left by natural skin oils):',
            data: {
              type: 'evidence-select',
              question: 'Select the correct type of fingerprint evidence:',
              items: [
                { id: 'latent', name: 'Latent Print', description: 'Invisible print from natural skin oils', isRelevant: true },
                { id: 'patent', name: 'Patent Print', description: 'Visible print from colored substance', isRelevant: false },
                { id: 'plastic', name: 'Plastic Print', description: '3D impression in soft material', isRelevant: false },
              ],
              requiredCorrect: 1,
            } as EvidenceSelectPuzzle,
            successScene: 'chapter-1-complete',
            failScene: 'print-puzzle-fail',
            hints: ['Think about what happens when you touch glass with clean fingers...'],
            points: 15,
          } as PuzzleContent,
        },
        {
          id: 'print-puzzle-fail',
          type: 'narrative',
          content: {
            text: "That's not quite right. Remember, the prints on the glass were barely visible until you used your flashlight. What type of prints are hard to see without special techniques?",
            speaker: 'Detective Chen',
            nextScene: 'identify-print-puzzle',
          } as NarrativeContent,
        },
        {
          id: 'chapter-1-complete',
          type: 'narrative',
          content: {
            text: "\"Excellent work identifying those latent prints! Now we need to develop them properly and analyze the patterns. Let's head to the lab.\"",
            speaker: 'Detective Chen',
            nextScene: 'chapter-2-start',
          } as NarrativeContent,
        },
      ],
    },
    {
      id: 'chapter-2',
      title: 'Chapter 2: Evidence Analysis',
      scenes: [
        {
          id: 'chapter-2-start',
          type: 'narrative',
          content: {
            text: "At the forensics lab, you've successfully developed the latent prints using powder dusting. Three clear prints have been recovered from the display case. Now it's time to analyze them.",
            speaker: 'Narrator',
            nextScene: 'pattern-info',
          } as NarrativeContent,
        },
        {
          id: 'pattern-info',
          type: 'info',
          content: {
            title: 'Fingerprint Pattern Types',
            text: 'All fingerprints fall into one of three main pattern types. Understanding these is crucial for classification and comparison:',
            bulletPoints: [
              'Loop (60-65% of prints): Ridges enter from one side, curve around, and exit from the same side. Can be ulnar or radial loops.',
              'Whorl (30-35% of prints): Ridges form circular or spiral patterns. Includes plain whorls, central pocket loops, double loops, and accidentals.',
              'Arch (5% of prints): Ridges flow from one side to the other with a rise in the center. Plain arches have a smooth wave, tented arches have a sharp spike.',
            ],
            nextScene: 'pattern-match-puzzle',
          } as InfoContent,
        },
        {
          id: 'pattern-match-puzzle',
          type: 'puzzle',
          content: {
            instruction: 'The primary print recovered from the case shows ridges forming a circular pattern that spirals inward. Identify the pattern type:',
            data: {
              type: 'pattern-match',
              targetPattern: 'whorl',
              question: 'What pattern type is this fingerprint?',
              options: [
                { id: 'opt-arch', pattern: 'arch', label: 'Arch - Ridges flow side to side' },
                { id: 'opt-loop', pattern: 'loop', label: 'Loop - Ridges curve and exit same side' },
                { id: 'opt-whorl', pattern: 'whorl', label: 'Whorl - Circular/spiral pattern' },
                { id: 'opt-tented', pattern: 'tented-arch', label: 'Tented Arch - Sharp spike in center' },
              ],
              correctId: 'opt-whorl',
            } as PatternMatchPuzzle,
            successScene: 'suspect-intro',
            failScene: 'pattern-fail',
            hints: ['Circular and spiral patterns are characteristic of which type?'],
            points: 20,
          } as PuzzleContent,
        },
        {
          id: 'pattern-fail',
          type: 'narrative',
          content: {
            text: "Not quite. Look at the description again - 'circular pattern that spirals inward'. Which pattern type is defined by circular or spiral ridge formations?",
            speaker: 'Narrator',
            nextScene: 'pattern-match-puzzle',
          } as NarrativeContent,
        },
        {
          id: 'suspect-intro',
          type: 'narrative',
          content: {
            text: "Great identification! Now, we have three suspects. Detective Chen hands you their fingerprint cards. \"We took these prints during initial questioning. Compare them to see if any match our evidence.\"",
            speaker: 'Narrator',
            nextScene: 'suspect-choice',
          } as NarrativeContent,
        },
        {
          id: 'suspect-choice',
          type: 'choice',
          content: {
            text: 'Which suspect would you like to examine first?',
            options: [
              {
                id: 'suspect-james',
                text: 'James Morton - Night security guard (has a Loop pattern)',
                nextScene: 'acev-info',
                points: 5,
              },
              {
                id: 'suspect-elena',
                text: 'Elena Vance - Museum curator assistant (has a Whorl pattern)',
                nextScene: 'acev-info',
                points: 10,
                feedback: 'Smart choice! Her pattern type matches our evidence.',
              },
              {
                id: 'suspect-robert',
                text: 'Robert Hayes - Cleaning staff (has an Arch pattern)',
                nextScene: 'acev-info',
                points: 5,
              },
            ],
          } as ChoiceContent,
        },
        {
          id: 'acev-info',
          type: 'info',
          content: {
            title: 'The ACE-V Methodology',
            text: 'Professional fingerprint examiners use the ACE-V method to ensure accurate comparisons. This is the gold standard in forensic fingerprint analysis:',
            bulletPoints: [
              'Analysis: Examine the unknown print for quality, clarity, and identifiable features (minutiae).',
              'Comparison: Compare the unknown print side-by-side with the known print, looking for matching minutiae.',
              'Evaluation: Make a determination - Identification, Exclusion, or Inconclusive.',
              'Verification: Have another qualified examiner independently verify the conclusion.',
            ],
            nextScene: 'acev-puzzle',
          } as InfoContent,
        },
        {
          id: 'acev-puzzle',
          type: 'puzzle',
          content: {
            instruction: 'Put the ACE-V methodology steps in the correct order:',
            data: {
              type: 'sequence',
              question: 'Arrange the ACE-V steps in order:',
              steps: [
                { id: 'step-a', text: 'Analysis - Examine the unknown print', order: 1 },
                { id: 'step-c', text: 'Comparison - Compare with known prints', order: 2 },
                { id: 'step-e', text: 'Evaluation - Make a determination', order: 3 },
                { id: 'step-v', text: 'Verification - Independent review', order: 4 },
              ],
            } as SequencePuzzle,
            successScene: 'chapter-2-complete',
            failScene: 'acev-fail',
            hints: ['The letters A-C-E-V spell out the order!'],
            points: 15,
          } as PuzzleContent,
        },
        {
          id: 'acev-fail',
          type: 'narrative',
          content: {
            text: "The order isn't quite right. Remember, ACE-V is an acronym - the steps follow the letters: A, then C, then E, then V.",
            speaker: 'Narrator',
            nextScene: 'acev-puzzle',
          } as NarrativeContent,
        },
        {
          id: 'chapter-2-complete',
          type: 'narrative',
          content: {
            text: "\"You've got the methodology down perfectly. Following ACE-V, I've been comparing the evidence print with our suspects' cards. I found something significant. Let's make our final determination.\"",
            speaker: 'Detective Chen',
            nextScene: 'chapter-3-start',
          } as NarrativeContent,
        },
      ],
    },
    {
      id: 'chapter-3',
      title: 'Chapter 3: Case Solved',
      scenes: [
        {
          id: 'chapter-3-start',
          type: 'narrative',
          content: {
            text: "After careful analysis using the ACE-V methodology, you've compared the crime scene print with all three suspects. The whorl pattern from the display case shows 12 matching minutiae points with one of the suspects' prints.",
            speaker: 'Narrator',
            nextScene: 'final-puzzle',
          } as NarrativeContent,
        },
        {
          id: 'final-puzzle',
          type: 'puzzle',
          content: {
            instruction: 'Based on your analysis, the crime scene print (a whorl pattern) matches which suspect?',
            data: {
              type: 'evidence-select',
              question: 'Select the suspect whose print matches the evidence:',
              items: [
                { id: 'james', name: 'James Morton', description: 'Night security guard - Loop pattern on file', isRelevant: false },
                { id: 'elena', name: 'Elena Vance', description: 'Curator assistant - Whorl pattern on file', isRelevant: true },
                { id: 'robert', name: 'Robert Hayes', description: 'Cleaning staff - Arch pattern on file', isRelevant: false },
              ],
              requiredCorrect: 1,
            } as EvidenceSelectPuzzle,
            successScene: 'present-findings',
            failScene: 'final-puzzle-fail',
            hints: ['Remember, our evidence print was identified as a whorl pattern...'],
            points: 25,
          } as PuzzleContent,
        },
        {
          id: 'final-puzzle-fail',
          type: 'narrative',
          content: {
            text: "Let's think about this carefully. The print we recovered from the display case was a whorl pattern. Only one suspect has a whorl pattern on their fingerprint card.",
            speaker: 'Detective Chen',
            nextScene: 'final-puzzle',
          } as NarrativeContent,
        },
        {
          id: 'present-findings',
          type: 'choice',
          content: {
            text: 'How would you present your findings to Detective Chen?',
            options: [
              {
                id: 'confident',
                text: '"The evidence conclusively identifies Elena Vance. The whorl patterns match with 12 minutiae points."',
                nextScene: 'case-solved',
                points: 15,
                feedback: 'Perfect professional presentation of your findings!',
              },
              {
                id: 'cautious',
                text: '"The print appears to match Elena Vance, but we should have it verified by another examiner."',
                nextScene: 'case-solved',
                points: 10,
                feedback: 'Good cautious approach - verification is important in ACE-V!',
              },
              {
                id: 'uncertain',
                text: '"I think it might be Elena, but I\'m not sure..."',
                nextScene: 'case-solved',
                points: 5,
                feedback: 'Your analysis was correct, but confidence in presenting evidence is important.',
              },
            ],
          } as ChoiceContent,
        },
        {
          id: 'case-solved',
          type: 'narrative',
          content: {
            text: "\"Excellent work! Based on your fingerprint analysis, we confronted Elena Vance. She confessed to stealing the ring to pay off personal debts. The ring has been recovered and returned to the museum. Your expertise in fingerprint analysis was crucial to solving this case.\"",
            speaker: 'Detective Chen',
            nextScene: 'conclusion',
          } as NarrativeContent,
        },
        {
          id: 'conclusion',
          type: 'info',
          content: {
            title: 'Case Completed!',
            text: 'Congratulations! You successfully solved "The Missing Heirloom" using your fingerprint analysis skills.',
            bulletPoints: [
              'You learned about the three types of fingerprint evidence: latent, patent, and plastic prints.',
              'You mastered the three main fingerprint patterns: loops, whorls, and arches.',
              'You applied the ACE-V methodology: Analysis, Comparison, Evaluation, and Verification.',
              'You used pattern matching to identify the correct suspect.',
            ],
            nextScene: 'end',
          } as InfoContent,
        },
      ],
    },
  ],
};

// All available cases
export const learningCases: CaseStory[] = [demoCase];

// Helper function to get a case by ID
export function getCaseById(id: string): CaseStory | undefined {
  return learningCases.find((c) => c.id === id);
}

// Helper function to get a scene by ID within a case
export function getSceneById(caseStory: CaseStory, sceneId: string): { chapter: Chapter; scene: Scene } | undefined {
  for (const chapter of caseStory.chapters) {
    const scene = chapter.scenes.find((s) => s.id === sceneId);
    if (scene) {
      return { chapter, scene };
    }
  }
  return undefined;
}

// Helper function to get the first scene of a case
export function getFirstScene(caseStory: CaseStory): { chapter: Chapter; scene: Scene } | undefined {
  if (caseStory.chapters.length > 0 && caseStory.chapters[0].scenes.length > 0) {
    return {
      chapter: caseStory.chapters[0],
      scene: caseStory.chapters[0].scenes[0],
    };
  }
  return undefined;
}

// Helper to count total scenes in a case
export function getTotalScenes(caseStory: CaseStory): number {
  return caseStory.chapters.reduce((total, chapter) => total + chapter.scenes.length, 0);
}
