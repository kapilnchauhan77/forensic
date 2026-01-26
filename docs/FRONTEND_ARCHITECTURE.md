# Clario Frontend Architecture

Technical documentation for the Clario Forensic Fingerprint Platform frontend application.

## Overview

The frontend is a modern **React 18** single-page application built with **TypeScript**, **Vite**, and **Tailwind CSS**. It provides a comprehensive interface for forensic fingerprint analysis with full responsive design and dark mode support.

## Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
| **Framework** | React | 18.2.0 |
| **Language** | TypeScript | 5.2.2 |
| **Build Tool** | Vite | 5.1.4 |
| **Routing** | React Router DOM | 6.22.1 |
| **State Management** | Zustand | 4.5.1 |
| **HTTP Client** | Axios | 1.6.7 |
| **Styling** | Tailwind CSS | 3.4.1 |
| **UI Components** | Headless UI | 1.7.18 |
| **Icons** | Heroicons | 2.1.1 |
| **Notifications** | React Hot Toast | 2.4.1 |
| **File Upload** | React Dropzone | 14.2.3 |
| **Drag & Drop** | dnd-kit | 6.3.1 |
| **Dates** | date-fns | 3.3.1 |
| **PWA** | vite-plugin-pwa | 1.2.0 |

---

## Project Structure

```
frontend/
├── src/
│   ├── assets/                    # Static assets
│   │   └── clario-logo.svg
│   ├── components/                # Reusable components
│   │   ├── CreateCaseModal.tsx    # Case creation dialog
│   │   ├── CreateExhibitModal.tsx # Exhibit creation dialog
│   │   ├── Layout.tsx             # Main layout wrapper
│   │   ├── MobileNav.tsx          # Mobile bottom navigation
│   │   ├── ThemeToggle.tsx        # Dark mode toggle
│   │   ├── ClarioLogo.tsx         # Logo component
│   │   └── learning/              # Learning module components
│   │       ├── DragDropPuzzle.tsx
│   │       └── ImageComparisonViewer.tsx
│   ├── contexts/                  # React Context providers
│   │   └── ThemeContext.tsx       # Theme management
│   ├── data/                      # Static data
│   │   └── learningCases.ts       # Learning case content
│   ├── hooks/                     # Custom React hooks
│   │   ├── useAuth.ts             # Authentication hook
│   │   └── useLearningProgress.ts # Learning progress hook
│   ├── pages/                     # Page components
│   │   ├── Dashboard.tsx          # Main dashboard
│   │   ├── CaseList.tsx           # Cases listing
│   │   ├── CaseDetail.tsx         # Single case view
│   │   ├── ExhibitDetail.tsx      # Exhibit management
│   │   ├── FingerprintViewer.tsx  # Fingerprint analysis
│   │   ├── Login.tsx              # Authentication
│   │   ├── Settings.tsx           # User settings
│   │   ├── Quiz.tsx               # Learning quizzes
│   │   ├── Learning.tsx           # Learning hub
│   │   ├── CaseStory.tsx          # Interactive case studies
│   │   ├── UserManagement.tsx     # Admin user management
│   │   └── About.tsx              # About page
│   ├── services/                  # API services
│   │   └── api.ts                 # API client configuration
│   ├── types/                     # TypeScript definitions
│   │   └── index.ts               # Type definitions
│   ├── App.tsx                    # Root component
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Global styles
├── public/                        # Static public assets
├── dist/                          # Build output
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── index.html
```

---

## Component Architecture

### Layout Structure

```
<App>
├── <ThemeProvider>          # Theme context
│   ├── <Router>
│   │   ├── <Login />        # Public route
│   │   └── <PrivateRoute>   # Protected wrapper
│   │       └── <Layout>     # Main layout
│   │           ├── <Sidebar />      # Desktop nav
│   │           ├── <Header />       # Top bar
│   │           ├── <main>           # Page content
│   │           │   └── <Routes />   # Nested routes
│   │           └── <MobileNav />    # Mobile bottom nav
│   └── <Toaster />          # Toast notifications
```

### Key Components

#### Layout (`Layout.tsx`)

Main application wrapper providing:
- Responsive sidebar navigation (hidden on mobile)
- Top header with theme toggle and date
- Mobile hamburger menu
- Bottom navigation for mobile devices
- Role-based navigation items

