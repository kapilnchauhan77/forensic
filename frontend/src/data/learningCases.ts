// Learning Cases Data Structure and Demo Case Content

// Type definitions
export type PatternType = 'arch' | 'loop' | 'whorl' | 'tented-arch';
export type PuzzleType = 'pattern-match' | 'evidence-select' | 'sequence' | 'drag-drop' | 'image-comparison';
export type SceneType = 'narrative' | 'choice' | 'puzzle' | 'info';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface PatternMatchPuzzle {
  type: 'pattern-match';
  targetPattern: PatternType;
  targetImage?: string;          // NEW: show actual fingerprint image
  question: string;
  options: { id: string; pattern: PatternType; label: string; image?: string }[];  // NEW: pattern example image
  correctId: string;
}

export interface EvidenceSelectPuzzle {
  type: 'evidence-select';
  question: string;
  items: { id: string; name: string; description: string; isRelevant: boolean; image?: string }[];  // NEW: item image
  requiredCorrect: number;
}

export interface SequencePuzzle {
  type: 'sequence';
  question: string;
  steps: { id: string; text: string; order: number; image?: string }[];  // NEW: step image
}

// NEW: Drag-and-drop puzzle type
export interface DragDropPuzzle {
  type: 'drag-drop';
  question: string;
  items: { id: string; label: string; image?: string }[];
  dropZones: { id: string; label: string; correctItemId: string; image?: string }[];
}

// NEW: Image comparison puzzle type
export interface ImageComparisonPuzzle {
  type: 'image-comparison';
  question: string;
  leftImage: string;
  leftLabel?: string;
  rightImage: string;
  rightLabel?: string;
  correctAnswer: 'match' | 'no-match';
  highlightAreas?: { x: number; y: number; radius: number }[];
  explanation?: string;
}

export type PuzzleData = PatternMatchPuzzle | EvidenceSelectPuzzle | SequencePuzzle | DragDropPuzzle | ImageComparisonPuzzle;

export interface NarrativeContent {
  text: string;
  speaker?: string;
  speakerImage?: string;         // NEW: character portrait URL
  sceneImage?: string;           // NEW: background/context image
  nextScene: string;
}

export interface ChoiceContent {
  text: string;
  image?: string;                // NEW: scene context image
  options: {
    id: string;
    text: string;
    nextScene: string;
    points?: number;
    feedback?: string;
    image?: string;              // NEW: option illustration
  }[];
}

