import React, { useState, useEffect } from 'react';
import AppShell from '../components/AppShell';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AnalyticsPage: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:6969/api/analytics/tasks', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTasks(data.tasks || []);
        }
      } catch (e) {
        console.error('Failed to fetch analytics', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  // Use dynamically calculated data based on Tasks

  // Task completion data by month (Jan-Dec of current year)
  const taskCompletionData = Array.from({ length: 12 }, (_, i) => {
    const monthTasks = tasks.filter(t => new Date(t.createdAt).getMonth() === i && new Date(t.createdAt).getFullYear() === new Date().getFullYear());
    return {
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
      completed: monthTasks.filter(t => t.status === 'COMPLETED').length,
      inProgress: monthTasks.filter(t => t.status === 'IN_PROGRESS').length,
    };
  });

  // Tasks by status distribution
  const taskStatusData = [
    { name: 'Completed', value: tasks.filter(t => t.status === 'COMPLETED').length, color: '#10b981' },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'IN_PROGRESS').length, color: '#3b82f6' },
    { name: 'In Review', value: tasks.filter(t => t.status === 'REVIEW').length, color: '#f59e0b' },
    { name: 'QA', value: tasks.filter(t => t.status === 'QA').length, color: '#06b6d4' },
    { name: 'Assigned', value: tasks.filter(t => t.status === 'ASSIGNED').length, color: '#a855f7' },
    { name: 'Todo', value: tasks.filter(t => t.status === 'TODO').length, color: '#6b7280' },
  ].filter(s => s.value > 0); // Only show statuses with non-zero values

  // Task completion rate by priority
  const tasksByPriority = [
    { priority: 'Urgent', count: tasks.filter(t => t.priority === 'URGENT' && t.status === 'COMPLETED').length },
    { priority: 'High', count: tasks.filter(t => t.priority === 'HIGH' && t.status === 'COMPLETED').length },
    { priority: 'Medium', count: tasks.filter(t => t.priority === 'MEDIUM' && t.status === 'COMPLETED').length },
    { priority: 'Low', count: tasks.filter(t => t.priority === 'LOW' && t.status === 'COMPLETED').length },
  ];

  // Task velocity over time (last 5 weeks)
  const projectStats = Array.from({ length: 5 }, (_, i) => {
    // Week 1 refers to the current week
    const weeksAgo = 4 - i;
    const now = new Date();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - (weeksAgo * 7));
    const endOfWeek = new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000);

    const createdInWeek = tasks.filter(t => {
      const d = new Date(t.createdAt);
      return d >= startOfWeek && d <= endOfWeek;
    });

    const completedInWeek = tasks.filter(t => {
      if (!t.completedAt) return false;
      const d = new Date(t.completedAt);
      return d >= startOfWeek && d <= endOfWeek;
    });

    return {
      week: `Week ${5 - weeksAgo}`, // e.g., Week 1, Week 2... up to Week 5 (current week)
      tasksCompleted: completedInWeek.length,
      tasksCreated: createdInWeek.length,
    };
  });

  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;
  const inProgressCount = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const highPriorityCount = tasks.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT').length;
  const reviewQaCount = tasks.filter(t => t.status === 'REVIEW' || t.status === 'QA').length;
  const completionRate = tasks.length > 0 ? ((completedCount / tasks.length) * 100).toFixed(1) : '0';

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-[calc(100vh-100px)] items-center justify-center">
          <div className="text-xl font-semibold text-slate-500">Loading Analytics...</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-600 mt-2">Detailed insights and analytics for your organization</p>
        </div>

        {/* Task Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <p className="text-slate-600 text-sm font-medium">Total Tasks</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{tasks.length}</p>
            <p className="text-sm text-blue-600 mt-2">Across all projects</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <p className="text-slate-600 text-sm font-medium">Completed Tasks</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{completedCount}</p>
            <p className="text-sm text-slate-600 mt-2">{completionRate}% completion rate</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <p className="text-slate-600 text-sm font-medium">In Progress</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{inProgressCount}</p>
            <p className="text-sm text-slate-600 mt-2">Active development</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <p className="text-slate-600 text-sm font-medium">Average Priority</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{highPriorityCount > 0 ? 'High' : 'Normal'}</p>
            <p className="text-sm text-amber-600 mt-2">Team focus level</p>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task Completion Trends */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Task Completion Trends (This Year)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={taskCompletionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <Tooltip cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" />
                <Area type="monotone" dataKey="completed" fill="#10b981" stroke="#10b981" name="Completed" fillOpacity={0.2} strokeWidth={2} />
                <Area type="monotone" dataKey="inProgress" fill="#3b82f6" stroke="#3b82f6" name="In Progress" fillOpacity={0.2} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Task Status Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Tasks by Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              {tasks.length > 0 ? (
                <PieChart>
                  <Pie
                    data={taskStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                    outerRadius={100}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip wrapperStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">Not enough data points yet.</div>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task Velocity */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Task Velocity (Last 5 Weeks)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" />
                <Bar dataKey="tasksCompleted" fill="#10b981" name="Tasks Completed" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="tasksCreated" fill="#f59e0b" name="Tasks Created" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Task Completion by Priority */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Completed Tasks by Priority</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tasksByPriority} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="priority" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="#8b5cf6" name="Completed Tasks" radius={[4, 4, 0, 0]} barSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Statistics */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Project & Team Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 transition-transform hover:scale-105">
              <p className="text-slate-600 text-sm font-medium">Total Tasks</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{tasks.length}</p>
              <p className="text-xs text-slate-500 mt-1">All statuses</p>
            </div>
            <div className="border border-green-200 bg-green-50 rounded-lg p-4 transition-transform hover:scale-105">
              <p className="text-slate-600 text-sm font-medium">Completion Rate</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{completionRate}%</p>
              <p className="text-xs text-slate-500 mt-1">Of total tasks</p>
            </div>
            <div className="border border-orange-200 bg-orange-50 rounded-lg p-4 transition-transform hover:scale-105">
              <p className="text-slate-600 text-sm font-medium">High Priority</p>
              <p className="text-2xl font-bold text-orange-600 mt-2">{highPriorityCount}</p>
              <p className="text-xs text-slate-500 mt-1">Tasks requiring attention</p>
            </div>
            <div className="border border-purple-200 bg-purple-50 rounded-lg p-4 transition-transform hover:scale-105">
              <p className="text-slate-600 text-sm font-medium">In Review/QA</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">{reviewQaCount}</p>
              <p className="text-xs text-slate-500 mt-1">Pending approval</p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default AnalyticsPage;