```tsx
// Navigation structure
const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Cases', href: '/cases', icon: FolderIcon },
  { name: 'Learning', href: '/learning', icon: AcademicCapIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
  // Admin-only items
  { name: 'Users', href: '/users', icon: UsersIcon, adminOnly: true },
];
```

#### FingerprintViewer (`FingerprintViewer.tsx`)

Advanced image viewer with:
- Original/enhanced view switching
- Side-by-side comparison with slider
- Zoom controls (0.25x - 4x)
- Touch gesture support (pinch-zoom, pan)
- Fullscreen mode
- Classification display
- Quality metrics visualization
- Reprocessing controls

#### Login (`Login.tsx`)

Authentication page supporting:
- Username/password login
- Google OAuth integration
- CSRF state validation
- Pending approval workflow
- Error messaging

---

## State Management

### Zustand Auth Store (`useAuth.ts`)

Primary authentication state management using Zustand with persist middleware.

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  pendingApproval: boolean;
  oauthError: string | null;

  // Actions
  login: (username: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  handleGoogleCallback: (code: string, state: string) => Promise<{
    success: boolean;
    pendingApproval?: boolean;
    error?: string;
  }>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearOAuthError: () => void;
}
```

**Features:**
- Token persistence to localStorage
- OAuth CSRF state validation via sessionStorage
- Automatic auth check on app mount
- Pending approval state handling

### Theme Context (`ThemeContext.tsx`)

Theme management using React Context.

```typescript
interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}
```

**Features:**
- Light/dark/system theme options
- System preference detection via `prefers-color-scheme`
- Persistent localStorage storage
- DOM class manipulation for Tailwind dark mode

---

## API Integration

### Axios Configuration (`services/api.ts`)

```typescript
const API_BASE = '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - inject auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### API Service Methods

```typescript
// Authentication
authApi.login(username, password)
authApi.register(data)
authApi.getMe()
authApi.getGoogleAuthUrl()
authApi.googleCallback(code, state)

// Cases
casesApi.list(page, pageSize, search?, status?)
casesApi.get(id)
casesApi.create(data)
casesApi.update(id, data)
casesApi.delete(id)

// Exhibits
exhibitsApi.listForCase(caseId)
exhibitsApi.get(id)
exhibitsApi.create(data)
exhibitsApi.update(id, data)
exhibitsApi.delete(id)

// Fingerprints
fingerprintsApi.upload(exhibitId, file, printType)
fingerprintsApi.uploadBatch(exhibitId, files, printType)
fingerprintsApi.get(id)
fingerprintsApi.process(id, options)
fingerprintsApi.reprocess(id, options)
fingerprintsApi.delete(id)

// Pipeline
pipelineApi.listConfigs()
pipelineApi.getConfig(id)
pipelineApi.getCurrentVersion()

// Users (Admin)
usersApi.list()
usersApi.get(id)
usersApi.update(id, data)
usersApi.delete(id)

// Export
exportApi.downloadEvidencePack(caseId)
exportApi.getFingerprintReport(fingerprintId)
```

---

## Routing Structure

### Route Configuration (`App.tsx`)

```tsx
<Routes>
  {/* Public route */}
  <Route path="/login" element={<Login />} />

  {/* Protected routes */}
  <Route path="/*" element={
    <PrivateRoute>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/cases" element={<CaseList />} />
          <Route path="/cases/:caseId" element={<CaseDetail />} />
          <Route path="/exhibits/:exhibitId" element={<ExhibitDetail />} />
          <Route path="/fingerprints/:fingerprintId" element={<FingerprintViewer />} />
          <Route path="/learning" element={<Learning />} />
          <Route path="/learning/case/:caseId" element={<CaseStory />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Layout>
    </PrivateRoute>
  } />
</Routes>
```

### PrivateRoute Component

```tsx
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

---

## Styling System

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          // ... shades 100-900
          600: '#0284c7',
        },
        forensic: {
          dark: '#0f172a',
          light: '#f8fafc',
        },
      },
      minHeight: {
        'touch': '44px', // Touch target minimum
      },
    },
  },
  plugins: [],
};
```

### CSS Custom Properties