export interface PuzzleContent {
  instruction: string;
  instructionImage?: string;     // NEW: visual context for puzzle
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
  image?: string;                // NEW: educational diagram/image
  imageCaption?: string;         // NEW: image description
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
  coverImage: '/images/fingerprints/scenes/crime-scene.svg',
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
            sceneImage: '/images/fingerprints/scenes/crime-scene.svg',
            nextScene: 'detective-briefing',
          } as NarrativeContent,
        },
        {
          id: 'detective-briefing',
          type: 'narrative',
          content: {
            text: "\"Thanks for coming so quickly. The theft occurred sometime between 10 PM last night and 6 AM this morning. We have three suspects - all had access to this wing. I need you to help us find fingerprint evidence.\"",
            speaker: 'Detective Chen',
            speakerImage: '/images/characters/detective-chen.svg',
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
            image: '/images/fingerprints/evidence/latent-glass.svg',
            imageCaption: 'A latent fingerprint on a glass surface, barely visible before processing',
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
            image: '/images/fingerprints/evidence/comparison.svg',
            imageCaption: 'Side-by-side comparison of fingerprint patterns with matching minutiae highlighted',
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
              targetImage: '/images/fingerprints/patterns/whorl-plain.svg',
              question: 'What pattern type is this fingerprint?',
              options: [
                { id: 'opt-arch', pattern: 'arch', label: 'Arch - Ridges flow side to side', image: '/images/fingerprints/patterns/arch-plain.svg' },
                { id: 'opt-loop', pattern: 'loop', label: 'Loop - Ridges curve and exit same side', image: '/images/fingerprints/patterns/loop-ulnar.svg' },
                { id: 'opt-whorl', pattern: 'whorl', label: 'Whorl - Circular/spiral pattern', image: '/images/fingerprints/patterns/whorl-plain.svg' },
                { id: 'opt-tented', pattern: 'tented-arch', label: 'Tented Arch - Sharp spike in center', image: '/images/fingerprints/patterns/arch-tented.svg' },
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

// Case 2: The Bank Vault Break-In (Intermediate)
export const bankVaultCase: CaseStory = {
  id: 'bank-vault-break-in',
  title: 'The Bank Vault Break-In',
  description: 'A sophisticated heist at First National Bank leaves investigators puzzled. Multiple fingerprints and partial prints challenge your analysis skills.',
  difficulty: 'intermediate',
  estimatedTime: '25-30 min',
  coverImage: '/images/fingerprints/scenes/vault-door.svg',
  totalPoints: 150,
  chapters: [
    {
      id: 'chapter-1',
      title: 'Chapter 1: The Heist',
      scenes: [
        {
          id: 'intro',
          type: 'narrative',
          content: {
            text: "It's 6 AM when your phone rings. Detective Marcus Webb needs you at First National Bank immediately. Someone bypassed the security system and accessed the vault overnight. $2.3 million in bearer bonds are missing.",
            speaker: 'Narrator',
            sceneImage: '/images/fingerprints/scenes/vault-door.svg',
            nextScene: 'arrive-scene',
          } as NarrativeContent,
        },
        {
          id: 'arrive-scene',
          type: 'narrative',
          content: {
            text: "\"This wasn't some amateur job. They knew exactly what they were doing - disabled the cameras, cracked the vault code, and left minimal trace. But everyone leaves something behind. That's where you come in.\"",
            speaker: 'Detective Webb',
            speakerImage: '/images/characters/detective-webb.svg',
            nextScene: 'vault-overview',
          } as NarrativeContent,
        },
        {
          id: 'vault-overview',
          type: 'narrative',
          content: {
            text: "The vault is a fortress of steel and concrete. You notice the electronic keypad has been carefully wiped clean, but the heavy vault door handle shows signs of contact. A safe deposit box on the upper shelf appears to have been forced open.",
            speaker: 'Narrator',
            nextScene: 'evidence-choice',
          } as NarrativeContent,
        },
        {
          id: 'evidence-choice',
          type: 'choice',
          content: {
            text: 'Which area should you process for fingerprints first?',
            options: [
              {
                id: 'vault-handle',
                text: 'The vault door handle - it requires significant grip to open',
                nextScene: 'minutiae-info',
                points: 15,
                feedback: 'Excellent! Heavy doors require firm grip, leaving better quality prints.',
              },
              {
                id: 'keypad-area',
                text: 'The keypad area - even wiped surfaces may retain traces',
                nextScene: 'minutiae-info',
                points: 10,
                feedback: 'Good thinking, though wiped surfaces are challenging to process.',
              },
              {
                id: 'deposit-box',
                text: 'The forced deposit box - clear point of contact',
                nextScene: 'minutiae-info',
                points: 10,
                feedback: 'Valid choice, though the forcing action may have smeared prints.',
              },
            ],
          } as ChoiceContent,
        },
        {
          id: 'minutiae-info',
          type: 'info',
          content: {
            title: 'Understanding Minutiae Points',
            text: 'Minutiae are the unique characteristics within fingerprint ridge patterns that make each print identifiable. Examiners typically need 8-12 matching minutiae for positive identification.',
            bulletPoints: [
              'Ridge Endings: Where a ridge line stops abruptly',
              'Bifurcations: Where one ridge splits into two',
              'Dots: Very short ridges that appear as dots',
              'Islands: Short ridges slightly longer than dots',
              'Spurs: A ridge that branches off and ends shortly after',
              'Crossovers: Where two ridges cross each other',
            ],
            nextScene: 'partial-print-info',
          } as InfoContent,
        },
        {
          id: 'partial-print-info',
          type: 'info',
          content: {
            title: 'Working with Partial Prints',
            text: 'Crime scene prints are often partial or fragmented. Unlike controlled prints taken at booking, latent prints may only show a portion of the finger.',
            bulletPoints: [
              'Partial prints can still be matched if sufficient minutiae are visible',
              'Quality matters more than quantity - clear minutiae are essential',
              'Orientation must be determined before comparison',
              'Multiple partial prints from the same source can be combined',
            ],
            nextScene: 'find-prints',
          } as InfoContent,
        },
        {
          id: 'find-prints',
          type: 'narrative',
          content: {
            text: "After careful processing with black powder on the vault handle, you recover three prints: one nearly complete thumb print, one partial print showing only the upper third of a finger, and one smeared print that's barely usable.",
            speaker: 'Narrator',
            nextScene: 'quality-puzzle',
          } as NarrativeContent,
        },
        {
          id: 'quality-puzzle',
          type: 'puzzle',
          content: {
            instruction: 'Assess the quality of the recovered prints. Which prints are suitable for comparison?',
            data: {
              type: 'evidence-select',
              question: 'Select all prints suitable for analysis:',
              items: [
                { id: 'thumb', name: 'Complete Thumb Print', description: 'Clear ridges with visible minutiae throughout', isRelevant: true },
                { id: 'partial', name: 'Partial Upper Print', description: 'Clear minutiae in the visible area, approximately 40% of print', isRelevant: true },
                { id: 'smeared', name: 'Smeared Print', description: 'Heavily distorted ridges, no clear minutiae visible', isRelevant: false },
              ],
              requiredCorrect: 2,
            } as EvidenceSelectPuzzle,
            successScene: 'chapter-1-complete',
            failScene: 'quality-puzzle-fail',
            hints: ['Focus on whether minutiae are clearly visible, not just the size of the print'],
            points: 20,
          } as PuzzleContent,
        },
        {
          id: 'quality-puzzle-fail',
          type: 'narrative',
          content: {
            text: "Remember, the key factor is minutiae visibility. Even a partial print can be valuable if the minutiae are clear. Smeared prints with no visible minutiae cannot be used for comparison.",
            speaker: 'Detective Webb',
            nextScene: 'quality-puzzle',
          } as NarrativeContent,
        },
        {
          id: 'chapter-1-complete',
          type: 'narrative',
          content: {
            text: "\"Two usable prints from a professional job - that's better than I expected. Let's get these to the lab and start running comparisons.\"",
            speaker: 'Detective Webb',
            nextScene: 'chapter-2-start',
          } as NarrativeContent,
        },
      ],
    },
    {
      id: 'chapter-2',
      title: 'Chapter 2: Digital Analysis',
      scenes: [
        {
          id: 'chapter-2-start',
          type: 'narrative',
          content: {
            text: "At the digital forensics lab, you scan the prints into AFIS - the Automated Fingerprint Identification System. The system will search millions of prints for potential matches, but human verification is still essential.",
            speaker: 'Narrator',
            nextScene: 'afis-info',
          } as NarrativeContent,
        },
        {
          id: 'afis-info',
          type: 'info',
          content: {
            title: 'AFIS: Automated Fingerprint Identification System',
            text: 'AFIS is a computerized system that stores and searches fingerprint records. However, it provides candidates, not identifications - human examiners make the final call.',
            bulletPoints: [
              'AFIS uses algorithms to encode and compare minutiae patterns',
              'Returns a list of potential matches ranked by similarity score',
              'False positives are possible - verification is mandatory',
              'Cannot replace trained examiner judgment',
              'Different systems may produce different candidate lists',
            ],
            nextScene: 'afis-results',
          } as InfoContent,
        },
        {
          id: 'afis-results',
          type: 'narrative',
          content: {
            text: "AFIS returns three candidates for the thumb print, all with similarity scores above 85%. The partial print produces two candidates. Now you must manually verify each potential match using the ACE-V methodology.",
            speaker: 'Narrator',
            nextScene: 'verify-info',
          } as NarrativeContent,
        },
        {
          id: 'verify-info',
          type: 'info',
          content: {
            title: 'Verification Standards',
            text: 'When verifying AFIS candidates, examiners look for both matching and non-matching characteristics:',
            bulletPoints: [
              'Level 1 Detail: Overall pattern type (arch, loop, whorl)',
              'Level 2 Detail: Minutiae - specific ridge characteristics',
              'Level 3 Detail: Pores, ridge contours, edge shapes (requires high resolution)',
              'Exclusion: One unexplainable difference can exclude a match',
              'Tolerance: Minor variations from pressure or skin condition are expected',
            ],
            nextScene: 'minutiae-count-puzzle',
          } as InfoContent,
        },
        {
          id: 'minutiae-count-puzzle',
          type: 'puzzle',
          content: {
            instruction: 'You\'re comparing the crime scene thumb print to AFIS Candidate #1. You\'ve marked 15 corresponding minutiae. How should you proceed?',
            data: {
              type: 'evidence-select',
              question: 'What is the correct next step?',
              items: [
                { id: 'declare-match', name: 'Declare Identification', description: '15 minutiae exceeds the 8-12 threshold', isRelevant: false },
                { id: 'check-discrepancies', name: 'Check for Discrepancies', description: 'Look for unexplainable differences before concluding', isRelevant: true },
                { id: 'request-more', name: 'Request More Candidates', description: 'The current candidates are insufficient', isRelevant: false },
              ],
              requiredCorrect: 1,
            } as EvidenceSelectPuzzle,
            successScene: 'discrepancy-check',
            failScene: 'minutiae-puzzle-fail',
            hints: ['ACE-V requires thorough evaluation before identification - counting matches isn\'t enough'],
            points: 20,
          } as PuzzleContent,
        },
        {
          id: 'minutiae-puzzle-fail',
          type: 'narrative',
          content: {
            text: "Just counting matching minutiae isn't sufficient. A proper examination requires checking for any unexplainable differences. One clear discrepancy can exclude a match entirely.",
            speaker: 'Narrator',
            nextScene: 'minutiae-count-puzzle',
          } as NarrativeContent,
        },
        {
          id: 'discrepancy-check',
          type: 'narrative',
          content: {
            text: "Good protocol! Upon closer examination of Candidate #1, you notice a bifurcation in the evidence print that appears as a ridge ending in the candidate's print. This is an unexplainable difference - Candidate #1 is excluded.",
            speaker: 'Narrator',
            nextScene: 'candidate-2',
          } as NarrativeContent,
        },
        {
          id: 'candidate-2',
          type: 'narrative',
          content: {
            text: "Moving to Candidate #2, a known burglar named Vincent Cole, you find 12 corresponding minutiae with no unexplainable differences. The partial print also matches a second individual - his known associate, Diane Porter.",
            speaker: 'Narrator',
            nextScene: 'verification-puzzle',
          } as NarrativeContent,
        },
        {
          id: 'verification-puzzle',
          type: 'puzzle',
          content: {
            instruction: 'According to ACE-V methodology, what must happen before you can report these as identifications?',
            data: {
              type: 'sequence',
              question: 'Arrange the remaining steps in order:',
              steps: [
                { id: 'document', text: 'Document all identified minutiae', order: 1 },
                { id: 'verify', text: 'Have another qualified examiner independently verify', order: 2 },
                { id: 'report', text: 'Prepare formal report with findings', order: 3 },
                { id: 'testify', text: 'Be prepared to testify about methodology', order: 4 },
              ],
            } as SequencePuzzle,
            successScene: 'chapter-2-complete',
            failScene: 'verification-puzzle-fail',
            hints: ['Verification by a second examiner is a critical step before reporting'],
            points: 20,
          } as PuzzleContent,
        },
        {
          id: 'verification-puzzle-fail',
          type: 'narrative',
          content: {
            text: "Think about the ACE-V process. After you've completed your evaluation, what safeguard ensures accuracy before the findings are reported?",
            speaker: 'Narrator',
            nextScene: 'verification-puzzle',
          } as NarrativeContent,
        },
        {
          id: 'chapter-2-complete',
          type: 'narrative',
          content: {
            text: "Your colleague, Senior Examiner Dr. Patricia Huang, independently verifies both identifications. \"Solid work. Two subjects identified - Vincent Cole and Diane Porter. Time to brief Detective Webb.\"",
            speaker: 'Narrator',
            nextScene: 'chapter-3-start',
          } as NarrativeContent,
        },
      ],
    },
    {
      id: 'chapter-3',
      title: 'Chapter 3: Case Closed',
      scenes: [
        {
          id: 'chapter-3-start',
          type: 'narrative',
          content: {
            text: "Detective Webb is reviewing your report. \"Vincent Cole and Diane Porter - both have priors for financial crimes. Cole served time for safe-cracking. This is exactly the evidence we need.\"",
            speaker: 'Narrator',
            nextScene: 'court-prep',
          } as NarrativeContent,
        },
        {
          id: 'court-prep',
          type: 'info',
          content: {
            title: 'Expert Testimony',
            text: 'As a fingerprint examiner, you may be called to testify about your findings. Preparation is essential:',
            bulletPoints: [
              'Be prepared to explain your methodology in layman\'s terms',
              'Bring documentation of your examination process',
              'Know the limitations of fingerprint evidence',
              'Be prepared for cross-examination challenging your findings',
              'Never overstate your conclusions',
            ],
            nextScene: 'testimony-puzzle',
          } as InfoContent,
        },
        {
          id: 'testimony-puzzle',
          type: 'puzzle',
          content: {
            instruction: 'The defense attorney asks: "Can you say with 100% certainty that Vincent Cole touched that vault handle?" What is the most accurate response?',
            data: {
              type: 'evidence-select',
              question: 'Select the most appropriate answer:',
              items: [
                { id: 'absolute', name: '"Yes, absolutely certain"', description: 'Claiming 100% certainty', isRelevant: false },
                { id: 'accurate', name: '"The fingerprint is identified as Vincent Cole\'s to a reasonable degree of scientific certainty"', description: 'Using proper forensic language', isRelevant: true },
                { id: 'uncertain', name: '"I think it\'s probably his"', description: 'Understating the finding', isRelevant: false },
              ],
              requiredCorrect: 1,
            } as EvidenceSelectPuzzle,
            successScene: 'resolution',
            failScene: 'testimony-puzzle-fail',
            hints: ['Forensic examiners use specific language - neither overstating nor understating findings'],
            points: 25,
          } as PuzzleContent,
        },
        {
          id: 'testimony-puzzle-fail',
          type: 'narrative',
          content: {
            text: "Remember, forensic testimony requires precise language. We never claim absolute certainty, but we also don't understate verified findings. The phrase 'reasonable degree of scientific certainty' is standard.",
            speaker: 'Narrator',
            nextScene: 'testimony-puzzle',
          } as NarrativeContent,
        },
        {
          id: 'resolution',
          type: 'narrative',
          content: {
            text: "Your testimony, combined with additional evidence gathered by detectives, leads to convictions for both Cole and Porter. The bearer bonds are recovered from a storage unit rented under a false name.",
            speaker: 'Narrator',
            nextScene: 'conclusion',
          } as NarrativeContent,
        },
        {
          id: 'conclusion',
          type: 'info',
          content: {
            title: 'Case Completed!',
            text: 'Excellent work solving "The Bank Vault Break-In"! You\'ve demonstrated intermediate fingerprint analysis skills.',
            bulletPoints: [
              'You learned about minutiae types: endings, bifurcations, dots, islands, spurs',
              'You worked with partial prints and assessed evidence quality',
              'You used AFIS while understanding its limitations',
              'You applied proper verification standards',
              'You learned appropriate language for expert testimony',
            ],
            nextScene: 'end',
          } as InfoContent,
        },
      ],
    },
  ],
};

// Case 3: The Serial Burglar (Advanced)
export const serialBurglarCase: CaseStory = {
  id: 'serial-burglar',
  title: 'The Serial Burglar',
  description: 'A series of high-end home invasions terrorize the city. Multiple crime scenes, degraded evidence, and potential contamination make this your most challenging case yet.',
  difficulty: 'advanced',
  estimatedTime: '35-45 min',
  totalPoints: 200,
  chapters: [
    {
      id: 'chapter-1',
      title: 'Chapter 1: Pattern Recognition',
      scenes: [
        {
          id: 'intro',
          type: 'narrative',
          content: {
            text: "Over the past three months, twelve luxury homes have been burglarized in the Riverside district. The thief is meticulous - no forced entry, security systems disabled, only cash and easily fenced items taken. Until now, no usable prints have been recovered.",
            speaker: 'Narrator',
            nextScene: 'breakthrough',
          } as NarrativeContent,
        },
        {
          id: 'breakthrough',
          type: 'narrative',
          content: {
            text: "\"We finally caught a break,\" Detective Angela Torres tells you. \"Last night's victim came home early and interrupted the burglar. In his rush to escape, he left through a window. We've secured the scene - I need your best work on this one.\"",
            speaker: 'Narrator',
            nextScene: 'scene-assessment',
          } as NarrativeContent,
        },
        {
          id: 'scene-assessment',
          type: 'narrative',
          content: {
            text: "The escape window is your primary focus. The wooden frame shows clear contact marks, and the glass has several visible smudges. However, it rained last night, and some moisture has affected the exterior surfaces.",
            speaker: 'Narrator',
            nextScene: 'development-info',
          } as NarrativeContent,
        },
        {
          id: 'development-info',
          type: 'info',
          content: {
            title: 'Advanced Development Techniques',
            text: 'Different surfaces and conditions require different development methods. Choosing the right technique is critical:',
            bulletPoints: [
              'Powder Dusting: Best for smooth, non-porous surfaces. Black powder for light surfaces, white or gray for dark.',
              'Cyanoacrylate (Superglue) Fuming: Creates white residue on prints. Excellent for plastics and difficult surfaces.',
              'Ninhydrin: Reacts with amino acids in sweat. Best for porous surfaces like paper.',
              'DFO (1,8-Diazafluoren-9-one): More sensitive than ninhydrin for paper evidence.',
              'Small Particle Reagent: Works on wet surfaces where powder would fail.',
            ],
            nextScene: 'technique-puzzle',
          } as InfoContent,
        },
        {
          id: 'technique-puzzle',
          type: 'puzzle',
          content: {
            instruction: 'The window has multiple surfaces. Match each surface to its optimal development technique:',
            data: {
              type: 'sequence',
              question: 'Order the techniques for processing (glass first, wet exterior last):',
              steps: [
                { id: 'glass', text: 'Glass interior - Standard powder dusting', order: 1 },
                { id: 'wood-dry', text: 'Dry wood frame - Cyanoacrylate fuming', order: 2 },
                { id: 'paper', text: 'Paper note found nearby - Ninhydrin treatment', order: 3 },
                { id: 'wet', text: 'Wet exterior frame - Small particle reagent', order: 4 },
              ],
            } as SequencePuzzle,
            successScene: 'processing-results',
            failScene: 'technique-puzzle-fail',
            hints: ['Consider the surface type and condition - wet surfaces need special treatment'],
            points: 25,
          } as PuzzleContent,
        },
        {
          id: 'technique-puzzle-fail',
          type: 'narrative',
          content: {
            text: "Think about each surface's properties. Glass is smooth and non-porous. Wood is semi-porous. Paper is fully porous. Wet surfaces can't be powder dusted effectively.",
            speaker: 'Narrator',
            nextScene: 'technique-puzzle',
          } as NarrativeContent,
        },
        {
          id: 'processing-results',
          type: 'narrative',
          content: {
            text: "Your methodical approach yields results: two clear prints from the glass, one partial from the wood frame via superglue fuming, and surprisingly, a complete palm print on a piece of paper that must have blown against the wet exterior.",
            speaker: 'Narrator',
            nextScene: 'palm-info',
          } as NarrativeContent,
        },
        {
          id: 'palm-info',
          type: 'info',
          content: {
            title: 'Palm Print Analysis',
            text: 'Palm prints contain the same ridge characteristics as fingerprints and are equally unique. They can provide valuable identification evidence:',
            bulletPoints: [
              'Palm prints cover a larger area with more minutiae than fingerprints',
              'Divided into regions: thenar (thumb side), hypothenar (pinky side), and interdigital (below fingers)',
              'Same ACE-V methodology applies',
              'Often overlooked by criminals who focus only on fingertips',
              'AFIS systems now include palm print databases',
            ],
            nextScene: 'chapter-1-complete',
          } as InfoContent,
        },
        {
          id: 'chapter-1-complete',
          type: 'narrative',
          content: {
            text: "\"Four prints including a palm - that's more evidence than all eleven previous scenes combined. Let's get these analyzed and see if our burglar is in the system.\"",
            speaker: 'Detective Torres',
            nextScene: 'chapter-2-start',
          } as NarrativeContent,
        },
      ],
    },
    {
      id: 'chapter-2',
      title: 'Chapter 2: Connecting the Cases',
      scenes: [
        {
          id: 'chapter-2-start',
          type: 'narrative',
          content: {
            text: "AFIS produces a hit on the palm print: Derek Simmons, arrested five years ago for possession of burglary tools but never convicted. More importantly, you notice something in the fingerprint patterns that reminds you of evidence from an earlier case.",
            speaker: 'Narrator',
            nextScene: 'cold-case-info',
          } as NarrativeContent,
        },
        {
          id: 'cold-case-info',
          type: 'info',
          content: {
            title: 'Cold Case Analysis',
            text: 'Linking cases through fingerprint evidence requires careful documentation and comparison:',
            bulletPoints: [
              'Fingerprints don\'t change over time (except scarring or injury)',
              'Previously unidentified prints should be periodically re-searched',
              'Pattern class can help quickly eliminate non-matches',
              'Core and delta positions are consistent across impressions',
              'Serial criminals may be linked across jurisdictions',
            ],
            nextScene: 'pattern-analysis',
          } as InfoContent,
        },
        {
          id: 'pattern-analysis',
          type: 'narrative',
          content: {
            text: "You pull the unidentified prints from three earlier burglaries. One shows a distinctive tented arch - a relatively rare pattern type. If Simmons has a tented arch, it could link him to multiple scenes.",
            speaker: 'Narrator',
            nextScene: 'tented-arch-info',
          } as NarrativeContent,
        },
        {
          id: 'tented-arch-info',
          type: 'info',
          content: {
            title: 'Tented Arch Classification',
            text: 'Tented arches are a subtype of the arch pattern, more angular than plain arches:',
            bulletPoints: [
              'Ridges rise sharply at the center, forming a tent-like spike',
              'May have a partial loop appearance but lacks the recurving ridge',
              'Often has a core-like structure but no true delta',
              'Only about 1-2% of all fingerprint patterns',
              'Can be misclassified as loops if not carefully examined',
            ],
            nextScene: 'classification-puzzle',
          } as InfoContent,
        },
        {
          id: 'classification-puzzle',
          type: 'puzzle',
          content: {
            instruction: 'You\'re examining prints from the older case files. Based on the description, classify this print: "Ridges flow from left to right with a sharp upward spike in the center. No recurving ridges or clear deltas."',
            data: {
              type: 'pattern-match',
              targetPattern: 'tented-arch',
              question: 'What pattern type is this fingerprint?',
              options: [
                { id: 'opt-plain-arch', pattern: 'arch', label: 'Plain Arch - Smooth wave with no spike' },
                { id: 'opt-tented', pattern: 'tented-arch', label: 'Tented Arch - Sharp spike, no recurve' },
                { id: 'opt-loop', pattern: 'loop', label: 'Loop - Recurving ridges with one delta' },
                { id: 'opt-whorl', pattern: 'whorl', label: 'Whorl - Circular pattern with two deltas' },
              ],
              correctId: 'opt-tented',
            } as PatternMatchPuzzle,
            successScene: 'simmons-prints',
            failScene: 'classification-puzzle-fail',
            hints: ['Sharp upward spike but no recurving - what does that indicate?'],
            points: 25,
          } as PuzzleContent,
        },
        {
          id: 'classification-puzzle-fail',
          type: 'narrative',
          content: {
            text: "Focus on the key characteristics: there's a sharp spike (not a smooth wave like plain arch), but no recurving ridges (unlike a loop) and no clear deltas (unlike a whorl).",
            speaker: 'Narrator',
            nextScene: 'classification-puzzle',
          } as NarrativeContent,
        },
        {
          id: 'simmons-prints',
          type: 'narrative',
          content: {
            text: "Checking Derek Simmons' ten-print card from his prior arrest, you confirm he has a tented arch on his right index finger. Now you must perform a detailed comparison to link him to the earlier burglaries.",
            speaker: 'Narrator',
            nextScene: 'comparison-challenge',
          } as NarrativeContent,
        },
        {
          id: 'comparison-challenge',
          type: 'info',
          content: {
            title: 'Challenging Comparisons',
            text: 'Not all comparisons are straightforward. Several factors can complicate analysis:',
            bulletPoints: [
              'Pressure distortion: Light pressure spreads ridges, heavy pressure compresses them',
              'Skin condition: Dry skin may show broken ridges, wet skin may smear',
              'Surface texture: Rough surfaces can create artifacts',
              'Aging: Old latent prints may show some deterioration',
              'Development quality: Over or under-developed prints may obscure details',
            ],
            nextScene: 'distortion-puzzle',
          } as InfoContent,
        },
        {
          id: 'distortion-puzzle',
          type: 'puzzle',
          content: {
            instruction: 'The old latent print appears slightly narrower than Simmons\' known print. What is the most likely explanation?',
            data: {
              type: 'evidence-select',
              question: 'Select the most likely explanation:',
              items: [
                { id: 'different-person', name: 'Different Person', description: 'The prints are from different individuals', isRelevant: false },
                { id: 'pressure', name: 'Pressure Variation', description: 'The latent was made with lighter pressure, causing narrower appearance', isRelevant: true },
                { id: 'growth', name: 'Finger Growth', description: 'The suspect\'s fingers have grown since the old print', isRelevant: false },
              ],
              requiredCorrect: 1,
            } as EvidenceSelectPuzzle,
            successScene: 'chapter-2-complete',
            failScene: 'distortion-puzzle-fail',
            hints: ['Ridge patterns don\'t change, but their appearance can vary based on how the print was made'],
            points: 25,
          } as PuzzleContent,
        },
        {
          id: 'distortion-puzzle-fail',
          type: 'narrative',
          content: {
            text: "Remember, fingerprint ridge patterns are permanent. Width differences are usually due to pressure - lighter pressure creates a narrower impression while heavier pressure spreads the ridges.",
            speaker: 'Narrator',
            nextScene: 'distortion-puzzle',
          } as NarrativeContent,
        },
        {
          id: 'chapter-2-complete',
          type: 'narrative',
          content: {
            text: "After accounting for pressure distortion, you identify 14 corresponding minutiae between the cold case print and Simmons' known print. The tented arch from three burglaries all match. You've linked Simmons to at least four of the twelve break-ins.",
            speaker: 'Narrator',
            nextScene: 'chapter-3-start',
          } as NarrativeContent,
        },
      ],
    },
    {
      id: 'chapter-3',
      title: 'Chapter 3: The Accomplice',
      scenes: [
        {
          id: 'chapter-3-start',
          type: 'narrative',
          content: {
            text: "Detective Torres has a concern: \"Simmons' prints are at four scenes, but we have unidentified prints at three others that don't match him. Different finger, different pattern - possibly an accomplice.\"",
            speaker: 'Narrator',
            nextScene: 'second-suspect-info',
          } as NarrativeContent,
        },
        {
          id: 'second-suspect-info',
          type: 'info',
          content: {
            title: 'Handling Multiple Unknown Sources',
            text: 'When evidence suggests multiple perpetrators, careful organization is essential:',
            bulletPoints: [
              'Maintain separate files for each unknown source',
              'Document which scenes each source appears at',
              'Look for patterns in scene selection that might indicate roles',
              'Consider whether unknowns could be victims or authorized persons',
              'Cross-reference with elimination prints from homeowners/staff',
            ],
            nextScene: 'elimination-info',
          } as InfoContent,
        },
        {
          id: 'elimination-info',
          type: 'info',
          content: {
            title: 'Elimination Prints',
            text: 'Before attributing prints to a suspect, legitimate sources must be eliminated:',
            bulletPoints: [
              'Homeowners and residents must provide elimination prints',
              'Regular service personnel (cleaners, maintenance) should be printed',
              'Responding officers should be printed if they touched surfaces',
              'Real estate agents or contractors may have legitimate access',
              'Failure to eliminate can lead to false accusations',
            ],
            nextScene: 'contamination-puzzle',
          } as NarrativeContent,
        },
        {
          id: 'contamination-puzzle',
          type: 'puzzle',
          content: {
            instruction: 'A latent print was found at a burglary scene. Which of these would NOT require an elimination comparison?',
            data: {
              type: 'evidence-select',
              question: 'Select the person who would NOT need to provide elimination prints:',
              items: [
                { id: 'homeowner', name: 'Homeowner', description: 'Lives in the residence', isRelevant: false },
                { id: 'delivery', name: 'Delivery Driver', description: 'Documented delivery to the address day before', isRelevant: false },
                { id: 'neighbor', name: 'Neighbor (never visited)', description: 'Lives next door but has never been inside', isRelevant: true },
                { id: 'officer', name: 'First Responding Officer', description: 'Secured the scene', isRelevant: false },
              ],
              requiredCorrect: 1,
            } as EvidenceSelectPuzzle,
            successScene: 'second-suspect-search',
            failScene: 'contamination-puzzle-fail',
            hints: ['Think about who could have legitimately touched surfaces inside the home'],
            points: 25,
          } as PuzzleContent,
        },
        {
          id: 'contamination-puzzle-fail',
          type: 'narrative',
          content: {
            text: "Consider physical access. Anyone who has been inside the home legitimately could have left prints. Someone who has never entered doesn't need elimination.",
            speaker: 'Narrator',
            nextScene: 'contamination-puzzle',
          } as NarrativeContent,
        },
        {
          id: 'second-suspect-search',
          type: 'narrative',
          content: {
            text: "After eliminating legitimate prints, the unknown set remains unidentified. Detective Torres suggests searching Simmons' known associates. You submit the prints for an expanded AFIS search including associated persons.",
            speaker: 'Narrator',
            nextScene: 'associate-found',
          } as NarrativeContent,
        },
        {
          id: 'associate-found',
          type: 'narrative',
          content: {
            text: "Match found: Crystal Reyes, Simmons' girlfriend, was arrested last year for retail theft. Her loop pattern prints match the unknown evidence from three scenes. Both subjects' prints appear together at two of those scenes.",
            speaker: 'Narrator',
            nextScene: 'final-analysis',
          } as NarrativeContent,
        },
        {
          id: 'final-analysis',
          type: 'puzzle',
          content: {
            instruction: 'Reviewing all the fingerprint evidence, what can you definitively conclude?',
            data: {
              type: 'evidence-select',
              question: 'Select ALL conclusions supported by the fingerprint evidence:',
              items: [
                { id: 'simmons-present', name: 'Derek Simmons was present at 4 scenes', description: 'His prints were identified at 4 locations', isRelevant: true },
                { id: 'reyes-present', name: 'Crystal Reyes was present at 3 scenes', description: 'Her prints were identified at 3 locations', isRelevant: true },
                { id: 'accomplice', name: 'They definitely worked together', description: 'Their prints appear together at some scenes', isRelevant: false },
                { id: 'timing', name: 'They were there at the same time', description: 'Prints prove simultaneous presence', isRelevant: false },
              ],
              requiredCorrect: 2,
            } as EvidenceSelectPuzzle,
            successScene: 'case-presentation',
            failScene: 'final-analysis-fail',
            hints: ['Fingerprints prove someone touched something, but what can\'t they prove about timing?'],
            points: 30,
          } as PuzzleContent,
        },
        {
          id: 'final-analysis-fail',
          type: 'narrative',
          content: {
            text: "Be careful about overreaching. Fingerprints prove physical contact, but they cannot determine when contact occurred. Both subjects could have been at a scene at different times.",
            speaker: 'Narrator',
            nextScene: 'final-analysis',
          } as NarrativeContent,
        },
        {
          id: 'case-presentation',
          type: 'narrative',
          content: {
            text: "You present your findings precisely: both Simmons and Reyes left prints at multiple burglary scenes. Combined with Detective Torres' other evidence - cell phone records, pawn shop footage, and the interrupted burglary witness - charges are filed against both suspects.",
            speaker: 'Narrator',
            nextScene: 'conclusion',
          } as NarrativeContent,
        },
        {
          id: 'conclusion',
          type: 'info',
          content: {
            title: 'Case Completed!',
            text: 'Outstanding work on "The Serial Burglar"! You\'ve demonstrated advanced fingerprint analysis skills.',
            bulletPoints: [
              'You selected appropriate development techniques for various surfaces',
              'You successfully analyzed palm print evidence',
              'You linked cold case evidence to a known subject',
              'You accounted for pressure distortion in comparisons',
              'You understood the importance of elimination prints',
              'You recognized the limitations of fingerprint evidence regarding timing',
            ],
            nextScene: 'end',
          } as InfoContent,
        },
      ],
    },
  ],
};

// Case 4: The Counterfeit Ring (Intermediate)
export const counterfeitCase: CaseStory = {
  id: 'counterfeit-ring',
  title: 'The Counterfeit Ring',
  description: 'Fake designer goods flooding the market lead to a sophisticated counterfeiting operation. Fingerprints on packaging and documents hold the key to dismantling the network.',
  difficulty: 'intermediate',
  estimatedTime: '20-25 min',
  totalPoints: 125,
  chapters: [
    {
      id: 'chapter-1',
      title: 'Chapter 1: Following the Trail',
      scenes: [
        {
          id: 'intro',
          type: 'narrative',
          content: {
            text: "Customs has intercepted a shipping container filled with counterfeit luxury handbags, watches, and electronics. The estimated street value: $4 million. Agent Lisa Park from Homeland Security needs your help to identify the manufacturers.",
            speaker: 'Narrator',
            nextScene: 'evidence-overview',
          } as NarrativeContent,
        },
        {
          id: 'evidence-overview',
          type: 'narrative',
          content: {
            text: "\"We've traced the container to a warehouse in the industrial district, but it was empty when we got there. However, this container is full of packaging materials, invoices, and the products themselves. Somewhere in here are the prints we need.\"",
            speaker: 'Agent Park',
            nextScene: 'porous-info',
          } as NarrativeContent,
        },
        {
          id: 'porous-info',
          type: 'info',
          content: {
            title: 'Fingerprints on Porous Surfaces',
            text: 'Paper and cardboard are porous - they absorb the oils and amino acids from fingerprints differently than glass or plastic:',
            bulletPoints: [
              'Fingerprint residue seeps into the fibers over time',
              'Standard powder dusting is less effective on paper',
              'Chemical treatments (ninhydrin, DFO) react with amino acids',
              'Prints can be developed days, weeks, or even years after deposit',
              'Paper condition affects results - wet or degraded paper is challenging',
            ],
            nextScene: 'chemical-info',
          } as InfoContent,
        },
        {
          id: 'chemical-info',
          type: 'info',
          content: {
            title: 'Chemical Development Methods',
            text: 'For porous surfaces, chemical methods are preferred over powder dusting:',
            bulletPoints: [
              'Ninhydrin: Reacts with amino acids to produce a purple color (Ruhemann\'s purple)',
              'DFO (1,8-Diazafluoren-9-one): More sensitive than ninhydrin, fluoresces under laser',
              'Physical Developer (PD): Works on wet paper, detects sebaceous (oil) deposits',
              'Iodine Fuming: Old technique, produces temporary brown prints',
              'Processing sequence matters - some chemicals block others',
            ],
            nextScene: 'sequence-puzzle',
          } as InfoContent,
        },
        {
          id: 'sequence-puzzle',
          type: 'puzzle',
          content: {
            instruction: 'You have shipping invoices to process. What is the recommended sequence for chemical treatment of paper evidence?',
            data: {
              type: 'sequence',
              question: 'Arrange the treatments in the correct processing order:',
              steps: [
                { id: 'visual', text: 'Visual examination and photography', order: 1 },
                { id: 'dfo', text: 'DFO treatment (most sensitive, least destructive)', order: 2 },
                { id: 'ninhydrin', text: 'Ninhydrin treatment', order: 3 },
                { id: 'pd', text: 'Physical Developer (last resort, blocks other methods)', order: 4 },
              ],
            } as SequencePuzzle,
            successScene: 'development-results',
            failScene: 'sequence-puzzle-fail',
            hints: ['Start with non-destructive methods and progress to more aggressive treatments'],
            points: 20,
          } as PuzzleContent,
        },
        {
          id: 'sequence-puzzle-fail',
          type: 'narrative',
          content: {
            text: "Remember: always start with visual examination, then proceed from least to most destructive methods. Some chemicals can prevent subsequent treatments from working.",
            speaker: 'Narrator',
            nextScene: 'sequence-puzzle',
          } as NarrativeContent,
        },
        {
          id: 'development-results',
          type: 'narrative',
          content: {
            text: "After DFO treatment under laser illumination, multiple prints fluoresce on the invoices. You also process the product packaging using cyanoacrylate fuming, revealing prints on the plastic bags and cardboard boxes.",
            speaker: 'Narrator',
            nextScene: 'chapter-1-complete',
          } as NarrativeContent,
        },
        {
          id: 'chapter-1-complete',
          type: 'narrative',
          content: {
            text: "\"Excellent work. We've got prints from what looks like at least three different people. Let's see if any of them are in the system.\"",
            speaker: 'Agent Park',
            nextScene: 'chapter-2-start',
          } as NarrativeContent,
        },
      ],
    },
    {
      id: 'chapter-2',
      title: 'Chapter 2: Building the Network',
      scenes: [
        {
          id: 'chapter-2-start',
          type: 'narrative',
          content: {
            text: "AFIS identifies two of the three print sources: Marcus Chen and Yuki Tanaka, both with prior arrests for intellectual property crimes. The third remains unknown - possibly someone without a criminal record.",
            speaker: 'Narrator',
            nextScene: 'network-info',
          } as NarrativeContent,
        },
        {
          id: 'network-info',
          type: 'info',
          content: {
            title: 'Fingerprint Distribution Analysis',
            text: 'Analyzing where different prints appear can reveal organizational structure:',
            bulletPoints: [
              'Prints on manufacturing equipment suggest hands-on production role',
              'Prints on invoices/shipping docs suggest management or logistics role',
              'Prints only on finished products suggest packaging or quality control',
              'Distribution patterns can indicate hierarchy within criminal organizations',
              'Absence of prints may indicate awareness of forensic detection',
            ],
            nextScene: 'role-puzzle',
          } as InfoContent,
        },
        {
          id: 'role-puzzle',
          type: 'puzzle',
          content: {
            instruction: 'Based on where their prints were found, determine each person\'s likely role:',
            data: {
              type: 'evidence-select',
              question: 'Marcus Chen\'s prints were found on invoices, shipping labels, and customs forms. His likely role is:',
              items: [
                { id: 'logistics', name: 'Logistics Coordinator', description: 'Handles shipping and documentation', isRelevant: true },
                { id: 'manufacturer', name: 'Product Manufacturer', description: 'Makes the counterfeit goods', isRelevant: false },
                { id: 'packager', name: 'Packager', description: 'Packages finished products', isRelevant: false },
              ],
              requiredCorrect: 1,
            } as EvidenceSelectPuzzle,
            successScene: 'second-role',
            failScene: 'role-puzzle-fail',
            hints: ['Think about what documents a logistics person would handle vs. a manufacturer'],
            points: 20,
          } as PuzzleContent,
        },
        {
          id: 'role-puzzle-fail',
          type: 'narrative',
          content: {
            text: "Consider what each document type represents. Invoices, shipping labels, and customs forms are all part of moving goods, not making them.",
            speaker: 'Narrator',
            nextScene: 'role-puzzle',
          } as NarrativeContent,
        },
        {
          id: 'second-role',
          type: 'narrative',
          content: {
            text: "Yuki Tanaka's prints appear on the interior of product boxes and on quality control checklists. The unknown subject's prints are on tools, dye samples, and unfinished products - clearly the manufacturer.",
            speaker: 'Narrator',
            nextScene: 'unknown-source',
          } as NarrativeContent,
        },
        {
          id: 'unknown-source',
          type: 'info',
          content: {
            title: 'Identifying Unknown Subjects',
            text: 'When AFIS doesn\'t produce a match, alternative methods may help identify the subject:',
            bulletPoints: [
              'Search international databases through Interpol',
              'Check immigration records for foreign nationals',
              'Obtain prints from known associates for comparison',
              'Serve subpoenas for employment records that may include prints',
              'Wait for the subject to enter the system through arrest or application',
            ],
            nextScene: 'associate-prints',
          } as InfoContent,
        },
        {
          id: 'associate-prints',
          type: 'narrative',
          content: {
            text: "Agent Park obtains employment records from Chen and Tanaka's legitimate businesses. One employee, David Wei, provided prints for a background check. You compare them to your unknown - it's a match.",
            speaker: 'Narrator',
            nextScene: 'chapter-2-complete',
          } as NarrativeContent,
        },
        {
          id: 'chapter-2-complete',
          type: 'narrative',
          content: {
            text: "\"Three suspects identified: Chen on logistics, Tanaka on quality control, and Wei on manufacturing. Your fingerprint analysis has mapped out their entire operation.\"",
            speaker: 'Agent Park',
            nextScene: 'chapter-3-start',
          } as NarrativeContent,
        },
      ],
    },
    {
      id: 'chapter-3',
      title: 'Chapter 3: Taking Them Down',
      scenes: [
        {
          id: 'chapter-3-start',
          type: 'narrative',
          content: {
            text: "Agents execute search warrants at three locations simultaneously. You're at Wei's manufacturing facility, documenting additional fingerprint evidence to strengthen the case.",
            speaker: 'Narrator',
            nextScene: 'scene-documentation',
          } as NarrativeContent,
        },
        {
          id: 'scene-documentation',
          type: 'info',
          content: {
            title: 'Crime Scene Documentation',
            text: 'Proper documentation is essential for evidence to be admissible in court:',
            bulletPoints: [
              'Photograph prints in place before collection',
              'Include a scale ruler for accurate size reference',
              'Document the exact location with sketches and measurements',
              'Maintain chain of custody from discovery to court',
              'Note environmental conditions that may affect evidence',
            ],
            nextScene: 'documentation-puzzle',
          } as InfoContent,
        },
        {
          id: 'documentation-puzzle',
          type: 'puzzle',
          content: {
            instruction: 'You find a clear print on a dye mixing machine. Put the documentation steps in order:',
            data: {
              type: 'sequence',
              question: 'Arrange the documentation steps correctly:',
              steps: [
                { id: 'photograph', text: 'Photograph the print in place with scale', order: 1 },
                { id: 'document', text: 'Record location and orientation in notes', order: 2 },
                { id: 'collect', text: 'Lift the print using appropriate technique', order: 3 },
                { id: 'package', text: 'Package and label with case information', order: 4 },
              ],
            } as SequencePuzzle,
            successScene: 'additional-evidence',
            failScene: 'documentation-puzzle-fail',
            hints: ['Always document evidence in place before moving or collecting it'],
            points: 20,
          } as PuzzleContent,
        },
        {
          id: 'documentation-puzzle-fail',
          type: 'narrative',
          content: {
            text: "Remember: photograph first, document, then collect. If you collect before photographing, you lose the ability to show where evidence was found.",
            speaker: 'Narrator',
            nextScene: 'documentation-puzzle',
          } as NarrativeContent,
        },
        {
          id: 'additional-evidence',
          type: 'narrative',
          content: {
            text: "Your thorough processing reveals Wei's prints throughout the manufacturing area, plus a surprise - Chen's prints on a hidden ledger book showing profits and payments. He wasn't just handling logistics; he was running the finances.",
            speaker: 'Narrator',
            nextScene: 'final-report',
          } as NarrativeContent,
        },
        {
          id: 'final-report',
          type: 'puzzle',
          content: {
            instruction: 'You\'re preparing your official report. Which statement best represents your fingerprint findings?',
            data: {
              type: 'evidence-select',
              question: 'Select the most accurate summary for your report:',
              items: [
                { id: 'proves-guilt', name: '"Fingerprints prove all three subjects are guilty of counterfeiting"', description: 'Stating guilt based on prints alone', isRelevant: false },
                { id: 'accurate', name: '"Fingerprints place all three subjects in contact with counterfeiting evidence"', description: 'Accurate statement of what prints prove', isRelevant: true },
                { id: 'leader', name: '"Chen\'s prints prove he was the organization\'s leader"', description: 'Inferring organizational role from prints', isRelevant: false },
              ],
              requiredCorrect: 1,
            } as EvidenceSelectPuzzle,
            successScene: 'conclusion',
            failScene: 'final-report-fail',
            hints: ['Fingerprints prove physical contact - what else they prove requires additional evidence'],
            points: 20,
          } as PuzzleContent,
        },
        {
          id: 'final-report-fail',
          type: 'narrative',
          content: {
            text: "Be careful not to overstate your findings. Fingerprints prove someone touched something - guilt, roles, and intent require additional evidence beyond your scope.",
            speaker: 'Narrator',
            nextScene: 'final-report',
          } as NarrativeContent,
        },
        {
          id: 'conclusion',
          type: 'info',
          content: {
            title: 'Case Completed!',
            text: 'Great work on "The Counterfeit Ring"! Your analysis helped dismantle an international counterfeiting operation.',
            bulletPoints: [
              'You learned chemical development methods for porous surfaces',
              'You understood the correct sequence for paper processing',
              'You used print distribution to analyze organizational roles',
              'You practiced proper documentation procedures',
              'You demonstrated accurate reporting of fingerprint evidence',
            ],
            nextScene: 'end',
          } as InfoContent,
        },
      ],
    },
  ],
};

// All available cases
export const learningCases: CaseStory[] = [demoCase, bankVaultCase, serialBurglarCase, counterfeitCase];

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
