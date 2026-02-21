import React, { useState } from 'react';
import AppShell from '../components/AppShell';
import { mockTeams, mockAttendance, mockCertifications, mockEmployeeAnalytics, mockAIReviews, mockTasks } from '../lib/mock-data';
import { Team, User, Employee } from '../types';
import { mockEmployees } from '../lib/mock-data';

const TeamsPage: React.FC = () => {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedMember, setSelectedMember] = useState<User | Employee | null>(null);

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
    const memberData = getEmployeeData(selectedMember);
    const memberAnalytics = mockEmployeeAnalytics.find(
      a => a.employeeId === (memberData as Employee).id || a.employeeId === selectedMember.id
    );
    const memberAttendance = mockAttendance
      .filter(a => a.employeeId === (memberData as Employee).id)
      .slice(-30);
    const memberCerts = mockCertifications.filter(c => c.employeeId === (memberData as Employee).id);
    const memberReview = mockAIReviews.find(r => r.employeeId === (memberData as Employee).id);
    const completedTasks = mockTasks.filter(
      t => t.assignedTo?.id === selectedMember.id && t.status === 'completed'
    );

    const attendanceStats = memberAttendance.reduce(
      (acc, att) => {
        if (att.status === 'present') acc.present++;
        if (att.status === 'late') acc.late++;
        if (att.status === 'absent') acc.absent++;
        if (att.status === 'half-day') acc.halfDay++;
        return acc;
      },
      { present: 0, late: 0, absent: 0, halfDay: 0 }
    );

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
                src={selectedMember.avatar}
                alt={selectedMember.name}
                className="w-24 h-24 rounded-full"
              />
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{selectedMember.name}</h1>
                <p className="text-slate-600 text-lg">
                  {(memberData as Employee).position || selectedMember.role}
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
              <p className="text-3xl font-bold text-blue-600 mt-2">{memberAnalytics?.attendanceRate || 0}%</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-slate-600 text-sm font-medium">KPI Score</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{memberAnalytics?.kpiScore.toFixed(1) || 0}/10</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-slate-600 text-sm font-medium">Overall Score</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{memberAnalytics?.overallScore.toFixed(1) || 0}/10</p>
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
              <p className="text-slate-600"><span className="font-medium">Product:</span> {selectedTeam.product}</p>
              <p className="text-slate-600"><span className="font-medium">Founded:</span> {selectedTeam.createdAt}</p>
            </div>
          </div>

          {/* Manager */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Manager</h2>
            <div
              onClick={() => setSelectedMember(selectedTeam.manager)}
              className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <img
                  src={selectedTeam.manager.avatar}
                  alt={selectedTeam.manager.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-semibold text-slate-900">{selectedTeam.manager.name}</p>
                  <p className="text-sm text-slate-600">{selectedTeam.manager.email}</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Team Members */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Team Members ({selectedTeam.members.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedTeam.members
                .filter(m => m.id !== selectedTeam.manager.id)
                .map((member) => (
                  <div
                    key={member.id}
                    onClick={() => setSelectedMember(member)}
                    className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <p className="font-semibold text-slate-900">{member.name}</p>
                        <p className="text-sm text-slate-600">{member.email}</p>
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
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Teams</h1>
          <p className="text-slate-600 mt-2">View and manage all teams in your organization</p>
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockTeams.map((team) => (
            <div key={team.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-slate-900">{team.name}</h3>
                <p className="text-slate-600 text-sm mt-1">{team.description}</p>
                <p className="text-slate-600 text-sm mt-2"><span className="font-medium">Product:</span> {team.product}</p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Manager</p>
                  <div className="flex items-center gap-2">
                    <img
                      src={team.manager.avatar}
                      alt={team.manager.name}
                      className="w-8 h-8 rounded-full bg-slate-300"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{team.manager.name}</p>
                      <p className="text-xs text-slate-500">{team.manager.email}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Members ({team.memberCount})</p>
                  <div className="flex -space-x-2">
                    {team.members.map((member) => (
                      <img
                        key={member.id}
                        src={member.avatar}
                        alt={member.name}
                        title={member.name}
                        className="w-8 h-8 rounded-full bg-slate-300 border-2 border-white"
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <p className="text-sm text-slate-600">
                    Founded: <span className="font-medium text-slate-900">{team.createdAt}</span>
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
          ))}
        </div>
      </div>
    </AppShell>
  );
};

export default TeamsPage;
