import React, { useState, useEffect } from 'react';
import AppShell from '../components/AppShell';
import CompletedTaskModal from '../components/CompletedTaskModal';
import {
  CompleteTargetModal,
  OverallRatingModal,
  TargetCard,
  InlineStars,
} from '../components/TargetManagement';
import { Task, Target, EmployeeRatingRecord } from '../types';
import { API_URL } from '../utils/utils';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const MyProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [employeeDetails, setEmployeeDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [showCompleteTarget, setShowCompleteTarget] = useState(false);
  const [showSelfRating, setShowSelfRating] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);

  const fetchDetails = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios(`${API_URL}/employees/getDetails/${user.id}`, {
        validateStatus: () => true,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status >= 200 && res.status < 300) {
        setEmployeeDetails(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDetails(); }, [user]);

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
        </div>
      </AppShell>
    );
  }

  if (!employeeDetails) {
    return (
      <AppShell>
        <div className="text-center py-16">
          <p className="text-slate-600 text-lg">Employee profile not found. Please complete onboarding first.</p>
        </div>
      </AppShell>
    );
  }

  const {
    employee, kpiScore = 0, kriScore = 0, overallScore = 0,
    kpiBreakdown = {} as any, kriBreakdown = {} as any,
    attendanceStats = { present: 0, late: 0, absent: 0, halfDay: 0 },
    attendanceRate = 0, completedTasks = [], targets = [], ratings = [],
  } = employeeDetails;

  const selfRatings = (ratings as EmployeeRatingRecord[]).filter((r) => r.type === 'SELF');
  const managerRatings = (ratings as EmployeeRatingRecord[]).filter((r) => r.type === 'MANAGER');

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-600 mt-2">Your performance overview and details</p>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 flex items-start justify-between">
          <div className="flex items-center gap-6">
            <img
              src={employee?.user?.avatar || `https://ui-avatars.com/api/?name=${employee?.user?.firstName}+${employee?.user?.lastName}&background=random`}
              alt={`${employee?.user?.firstName} ${employee?.user?.lastName}`}
              className="w-24 h-24 rounded-full"
            />
            <div>
              <h2 className="text-3xl font-bold text-slate-900">{employee?.user?.firstName} {employee?.user?.lastName}</h2>
              <p className="text-slate-600 text-lg">{employee?.user?.email}</p>
              <p className="text-slate-500 mt-1 capitalize">{employee?.user?.role?.toLowerCase()}</p>
            </div>
          </div>
          <span className="inline-block px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-700">Active</span>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-green-500">
            <p className="text-sm font-medium text-slate-500">KPI Score</p>
            <p className="text-4xl font-bold text-green-600 mt-1">{kpiScore.toFixed(1)}<span className="text-lg text-slate-400">/10</span></p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-red-500">
            <p className="text-sm font-medium text-slate-500">KRI Score</p>
            <p className="text-4xl font-bold text-red-600 mt-1">{kriScore.toFixed(1)}<span className="text-lg text-slate-400">/10</span></p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-purple-500">
            <p className="text-sm font-medium text-slate-500">Overall Score</p>
            <p className="text-4xl font-bold text-purple-600 mt-1">{overallScore.toFixed(1)}<span className="text-lg text-slate-400">/10</span></p>
          </div>
        </div>

        {/* KPI Breakdown */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">KPI Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Task Completion', value: kpiBreakdown.taskCompletionRate, weight: '25%', color: 'bg-blue-500' },
              { label: 'Attendance', value: kpiBreakdown.attendanceScore, weight: '20%', color: 'bg-green-500' },
              { label: 'Target Completion', value: kpiBreakdown.targetCompletionRate, weight: '25%', color: 'bg-indigo-500' },
              { label: 'On-Time Delivery', value: kpiBreakdown.onTimeDeliveryRate, weight: '15%', color: 'bg-cyan-500' },
              { label: 'Certifications', value: kpiBreakdown.certificationsScore, weight: '5%', color: 'bg-amber-500' },
              { label: 'Manager Target Rating', value: kpiBreakdown.managerTargetRating, weight: '10%', color: 'bg-purple-500' },
            ].map((item) => (
              <div key={item.label} className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">{item.label}</span>
                  <span className="text-xs text-slate-400">Weight: {item.weight}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                  <div className={`h-2.5 rounded-full ${item.color}`} style={{ width: `${item.value || 0}%` }} />
                </div>
                <p className="text-right text-sm font-semibold text-slate-900 mt-1">{item.value || 0}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Last 30 Days Attendance</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center"><p className="text-3xl font-bold text-green-600">{attendanceStats.present}</p><p className="text-slate-600 text-sm mt-1">Present</p></div>
            <div className="text-center"><p className="text-3xl font-bold text-amber-600">{attendanceStats.late}</p><p className="text-slate-600 text-sm mt-1">Late</p></div>
            <div className="text-center"><p className="text-3xl font-bold text-orange-600">{attendanceStats.halfDay}</p><p className="text-slate-600 text-sm mt-1">Half Day</p></div>
            <div className="text-center"><p className="text-3xl font-bold text-red-600">{attendanceStats.absent}</p><p className="text-slate-600 text-sm mt-1">Absent</p></div>
          </div>
        </div>

        {/* Targets */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">My Targets ({(targets as Target[]).length})</h2>
          {(targets as Target[]).length > 0 ? (
            <div className="space-y-3">
              {(targets as Target[]).map((target) => (
                <TargetCard
                  key={target.id}
                  target={target}
                  isManager={false}
                  isOwn={true}
                  onComplete={(t) => { setSelectedTarget(t); setShowCompleteTarget(true); }}
                  onReview={() => {}}
                />
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-6">No targets assigned yet</p>
          )}
        </div>

        {/* Ratings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">My Ratings</h2>
            <button onClick={() => setShowSelfRating(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
              Rate Yourself
            </button>
          </div>
          {(ratings as EmployeeRatingRecord[]).length > 0 ? (
            <div className="space-y-3">
              {selfRatings.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">Self Assessments</h3>
                  {selfRatings.map((r) => (
                    <div key={r.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><InlineStars value={r.rating} /><span className="text-sm font-semibold text-slate-700">({r.rating}/5)</span></div>
                        <span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                      {r.description && <p className="text-sm text-slate-600 mt-2">{r.description}</p>}
                    </div>
                  ))}
                </div>
              )}
              {managerRatings.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">Manager Assessments</h3>
                  {managerRatings.map((r) => (
                    <div key={r.id} className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <InlineStars value={r.rating} />
                          <span className="text-sm font-semibold text-slate-700">({r.rating}/5)</span>
                          {r.ratedBy && <span className="text-xs text-slate-400">by {r.ratedBy.user.firstName} {r.ratedBy.user.lastName}</span>}
                        </div>
                        <span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                      {r.description && <p className="text-sm text-slate-600 mt-2">{r.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-6">No ratings yet</p>
          )}
        </div>

        {/* Completed Tasks */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Completed Tasks ({completedTasks.length})</h2>
          {completedTasks.length > 0 ? (
            <div className="space-y-2">
              {completedTasks.slice(0, 5).map((task: any) => (
                <div key={task.id} onClick={() => { setSelectedTask(task); setIsTaskModalOpen(true); }}
                  className="p-3 bg-slate-50 rounded-lg flex items-start justify-between hover:bg-slate-100 cursor-pointer transition">
                  <div><p className="font-semibold text-slate-900">{task.title}</p><p className="text-sm text-slate-600">{task.description}</p></div>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold whitespace-nowrap ml-2">Completed</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600 text-center py-4">No completed tasks yet</p>
          )}
        </div>
      </div>

      {/* Modals */}
      <CompleteTargetModal isOpen={showCompleteTarget} onClose={() => { setShowCompleteTarget(false); setSelectedTarget(null); }} target={selectedTarget} onCompleted={fetchDetails} />
      <OverallRatingModal isOpen={showSelfRating} onClose={() => setShowSelfRating(false)} type="SELF" onSubmitted={fetchDetails} />
      <CompletedTaskModal task={selectedTask} isOpen={isTaskModalOpen} onClose={() => { setIsTaskModalOpen(false); setSelectedTask(null); }} />
    </AppShell>
  );
};

export default MyProfilePage;
