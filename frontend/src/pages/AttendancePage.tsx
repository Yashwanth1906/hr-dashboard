import React, { useState } from 'react';
import AppShell from '../components/AppShell';
import AttendanceModal from '../components/AttendanceModal';
import { mockAttendance, mockEmployees, mockBranches } from '../lib/mock-data';

const AttendancePage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState(mockAttendance);

  const todayAttendance = attendanceRecords.filter((a) => a.date === selectedDate);

  const getEmployeeById = (id: string) => mockEmployees.find((e) => e.id === id);

  const statusColors: Record<string, string> = {
    'present': 'bg-green-100 text-green-700',
    'absent': 'bg-red-100 text-red-700',
    'late': 'bg-amber-100 text-amber-700',
    'half-day': 'bg-blue-100 text-blue-700',
  };

  const attendanceStats = {
    present: todayAttendance.filter((a) => a.status === 'present').length,
    absent: todayAttendance.filter((a) => a.status === 'absent').length,
    late: todayAttendance.filter((a) => a.status === 'late').length,
    halfDay: todayAttendance.filter((a) => a.status === 'half-day').length,
  };

  const handleMarkAttendance = (branchId: string, lat: number, lng: number, isWFH: boolean) => {
    const newRecord = {
      id: `attendance-${Date.now()}`,
      employeeId: 'emp-3', // Mock current user
      date: new Date().toISOString().split('T')[0],
      checkIn: new Date().toLocaleTimeString(),
      status: 'present' as const,
      branch: isWFH ? 'WFH' : branchId,
      locationLat: lat,
      locationLng: lng,
      isWFH,
    };
    setAttendanceRecords([...attendanceRecords, newRecord]);
  };

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Page Header with Mark Attendance Button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Attendance</h1>
            <p className="text-slate-600 mt-2">Track employee attendance and check-in/check-out times</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Mark Attendance
          </button>
        </div>

        {/* Date Selector */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-slate-900 bg-white"
          />
        </div>

        {/* Attendance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <p className="text-slate-600 text-sm font-medium">Present</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{attendanceStats.present}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-slate-600 text-sm font-medium">Absent</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{attendanceStats.absent}</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <p className="text-slate-600 text-sm font-medium">Late</p>
            <p className="text-3xl font-bold text-amber-600 mt-2">{attendanceStats.late}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-slate-600 text-sm font-medium">Half Day</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{attendanceStats.halfDay}</p>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700">Employee</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700">Check In</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700">Check Out</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700">Duration</th>
                </tr>
              </thead>
              <tbody>
                {todayAttendance.map((record) => {
                  const employee = getEmployeeById(record.employeeId);
                  const duration = record.checkOut
                    ? `${Math.floor(Math.random() * 4) + 8} hours`
                    : '-';

                  return (
                    <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={employee?.avatar}
                            alt={employee?.name}
                            className="w-10 h-10 rounded-full bg-slate-300"
                          />
                          <div>
                            <p className="font-medium text-slate-900">{employee?.name}</p>
                            <p className="text-sm text-slate-500">{employee?.position}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColors[record.status]}`}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1).replace('-', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-mono">{record.checkIn}</td>
                      <td className="py-4 px-6 text-slate-600 font-mono">{record.checkOut || '-'}</td>
                      <td className="py-4 px-6 text-slate-600">{duration}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {todayAttendance.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-600">No attendance records for this date</p>
            </div>
          )}
        </div>

        {/* Attendance Modal */}
        <AttendanceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onMarkAttendance={handleMarkAttendance}
          branches={mockBranches}
        />
      </div>
    </AppShell>
  );
};

export default AttendancePage;
