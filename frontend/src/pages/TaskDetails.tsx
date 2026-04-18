import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock3, FolderKanban, MessageSquare, Send, User2, MoreVertical, Edit, Trash2 } from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import { getPriorityColor, getStatusColor } from '../lib/utils';
import { useAppSelector } from '../hooks/hook';
import { useData } from '../context/DataContext';

interface TaskUser {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
}

interface TaskComment {
  _id?: string;
  user?: TaskUser | string;
  text?: string;
  createdAt?: string;
}

interface TaskData {
  _id: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
  project?: {
    _id?: string;
    name?: string;
  };
  assignee?: TaskUser | null;
  assignedBy?: TaskUser | null;
  comments?: TaskComment[];
  attachments?: Array<{ _id?: string; filename?: string }>;
}

const humanize = (value?: string) => {
  if (!value) return 'Not set';
  return value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDateTime = (value?: string) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleString();
};

export default function TaskDetails() {
  const { id } = useParams();
  const currentUser = useAppSelector((state) => state.auth.user);
  const [task, setTask] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Task settings / edit state
  const navigate = useNavigate();
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState('todo');
  const [editPriority, setEditPriority] = useState('medium');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingTaskAction, setDeletingTaskAction] = useState(false);

  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const { refetchData } = useData();

  const fetchTask = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      const res = await fetch(`${BASE_URL}/api/tasks/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || data?.message || 'Failed to load task details');
      }

      setTask(data.data);
    } catch (err) {
      setTask(null);
      setError(err instanceof Error ? err.message : 'Failed to load task details');
    } finally {
      setLoading(false);
    }
  }, [BASE_URL, id]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const sortedComments = useMemo(() => {
    const comments = Array.isArray(task?.comments) ? [...task.comments] : [];
    return comments.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [task?.comments]);

  const handleSubmitComment = async (event?: any) => {
    event?.preventDefault();

    if (!id || !commentText.trim() || submittingComment) {
      return;
    }

    try {
      setSubmittingComment(true);
      const token = localStorage.getItem('token');

      const res = await fetch(`${BASE_URL}/api/tasks/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text: commentText.trim() }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || data?.message || 'Failed to post comment');
      }

      setCommentText('');
      // Use populated task returned from POST to update comments without refetching whole page
      if (data && data.data) {
        setTask(data.data);
      } else {
        await fetchTask();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Save edits to the task (local update to avoid full-page loader)
  const handleSaveEdit = async () => {
    if (!id) return;
    setSavingEdit(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
          status: editStatus,
          priority: editPriority,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || data?.message || 'Failed to update task');
      }

      // Update local task state with edited fields
      setTask((prev) => (prev ? { ...prev, title: editTitle.trim(), description: editDescription.trim(), status: editStatus, priority: editPriority } : prev));
      setShowEditModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!id) return;
    setDeletingTaskAction(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/tasks/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || data?.message || 'Failed to delete task');
      }

      // Trigger global refetch so the Tasks page shows its loading skeleton
      try {
        refetchData();
      } catch (e) {
        // ignore
      }

      // Navigate back to tasks list after deletion
      navigate('/tasks');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    } finally {
      setDeletingTaskAction(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="animate-fade-in space-y-4">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="card p-6">
            <div className="h-6 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mt-4 h-24 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>

        
      </>
    );
  }

  if (!task) {
    return (
      <div className="animate-fade-in space-y-4">
        <Link to="/tasks" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tasks
        </Link>
        <div className="card p-8 text-center">
          <h1 className="text-xl font-semibold">Task not available</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {error || 'The task may have been removed or you may not have access.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Link to="/tasks" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasks
          </Link>
          <h1 className="text-2xl font-bold">{task.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-wrap gap-2">
            <Badge className={getStatusColor(task.status || 'todo')}>
              {humanize(task.status)}
            </Badge>
            <Badge className={getPriorityColor(task.priority || 'medium')}>
              {humanize(task.priority)}
            </Badge>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowSettingsMenu((s) => !s)}
              aria-label="Task settings"
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {showSettingsMenu && (
              <div className="absolute right-0 mt-2 w-44 rounded-md border bg-white py-1 shadow-md dark:bg-gray-800 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowSettingsMenu(false);
                    // initialize edit fields
                    setEditTitle(task.title || '');
                    setEditDescription(task.description || '');
                    setEditStatus(task.status || 'todo');
                    setEditPriority(task.priority || 'medium');
                    setShowEditModal(true);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <span className="inline-flex items-center gap-2"><Edit className="h-4 w-4" /> Edit Task</span>
                </button>
                <button
                  onClick={() => {
                    setShowSettingsMenu(false);
                    setShowDeleteConfirm(true);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  <span className="inline-flex items-center gap-2"><Trash2 className="h-4 w-4" /> Delete Task</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
        <section className="space-y-6">
          <div className="card overflow-hidden">
            <div className="bg-gradient-to-r from-primary-500/10 via-blue-500/10 to-cyan-500/10 p-6 dark:from-primary-500/20 dark:via-blue-500/20 dark:to-cyan-500/20">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-200">
                Description
              </h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700 dark:text-gray-300">
                {task.description?.trim() || 'No description provided for this task.'}
              </p>
            </div>
          </div>

          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center text-lg font-semibold">
                <MessageSquare className="mr-2 h-5 w-5 text-primary-500" />
                Discussion
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {sortedComments.length} comment{sortedComments.length === 1 ? '' : 's'}
              </span>
            </div>

            <form onSubmit={handleSubmitComment} className="mb-5 space-y-3">
              <textarea
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                rows={3}
                placeholder="Write an update, blocker, or question..."
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || submittingComment}
                  className="btn btn-primary"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {submittingComment ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </form>

            <div className="space-y-4">
              {sortedComments.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  No comments yet. Start the conversation for this task.
                </div>
              ) : (
                sortedComments.map((comment, index) => {
                  const commentUser = typeof comment.user === 'object' ? comment.user : null;
                  const authorName = commentUser?.name || 'Unknown User';
                  const isCurrentUser =
                    Boolean(commentUser?._id) &&
                    (commentUser?._id === currentUser?.id || commentUser?._id === (currentUser as any)?._id);

                  return (
                    <article key={comment._id || `${authorName}-${comment.createdAt}-${index}`} className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
                      <div className="flex items-start gap-3">
                        <Avatar src={commentUser?.avatar} name={authorName} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{authorName}</p>
                            {isCurrentUser && (
                              <Badge variant="primary">You</Badge>
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDateTime(comment.createdAt)}
                            </span>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                            {comment.text || ''}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="card p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Task Info
            </h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <FolderKanban className="mt-0.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span><strong>Project:</strong> {task.project?.name || 'Not set'}</span>
              </div>
              <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <User2 className="mt-0.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span><strong>Assignee:</strong> {task.assignee?.name || 'Unassigned'}</span>
              </div>
              <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <User2 className="mt-0.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span><strong>Assigned By:</strong> {task.assignedBy?.name || 'Unknown'}</span>
              </div>
              <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <CalendarDays className="mt-0.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span><strong>Due:</strong> {formatDateTime(task.dueDate)}</span>
              </div>
              <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <Clock3 className="mt-0.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span><strong>Created:</strong> {formatDateTime(task.createdAt)}</span>
              </div>
              <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <Clock3 className="mt-0.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span><strong>Updated:</strong> {formatDateTime(task.updatedAt)}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}
      </div>

      {/* Edit Task Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-lg font-semibold">Edit Task</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Title</label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Priority</label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300"
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowEditModal(false)} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">Cancel</button>
              <button onClick={handleSaveEdit} disabled={savingEdit} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60">{savingEdit ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-lg font-semibold">Delete Task?</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Are you sure you want to delete this task? This action cannot be undone.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">Cancel</button>
              <button onClick={handleDeleteTask} disabled={deletingTaskAction} className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">{deletingTaskAction ? 'Deleting...' : 'Delete Task'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

