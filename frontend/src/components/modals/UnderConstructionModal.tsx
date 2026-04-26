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
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-50 duration-300 flex flex-col">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-6 py-6 sm:px-8 sm:py-8 shrink-0">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap className="w-10 h-10 text-white" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white">TaskFlow</h2>
          </div>
          <p className="text-center text-blue-100 text-lg font-medium">
            Your Complete Project Management Solution
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 sm:px-8 sm:py-6 overflow-y-auto">
          {/* Main description */}
          <div className="mb-4 text-sm sm:text-base">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to TaskFlow
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed mb-4">
              TaskFlow is a modern, intuitive project management system designed to help teams collaborate seamlessly, 
              track progress in real-time, and deliver projects on time.
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              From small teams to large enterprises, TaskFlow provides all the tools you need to organize tasks, 
              manage projects, and track team performance with ease.
            </p>
          </div>

          {/* Key features */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 mb-4 border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wider">
              ✨ Key Features
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Team Collaboration</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Real-time Tracking</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-pink-600 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Project Management</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Analytics & Reports</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-cyan-600 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Task Management</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Team Communication</span>
              </div>
            </div>
          </div>

          {/* Quote/tagline */}
          <div className="text-center mb-0 sm:mb-2">
            <p className="text-gray-700 dark:text-gray-300 italic text-base">
              "Simplify project management. Empower your team. Deliver results."
            </p>
          </div>
        </div>

        {/* Footer action */}
        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 sm:px-8 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleGetStarted}
              className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleReadDocs}
              className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Read Documentation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
