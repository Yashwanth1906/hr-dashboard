import React, { useState } from 'react';
import AppShell from '../components/AppShell';
import TaskModal from '../components/TaskModal';
import { mockTasks } from '../lib/mock-data';
import { Task, User } from '../types';
import { useAuth } from '../contexts/AuthContext';

const AssignedTasksPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tasks, setTasks] = useState(mockTasks);

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
