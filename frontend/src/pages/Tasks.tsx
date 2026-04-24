import { useMemo, useState, useEffect } from 'react';
import { Filter, Search, Plus, ListFilter, LayoutGrid } from 'lucide-react';
import TaskCard from '../components/dashboard/TaskCard';
import Badge from '../components/ui/Badge';
import NewTaskModal from '../components/modals/NewTaskModal';
import { isManager } from '../lib/managerUtils';
import { useAppSelector } from '../hooks/hook';
import type { RootState } from '../app/store';
import { Link, useSearchParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { TaskCardSkeleton } from '../components/ui/skeleton';

// Define the Task type based on your backend schema, but match the mockData Task type
// so TaskCard works without type errors
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

export default function Tasks() {
  const user = useAppSelector((state: RootState) => state.auth.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);

  const { tasks, projects, teams, users, isLoading, refetchData } = useData();

  const [assignTeamSnapshot, setAssignTeamSnapshot] = useState<{ teamId: string; owner?: any; members: any[] } | null>(null);
  const [assignTask, setAssignTask] = useState<any | null>(null);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState('');
  const [assignMode, setAssignMode] = useState<'set' | 'add'>('set');
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  const canAssignTasks = (user?.role || '').toLowerCase() === 'manager';

  const getId = (value: any) => {
    if (!value) return null;
    return (value._id || value.id || value) as string;
  };

  const getProjectIdFromTask = (task: any) => {
    if (!task) return null;
    const project = task.project || task.projectId;
    if (!project) return null;
    const projectId = (typeof project === 'string') ? project : getId(project);
    return projectId;
  };

  const assignableMembers = useMemo(() => {
    if (!assignTask) return [];

    const projectId = getProjectIdFromTask(assignTask);
    const projectFromTask = typeof assignTask?.project === 'object' ? assignTask.project : null;
    const project = projectFromTask || projects.find((p: any) => getId(p) === projectId);

    const rawUsers: any[] = [];
    // Prefer team members when project is linked to a team.
    const teamId = getId(project?.team);
    if (teamId) {
      const team = teams.find((t: any) => getId(t) === teamId);

      const snapshot = assignTeamSnapshot && assignTeamSnapshot.teamId === String(teamId) ? assignTeamSnapshot : null;
      const effectiveOwner = snapshot?.owner ?? team?.owner;
      const effectiveMembers = snapshot?.members ?? (Array.isArray(team?.members) ? team.members : []);

      if (effectiveOwner) rawUsers.push(effectiveOwner);
      if (Array.isArray(effectiveMembers)) {
        for (const member of effectiveMembers) rawUsers.push(member?.user ?? member);
      }
    } else {
      // No linked team: include project owner/members and other teams' members
      if (project?.owner) rawUsers.push(project.owner);
      if (Array.isArray(project?.members)) {
        for (const member of project.members) {
          rawUsers.push(member?.user ?? member);
        }
      }

      // If project has no linked team, include members from teams the current user
      // belongs to so managers can pick teammates (they may need adding to project).
      if (Array.isArray(teams)) {
        for (const t of teams) {
          if (t?.owner) rawUsers.push(t.owner);
          if (Array.isArray(t?.members)) {
            for (const member of t.members) rawUsers.push(member?.user ?? member);
          }
        }
      }
    }

    const normalized = rawUsers
      .map((u) => {
        if (!u) return null;
        const id = getId(u);
        if (!id) return null;
        const found = users.find((uu: any) => getId(uu) && getId(uu) === id);
        // Use name first, fallback to email so we don't show 'Unknown'
        const name = u?.name || found?.name || u?.email || found?.email;
        if (!name) return null;
        return {
          id,
          name,
          email: u?.email || found?.email,
          avatar: u?.avatar || found?.avatar
        };
      })
      .filter(Boolean) as Array<{ id: string; name: string; email?: string; avatar?: string }>;

    const unique = new Map<string, { id: string; name: string; email?: string; avatar?: string }>();
    const currentUserId = getId(user);
    for (const member of normalized) {
      // Exclude the current user (manager) from the assignable list
      if (currentUserId && member.id.toString() === currentUserId.toString()) {
        continue;
      }
      unique.set(member.id.toString(), member);
    }

    const result = Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));

    // Mark which users are already project members
    const projectMemberIds = new Set<string>();
    if (project?.owner) projectMemberIds.add(getId(project.owner));
    if (Array.isArray(project?.members)) {
      for (const m of project.members) {
        const uid = getId(m?.user ?? m);
        if (uid) projectMemberIds.add(uid);
      }
    }

    return result.map(r => ({ ...r, inProject: projectMemberIds.has(r.id) }));
  }, [assignTask, assignTeamSnapshot, projects, teams, users]);

  const assignedUserIds = useMemo(() => {
    const ids = new Set<string>();
    const primaryId = getId(assignTask?.assignee);
    if (primaryId) ids.add(primaryId.toString());

    if (Array.isArray(assignTask?.assignees)) {
      for (const a of assignTask.assignees) {
        const id = getId(a);
        if (id) ids.add(id.toString());
      }
    }

    return ids;
  }, [assignTask]);

  // When opening the assign modal, fetch the full team data if it's not present
  // in the `teams` array so we can include its members in the dropdown.
  const fetchTeamSnapshot = async (teamId: string) => {
    try {
      const token = localStorage.getItem('token');
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${BASE_URL}/api/teams/${teamId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return null;
      const data = await res.json().catch(() => ({}));
      const team = data?.data || data;
      return {
        teamId: String(teamId),
        owner: team?.owner,
        members: Array.isArray(team?.members) ? team.members : [],
      };
    } catch {
      return null;
    }
  };

  const openAssignModal = async (task: any) => {
    setAssignError(null);
    setAssignTask(task);
    setAssignMode('set');
    setSelectedAssigneeId('');
    setAssignTeamSnapshot(null);

    // Ensure data is fresh so we don't show stale members
    try {
      await refetchData();
    } catch (e) {
      // ignore
    }

    const projectId = getProjectIdFromTask(task);
    const projectFromTask = typeof task?.project === 'object' ? task.project : null;
    const project = projectFromTask || projects.find((p: any) => getId(p) === projectId);
    const teamId = getId(project?.team);

    if (!teamId) {
      return;
    }

    const snapshot = await fetchTeamSnapshot(String(teamId));
    if (snapshot) setAssignTeamSnapshot(snapshot);
  };

  const openAddAssigneeModal = async (task: any) => {
    setAssignError(null);
    setAssignTask(task);
    setAssignMode('add');
    setSelectedAssigneeId('');
    setAssignTeamSnapshot(null);

    // Refresh data so assignables are current
    try {
      await refetchData();
    } catch (e) {
      // ignore
    }

    const projectId = getProjectIdFromTask(task);
    const projectFromTask = typeof task?.project === 'object' ? task.project : null;
    const project = projectFromTask || projects.find((p: any) => getId(p) === projectId);
    const teamId = getId(project?.team);

    if (!teamId) {
      return;
    }

    const snapshot = await fetchTeamSnapshot(String(teamId));
    if (snapshot) setAssignTeamSnapshot(snapshot);
  }

  useEffect(() => {
    if (!assignTask) return;
    const candidates = assignMode === 'add'
      ? assignableMembers.filter((m: any) => !assignedUserIds.has(m.id?.toString?.() ?? String(m.id)))
      : assignableMembers;

    const defaultAssignee = candidates[0]?.id || '';
    if (defaultAssignee && !selectedAssigneeId) {
      setSelectedAssigneeId(defaultAssignee);
    }
  }, [assignTask, assignableMembers, assignMode, assignedUserIds, selectedAssigneeId]);

  const submitAssignment = async () => {
    if (!assignTask) return;
    if (!selectedAssigneeId) {
      setAssignError('Select a team member to assign.');
      return;
    }

    setAssigning(true);
    setAssignError(null);

    const token = localStorage.getItem('token');
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const taskId = getId(assignTask);
    const projectId = getProjectIdFromTask(assignTask);

    try {
      let existingAssignees = Array.from(assignedUserIds);

      // In add mode, fetch the latest task so we don't accidentally overwrite assignees
      // if the current list view/task object is stale.
      if (assignMode === 'add' && taskId) {
        const currentRes = await fetch(`${BASE_URL}/api/tasks/${taskId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (currentRes.ok) {
          const currentData = await currentRes.json().catch(() => ({}));
          const latest = currentData?.data;
          const ids = new Set<string>(existingAssignees);
          const primaryId = getId(latest?.assignee);
          if (primaryId) ids.add(primaryId.toString());
          if (Array.isArray(latest?.assignees)) {
            for (const a of latest.assignees) {
              const id = getId(a);
              if (id) ids.add(id.toString());
            }
          }
          existingAssignees = Array.from(ids);
        }
      }

      const body = assignMode === 'add'
        ? { assignees: Array.from(new Set([...existingAssignees, selectedAssigneeId])) }
        : { assignee: selectedAssigneeId };

      // If the selected user is not a project member, attempt to add them first.
      const selected = assignableMembers.find((m: any) => m.id === selectedAssigneeId);
      if (selected && selected.inProject === false && projectId) {
        const addRes = await fetch(`${BASE_URL}/api/projects/${projectId}/members`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ userId: selectedAssigneeId, role: 'member' }),
        });

        if (!addRes.ok) {
          const addData = await addRes.json().catch(() => ({}));
          throw new Error(addData?.error || addData?.message || 'Failed to add member to project');
        }
      }

      const res = await fetch(`${BASE_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || data?.message || 'Failed to assign task');
      }

      // Update local task state immediately
      if (data.data) {
        setAssignTask(null);
        setSelectedAssigneeId('');
        setAssignMode('set');
        // Refetch after a short delay to ensure backend has fully processed
        setTimeout(() => refetchData(), 300);
      }
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'Failed to assign task');
    } finally {
      setAssigning(false);
    }
  };

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
          title={isManager(user ?? undefined) ? undefined : 'Only managers can create tasks'}
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
            <TaskCard
              key={task.id || task._id}
              task={task}
              showAssignButton={canAssignTasks && !task.assignee}
              onAssignClick={openAssignModal}
              showAddAssigneeButton={canAssignTasks && !!task.assignee}
              onAddAssigneeClick={openAddAssigneeModal}
            />
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
                  key={task.id || task._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <div>
                      <Link to={`/tasks/${task.id || task._id}`} className="font-medium hover:text-primary-600 dark:hover:text-primary-400">
                        {task.title}
                      </Link>
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
                          <div className="flex items-center gap-2">
                            <p className="text-sm">{task.assignee.name}</p>
                            {canAssignTasks && (
                              <button
                                type="button"
                                onClick={() => openAddAssigneeModal(task)}
                                className="inline-flex h-5 w-5 items-center justify-center rounded border border-gray-300 bg-white text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                                title="Add another assignee"
                              >
                                +
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Unassigned</span>
                        {canAssignTasks && (
                          <button
                            type="button"
                            onClick={() => openAssignModal(task)}
                            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                            title="Assign this task to a team member"
                          >
                            Assign
                          </button>
                        )}
                      </div>
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

      {assignTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !assigning && setAssignTask(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-gray-200 px-5 py-3 dark:border-gray-700">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{assignMode === 'add' ? 'Add Assignee' : 'Assign Task'}</h3>
              <p className="mt-1 line-clamp-1 text-xs text-gray-500 dark:text-gray-400">{assignTask?.title}</p>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Team member</label>
                <select
                  value={selectedAssigneeId}
                  onChange={(event) => setSelectedAssigneeId(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
                >
                  <option value="" disabled>
                    Select a member...
                  </option>
                  {(assignMode === 'add'
                    ? assignableMembers.filter((member: any) => !assignedUserIds.has(member.id?.toString?.() ?? String(member.id)))
                    : assignableMembers
                  ).map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}{member.email ? ` (${member.email})` : ''}
                    </option>
                  ))}
                </select>
                {assignMode === 'add' && assignableMembers.filter((member: any) => !assignedUserIds.has(member.id?.toString?.() ?? String(member.id))).length === 0 ? (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Everyone is already assigned to this task.
                  </p>
                ) : assignableMembers.length === 0 ? (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    No project members found for this task.
                  </p>
                ) : null}
              </div>

              {assignError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                  {assignError}
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setAssignTask(null)}
                  disabled={assigning}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitAssignment}
                  disabled={assigning || !selectedAssigneeId || assignableMembers.length === 0}
                  className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {assigning ? (assignMode === 'add' ? 'Adding...' : 'Assigning...') : (assignMode === 'add' ? 'Add' : 'Assign')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
 );
}
