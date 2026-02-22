import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { useAppDispatch } from '../hooks/hook';
import { registerUser } from '../features/auth/authSlice';

function ManagerSetup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState('');

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.companyName) {
      setFormError('All fields are required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    try {
      await dispatch(registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        companyName: formData.companyName,
        role: 'manager'
      }));
      navigate('/');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to create account');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <header className="py-4 px-6 backdrop-blur-lg bg-white/70 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-accent-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">TF</span>
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-accent-500">
              TaskFlow
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row">
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
              <div className="mb-8">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="flex items-center text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 mb-4"
                >
                  <ArrowLeft size={18} className="mr-2" />
                  Back to Login
                </button>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Setup as Manager
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Create your company account and start managing projects
                </p>
              </div>

              {formError && (
                <div className="p-3 bg-error-50 border border-error-200 text-error-800 dark:bg-error-900/30 dark:border-error-800 dark:text-error-400 rounded-lg animate-fade-in">
                  {formError}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={18} className="text-gray-400" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400
                        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                        bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={18} className="text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="name@example.com"
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400
                        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                        bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Company Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building size={18} className="text-gray-400" />
                    </div>
                    <input
                      id="companyName"
                      name="companyName"
                      type="text"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="Your Company Ltd"
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400
                        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                        bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={18} className="text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400
                        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                        bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <Lock size={18} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                      ) : (
                        <Lock size={18} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={18} className="text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400
                        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                        bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <Lock size={18} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                      ) : (
                        <Lock size={18} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
                  dark:bg-primary-700 dark:hover:bg-primary-600 transition duration-150 ease-in-out"
              >
                Create Manager Account
              </button>

              <div className="text-center mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>

        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-auth-pattern bg-cover bg-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600/90 to-accent-600/90 backdrop-blur-sm"></div>
          </div>
          <div className="relative h-full flex flex-col justify-center p-12 text-white">
            <div className="animate-float">
              <h2 className="text-4xl font-bold mb-6">Setup Your Company</h2>
              <p className="text-xl text-primary-100 mb-8">
                Create your manager account and start building your team's workflow.
              </p>
              <div className="space-y-6">
                <div className="flex items-center space-x-4 bg-white/10 p-4 rounded-lg backdrop-blur-md">
                  <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🏢</span>
                  </div>
                  <p className="text-lg">Set up your company profile</p>
                </div>
                <div className="flex items-center space-x-4 bg-white/10 p-4 rounded-lg backdrop-blur-md">
                  <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">👥</span>
                  </div>
                  <p className="text-lg">Invite team members</p>
                </div>
                <div className="flex items-center space-x-4 bg-white/10 p-4 rounded-lg backdrop-blur-md">
                  <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                  <p className="text-lg">Manage projects and track progress</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-sm text-gray-600 dark:text-gray-400 backdrop-blur-lg bg-white/70 dark:bg-gray-900/70 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto">
          &copy; 2025 TaskFlow. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default ManagerSetup;