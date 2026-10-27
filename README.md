# StaffSync — Modern Human Resource Management System (MERN Stack)

StaffSync is an enterprise-grade Human Resource Management System (HRMS) built on the MERN stack (MongoDB, Express.js, React + Vite, Node.js) featuring strict Role-Based Access Control (RBAC), real-time biometric shift tracking, multi-tier leave approval workflows, employee upskilling curriculum, and company-wide bulletin boards.

---

## 🏗️ Architecture & Security

StaffSync enforces strict data isolation and permission barriers across three organizational tiers:

| Feature / Module | HR Administrator | Team Manager | Employee |
| :--- | :---: | :---: | :---: |
| **System Authentication** | Full Admin | Team Lead | Self-Service |
| **Employee Directory** | Create, View All, Filter | View Direct Reports / All | View Directory |
| **Attendance Biometric Punch** | Clock In/Out + View All Staff | Clock In/Out + View Team | Clock In/Out + View My Logs |
| **Shift Duration Tracking** | Audit Logs | Team Audits | Live Shift Timer |
| **Leave Management** | View & Approve All Leaves | Review Direct Reports' Leaves | Apply & Track Personal Leaves |
| **Leave Balances** | Entitlement Audit | Balance Tracking | CL (12), SL (10), EL (15) |
| **Training & Upskilling** | Create, Assign, Audit | Create & Assign to Team | Complete & Check off Modules |
| **Notice Board** | Publish Bulletins (All Priorities) | Read Bulletins | Read Bulletins |

### Authentication & Token Flow
- **Encryption**: Passwords hashed with `bcryptjs` (salt rounds: 10).
- **JWT Authentication**: High-entropy JWT tokens signed via `jsonwebtoken` with 7-day expiration.
- **Middleware**:
  - `verifyToken`: Validates incoming Bearer tokens and attaches active user data to `req.user`.
  - `requireRoles([...roles])`: Route-level gatekeeper rejecting unauthorized requests with `HTTP 403 Forbidden`.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18.x or higher)
- **npm** (v9.x or higher)
- *Note:* MongoDB runs natively if available (`mongodb://127.0.0.1:27017/staffsync`) or automatically launches an in-memory embedded MongoDB server (`mongodb-memory-server`) for zero-config immediate operation!

### 1. Install Dependencies
Run from the project root:
```bash
# Install root, server, and client dependencies
npm install
npm install --prefix server
npm install --prefix client
```

### 2. Launch the Application
Run both backend REST API and frontend Vite dev server concurrently:
```bash
# Starts Server on port 5000 and Client on port 5173
npm run dev
```

Alternatively, run in separate terminals:
```bash
# Terminal 1: Backend API
cd server
npm run dev

# Terminal 2: Frontend Client
cd client
npm run dev
```

