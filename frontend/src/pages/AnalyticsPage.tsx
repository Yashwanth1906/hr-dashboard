import React from 'react';
import AppShell from '../components/AppShell';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { mockEmployees, mockAttendance, mockTasks } from '../lib/mock-data';

const AnalyticsPage: React.FC = () => {
  // Task completion data by month
  const taskCompletionData = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    completed: Math.floor(Math.random() * 25) + 10,
    inProgress: Math.floor(Math.random() * 20) + 5,
  }));

  // Tasks by status distribution
  const taskStatusData = [
    { name: 'Completed', value: mockTasks.filter(t => t.status === 'completed').length, color: '#10b981' },
    { name: 'In Progress', value: mockTasks.filter(t => t.status === 'in-progress').length, color: '#3b82f6' },
    { name: 'In Review', value: mockTasks.filter(t => t.status === 'review').length, color: '#f59e0b' },
    { name: 'QA', value: mockTasks.filter(t => t.status === 'qa').length, color: '#06b6d4' },
    { name: 'Assigned', value: mockTasks.filter(t => t.status === 'assigned').length, color: '#a855f7' },
    { name: 'Todo', value: mockTasks.filter(t => t.status === 'todo').length, color: '#6b7280' },
  ];

  // Task completion rate by priority
  const tasksByPriority = [
    { priority: 'Urgent', count: mockTasks.filter(t => t.priority === 'urgent' && t.status === 'completed').length },
    { priority: 'High', count: mockTasks.filter(t => t.priority === 'high' && t.status === 'completed').length },
    { priority: 'Medium', count: mockTasks.filter(t => t.priority === 'medium' && t.status === 'completed').length },
    { priority: 'Low', count: mockTasks.filter(t => t.priority === 'low' && t.status === 'completed').length },
  ];

  // Task velocity over time
  const projectStats = Array.from({ length: 5 }, (_, i) => ({
    week: `Week ${i + 1}`,
    tasksCompleted: Math.floor(Math.random() * 15) + 5,
    tasksCreated: Math.floor(Math.random() * 12) + 3,
  }));

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
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-slate-600 text-sm font-medium">Total Tasks</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{mockTasks.length}</p>
            <p className="text-sm text-blue-600 mt-2">Across all projects</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-slate-600 text-sm font-medium">Completed Tasks</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{mockTasks.filter(t => t.status === 'completed').length}</p>
            <p className="text-sm text-slate-600 mt-2">{((mockTasks.filter(t => t.status === 'completed').length / mockTasks.length) * 100).toFixed(1)}% completion rate</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-slate-600 text-sm font-medium">In Progress</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{mockTasks.filter(t => t.status === 'in-progress').length}</p>
            <p className="text-sm text-slate-600 mt-2">Active development</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-slate-600 text-sm font-medium">Average Priority</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">High</p>
            <p className="text-sm text-amber-600 mt-2">Team focus level</p>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task Completion Trends */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Task Completion Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={taskCompletionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="completed" fill="#10b981" stroke="#10b981" name="Completed" />
                <Area type="monotone" dataKey="inProgress" fill="#3b82f6" stroke="#3b82f6" name="In Progress" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Task Status Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Tasks by Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task Velocity */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Task Velocity by Week</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="tasksCompleted" fill="#10b981" name="Completed" />
                <Bar dataKey="tasksCreated" fill="#f59e0b" name="Created" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Task Completion by Priority */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Completed Tasks by Priority</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tasksByPriority}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="priority" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Statistics */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Project & Team Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
              <p className="text-slate-600 text-sm font-medium">Total Tasks</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{mockTasks.length}</p>
              <p className="text-xs text-slate-500 mt-1">All statuses</p>
            </div>
            <div className="border border-green-200 bg-green-50 rounded-lg p-4">
              <p className="text-slate-600 text-sm font-medium">Completion Rate</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{((mockTasks.filter(t => t.status === 'completed').length / mockTasks.length) * 100).toFixed(0)}%</p>
              <p className="text-xs text-slate-500 mt-1">Of total tasks</p>
            </div>
            <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
              <p className="text-slate-600 text-sm font-medium">High Priority</p>
              <p className="text-2xl font-bold text-orange-600 mt-2">{mockTasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length}</p>
              <p className="text-xs text-slate-500 mt-1">Tasks requiring attention</p>
            </div>
            <div className="border border-purple-200 bg-purple-50 rounded-lg p-4">
              <p className="text-slate-600 text-sm font-medium">In Review/QA</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">{mockTasks.filter(t => t.status === 'review' || t.status === 'qa').length}</p>
              <p className="text-xs text-slate-500 mt-1">Pending approval</p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default AnalyticsPage;
