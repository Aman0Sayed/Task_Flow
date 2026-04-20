import { useMemo } from 'react';
import { BarChart3, PieChart, LineChart, Download } from 'lucide-react';
import { useData } from '../context/DataContext';

type StatusKey = 'todo' | 'in-progress' | 'review' | 'done';
type PriorityKey = 'low' | 'medium' | 'high' | 'urgent';

const STATUS_META: Array<{ key: StatusKey; label: string; color: string }> = [
  { key: 'todo', label: 'To Do', color: 'bg-gray-500' },
  { key: 'in-progress', label: 'In Progress', color: 'bg-blue-500' },
  { key: 'review', label: 'Review', color: 'bg-yellow-500' },
  { key: 'done', label: 'Completed', color: 'bg-green-500' },
];

const PRIORITY_META: Array<{ key: PriorityKey; label: string; color: string }> = [
  { key: 'urgent', label: 'Urgent', color: 'bg-red-600' },
  { key: 'high', label: 'High', color: 'bg-red-500' },
  { key: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { key: 'low', label: 'Low', color: 'bg-green-500' },
];

const normalizeStatus = (value?: string): StatusKey => {
  const status = String(value || '').trim().toLowerCase().replace(/\s+/g, '-');
  if (status === 'todo' || status === 'to-do') return 'todo';
  if (status === 'in-progress' || status === 'inprogress') return 'in-progress';
  if (status === 'review') return 'review';
  if (status === 'done' || status === 'completed' || status === 'complete') return 'done';
  return 'todo';
};

const normalizePriority = (value?: string): PriorityKey => {
  const priority = String(value || '').trim().toLowerCase();
  if (priority === 'urgent' || priority === 'critical') return 'urgent';
  if (priority === 'high') return 'high';
  if (priority === 'medium') return 'medium';
  return 'low';
};

const parseDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getProjectId = (project: any): string | null => {
  if (!project) return null;
  if (typeof project === 'string') return project;
  return project._id || project.id || null;
};

export default function Reports() {
  const { tasks, projects, isLoading, error } = useData();

  const reportData = useMemo(() => {
    const normalizedTasks = (tasks || []).map((task: any) => {
      const status = normalizeStatus(task.status);
      const priority = normalizePriority(task.priority);
      const dueDate = parseDate(task.dueDate);
      const projectId = getProjectId(task.project);

      return {
        id: task._id || task.id,
        title: task.title || 'Untitled task',
        status,
        priority,
        dueDate,
        projectId,
      };
    });

    const statusCounts: Record<StatusKey, number> = {
      todo: 0,
      'in-progress': 0,
      review: 0,
      done: 0,
    };
    const priorityCounts: Record<PriorityKey, number> = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    };

    normalizedTasks.forEach((task) => {
      statusCounts[task.status] += 1;
      priorityCounts[task.priority] += 1;
    });

    const now = new Date();
    const upcomingLimit = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const completed = statusCounts.done;
    const inProgress = statusCounts['in-progress'];
    const overdue = normalizedTasks.filter((task) => {
      if (!task.dueDate) return false;
      return task.dueDate < now && task.status !== 'done';
    }).length;
    const upcoming = normalizedTasks.filter((task) => {
      if (!task.dueDate) return false;
      return task.dueDate >= now && task.dueDate <= upcomingLimit && task.status !== 'done';
    }).length;

    const completionRate = normalizedTasks.length > 0
      ? Math.round((completed / normalizedTasks.length) * 100)
      : 0;

    const projectProgress = (projects || []).map((project: any) => {
      const projectId = project._id || project.id;
      const projectTasks = normalizedTasks.filter((task) => task.projectId && task.projectId.toString() === projectId?.toString());
      const total = projectTasks.length;
      const done = projectTasks.filter((task) => task.status === 'done').length;
      const percent = total > 0 ? Math.round((done / total) * 100) : 0;

      return {
        id: projectId,
        name: project.name || 'Untitled project',
        total,
        completed: done,
        percent,
      };
    });

    return {
      totalTasks: normalizedTasks.length,
      statusCounts,
      priorityCounts,
      completed,
      inProgress,
      overdue,
      upcoming,
      completionRate,
      projectProgress,
    };
  }, [projects, tasks]);

  const downloadCsv = () => {
    const lines: string[] = [];
    lines.push('Metric,Value');
    lines.push(`Total Tasks,${reportData.totalTasks}`);
    lines.push(`Completed Tasks,${reportData.completed}`);
    lines.push(`In Progress Tasks,${reportData.inProgress}`);
    lines.push(`Overdue Tasks,${reportData.overdue}`);
    lines.push(`Upcoming (7 days),${reportData.upcoming}`);
    lines.push(`Completion Rate (%),${reportData.completionRate}`);
    lines.push('');
    lines.push('Tasks By Status');
    STATUS_META.forEach((status) => lines.push(`${status.label},${reportData.statusCounts[status.key]}`));
    lines.push('');
    lines.push('Tasks By Priority');
    PRIORITY_META.forEach((priority) => lines.push(`${priority.label},${reportData.priorityCounts[priority.key]}`));
    lines.push('');
    lines.push('Project Progress');
    lines.push('Project,Completed,Total,Percent');
    reportData.projectProgress.forEach((project) => {
      lines.push(`"${project.name.replace(/"/g, '""')}",${project.completed},${project.total},${project.percent}`);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const datePart = new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `taskflow-report-${datePart}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div className="animate-fade-in">Loading reports...</div>;
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <button className="btn btn-outline" onClick={downloadCsv}>
          <Download className="mr-1 h-4 w-4" />
          Export Data
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium">Tasks by Status</h3>
            <div className="rounded-full bg-primary-100 p-2 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              <PieChart className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-4">
            {STATUS_META.map((status) => {
              const count = reportData.statusCounts[status.key];
              const percent = reportData.totalTasks > 0 ? (count / reportData.totalTasks) * 100 : 0;
              return (
                <div key={status.key}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{status.label}</span>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                    <div className={`h-full rounded-full ${status.color}`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium">Tasks by Priority</h3>
            <div className="rounded-full bg-secondary-100 p-2 text-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-400">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-4">
            {PRIORITY_META.map((priority) => {
              const count = reportData.priorityCounts[priority.key];
              const percent = reportData.totalTasks > 0 ? (count / reportData.totalTasks) * 100 : 0;
              return (
                <div key={priority.key}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{priority.label}</span>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                    <div className={`h-full rounded-full ${priority.color}`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium">Task Health</h3>
            <div className="rounded-full bg-accent-100 p-2 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400">
              <LineChart className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center">
              <div className="mr-2 h-2 w-2 rounded-full bg-primary-500" />
              <span className="text-sm">Total Tasks</span>
              <span className="ml-auto text-sm font-medium">{reportData.totalTasks}</span>
            </div>
            <div className="flex items-center">
              <div className="mr-2 h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">Completed</span>
              <span className="ml-auto text-sm font-medium">{reportData.completed}</span>
            </div>
            <div className="flex items-center">
              <div className="mr-2 h-2 w-2 rounded-full bg-yellow-500" />
              <span className="text-sm">In Progress</span>
              <span className="ml-auto text-sm font-medium">{reportData.inProgress}</span>
            </div>
            <div className="flex items-center">
              <div className="mr-2 h-2 w-2 rounded-full bg-red-500" />
              <span className="text-sm">Overdue</span>
              <span className="ml-auto text-sm font-medium">{reportData.overdue}</span>
            </div>
            <div className="mt-4 border-t border-gray-200 pt-3 text-sm dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-300">Completion Rate</span>
              <span className="float-right font-semibold">{reportData.completionRate}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <h3 className="font-medium">Project Progress</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Completion</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Tasks</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {reportData.projectProgress.map((project) => {
                const ratio = project.total > 0 ? project.completed / project.total : 0;
                const statusClass =
                  project.total === 0
                    ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    : ratio === 1
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : ratio > 0.5
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
                const statusLabel =
                  project.total === 0
                    ? 'No Tasks'
                    : ratio === 1
                    ? 'Completed'
                    : ratio > 0.5
                    ? 'On Track'
                    : 'Behind';

                return (
                  <tr key={project.id || project.name} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="whitespace-nowrap px-6 py-4 text-sm">{project.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-full max-w-xs">
                          <div className="flex items-center justify-between">
                            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                              <div className="h-full rounded-full bg-primary-500" style={{ width: `${project.percent}%` }} />
                            </div>
                            <span className="ml-2 text-sm">{project.percent}%</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span>{project.completed}</span>
                      <span className="text-gray-500 dark:text-gray-400">/{project.total}</span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

