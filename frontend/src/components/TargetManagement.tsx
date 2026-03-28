import React, { useState } from 'react';
import { Target } from '../types';
import { API_URL } from '../utils/utils';
import axios from 'axios';

// ========== Star Rating Component ==========
const StarRating: React.FC<{
  value: number;
  onChange?: (val: number) => void;
  readonly?: boolean;
  max?: number;
}> = ({ value, onChange, readonly = false, max = 5 }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`text-2xl transition ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
        >
          <span className={`${(hover || value) >= star ? 'text-yellow-400' : 'text-slate-300'}`}>
            ★
          </span>
        </button>
      ))}
    </div>
  );
};

// ========== Assign Target Modal ==========
interface AssignTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  onCreated: () => void;
}

export const AssignTargetModal: React.FC<AssignTargetModalProps> = ({
  isOpen, onClose, employeeId, employeeName, onCreated
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/targets`, {
        employeeId, title, description, dueDate: dueDate || null,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setTitle(''); setDescription(''); setDueDate('');
      onCreated();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Assign Target</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
          </div>
          <p className="text-sm text-slate-500 mt-1">Assigning to <span className="font-semibold">{employeeName}</span></p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
            <input
              value={title} onChange={(e) => setTitle(e.target.value)} required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
              placeholder="e.g., Complete Q1 sales report"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
              placeholder="Describe the target..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
            <input
              type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium">Cancel</button>
            <button type="submit" disabled={loading || !title} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
              {loading ? 'Assigning...' : 'Assign Target'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ========== Complete Target Modal (Employee) ==========
interface CompleteTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: Target | null;
  onCompleted: () => void;
}

export const CompleteTargetModal: React.FC<CompleteTargetModalProps> = ({
  isOpen, onClose, target, onCompleted
}) => {
  const [selfRating, setSelfRating] = useState(0);
  const [selfDescription, setSelfDescription] = useState('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (!isOpen || !target) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selfRating === 0) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let evidenceUrl = '';

      // Upload evidence file if provided
      if (evidenceFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', evidenceFile);
        const uploadRes = await axios.post(`${API_URL}/upload`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        evidenceUrl = uploadRes.data.url;
        setUploading(false);
      }

      await axios.put(`${API_URL}/targets/${target.id}/complete`, {
        evidenceUrl, selfRating, selfDescription,
      }, { headers: { Authorization: `Bearer ${token}` } });

      setSelfRating(0); setSelfDescription(''); setEvidenceFile(null);
      onCompleted();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Mark as Completed</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
          </div>
          <p className="text-sm text-slate-500 mt-1">{target.title}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Upload Evidence</label>
            <input
              type="file"
              onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-600 file:font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Self Rating *</label>
            <StarRating value={selfRating} onChange={setSelfRating} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description / Reason *</label>
            <textarea
              value={selfDescription} onChange={(e) => setSelfDescription(e.target.value)} required rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
              placeholder="Describe how you completed this target..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium">Cancel</button>
            <button type="submit" disabled={loading || selfRating === 0} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50">
              {uploading ? 'Uploading...' : loading ? 'Submitting...' : 'Mark Completed'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ========== Review Target Modal (Manager) ==========
interface ReviewTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: Target | null;
  onReviewed: () => void;
}

export const ReviewTargetModal: React.FC<ReviewTargetModalProps> = ({
  isOpen, onClose, target, onReviewed
}) => {
  const [managerRating, setManagerRating] = useState(0);
  const [managerFeedback, setManagerFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !target) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (managerRating === 0) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/targets/${target.id}/review`, {
        managerRating, managerFeedback,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setManagerRating(0); setManagerFeedback('');
      onReviewed();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Review Target</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
          </div>
          <p className="text-sm text-slate-500 mt-1">{target.title}</p>
        </div>
        <div className="p-6 space-y-4">
          {/* Employee submission details */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-slate-900 text-sm">Employee Submission</h3>
            <div>
              <p className="text-xs text-slate-500">Self Rating</p>
              <StarRating value={target.selfRating || 0} readonly />
            </div>
            {target.selfDescription && (
              <div>
                <p className="text-xs text-slate-500">Description</p>
                <p className="text-sm text-slate-700 mt-1">{target.selfDescription}</p>
              </div>
            )}
            {target.evidenceUrl && (
              <div>
                <p className="text-xs text-slate-500">Evidence</p>
                <a href={target.evidenceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                  View Evidence File
                </a>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Your Rating *</label>
              <StarRating value={managerRating} onChange={setManagerRating} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Feedback</label>
              <textarea
                value={managerFeedback} onChange={(e) => setManagerFeedback(e.target.value)} rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                placeholder="Provide feedback..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium">Cancel</button>
              <button type="submit" disabled={loading || managerRating === 0} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50">
                {loading ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ========== Overall Rating Modal ==========
interface OverallRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId?: string;
  employeeName?: string;
  type: 'SELF' | 'MANAGER';
  onSubmitted: () => void;
}

export const OverallRatingModal: React.FC<OverallRatingModalProps> = ({
  isOpen, onClose, employeeId, employeeName, type, onSubmitted
}) => {
  const [rating, setRating] = useState(0);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (type === 'SELF') {
        await axios.post(`${API_URL}/targets/ratings/self`, {
          rating, description,
        }, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${API_URL}/targets/ratings/manager`, {
          employeeId, rating, description,
        }, { headers: { Authorization: `Bearer ${token}` } });
      }
      setRating(0); setDescription('');
      onSubmitted();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              {type === 'SELF' ? 'Rate Yourself' : `Rate ${employeeName}`}
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {type === 'SELF' ? 'Submit your overall self-assessment' : 'Submit your overall assessment for this employee'}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Overall Rating *</label>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reason / Description *</label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)} required rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
              placeholder={type === 'SELF' ? 'Describe your overall performance...' : 'Describe this employee\'s overall performance...'}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium">Cancel</button>
            <button type="submit" disabled={loading || rating === 0} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50">
              {loading ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ========== Target Card Component ==========
interface TargetCardProps {
  target: Target;
  isManager: boolean;
  isOwn: boolean;
  onComplete: (target: Target) => void;
  onReview: (target: Target) => void;
}

export const TargetCard: React.FC<TargetCardProps> = ({ target, isManager, isOwn, onComplete, onReview }) => {
  const statusColors: Record<string, string> = {
    'ASSIGNED': 'bg-blue-100 text-blue-700',
    'IN_PROGRESS': 'bg-amber-100 text-amber-700',
    'COMPLETED': 'bg-green-100 text-green-700',
    'REVIEWED': 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900">{target.title}</h4>
          {target.description && <p className="text-sm text-slate-600 mt-1">{target.description}</p>}
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${statusColors[target.status]}`}>
          {target.status.replace('_', ' ')}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-3">
        {target.dueDate && (
          <span>Due: {new Date(target.dueDate).toLocaleDateString()}</span>
        )}
        {target.createdBy && (
          <span>By: {target.createdBy.user.firstName} {target.createdBy.user.lastName}</span>
        )}
        {target.completedAt && (
          <span>Completed: {new Date(target.completedAt).toLocaleDateString()}</span>
        )}
      </div>

      {/* Self rating display */}
      {target.selfRating && (
        <div className="mt-3 bg-slate-50 rounded-lg p-3">
          <p className="text-xs font-medium text-slate-500 mb-1">Employee Self Rating</p>
          <div className="flex items-center gap-2">
            <StarRating value={target.selfRating} readonly />
            <span className="text-sm text-slate-600">({target.selfRating}/5)</span>
          </div>
          {target.selfDescription && <p className="text-sm text-slate-600 mt-1">{target.selfDescription}</p>}
          {target.evidenceUrl && (
            <a href={target.evidenceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
              View Evidence
            </a>
          )}
        </div>
      )}

      {/* Manager rating display */}
      {target.managerRating && (
        <div className="mt-2 bg-purple-50 rounded-lg p-3">
          <p className="text-xs font-medium text-purple-600 mb-1">Manager Rating</p>
          <div className="flex items-center gap-2">
            <StarRating value={target.managerRating} readonly />
            <span className="text-sm text-slate-600">({target.managerRating}/5)</span>
          </div>
          {target.managerFeedback && <p className="text-sm text-slate-600 mt-1">{target.managerFeedback}</p>}
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 flex gap-2">
        {isOwn && target.status === 'ASSIGNED' && (
          <button onClick={() => onComplete(target)} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition">
            Mark as Completed
          </button>
        )}
        {isManager && target.status === 'COMPLETED' && (
          <button onClick={() => onReview(target)} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition">
            Review Target
          </button>
        )}
      </div>
    </div>
  );
};

// ========== Inline Star Display ==========
export const InlineStars: React.FC<{ value: number; max?: number }> = ({ value, max = 5 }) => (
  <span className="inline-flex gap-0.5">
    {Array.from({ length: max }, (_, i) => (
      <span key={i} className={`text-sm ${i < value ? 'text-yellow-400' : 'text-slate-300'}`}>★</span>
    ))}
  </span>
);
