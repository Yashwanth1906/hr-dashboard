import React, { useState } from 'react';
import AppShell from '../components/AppShell';
import CompletedTaskModal from '../components/CompletedTaskModal';
import { mockEmployees, mockAttendance, mockCertifications, mockEmployeeAnalytics, mockAIReviews, mockTasks } from '../lib/mock-data';
import { Employee, Task } from '../types';

const EmployeesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const filteredEmployees = mockEmployees.filter((emp) =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    'active': 'bg-green-100 text-green-700',
    'inactive': 'bg-red-100 text-red-700',
    'on-leave': 'bg-amber-100 text-amber-700',
  };

  if (selectedEmployee) {
    const employeeAnalytics = mockEmployeeAnalytics.find(a => a.employeeId === selectedEmployee.id);
    const employeeAttendance = mockAttendance.filter(a => a.employeeId === selectedEmployee.id).slice(-30);
    const employeeCerts = mockCertifications.filter(c => c.employeeId === selectedEmployee.id);
    const employeeReview = mockAIReviews.find(r => r.employeeId === selectedEmployee.id);
    const completedTasks = mockTasks.filter(t => t.assignedTo?.id === selectedEmployee.id && t.status === 'completed');

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

    return (
      <AppShell>
        <div className="space-y-8">
          {/* Back Button */}
          <button
            onClick={() => setSelectedEmployee(null)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Employees
          </button>

          {/* Employee Header */}
          <div className="bg-white rounded-lg shadow-md p-6 flex items-start justify-between">
            <div className="flex items-center gap-6">
              <img
                src={selectedEmployee.avatar}
                alt={selectedEmployee.name}
                className="w-24 h-24 rounded-full"
              />
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{selectedEmployee.name}</h1>
                <p className="text-slate-600 text-lg">{selectedEmployee.position}</p>
                <p className="text-slate-500 mt-1">{selectedEmployee.email}</p>
              </div>
            </div>
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${statusColors[selectedEmployee.status]}`}>
              {selectedEmployee.status.charAt(0).toUpperCase() + selectedEmployee.status.slice(1).replace('-', ' ')}
            </span>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-slate-600 text-sm font-medium">Completed Tasks</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{completedTasks.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-slate-600 text-sm font-medium">Attendance Rate</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{employeeAnalytics?.attendanceRate || 0}%</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-slate-600 text-sm font-medium">KPI Score</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{employeeAnalytics?.kpiScore.toFixed(1) || 0}/10</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-slate-600 text-sm font-medium">Overall Score</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{employeeAnalytics?.overallScore.toFixed(1) || 0}/10</p>
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
          {employeeCerts.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Certifications</h2>
              <div className="space-y-3">
                {employeeCerts.map((cert) => (
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

          {/* Completed Tasks */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Completed Tasks ({completedTasks.length})</h2>
              {completedTasks.length > 0 && (
                <button
                  onClick={() => setSelectedEmployee({ ...selectedEmployee, 'viewMode': 'tasks' } as any)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                >
                  View All Tasks
                </button>
              )}
            </div>
            {completedTasks.length > 0 ? (
              <div className="space-y-2">
                {completedTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => {
                      setSelectedTask(task);
                      setIsTaskModalOpen(true);
                    }}
                    className="p-3 bg-slate-50 rounded-lg flex items-start justify-between hover:bg-slate-100 cursor-pointer transition"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{task.title}</p>
                      <p className="text-sm text-slate-600">{task.description}</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold whitespace-nowrap ml-2">Completed</span>
                  </div>
                ))}
                {completedTasks.length > 3 && (
                  <p className="text-sm text-slate-600 text-center pt-2">+{completedTasks.length - 3} more tasks</p>
                )}
              </div>
            ) : (
              <p className="text-slate-600 text-center py-4">No completed tasks yet</p>
            )}
          </div>

          {/* AI Review */}
          {employeeReview && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">AI Performance Review</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm text-slate-600">Performance Score</p>
                    <p className="text-3xl font-bold text-blue-600">{employeeReview.score.toFixed(1)}/10</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Overview</h3>
                  <p className="text-slate-700">{employeeReview.description}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Strengths</h3>
                  <div className="flex flex-wrap gap-2">
                    {employeeReview.strengths.map((strength, idx) => (
                      <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                        {strength}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Areas for Improvement</h3>
                  <div className="flex flex-wrap gap-2">
                    {employeeReview.suggestions.map((suggestion, idx) => (
                      <span key={idx} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium">
                        {suggestion}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Completed Task Modal */}
          <CompletedTaskModal
            task={selectedTask}
            isOpen={isTaskModalOpen}
            onClose={() => {
              setIsTaskModalOpen(false);
              setSelectedTask(null);
            }}
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Employees</h1>
          <p className="text-slate-600 mt-2">Manage all employees in your organization</p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <svg className="absolute left-3 top-3 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, email, or position..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition text-slate-900 bg-white"
          />
        </div>

        {/* Employees Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700">Name</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700">Position</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700">Department</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700">Start Date</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={employee.avatar}
                          alt={employee.name}
                          className="w-10 h-10 rounded-full bg-slate-300"
                        />
                        <div>
                          <p className="font-medium text-slate-900">{employee.name}</p>
                          <p className="text-sm text-slate-500">{employee.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-900">{employee.position}</td>
                    <td className="py-4 px-6 text-slate-600">{employee.department}</td>
                    <td className="py-4 px-6 text-slate-600">{employee.startDate}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColors[employee.status]}`}>
                        {employee.status.charAt(0).toUpperCase() + employee.status.slice(1).replace('-', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => setSelectedEmployee(employee)}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEmployees.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM6 20a9 9 0 0118 0v2H6v-2z" />
              </svg>
              <p className="text-slate-600">No employees found</p>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-slate-600 text-sm font-medium">Total Employees</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{mockEmployees.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-slate-600 text-sm font-medium">Active</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {mockEmployees.filter(e => e.status === 'active').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-slate-600 text-sm font-medium">On Leave</p>
            <p className="text-3xl font-bold text-amber-600 mt-2">
              {mockEmployees.filter(e => e.status === 'on-leave').length}
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default EmployeesPage;