```css
/* index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --color-primary: 2 132 199;
    --color-background: 248 250 252;
  }

  .dark {
    --color-background: 15 23 42;
  }
}

@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-primary-600 text-white rounded-lg
           hover:bg-primary-700 transition-colors
           focus:outline-none focus:ring-2 focus:ring-primary-500;
  }

  .card {
    @apply bg-white dark:bg-zinc-800 rounded-xl shadow-sm
           border border-gray-200 dark:border-zinc-700;
  }
}
```

### Responsive Design Patterns

```tsx
// Mobile-first responsive classes
<div className="
  grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  // Responsive grid
  px-4 sm:px-6 lg:px-8                             // Responsive padding
  text-sm sm:text-base                             // Responsive typography
">

// Conditional rendering for mobile/desktop
<div className="hidden lg:block">Desktop Only</div>
<div className="block lg:hidden">Mobile Only</div>
```

### Dark Mode Implementation

```tsx
// Using Tailwind dark: prefix
<div className="
  bg-white dark:bg-zinc-900
  text-gray-900 dark:text-white
  border-gray-200 dark:border-zinc-700
">

// Theme toggle component
const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
};
```

---

## Key Page Implementations

### Dashboard

Displays:
- Statistics cards (total cases, active cases, fingerprints)
- Recent activity feed
- Quick actions

```tsx
const Dashboard = () => {
  const [stats, setStats] = useState({ cases: 0, fingerprints: 0 });
  const [recentCases, setRecentCases] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const [casesRes] = await Promise.all([
        casesApi.list(1, 5),
      ]);
      setRecentCases(casesRes.data.cases);
      setStats({
        cases: casesRes.data.total,
        fingerprints: casesRes.data.cases.reduce(
          (sum, c) => sum + c.fingerprint_count, 0
        ),
      });
    };
    fetchData();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard title="Total Cases" value={stats.cases} />
      <StatCard title="Fingerprints" value={stats.fingerprints} />
      {/* ... */}
    </div>
  );
};
```

### CaseList

Features:
- Paginated case listing
- Search and status filtering
- Mobile card / desktop table views
- Create/delete actions

```tsx
const CaseList = () => {
  const [cases, setCases] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);

  const fetchCases = useCallback(async () => {
    const res = await casesApi.list(page, 10, search, statusFilter);
    setCases(res.data.cases);
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  return (
    <div>
      <SearchBar value={search} onChange={setSearch} />
      <StatusFilter value={statusFilter} onChange={setStatusFilter} />

      {/* Desktop table */}
      <table className="hidden md:table">...</table>

      {/* Mobile cards */}
      <div className="md:hidden space-y-4">
        {cases.map(c => <CaseCard key={c.id} case={c} />)}
      </div>

      <Pagination page={page} onChange={setPage} />
    </div>
  );
};
```

### FingerprintViewer

Advanced viewer with:
- Image comparison slider
- Zoom/pan controls
- Touch gestures
- Classification display

```tsx
const FingerprintViewer = () => {
  const { fingerprintId } = useParams();
  const [fingerprint, setFingerprint] = useState(null);
  const [viewMode, setViewMode] = useState<'original' | 'enhanced' | 'compare'>('enhanced');
  const [zoom, setZoom] = useState(1);
  const [comparePosition, setComparePosition] = useState(50);

  // Zoom handlers
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(z => Math.min(4, Math.max(0.25, z + delta)));
  };

  // Touch gesture handlers
  const handlePinch = useCallback((scale: number) => {
    setZoom(z => Math.min(4, Math.max(0.25, z * scale)));
  }, []);

  return (
    <div className="relative">
      {/* View mode tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setViewMode('original')}>Original</button>
        <button onClick={() => setViewMode('enhanced')}>Enhanced</button>
        <button onClick={() => setViewMode('compare')}>Compare</button>
      </div>

      {/* Image container */}
      <div
        className="relative overflow-hidden"
        onWheel={handleWheel}
        style={{ transform: `scale(${zoom})` }}
      >
        {viewMode === 'compare' ? (
          <ComparisonSlider
            original={fingerprint.original_url}
            enhanced={fingerprint.processing_results[0]?.enhanced_url}
            position={comparePosition}
            onPositionChange={setComparePosition}
          />
        ) : (
          <img src={viewMode === 'original'
            ? fingerprint.original_url
            : fingerprint.processing_results[0]?.enhanced_url
          } />
        )}
      </div>

      {/* Classification panel */}
      <ClassificationPanel fingerprint={fingerprint} />

      {/* Reprocess button */}
      <ReprocessButton fingerprintId={fingerprintId} />
    </div>
  );
};
```

