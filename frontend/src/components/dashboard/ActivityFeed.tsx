import Avatar from '../ui/Avatar';

interface ActivityFeedProps {
  activities: any[]; // Accept any shape from backend
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
      return `${interval} year${interval === 1 ? '' : 's'} ago`;
    }
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
      return `${interval} month${interval === 1 ? '' : 's'} ago`;
    }
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
      return `${interval} day${interval === 1 ? '' : 's'} ago`;
    }
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
      return `${interval} hour${interval === 1 ? '' : 's'} ago`;
    }
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
      return `${interval} minute${interval === 1 ? '' : 's'} ago`;
    }
    
    return `${Math.floor(seconds)} second${seconds === 1 ? '' : 's'} ago`;
  };

  // Group consecutive identical activities by same user + action + target
  const groupedActivities = (() => {
    if (!Array.isArray(activities) || activities.length === 0) return [];

    const groups: any[] = [];

    for (const act of activities) {
      const userId = act.user?._id || act.user?.id || act.user?.name || 'unknown';
      const action = act.action || act.type || '';
      const target = act.target || act.description || '';
      const createdAt = act.createdAt || act.timestamp || new Date().toISOString();

      const key = `${userId}::${action}::${target}`;

      const last = groups[groups.length - 1];
      if (last && last.key === key) {
        last.count += 1;
        // keep the latest timestamp (most recent)
        last.latestCreatedAt = new Date(last.latestCreatedAt) > new Date(createdAt) ? last.latestCreatedAt : createdAt;
        // prefer to show the most recent activity object
        last.activity = act;
      } else {
        groups.push({ key, activity: act, count: 1, latestCreatedAt: createdAt });
      }
    }

    return groups;
  })();

  return (
    <div className="card">
      <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
        <h3 className="font-medium">Recent Activity</h3>
      </div>
      
      <div className="p-5">
        <div className="relative">
          {groupedActivities.map((group, i) => {
            const activity = group.activity;
            const count = group.count;
            const time = group.latestCreatedAt;
            return (
              // `group.key` can repeat if the same activity pattern appears again later.
              <div key={`${group.key}::${i}`} className="flex gap-3 pb-6">
                <div className="relative">
                  <Avatar name={activity.user?.name || 'User'} size="sm" />
                  {i !== groupedActivities.length - 1 && (
                    <div className="absolute left-1/2 top-8 bottom-0 w-px -translate-x-1/2 bg-gray-200 dark:bg-gray-700" />
                  )}
                </div>

                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user?.name || 'User'}</span>{' '}
                    {activity.action || activity.type}{' '}
                    <span className="font-medium">{activity.target || activity.description}</span>
                    {count > 1 && (
                      <span className="ml-2 inline-flex items-center rounded-md bg-primary-500/10 px-2 py-0.5 text-xs font-medium text-primary-600 dark:bg-primary-500/20 dark:text-primary-300">x {count}</span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {getTimeAgo(time)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="border-t border-gray-200 px-5 py-3 text-center dark:border-gray-700">
        <button className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
          View all activity
        </button>
      </div>
    </div>
  );
}
