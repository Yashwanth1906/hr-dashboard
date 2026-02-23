import React, { useState } from 'react';
import AppShell from '../components/AppShell';
import TaskModal from '../components/TaskModal';
import { mockTasks } from '../lib/mock-data';
import { Task, User, TaskStatus, TaskPriority } from '../types';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_URL } from '../utils/utils';

const AssignedTasksPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatTask = (bt: any): Task => ({
    id: bt.id,
    title: bt.title,
    description: bt.description || '',
    status: (bt.status || 'TODO').toLowerCase().replace('_', '-') as TaskStatus,
    priority: (bt.priority || 'MEDIUM').toLowerCase() as TaskPriority,
    assignee: bt.createdBy ? {
      id: bt.createdBy.userId,
      name: `${bt.createdBy.user?.firstName} ${bt.createdBy.user?.lastName}`,
      email: bt.createdBy.user?.email,
      role: bt.createdBy.user?.role?.toLowerCase() as any,
      avatar: bt.createdBy.user?.avatar || `https://ui-avatars.com/api/?name=${bt.createdBy.user?.firstName}+${bt.createdBy.user?.lastName}`,
      isOnBoarded: true
    } : ({} as any),
    assignedTo: bt.assignee ? {
      id: bt.assignee.userId,
      name: `${bt.assignee.user?.firstName} ${bt.assignee.user?.lastName}`,
      email: bt.assignee.user?.email,
      role: bt.assignee.user?.role?.toLowerCase() as any,
      avatar: bt.assignee.user?.avatar || `https://ui-avatars.com/api/?name=${bt.assignee.user?.firstName}+${bt.assignee.user?.lastName}`,
      isOnBoarded: true
    } : undefined,
    dueDate: bt.dueDate ? bt.dueDate.split('T')[0] : '',
    createdAt: bt.createdAt.split('T')[0],
    isApproved: bt.isApproved,
    tags: bt.tags || [],
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
    tester: bt.tester ? {
      id: bt.tester.userId,
      name: `${bt.tester.user?.firstName} ${bt.tester.user?.lastName}`,
      email: bt.tester.user?.email,
      role: bt.tester.user?.role?.toLowerCase() as any,
      avatar: bt.tester.user?.avatar || `https://ui-avatars.com/api/?name=${bt.tester.user?.firstName}+${bt.tester.user?.lastName}`,
      isOnBoarded: true
    } : undefined,
    team: bt.team
  });

  const fetchMyTasks = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/tasks/assigned`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(data.map(formatTask));
    } catch (error) {
      console.error('Failed to fetch my tasks', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchMyTasks();
  }, [user]);

  const userAssignedTasks = tasks.filter(
    t => t.assignedTo?.id === user?.id && ['assigned', 'in-progress', 'review', 'qa'].includes(t.status)
  );

  const statusColors: Record<string, string> = {
    'assigned': 'bg-purple-100 text-purple-700',
    'in-progress': 'bg-blue-100 text-blue-700',
    'review': 'bg-amber-100 text-amber-700',
    'qa': 'bg-cyan-100 text-cyan-700',
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

  const handleStartTask = async (taskId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/tasks/${taskId}`, { status: 'IN_PROGRESS' }, { headers: { Authorization: `Bearer ${token}` } });
      await fetchMyTasks();
      setIsModalOpen(false);
    } catch (e) { console.error(e); }
  };

  const handleAddPR = async (taskId: string, githubUrl: string, reviewer: User) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/tasks/${taskId}`, { status: 'REVIEW', githubUrl, reviewerId: reviewer.id }, { headers: { Authorization: `Bearer ${token}` } });
      await fetchMyTasks();
      setIsModalOpen(false);
    } catch (e) { console.error(e); }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/tasks/${taskId}`, { status: 'COMPLETED' }, { headers: { Authorization: `Bearer ${token}` } });
      await fetchMyTasks();
      setIsModalOpen(false);
    } catch (e) { console.error(e); }
  };

  const handleMoveToQA = async (taskId: string, commitId: string, testerId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/tasks/${taskId}`, { status: 'QA', commitId, testerId }, { headers: { Authorization: `Bearer ${token}` } });
      await fetchMyTasks();
      setIsModalOpen(false);
    } catch (e) { console.error(e); }
  };

  const handleMoveBack = async (taskId: string, feedback: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/tasks/${taskId}`, { status: 'IN_PROGRESS', feedback }, { headers: { Authorization: `Bearer ${token}` } });
      await fetchMyTasks();
      setIsModalOpen(false);
    } catch (e) { console.error(e); }
  };

  const tasksByStatus = {
    assigned: userAssignedTasks.filter(t => t.status === 'assigned'),
    'in-progress': userAssignedTasks.filter(t => t.status === 'in-progress'),
    'review': userAssignedTasks.filter(t => t.status === 'review'),
    'qa': userAssignedTasks.filter(t => t.status === 'qa'),
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <div
      onClick={() => handleTaskClick(task)}
      className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition border-l-4 border-blue-600 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-slate-900 flex-1 line-clamp-2">{task.title}</h3>
        <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ml-2 ${statusColors[task.status]}`}>
          {task.status.replace('-', ' ')}
        </span>
      </div>

      <p className="text-slate-600 text-sm mb-3 line-clamp-2">{task.description}</p>

      <div className="flex items-center justify-between">
        <span className={`px-2 py-1 rounded text-xs font-semibold ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
        <span className="text-xs text-slate-500">{task.dueDate}</span>
      </div>
    </div>
  );

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Assigned Tasks</h1>
          <p className="text-slate-600 mt-2">Tasks assigned to you - manage and track progress</p>
        </div>

        {tasksByStatus.assigned.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Assigned ({tasksByStatus.assigned.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasksByStatus.assigned.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}

        {tasksByStatus['in-progress'].length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">In Progress ({tasksByStatus['in-progress'].length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasksByStatus['in-progress'].map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}

        {tasksByStatus['review'].length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">In Review ({tasksByStatus['review'].length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasksByStatus['review'].map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}

        {tasksByStatus['qa'].length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">QA ({tasksByStatus['qa'].length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasksByStatus['qa'].map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}

        {userAssignedTasks.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-slate-600">No assigned tasks</p>
          </div>
        )}

        <TaskModal
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTask(null);
          }}
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

export default AssignedTasksPage;
