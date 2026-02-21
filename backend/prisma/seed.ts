import { Role, TaskStatus, Priority, LeaveType, LeaveStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('🌱 Starting database seed...')

  const engineeringDept = await prisma.department.create({
    data: { name: 'Engineering' },
  })

  const hrDept = await prisma.department.create({
    data: { name: 'Human Resources' },
  })
  const salesDept = await prisma.department.create({
    data: { name: 'Sales' },
  })
  console.log('✅ Departments created')

  // Create job roles
  const adminJobRole = await prisma.jobRole.create({
    data: { name: 'System Administrator', salary: 100000 },
  })
  const managerJobRole = await prisma.jobRole.create({
    data: { name: 'Manager', salary: 80000 },
  })
  const developerJobRole = await prisma.jobRole.create({
    data: { name: 'Developer', salary: 60000 },
  })
  const hrJobRole = await prisma.jobRole.create({
    data: { name: 'HR Specialist', salary: 55000 },
  })
  console.log('✅ Job roles created')

  // Create company branches
  const mainBranch = await prisma.companyBranch.create({
    data: {
      name: 'Main Office',
      latitude: 40.7128,
      longtitude: -74.0060,
    },
  })
  console.log('✅ Company branches created')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@company.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    },
  })
  console.log('✅ Admin user created:', adminUser.email)

  // Create HR user
  const hrPassword = await bcrypt.hash('hr123', 10)
  const hrUser = await prisma.user.create({
    data: {
      email: 'hr@company.com',
      password: hrPassword,
      firstName: 'HR',
      lastName: 'Manager',
      role: UserRole.HR,
    },
  })
  console.log('✅ HR user created:', hrUser.email)

  // Create manager user
  const managerPassword = await bcrypt.hash('manager123', 10)
  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@company.com',
      password: managerPassword,
      firstName: 'John',
      lastName: 'Manager',
      role: UserRole.MANAGER,
    },
  })
  console.log('✅ Manager user created:', managerUser.email)

  // Create employee users
  const employeePassword = await bcrypt.hash('employee123', 10)

  const employeeData = [
    {
      email: 'alice@company.com',
      firstName: 'Alice',
      lastName: 'Johnson',
    },
    {
      email: 'bob@company.com',
      firstName: 'Bob',
      lastName: 'Smith',
    },
    {
      email: 'carol@company.com',
      firstName: 'Carol',
      lastName: 'Williams',
    },
    {
      email: 'david@company.com',
      firstName: 'David',
      lastName: 'Brown',
    },
  ]

  const employeeUsers = []
  for (const emp of employeeData) {
    const user = await prisma.user.create({
      data: {
        ...emp,
        password: employeePassword,
        role: UserRole.EMPLOYEE,
      },
    })
    employeeUsers.push(user)
    console.log('✅ Employee user created:', user.email)
  }

  // Create employees
  const adminEmployee = await prisma.employee.create({
    data: {
      userId: adminUser.id,
      jobRoleId: adminJobRole.id,
      departmentId: engineeringDept.id,
      joinDate: new Date('2020-01-01'),
      phone: '+1234567890',
      address: '123 Admin St',
      kpi: 95,
      attendanceRate: 98,
      teamId: '', // Will be updated after team creation
    },
  })

  const hrEmployee = await prisma.employee.create({
    data: {
      userId: hrUser.id,
      jobRoleId: hrJobRole.id,
      departmentId: hrDept.id,
      joinDate: new Date('2019-06-01'),
      phone: '+1234567891',
      address: '456 HR Ave',
      kpi: 92,
      attendanceRate: 97,
      teamId: '', // Will be updated after team creation
    },
  })

  const managerEmployee = await prisma.employee.create({
    data: {
      userId: managerUser.id,
      jobRoleId: managerJobRole.id,
      departmentId: engineeringDept.id,
      joinDate: new Date('2018-03-15'),
      phone: '+1234567892',
      address: '789 Manager Blvd',
      kpi: 90,
      attendanceRate: 96,
      teamId: '', // Will be updated after team creation
    },
  })

  const employees = []
  for (let i = 0; i < employeeUsers.length; i++) {
    const emp = await prisma.employee.create({
      data: {
        userId: employeeUsers[i].id,
        jobRoleId: developerJobRole.id,
        departmentId: engineeringDept.id,
        joinDate: new Date(`2021-0${i + 1}-01`),
        phone: `+123456789${i + 3}`,
        address: `${i + 321} Employee Ln`,
        kpi: 85 + i * 2,
        attendanceRate: 93 + i,
        teamId: '', // Will be updated after team creation
      },
    })
    employees.push(emp)
    console.log('✅ Employee record created for:', employeeUsers[i].email)
  }

  // Create teams
  const engineeringTeam = await prisma.team.create({
    data: {
      name: 'Engineering Team',
      description: 'Main engineering team',
      managerId: managerEmployee.id,
      productName: 'Core Product',
    },
  })

  const hrTeam = await prisma.team.create({
    data: {
      name: 'HR Team',
      description: 'Human resources team',
      managerId: hrEmployee.id,
      productName: 'HR Management',
    },
  })
  console.log('✅ Teams created')

  // Update employees with team IDs
  await prisma.employee.update({
    where: { id: adminEmployee.id },
    data: { teamId: engineeringTeam.id },
  })
  await prisma.employee.update({
    where: { id: hrEmployee.id },
    data: { teamId: hrTeam.id },
  })
  await prisma.employee.update({
    where: { id: managerEmployee.id },
    data: { teamId: engineeringTeam.id },
  })
  for (const emp of employees) {
    await prisma.employee.update({
      where: { id: emp.id },
      data: { teamId: engineeringTeam.id },
    })
  }
  console.log('✅ Employee teams updated')

  // Create attendance records
  const today = new Date()
  for (const emp of [adminEmployee, hrEmployee, managerEmployee, ...employees]) {
    await prisma.attendance.create({
      data: {
        employeeId: emp.id,
        date: today,
        checkIn: new Date(today.setHours(9, 0, 0, 0)),
        checkOut: new Date(today.setHours(17, 30, 0, 0)),
        duration: 8.5,
        isWFH: false,
        companyBranchId: mainBranch.id,
        isLate: false,
        isHalfDay: false,
      },
    })
    console.log('✅ Attendance record created for employee:', emp.id)
  }

  // Create tasks
  const tasks = [
    {
      title: 'Complete project documentation',
      description: 'Write comprehensive documentation for the new API endpoints',
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Review pull requests',
      description: 'Review and approve pending pull requests from the team',
      status: TaskStatus.ASSIGNED,
      priority: Priority.MEDIUM,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Update website design',
      description: 'Implement new design changes for the company website',
      status: TaskStatus.COMPLETED,
      priority: Priority.LOW,
      completedAt: new Date(),
    },
    {
      title: 'Prepare quarterly report',
      description: 'Compile and analyze data for the quarterly performance report',
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  ]

  const allEmployees = [adminEmployee, hrEmployee, managerEmployee, ...employees]
  for (let i = 0; i < tasks.length; i++) {
    const task = await prisma.task.create({
      data: {
        ...tasks[i],
        assigneeId: allEmployees[i % allEmployees.length].id,
      },
    })
    console.log('✅ Task created:', task.title)
  }

  // Create leave requests
  const leaves = [
    {
      employee: employees[0],
      type: LeaveType.ANNUAL,
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000),
      reason: 'Family vacation',
      status: LeaveStatus.APPROVED,
      approvedById: managerEmployee.id,
      approvedAt: new Date(),
    },
    {
      employee: employees[1],
      type: LeaveType.SICK,
      startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      reason: 'Medical appointment',
      status: LeaveStatus.PENDING,
    },
    {
      employee: employees[2],
      type: LeaveType.CASUAL,
      startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      reason: 'Home maintenance',
      status: LeaveStatus.APPROVED,
      approvedById: managerEmployee.id,
      approvedAt: new Date(),
    },
  ]

  for (const leave of leaves) {
    const { employee, ...leaveData } = leave
    const createdLeave = await prisma.leave.create({
      data: {
        ...leaveData,
        employeeId: employee.id,
      },
    })
    console.log('✅ Leave request created for employee:', employee.id)
  }

  // Create certifications
  const certifications = [
    {
      name: 'AWS Certified Solutions Architect',
      issuer: 'Amazon Web Services',
      issueDate: new Date('2023-01-15'),
      expiryDate: new Date('2026-01-15'),
      url: 'https://aws.amazon.com/certification',
      employeeId: employees[0].id,
    },
    {
      name: 'Google Analytics Certification',
      issuer: 'Google',
      issueDate: new Date('2023-06-20'),
      expiryDate: new Date('2024-06-20'),
      url: 'https://analytics.google.com',
      employeeId: employees[2].id,
    },
    {
      name: 'Scrum Master Certification',
      issuer: 'Scrum Alliance',
      issueDate: new Date('2022-11-10'),
      expiryDate: new Date('2024-11-10'),
      url: 'https://scrumalliance.org',
      employeeId: employees[1].id,
    },
  ]

  for (const cert of certifications) {
    const createdCert = await prisma.certification.create({
      data: cert,
    })
    console.log('✅ Certification created:', createdCert.name)
  }

  console.log('✨ Database seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })