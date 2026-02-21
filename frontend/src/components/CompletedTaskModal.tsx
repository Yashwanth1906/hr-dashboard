import React from 'react';
import { Task } from '../types';

interface CompletedTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

const CompletedTaskModal: React.FC<CompletedTaskModalProps> = ({ task, isOpen, onClose }) => {
  if (!isOpen || !task) return null;

  const statusColors: Record<string, string> = {
    'todo': 'bg-slate-100 text-slate-700',
    'assigned': 'bg-purple-100 text-purple-700',
    'in-progress': 'bg-blue-100 text-blue-700',
    'review': 'bg-amber-100 text-amber-700',
    'qa': 'bg-cyan-100 text-cyan-700',
    'completed': 'bg-green-100 text-green-700',
  };

  const priorityColors: Record<string, string> = {
    'low': 'bg-green-100 text-green-700',
    'medium': 'bg-yellow-100 text-yellow-700',
    'high': 'bg-orange-100 text-orange-700',
    'urgent': 'bg-red-100 text-red-700',
  };

  const tagColors: Record<string, string> = {
    'features': 'bg-cyan-100 text-cyan-700',
    'bugs': 'bg-red-100 text-red-700',
    'refactors': 'bg-indigo-100 text-indigo-700',
  };

  return (
    <div className="fixed inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-8 py-6 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900">{task.title}</h2>
            <p className="text-slate-600 mt-2">{task.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 ml-4 flex-shrink-0"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-6">
          {/* Status and Priority */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${statusColors[task.status]}`}>
                {task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('-', ' ')}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Priority</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${priorityColors[task.priority]}`}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Due Date</p>
              <p className="text-sm text-slate-900 font-medium">{task.dueDate}</p>
            </div>
          </div>

          {/* Assignee Info */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Assigned By</p>
              <div className="flex items-center gap-2">
                <img src={task.assignee.avatar} alt={task.assignee.name} className="w-8 h-8 rounded-full" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{task.assignee.name}</p>
                  <p className="text-xs text-slate-500">{task.assignee.email}</p>
                </div>
              </div>
            </div>

            {task.assignedTo && (
              <div>
                <p className="text-sm font-medium text-slate-600 mb-2">Assigned To</p>
                <div className="flex items-center gap-2">
                  <img src={task.assignedTo.avatar} alt={task.assignedTo.name} className="w-8 h-8 rounded-full" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{task.assignedTo.name}</p>
                    <p className="text-xs text-slate-500">{task.assignedTo.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-slate-600">Created</p>
              <p className="text-sm text-slate-900 mt-1">{task.createdAt}</p>
            </div>
            {task.startedAt && (
              <div>
                <p className="text-sm font-medium text-slate-600">Started</p>
                <p className="text-sm text-slate-900 mt-1">{task.startedAt}</p>
              </div>
            )}
            {task.completedAt && (
              <div>
                <p className="text-sm font-medium text-slate-600">Completed</p>
                <p className="text-sm text-slate-900 mt-1">{task.completedAt}</p>
              </div>
            )}
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag) => (
                  <span key={tag} className={`px-3 py-1 rounded-lg text-sm font-medium ${tagColors[tag]}`}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* PR and Review Info */}
          {(task.prLink || task.reviewer) && (
            <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-slate-900">Work Submission</h3>

              {task.prLink && (
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Pull Request</p>
                  <a
                    href={task.prLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-2"
                  >
                    {task.prLink}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}

              {task.reviewer && (
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">Reviewed By</p>
                  <div className="flex items-center gap-2">
                    <img src={task.reviewer.avatar} alt={task.reviewer.name} className="w-8 h-8 rounded-full" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{task.reviewer.name}</p>
                      <p className="text-xs text-slate-500">{task.reviewer.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Work Summary */}
          <div className="border border-slate-200 rounded-lg p-4">
            <h3 className="font-semibold text-slate-900 mb-3">Work Summary</h3>
            <div className="space-y-2 text-sm text-slate-700">
              <p>
                <strong>Task Duration:</strong> {task.startedAt && task.completedAt
                  ? `From ${task.startedAt} to ${task.completedAt}`
                  : 'Not started or incomplete'}
              </p>
              <p>
                <strong>Current Status:</strong> {task.status === 'completed' ? '✓ Completed successfully' : 'In progress'}
              </p>
              {task.prLink && (
                <p>
                  <strong>Deliverable:</strong> Pull Request submitted for code review
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-8 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-200 text-slate-900 rounded-lg font-medium hover:bg-slate-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompletedTaskModal;
