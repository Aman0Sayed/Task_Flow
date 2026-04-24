import { Link } from 'react-router-dom';
import { formatDate, getPriorityColor, getStatusColor } from '../../lib/utils';
import Avatar from '../ui/Avatar';
import { MessageSquare, Paperclip, Clock } from 'lucide-react';

interface TaskCardProps {
  task: any; // Accept any shape from backend
  showAssignButton?: boolean;
  onAssignClick?: (task: any) => void;
  showAddAssigneeButton?: boolean;
  onAddAssigneeClick?: (task: any) => void;
}

export default function TaskCard({ task, showAssignButton, onAssignClick, showAddAssigneeButton, onAddAssigneeClick }: TaskCardProps) {
  const commentCount = Array.isArray(task.comments) ? task.comments.length : Number(task.comments || 0);
  const attachmentCount = Array.isArray(task.attachments) ? task.attachments.length : Number(task.attachments || 0);
  const dueDate = task?.dueDate ? new Date(task.dueDate) : null;
  const hasValidDueDate = dueDate && !Number.isNaN(dueDate.getTime());

  return (
    <div className="card hover:shadow-md dark:hover:shadow-none transition-shadow">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <Link 
            to={`/tasks/${task._id || task.id}`}
            className="font-medium hover:text-primary-600 dark:hover:text-primary-400"
            draggable={false}
          >
            {task.title}
          </Link>
          
          <div className="flex items-center space-x-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(task.status)}`}>
              {task.status}
            </span>
          </div>
        </div>
        
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {task.description}
        </p>
        
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {task.assignee && (task.assignee.id || task.assignee._id) ? (
              <div className="flex items-center gap-2">
                <Avatar 
                  name={task.assignee.name || 'User'} 
                  size="xs" 
                />
                <span className="text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 px-2 py-0.5 rounded">
                  Assigned
                </span>
                {showAddAssigneeButton && typeof onAddAssigneeClick === 'function' && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onAddAssigneeClick(task);
                    }}
                    className="inline-flex h-5 w-5 items-center justify-center rounded border border-gray-300 bg-white text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                    title="Add another assignee"
                  >
                    +
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Unassigned
                </span>
                {showAssignButton && typeof onAssignClick === 'function' && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onAssignClick(task);
                    }}
                    className="rounded-md border border-gray-300 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                    title="Assign this task to a team member"
                  >
                    Assign
                  </button>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="text-xs">{commentCount}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Paperclip className="h-3.5 w-3.5" />
              <span className="text-xs">{attachmentCount}</span>
            </div>
          </div>
          
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <Clock className="mr-1 h-3.5 w-3.5" />
            <span>{hasValidDueDate ? `Due ${formatDate(dueDate)}` : 'No due date'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
