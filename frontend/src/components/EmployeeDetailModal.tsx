import React, { useState } from 'react';
import { Employee, Attendance, Certification, AIReview } from '../types';
import { mockAttendance, mockCertifications, mockEmployeeAnalytics, mockAIReviews } from '../lib/mock-data';

interface EmployeeDetailModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
}

const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({ employee, isOpen, onClose }) => {
  const [showAIReview, setShowAIReview] = useState(false);

  if (!isOpen || !employee) return null;

  const employeeAnalytics = mockEmployeeAnalytics.find(a => a.employeeId === employee.id);
  const employeeAttendance = mockAttendance.filter(a => a.employeeId === employee.id).slice(-30);
  const employeeCerts = mockCertifications.filter(c => c.employeeId === employee.id);
  const employeeReview = mockAIReviews.find(r => r.employeeId === employee.id);

  const attendanceStats = employeeAttendance.reduce(
    (acc, att) => {
      if (att.status === 'present') acc.present++;
      if (att.status === 'late') acc.late++;
      if (att.status === 'absent') acc.absent++;
      if (att.status === 'half-day') acc.halfDay++;
      return acc;
    },
    { present: 0, late: 0, absent: 0, halfDay: 0 }
  );

  const attendanceRate = employeeAnalytics ? employeeAnalytics.attendanceRate : 0;

  const statusColors: Record<string, string> = {
    'active': 'bg-green-100 text-green-700',
    'inactive': 'bg-red-100 text-red-700',
    'on-leave': 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <img
              src={employee.avatar}
              alt={employee.name}
              className="w-16 h-16 rounded-full"
            />
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{employee.name}</h2>
              <p className="text-slate-600">{employee.position}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Basic Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-xs font-medium text-slate-500 uppercase">Email</p>
              <p className="text-sm text-slate-900 mt-1">{employee.email}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-xs font-medium text-slate-500 uppercase">Department</p>
              <p className="text-sm text-slate-900 mt-1">{employee.department}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-xs font-medium text-slate-500 uppercase">Status</p>
              <p className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${statusColors[employee.status]}`}>
                {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-xs font-medium text-slate-500 uppercase">Start Date</p>
              <p className="text-sm text-slate-900 mt-1">{employee.startDate}</p>
            </div>
          </div>

          {/* Analytics Overview */}
          {employeeAnalytics && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance Analytics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-600">Tasks Completed</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">{employeeAnalytics.tasksCompleted}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-green-600">Attendance Rate</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">{employeeAnalytics.attendanceRate}%</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                  <p className="text-sm font-medium text-purple-600">KPI Score</p>
                  <p className="text-3xl font-bold text-purple-900 mt-2">{employeeAnalytics.kpiScore.toFixed(1)}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200">
                  <p className="text-sm font-medium text-amber-600">Overall Score</p>
                  <p className="text-3xl font-bold text-amber-900 mt-2">{employeeAnalytics.overallScore.toFixed(1)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Attendance */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Attendance (Last 30 Days)</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-600 font-medium">Present</p>
                <p className="text-2xl font-bold text-green-900 mt-1">{attendanceStats.present}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-600 font-medium">Late</p>
                <p className="text-2xl font-bold text-amber-900 mt-1">{attendanceStats.late}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-600 font-medium">Half Day</p>
                <p className="text-2xl font-bold text-orange-900 mt-1">{attendanceStats.halfDay}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm text-red-600 font-medium">Absent</p>
                <p className="text-2xl font-bold text-red-900 mt-1">{attendanceStats.absent}</p>
              </div>
            </div>
          </div>

          {/* Certifications */}
          {employeeCerts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Certifications</h3>
              <div className="space-y-3">
                {employeeCerts.map((cert) => (
                  <div key={cert.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{cert.name}</p>
                        <p className="text-sm text-slate-600">{cert.issuer}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Issued: {cert.issueDate}
                          {cert.expiryDate && ` • Expires: ${cert.expiryDate}`}
                        </p>
                      </div>
                      {cert.expiryDate && new Date(cert.expiryDate) < new Date() && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                          Expired
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Analysis Button and Review */}
          <div className="border-t border-slate-200 pt-6">
            <button
              onClick={() => setShowAIReview(!showAIReview)}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition font-semibold"
            >
              {showAIReview ? 'Hide AI Review' : 'Analyze Ability with AI'}
            </button>

            {showAIReview && employeeReview && (
              <div className="mt-6 bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-slate-900">AI Performance Review</h4>
                  <div className="text-right">
                    <p className="text-sm text-slate-600">Overall Score</p>
                    <p className="text-3xl font-bold text-indigo-600">{employeeReview.score.toFixed(1)}/10</p>
                  </div>
                </div>

                <p className="text-slate-700 mb-6 leading-relaxed">{employeeReview.description}</p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-semibold text-slate-900 mb-3">Strengths</h5>
                    <ul className="space-y-2">
                      {employeeReview.strengths.map((strength, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-slate-700">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold text-slate-900 mb-3">Suggestions for Improvement</h5>
                    <ul className="space-y-2">
                      {employeeReview.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-slate-700">
                          <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-4">
                  Review generated on {new Date(employeeReview.createdAt).toLocaleDateString()}
                </p>
              </div>
            )}

            {showAIReview && !employeeReview && (
              <div className="mt-6 bg-slate-50 p-6 rounded-lg border border-slate-200 text-center">
                <p className="text-slate-600">No AI review available yet for this employee.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailModal;
