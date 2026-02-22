import { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

export default function UnderConstructionModal() {
  const [isOpen, setIsOpen] = useState(true);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in zoom-in-50 duration-300">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-8">
          <div className="flex items-center justify-center gap-3">
            <AlertCircle className="w-8 h-8 text-white animate-pulse" />
            <h2 className="text-2xl font-bold text-white">Under Construction</h2>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          <p className="text-gray-700 text-center mb-4">
            We're working hard to build something amazing! 🚀
          </p>
          <p className="text-gray-600 text-sm text-center mb-6">
            TaskFlow is currently under development. Please check back soon for exciting updates and features.
          </p>

          {/* Feature preview */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6">
            <p className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wider">
              Coming Soon
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                Advanced Team Collaboration
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                Real-time Project Tracking
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                Smart Analytics & Reports
              </li>
            </ul>
          </div>

          {/* Contact info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-xs text-gray-600 text-center">
              For inquiries or early access, contact us at:
            </p>
            <p className="text-sm font-semibold text-center text-blue-600 mt-1">
              support@taskflow.com
            </p>
          </div>

          {/* Footer note */}
          <p className="text-xs text-gray-500 text-center">
            Thank you for your patience and interest! ❤️
          </p>
        </div>

        {/* Footer action */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <button
            onClick={() => setIsOpen(false)}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
