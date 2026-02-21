import React, { useState } from 'react';
import { Task, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { mockUsers, mockEmployees } from '../lib/mock-data';

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onAssign?: (task: Task, employee: User) => void;
  onCreateTask?: (task: Partial<Task>) => void;
  onStartTask?: (taskId: string) => void;
  onAddPR?: (taskId: string, prLink: string, reviewer: User) => void;
  onCompleteTask?: (taskId: string) => void;
  onMoveToQA?: (taskId: string) => void;
  onMoveBack?: (taskId: string) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({
  task,
  isOpen,
  onClose,
  onAssign,
  onCreateTask,
  onStartTask,
  onAddPR,
  onCompleteTask,
  onMoveToQA,
  onMoveBack,
}) => {
  const { user } = useAuth();
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPRForm, setShowPRForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [prLink, setPrLink] = useState('');
  const [selectedReviewer, setSelectedReviewer] = useState<User | null>(null);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    dueDate: '',
    tags: [] as string[],
  });

  if (!isOpen) return null;

  const isManager = user?.role === 'manager' || user?.role === 'admin';
  const isCreatingNew = task === null;

  const handleAssignTask = () => {
    if (task && selectedEmployee && onAssign) {
      onAssign(task, selectedEmployee);
      setShowAssignForm(false);
      setSelectedEmployee(null);
    }
  };

  const handleCreateTask = () => {
    if (onCreateTask && newTask.title && newTask.description) {
      onCreateTask(newTask as Partial<Task>);
      setNewTask({ title: '', description: '', priority: 'medium', dueDate: '', tags: [] });
      setShowCreateForm(false);
      onClose();
    }
  };

  const handleStartTask = () => {
    if (task && onStartTask) {
      onStartTask(task.id);
      onClose();
    }
  };

  const handleSubmitPR = () => {
    if (task && prLink && selectedReviewer && onAddPR) {
      onAddPR(task.id, prLink, selectedReviewer);
      setPrLink('');
      setSelectedReviewer(null);
      setShowPRForm(false);
    }
  };

  const handleMoveToQA = () => {
    if (task && onMoveToQA) {
      onMoveToQA(task.id);
      onClose();
    }
  };

  const handleMoveBack = () => {
    if (task && onMoveBack) {
      onMoveBack(task.id);
      setShowPRForm(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {isCreatingNew ? 'Create New Task' : task?.title || 'Task Details'}
            </h2>
            {task && (
              <p className="text-sm text-slate-500 mt-1">Task ID: {task.id}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isCreatingNew ? (
            // Create Task Form
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  placeholder="Task title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  placeholder="Task description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition min-h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tags</label>
                <div className="flex gap-2 flex-wrap">
                  {['features', 'bugs', 'refactors'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        if (newTask.tags.includes(tag)) {
                          setNewTask({ ...newTask, tags: newTask.tags.filter(t => t !== tag) });
                        } else {
                          setNewTask({ ...newTask, tags: [...newTask.tags, tag] });
                        }
                      }}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                        newTask.tags.includes(tag)
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreateTask}
                disabled={!newTask.title || !newTask.description}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-slate-300"
              >
                Create Task
              </button>
            </div>
          ) : (
            // View Task Details
            <>
              {/* Task Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Status</p>
                  <p className="text-lg font-semibold text-slate-900 capitalize">
                    {task?.status.replace('-', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Priority</p>
                  <p className="text-lg font-semibold text-slate-900 capitalize">
                    {task?.priority}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Assigned By</p>
                  <div className="flex items-center gap-2 mt-1">
                    <img
                      src={task?.assignee.avatar}
                      alt={task?.assignee.name}
                      className="w-6 h-6 rounded-full"
                    />
                    <p className="text-slate-900">{task?.assignee.name}</p>
                  </div>
                </div>
                {task?.assignedTo && (
                  <div>
                    <p className="text-sm text-slate-600">Assigned To</p>
                    <div className="flex items-center gap-2 mt-1">
                      <img
                        src={task.assignedTo.avatar}
                        alt={task.assignedTo.name}
                        className="w-6 h-6 rounded-full"
                      />
                      <p className="text-slate-900">{task.assignedTo.name}</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-slate-600 mb-2">Description</p>
                <p className="text-slate-800">{task?.description}</p>
              </div>

              {task?.tags && task.tags.length > 0 && (
                <div>
                  <p className="text-sm text-slate-600 mb-2">Tags</p>
                  <div className="flex gap-2 flex-wrap">
                    {task.tags.map((tag) => (
                      <span key={tag} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <div>
                  <p className="text-sm text-slate-600">Due Date</p>
                  <p className="text-slate-900">{task?.dueDate}</p>
                </div>
                {task?.startedAt && (
                  <div>
                    <p className="text-sm text-slate-600">Started</p>
                    <p className="text-slate-900">{task.startedAt}</p>
                  </div>
                )}
                {task?.completedAt && (
                  <div>
                    <p className="text-sm text-slate-600">Completed</p>
                    <p className="text-slate-900">{task.completedAt}</p>
                  </div>
                )}
              </div>

              {task?.prLink && (
                <div>
                  <p className="text-sm text-slate-600 mb-2">PR Link</p>
                  <a
                    href={task.prLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    {task.prLink}
                  </a>
                </div>
              )}

              {task?.reviewer && (
                <div>
                  <p className="text-sm text-slate-600 mb-2">Reviewer</p>
                  <div className="flex items-center gap-2">
                    <img
                      src={task.reviewer.avatar}
                      alt={task.reviewer.name}
                      className="w-6 h-6 rounded-full"
                    />
                    <p className="text-slate-900">{task.reviewer.name}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons based on Status */}
              <div className="flex gap-3 flex-wrap pt-4 border-t border-slate-200">
                {/* Manager Actions */}
                {isManager && task?.status === 'todo' && (
                  <>
                    {!showAssignForm ? (
                      <button
                        onClick={() => setShowAssignForm(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
                      >
                        Assign Task
                      </button>
                    ) : (
                      <div className="w-full space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <label className="block text-sm font-medium text-slate-700">Select Employee</label>
                        <select
                          value={selectedEmployee?.id || ''}
                          onChange={(e) => {
                            const emp = mockUsers.find(u => u.id === e.target.value);
                            setSelectedEmployee(emp || null);
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-600 outline-none"
                        >
                          <option value="">Select an employee</option>
                          {mockUsers.filter(u => u.role === 'employee').map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name}
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <button
                            onClick={handleAssignTask}
                            disabled={!selectedEmployee}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:bg-slate-300"
                          >
                            Confirm Assign
                          </button>
                          <button
                            onClick={() => {
                              setShowAssignForm(false);
                              setSelectedEmployee(null);
                            }}
                            className="flex-1 px-4 py-2 bg-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-400 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Employee Actions */}
                {user?.role === 'employee' && task?.status === 'assigned' && task?.assignedTo?.id === user?.id && (
                  <button
                    onClick={handleStartTask}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                  >
                    Start Task
                  </button>
                )}

                {user?.role === 'employee' && task?.status === 'in-progress' && task?.assignedTo?.id === user?.id && (
                  <>
                    {!showPRForm ? (
                      <button
                        onClick={() => setShowPRForm(true)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
                      >
                        Add PR & Submit
                      </button>
                    ) : (
                      <div className="w-full space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">GitHub PR URL</label>
                          <input
                            type="text"
                            placeholder="https://github.com/..."
                            value={prLink}
                            onChange={(e) => setPrLink(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Select Reviewer</label>
                          <select
                            value={selectedReviewer?.id || ''}
                            onChange={(e) => {
                              const reviewer = mockUsers.find(u => u.id === e.target.value);
                              setSelectedReviewer(reviewer || null);
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                          >
                            <option value="">Select a reviewer</option>
                            {mockUsers.filter(u => u.role !== 'employee').map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSubmitPR}
                            disabled={!prLink || !selectedReviewer}
                            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:bg-slate-300"
                          >
                            Submit
                          </button>
                          <button
                            onClick={() => {
                              setShowPRForm(false);
                              setPrLink('');
                              setSelectedReviewer(null);
                            }}
                            className="flex-1 px-4 py-2 bg-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-400 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Reviewer Actions */}
                {isManager && task?.status === 'review' && (
                  <div className="w-full space-y-2">
                    <button
                      onClick={handleMoveToQA}
                      className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition"
                    >
                      Move to QA
                    </button>
                    <button
                      onClick={handleMoveBack}
                      className="w-full px-4 py-2 bg-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-400 transition"
                    >
                      Move Back to In-Progress
                    </button>
                  </div>
                )}

                {isManager && task?.status === 'qa' && (
                  <button
                    onClick={onCompleteTask ? () => onCompleteTask(task.id) : undefined}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
                  >
                    Mark as Completed
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
