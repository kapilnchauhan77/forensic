import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import ClarioLogo from '../components/ClarioLogo';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(username, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error) {
      toast.error('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

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
                Welcome back
              </h2>
              <p className="text-gray-500 dark:text-zinc-400 mt-2">
                Sign in to continue to your dashboard
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
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
            </form>

            {/* Demo credentials */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-zinc-700">
              <p className="text-center text-sm text-gray-500 dark:text-zinc-400 mb-4">
                Demo credentials
              </p>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setUsername('admin');
                    setPassword('admin123');
                  }}
                  className="flex-1 p-3 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors text-left"
                >
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">Admin</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">admin / admin123</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUsername('analyst');
                    setPassword('analyst123');
                  }}
                  className="flex-1 p-3 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors text-left"
                >
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">Analyst</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">analyst / analyst123</p>
                </button>
              </div>
            </div>
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
