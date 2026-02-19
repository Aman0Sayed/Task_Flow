import { useState, useEffect } from 'react';
import { Filter, Search, Plus, ListFilter, LayoutGrid } from 'lucide-react';
import TaskCard from '../components/dashboard/TaskCard';
import Badge from '../components/ui/Badge';
import NewTaskModal from '../components/modals/NewTaskModal';
import { isManager } from '../lib/managerUtils';
import { useAppSelector } from '../hooks/hook';
import type { RootState } from '../app/store';
import { useSearchParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { TaskCardSkeleton } from '../components/ui/skeleton';

// Define the Task type based on your backend schema, but match the mockData Task type
// so TaskCard works without type errors
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'Review' | 'Completed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: 'Admin' | 'Project Manager' | 'Developer' | 'Designer' | 'Tester';
    department: string;
  };
  dueDate: string;
  project: {
    id: string;
    name: string;
    description: string;
    status: 'Active' | 'Completed' | 'On Hold';
    progress: number;
    dueDate: string;
    owner: any;
    members: any[];
    createdAt: string;
    tasksCount: { total: number; completed: number };
  };
  createdAt: string;
  tags: string[];
  comments: number;
  attachments: number;
}

export default function Tasks() {
  const user = useAppSelector((state: RootState) => state.auth.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);

  const { tasks, isLoading, refetchData } = useData();

  // Get search term from URL parameters
  useEffect(() => {
    const searchFromUrl = searchParams.get('search');
    if (searchFromUrl) {
      setSearchTerm(searchFromUrl);
    }
  }, [searchParams]);

  const filteredTasks = tasks.filter(task => {
    // Filter by status
    const statusMatch = filter === 'all' || (() => {
      const normalized = (task.status || '').toLowerCase().replace(' ', '-');
      return (
        normalized === filter ||
        (filter === 'to-do' && (normalized === 'todo' || normalized === 'to-do')) ||
        (filter === 'completed' && (normalized === 'done' || normalized === 'completed'))
      );
    })();

    // Filter by search term
    const searchMatch = !searchTerm || 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.project?.name.toLowerCase().includes(searchTerm.toLowerCase());

    return statusMatch && searchMatch;
  });

  const handleNewTask = async (taskData: any) => {
    const token = localStorage.getItem('token');
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const res = await fetch(`${BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(taskData),
    });
    if (res.ok) {
      refetchData(); // Refetch all data instead of manually updating
    }
    setIsNewTaskModalOpen(false);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <button 
          className="btn btn-primary"
          onClick={() => isManager(user ?? undefined) && setIsNewTaskModalOpen(true)}
          disabled={!isManager(user ?? undefined)}
          title={isManager(user ?? undefined) ? undefined : 'Only manager@gmail.com can create tasks'}
        >
          <Plus className="mr-1 h-4 w-4" />
          New Task
        </button>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {['all', 'to-do', 'in-progress', 'review', 'completed'].map((status) => (
            <button
              key={status}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                filter === status
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
              onClick={() => setFilter(status)}
            >
              {status === 'all' 
                ? 'All' 
                : status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </button>
          ))}
        </div>        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => {
              const value = e.target.value;
              setSearchTerm(value);
              // Update URL parameters
              const newSearchParams = new URLSearchParams(searchParams);
              if (value) {
                newSearchParams.set('search', value);
              } else {
                newSearchParams.delete('search');
              }
              setSearchParams(newSearchParams);
            }}
            className="h-9 w-full rounded-md border border-gray-300 bg-white pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 sm:w-[250px]"
          />
        </div>        
        <div className="flex space-x-2">
          <div className="flex items-center rounded-md border border-gray-300 dark:border-gray-700">
            <button 
              className={`p-2 ${view === 'grid' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
              onClick={() => setView('grid')}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button 
              className={`p-2 ${view === 'list' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
              onClick={() => setView('list')}
              title="List view"
            >
              <ListFilter className="h-4 w-4" />
            </button>
          </div>
          
          <button className="flex h-9 items-center gap-1 rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Tasks grid or list */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <TaskCardSkeleton key={i} />
          ))}
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
          
          {filteredTasks.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <p className="text-lg text-gray-500 dark:text-gray-400">
                No tasks found. Try adjusting your filters.
              </p>
            </div>
          )}
        </div>
      ) : isLoading ? (
        <div className="card overflow-hidden">
          <div className="p-6">
            <TableSkeleton rows={6} columns={5} />
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Task</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Assignee</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTasks.map((task) => (
                <tr 
                  key={task.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <div>
                      <a href={`/tasks/${task.id}`} className="font-medium hover:text-primary-600 dark:hover:text-primary-400">
                        {task.title}
                      </a>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {task.project?.name}
                      </p>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <Badge className={task.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : task.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}>
                      {task.status}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <Badge className={task.priority === 'High' || task.priority === 'Critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}>
                      {task.priority}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {task.assignee ? (
                      <div className="flex items-center">
                        <div className="h-6 w-6 flex-shrink-0">
                          <div className="h-6 w-6 rounded-full bg-primary-500" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm">{task.assignee.name}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {new Date(task.dueDate!).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredTasks.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-lg text-gray-500 dark:text-gray-400">
                No tasks found. Try adjusting your filters.
              </p>
            </div>
          )}
        </div>
      )}

      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        onSubmit={handleNewTask}
      />
    </div>
 );
}