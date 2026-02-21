import React, { useState } from 'react';
import AppShell from '../components/AppShell';
import TaskModal from '../components/TaskModal';
import { mockTasks } from '../lib/mock-data';
import { Task, User, TaskTag } from '../types';
import { useAuth } from '../contexts/AuthContext';

const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tasks, setTasks] = useState(mockTasks);

  const filteredTasks = tasks.filter((t) => {
    const statusMatch = statusFilter === 'all' || t.status === statusFilter;
    const tagMatch = tagFilter === 'all' || (t.tags && t.tags.includes(tagFilter as TaskTag));
    const searchMatch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        t.description.toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && tagMatch && searchMatch;
  });

  const statusColors: Record<string, string> = {
    'todo': 'bg-slate-100 text-slate-700',
    'assigned': 'bg-purple-100 text-purple-700',
    'in-progress': 'bg-blue-100 text-blue-700',
    'review': 'bg-amber-100 text-amber-700',
    'qa': 'bg-cyan-100 text-cyan-700',
    'completed': 'bg-green-100 text-green-700',
  };

  const tagColors: Record<string, string> = {
    'features': 'bg-cyan-100 text-cyan-700',
    'bugs': 'bg-red-100 text-red-700',
    'refactors': 'bg-indigo-100 text-indigo-700',
  };

  const priorityColors: Record<string, string> = {
    'low': 'bg-green-100 text-green-700',
    'medium': 'bg-yellow-100 text-yellow-700',
    'high': 'bg-orange-100 text-orange-700',
    'urgent': 'bg-red-100 text-red-700',
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleAssignTask = (task: Task, employee: User) => {
    setTasks(tasks.map(t => {
      if (t.id === task.id) {
        return { ...t, assignedTo: employee, status: 'assigned' as const };
      }
      return t;
    }));
    setIsModalOpen(false);
  };

  const handleCreateTask = (newTaskData: Partial<Task>) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTaskData.title || '',
      description: newTaskData.description || '',
      status: 'todo',
      priority: newTaskData.priority || 'medium',
      assignee: user || mockTasks[0].assignee,
      dueDate: newTaskData.dueDate || '',
      createdAt: new Date().toISOString().split('T')[0],
      tags: newTaskData.tags,
    };
    setTasks([...tasks, newTask]);
    setIsModalOpen(false);
  };

  const handleStartTask = (taskId: string) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, status: 'in-progress' as const, startedAt: new Date().toISOString().split('T')[0] };
      }
      return t;
    }));
    setIsModalOpen(false);
  };

  const handleAddPR = (taskId: string, prLink: string, reviewer: User) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, prLink, reviewer, status: 'review' as const };
      }
      return t;
    }));
    setIsModalOpen(false);
  };

  const handleCompleteTask = (taskId: string) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, status: 'completed' as const, completedAt: new Date().toISOString().split('T')[0] };
      }
      return t;
    }));
    setIsModalOpen(false);
  };

  const handleMoveToQA = (taskId: string) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, status: 'qa' as const };
      }
      return t;
    }));
  };

  const handleMoveBack = (taskId: string) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, status: 'in-progress' as const };
      }
      return t;
    }));
  };

  const handleCreateNewTask = () => {
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Page Header with Create Button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Tasks</h1>
            <p className="text-slate-600 mt-2">Manage and track all team tasks</p>
          </div>
          <button
            onClick={handleCreateNewTask}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Task
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <svg className="absolute left-3 top-3 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search tasks by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition text-slate-900 bg-white"
          />
        </div>

        {/* Status Filter Bar */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
          <div className="flex gap-3 flex-wrap">
            {['all', 'todo', 'assigned', 'in-progress', 'review', 'qa', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-slate-400'
                }`}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Tag Filter Bar */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Tags</label>
          <div className="flex gap-3 flex-wrap">
            {['all', 'features', 'bugs', 'refactors'].map((tag) => (
              <button
                key={tag}
                onClick={() => setTagFilter(tag)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  tagFilter === tag
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-slate-400'
                }`}
              >
                {tag === 'all' ? 'All Tags' : tag}
              </button>
            ))}
          </div>
        </div>

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => handleTaskClick(task)}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border-l-4 border-blue-600 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 flex-1 line-clamp-2">{task.title}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${statusColors[task.status]}`}>
                  {task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('-', ' ')}
                </span>
              </div>

              <p className="text-slate-600 text-sm mb-4 line-clamp-2">{task.description}</p>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2">
                  <img
                    src={task.assignee.avatar}
                    alt={task.assignee.name}
                    className="w-6 h-6 rounded-full bg-slate-300"
                  />
                  <span className="text-sm text-slate-600">{task.assignee.name}</span>
                </div>

                {task.assignedTo && (
                  <div className="flex items-center gap-2">
                    <img
                      src={task.assignedTo.avatar}
                      alt={task.assignedTo.name}
                      className="w-6 h-6 rounded-full bg-slate-300"
                    />
                    <span className="text-sm text-slate-600">→ {task.assignedTo.name}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${priorityColors[task.priority]}`}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </span>
                  <span className="text-sm text-slate-500">{task.dueDate}</span>
                </div>
              </div>

              {task.tags && task.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {task.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`px-2 py-1 rounded text-xs font-medium ${tagColors[tag]}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-slate-600">No tasks found</p>
          </div>
        )}

        {/* Task Modal */}
        <TaskModal
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTask(null);
          }}
          onAssign={handleAssignTask}
          onCreateTask={handleCreateTask}
          onStartTask={handleStartTask}
          onAddPR={handleAddPR}
          onCompleteTask={handleCompleteTask}
          onMoveToQA={handleMoveToQA}
          onMoveBack={handleMoveBack}
        />
      </div>
    </AppShell>
  );
};

export default TasksPage;
