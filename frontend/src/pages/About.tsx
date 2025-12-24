import { useState } from 'react';
import {
  InformationCircleIcon,
  FingerPrintIcon,
  AcademicCapIcon,
  BeakerIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import ClarioLogo from '../components/ClarioLogo';

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function AccordionItem({ title, children, defaultOpen = false }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 sm:px-6 py-4 flex items-center justify-between bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <span className="font-semibold text-gray-900 dark:text-white">{title}</span>
        {isOpen ? (
          <ChevronUpIcon className="h-5 w-5 text-gray-500 dark:text-zinc-400" />
        ) : (
          <ChevronDownIcon className="h-5 w-5 text-gray-500 dark:text-zinc-400" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 sm:px-6 py-4 bg-white dark:bg-zinc-900">
          {children}
        </div>
      )}
    </div>
  );
}

interface PatternCardProps {
  name: string;
  frequency: string;
  description: string;
  characteristics: string[];
  svgPattern: React.ReactNode;
}

function PatternCard({ name, frequency, description, characteristics, svgPattern }: PatternCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 p-4 sm:p-6 hover:shadow-lg transition-shadow">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
          {svgPattern}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-2 mb-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{name}</h3>
            <span className="px-2 py-0.5 text-xs font-medium bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full">
              {frequency}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-zinc-400 mb-3">{description}</p>
          <ul className="space-y-1">
            {characteristics.map((char, i) => (
              <li key={i} className="flex items-center justify-center sm:justify-start gap-2 text-sm text-gray-500 dark:text-zinc-500">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                {char}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// SVG Pattern Components
function ArchPattern() {
  return (
    <svg viewBox="0 0 60 60" className="w-16 h-16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M 10 45 Q 30 15 50 45" className="text-teal-500" />
      <path d="M 12 48 Q 30 22 48 48" className="text-teal-400" />
      <path d="M 14 51 Q 30 29 46 51" className="text-teal-300" />
      <path d="M 16 54 Q 30 36 44 54" className="text-teal-200" />
    </svg>
  );
}

function TentedArchPattern() {
  return (
    <svg viewBox="0 0 60 60" className="w-16 h-16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M 10 50 Q 20 30 30 15 Q 40 30 50 50" className="text-teal-500" />
      <path d="M 12 52 Q 22 35 30 22 Q 38 35 48 52" className="text-teal-400" />
      <path d="M 14 54 Q 24 40 30 30 Q 36 40 46 54" className="text-teal-300" />
    </svg>
  );
}

function LoopPattern() {
  return (
    <svg viewBox="0 0 60 60" className="w-16 h-16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M 10 50 Q 10 20 30 20 Q 45 20 45 35 Q 45 45 30 45 Q 20 45 20 35" className="text-teal-500" />
      <path d="M 12 52 Q 12 25 30 25 Q 42 25 42 35 Q 42 42 32 42" className="text-teal-400" />
      <path d="M 14 54 Q 14 30 30 30 Q 38 30 38 35" className="text-teal-300" />
    </svg>
  );
}

function WhorlPattern() {
  return (
    <svg viewBox="0 0 60 60" className="w-16 h-16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="30" cy="30" r="5" className="text-teal-500" />
      <circle cx="30" cy="30" r="10" className="text-teal-400" />
      <circle cx="30" cy="30" r="15" className="text-teal-300" />
      <circle cx="30" cy="30" r="20" className="text-teal-200" />
    </svg>
  );
}

function CompositePattern() {
  return (
    <svg viewBox="0 0 60 60" className="w-16 h-16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M 15 45 Q 15 25 30 25 Q 40 25 40 35 Q 40 42 30 42" className="text-teal-500" />
      <path d="M 45 45 Q 45 25 30 25 Q 20 25 20 35 Q 20 42 30 42" className="text-cyan-500" />
      <circle cx="30" cy="35" r="5" className="text-teal-300" />
    </svg>
  );
}

export default function About() {
  const [activeTab, setActiveTab] = useState<'overview' | 'patterns' | 'formation' | 'forensics' | 'app'>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: InformationCircleIcon },
    { id: 'patterns', label: 'Pattern Types', icon: FingerPrintIcon },
    { id: 'formation', label: 'Formation', icon: BeakerIcon },
    { id: 'forensics', label: 'Forensics', icon: ShieldCheckIcon },
    { id: 'app', label: 'About Clario', icon: SparklesIcon },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-2xl mb-4">
          <AcademicCapIcon className="h-8 w-8 text-teal-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Fingerprint Science & Clario
        </h1>
        <p className="text-gray-600 dark:text-zinc-400 max-w-2xl mx-auto">
          Learn about the fascinating science behind fingerprints, their formation, classification,
          and how they're used in forensic identification.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap justify-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all
              ${activeTab === tab.id
                ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25'
                : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
              }
            `}
          >
            <tab.icon className="h-5 w-5" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-700 p-4 sm:p-6 lg:p-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="prose dark:prose-invert max-w-none">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">What Are Fingerprints?</h2>
              <p className="text-gray-600 dark:text-zinc-400 leading-relaxed">
                Fingerprints are the unique patterns of friction ridges on the tips of our fingers. These intricate
                patterns are formed by raised portions of the epidermis called <strong>friction ridges</strong>,
                separated by <strong>furrows</strong> (valleys). The ridges contain pores connected to sweat glands
                beneath the skin surface.
              </p>

              <div className="grid md:grid-cols-3 gap-4 my-6">
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-teal-200 dark:border-teal-800">
                  <h4 className="font-bold text-teal-700 dark:text-teal-300 mb-2">Unique</h4>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">
                    No two fingerprints are identical, even among identical twins. The probability of two people
                    sharing the same fingerprint is approximately 1 in 64 billion.
                  </p>
                </div>
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-cyan-200 dark:border-cyan-800">
                  <h4 className="font-bold text-cyan-700 dark:text-cyan-300 mb-2">Permanent</h4>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">
                    Fingerprints remain unchanged throughout a person's lifetime, from before birth until
                    decomposition after death.
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-2">Universal</h4>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">
                    All humans have fingerprints (except in rare genetic conditions like adermatoglyphia),
                    making them ideal for identification.
                  </p>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">Three Levels of Detail</h3>
              <p className="text-gray-600 dark:text-zinc-400 mb-4">
                Fingerprint examination occurs at three levels of increasing detail:
              </p>

              <div className="space-y-4">
                <div className="flex gap-3 sm:gap-4 items-start">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-sm sm:text-base text-teal-600 dark:text-teal-400">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Level 1 - Pattern Type</h4>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">
                      The overall ridge flow forming loops, whorls, or arches. Visible to the naked eye
                      and used for initial classification.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 sm:gap-4 items-start">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-sm sm:text-base text-cyan-600 dark:text-cyan-400">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Level 2 - Minutiae Points</h4>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">
                      Individual ridge characteristics like ridge endings, bifurcations (splits), dots,
                      islands, and bridges. These are the primary features used for identification.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 sm:gap-4 items-start">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-sm sm:text-base text-blue-600 dark:text-blue-400">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Level 3 - Pores & Ridge Shape</h4>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">
                      Microscopic details including pore positions, ridge edge contours, and incipient ridges.
                      Requires high-resolution imaging for analysis.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'patterns' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Fingerprint Pattern Types</h2>
              <p className="text-gray-600 dark:text-zinc-400 mb-6">
                Fingerprints are classified into three main pattern groups: Arches, Loops, and Whorls.
                These are further divided into subtypes based on specific characteristics.
              </p>
            </div>

            <div className="grid gap-4">
              <PatternCard
                name="Plain Arch"
                frequency="~5% of population"
                description="The simplest pattern where ridges enter from one side, rise in the center, and exit on the opposite side in a wave-like pattern."
                characteristics={[
                  'No delta points present',
                  'Ridges flow smoothly from side to side',
                  'Resembles a gentle hill or wave',
                  'Least common pattern type',
                ]}
                svgPattern={<ArchPattern />}
              />

              <PatternCard
                name="Tented Arch"
                frequency="~1% of population"
                description="Similar to plain arch but with ridges that meet at a sharp point or 'tent' in the center, creating a more angular appearance."
                characteristics={[
                  'Has one delta point',
                  'Sharp upthrust in the center',
                  'Ridges form a tent-like shape',
                  'Rarest pattern subtype',
                ]}
                svgPattern={<TentedArchPattern />}
              />

              <PatternCard
                name="Loop (Ulnar & Radial)"
                frequency="~60-65% of population"
                description="Ridges enter from one side, curve around (recurve), and exit from the same side. Named by the direction of the loop opening."
                characteristics={[
                  'Has one delta point',
                  'Contains a core (center of recurve)',
                  'Ulnar loops open toward pinky finger (~60%)',
                  'Radial loops open toward thumb (~5%)',
                ]}
                svgPattern={<LoopPattern />}
              />

              <PatternCard
                name="Whorl (Plain, Central Pocket, Double Loop, Accidental)"
                frequency="~30-35% of population"
                description="Circular or spiral patterns where ridges make a complete circuit. Includes several subtypes based on ridge arrangement."
                characteristics={[
                  'Has two or more delta points',
                  'Contains at least one recurving ridge',
                  'Plain whorl: circular/spiral pattern',
                  'Central pocket: small whorl within loop',
                  'Double loop: two separate loop formations',
                ]}
                svgPattern={<WhorlPattern />}
              />

              <PatternCard
                name="Composite/Accidental"
                frequency="<1% of population"
                description="Complex patterns that combine elements of arches, loops, and whorls, or don't fit into standard classifications."
                characteristics={[
                  'Contains two or more pattern types',
                  'May have multiple deltas and cores',
                  'Extremely rare and highly distinctive',
                  'Requires expert analysis for classification',
                ]}
                svgPattern={<CompositePattern />}
              />
            </div>

            {/* Minutiae Types */}
            <div className="mt-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Minutiae (Level 2 Details)</h3>
              <p className="text-gray-600 dark:text-zinc-400 mb-4">
                Minutiae are the specific points where ridge characteristics occur. They are crucial for
                fingerprint matching and identification.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Ridge Ending', desc: 'A ridge that abruptly terminates' },
                  { name: 'Bifurcation', desc: 'A single ridge that splits into two' },
                  { name: 'Short Ridge (Island)', desc: 'A ridge significantly shorter than average' },
                  { name: 'Dot', desc: 'An isolated ridge unit about as wide as it is long' },
                  { name: 'Bridge', desc: 'A short ridge connecting two parallel ridges' },
                  { name: 'Spur', desc: 'A bifurcation with one short branch' },
                  { name: 'Crossover', desc: 'Two ridges that cross each other' },
                  { name: 'Lake (Enclosure)', desc: 'A ridge that bifurcates and rejoins' },
                  { name: 'Delta', desc: 'Point where three ridge systems meet' },
                ].map((item, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{item.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'formation' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">How Fingerprints Form</h2>

            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-teal-200 dark:border-teal-800 mb-6">
              <p className="text-gray-700 dark:text-zinc-300 leading-relaxed">
                Fingerprints begin forming in the womb around <strong>weeks 10-16 of gestation</strong>.
                The final pattern is determined by a complex interplay of genetic and environmental factors
                during fetal development. By week 17, the patterns are fully formed and remain unchanged
                for life.
              </p>
            </div>

            <div className="space-y-4">
              <AccordionItem title="Week 10-13: Volar Pad Development" defaultOpen>
                <p className="text-gray-600 dark:text-zinc-400 mb-3">
                  Small mounds called <strong>volar pads</strong> develop on the fingertips, palms, and
                  soles. These pads are composed of mesenchymal tissue covered by the epidermis.
                </p>
                <ul className="list-disc list-inside text-sm text-gray-500 dark:text-zinc-500 space-y-1">
                  <li>Volar pads reach maximum size around week 13</li>
                  <li>The size and shape of these pads influence the final pattern</li>
                  <li>Large, round pads tend to produce whorls</li>
                  <li>Smaller, asymmetric pads tend to produce loops</li>
                </ul>
              </AccordionItem>

              <AccordionItem title="Week 13-16: Ridge Formation">
                <p className="text-gray-600 dark:text-zinc-400 mb-3">
                  As the volar pads begin to regress (shrink), friction ridges start forming. The basal
                  layer of the epidermis folds into the dermis, creating the ridge pattern.
                </p>
                <ul className="list-disc list-inside text-sm text-gray-500 dark:text-zinc-500 space-y-1">
                  <li>Primary ridges form first, followed by secondary ridges</li>
                  <li>Ridge formation follows the contours of regressing volar pads</li>
                  <li>Mechanical stress and differential growth create the pattern</li>
                  <li>The timing of regression affects pattern type</li>
                </ul>
              </AccordionItem>

              <AccordionItem title="What Determines Pattern Type?">
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-zinc-400">
                    The fingerprint pattern is determined by several factors:
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Volar Pad Characteristics</h4>
                      <ul className="text-sm text-gray-600 dark:text-zinc-400 space-y-1">
                        <li><strong>High, round pad</strong> → Whorl pattern</li>
                        <li><strong>Medium, offset pad</strong> → Loop pattern</li>
                        <li><strong>Low, flat pad</strong> → Arch pattern</li>
                      </ul>
                    </div>
                    <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Other Factors</h4>
                      <ul className="text-sm text-gray-600 dark:text-zinc-400 space-y-1">
                        <li>Timing of volar pad regression</li>
                        <li>Position of fetus in womb</li>
                        <li>Blood pressure and nutrition</li>
                        <li>Random cellular events (stochastic)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </AccordionItem>

              <AccordionItem title="Why Are Fingerprints Unique?">
                <p className="text-gray-600 dark:text-zinc-400 mb-3">
                  Even identical twins with the same DNA have different fingerprints because:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-500 dark:text-zinc-500 space-y-2">
                  <li>
                    <strong>Random factors:</strong> The exact position of each cell, micro-movements
                    in the womb, and timing of development are never identical
                  </li>
                  <li>
                    <strong>Different positions:</strong> Each twin occupies a different position in
                    the womb, experiencing different pressures and blood flow
                  </li>
                  <li>
                    <strong>Stochastic processes:</strong> Cellular-level events that determine minutiae
                    placement are inherently random
                  </li>
                  <li>
                    <strong>Non-linear dynamics:</strong> Small differences in initial conditions
                    lead to vastly different outcomes (similar to chaos theory)
                  </li>
                </ul>
              </AccordionItem>

              <AccordionItem title="Permanence of Fingerprints">
                <p className="text-gray-600 dark:text-zinc-400 mb-3">
                  Once formed, fingerprints remain permanent because:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-500 dark:text-zinc-500 space-y-2">
                  <li>
                    The ridge pattern is anchored in the dermis (deeper skin layer), which doesn't
                    regenerate like the epidermis
                  </li>
                  <li>
                    Surface damage (cuts, burns) to the epidermis heals following the dermal template
                  </li>
                  <li>
                    Only deep scarring that destroys the dermal layer can permanently alter fingerprints
                  </li>
                  <li>
                    Age-related changes may affect quality but not the fundamental pattern
                  </li>
                </ul>
              </AccordionItem>
            </div>
          </div>
        )}

        {activeTab === 'forensics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Fingerprints in Forensic Science</h2>

            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-zinc-400 leading-relaxed mb-6">
                Fingerprint analysis is one of the oldest and most reliable forms of biometric
                identification, used in forensic science for over a century. Sir Francis Galton
                published the first comprehensive study in 1892, and Sir Edward Henry developed
                the classification system still in use today.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Types of Fingerprint Evidence</h3>

                <div className="space-y-3">
                  <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4">
                    <h4 className="font-semibold text-teal-600 dark:text-teal-400 mb-1">Patent Prints</h4>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">
                      Visible prints left by fingers contaminated with ink, blood, paint, or other
                      substances. Can be photographed directly.
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4">
                    <h4 className="font-semibold text-cyan-600 dark:text-cyan-400 mb-1">Latent Prints</h4>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">
                      Invisible prints left by natural skin secretions (sweat, oils). Require
                      development techniques like powders, chemicals, or alternative light sources.
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-1">Plastic (Impressed) Prints</h4>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">
                      Three-dimensional impressions left in soft materials like wax, putty, wet
                      paint, or soap. Can be cast or photographed with oblique lighting.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Development Techniques</h3>

                <div className="space-y-3">
                  <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Powder Dusting</h4>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">
                      Fine powders (black, white, fluorescent, magnetic) applied with a brush to
                      adhere to oils and residues in the print.
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Chemical Processing</h4>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">
                      Ninhydrin, DFO, and other chemicals react with amino acids in sweat to
                      produce colored or fluorescent prints. Ideal for porous surfaces.
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Cyanoacrylate Fuming</h4>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">
                      Super glue fumes polymerize on print residues, creating a white, stable
                      impression. Effective on non-porous surfaces.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ACE-V Methodology */}
            <div className="mt-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">ACE-V Methodology</h3>
              <p className="text-gray-600 dark:text-zinc-400 mb-4">
                The standard methodology for fingerprint examination used worldwide:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-4 text-white">
                  <div className="text-2xl font-bold mb-1">A</div>
                  <h4 className="font-semibold mb-2">Analysis</h4>
                  <p className="text-sm opacity-90">
                    Assess print quality, determine suitability for comparison, note Level 1-3 details
                  </p>
                </div>
                <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl p-4 text-white">
                  <div className="text-2xl font-bold mb-1">C</div>
                  <h4 className="font-semibold mb-2">Comparison</h4>
                  <p className="text-sm opacity-90">
                    Compare unknown print to known exemplar, noting similarities and differences
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                  <div className="text-2xl font-bold mb-1">E</div>
                  <h4 className="font-semibold mb-2">Evaluation</h4>
                  <p className="text-sm opacity-90">
                    Form conclusion: Identification, Exclusion, or Inconclusive
                  </p>
                </div>
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 text-white">
                  <div className="text-2xl font-bold mb-1">V</div>
                  <h4 className="font-semibold mb-2">Verification</h4>
                  <p className="text-sm opacity-90">
                    Independent examiner repeats analysis to confirm findings
                  </p>
                </div>
              </div>
            </div>

            {/* AFIS */}
            <div className="mt-8 bg-gray-50 dark:bg-zinc-800 rounded-xl p-4 sm:p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                Automated Fingerprint Identification Systems (AFIS)
              </h3>
              <p className="text-gray-600 dark:text-zinc-400 mb-4">
                Modern forensic labs use computerized systems to search fingerprint databases:
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-zinc-400">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2" />
                  <span>
                    <strong>FBI's IAFIS/NGI:</strong> Contains over 150 million fingerprint records
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2" />
                  <span>
                    <strong>Automated encoding:</strong> Minutiae positions extracted and converted
                    to searchable templates
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2" />
                  <span>
                    <strong>Candidate list:</strong> System returns ranked potential matches for
                    human verification
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2" />
                  <span>
                    <strong>Final decision:</strong> Always made by qualified human examiners,
                    never solely by computer
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'app' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <ClarioLogo size={64} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Clario</h2>
                <p className="text-gray-600 dark:text-zinc-400">Advanced Fingerprint Analysis Platform</p>
              </div>
            </div>

            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-zinc-400 leading-relaxed">
                Clario is a state-of-the-art fingerprint analysis and classification platform designed
                for forensic professionals. It combines advanced AI technology with traditional
                fingerprint science to provide accurate, efficient, and court-admissible analysis.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Key Features</h3>
                <ul className="space-y-3">
                  {[
                    {
                      title: 'AI-Powered Classification',
                      desc: 'Automatic pattern type identification using advanced machine learning models',
                    },
                    {
                      title: 'Image Enhancement',
                      desc: 'Multiple enhancement presets optimized for different print types (latent, rolled, plain)',
                    },
                    {
                      title: 'Quality Assessment',
                      desc: 'Automated quality scoring with detailed feedback on image issues',
                    },
                    {
                      title: 'Minutiae Mapping',
                      desc: 'Visual overlay showing detected ridge endings, bifurcations, and other features',
                    },
                    {
                      title: 'Chain of Custody',
                      desc: 'Complete audit trail tracking every action for legal compliance',
                    },
                    {
                      title: 'Case Management',
                      desc: 'Organize fingerprints by case, exhibit, and subject for efficient workflow',
                    },
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-teal-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{feature.title}</h4>
                        <p className="text-sm text-gray-500 dark:text-zinc-400">{feature.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">How It Works</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Upload</h4>
                      <p className="text-sm text-gray-500 dark:text-zinc-400">
                        Import fingerprint images in various formats (JPEG, PNG, TIFF, BMP)
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Process</h4>
                      <p className="text-sm text-gray-500 dark:text-zinc-400">
                        AI analyzes the image, enhances quality, and extracts features
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Classify</h4>
                      <p className="text-sm text-gray-500 dark:text-zinc-400">
                        Pattern type identified with confidence score and detailed rationale
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Review</h4>
                      <p className="text-sm text-gray-500 dark:text-zinc-400">
                        Examiner reviews results with enhanced imagery and minutiae overlays
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      5
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Report</h4>
                      <p className="text-sm text-gray-500 dark:text-zinc-400">
                        Generate comprehensive forensic reports for documentation
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhancement Presets */}
            <div className="mt-8 bg-gray-50 dark:bg-zinc-800 rounded-xl p-4 sm:p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Enhancement Presets</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-gray-200 dark:border-zinc-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Latent</h4>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">
                    Aggressive enhancement for crime scene latent prints. Maximizes ridge visibility
                    from low-quality source images.
                  </p>
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-gray-200 dark:border-zinc-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Rolled/Plain</h4>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">
                    Balanced enhancement for inked or livescan prints. Preserves detail while
                    improving contrast.
                  </p>
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-gray-200 dark:border-zinc-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">High Quality</h4>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">
                    Minimal processing for already high-quality images. Maintains original detail
                    with subtle improvements.
                  </p>
                </div>
              </div>
            </div>

            {/* Version Info */}
            <div className="mt-8 text-center text-sm text-gray-500 dark:text-zinc-500">
              <p>Clario v1.0.0</p>
              <p className="mt-1">Powered by Google Gemini AI</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
