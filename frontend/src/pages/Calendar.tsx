import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CalendarDays, ListTodo } from 'lucide-react';
import Badge from '../components/ui/Badge';
import { useData } from '../context/DataContext';
import { getPriorityColor, getStatusColor } from '../lib/utils';

type CalendarView = 'month' | 'week' | 'day';

interface CalendarTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDateKey: string;
  dueDateRaw?: string;
  projectName?: string;
}

const pad = (value: number) => value.toString().padStart(2, '0');

const toDateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseDueDateKey = (value?: string) => {
  if (!value) return null;

  const raw = String(value).trim();
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
    return raw.slice(0, 10);
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return toDateKey(parsed);
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const getWeekStart = (date: Date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
};

const startOfMonthGrid = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  start.setDate(start.getDate() - start.getDay());
  return start;
};

const endOfMonthGrid = (date: Date) => {
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  end.setDate(end.getDate() + (6 - end.getDay()));
  return end;
};

const isSameDay = (a: Date, b: Date) =>
  a.getDate() === b.getDate() &&
  a.getMonth() === b.getMonth() &&
  a.getFullYear() === b.getFullYear();

const formatViewTitle = (view: CalendarView, date: Date) => {
  if (view === 'month') {
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
  }

  if (view === 'week') {
    const start = getWeekStart(date);
    const end = addDays(start, 6);
    const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();

    if (sameMonth) {
      return `${new Intl.DateTimeFormat('en-US', { month: 'long' }).format(start)} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
    }

    return `${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(start)} - ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(end)}`;
  }

  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(date);
};

const priorityRank: Record<string, number> = {
  urgent: 0,
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export default function Calendar() {
  const { tasks, isLoading, error } = useData();
  const [view, setView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const taskItems = useMemo<CalendarTask[]>(() => {
    return (tasks || [])
      .map((task: any) => {
        const id = task?._id || task?.id;
        const dueDateKey = parseDueDateKey(task?.dueDate);

        if (!id || !dueDateKey) {
          return null;
        }

        return {
          id: String(id),
          title: task?.title || 'Untitled task',
          status: String(task?.status || 'todo'),
          priority: String(task?.priority || 'medium'),
          dueDateKey,
          dueDateRaw: task?.dueDate,
          projectName: task?.project?.name,
        };
      })
      .filter(Boolean)
      .sort((a: CalendarTask, b: CalendarTask) => {
        const dateSort = a.dueDateKey.localeCompare(b.dueDateKey);
        if (dateSort !== 0) return dateSort;

        const aRank = priorityRank[a.priority.toLowerCase()] ?? 4;
        const bRank = priorityRank[b.priority.toLowerCase()] ?? 4;
        if (aRank !== bRank) return aRank - bRank;

        return a.title.localeCompare(b.title);
      }) as CalendarTask[];
  }, [tasks]);

  const tasksByDate = useMemo(() => {
    const grouped = new Map<string, CalendarTask[]>();

    taskItems.forEach((task) => {
      const existing = grouped.get(task.dueDateKey) || [];
      existing.push(task);
      grouped.set(task.dueDateKey, existing);
    });

    return grouped;
  }, [taskItems]);

  const selectedDateKey = toDateKey(selectedDate);
  const selectedDateTasks = tasksByDate.get(selectedDateKey) || [];

  const monthDates = useMemo(() => {
    const dates: Date[] = [];
    const start = startOfMonthGrid(currentDate);
    const end = endOfMonthGrid(currentDate);

    let cursor = new Date(start);
    while (cursor <= end) {
      dates.push(new Date(cursor));
      cursor = addDays(cursor, 1);
    }

    return dates;
  }, [currentDate]);

  const weekDates = useMemo(() => {
    const start = getWeekStart(currentDate);
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }, [currentDate]);

  const onPrev = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
      return;
    }

    if (view === 'week') {
      setCurrentDate(addDays(currentDate, -7));
      return;
    }

    const prev = addDays(currentDate, -1);
    setCurrentDate(prev);
    setSelectedDate(prev);
  };

  const onNext = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
      return;
    }

    if (view === 'week') {
      setCurrentDate(addDays(currentDate, 7));
      return;
    }

    const next = addDays(currentDate, 1);
    setCurrentDate(next);
    setSelectedDate(next);
  };

  const onToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  const renderTaskPill = (task: CalendarTask) => (
    <Link
      key={task.id}
      to={`/tasks/${task.id}`}
      className={`block rounded px-2 py-1 text-xs font-medium transition hover:opacity-90 ${getPriorityColor(task.priority)}`}
      onClick={(event) => event.stopPropagation()}
      title={`${task.title}${task.projectName ? ` - ${task.projectName}` : ''}`}
    >
      {task.title}
    </Link>
  );

  const renderMonthGrid = () => {
    const weekDayLabels = Array.from({ length: 7 }, (_, index) =>
      new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(addDays(getWeekStart(today), index))
    );

    return (
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/70">
          {weekDayLabels.map((label) => (
            <div key={label} className="py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {monthDates.map((date) => {
            const dateKey = toDateKey(date);
            const dayTasks = tasksByDate.get(dateKey) || [];
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            const selected = isSameDay(date, selectedDate);
            const isCurrentDay = isSameDay(date, today);

            return (
              <button
                type="button"
                key={dateKey}
                onClick={() => {
                  setSelectedDate(date);
                  if (!isCurrentMonth) {
                    setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1));
                  }
                }}
                className={`min-h-[128px] border-b border-r border-gray-200 p-2 text-left align-top transition dark:border-gray-700 ${
                  !isCurrentMonth ? 'bg-gray-50 text-gray-400 dark:bg-gray-800/40 dark:text-gray-500' : 'bg-white dark:bg-gray-900'
                } ${selected ? 'ring-2 ring-primary-500 ring-inset' : ''}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                      isCurrentDay ? 'bg-primary-500 text-white' : 'text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  {dayTasks.length > 0 && (
                    <Badge variant="outline">{dayTasks.length}</Badge>
                  )}
                </div>

                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map(renderTaskPill)}
                  {dayTasks.length > 3 && (
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => (
    <div className="grid gap-3 md:grid-cols-7">
      {weekDates.map((date) => {
        const dateKey = toDateKey(date);
        const dayTasks = tasksByDate.get(dateKey) || [];
        const selected = isSameDay(date, selectedDate);
        const isCurrentDay = isSameDay(date, today);

        return (
          <button
            type="button"
            key={dateKey}
            onClick={() => setSelectedDate(date)}
            className={`card min-h-[220px] p-3 text-left transition ${selected ? 'ring-2 ring-primary-500' : ''}`}
          >
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date)}
              </p>
              <p className={`mt-1 text-sm font-semibold ${isCurrentDay ? 'text-primary-600 dark:text-primary-400' : ''}`}>
                {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date)}
              </p>
            </div>

            <div className="space-y-2">
              {dayTasks.length > 0 ? dayTasks.map(renderTaskPill) : (
                <div className="rounded border border-dashed border-gray-300 px-2 py-2 text-center text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  No tasks
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );

  const renderDayView = () => {
    const dayTitle = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(selectedDate);

    return (
      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary-500" />
            <h3 className="text-lg font-semibold">{dayTitle}</h3>
          </div>
          <Badge variant="outline">{selectedDateTasks.length} due</Badge>
        </div>

        {selectedDateTasks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            No tasks due on this date.
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDateTasks.map((task) => (
              <Link key={task.id} to={`/tasks/${task.id}`} className="block rounded-lg border border-gray-200 p-4 transition hover:border-primary-300 hover:bg-primary-50/40 dark:border-gray-700 dark:hover:border-primary-700 dark:hover:bg-primary-900/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{task.title}</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{task.projectName || 'No project'}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(task.status)}`}>{task.status}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Track task deadlines in month, week, or day view.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-md border border-gray-300 dark:border-gray-700">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={onPrev}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-[220px] px-2 text-center text-sm font-semibold">
              {formatViewTitle(view, currentDate)}
            </div>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={onNext}>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <button className="btn btn-outline" onClick={onToday}>Today</button>

          <div className="flex rounded-md border border-gray-300 dark:border-gray-700">
            {(['month', 'week', 'day'] as CalendarView[]).map((mode) => (
              <button
                key={mode}
                className={`px-3 py-1 text-sm font-medium transition ${
                  view === mode
                    ? 'bg-primary-500 text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                onClick={() => {
                  setView(mode);
                  if (mode === 'day') {
                    setCurrentDate(selectedDate);
                  }
                }}
              >
                {mode[0].toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          {isLoading ? (
            <div className="card p-8 text-center text-sm text-gray-500 dark:text-gray-400">Loading calendar...</div>
          ) : (
            <>
              {view === 'month' && renderMonthGrid()}
              {view === 'week' && renderWeekView()}
              {view === 'day' && renderDayView()}
            </>
          )}
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <ListTodo className="h-4 w-4" />
              Selected Date
            </h3>
            <p className="text-sm font-semibold">
              {new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }).format(selectedDate)}
            </p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {selectedDateTasks.length} task{selectedDateTasks.length === 1 ? '' : 's'} due
            </p>
          </div>

          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Due Tasks
            </h3>
            <div className="space-y-2">
              {selectedDateTasks.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No tasks for this date.</p>
              ) : (
                selectedDateTasks.map((task) => (
                  <Link key={task.id} to={`/tasks/${task.id}`} className="block rounded-md border border-gray-200 px-3 py-2 text-sm transition hover:border-primary-300 hover:bg-primary-50/40 dark:border-gray-700 dark:hover:border-primary-700 dark:hover:bg-primary-900/10">
                    <p className="font-medium">{task.title}</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{task.projectName || 'No project'}</p>
                  </Link>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