---

## Touch & Gesture Support

### Pinch-to-Zoom Implementation

```tsx
const usePinchZoom = (containerRef: RefObject<HTMLElement>) => {
  const [scale, setScale] = useState(1);
  const initialDistance = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialDistance.current = getDistance(e.touches[0], e.touches[1]);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const scaleChange = currentDistance / initialDistance.current;
        setScale(s => Math.min(4, Math.max(0.25, s * scaleChange)));
        initialDistance.current = currentDistance;
      }
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, [containerRef]);

  return scale;
};

const getDistance = (t1: Touch, t2: Touch) => {
  return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
};
```

### Comparison Slider Touch

```tsx
const ComparisonSlider = ({ original, enhanced, position, onPositionChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDrag = (e: MouseEvent | TouchEvent) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const newPosition = ((clientX - rect.left) / rect.width) * 100;
    onPositionChange(Math.min(100, Math.max(0, newPosition)));
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Original image (full width) */}
      <img src={original} className="w-full" />

      {/* Enhanced image (clipped) */}
      <img
        src={enhanced}
        className="absolute inset-0 w-full"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      />

      {/* Draggable slider handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
        style={{ left: `${position}%` }}
        onMouseDown={() => document.addEventListener('mousemove', handleDrag)}
        onTouchStart={() => document.addEventListener('touchmove', handleDrag)}
      />
    </div>
  );
};
```

---

## Build & Development

### Development Server

```bash
# Start development server
npm run dev

# Server runs on http://localhost:3000
# API proxied to http://localhost:8000
```

### Production Build

```bash
# Type check and build
npm run build

# Output in dist/
# - index.html
# - assets/
#   - *.js (chunked)
#   - *.css
#   - *.woff2 (fonts)
```

### Environment Configuration

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Clario',
        short_name: 'Clario',
        theme_color: '#0f172a',
        display: 'standalone',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxAgeSeconds: 365 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
```

### Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  }
}
```

---

## Type Definitions

### Core Types (`types/index.ts`)

```typescript
// User types
interface User {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  agency: string | null;
  role: 'admin' | 'examiner' | 'technician' | 'readonly';
  is_active: boolean;
  created_at: string;
  last_login: string | null;
  auth_provider: 'local' | 'google';
  profile_picture: string | null;
}

// Case types
interface Case {
  id: string;
  case_number: string;
  title: string;
  description: string | null;
  agency: string | null;
  source_type: SourceType;
  status: CaseStatus;
  operator_id: string;
  operator_name: string;
  external_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  exhibit_count: number;
  fingerprint_count: number;
}

// Fingerprint types
interface Fingerprint {
  id: string;
  original_filename: string;
  original_hash_sha256: string;
  original_url: string;
  file_size_bytes: number;
  mime_type: string;
  image_width: number;
  image_height: number;
  dpi: number;
  print_type: PrintType;
  evidence_type: EvidenceType;
  detail_level: DetailLevel | null;
  finger_position: FingerPosition;
  status: ProcessingStatus;
  quality_score: number | null;
  quality_issues: QualityIssue[];
  pattern_type: PatternType | null;
  pattern_subtype: PatternSubtype | null;
  pattern_confidence: number | null;
  classification_rationale: string | null;
  ncic_code: string | null;
  henry_value: number | null;
  ridge_count: number | null;
  core_count: number | null;
  delta_count: number | null;
  core_positions: Position[] | null;
  delta_positions: Position[] | null;
  minutiae_count: number | null;
  minutiae_details: MinutiaeDetails | null;
  ridge_flow_direction: string | null;
  ridge_density: number | null;
  multiple_fingerprints: boolean;
  exhibit_id: string;
  created_at: string;
  processed_at: string | null;
  processing_results: ProcessingResult[];
  ridge_orientation_map_url: string | null;
  rationale_overlay_url: string | null;
}

// Processing result
interface ProcessingResult {
  id: string;
  enhanced_url: string;
  enhancement_preset: string;
  enhancement_method: 'gemini' | 'opencv';
  quality_score_before: number | null;
  quality_score_after: number | null;
  quality_improvement: number | null;
  artifact_risk_level: 'low' | 'medium' | 'high';
  is_primary: boolean;
  created_at: string;
}

// Enums
type CaseStatus = 'open' | 'in_progress' | 'review' | 'closed' | 'archived';
type SourceType = 'crime_scene' | 'booking' | 'elimination' | 'training' | 'quality_control' | 'other';
type ProcessingStatus = 'pending' | 'queued' | 'processing' | 'completed' | 'failed';
type EvidenceType = 'latent' | 'patent' | 'plastic' | 'unknown';
type PrintType = 'rolled' | 'plain' | 'slap' | 'latent_lift' | 'photo' | 'partial' | 'unknown';
type PatternType = 'arch' | 'loop' | 'whorl' | 'unknown' | 'partial' | 'not_present';
type DetailLevel = 'level_1' | 'level_2' | 'level_3';
```

