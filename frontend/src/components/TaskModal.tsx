import React, { useState } from 'react';
import { Task, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { mockUsers, mockEmployees } from '../lib/mock-data';

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onAssign?: (task: Task, employee: User) => void;
  onApprove?: (taskId: string) => void;
  onCreateTask?: (task: Partial<Task>) => void;
  onStartTask?: (taskId: string) => void;
  onAddPR?: (taskId: string, githubUrl: string, reviewer: User) => void;
  onCompleteTask?: (taskId: string) => void;
  onMoveToQA?: (taskId: string, commitId: string, testerId: string) => void;
  onMoveBack?: (taskId: string, feedback: string) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({
  task,
  isOpen,
  onClose,
  onAssign,
  onApprove,
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
  const [githubUrl, setGithubUrl] = useState('');
  const [selectedReviewer, setSelectedReviewer] = useState<User | null>(null);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [commitId, setCommitId] = useState('');
  const [feedback, setFeedback] = useState('');
  const [selectedTester, setSelectedTester] = useState<User | null>(null);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    dueDate: '',
    tags: [] as string[],
    teamId: '',
  });

  const isCreatingNew = task === null;
  const [teams, setTeams] = useState<any[]>([]);

  React.useEffect(() => {
    if (isOpen && isCreatingNew) {
      const fetchTeams = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`http://localhost:6969/api/teams`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          // Filter teams based on user role? For now, fetch all endpoints.
          setTeams(data);
          if (data.length > 0) {
            setNewTask(prev => ({ ...prev, teamId: data[0].id }));
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchTeams();
    }
  }, [isOpen, isCreatingNew]);

  if (!isOpen) return null;

  const userRole = user?.role?.toLowerCase();
  const isManager = userRole === 'manager' || userRole === 'admin';
  const isReviewer = task?.reviewer?.id === user?.id;
  const isTester = task?.tester?.id === user?.id;

  const handleAssignTask = () => {
    if (task && selectedEmployee && onAssign) {
      onAssign(task, selectedEmployee);
      setShowAssignForm(false);
      setSelectedEmployee(null);
    }
  };

  const handleApproveTask = () => {
    if (task && onApprove) {
      onApprove(task.id);
      onClose();
    }
  };

  const handleCreateTask = () => {
    if (onCreateTask && newTask.title && newTask.description && newTask.teamId) {
      onCreateTask(newTask as Partial<Task> & { teamId: string });
      setNewTask({ title: '', description: '', priority: 'medium', dueDate: '', tags: [], teamId: '' });
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
    if (task && githubUrl && selectedReviewer && onAddPR) {
      onAddPR(task.id, githubUrl, selectedReviewer);
      setGithubUrl('');
      setSelectedReviewer(null);
      setShowPRForm(false);
    }
  };

  const handleMoveToQA = () => {
    if (task && onMoveToQA && commitId && selectedTester) {
      onMoveToQA(task.id, commitId, selectedTester.id);
      setCommitId('');
      setSelectedTester(null);
      onClose();
    }
  };

  const handleMoveBack = () => {
    if (task && onMoveBack && feedback) {
      onMoveBack(task.id, feedback);
      setFeedback('');
      setShowPRForm(false);
      onClose();
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Assign to Team</label>
                <select
                  value={newTask.teamId}
                  onChange={(e) => setNewTask({ ...newTask, teamId: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                >
                  <option value="" disabled>Select a team</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
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
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition ${newTask.tags.includes(tag)
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
                disabled={!newTask.title || !newTask.description || !newTask.teamId}
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
                  <p className="text-sm text-slate-600">Created By</p>
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
                    {task.tags.map((tag: any, idx: number) => {
                      const tagId = tag.id || idx;
                      const tagName = typeof tag === 'string' ? tag : tag.name;
                      return (
                        <span key={tagId} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                          {tagName}
                        </span>
                      );
                    })}
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

              {task?.githubUrl && (
                <div>
                  <p className="text-sm text-slate-600 mb-2">GitHub URL</p>
                  <a
                    href={task.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    {task.githubUrl}
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
              {task?.feedback && (
                <div className="col-span-full">
                  <p className="text-sm text-slate-600 mb-1">Feedback</p>
                  <p className="text-slate-800 bg-red-50 p-3 rounded">{task.feedback}</p>
                </div>
              )}
              {task?.commitId && (
                <div>
                  <p className="text-sm text-slate-600">Commit ID</p>
                  <p className="text-slate-900 font-mono text-sm">{task.commitId}</p>
                </div>
              )}

              {/* Action Buttons based on Status */}
              <div className="flex gap-3 flex-wrap pt-4 border-t border-slate-200">
                {/* Manager Actions */}
                {isManager && task?.isApproved === false && onApprove && (
                  <button
                    onClick={handleApproveTask}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition w-full"
                  >
                    Approve Task
                  </button>
                )}
                {isManager && task?.isApproved !== false && task?.status === 'todo' && (
                  <div className="w-full space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200 mt-4">
                    <label className="block text-sm font-medium text-slate-700">Assign to Employee</label>

                    <input
                      type="text"
                      placeholder="Type to search employees..."
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-600 outline-none mb-2 text-sm"
                    />

                    {(() => {
                      const allEmployeesOnTeam = [
                        ...((task?.team?.members as any[]) || []),
                        ...((task?.team?.managers as any[]) || [])
                      ].filter((v, i, a) => v?.user && a.findIndex(t => (t?.user?.id === v?.user?.id)) === i);

                      const filteredEmployees = allEmployeesOnTeam.filter((m: any) =>
                        m?.user?.firstName?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
                        m?.user?.lastName?.toLowerCase().includes(employeeSearch.toLowerCase())
                      );

                      return (
                        <div className="flex gap-2">
                          <select
                            value={selectedEmployee?.id || ''}
                            onChange={(e) => {
                              const emp = filteredEmployees.find((m: any) => m.user?.id === e.target.value);
                              if (emp) {
                                setSelectedEmployee({
                                  id: emp.user.id,
                                  name: `${emp.user.firstName} ${emp.user.lastName}`,
                                  email: emp.user.email,
                                  role: emp.user.role,
                                  isOnBoarded: emp.user.isOnBoarded,
                                  avatar: emp.user.avatar
                                } as User);
                              } else {
                                setSelectedEmployee(null);
                              }
                            }}
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-600 outline-none"
                          >
                            <option value="">Select an employee from team</option>
                            {filteredEmployees.map((member: any) => (
                              <option key={member.user?.id} value={member.user?.id}>
                                {member.user?.firstName} {member.user?.lastName} {task?.team?.managers?.some((m: any) => m.user?.id === member.user?.id) ? '(Manager)' : ''}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={handleAssignTask}
                            disabled={!selectedEmployee}
                            className="px-4 py-2 bg-green-600 w-32 shrink-0 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:bg-slate-300"
                          >
                            Confirm Assign
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {userRole === 'employee' && (task?.status === 'assigned' || task?.status === 'in-progress') && task?.assignedTo?.id === user?.id && (
                  <>
                    {!showPRForm ? (
                      <button
                        onClick={() => setShowPRForm(true)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
                      >
                        Submit PR for Review
                      </button>
                    ) : (
                      <div className="w-full space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">GitHub PR URL</label>
                          <input
                            type="text"
                            placeholder="https://github.com/..."
                            value={githubUrl}
                            onChange={(e) => setGithubUrl(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Select Reviewer</label>
                          <select
                            value={selectedReviewer?.id || ''}
                            onChange={(e) => {
                              const mgr = task?.team?.managers?.find((m: any) => m.user.id === e.target.value);
                              const mem = task?.team?.members?.find((m: any) => m.user.id === e.target.value);
                              const selectedUser = mgr ? mgr.user : mem ? mem.user : null;
                              setSelectedReviewer(selectedUser ? {
                                id: selectedUser.id,
                                name: `${selectedUser.firstName} ${selectedUser.lastName}`,
                                email: selectedUser.email,
                                role: selectedUser.role,
                                avatar: selectedUser.avatar || '',
                                isOnBoarded: selectedUser.isOnBoarded
                              } : null);
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                          >
                            <option value="">Select a reviewer</option>
                            {task?.team?.managers?.map((m: any) => (
                              <option key={m.user.id} value={m.user.id}>
                                {m.user.firstName} {m.user.lastName} (Manager)
                              </option>
                            ))}
                            {task?.team?.members?.map((m: any) => (
                              <option key={m.user.id} value={m.user.id}>
                                {m.user.firstName} {m.user.lastName}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSubmitPR}
                            disabled={!githubUrl || !selectedReviewer}
                            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:bg-slate-300"
                          >
                            Submit
                          </button>
                          <button
                            onClick={() => {
                              setShowPRForm(false);
                              setGithubUrl('');
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
                {(isManager || isReviewer) && task?.status === 'review' && (
                  <div className="flex flex-col gap-4 w-full">
                    <div className="w-full p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Merge \u0026 Provide Commit ID</label>
                      <input
                        type="text"
                        placeholder="e.g. 5f4a7c8"
                        value={commitId}
                        onChange={(e) => setCommitId(e.target.value)}
                        className="w-full px-3 py-2 mb-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 outline-none"
                      />
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Select QA Tester</label>
                        <select
                          value={selectedTester?.id || ''}
                          onChange={(e) => {
                            const mgr = task?.team?.managers?.find((m: any) => m.user.id === e.target.value);
                            const mem = task?.team?.members?.find((m: any) => m.user.id === e.target.value);
                            const selectedUser = mgr ? mgr.user : mem ? mem.user : null;
                            setSelectedTester(selectedUser ? {
                              id: selectedUser.id,
                              name: `${selectedUser.firstName} ${selectedUser.lastName}`,
                              email: selectedUser.email,
                              role: selectedUser.role,
                              avatar: selectedUser.avatar || '',
                              isOnBoarded: selectedUser.isOnBoarded
                            } : null);
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 outline-none"
                        >
                          <option value="">Select a tester</option>
                          {task?.team?.managers?.map((m: any) => (
                            <option key={m.user.id} value={m.user.id}>
                              {m.user.firstName} {m.user.lastName} (Manager)
                            </option>
                          ))}
                          {task?.team?.members?.map((m: any) => (
                            <option key={m.user.id} value={m.user.id}>
                              {m.user.firstName} {m.user.lastName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={handleMoveToQA}
                        disabled={!commitId || !selectedTester}
                        className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition disabled:bg-slate-300"
                      >
                        Approve \u0026 Move to QA
                      </button>
                    </div>

                    <div className="w-full p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Reject \u0026 Provide Feedback</label>
                      <textarea
                        placeholder="Why is it rejected?"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 outline-none mb-2"
                        rows={3}
                      />
                      <button
                        onClick={handleMoveBack}
                        disabled={!feedback}
                        className="w-full px-4 py-2 bg-slate-400 text-white rounded-lg font-medium hover:bg-slate-500 transition disabled:bg-slate-300"
                      >
                        Reject \u0026 Move to In Progress
                      </button>
                    </div>
                  </div>
                )}

                {(isManager || isTester) && task?.status === 'qa' && (
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
