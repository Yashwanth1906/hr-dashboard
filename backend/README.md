# HR Dashboard Backend API

A comprehensive backend API for the HR Dashboard application built with Express.js, Prisma ORM, and PostgreSQL.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Employee Management**: CRUD operations for employee records
- **Task Management**: Create, assign, and track tasks
- **Attendance Tracking**: Clock in/out with location support
- **Leave Management**: Request and approve leaves
- **Certifications**: Track employee certifications
- **Analytics**: Dashboard statistics and reports
- **Notifications**: Real-time notification system
- **Teams**: Department and team management

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL (Neon)
- **Authentication**: JWT with bcryptjs
- **Validation**: Zod

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma    # Database schema
│   ├── seed.ts          # Seed data
│   └── config.ts        # Prisma configuration
├── src/
│   ├── lib/
│   │   └── prisma.ts    # Prisma client instance
│   ├── middleware/
│   │   └── auth.ts      # Authentication middleware
│   ├── routes/
│   │   ├── auth.ts      # Authentication routes
│   │   ├── users.ts     # User management
│   │   ├── employees.ts # Employee CRUD
│   │   ├── tasks.ts     # Task management
│   │   ├── attendance.ts # Attendance tracking
│   │   ├── leaves.ts    # Leave management
│   │   ├── certifications.ts # Certifications
│   │   ├── notifications.ts # Notifications
│   │   ├── analytics.ts # Dashboard analytics
│   │   └── teams.ts     # Team management
│   └── server.ts        # Express app entry point
├── .env                 # Environment variables
├── package.json
└── tsconfig.json
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the backend directory:

```env
DATABASE_URL="postgresql://neondb_owner:npg_nMKf8hOg6pUu@ep-damp-water-ail278ri-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3001
```

### 3. Database Setup

Run the database migrations and generate the Prisma client:

```bash
# Run migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Seed the database with initial data
npm run db:seed
```

Or run all setup steps at once:

```bash
npm run db:setup
```

### 4. Start the Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3001`

### 5. Access Prisma Studio (Optional)

```bash
npm run db:studio
```

Prisma Studio will open at `http://localhost:5555`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Employees
- `GET /api/employees` - List all employees
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Tasks
- `GET /api/tasks` - List all tasks
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/tasks/assigned/:userId` - Get tasks assigned to user

### Attendance
- `GET /api/attendance` - List attendance records
- `GET /api/attendance/user/:userId` - Get user's attendance
- `POST /api/attendance/clock-in` - Clock in
- `POST /api/attendance/clock-out` - Clock out
- `GET /api/attendance/status/:userId` - Get clock status

### Leaves
- `GET /api/leaves` - List all leaves
- `GET /api/leaves/user/:userId` - Get user's leaves
- `POST /api/leaves` - Request leave
- `PUT /api/leaves/:id` - Update leave
- `PUT /api/leaves/:id/approve` - Approve leave
- `PUT /api/leaves/:id/reject` - Reject leave
- `DELETE /api/leaves/:id` - Delete leave

### Certifications
- `GET /api/certifications` - List all certifications
- `GET /api/certifications/user/:userId` - Get user's certifications
- `POST /api/certifications` - Add certification
- `PUT /api/certifications/:id` - Update certification
- `DELETE /api/certifications/:id` - Delete certification

### Notifications
- `GET /api/notifications` - List notifications
- `GET /api/notifications/user/:userId` - Get user's notifications
- `POST /api/notifications` - Create notification
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all/:userId` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard stats
- `GET /api/analytics/attendance` - Get attendance stats
- `GET /api/analytics/tasks` - Get task stats
- `GET /api/analytics/leaves` - Get leave stats

### Teams
- `GET /api/teams` - List all teams
- `GET /api/teams/:id` - Get team by ID
- `POST /api/teams` - Create team
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team

## Authentication

All protected routes require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Default Users (After Seeding)

The seed script creates the following users:

| Email | Password | Role |
|-------|----------|------|
| admin@company.com | admin123 | ADMIN |
| hr@company.com | hr123 | HR |
| manager@company.com | manager123 | MANAGER |
| employee@company.com | employee123 | EMPLOYEE |

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:migrate` - Run database migrations
- `npm run db:generate` - Generate Prisma client
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with initial data
- `npm run db:setup` - Run migrations, generate client, and seed

## Error Handling

The API uses standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

Error responses follow this format:

```json
{
  "error": "Error message description"
}
```

## Security

- Passwords are hashed using bcryptjs
- JWT tokens for authentication
- Role-based access control
- Input validation with Zod
- CORS enabled for frontend integration

## License

ISC