---

## Accessibility

### ARIA Implementation

```tsx
// Icon buttons with labels
<button
  aria-label="Toggle dark mode"
  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
>
  <MoonIcon className="h-5 w-5" aria-hidden="true" />
</button>

// Form inputs
<label htmlFor="case-search" className="sr-only">Search cases</label>
<input
  id="case-search"
  type="search"
  placeholder="Search cases..."
  aria-describedby="search-help"
/>
<p id="search-help" className="text-sm text-gray-500">
  Search by case number, title, or agency
</p>
```

### Keyboard Navigation

```tsx
// Focus management in modals
const Modal = ({ isOpen, onClose, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <div
        ref={modalRef}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="focus:outline-none"
      >
        {children}
      </div>
    </Dialog>
  );
};
```

### Touch Targets

```tsx
// Minimum 44x44px touch targets
<button className="min-h-[44px] min-w-[44px] p-3">
  <Icon className="h-6 w-6" />
</button>
```

---

## Performance Optimizations

### Code Splitting

```tsx
// Lazy load pages (future enhancement)
const FingerprintViewer = lazy(() => import('./pages/FingerprintViewer'));
const UserManagement = lazy(() => import('./pages/UserManagement'));

// With suspense
<Suspense fallback={<LoadingSpinner />}>
  <FingerprintViewer />
</Suspense>
```

### Memoization

```tsx
// Memoized callbacks
const handleSearch = useCallback((value: string) => {
  setSearch(value);
}, []);

// Memoized components
const CaseCard = memo(({ case: caseData }) => {
  return <div>...</div>;
});
```

### Image Optimization

```tsx
// Loading states
const [imageLoaded, setImageLoaded] = useState(false);

<div className="relative">
  {!imageLoaded && <Skeleton className="absolute inset-0" />}
  <img
    src={fingerprint.original_url}
    onLoad={() => setImageLoaded(true)}
    className={imageLoaded ? 'opacity-100' : 'opacity-0'}
  />
</div>
```

---

## Testing Strategy

### Unit Tests (Recommended)

```typescript
// Example test structure
describe('useAuth', () => {
  it('should login successfully', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('admin', 'admin123');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.username).toBe('admin');
  });
});
```

### Integration Tests (Recommended)

```typescript
// Example component test
describe('CaseList', () => {
  it('should render cases and handle search', async () => {
    render(<CaseList />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('2024-001')).toBeInTheDocument();
    });

    // Test search
    fireEvent.change(screen.getByPlaceholderText('Search'), {
      target: { value: 'robbery' }
    });

    await waitFor(() => {
      expect(screen.getByText('Bank Robbery Investigation')).toBeInTheDocument();
    });
  });
});
```

---

## Future Enhancements

### Planned Features

1. **Real-time Updates** - WebSocket integration for live processing status
2. **Offline Support** - Service worker caching for offline viewing
3. **Advanced Annotations** - Drawing tools for fingerprint marking
4. **Batch Processing UI** - Progress tracking for bulk operations
5. **Collaborative Features** - Multi-user case collaboration
6. **Mobile App** - React Native version for field use

### Extensibility Points

- Additional OAuth providers (GitHub, Microsoft)
- Custom theme support
- Plugin architecture for analysis tools
- Multi-language (i18n) support
- Analytics integration
