import { useState } from 'react';
import { HelpCircle, Book, MessageCircle, ExternalLink, Search, AlertTriangle, CheckCircle, Users, BarChart3, Calendar, Settings, ChevronDown, ChevronUp } from 'lucide-react';

export default function Help() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const faqs = [
    {
      category: "Getting Started",
      questions: [
        {
          question: "How do I create a new project?",
          answer: "Navigate to the Projects page and click the 'New Project' button. Fill in the project details including name, description, due date, and team members. You can also set the project priority and status."
        },
        {
          question: "How do I invite team members?",
          answer: "Go to the Team page and click 'Add Team Member'. Enter their email address and assign appropriate roles (Admin, Project Manager, Developer, etc.). They'll receive an invitation email."
        },
        {
          question: "How do I set up my profile?",
          answer: "Visit your Profile page to update your personal information, change your role, department, and add a bio. You can also upload a profile picture from there."
        }
      ]
    },
    {
      category: "Task Management",
      questions: [
        {
          question: "How do I create and assign tasks?",
          answer: "Go to the Tasks page and click 'New Task'. Fill in task details, select a project, set priority and due date, then assign team members. Tasks can have attachments and comments."
        },
        {
          question: "How does the Kanban board work?",
          answer: "The Kanban board displays tasks in columns: To Do, In Progress, Review, and Completed. Drag and drop tasks between columns to update their status. You can also reorder tasks within columns."
        },
        {
          question: "How do I track task progress?",
          answer: "View task progress on the Dashboard with completion statistics, or check individual project cards for task counts. The Reports page provides detailed analytics on task completion rates."
        },
        {
          question: "How do I add comments to tasks?",
          answer: "Open any task and scroll to the comments section at the bottom. Type your comment and click 'Post Comment'. You can also mention team members using @username."
        }
      ]
    },
    {
      category: "Project Management",
      questions: [
        {
          question: "How do I monitor project progress?",
          answer: "Check the Dashboard for project progress bars and completion percentages. Visit the Projects page for detailed project information, or use the Reports page for comprehensive analytics."
        },
        {
          question: "How do I change project status?",
          answer: "Edit any project from the Projects page. You can change status between Planning, Active, On Hold, Completed, and Archived. Only project owners or admins can make these changes."
        },
        {
          question: "How do I manage project members?",
          answer: "From the project details page, you can add or remove team members. Go to Projects → select a project → Members tab. You can also change member roles and permissions."
        }
      ]
    },
    {
      category: "Reports & Analytics",
      questions: [
        {
          question: "What reports are available?",
          answer: "The Reports page provides task completion statistics, project progress analytics, team performance metrics, and deadline tracking. Export data for further analysis."
        },
        {
          question: "How do I export report data?",
          answer: "On the Reports page, click the 'Export Data' button to download reports in various formats. You can also schedule automated report generation."
        }
      ]
    }
  ];

  const quickLinks = [
    { name: "Getting Started Guide", sectionId: "section-faq",             icon: Book },
    { name: "API Documentation",     sectionId: "section-features",        icon: Book },
    { name: "Contact Support",       sectionId: "section-contact",         icon: MessageCircle },
    { name: "System Status",         sectionId: "section-troubleshooting", icon: CheckCircle },
  ];

  const troubleshooting = [
    {
      issue: "Page not loading",
      solution: "Check your internet connection and try refreshing the page. If the problem persists, clear your browser cache or try a different browser."
    },
    {
      issue: "Can't create projects/tasks",
      solution: "Ensure you have the correct permissions. Only managers can create projects, and you need appropriate access to create tasks in specific projects."
    },
    {
      issue: "Notifications not working",
      solution: "Check your notification settings in your profile. Make sure your browser allows notifications for this site."
    },
    {
      issue: "Data not syncing",
      solution: "Try logging out and logging back in. If issues persist, contact support as there might be a server-side issue."
    }
  ];

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3">
        <HelpCircle className="h-8 w-8 text-primary-600" />
        <h1 className="text-2xl font-bold">Help & Support</h1>
      </div>

      {/* Search Bar */}
      <div className="card bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border border-primary-200 dark:border-primary-700/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary-600" />
          <input
            type="text"
            placeholder="Search help topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:border-primary-600 dark:bg-primary-900/30 bg-white dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Quick Links Sidebar */}
        <div className="w-full md:w-56 shrink-0">
          <div className="card sticky top-6">
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-white">Quick Links</h3>
            </div>
            <nav className="p-2">
              {quickLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => scrollToSection(link.sectionId)}
                  className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all duration-200 text-gray-700 dark:text-gray-300 hover:text-primary-700 dark:hover:text-primary-300"
                >
                  <link.icon className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium">{link.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">

          {/* FAQ Section */}
          <div id="section-faq" className="card scroll-mt-6">
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Frequently Asked Questions</h2>
            </div>
            <div className="p-5 space-y-6">
              {filteredFaqs.map((category) => (
                <div key={category.category}>
                  <button
                    onClick={() => toggleSection(category.category)}
                    className="flex items-center justify-between w-full text-left mb-3"
                  >
                    <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                      {category.category}
                    </h3>
                    {expandedSections.has(category.category) ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>

                  {expandedSections.has(category.category) && (
                    <div className="space-y-4 ml-4">
                      {category.questions.map((faq, index) => (
                        <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                            {faq.question}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {faq.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Troubleshooting */}
          <div id="section-troubleshooting" className="card scroll-mt-6">
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Troubleshooting
              </h2>
            </div>
            <div className="p-5 space-y-4">
              {troubleshooting.map((item, index) => (
                <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    {item.issue}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {item.solution}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Feature Overview */}
          <div id="section-features" className="card scroll-mt-6">
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Feature Overview</h2>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/30 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 cursor-default">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex-shrink-0">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">Team Collaboration</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                    Work together with your team, assign tasks, and track progress in real-time.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/30 hover:shadow-md hover:border-green-300 dark:hover:border-green-600 transition-all duration-200 cursor-default">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/40 flex-shrink-0">
                  <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-100">Analytics & Reports</h3>
                  <p className="text-sm text-green-700 dark:text-green-200 mt-1">
                    Get insights into project performance with comprehensive reporting tools.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/30 hover:shadow-md hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200 cursor-default">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex-shrink-0">
                  <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100">Calendar Integration</h3>
                  <p className="text-sm text-purple-700 dark:text-purple-200 mt-1">
                    View all your tasks and deadlines in an integrated calendar view.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700/30 hover:shadow-md hover:border-orange-300 dark:hover:border-orange-600 transition-all duration-200 cursor-default">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex-shrink-0">
                  <Settings className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-orange-900 dark:text-orange-100">Customizable Settings</h3>
                  <p className="text-sm text-orange-700 dark:text-orange-200 mt-1">
                    Personalize your experience with flexible settings and preferences.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div id="section-contact" className="card bg-gradient-to-black from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border border-primary-200 dark:border-primary-700/50 scroll-mt-6">
            <div className="border-b border-primary-300 dark:border-primary-600/50 px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Need More Help?</h2>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 dark:text-red-300 mb-5">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <div className="flex flex-wrap gap-3">
                <button className="btn btn-primary hover:shadow-lg hover:scale-105 transition-all duration-200">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Support
                </button>
                <button className="btn btn-outline hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:border-primary-400 dark:hover:border-primary-600 transition-all duration-200">
                  <Book className="h-4 w-4 mr-2" />
                  View Documentation
                </button>
                <button className="btn btn-outline hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:border-primary-400 dark:hover:border-primary-600 transition-all duration-200">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Submit Feedback
                </button>
              </div>
            </div>
          </div>

        </div>{/* end flex-1 main content */}
      </div>{/* end flex row */}
    </div>
  );
}