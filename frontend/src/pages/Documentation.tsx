import { useState } from 'react';
import {
  Book,
  CheckCircle,
  Users,
  BarChart3,
  Zap,
  Shield,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Target,
  Lightbulb,
  Settings,
  Bell,
  FileText,
  Clock,
  GitBranch,
  MessageSquare,
  Calendar,
} from 'lucide-react';

export default function Documentation() {
  const [expandedSection, setExpandedSection] = useState<string | null>('overview');

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const sections = [
    {
      id: 'overview',
      title: 'What is Task_Flow?',
      icon: Target,
      content: (
        <div className="space-y-4">
          <p className="text-lg text-gray-700 dark:text-gray-300">
            <strong>Task_Flow</strong> is a comprehensive project management and team collaboration
            platform designed to help organizations streamline workflows, improve productivity, and
            manage projects effectively from conception to completion.
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Whether you're managing a small team or coordinating multiple departments, Task_Flow
            provides all the tools you need to organize tasks, track progress, collaborate in real-time,
            and deliver projects on time.
          </p>
        </div>
      ),
    },
    {
      id: 'purpose',
      title: 'Problem We Solve',
      icon: Lightbulb,
      content: (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <h4 className="font-semibold text-red-900 dark:text-red-200 mb-2">❌ Without Task_Flow</h4>
              <ul className="space-y-2 text-sm text-red-800 dark:text-red-300">
                <li>• Emails scattered across different threads</li>
                <li>• No clear visibility into project status</li>
                <li>• Deadlines easily missed or forgotten</li>
                <li>• Team members unsure of their responsibilities</li>
                <li>• Communication gaps and missed updates</li>
                <li>• Difficult to track multiple projects</li>
              </ul>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-green-900 dark:text-green-200 mb-2">✅ With Task_Flow</h4>
              <ul className="space-y-2 text-sm text-green-800 dark:text-green-300">
                <li>• All communication centralized in one place</li>
                <li>• Real-time visibility into project progress</li>
                <li>• Automatic reminders and deadline tracking</li>
                <li>• Clear task assignments and responsibilities</li>
                <li>• Instant notifications for important updates</li>
                <li>• Easy management of multiple projects</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'features',
      title: 'Key Features',
      icon: Zap,
      content: (
        <div className="space-y-3">
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                icon: FileText,
                title: 'Project Management',
                desc: 'Create, organize, and track projects with custom workflows and status tracking.',
              },
              {
                icon: Users,
                title: 'Team Collaboration',
                desc: 'Invite team members, assign roles, and work together seamlessly.',
              },
              {
                icon: Clock,
                title: 'Task Management',
                desc: 'Create, assign, prioritize, and track tasks with deadlines and dependencies.',
              },
              {
                icon: GitBranch,
                title: 'Kanban Board',
                desc: 'Visualize workflow with drag-and-drop Kanban board for better task management.',
              },
              {
                icon: BarChart3,
                title: 'Analytics & Reports',
                desc: 'Get insights into project progress, team performance, and completion metrics.',
              },
              {
                icon: Bell,
                title: 'Notifications',
                desc: 'Stay updated with real-time notifications for assignments, comments, and changes.',
              },
              {
                icon: MessageSquare,
                title: 'Comments & Discussion',
                desc: 'Collaborate on tasks with integrated comments and @mentions.',
              },
              {
                icon: Calendar,
                title: 'Calendar View',
                desc: 'See all deadlines and milestones in an easy-to-read calendar format.',
              },
            ].map((feature, idx) => (
              <div key={idx} className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <feature.icon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <h5 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {feature.title}
                    </h5>
                    <p className="text-sm text-gray-700 dark:text-gray-400">{feature.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'how-it-works',
      title: 'How It Works',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            {[
              {
                step: 1,
                title: 'Sign Up & Create Your Workspace',
                desc: 'Create your account and set up your organization workspace. You automatically become the workspace manager.',
              },
              {
                step: 2,
                title: 'Invite Your Team',
                desc: 'Add team members by inviting them via email. Assign appropriate roles (Admin, Manager, Developer, etc.) to control permissions.',
              },
              {
                step: 3,
                title: 'Create Projects',
                desc: 'Set up projects with descriptions, due dates, and team assignments. Organize your work by department or initiative.',
              },
              {
                step: 4,
                title: 'Break Down Into Tasks',
                desc: 'Create tasks within projects, set priorities, assign owners, and set deadlines. Track dependencies between tasks.',
              },
              {
                step: 5,
                title: 'Collaborate & Execute',
                desc: 'Team members complete their tasks, add comments, update status, and stay connected through notifications.',
              },
              {
                step: 6,
                title: 'Monitor & Report',
                desc: 'Using dashboards, Kanban board, and analytics to track progress, identify bottlenecks, and celebrate wins.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex gap-4 items-start p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                  {item.step}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'use-cases',
      title: 'Who Can Use Task_Flow?',
      icon: Users,
      content: (
        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              industry: 'Software Development',
              examples: ['Manage sprints and releases', 'Track bugs and features', 'Coordinate code reviews'],
              emoji: '💻',
            },
            {
              industry: 'Marketing Teams',
              examples: ['Campaign planning', 'Content calendars', 'Project tracking'],
              emoji: '📢',
            },
            {
              industry: 'Product Management',
              examples: ['Feature prioritization', 'Roadmap planning', 'Stakeholder communication'],
              emoji: '🎯',
            },
            {
              industry: 'HR & Operations',
              examples: ['Onboarding workflows', 'Process improvements', 'Event planning'],
              emoji: '👥',
            },
            {
              industry: 'Design Teams',
              examples: ['Design sprints', 'Feedback management', 'Asset organization'],
              emoji: '🎨',
            },
            {
              industry: 'Consulting',
              examples: ['Client project delivery', 'Resource allocation', 'Milestone tracking'],
              emoji: '💼',
            },
          ].map((useCase, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800"
            >
              <div className="text-3xl mb-2">{useCase.emoji}</div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{useCase.industry}</h4>
              <ul className="text-sm text-gray-700 dark:text-gray-400 space-y-1">
                {useCase.examples.map((example, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    {example}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'benefits',
      title: 'Benefits & Advantages',
      icon: CheckCircle,
      content: (
        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              title: 'Increased Productivity',
              desc: 'Eliminate distractions and keep your team focused on what matters.',
              icon: Zap,
            },
            {
              title: 'Better Communication',
              desc: 'Centralized hub for all project discussions and updates.',
              icon: MessageSquare,
            },
            {
              title: 'Improved Accountability',
              desc: 'Clear task assignments and progress tracking ensure everyone knows their responsibilities.',
              icon: Target,
            },
            {
              title: 'Real-time Visibility',
              desc: 'Dashboards and reports give instant insights into project status.',
              icon: BarChart3,
            },
            {
              title: 'Deadline Management',
              desc: 'Never miss a deadline with built-in reminders and tracking.',
              icon: Clock,
            },
            {
              title: 'Data Security',
              desc: 'Your data is protected with secure authentication and tenant isolation.',
              icon: Shield,
            },
          ].map((benefit, idx) => (
            <div key={idx} className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <benefit.icon className="w-6 h-6 text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{benefit.title}</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-400">{benefit.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: ArrowRight,
      content: (
        <div className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">Quick Start in 5 Minutes</h4>
            <ol className="space-y-2 text-sm text-yellow-800 dark:text-yellow-300">
              <li>
                <strong>1. Create Account:</strong> Sign up with your email address and set a secure password.
              </li>
              <li>
                <strong>2. Complete Profile:</strong> Add your name, department, and profile picture to personalize your account.
              </li>
              <li>
                <strong>3. Invite Team Members:</strong> Go to the Team section and invite your colleagues.
              </li>
              <li>
                <strong>4. Create First Project:</strong> Click "New Project" and fill in project details.
              </li>
              <li>
                <strong>5. Add Tasks:</strong> Create and assign tasks to team members to get started.
              </li>
            </ol>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">📱 For Managers</h4>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                <li>✓ Set up team structure and roles</li>
                <li>✓ Create and assign projects</li>
                <li>✓ Monitor team productivity</li>
                <li>✓ View comprehensive reports</li>
                <li>✓ Adjust team permissions</li>
              </ul>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <h4 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-3">👨‍💼 For Team Members</h4>
              <ul className="space-y-2 text-sm text-indigo-800 dark:text-indigo-300">
                <li>✓ View assigned tasks</li>
                <li>✓ Update task progress</li>
                <li>✓ Collaborate with team</li>
                <li>✓ Check deadlines</li>
                <li>✓ Participate in discussions</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'features-detail',
      title: 'Feature Highlights',
      icon: Book,
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            {[
              {
                title: 'Dashboard',
                desc: 'Personalized dashboard showing your projects, tasks, team activity, and key metrics at a glance.',
              },
              {
                title: 'Projects',
                desc: 'Organize work into projects with descriptions, timelines, team assignments, and status tracking.',
              },
              {
                title: 'Tasks',
                desc: 'Create granular tasks with priorities, due dates, assignees, descriptions, and file attachments.',
              },
              {
                title: 'Kanban Board',
                desc: 'Visual task management with drag-and-drop columns (To Do, In Progress, Review, Done).',
              },
              {
                title: 'Team Management',
                desc: 'Manage team members with role-based access control (Admin, Manager, Developer, Viewer).',
              },
              {
                title: 'Calendar',
                desc: 'See all your upcoming deadlines, milestones, and team schedules in calendar format.',
              },
              {
                title: 'Reports & Analytics',
                desc: 'Comprehensive reports showing task completion rates, project progress, and team performance.',
              },
              {
                title: 'Notifications',
                desc: 'Real-time alerts for task assignments, comments, deadline reminders, and status changes.',
              },
              {
                title: 'Activity Feed',
                desc: 'Track all team activities including task updates, comments, project changes, and member updates.',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
              >
                <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{feature.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      icon: Shield,
      content: (
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-green-900 dark:text-green-200 mb-4">
              We take your data security seriously. Here's how we protect your information:
            </p>
            <ul className="space-y-2 text-sm text-green-800 dark:text-green-300">
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Tenant Isolation:</strong> Each organization's data is completely isolated and secure.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Encryption:</strong> Passwords are encrypted and sensitive data is protected.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Authentication:</strong> Secure JWT-based authentication for all API requests.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Role-based Access:</strong> Fine-grained permissions based on user roles.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Data Privacy:</strong> We don't sell or share your data with third parties.
                </span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'best-practices',
      title: 'Best Practices',
      icon: Lightbulb,
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            {[
              {
                title: 'Clear Task Naming',
                desc: 'Use descriptive task names that clearly indicate what needs to be done.',
              },
              {
                title: 'Set Realistic Deadlines',
                desc: 'Establish achievable deadlines to maintain team motivation and reliability.',
              },
              {
                title: 'Regular Communication',
                desc: 'Use comments and updates to keep team informed about progress and blockers.',
              },
              {
                title: 'Prioritize Effectively',
                desc: 'Set clear priorities to help the team focus on what matters most.',
              },
              {
                title: 'Review Reports Regularly',
                desc: 'Check analytics and reports to identify trends and areas for improvement.',
              },
              {
                title: 'Document Decisions',
                desc: 'Use task descriptions and comments to document important decisions and discussions.',
              },
            ].map((practice, idx) => (
              <div key={idx} className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{practice.title}</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-400">{practice.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <Book className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Task_Flow Documentation
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Complete guide to understanding and using Task_Flow - your all-in-one project management
            and collaboration platform.
          </p>
        </div>

        {/* Quick Navigation */}
        <div className="mb-10 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Navigation</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setExpandedSection(section.id)}
                  className="flex items-center gap-2 p-3 text-left rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
                >
                  <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {section.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-3">
          {sections.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSection === section.id;

            return (
              <div
                key={section.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md"
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {section.title}
                    </h2>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    {section.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-8 border border-blue-200 dark:border-blue-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Ready to Get Started?</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Task_Flow is designed to be intuitive and easy to use. Whether you're managing a small
            project or coordinating across your entire organization, we've got you covered.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/projects"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              Go to Dashboard
            </a>
            <a
              href="/help"
              className="px-6 py-3 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-medium rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <Book className="w-4 h-4" />
              View FAQs
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-gray-600 dark:text-gray-400">
          <p>Need more help? Check out the FAQ section or contact our support team.</p>
          <p className="text-sm mt-2">Task_Flow © 2026. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
