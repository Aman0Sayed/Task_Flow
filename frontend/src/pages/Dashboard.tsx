import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, CheckCheck, Clock, Users, Plus, AlertCircle, TrendingUp } from 'lucide-react';
import StatsCard from '../components/dashboard/StatsCard';
import ProjectCard from '../components/dashboard/ProjectCard';
import TaskCard from '../components/dashboard/TaskCard';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import ProjectProgress from '../components/dashboard/ProjectProgress';
import NewProjectModal from '../components/modals/NewProjectModal';
import { useAppSelector } from '../hooks/hook';
import { isManager } from '../lib/managerUtils';
import { useData } from '../context/DataContext';
import { CardSkeleton, StatsCardSkeleton, TaskCardSkeleton } from '../components/ui/skeleton';

export default function Dashboard() {
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const { tasks, projects, isLoading, refetchData, activities, users } = useData();
  const user = useAppSelector((state) => state.auth.user);

  // Calculate stats from real data with better handling
  const stats = useMemo(() => {
    const now = new Date();
    
    return {
      totalProjects: projects.length,
      activeProjects: projects.filter(project => 
        project.status?.toLowerCase() === 'active' || project.status === 'Active'
      ).length,
      totalTasks: tasks.length,
      tasksCompleted: tasks.filter(task => 
        task.status?.toLowerCase() === 'completed' || task.status === 'Completed'
      ).length,
      tasksInProgress: tasks.filter(task => 
        task.status?.toLowerCase() === 'in progress' || task.status === 'In Progress'
      ).length,
      tasksTodo: tasks.filter(task => 
        task.status?.toLowerCase() === 'todo' || task.status === 'To Do'
      ).length,
      teamMembers: users.length,
      upcomingDeadlines: tasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        const diffTime = dueDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7 && diffDays >= 0 && 
               (task.status?.toLowerCase() !== 'completed' && task.status !== 'Completed');
      }).length,
      overdueItems: tasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate < now && 
               (task.status?.toLowerCase() !== 'completed' && task.status !== 'Completed');
      }).length,
      completionRate: tasks.length > 0 
        ? Math.round((tasks.filter(task => 
            task.status?.toLowerCase() === 'completed' || task.status === 'Completed'
          ).length / tasks.length) * 100)
        : 0
    };
  }, [tasks, projects, users]);

  // Handle new project creation
  const handleNewProject = (_createdProject: any) => {
    refetchData(); // Refetch all data to include the new project
    setIsNewProjectModalOpen(false);
  };

  // Get percentage changes (comparing to initial state)
  const getTrendValue = (current: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((current / total) * 100);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back, {user?.name?.split(' ')[0]}! 👋</p>
        </div>
        <div className="flex space-x-2">
          <button className="btn btn-outline">Export</button>
          <button 
            className="btn btn-primary"
            onClick={() => isManager(user ?? undefined) && setIsNewProjectModalOpen(true)}
            disabled={!isManager(user ?? undefined)}
            title={isManager(user ?? undefined) ? '' : 'Only managers can create projects'}
          >
            <Plus className="mr-1 h-4 w-4" />
            New Project
          </button>
        </div>
      </div>
      <NewProjectModal isOpen={isNewProjectModalOpen} onClose={() => setIsNewProjectModalOpen(false)} onSubmit={handleNewProject} />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <StatsCard
              title="Total Tasks"
              value={stats.totalTasks}
              icon={CheckCheck}
              iconColor="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              trend={{ value: getTrendValue(stats.tasksCompleted, stats.totalTasks), direction: 'up' }}
              subtitle={`${stats.tasksCompleted} completed`}
            />
            <StatsCard
              title="In Progress"
              value={stats.tasksInProgress}
              icon={Clock}
              iconColor="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
              trend={{ value: getTrendValue(stats.tasksInProgress, stats.totalTasks), direction: 'up' }}
              subtitle={`${stats.tasksInProgress} active`}
            />
            <StatsCard
              title="Active Projects"
              value={stats.activeProjects}
              icon={BarChart}
              iconColor="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
              trend={{ value: getTrendValue(stats.activeProjects, stats.totalProjects), direction: 'neutral' }}
              subtitle={`${stats.totalProjects} total`}
            />
            <StatsCard
              title="Team Members"
              value={stats.teamMembers}
              icon={Users}
              iconColor="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
              trend={{ value: stats.completionRate, direction: 'up' }}
              subtitle={`${stats.completionRate}% tasks done`}
            />
          </>
        )}
      </div>

      {/* Alert section if there are overdue items */}
      {stats.overdueItems > 0 && !isLoading && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-100">⏰ {stats.overdueItems} Overdue Items</h3>
            <p className="text-sm text-red-700 dark:text-red-300">You have {stats.overdueItems} task{stats.overdueItems !== 1 ? 's' : ''} that are overdue. Please prioritize completing them.</p>
          </div>
        </div>
      )}

      {/* Upcoming Deadlines Alert */}
      {stats.upcomingDeadlines > 0 && !isLoading && stats.overdueItems === 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">📅 {stats.upcomingDeadlines} Upcoming Deadlines</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">You have {stats.upcomingDeadlines} task{stats.upcomingDeadlines !== 1 ? 's' : ''} due within the next 7 days.</p>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Projects section */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Active Projects ({stats.activeProjects})</h2>
              <Link 
                to="/projects" 
                className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                View All
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {isLoading ? (
                <>
                  <CardSkeleton />
                  <CardSkeleton />
                </>
              ) : projects.filter((project: any) => 
                project.status?.toLowerCase() === 'active' || project.status === 'Active'
              ).length > 0 ? (
                projects
                  .filter((project: any) => 
                    project.status?.toLowerCase() === 'active' || project.status === 'Active'
                  )
                  .slice(0, 2)
                  .map((project: any) => (
                    <ProjectCard key={project._id} project={project} />
                  ))
              ) : (
                <div className="col-span-full flex items-center justify-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="text-center">
                    <div className="text-gray-400 dark:text-gray-500 text-4xl mb-2">📋</div>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">No Active Projects</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create your first project to get started</p>
                    {isManager(user ?? undefined) && (
                      <button 
                        onClick={() => setIsNewProjectModalOpen(true)}
                        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        Create Project
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tasks section */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Tasks ({stats.totalTasks})</h2>
              <Link 
                to="/tasks" 
                className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                View All
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {isLoading ? (
                <>
                  <TaskCardSkeleton />
                  <TaskCardSkeleton />
                  <TaskCardSkeleton />
                  <TaskCardSkeleton />
                </>
              ) : tasks.length > 0 ? (
                tasks.slice(0, 4).map((task: any) => (
                  <TaskCard key={task._id} task={task} />
                ))
              ) : (
                <div className="col-span-full flex items-center justify-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="text-center">
                    <div className="text-gray-400 dark:text-gray-500 text-4xl mb-2">✓</div>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">No Tasks Yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All caught up! Create a task to get started</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <ActivityFeed activities={activities} />
          <ProjectProgress projects={projects.filter((p: any) => 
            p.status?.toLowerCase() === 'active' || p.status === 'Active'
          ).slice(0, 3)} />
        </div>
      </div>
    </div>
  );
}