import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, CheckCheck, Clock, Users, Plus } from 'lucide-react';
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

  // Calculate stats from preloaded data
  const stats = {
    tasksCompleted: tasks.filter(task => task.status === 'Completed').length,
    tasksInProgress: tasks.filter(task => task.status === 'In Progress').length,
    projectsActive: projects.filter(project => project.status === 'Active').length,
    teamMembers: users.length, // Get team members count from users data
    upcomingDeadlines: tasks.filter(task => {
      const dueDate = new Date(task.dueDate);
      const now = new Date();
      const diffTime = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && diffDays >= 0;
    }).length,
    overdueItems: tasks.filter(task => {
      const dueDate = new Date(task.dueDate);
      const now = new Date();
      return dueDate < now && task.status !== 'Completed';
    }).length,
  };

  // Handle new project creation
  const handleNewProject = (_createdProject: any) => {
    refetchData(); // Refetch all data to include the new project
    setIsNewProjectModalOpen(false);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex space-x-2">
          <button className="btn btn-outline">Export</button>
          <button 
            className="btn btn-primary"
            onClick={() => isManager(user ?? undefined) && setIsNewProjectModalOpen(true)}
            disabled={!isManager(user ?? undefined)}
            title={isManager(user ?? undefined) ? undefined : 'Only manager@gmail.com can create projects'}
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
              title="Tasks Completed"
              value={stats.tasksCompleted}
              icon={CheckCheck}
              iconColor="bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400"
              trend={{ value: 12, direction: 'up' }}
            />
            <StatsCard
              title="In Progress"
              value={stats.tasksInProgress}
              icon={Clock}
              iconColor="bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400"
              trend={{ value: 5, direction: 'up' }}
            />
            <StatsCard
              title="Active Projects"
              value={stats.projectsActive}
              icon={BarChart}
              trend={{ value: 0, direction: 'neutral' }}
            />
            <StatsCard
              title="Team Members"
              value={stats.teamMembers}
              icon={Users}
              iconColor="bg-secondary-100 text-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-400"
              trend={{ value: 2, direction: 'up' }}
            />
          </>
        )}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Projects section */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Active Projects</h2>
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
              ) : projects.filter((project: any) => project.status === 'Active').length > 0 ? (
                projects
                  .filter((project: any) => project.status === 'Active')
                  .slice(0, 2)
                  .map((project: any) => (
                    <ProjectCard key={project._id} project={project} />
                  ))
              ) : (
                <div className="col-span-full flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="text-gray-400 dark:text-gray-500 text-4xl mb-2">📋</div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">None</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">No active projects yet</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tasks section */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Tasks</h2>
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
              ) : (
                tasks.slice(0, 4).map((task: any) => (
                  <TaskCard key={task._id} task={task} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <ActivityFeed activities={activities} />
          <ProjectProgress projects={projects.slice(0, 3)} />
        </div>
      </div>
    </div>
  );
}