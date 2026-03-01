import React, { useState, useEffect } from 'react';
import AppShell from '../components/AppShell';
import { mockTeams, mockAttendance, mockCertifications, mockEmployeeAnalytics, mockAIReviews, mockTasks } from '../lib/mock-data';
import { Team, User, Employee } from '../types';
import { mockEmployees } from '../lib/mock-data';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../utils/utils';
import axios from 'axios';

const TeamsPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  const [teams, setTeams] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [memberDetails, setMemberDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
    productName: '',
    managerIds: [] as string[]
  });

  const fetchTeams = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios(`${API_URL}/teams`, { validateStatus: () => true, 
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data;
      setTeams(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios(`${API_URL}/employees`, { validateStatus: () => true, 
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data;
      setEmployees(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTeams();
    if (currentUser?.role?.toUpperCase() === 'ADMIN') {
      fetchEmployees();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedMember) {
      const fetchMemberDetails = async () => {
        try {
          setIsLoadingDetails(true);
          const token = localStorage.getItem('token');
          const res = await axios(`${API_URL}/employees/getDetails/${selectedMember.id}`, { validateStatus: () => true, 
            headers: { Authorization: `Bearer ${token}` }
          });
          if ((res.status >= 200 && res.status < 300)) {
            const data = res.data;
            setMemberDetails(data);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoadingDetails(false);
        }
      };
      fetchMemberDetails();
    } else {
      setMemberDetails(null);
    }
  }, [selectedMember]);

  const handleCreateTeam = async () => {
    try {
      if (!newTeam.name) return;
      const token = localStorage.getItem('token');
      const res = await axios(`${API_URL}/teams`, { validateStatus: () => true, 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        data: JSON.stringify(newTeam)
      });
      if ((res.status >= 200 && res.status < 300)) {
        setShowCreateModal(false);
        setNewTeam({ name: '', description: '', productName: '', managerIds: [] });
        fetchTeams();
      } else {
        const errorData = res.data;
        console.error('Error creating team:', errorData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const statusColors: Record<string, string> = {
    'active': 'bg-green-100 text-green-700',
    'inactive': 'bg-red-100 text-red-700',
    'on-leave': 'bg-amber-100 text-amber-700',
  };

  // Get employee data by user ID
  const getEmployeeData = (user: User | Employee) => {
    if ('position' in user) return user;
    const emp = mockEmployees.find(e => e.email === user.email);
    return emp || user;
  };

  if (selectedTeam && selectedMember) {
    if (isLoadingDetails) {
      return (
        <AppShell>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
          </div>
        </AppShell>
      );
    }

    const { kpiScore, overallScore, attendanceStats, attendanceRate, completedTasks } = memberDetails || {
      kpiScore: 0, overallScore: 0, attendanceStats: { present: 0, late: 0, absent: 0, halfDay: 0 }, attendanceRate: 0, completedTasks: []
    };

    const memberCerts = mockCertifications.filter(c => c.employeeId === selectedMember.id) || [];
    const memberReview = mockAIReviews.find(r => r.employeeId === selectedMember.id) || null;

    return (
      <AppShell>
        <div className="space-y-8">
          {/* Back Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedMember(null)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Team
            </button>
          </div>

          {/* Member Header */}
          <div className="bg-white rounded-lg shadow-md p-6 flex items-start justify-between">
            <div className="flex items-center gap-6">
              <img
                src={selectedMember.avatar || `https://ui-avatars.com/api/?name=${selectedMember.firstName}+${selectedMember.lastName}&background=random`}
                alt={`${selectedMember.firstName} ${selectedMember.lastName}`}
                className="w-24 h-24 rounded-full"
              />
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{selectedMember.firstName} {selectedMember.lastName}</h1>
                <p className="text-slate-600 text-lg">
                  {selectedMember.position || selectedMember.role}
                </p>
                <p className="text-slate-500 mt-1">{selectedMember.email}</p>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-slate-600 text-sm font-medium">Completed Tasks</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{completedTasks.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-slate-600 text-sm font-medium">Attendance Rate</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{attendanceRate || 0}%</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-slate-600 text-sm font-medium">KPI Score</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{(kpiScore || 0).toFixed(1)}/10</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-slate-600 text-sm font-medium">Overall Score</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{(overallScore || 0).toFixed(1)}/10</p>
            </div>
          </div>

          {/* Attendance */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Last 30 Days Attendance</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{attendanceStats.present}</p>
                <p className="text-slate-600 text-sm mt-1">Present</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-amber-600">{attendanceStats.late}</p>
                <p className="text-slate-600 text-sm mt-1">Late</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">{attendanceStats.halfDay}</p>
                <p className="text-slate-600 text-sm mt-1">Half Day</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{attendanceStats.absent}</p>
                <p className="text-slate-600 text-sm mt-1">Absent</p>
              </div>
            </div>
          </div>

          {/* Certifications */}
          {memberCerts.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Certifications</h2>
              <div className="space-y-3">
                {memberCerts.map((cert) => (
                  <div key={cert.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-slate-900">{cert.name}</p>
                      <p className="text-sm text-slate-600">{cert.issuer}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">Issued: {cert.issueDate}</p>
                      {cert.expiryDate && <p className="text-sm text-slate-600">Expires: {cert.expiryDate}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Review */}
          {memberReview && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">AI Performance Review</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm text-slate-600">Performance Score</p>
                    <p className="text-3xl font-bold text-blue-600">{memberReview.score.toFixed(1)}/10</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Overview</h3>
                  <p className="text-slate-700">{memberReview.description}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Strengths</h3>
                  <div className="flex flex-wrap gap-2">
                    {memberReview.strengths.map((strength, idx) => (
                      <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                        {strength}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Areas for Improvement</h3>
                  <div className="flex flex-wrap gap-2">
                    {memberReview.suggestions.map((suggestion, idx) => (
                      <span key={idx} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium">
                        {suggestion}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Completed Tasks Log */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Completed Tasks</h2>
            <div className="overflow-y-auto max-h-[400px] border border-slate-200 rounded-lg">
              {completedTasks.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No completed tasks found.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {completedTasks.map((task: any) => (
                    <div key={task.id} className="p-4 hover:bg-slate-50 transition">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-slate-900">{task.title}</h4>
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          Completed
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2 mb-3">{task.description}</p>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Team: {task.team?.name || 'N/A'}</span>
                        {task.completedAt && (
                          <span>Completed on: {new Date(task.completedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (selectedTeam) {
    return (
      <AppShell>
        <div className="space-y-8">
          {/* Back Button */}
          <button
            onClick={() => setSelectedTeam(null)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Teams
          </button>

          {/* Team Header */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-slate-900">{selectedTeam.name}</h1>
            <p className="text-slate-600 text-lg mt-2">{selectedTeam.description}</p>
            <div className="mt-4 space-y-2">
              <p className="text-slate-600"><span className="font-medium">Product:</span> {selectedTeam.productName}</p>
              <p className="text-slate-600"><span className="font-medium">Founded:</span> {new Date(selectedTeam.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Manager */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Managers</h2>
            {selectedTeam.managers && selectedTeam.managers.map((mgr: any) => (
              <div
                key={mgr.id}
                onClick={() => setSelectedMember({ ...mgr.user, position: 'Manager' })}
                className="p-4 mb-2 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={mgr.user?.avatar || `https://ui-avatars.com/api/?name=${mgr.user?.firstName}+${mgr.user?.lastName}&background=random`}
                    alt={mgr.user?.firstName}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="font-semibold text-slate-900">{mgr.user?.firstName} {mgr.user?.lastName}</p>
                    <p className="text-sm text-slate-600">{mgr.user?.email}</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            ))}
          </div>

          {/* Team Members */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Team Members ({selectedTeam.members.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedTeam.members && selectedTeam.members
                .map((member: any) => (
                  <div
                    key={member.id}
                    onClick={() => setSelectedMember(member.user)}
                    className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={member.user?.avatar || `https://ui-avatars.com/api/?name=${member.user?.firstName}+${member.user?.lastName}&background=random`}
                        alt={member.user?.firstName}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <p className="font-semibold text-slate-900">{member.user?.firstName} {member.user?.lastName}</p>
                        <p className="text-sm text-slate-600">{member.user?.email}</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Teams</h1>
            <p className="text-slate-600 mt-2">View and manage all teams in your organization</p>
          </div>
          {currentUser?.role?.toUpperCase() === 'ADMIN' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition shadow flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Team
            </button>
          )}
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teams.map((team) => {
            const managers = team.managers || [];
            const members = team.members || [];
            return (
              <div key={team.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-slate-900">{team.name}</h3>
                  <p className="text-slate-600 text-sm mt-1">{team.description}</p>
                  <p className="text-slate-600 text-sm mt-2"><span className="font-medium">Product:</span> {team.productName}</p>
                </div>

                <div className="space-y-4 mb-6">
                  {managers.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">Managers ({managers.length})</p>
                      <div className="flex -space-x-2">
                        {managers.map((mgr: any) => (
                          <div key={mgr.id} className="relative group">
                            <img
                              src={mgr.user?.avatar || `https://ui-avatars.com/api/?name=${mgr.user?.firstName}+${mgr.user?.lastName}&background=random`}
                              alt={mgr.user?.firstName}
                              className="w-8 h-8 rounded-full bg-slate-300 border-2 border-white cursor-pointer"
                              title={`${mgr.user?.firstName} ${mgr.user?.lastName}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Members ({members.length})</p>
                    <div className="flex -space-x-2">
                      {members.map((member: any) => (
                        <img
                          key={member.id}
                          src={member.user?.avatar || `https://ui-avatars.com/api/?name=${member.user?.firstName}+${member.user?.lastName}&background=random`}
                          alt={member.user?.firstName}
                          title={`${member.user?.firstName} ${member.user?.lastName}`}
                          className="w-8 h-8 rounded-full bg-slate-300 border-2 border-white pointer-events-none"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-sm text-slate-600">
                      Founded: <span className="font-medium text-slate-900">{new Date(team.createdAt).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedTeam(team)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
                >
                  View Details
                </button>
              </div>
            );
          })}
        </div>

        {/* Create Team Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-start justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Create New Team</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Team Name</label>
                  <input
                    type="text"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    value={newTeam.description}
                    onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    value={newTeam.productName}
                    onChange={(e) => setNewTeam({ ...newTeam, productName: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Select Manager(s)</label>
                  <select
                    multiple
                    value={newTeam.managerIds}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value);
                      setNewTeam({ ...newTeam, managerIds: values });
                    }}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none h-32"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.user?.firstName} {emp.user?.lastName} ({emp.user?.role})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">Hold Cmd/Ctrl to select multiple managers</p>
                </div>

                <div className="pt-4 border-t border-slate-200 flex gap-3">
                  <button
                    onClick={handleCreateTeam}
                    disabled={!newTeam.name || !newTeam.productName}
                    className="flex-1 bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-slate-300"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-slate-100 text-slate-700 font-medium py-2 rounded-lg hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default TeamsPage;
