import React, { useState, useEffect } from 'react';
import AppShell from '../components/AppShell';
import CompletedTaskModal from '../components/CompletedTaskModal';
import {
  AssignTargetModal,
  CompleteTargetModal,
  ReviewTargetModal,
  OverallRatingModal,
  TargetCard,
  InlineStars,
} from '../components/TargetManagement';
import { Task, Target, EmployeeRatingRecord } from '../types';
import { API_URL } from '../utils/utils';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const EmployeesPage: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const [employees, setEmployees] = useState<any[]>([]);
  const [employeeDetails, setEmployeeDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Create employee modal (Admin only)
  const [showCreateEmployee, setShowCreateEmployee] = useState(false);
  const [newEmp, setNewEmp] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'EMPLOYEE' });
  const [creatingEmp, setCreatingEmp] = useState(false);
  const [showNewEmpPw, setShowNewEmpPw] = useState(false);

  const handleCreateEmployee = async () => {
    if (!newEmp.firstName || !newEmp.lastName || !newEmp.email || !newEmp.password) return;
    setCreatingEmp(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/auth/create-user`, newEmp, {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: () => true,
      });
      if (res.status >= 200 && res.status < 300) {
        setShowCreateEmployee(false);
        setNewEmp({ firstName: '', lastName: '', email: '', password: '', role: 'EMPLOYEE' });
        // Refresh employees list
        const empRes = await axios(`${API_URL}/employees`, { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true });
        if (empRes.status >= 200 && empRes.status < 300) setEmployees(empRes.data);
      } else {
        alert(res.data?.error || 'Failed to create employee');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreatingEmp(false);
    }
  };

  // Target modals
  const [showAssignTarget, setShowAssignTarget] = useState(false);
  const [showCompleteTarget, setShowCompleteTarget] = useState(false);
  const [showReviewTarget, setShowReviewTarget] = useState(false);
  const [showSelfRating, setShowSelfRating] = useState(false);
  const [showManagerRating, setShowManagerRating] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);

  // no ref needed - PDF is generated programmatically

  const isManager = user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager';

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios(`${API_URL}/employees`, {
          validateStatus: () => true,
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status >= 200 && res.status < 300) {
          setEmployees(res.data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchEmployees();
  }, []);

  const fetchDetails = async () => {
    if (!selectedEmployee) return;
    try {
      setIsLoadingDetails(true);
      const token = localStorage.getItem('token');
      const userId = selectedEmployee.user?.id || selectedEmployee.userId || selectedEmployee.id;
      const res = await axios(`${API_URL}/employees/getDetails/${userId}`, {
        validateStatus: () => true,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status >= 200 && res.status < 300) {
        setEmployeeDetails(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (selectedEmployee) {
      fetchDetails();
    } else {
      setEmployeeDetails(null);
    }
  }, [selectedEmployee]);

  // Manager sees only employees in their managed teams
  const visibleEmployees = user?.role === 'manager'
    ? employees.filter((emp) => {
        // Show employees whose team has the current user as manager
        // We need to check via managedTeams — for simplicity, filter by team membership
        // The manager can see employees in teams they manage
        return emp.team?.managers?.some((m: any) => m.user?.id === user?.id || m.userId === user?.id)
          || emp.user?.id === user?.id; // Also show self
      })
    : employees;

  const filteredEmployees = visibleEmployees.filter(
    (emp) =>
      emp.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.jobRole?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // PDF download — generates a clean data sheet
  const handleDownloadPDF = async () => {
    if (!employeeDetails || !selectedEmployee) return;
    const { default: jsPDF } = await import('jspdf');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentW = pageW - margin * 2;
    let y = margin;

    const colors = {
      primary: [30, 41, 59] as [number, number, number],       // slate-800
      secondary: [100, 116, 139] as [number, number, number],  // slate-500
      accent: [37, 99, 235] as [number, number, number],       // blue-600
      green: [22, 163, 74] as [number, number, number],
      red: [220, 38, 38] as [number, number, number],
      purple: [124, 58, 237] as [number, number, number],
      black: [0, 0, 0] as [number, number, number],
      white: [255, 255, 255] as [number, number, number],
      lightGray: [241, 245, 249] as [number, number, number],  // slate-100
      border: [203, 213, 225] as [number, number, number],     // slate-300
    };

    const checkPage = (needed: number) => {
      if (y + needed > pageH - margin) {
        pdf.addPage();
        y = margin;
      }
    };

    const drawLine = () => {
      pdf.setDrawColor(...colors.border);
      pdf.setLineWidth(0.3);
      pdf.line(margin, y, pageW - margin, y);
      y += 4;
    };

    const sectionTitle = (title: string) => {
      checkPage(14);
      y += 4;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(...colors.primary);
      pdf.text(title, margin, y);
      y += 2;
      drawLine();
    };

    const keyValue = (key: string, value: string, xOffset = 0) => {
      checkPage(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(...colors.secondary);
      pdf.text(key, margin + xOffset, y);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(...colors.primary);
      pdf.text(value, margin + xOffset + 45, y);
      y += 6;
    };

    const starString = (val: number, max = 5) => {
      return '★'.repeat(val) + '☆'.repeat(max - val) + ` (${val}/${max})`;
    };

    // ——— HEADER ———
    pdf.setFillColor(...colors.primary);
    pdf.rect(0, 0, pageW, 38, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor(...colors.white);
    const empName = `${selectedEmployee.user?.firstName} ${selectedEmployee.user?.lastName}`;
    pdf.text(empName, margin, 16);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.text(selectedEmployee.jobRole?.name || 'N/A', margin, 24);

    pdf.setFontSize(9);
    pdf.text(`${selectedEmployee.user?.email}  |  ${selectedEmployee.department?.name || 'N/A'}  |  ${selectedEmployee.team?.name || 'Unassigned'}`, margin, 32);

    // Generated date on right
    pdf.setFontSize(8);
    pdf.setTextColor(180, 190, 210);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageW - margin, 32, { align: 'right' });

    y = 46;

    // ——— SCORES SUMMARY ———
    sectionTitle('Performance Summary');

    const {
      kpiScore = 0, kriScore = 0, overallScore = 0,
      kpiBreakdown = {} as any, kriBreakdown = {} as any,
      attendanceStats = { present: 0, late: 0, absent: 0, halfDay: 0 },
      attendanceRate = 0, completedTasks = [], targets = [], ratings = [],
    } = employeeDetails;

    // Score boxes
    const boxW = (contentW - 8) / 3;
    const boxH = 18;

    const drawScoreBox = (x: number, label: string, value: string, color: [number, number, number]) => {
      pdf.setFillColor(...colors.lightGray);
      pdf.roundedRect(x, y, boxW, boxH, 2, 2, 'F');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(...colors.secondary);
      pdf.text(label, x + 4, y + 6);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(...color);
      pdf.text(value, x + 4, y + 15);
    };

    drawScoreBox(margin, 'KPI SCORE', `${kpiScore.toFixed(1)} / 10`, colors.green);
    drawScoreBox(margin + boxW + 4, 'KRI SCORE', `${kriScore.toFixed(1)} / 10`, colors.red);
    drawScoreBox(margin + (boxW + 4) * 2, 'OVERALL SCORE', `${overallScore.toFixed(1)} / 10`, colors.purple);
    y += boxH + 6;

    // ——— KPI BREAKDOWN ———
    sectionTitle('KPI Breakdown (Key Performance Indicators)');

    const kpiItems = [
      ['Task Completion Rate', `${kpiBreakdown.taskCompletionRate || 0}%`, '25%'],
      ['Attendance Score', `${kpiBreakdown.attendanceScore || 0}%`, '20%'],
      ['Target Completion Rate', `${kpiBreakdown.targetCompletionRate || 0}%`, '25%'],
      ['On-Time Delivery Rate', `${kpiBreakdown.onTimeDeliveryRate || 0}%`, '15%'],
      ['Certifications Score', `${kpiBreakdown.certificationsScore || 0}%`, '5%'],
      ['Manager Target Rating', `${kpiBreakdown.managerTargetRating || 0}%`, '10%'],
    ];

    // Table header
    checkPage(8);
    pdf.setFillColor(...colors.primary);
    pdf.rect(margin, y, contentW, 7, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(...colors.white);
    pdf.text('Metric', margin + 3, y + 5);
    pdf.text('Score', margin + 100, y + 5);
    pdf.text('Weight', margin + 140, y + 5);
    y += 7;

    kpiItems.forEach(([metric, score, weight], i) => {
      checkPage(7);
      if (i % 2 === 0) {
        pdf.setFillColor(...colors.lightGray);
        pdf.rect(margin, y, contentW, 7, 'F');
      }
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(...colors.primary);
      pdf.text(metric, margin + 3, y + 5);
      pdf.setFont('helvetica', 'bold');
      pdf.text(score, margin + 100, y + 5);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...colors.secondary);
      pdf.text(weight, margin + 140, y + 5);
      y += 7;
    });
    y += 2;

    // ——— KRI BREAKDOWN ———
    sectionTitle('KRI Breakdown (Key Risk Indicators — lower is better)');

    const kriItems = [
      ['Late Attendance Rate', `${kriBreakdown.lateAttendanceRate || 0}%`, '25%'],
      ['Missed Target Rate', `${kriBreakdown.missedTargetRate || 0}%`, '25%'],
      ['Overdue Task Rate', `${kriBreakdown.overdueTaskRate || 0}%`, '20%'],
      ['Leave Frequency', `${kriBreakdown.leaveFrequency || 0}%`, '15%'],
      ['Incomplete Task Rate', `${kriBreakdown.incompleteTaskRate || 0}%`, '15%'],
    ];

    checkPage(8);
    pdf.setFillColor(...colors.red);
    pdf.rect(margin, y, contentW, 7, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(...colors.white);
    pdf.text('Risk Metric', margin + 3, y + 5);
    pdf.text('Score', margin + 100, y + 5);
    pdf.text('Weight', margin + 140, y + 5);
    y += 7;

    kriItems.forEach(([metric, score, weight], i) => {
      checkPage(7);
      if (i % 2 === 0) {
        pdf.setFillColor(254, 226, 226);
        pdf.rect(margin, y, contentW, 7, 'F');
      }
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(...colors.primary);
      pdf.text(metric, margin + 3, y + 5);
      pdf.setFont('helvetica', 'bold');
      pdf.text(score, margin + 100, y + 5);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...colors.secondary);
      pdf.text(weight, margin + 140, y + 5);
      y += 7;
    });
    y += 2;

    // ——— ATTENDANCE REPORT ———
    sectionTitle('Attendance Report (Last 30 Days)');

    checkPage(14);
    const attBoxW = (contentW - 12) / 4;
    const attLabels = ['Present', 'Late', 'Half Day', 'Absent'];
    const attValues = [attendanceStats.present, attendanceStats.late, attendanceStats.halfDay, attendanceStats.absent];
    const attColors: [number, number, number][] = [colors.green, [217, 119, 6], [234, 88, 12], colors.red];

    attLabels.forEach((label, i) => {
      const x = margin + i * (attBoxW + 4);
      pdf.setFillColor(...colors.lightGray);
      pdf.roundedRect(x, y, attBoxW, 14, 2, 2, 'F');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(...colors.secondary);
      pdf.text(label, x + 3, y + 5);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(...attColors[i]);
      pdf.text(String(attValues[i]), x + 3, y + 12);
    });
    y += 18;

    keyValue('Attendance Rate', `${attendanceRate}%`);

    // ——— TARGETS ———
    sectionTitle(`Targets (${(targets as Target[]).length})`);

    if ((targets as Target[]).length === 0) {
      checkPage(8);
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(9);
      pdf.setTextColor(...colors.secondary);
      pdf.text('No targets assigned yet.', margin, y);
      y += 6;
    } else {
      // Table header
      checkPage(8);
      pdf.setFillColor(...colors.primary);
      pdf.rect(margin, y, contentW, 7, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(...colors.white);
      pdf.text('Target', margin + 3, y + 5);
      pdf.text('Status', margin + 85, y + 5);
      pdf.text('Self Rating', margin + 115, y + 5);
      pdf.text('Mgr Rating', margin + 145, y + 5);
      y += 7;

      (targets as Target[]).forEach((t, i) => {
        checkPage(7);
        if (i % 2 === 0) {
          pdf.setFillColor(...colors.lightGray);
          pdf.rect(margin, y, contentW, 7, 'F');
        }
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(...colors.primary);
        const titleTrunc = t.title.length > 40 ? t.title.substring(0, 40) + '...' : t.title;
        pdf.text(titleTrunc, margin + 3, y + 5);

        const statusColor = t.status === 'REVIEWED' ? colors.purple : t.status === 'COMPLETED' ? colors.green : t.status === 'ASSIGNED' ? colors.accent : [217, 119, 6] as [number, number, number];
        pdf.setTextColor(...statusColor);
        pdf.setFont('helvetica', 'bold');
        pdf.text(t.status, margin + 85, y + 5);

        pdf.setTextColor(...colors.primary);
        pdf.setFont('helvetica', 'normal');
        pdf.text(t.selfRating ? starString(t.selfRating) : '—', margin + 115, y + 5);
        pdf.text(t.managerRating ? starString(t.managerRating) : '—', margin + 145, y + 5);
        y += 7;
      });
    }
    y += 2;

    // ——— OVERALL RATINGS ———
    sectionTitle('Overall Ratings');

    const selfRatings = (ratings as EmployeeRatingRecord[]).filter((r) => r.type === 'SELF');
    const managerRatings = (ratings as EmployeeRatingRecord[]).filter((r) => r.type === 'MANAGER');

    if (selfRatings.length === 0 && managerRatings.length === 0) {
      checkPage(8);
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(9);
      pdf.setTextColor(...colors.secondary);
      pdf.text('No ratings yet.', margin, y);
      y += 6;
    } else {
      if (selfRatings.length > 0) {
        checkPage(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(...colors.accent);
        pdf.text('Self Assessments', margin, y);
        y += 6;
        selfRatings.forEach((r) => {
          checkPage(12);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9);
          pdf.setTextColor(...colors.primary);
          pdf.text(starString(r.rating), margin + 2, y);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
          pdf.setTextColor(...colors.secondary);
          pdf.text(new Date(r.createdAt).toLocaleDateString(), margin + 60, y);
          y += 5;
          if (r.description) {
            const lines = pdf.splitTextToSize(r.description, contentW - 4);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8);
            pdf.setTextColor(...colors.primary);
            lines.forEach((line: string) => {
              checkPage(5);
              pdf.text(line, margin + 2, y);
              y += 4;
            });
          }
          y += 3;
        });
      }
      if (managerRatings.length > 0) {
        checkPage(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(...colors.purple);
        pdf.text('Manager Assessments', margin, y);
        y += 6;
        managerRatings.forEach((r) => {
          checkPage(12);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9);
          pdf.setTextColor(...colors.primary);
          pdf.text(starString(r.rating), margin + 2, y);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
          pdf.setTextColor(...colors.secondary);
          const raterName = r.ratedBy ? `${r.ratedBy.user.firstName} ${r.ratedBy.user.lastName}` : '';
          pdf.text(`${raterName}  •  ${new Date(r.createdAt).toLocaleDateString()}`, margin + 60, y);
          y += 5;
          if (r.description) {
            const lines = pdf.splitTextToSize(r.description, contentW - 4);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8);
            pdf.setTextColor(...colors.primary);
            lines.forEach((line: string) => {
              checkPage(5);
              pdf.text(line, margin + 2, y);
              y += 4;
            });
          }
          y += 3;
        });
      }
    }

    // ——— COMPLETED TASKS ———
    sectionTitle(`Completed Tasks (${completedTasks.length})`);

    if (completedTasks.length === 0) {
      checkPage(8);
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(9);
      pdf.setTextColor(...colors.secondary);
      pdf.text('No completed tasks yet.', margin, y);
      y += 6;
    } else {
      checkPage(8);
      pdf.setFillColor(...colors.green);
      pdf.rect(margin, y, contentW, 7, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(...colors.white);
      pdf.text('Task', margin + 3, y + 5);
      pdf.text('Team', margin + 100, y + 5);
      pdf.text('Completed', margin + 140, y + 5);
      y += 7;

      completedTasks.slice(0, 20).forEach((task: any, i: number) => {
        checkPage(7);
        if (i % 2 === 0) {
          pdf.setFillColor(...colors.lightGray);
          pdf.rect(margin, y, contentW, 7, 'F');
        }
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(...colors.primary);
        const tTitle = task.title.length > 45 ? task.title.substring(0, 45) + '...' : task.title;
        pdf.text(tTitle, margin + 3, y + 5);
        pdf.setTextColor(...colors.secondary);
        pdf.text(task.team?.name || '—', margin + 100, y + 5);
        pdf.text(task.completedAt ? new Date(task.completedAt).toLocaleDateString() : '—', margin + 140, y + 5);
        y += 7;
      });

      if (completedTasks.length > 20) {
        checkPage(7);
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(8);
        pdf.setTextColor(...colors.secondary);
        pdf.text(`+ ${completedTasks.length - 20} more tasks`, margin + 3, y + 4);
        y += 7;
      }
    }

    // ——— FOOTER ———
    const totalPages = pdf.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      pdf.setPage(p);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(...colors.secondary);
      pdf.text('HR Dashboard — Employee Data Sheet', margin, pageH - 6);
      pdf.text(`Page ${p} of ${totalPages}`, pageW - margin, pageH - 6, { align: 'right' });
    }

    pdf.save(`${selectedEmployee.user?.firstName}_${selectedEmployee.user?.lastName}_Report.pdf`);
  };

  // Check if viewing own profile
  const isOwnProfile = selectedEmployee && (selectedEmployee.user?.id === user?.id || selectedEmployee.userId === user?.id);

  if (selectedEmployee) {
    if (isLoadingDetails) {
      return (
        <AppShell>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
          </div>
        </AppShell>
      );
    }

    const {
      kpiScore = 0, kriScore = 0, overallScore = 0,
      kpiBreakdown = {}, kriBreakdown = {},
      attendanceStats = { present: 0, late: 0, absent: 0, halfDay: 0 },
      attendanceRate = 0, completedTasks = [], targets = [], ratings = [],
    } = employeeDetails || {};

    const selfRatings = (ratings as EmployeeRatingRecord[]).filter((r) => r.type === 'SELF');
    const managerRatings = (ratings as EmployeeRatingRecord[]).filter((r) => r.type === 'MANAGER');

    return (
      <AppShell>
        <div className="space-y-8">
          {/* Top bar: back + PDF download */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedEmployee(null)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Employees
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </button>
          </div>

          {/* Employee Header */}
          <div className="bg-white rounded-lg shadow-md p-6 flex items-start justify-between">
            <div className="flex items-center gap-6">
              <img
                src={selectedEmployee.user?.avatar || `https://ui-avatars.com/api/?name=${selectedEmployee.user?.firstName}+${selectedEmployee.user?.lastName}&background=random`}
                alt={`${selectedEmployee.user?.firstName} ${selectedEmployee.user?.lastName}`}
                className="w-24 h-24 rounded-full"
              />
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  {selectedEmployee.user?.firstName} {selectedEmployee.user?.lastName}
                </h1>
                <p className="text-slate-600 text-lg">{selectedEmployee.jobRole?.name || 'Unknown Position'}</p>
                <p className="text-slate-500 mt-1">{selectedEmployee.user?.email}</p>
              </div>
            </div>
            <span className="inline-block px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-700">Active</span>
          </div>

          {/* KPI / KRI / Overall Scores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-green-500">
              <p className="text-sm font-medium text-slate-500">KPI Score</p>
              <p className="text-4xl font-bold text-green-600 mt-1">{kpiScore.toFixed(1)}<span className="text-lg text-slate-400">/10</span></p>
              <p className="text-xs text-slate-400 mt-1">Key Performance Indicator</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-red-500">
              <p className="text-sm font-medium text-slate-500">KRI Score</p>
              <p className="text-4xl font-bold text-red-600 mt-1">{kriScore.toFixed(1)}<span className="text-lg text-slate-400">/10</span></p>
              <p className="text-xs text-slate-400 mt-1">Key Risk Indicator (lower is better)</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-purple-500">
              <p className="text-sm font-medium text-slate-500">Overall Score</p>
              <p className="text-4xl font-bold text-purple-600 mt-1">{overallScore.toFixed(1)}<span className="text-lg text-slate-400">/10</span></p>
              <p className="text-xs text-slate-400 mt-1">KPI adjusted by KRI</p>
            </div>
          </div>

          {/* KPI Breakdown */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">KPI Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Task Completion', value: kpiBreakdown.taskCompletionRate, weight: '25%', color: 'blue' },
                { label: 'Attendance', value: kpiBreakdown.attendanceScore, weight: '20%', color: 'green' },
                { label: 'Target Completion', value: kpiBreakdown.targetCompletionRate, weight: '25%', color: 'indigo' },
                { label: 'On-Time Delivery', value: kpiBreakdown.onTimeDeliveryRate, weight: '15%', color: 'cyan' },
                { label: 'Certifications', value: kpiBreakdown.certificationsScore, weight: '5%', color: 'amber' },
                { label: 'Manager Target Rating', value: kpiBreakdown.managerTargetRating, weight: '10%', color: 'purple' },
              ].map((item) => (
                <div key={item.label} className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                    <span className="text-xs text-slate-400">Weight: {item.weight}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        item.color === 'blue' ? 'bg-blue-500' :
                        item.color === 'green' ? 'bg-green-500' :
                        item.color === 'indigo' ? 'bg-indigo-500' :
                        item.color === 'cyan' ? 'bg-cyan-500' :
                        item.color === 'amber' ? 'bg-amber-500' :
                        'bg-purple-500'
                      }`}
                      style={{ width: `${item.value || 0}%` }}
                    />
                  </div>
                  <p className="text-right text-sm font-semibold text-slate-900 mt-1">{item.value || 0}%</p>
                </div>
              ))}
            </div>
          </div>

          {/* KRI Breakdown */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">KRI Breakdown <span className="text-sm font-normal text-slate-400">(Risk Indicators - lower is better)</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Late Attendance', value: kriBreakdown.lateAttendanceRate, weight: '25%' },
                { label: 'Missed Targets', value: kriBreakdown.missedTargetRate, weight: '25%' },
                { label: 'Overdue Tasks', value: kriBreakdown.overdueTaskRate, weight: '20%' },
                { label: 'Leave Frequency', value: kriBreakdown.leaveFrequency, weight: '15%' },
                { label: 'Incomplete Tasks', value: kriBreakdown.incompleteTaskRate, weight: '15%' },
              ].map((item) => (
                <div key={item.label} className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                    <span className="text-xs text-slate-400">Weight: {item.weight}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${item.value || 0}%` }} />
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

          {/* Targets Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                Targets ({(targets as Target[]).length})
              </h2>
              <div className="flex gap-2">
                {isManager && !isOwnProfile && (
                  <button
                    onClick={() => setShowAssignTarget(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                  >
                    + Assign Target
                  </button>
                )}
              </div>
            </div>
            {(targets as Target[]).length > 0 ? (
              <div className="space-y-3">
                {(targets as Target[]).map((target) => (
                  <TargetCard
                    key={target.id}
                    target={target}
                    isManager={isManager}
                    isOwn={isOwnProfile || false}
                    onComplete={(t) => { setSelectedTarget(t); setShowCompleteTarget(true); }}
                    onReview={(t) => { setSelectedTarget(t); setShowReviewTarget(true); }}
                  />
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-6">No targets assigned yet</p>
            )}
          </div>

          {/* Overall Ratings Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Overall Ratings</h2>
              <div className="flex gap-2">
                {isOwnProfile && (
                  <button
                    onClick={() => setShowSelfRating(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                  >
                    Rate Yourself
                  </button>
                )}
                {isManager && !isOwnProfile && (
                  <button
                    onClick={() => setShowManagerRating(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition"
                  >
                    Rate Employee
                  </button>
                )}
              </div>
            </div>

            {(ratings as EmployeeRatingRecord[]).length > 0 ? (
              <div className="space-y-3">
                {/* Self Ratings */}
                {selfRatings.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">Self Assessments</h3>
                    {selfRatings.map((r) => (
                      <div key={r.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <InlineStars value={r.rating} />
                            <span className="text-sm font-semibold text-slate-700">({r.rating}/5)</span>
                          </div>
                          <span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                        {r.description && <p className="text-sm text-slate-600 mt-2">{r.description}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {/* Manager Ratings */}
                {managerRatings.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">Manager Assessments</h3>
                    {managerRatings.map((r) => (
                      <div key={r.id} className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <InlineStars value={r.rating} />
                            <span className="text-sm font-semibold text-slate-700">({r.rating}/5)</span>
                            {r.ratedBy && (
                              <span className="text-xs text-slate-400">
                                by {r.ratedBy.user.firstName} {r.ratedBy.user.lastName}
                              </span>
                            )}
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
                  <div
                    key={task.id}
                    onClick={() => { setSelectedTask(task); setIsTaskModalOpen(true); }}
                    className="p-3 bg-slate-50 rounded-lg flex items-start justify-between hover:bg-slate-100 cursor-pointer transition"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{task.title}</p>
                      <p className="text-sm text-slate-600">{task.description}</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold whitespace-nowrap ml-2">Completed</span>
                  </div>
                ))}
                {completedTasks.length > 5 && (
                  <p className="text-sm text-slate-600 text-center pt-2">+{completedTasks.length - 5} more tasks</p>
                )}
              </div>
            ) : (
              <p className="text-slate-600 text-center py-4">No completed tasks yet</p>
            )}
          </div>
        </div>

        {/* Modals */}
        <AssignTargetModal
          isOpen={showAssignTarget}
          onClose={() => setShowAssignTarget(false)}
          employeeId={selectedEmployee?.id}
          employeeName={`${selectedEmployee?.user?.firstName} ${selectedEmployee?.user?.lastName}`}
          onCreated={fetchDetails}
        />
        <CompleteTargetModal
          isOpen={showCompleteTarget}
          onClose={() => { setShowCompleteTarget(false); setSelectedTarget(null); }}
          target={selectedTarget}
          onCompleted={fetchDetails}
        />
        <ReviewTargetModal
          isOpen={showReviewTarget}
          onClose={() => { setShowReviewTarget(false); setSelectedTarget(null); }}
          target={selectedTarget}
          onReviewed={fetchDetails}
        />
        <OverallRatingModal
          isOpen={showSelfRating}
          onClose={() => setShowSelfRating(false)}
          type="SELF"
          onSubmitted={fetchDetails}
        />
        <OverallRatingModal
          isOpen={showManagerRating}
          onClose={() => setShowManagerRating(false)}
          employeeId={selectedEmployee?.id}
          employeeName={`${selectedEmployee?.user?.firstName} ${selectedEmployee?.user?.lastName}`}
          type="MANAGER"
          onSubmitted={fetchDetails}
        />
        <CompletedTaskModal
          task={selectedTask}
          isOpen={isTaskModalOpen}
          onClose={() => { setIsTaskModalOpen(false); setSelectedTask(null); }}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Employees</h1>
            <p className="text-slate-600 mt-2">Manage all employees in your organization</p>
          </div>
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowCreateEmployee(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition shadow flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Employee
            </button>
          )}
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
                  <th className="text-left py-4 px-6 font-semibold text-slate-700">Team</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700">Start Date</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee: any) => (
                  <tr key={employee.id} className="border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={employee.user?.avatar || `https://ui-avatars.com/api/?name=${employee.user?.firstName}+${employee.user?.lastName}&background=random`}
                          alt={`${employee.user?.firstName} ${employee.user?.lastName}`}
                          className="w-10 h-10 rounded-full bg-slate-300"
                        />
                        <div>
                          <p className="font-medium text-slate-900">{employee.user?.firstName} {employee.user?.lastName}</p>
                          <p className="text-sm text-slate-500">{employee.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-900">{employee.jobRole?.name || 'N/A'}</td>
                    <td className="py-4 px-6 text-slate-600">{employee.department?.name || 'N/A'}</td>
                    <td className="py-4 px-6 text-slate-600">
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">
                        {employee.team?.name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600">{new Date(employee.joinDate).toLocaleDateString()}</td>
                    <td className="py-4 px-6">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Active</span>
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
            <p className="text-3xl font-bold text-slate-900 mt-2">{employees.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-slate-600 text-sm font-medium">Active</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{employees.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-slate-600 text-sm font-medium">On Leave</p>
            <p className="text-3xl font-bold text-amber-600 mt-2">0</p>
          </div>
        </div>
        {/* Create Employee Modal */}
        {showCreateEmployee && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Create Employee</h2>
                <button onClick={() => setShowCreateEmployee(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                    <input value={newEmp.firstName} onChange={(e) => setNewEmp({ ...newEmp, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                    <input value={newEmp.lastName} onChange={(e) => setNewEmp({ ...newEmp, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                  <input type="email" value={newEmp.email} onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                  <div className="relative">
                    <input type={showNewEmpPw ? 'text' : 'password'} value={newEmp.password} onChange={(e) => setNewEmp({ ...newEmp, password: e.target.value })}
                      className="w-full px-3 py-2 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900" />
                    <button type="button" onClick={() => setShowNewEmpPw(!showNewEmpPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                      {showNewEmpPw ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
                  <select value={newEmp.role} onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white">
                    <option value="EMPLOYEE">Employee</option>
                    <option value="MANAGER">Manager</option>
                    <option value="HR">HR</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowCreateEmployee(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium">Cancel</button>
                  <button onClick={handleCreateEmployee} disabled={creatingEmp || !newEmp.firstName || !newEmp.lastName || !newEmp.email || !newEmp.password}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
                    {creatingEmp ? 'Creating...' : 'Create Employee'}
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

export default EmployeesPage;
