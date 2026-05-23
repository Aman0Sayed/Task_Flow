import { useState, useEffect } from 'react';
import { Zap, BookOpen, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UnderConstructionModal() {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Keep modal open, prevent closing by clicking outside
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleGetStarted = () => {
    setIsOpen(false);
  };

  const handleReadDocs = () => {
    setIsOpen(false);
    navigate('/documentation');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[85vh] overflow-y-auto animate-in zoom-in-50 duration-300 flex flex-col">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-5 py-5 sm:px-6 sm:py-6 shrink-0">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="w-8 h-8 text-white" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white">TaskFlow</h2>
          </div>
          <p className="text-center text-blue-100 text-sm sm:text-base font-medium">
            Your Complete Project Management Solution
          </p>
        </div>

        {/* Content */}
        <div className="px-5 py-4 sm:px-6 sm:py-4 overflow-y-auto flex-1">
          {/* Main description */}
          <div className="mb-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Welcome to TaskFlow
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-snug mb-2">
              A modern, intuitive project management system designed to help teams collaborate seamlessly and deliver projects on time.
            </p>
          </div>

          {/* Key features */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-3 mb-3 border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
              ✨ Features
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0"></div>
                <span className="text-xs text-gray-700 dark:text-gray-300">Collaboration</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-purple-600 rounded-full flex-shrink-0"></div>
                <span className="text-xs text-gray-700 dark:text-gray-300">Tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-pink-600 rounded-full flex-shrink-0"></div>
                <span className="text-xs text-gray-700 dark:text-gray-300">Projects</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full flex-shrink-0"></div>
                <span className="text-xs text-gray-700 dark:text-gray-300">Analytics</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-cyan-600 rounded-full flex-shrink-0"></div>
                <span className="text-xs text-gray-700 dark:text-gray-300">Tasks</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full flex-shrink-0"></div>
                <span className="text-xs text-gray-700 dark:text-gray-300">Teams</span>
              </div>
            </div>
          </div>

          {/* Quote/tagline */}
          <div className="text-center mb-0">
            <p className="text-gray-600 dark:text-gray-400 italic text-xs">
              "Simplify. Collaborate. Deliver."
            </p>
          </div>
        </div>

        {/* Footer action */}
        <div className="bg-gray-50 dark:bg-gray-800 px-5 py-3 sm:px-6 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex flex-col gap-2">
            <button
              onClick={handleGetStarted}
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition-all duration-200 text-sm flex items-center justify-center gap-1"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={handleReadDocs}
              className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-2 rounded-lg transition-all duration-200 text-sm flex items-center justify-center gap-1"
            >
              <BookOpen className="w-3 h-3" />
              <span>Docs</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
