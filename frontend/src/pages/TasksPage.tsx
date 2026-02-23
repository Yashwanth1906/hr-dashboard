import React, { useState, useEffect } from 'react';
import AppShell from '../components/AppShell';
import TaskModal from '../components/TaskModal';
import { mockTasks } from '../lib/mock-data';
import { Task, User, TaskTag } from '../types';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_URL } from '../utils/utils';

const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [unapprovedTasks, setUnapprovedTasks] = useState<Task[]>([]);
  const [showUnapproved, setShowUnapproved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const formatTask = (bt: any): Task => ({
    id: bt.id,
    title: bt.title,
    description: bt.description || '',
    status: (bt.status || 'TODO').toLowerCase().replace('_', '-') as any,
    priority: (bt.priority || 'MEDIUM').toLowerCase() as any,
    assignee: bt.createdBy ? {
      id: bt.createdBy.userId,
      name: `${bt.createdBy.user?.firstName} ${bt.createdBy.user?.lastName}`,
      email: bt.createdBy.user?.email,
      role: bt.createdBy.user?.role?.toLowerCase() as any,
      avatar: bt.createdBy.user?.avatar || `https://ui-avatars.com/api/?name=${bt.createdBy.user?.firstName}+${bt.createdBy.user?.lastName}`,
      isOnBoarded: true
    } : ({} as any),
    assignedTo: bt.assignee ? {
      id: bt.assignee.userId, // use userId because frontend dropdown uses user.id
      name: `${bt.assignee.user?.firstName} ${bt.assignee.user?.lastName}`,
      email: bt.assignee.user?.email,
      role: bt.assignee.user?.role?.toLowerCase() as any,
      avatar: bt.assignee.user?.avatar || `https://ui-avatars.com/api/?name=${bt.assignee.user?.firstName}+${bt.assignee.user?.lastName}`,
      isOnBoarded: true
    } : undefined,
    dueDate: bt.dueDate ? bt.dueDate.split('T')[0] : '',
    createdAt: bt.createdAt.split('T')[0],
    isApproved: bt.isApproved,
    tags: bt.tags ? bt.tags.map((t: any) => typeof t === 'string' ? t : t.name) : [],
    githubUrl: bt.githubUrl,
    commitId: bt.commitId,
    feedback: bt.feedback,
    reviewer: bt.reviewer ? {
      id: bt.reviewer.userId,
      name: `${bt.reviewer.user?.firstName} ${bt.reviewer.user?.lastName}`,
      email: bt.reviewer.user?.email,
      role: bt.reviewer.user?.role?.toLowerCase() as any,
      avatar: bt.reviewer.user?.avatar || `https://ui-avatars.com/api/?name=${bt.reviewer.user?.firstName}+${bt.reviewer.user?.lastName}`,
      isOnBoarded: true
    } : undefined,
    team: bt.team,
  });

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const { data } = await axios.get(`${API_URL}/tasks?limit=100`, { headers });
      setTasks(data.tasks ? data.tasks.map(formatTask) : data.map(formatTask));

      if (['admin', 'manager', 'hr'].includes(user?.role || '')) {
        const res = await axios.get(`${API_URL}/tasks/unapproved`, { headers });
        setUnapprovedTasks(res.data.map(formatTask));
      }
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const displayedTasks = (showUnapproved ? unapprovedTasks : tasks).filter((t) => {
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

  const handleAssignTask = async (task: Task, employee: User) => {
    try {
      const token = localStorage.getItem('token');
      // Employee dropdown passes `employee.id` which is User ID. In db we need `Employee id`.
      // The backend `assignTask` should ideally take employeeId. For safety, pass user ID if needed or let backend find employee
      // Note: Assuming we send employee userId if that's all we have.
      // We will actually just fetch tasks again after action.
      // Wait, we can pass assignee ID. We will pass employee.id (which is their User ID).
      // We'll update the backend `assignTask` endpoint to handle it.
      await axios.put(`${API_URL}/tasks/${task.id}/assign`, { assigneeUserId: employee.id }, { headers: { Authorization: `Bearer ${token}` } });
      await fetchTasks();
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveTask = async (taskId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/tasks/${taskId}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
      await fetchTasks();
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTask = async (newTaskData: Partial<Task>) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/tasks`, {
        title: newTaskData.title,
        description: newTaskData.description,
        priority: (newTaskData.priority || 'medium').toUpperCase(),
        dueDate: newTaskData.dueDate || undefined,
        teamId: (newTaskData as any).teamId,
        tags: newTaskData.tags
      }, { headers: { Authorization: `Bearer ${token}` } });

      await fetchTasks();
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartTask = async (taskId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/tasks/${taskId}`, { status: 'IN_PROGRESS' }, { headers: { Authorization: `Bearer ${token}` } });
      await fetchTasks();
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddPR = async (taskId: string, githubUrl: string, reviewer: User) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/tasks/${taskId}`, { status: 'REVIEW', githubUrl, reviewerId: reviewer.id }, { headers: { Authorization: `Bearer ${token}` } });
      await fetchTasks();
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/tasks/${taskId}`, { status: 'COMPLETED' }, { headers: { Authorization: `Bearer ${token}` } });
      await fetchTasks();
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMoveToQA = async (taskId: string, commitId: string, testerId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/tasks/${taskId}`, { status: 'QA', commitId, testerId }, { headers: { Authorization: `Bearer ${token}` } });
      await fetchTasks();
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMoveBack = async (taskId: string, feedback: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/tasks/${taskId}`, { status: 'IN_PROGRESS', feedback }, { headers: { Authorization: `Bearer ${token}` } });
      await fetchTasks();
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
    }
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
          <div className="flex items-center gap-3">
            {['admin', 'manager', 'hr'].includes(user?.role || '') && (
              <button
                onClick={() => setShowUnapproved(!showUnapproved)}
                className={`px-4 py-2 rounded-lg font-medium transition ${showUnapproved ? 'bg-orange-100 text-orange-700' : 'bg-white border border-slate-300 text-slate-700'}`}
              >
                {showUnapproved ? 'View Approved' : `Pending Approvals (${unapprovedTasks.length})`}
              </button>
            )}
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
                className={`px-4 py-2 rounded-lg font-medium transition ${statusFilter === status
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
                className={`px-4 py-2 rounded-lg font-medium transition ${tagFilter === tag
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
          {displayedTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => handleTaskClick(task)}
              className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border-l-4 cursor-pointer ${showUnapproved ? 'border-orange-500 bg-orange-50/10' : 'border-blue-600'}`}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 flex-1 line-clamp-2">{task.title}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${statusColors[task.status] || 'bg-slate-100 text-slate-700'}`}>
                  {task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('-', ' ')}
                </span>
              </div>

              <p className="text-slate-600 text-sm mb-4 line-clamp-2">{task.description}</p>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold bg-slate-200 text-slate-600 px-2 rounded">Created by</span>
                  <img
                    src={task.assignee.avatar}
                    alt={task.assignee.name}
                    className="w-5 h-5 rounded-full bg-slate-300"
                  />
                  <span className="text-sm text-slate-600">{task.assignee.name}</span>
                </div>

                {task.assignedTo && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 rounded">Assigned to</span>
                    <img
                      src={task.assignedTo.avatar}
                      alt={task.assignedTo.name}
                      className="w-5 h-5 rounded-full bg-slate-300"
                    />
                    <span className="text-sm text-slate-700 font-medium">{task.assignedTo.name}</span>
                  </div>
                )}

                <div className="flex items-center justify-between mt-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${priorityColors[task.priority] || 'bg-slate-100'}`}>
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
                      className={`px-2 py-1 rounded text-xs font-medium ${tagColors[tag] || 'bg-slate-100'}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {displayedTasks.length === 0 && (
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
          onApprove={handleApproveTask}
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