### 3. Access StaffSync
- **Live Production API**: [https://staffsync-1-fztc.onrender.com/api](https://staffsync-1-fztc.onrender.com/api)
- **Live Production Health Check**: [https://staffsync-1-fztc.onrender.com/api/health](https://staffsync-1-fztc.onrender.com/api/health)
- **Local Frontend Portal**: [http://localhost:5173](http://localhost:5173)
- **Local Backend API**: [http://localhost:5000/api](http://localhost:5000/api)

---

## 👥 Pre-Configured Demo Accounts

For immediate evaluation, the database auto-seeds with pre-configured personas. You can also use the **Instant 1-Click Demo Switcher** bar at the top of the application navbar:

| Role | Name | Corporate Email | Password | Primary Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **HR Admin** | Victoria Vance | `hr@staffsync.com` | `Password123!` | Employee registration, all attendance logs, leave approvals, bulletin broadcast |
| **Manager** | Marcus Sterling | `manager@staffsync.com` | `Password123!` | Team oversight, direct report leave reviews, curriculum assignment |
| **Employee** | Alex Rivera | `employee@staffsync.com` | `Password123!` | Live shift clock-in/out, leave applications, training milestones |
| **Dev Staff** | Sarah Chen | `sarah@staffsync.com` | `Password123!` | Engineering team member, leave records, skills module |
| **UI/UX Lead** | David Patel | `david@staffsync.com` | `Password123!` | Design team member, attendance tracking |

To reseed sample data manually at any time:
```bash
npm run seed --prefix server
```

---

## 📡 REST API Reference

### 1. Authentication (`/api/auth`)
- `POST /api/auth/register`: Create new user (`name`, `email`, `password`, `department`, `designation`, `role`, `managerId`)
- `POST /api/auth/login`: Authenticate credentials and receive JWT Bearer token
- `GET /api/auth/me`: Retrieve current logged-in profile (Protected)

### 2. Employees (`/api/employees`)
- `GET /api/employees`: Search & filter directory by name, email, department, or role
- `POST /api/employees`: Onboard new employee (*HR Only*)

### 3. Attendance (`/api/attendance`)
- `POST /api/attendance/clock-in`: Record clock-in timestamp (automatic Late status if > 09:30 AM)
- `POST /api/attendance/clock-out`: Record clock-out timestamp and compute shift duration
- `GET /api/attendance/my-logs`: Retrieve personal historical shifts
- `GET /api/attendance/all`: Retrieve company/team logs with date and status filters (*HR & Manager*)

### 4. Leaves (`/api/leaves`)
- `POST /api/leaves`: Submit leave application (`leaveType`, `startDate`, `endDate`, `reason`)
- `GET /api/leaves`: Retrieve leaves and remaining balances (`Casual: 12`, `Sick: 10`, `Earned: 15`)
- `PATCH /api/leaves/:id`: Approve or Reject leave request (*Manager & HR*)

### 5. Training (`/api/training`)
- `GET /api/training`: List training modules with progress
- `POST /api/training`: Create and assign training curriculum (*Manager & HR*)
- `PATCH /api/training/:id/toggle`: Toggle employee completion status

### 6. Announcements (`/api/announcements`)
- `GET /api/announcements`: List corporate bulletins with priority tags (`Normal`, `Important`, `Critical`)
- `POST /api/announcements`: Publish announcement (*HR Only*)

### 7. Dashboard Overview (`/api/dashboard/stats`)
- `GET /api/dashboard/stats`: Aggregates KPI metric cards (Total Staff, Present Today, Pending Leaves, Active Announcements, Department breakdown)

---

## 📁 Repository Directory Structure

```
staffsync/
├── .gitignore                    # Root gitignore (node_modules, .env, dist)
├── package.json                  # Root runner script configuration
├── README.md                     # Comprehensive documentation
├── client/                       # React (Vite) Frontend
│   ├── .env                      # Vite environment variables
│   ├── index.html                # HTML entry point with Inter typography
│   ├── package.json              # Frontend dependencies (Bootstrap 5, Lucide)
│   ├── vite.config.js            # Vite configuration with API proxying
│   └── src/
│       ├── main.jsx              # React DOM initialization
│       ├── App.jsx               # Application routing & layout shell
│       ├── index.css             # Design system tokens, glassmorphism, animations
│       ├── api/
│       │   └── axiosClient.js    # Axios client with JWT interceptor
│       ├── context/
│       │   └── AuthContext.jsx   # Authentication & RBAC state provider
│       ├── components/
│       │   ├── Navbar.jsx        # Top brand nav with Demo persona switcher
│       │   ├── StatCard.jsx      # KPI metric cards with Lucide icons
│       │   ├── ToastAlert.jsx    # Notification banner component
│       │   └── AuthModal.jsx     # Login/Register modal dialog
│       └── views/
│           ├── DashboardView.jsx # KPI metrics, shift timer, activity cards
│           ├── EmployeesView.jsx # Searchable directory & HR onboarding modal
│           ├── AttendanceView.jsx# Biometric punch terminal & shift logs
│           ├── LeaveView.jsx     # Leave application, balances, and approvals
│           ├── TrainingView.jsx  # Skill development & completion toggles
│           └── AnnouncementsView.jsx # Corporate notice board feed
└── server/                       # Node.js / Express.js REST API
    ├── .env                      # Server environment configuration
    ├── .env.example              # Example environment template
    ├── package.json              # Backend dependencies (Mongoose, JWT, bcrypt)
    ├── server.js                 # Express server & auto-seeding entry point
    ├── seed.js                   # Realistic database population script
    ├── config/
    │   └── db.js                 # Resilient MongoDB connector (Native + In-Memory)
    ├── middleware/
    │   └── auth.js               # JWT verifyToken and requireRoles RBAC
    ├── models/
    │   ├── User.js               # User model with bcrypt encryption
    │   ├── Attendance.js         # Daily attendance model with compound index
    │   ├── Leave.js              # Leave model with reviewer linkage
    │   ├── Training.js           # Training module with cohort progress
    │   └── Announcement.js       # Corporate announcements with priority enum
    └── routes/
        └── api.js                # Consolidated REST API endpoints
```

---

## 🔒 Security Best Practices
- Strict role checking middleware prevents privilege escalation.
- Passwords are encrypted before storage and excluded by default in JSON responses.
- CORS restricted to controlled origins with credentials enabled.
- Input validation on all critical mutating endpoints.
