import { useState, useEffect } from 'react';
import { Filter, Search, Plus } from 'lucide-react';
import ProjectCard from '../components/dashboard/ProjectCard';
import NewProjectModal from '../components/modals/NewProjectModal';
import EditProjectModal from '../components/modals/EditProjectModal';
import { useAppSelector } from '../hooks/hook';
import { isManager } from '../lib/managerUtils';

export default function Projects() {
  const user = useAppSelector((state) => state.auth.user);
  const [filter, setFilter] = useState('all');
  const [projects, setProjects] = useState<any[]>([]);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const fetchProjects = async () => {
    if (user) {
      const token = localStorage.getItem('token');
      const BASE_URL =
        window.location.hostname === 'localhost'
          ? 'http://localhost:5000'
          : 'https://task-flow-backend-nowictqd0-aman0sayeds-projects.vercel.app';
      const res = await fetch(`${BASE_URL}/api/projects`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setProjects((data.data || []).map((p: any) => ({ ...p, id: p._id })));
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const statusMap = {
    active: 'active',
    completed: 'completed',
    'on hold': 'on-hold',
    'on-hold': 'on-hold',
    planning: 'planning',
  };
  const mappedStatus = (filter: string) =>
    statusMap[filter as keyof typeof statusMap] || filter;
  const filteredProjects = filter === 'all'
    ? projects
    : projects.filter(project => {
        const status = (project.status || '').toLowerCase();
        return status === mappedStatus(filter);
      });

  const handleNewProject = async (projectData: any) => {
    const token = localStorage.getItem('token');
    const BASE_URL =
      window.location.hostname === 'localhost'
        ? 'http://localhost:5000'
        : 'https://task-flow-backend-nowictqd0-aman0sayeds-projects.vercel.app';
    const res = await fetch(`${BASE_URL}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(projectData),
    });
    if (res.ok) {
      await fetchProjects();
    }
    setIsNewProjectModalOpen(false);
  };

  const handleProjectSelect = (project: any) => {
    setSelectedProject(project);
    setIsEditModalOpen(true);
  };

  const handleEditProject = async (updatedProject: any) => {
    await fetchProjects();
    setIsEditModalOpen(false);
    setSelectedProject(null);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
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

      {/* Filters and search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex space-x-2">
          {['all', 'active', 'completed', 'on hold'].map((status) => (
            <button
              key={status}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                filter === status
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        
        <div className="flex space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
            <input
              type="search"
              placeholder="Search projects..."
              className="h-9 w-full rounded-md border border-gray-300 bg-transparent py-2 pl-9 pr-4 text-sm placeholder:text-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:placeholder:text-gray-400 sm:w-64"
            />
          </div>
          
          <button className="flex h-9 items-center gap-1 rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
            <Filter className="h-3.5 w-3.5" />
            <span>More Filters</span>
          </button>
        </div>
      </div>

      {/* Projects grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map(project => (
          <ProjectCard 
            key={project._id || project.id} 
            project={project}
            onProjectSelect={handleProjectSelect}
          />
        ))}
        
        {filteredProjects.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <p className="text-lg text-gray-500 dark:text-gray-400">
              No projects found. Try adjusting your filters.
            </p>
          </div>
        )}
      </div>

      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onSubmit={handleNewProject}
      />

      <EditProjectModal
        isOpen={isEditModalOpen}
        project={selectedProject}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedProject(null);
        }}
        onSubmit={handleEditProject}
      />
    </div>
  );
}