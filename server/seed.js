require('dotenv').config();
const { connectDB, disconnectDB } = require('./config/db');
const User = require('./models/User');
const Attendance = require('./models/Attendance');
const Leave = require('./models/Leave');
const Training = require('./models/Training');
const Announcement = require('./models/Announcement');

const seedData = async () => {
  try {
    console.log('[Seed] Starting database seeding process...');

    // Clean existing collections
    await User.deleteMany({});
    await Attendance.deleteMany({});
    await Leave.deleteMany({});
    await Training.deleteMany({});
    await Announcement.deleteMany({});

    console.log('[Seed] Cleared existing records.');

    // 1. Create Core Users (HR, Manager, Employees)
    const hrUser = new User({
      name: 'Victoria Vance',
      email: 'hr@staffsync.com',
      password: 'Password123!',
      role: 'HR',
      department: 'Human Resources',
      designation: 'VP of People & Culture',
    });
    await hrUser.save();

    const managerUser = new User({
      name: 'Marcus Sterling',
      email: 'manager@staffsync.com',
      password: 'Password123!',
      role: 'Manager',
      department: 'Engineering',
      designation: 'Director of Software Engineering',
      managerId: hrUser._id,
    });
    await managerUser.save();

    const employee1 = new User({
      name: 'Alex Rivera',
      email: 'employee@staffsync.com',
      password: 'Password123!',
      role: 'Employee',
      department: 'Engineering',
      designation: 'Senior Full Stack Engineer',
      managerId: managerUser._id,
    });
    await employee1.save();

    const employee2 = new User({
      name: 'Sarah Chen',
      email: 'sarah@staffsync.com',
      password: 'Password123!',
      role: 'Employee',
      department: 'Engineering',
      designation: 'Cloud DevOps Specialist',
      managerId: managerUser._id,
    });
    await employee2.save();

    const employee3 = new User({
      name: 'David Patel',
      email: 'david@staffsync.com',
      password: 'Password123!',
      role: 'Employee',
      department: 'Product & Design',
      designation: 'Product UI/UX Lead',
      managerId: hrUser._id,
    });
    await employee3.save();

    console.log('[Seed] Created 5 users: HR, Manager, and 3 Employees.');

    // 2. Create Announcements
    const announcements = [
      {
        title: 'Q4 All-Hands Town Hall & Strategy Reveal',
        content:
          'Join the executive leadership team this Friday at 3:00 PM EST in the Main Auditorium or via the company livestream for our quarterly retrospectives, milestone celebrations, and product roadmap announcements.',
        priority: 'Important',
        postedBy: hrUser._id,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Critical: Mandatory Security Compliance & 2FA Rollout',
        content:
          'In accordance with SOC2 Type II compliance guidelines, all team members must complete the cybersecurity awareness refresher and verify multi-factor authentication credentials by end of month.',
        priority: 'Critical',
        postedBy: hrUser._id,
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Annual Health & Wellness Benefit Enrollment',
        content:
          'Annual benefits open enrollment is now live. Review the updated dental, vision, and wellness gym reimbursement packages through the HR benefits portal before the deadline.',
        priority: 'Normal',
        postedBy: hrUser._id,
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      },
    ];
    await Announcement.insertMany(announcements);
    console.log('[Seed] Created 3 announcements.');

    // 3. Create Training Programs
    const training1 = new Training({
      title: 'Advanced Microservices Architecture & Resiliency Patterns',
      description:
        'Deep dive into event-driven patterns, distributed tracing with OpenTelemetry, fault tolerance with circuit breakers, and containerized zero-downtime deployments.',
      department: 'Engineering',
      assignedTo: [employee1._id, employee2._id],
      progress: [
        {
          userId: employee1._id,
          completed: true,
          completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
        {
          userId: employee2._id,
          completed: false,
          completedAt: null,
        },
      ],
    });
    await training1.save();

    const training2 = new Training({
      title: 'Human-Centered Design Systems & Accessibility (WCAG 2.2)',
      description:
        'Comprehensive guidelines on building accessible web components, managing design tokens across design systems, and inclusive visual hierarchy.',
      department: 'Product & Design',
      assignedTo: [employee3._id, employee1._id],
      progress: [
        {
          userId: employee3._id,
          completed: true,
          completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          userId: employee1._id,
          completed: false,
          completedAt: null,
        },
      ],
    });
    await training2.save();

    const training3 = new Training({
      title: 'Workplace Ergonomics & Remote Collaboration Best Practices',
      description:
        'Best practices for maintaining physical wellness, asynchronous communication etiquette, and time zone management for hybrid/remote teams.',
      department: 'All',
      assignedTo: [hrUser._id, managerUser._id, employee1._id, employee2._id, employee3._id],
      progress: [
        { userId: hrUser._id, completed: true, completedAt: new Date() },
        { userId: managerUser._id, completed: true, completedAt: new Date() },
        { userId: employee1._id, completed: false, completedAt: null },
        { userId: employee2._id, completed: false, completedAt: null },
        { userId: employee3._id, completed: false, completedAt: null },
      ],
    });
    await training3.save();
    console.log('[Seed] Created 3 training modules.');

    // 4. Create Leave Requests
    const leaves = [
      {
        userId: employee1._id,
        leaveType: 'Casual',
        startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        reason: 'Attending sibling wedding ceremony in Chicago.',
        status: 'Pending',
      },
      {
        userId: employee2._id,
        leaveType: 'Sick',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        reason: 'Acute seasonal flu and doctor recommended bed rest.',
        status: 'Approved',
        reviewedBy: managerUser._id,
        comments: 'Get well soon Sarah. Take full rest.',
      },
      {
        userId: employee3._id,
        leaveType: 'Earned',
        startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
        reason: 'Annual family road trip vacation.',
        status: 'Pending',
      },
      {
        userId: employee1._id,
        leaveType: 'Sick',
        startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000),
        reason: 'Dental emergency procedure.',
        status: 'Approved',
        reviewedBy: managerUser._id,
      },
    ];
    await Leave.insertMany(leaves);
    console.log('[Seed] Created 4 sample leaves.');

    // 5. Create Attendance Records
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;

    // Past 3 days + Today records
    const attendanceRecords = [
      // Today: HR is clocked in
      {
        userId: hrUser._id,
        date: todayStr,
        clockIn: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 45, 0),
        clockOut: null,
        status: 'Present',
      },
      // Today: Manager is clocked in
      {
        userId: managerUser._id,
        date: todayStr,
        clockIn: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 10, 0),
        clockOut: null,
        status: 'Present',
      },
      // Today: Employee 2 is late
      {
        userId: employee2._id,
        date: todayStr,
        clockIn: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 5, 0),
        clockOut: null,
        status: 'Late',
      },
      // Past days for Alex Rivera (employee1)
      {
        userId: employee1._id,
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        clockIn: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 9 * 3600 * 1000),
        clockOut: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 17 * 3600 * 1000),
        status: 'Present',
      },
      {
        userId: employee1._id,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        clockIn: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 9 * 45 * 60 * 1000),
        clockOut: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 18 * 3600 * 1000),
        status: 'Late',
      },
      {
        userId: employee1._id,
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        clockIn: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 9 * 0 * 60 * 1000),
        clockOut: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 13 * 0 * 60 * 1000),
        status: 'Half-day',
      },
    ];

    await Attendance.insertMany(attendanceRecords);
    console.log('[Seed] Created attendance records.');

    console.log('--------------------------------------------------');
    console.log('StaffSync Database Seeding Completed Successfully!');
    console.log('Demo Credentials:');
    console.log('  1. HR Admin:      hr@staffsync.com       / Password123!');
    console.log('  2. Manager:       manager@staffsync.com  / Password123!');
    console.log('  3. Employee:      employee@staffsync.com / Password123!');
    console.log('  4. Dev Employee:  sarah@staffsync.com    / Password123!');
    console.log('  5. UI/UX Lead:    david@staffsync.com    / Password123!');
    console.log('--------------------------------------------------');
  } catch (err) {
    console.error('[Seed Error]:', err);
    throw err;
  }
};

// If run directly via command line
if (require.main === module) {
  connectDB()
    .then(async () => {
      await seedData();
      await disconnectDB();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding script failed:', err);
      process.exit(1);
    });
}

module.exports = seedData;
