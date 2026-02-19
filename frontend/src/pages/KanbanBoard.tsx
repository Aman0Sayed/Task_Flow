import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import KanbanColumn from '../components/kanban/KanbanColumn';
import NewTaskModal from '../components/modals/NewTaskModal';
import { isManager } from '../lib/managerUtils';
import { useAppSelector } from '../hooks/hook';

// Task type copied from Tasks.tsx for consistency
interface Task {
  id: string;
  _id?: string;
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

const COLUMN_CONFIG = [
  { id: 'todo', title: 'To Do' },
  { id: 'inprogress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'completed', title: 'Completed' },
];

export default function KanbanBoard() {
  const user = useAppSelector((state) => state.auth.user);
  const [columns, setColumns] = useState(
    COLUMN_CONFIG.map(col => ({ ...col, tasks: [] as Task[] }))
  );
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    fetch(`${BASE_URL}/api/tasks`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => res.json())
      .then(data => {
        const tasks: Task[] = data.data || data;
        // Map backend status to frontend status
        const statusMap: Record<string, Task['status']> = {
          'todo': 'To Do',
          'in-progress': 'In Progress',
          'review': 'Review',
          'done': 'Completed',
        };
        const mappedTasks = tasks
          .map(task => ({
            ...task,
            id: (task.id || task._id) as string, // Explicitly cast to string
            status: statusMap[task.status] || task.status,
          }))
          .filter(task => typeof task.id === 'string' && !!task.id) as Task[]; // Ensure type is Task[]

        setColumns(
          COLUMN_CONFIG.map(col => ({
            ...col,
            tasks: mappedTasks.filter(task => task.status === col.title),
          }))
        );
      })
      .catch(() => {
        setColumns(COLUMN_CONFIG.map(col => ({ ...col, tasks: [] })));
      });
  }, []);

  // Move task between columns and update backend
  const handleTaskDrop = (taskId: string, targetColumnId: string) => {
    // Find the new status title
    const newStatus = (COLUMN_CONFIG.find(c => c.id === targetColumnId)?.title as Task['status']) || undefined;
    if (!newStatus) return;

    // Flatten all tasks
    const allTasks = columns.flatMap(col => col.tasks);
    // Update the status of the dragged task
    const updatedTasks = allTasks.map(task =>
      task.id === taskId ? { ...task, status: newStatus } : task
    );
    // Rebuild columns based on updated statuses
    setColumns(
      COLUMN_CONFIG.map(col => ({
        ...col,
        tasks: updatedTasks.filter(task => task.status === col.title),
      }))
    );

    // Map frontend status to backend status
    const statusMap: Record<string, string> = {
      'To Do': 'todo',
      'In Progress': 'in-progress',
      'Review': 'review',
      'Completed': 'done',
    };
    const backendStatus = statusMap[newStatus] || newStatus;
    const token = localStorage.getItem('token');
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    // Update backend
    fetch(`${BASE_URL}/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ status: backendStatus }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update task status');
      })
      .catch(() => {
        // Optionally: revert UI or show error
      });
  };

  // Add a new task and update the correct column
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
      // After creating, fetch all tasks to refresh columns
      const tasksRes = await fetch(`${BASE_URL}/api/tasks`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await tasksRes.json();
      const tasks: Task[] = data.data || data;
      const statusMap: Record<string, Task['status']> = {
        'todo': 'To Do',
        'in-progress': 'In Progress',
        'review': 'Review',
        'done': 'Completed',
      };
      const mappedTasks = tasks
        .map(task => ({
          ...task,
          id: (task.id || task._id) as string,
          status: statusMap[task.status] || task.status,
        }))
        .filter(task => typeof task.id === 'string' && !!task.id) as Task[];
      setColumns(
        COLUMN_CONFIG.map(col => ({
          ...col,
          tasks: mappedTasks.filter(task => task.status === col.title),
        }))
      );
    }
    setIsNewTaskModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kanban Board</h1>
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
      {/* Kanban Board */}
      <div className="flex h-[calc(100vh-12rem)] gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            title={column.title}
            tasks={column.tasks}
            columnId={column.id}
            onTaskDrop={handleTaskDrop}
          />
        ))}
        <div className="flex-shrink-0 w-72">
          <button className="flex h-12 w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 font-medium text-gray-500 hover:border-primary-500 hover:text-primary-500 dark:border-gray-700 dark:text-gray-400 dark:hover:border-primary-500 dark:hover:text-primary-400">
            <Plus className="mr-1 h-4 w-4" />
            Add Column
          </button>
        </div>
      </div>
      <NewTaskModal isOpen={isNewTaskModalOpen} onClose={() => setIsNewTaskModalOpen(false)} onSubmit={handleNewTask} />
    </div>
  );
}