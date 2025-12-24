import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CaseList from './pages/CaseList';
import CaseDetail from './pages/CaseDetail';
import ExhibitDetail from './pages/ExhibitDetail';
import FingerprintViewer from './pages/FingerprintViewer';
import Settings from './pages/Settings';
import Quiz from './pages/Quiz';
import Learning from './pages/Learning';
import CaseStory from './pages/CaseStory';
import About from './pages/About';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/cases" element={<CaseList />} />
                <Route path="/cases/:caseId" element={<CaseDetail />} />
                <Route path="/exhibits/:exhibitId" element={<ExhibitDetail />} />
                <Route path="/fingerprints/:fingerprintId" element={<FingerprintViewer />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/learning" element={<Learning />} />
                <Route path="/learning/:caseId" element={<CaseStory />} />
                <Route path="/about" element={<About />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;
