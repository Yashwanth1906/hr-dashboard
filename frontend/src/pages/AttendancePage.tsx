import React, { useState, useEffect } from 'react';
import AppShell from '../components/AppShell';
import AttendanceModal from '../components/AttendanceModal';
import LogoutModal from '../components/LogoutModal';
import { useAuth } from '../contexts/AuthContext';
import { Branch } from '../types';

const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [activeCheckinRecord, setActiveCheckinRecord] = useState<any | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');

  const fetchBranches = async () => {
    try {
      const res = await fetch(`http://localhost:6969/api/companyBranches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setBranches(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAttendanceRecords = async () => {
    setLoading(true);
    try {
      // 1. Fetch active ongoing session anywhere
      const activeCheckRes = await fetch(`http://localhost:6969/api/attendance?employeeEmail=${user?.email}&startDate=2000-01-01`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (activeCheckRes.ok) {
        const fullRecordsForUser = await activeCheckRes.json();
        const curUserAll = fullRecordsForUser.filter((a: any) =>
          a.employee?.user?.email === user?.email || a.employee?.user?.firstName === user?.name?.split(' ')[0]
        );
        // Sort descending by checkIn date
        curUserAll.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Find newest which has not been checked out
        const activeRec = curUserAll.find((a: any) => a.checkIn && !a.checkOut);
        setActiveCheckinRecord(activeRec || null);
      }

      // 2. Fetch specific selected date
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const res = await fetch(`http://localhost:6969/api/attendance?startDate=${startOfDay.toISOString()}&endDate=${endOfDay.toISOString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setAttendanceRecords(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchAttendanceRecords();
  }, [selectedDate]);

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === todayStr;

  const hasOngoingSession = !!activeCheckinRecord;

  const statusColors: Record<string, string> = {
    'PRESENT': 'bg-green-100 text-green-700',
    'ABSENT': 'bg-red-100 text-red-700',
    'LATE': 'bg-amber-100 text-amber-700',
    'HALF_DAY': 'bg-blue-100 text-blue-700',
    'ONGOING': 'bg-blue-100 text-blue-700 animate-pulse',
  };

  const getDerivedStatus = (record: any) => {
    if (!record.checkIn) return 'ABSENT';
    if (record.checkIn && !record.checkOut) return 'ONGOING';
    if (record.isHalfDay) return 'HALF_DAY';
    if (record.isLate) return 'LATE';
    return 'PRESENT';
  };

  const handleMarkAttendance = async (branchId: string, lat: number, lng: number, isWFH: boolean) => {
    try {
      const res = await fetch(`http://localhost:6969/api/attendance/mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isWFH, companyBranchId: isWFH ? null : branchId })
      });
      if (res.ok) {
        fetchAttendanceRecords();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to mark attendance');
      }
    } catch (e) {
      console.error(e);
      alert('Network error');
    }
  };

  const handleCheckOut = async (branchId: string, lat: number, lng: number, isWFH: boolean) => {
    try {
      const res = await fetch(`http://localhost:6969/api/attendance/checkout`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isWFH, companyBranchId: isWFH ? null : branchId, checkoutLat: lat, checkoutLng: lng })
      });
      if (res.ok) {
        fetchAttendanceRecords();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to check out');
      }
    } catch (e) {
      console.error(e);
      alert('Network error');
    }
  };

  const attendanceStats = {
    present: attendanceRecords.filter((a) => getDerivedStatus(a) === 'PRESENT').length,
    absent: attendanceRecords.filter((a) => getDerivedStatus(a) === 'ABSENT').length,
    late: attendanceRecords.filter((a) => getDerivedStatus(a) === 'LATE').length,
    halfDay: attendanceRecords.filter((a) => getDerivedStatus(a) === 'HALF_DAY').length,
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
          {isToday && (
            !hasOngoingSession ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Mark Attendance Now
              </button>
            ) : (
              <button
                onClick={() => setIsLogoutModalOpen(true)}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition flex items-center gap-2 shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Check Out Ongoing Session
              </button>
            )
          )}
        </div>

        {/* Date Selector */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
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
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
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
                {attendanceRecords.map((record) => {
                  const employeeName = record.employee?.user ? `${record.employee.user.firstName} ${record.employee.user.lastName}` : 'Unknown';
                  const duration = record.duration ? `${Math.round(record.duration * 10) / 10} h` : '-';
                  const status = getDerivedStatus(record);

                  return (
                    <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://ui-avatars.com/api/?name=${employeeName.replace(' ', '+')}&background=random`}
                            alt={employeeName}
                            className="w-10 h-10 rounded-full bg-slate-300"
                          />
                          <div>
                            <p className="font-medium text-slate-900">{employeeName}</p>
                            <p className="text-sm text-slate-500">{record.employee?.department?.name || 'Department'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColors[status] || 'bg-gray-100 text-gray-700'}`}>
                          {status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-mono">
                        {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-mono">
                        {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="py-4 px-6 text-slate-600">{duration}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!loading && attendanceRecords.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-600">No attendance records for this date</p>
            </div>
          )}
          {loading && (
            <div className="text-center py-12">
              <p className="text-slate-600">Loading attendance...</p>
            </div>
          )}
        </div>

        {/* Attendance Check-in Modal */}
        <AttendanceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onMarkAttendance={handleMarkAttendance}
          branches={branches}
        />

        {/* Attendance Check-out Modal (Different from global sign-out) */}
        {isLogoutModalOpen && (
          <LogoutModal
            isOpen={isLogoutModalOpen}
            onClose={() => setIsLogoutModalOpen(false)}
            onConfirmLogout={handleCheckOut}
            branches={branches}
          />
        )}
      </div>
    </AppShell>
  );
};

export default AttendancePage;
