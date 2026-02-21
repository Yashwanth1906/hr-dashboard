export type UserRole = 'admin' | 'manager' | 'employee' | 'hr';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  joinDate?: string;
}

export type TaskStatus = 'todo' | 'assigned' | 'in-progress' | 'review' | 'qa' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskTag = 'features' | 'bugs' | 'refactors';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: User;
  assignedTo?: User; // Employee assigned to task
  dueDate: string;
  createdAt: string;
  tags?: TaskTag[];
  prLink?: string;
  reviewer?: User;
  startedAt?: string;
  completedAt?: string;
}

export interface Team {
  id: string;
  name: string;
  product: string;
  description: string;
  members: User[];
  manager: User;
  createdAt: string;
  memberCount: number;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  position: string;
  department: string;
  manager?: string;
  startDate: string;
  salary?: number;
  avatar?: string;
  status: 'active' | 'inactive' | 'on-leave';
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters (geofence radius)
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  branch?: string;
  locationLat?: number;
  locationLng?: number;
  isWFH?: boolean;
}

export interface Certification {
  id: string;
  employeeId: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  url?: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

export interface EmployeeAnalytics {
  employeeId: string;
  tasksCompleted: number;
  attendanceRate: number;
  kpiScore: number;
  certifications: Certification[];
  strengths: string[];
  areasForImprovement: string[];
  overallScore: number;
  review?: AIReview;
}

export interface AIReview {
  id: string;
  employeeId: string;
  createdAt: string;
  description: string;
  score: number;
  strengths: string[];
  suggestions: string[];
}
