import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import ClarioLogo from '../components/ClarioLogo';

// Google "G" logo SVG
function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// Pending approval message component
function PendingApprovalMessage({ isNewUser, userEmail }: { isNewUser: boolean; userEmail?: string }) {
  return (
    <div className="p-6 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200">
            {isNewUser ? 'Account Created' : 'Account Pending Approval'}
          </h3>
          <p className="mt-1 text-amber-700 dark:text-amber-300">
            {isNewUser
              ? `Your account has been created${userEmail ? ` for ${userEmail}` : ''}. An administrator will review and approve your access shortly.`
              : 'Your account is pending administrator approval. Please check back later or contact your administrator.'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [pendingApprovalState, setPendingApprovalState] = useState<{ pending: boolean; isNewUser: boolean; email?: string }>({
    pending: false,
    isNewUser: false,
  });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, loginWithGoogle, handleGoogleCallback, oauthError, clearOAuthError, pendingApproval, user, isLoading: authLoading } = useAuth();

  // Handle OAuth callback from URL
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (code && state) {
      // Remove the query params from URL
      window.history.replaceState({}, document.title, '/login');

      handleGoogleCallback(code, state)
        .then((result) => {
          if (result.pendingApproval) {
            setPendingApprovalState({
              pending: true,
              isNewUser: result.isNewUser,
              email: user?.email,
            });
          } else {
            toast.success('Welcome back!');
            navigate('/');
          }
        })
        .catch(() => {
          // Error is already handled in the hook and shown via oauthError
        });
    }
  }, [searchParams, handleGoogleCallback, navigate, user?.email]);

  // Show OAuth errors as toasts
  useEffect(() => {
    if (oauthError) {
      toast.error(oauthError);
      clearOAuthError();
    }
  }, [oauthError, clearOAuthError]);

  // Update pending approval state from auth hook
  useEffect(() => {
    if (pendingApproval && user) {
      setPendingApprovalState({
        pending: true,
        isNewUser: false,
        email: user.email,
      });
    }
  }, [pendingApproval, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(username, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch {
      toast.error('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch {
      // Error handling is done in the hook
    }
  };

  const isProcessing = isLoading || authLoading;

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-zinc-950">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950">
        {/* Mesh background */}
        <div className="absolute inset-0 bg-mesh opacity-50" />

        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="flex items-center gap-4 mb-8">
            <ClarioLogo size={64} />
          </div>

          <h1 className="text-5xl xl:text-6xl font-extrabold text-white mb-6 leading-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">Clario</span>
          </h1>

          <p className="text-xl text-zinc-300 max-w-md mb-12">
            Advanced fingerprint analysis and classification powered by AI technology.
          </p>

          {/* Features */}
          <div className="space-y-4">
            {[
              'AI-powered pattern classification',
              'Multi-format image support',
              'Chain of custody tracking',
              'Detailed forensic reports',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-zinc-300">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative fingerprint */}
        <div className="absolute -bottom-20 -right-20 opacity-10">
          <ClarioLogo size={384} />
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-10">
            <div className="mb-4">
              <ClarioLogo size={64} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clario</h1>
            <p className="text-gray-500 dark:text-zinc-400">Analysis Platform</p>
          </div>

          {/* Login card */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Sign in to Clario
              </h2>
              <p className="text-gray-500 dark:text-zinc-400 mt-2">
                Access your forensic analysis dashboard
              </p>
            </div>

            {/* Show pending approval message if applicable */}
            {pendingApprovalState.pending ? (
              <div className="space-y-6">
                <PendingApprovalMessage
                  isNewUser={pendingApprovalState.isNewUser}
                  userEmail={pendingApprovalState.email}
                />
                <button
                  type="button"
                  onClick={() => {
                    setPendingApprovalState({ pending: false, isNewUser: false });
                    setShowEmailLogin(false);
                  }}
                  className="w-full py-3 px-4 rounded-xl font-medium text-gray-600 dark:text-zinc-400 border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Google Sign In Button - Primary CTA */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl font-medium bg-white dark:bg-zinc-800 border-2 border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-700 hover:border-gray-400 dark:hover:border-zinc-500 shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <>
                      <GoogleIcon />
                      Continue with Google
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-zinc-700" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white dark:bg-zinc-900 text-gray-500 dark:text-zinc-400">
                      or continue with email
                    </span>
                  </div>
                </div>

                {/* Collapsible Email/Password Login */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowEmailLogin(!showEmailLogin)}
                    className="w-full flex items-center justify-between py-3 px-4 rounded-xl font-medium text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <span>Sign in with username & password</span>
                    {showEmailLogin ? (
                      <ChevronUpIcon className="w-5 h-5" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5" />
                    )}
                  </button>

                  {/* Email/Password Form - Collapsible */}
                  {showEmailLogin && (
                    <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                      <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                          Username
                        </label>
                        <input
                          id="username"
                          name="username"
                          type="text"
                          autoComplete="username"
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border-2 border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-all duration-200"
                          placeholder="Enter your username"
                        />
                      </div>

                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border-2 border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-all duration-200 pr-12"
                            placeholder="Enter your password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
                          >
                            {showPassword ? (
                              <EyeSlashIcon className="h-5 w-5" />
                            ) : (
                              <EyeIcon className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:via-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Signing in...
                          </span>
                        ) : (
                          'Sign in'
                        )}
                      </button>

                      {/* Demo credentials - collapsed inside email login */}
                      <div className="pt-4 border-t border-gray-200 dark:border-zinc-700">
                        <p className="text-center text-sm text-gray-500 dark:text-zinc-400 mb-3">
                          Demo credentials
                        </p>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setUsername('admin');
                              setPassword('admin123');
                            }}
                            className="flex-1 p-2.5 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors text-left"
                          >
                            <p className="text-xs text-gray-500 dark:text-zinc-400">Admin</p>
                            <p className="text-xs font-medium text-gray-900 dark:text-white">admin / admin123</p>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setUsername('analyst');
                              setPassword('analyst123');
                            }}
                            className="flex-1 p-2.5 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors text-left"
                          >
                            <p className="text-xs text-gray-500 dark:text-zinc-400">Analyst</p>
                            <p className="text-xs font-medium text-gray-900 dark:text-white">analyst / analyst123</p>
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-gray-400 dark:text-zinc-500 mt-8">
            Forensic analysis platform for law enforcement
          </p>
        </div>
      </div>
    </div>
  );
}
