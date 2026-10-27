const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { verifyToken, requireRoles } = require('../middleware/auth');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Training = require('../models/Training');
const Announcement = require('../models/Announcement');

// Helper to generate JWT token
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'staffsync_super_secret_jwt_key_2025_hrms';
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      department: user.department,
    },
    secret,
    { expiresIn: '7d' }
  );
};

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

// POST /api/auth/register
router.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, department, designation, managerId } = req.body;

    if (!name || !email || !password || !department || !designation) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields: name, email, password, department, designation',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email address already exists',
      });
    }

    // Role safety: default to Employee if not specified or invalid
    const validRoles = ['HR', 'Manager', 'Employee'];
    const assignedRole = validRoles.includes(role) ? role : 'Employee';

    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: assignedRole,
      department,
      designation,
      managerId: managerId || null,
    });

    await user.save();
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user,
    });
  } catch (err) {
    console.error('[Register Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Server error while registering user',
    });
  }
});

// POST /api/auth/login
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both email and password',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. User not found.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Incorrect password.',
      });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user,
    });
  } catch (err) {
    console.error('[Login Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Server error during login',
    });
  }
});

// GET /api/auth/me
router.get('/auth/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('managerId', 'name email designation department');
    return res.json({
      success: true,
      user,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Error fetching user profile',
    });
  }
});

// ==========================================
// 2. EMPLOYEE MANAGEMENT ROUTES
// ==========================================

// GET /api/employees
router.get('/employees', verifyToken, async (req, res) => {
  try {
    const { search, department, role, page = 1, limit = 50 } = req.query;

    const query = {};

    // Search filter across name, email, designation
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } },
      ];
    }

    if (department && department !== 'All') {
      query.department = department;
    }

    if (role && role !== 'All') {
      query.role = role;
    }

    // Role-specific scoping:
    // HR can view all employees
    // Manager can view all (for cross-team collab / assignment) or filtered by their managerId
    if (req.user.role === 'Manager' && req.query.teamOnly === 'true') {
      query.managerId = req.user._id;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);
    const employees = await User.find(query)
      .populate('managerId', 'name email department designation')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Also get managers list for dropdowns
    const managers = await User.find({ role: { $in: ['Manager', 'HR'] } }).select('_id name email department designation');

    return res.json({
      success: true,
      employees,
      managers,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    console.error('[Get Employees Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Error retrieving employee directory',
    });
  }
});

// POST /api/employees (HR only)
router.post('/employees', verifyToken, requireRoles(['HR']), async (req, res) => {
  try {
    const { name, email, password, role, department, designation, managerId } = req.body;

    if (!name || !email || !department || !designation) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, department, and designation are required',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'An employee with this email already exists',
      });
    }

    const newEmployee = new User({
      name,
      email: email.toLowerCase(),
      password: password || 'StaffSync@2025', // Default initial password if none provided
      role: role || 'Employee',
      department,
      designation,
      managerId: managerId || null,
    });

    await newEmployee.save();

    const populated = await User.findById(newEmployee._id).populate('managerId', 'name email designation');

    return res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      employee: populated,
    });
  } catch (err) {
    console.error('[Create Employee Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Error creating new employee',
    });
  }
});

// ==========================================
// 3. ATTENDANCE ROUTES
// ==========================================

// Helper to format Date to YYYY-MM-DD
const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// POST /api/attendance/clock-in
router.post('/attendance/clock-in', verifyToken, async (req, res) => {
  try {
    const today = getTodayDateString();
    const existing = await Attendance.findOne({ userId: req.user._id, date: today });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'You have already clocked in for today.',
        attendance: existing,
      });
    }

    const now = new Date();
    // Rule: if clock-in is past 09:30 AM local, mark as Late
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const isLate = hours > 9 || (hours === 9 && minutes > 30);
    const status = isLate ? 'Late' : 'Present';

    const attendance = new Attendance({
      userId: req.user._id,
      date: today,
      clockIn: now,
      status,
    });

    await attendance.save();

    return res.status(201).json({
      success: true,
      message: `Clock-in successful. Status: ${status}`,
      attendance,
    });
  } catch (err) {
    console.error('[Clock-In Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Error recording clock-in',
    });
  }
});

// POST /api/attendance/clock-out
router.post('/attendance/clock-out', verifyToken, async (req, res) => {
  try {
    const today = getTodayDateString();
    const attendance = await Attendance.findOne({ userId: req.user._id, date: today });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        error: 'No active clock-in found for today. Please clock in first.',
      });
    }

    if (attendance.clockOut) {
      return res.status(400).json({
        success: false,
        error: 'You have already clocked out for today.',
        attendance,
      });
    }

    const now = new Date();
    attendance.clockOut = now;

    // Check duration: if shift is less than 4 hours, mark Half-day
    const diffHours = (now.getTime() - new Date(attendance.clockIn).getTime()) / (1000 * 60 * 60);
    if (diffHours < 4 && attendance.status !== 'Late') {
      attendance.status = 'Half-day';
    }

    await attendance.save();

    return res.json({
      success: true,
      message: 'Clock-out successful. Shift ended.',
      attendance,
      durationHours: diffHours.toFixed(2),
    });
  } catch (err) {
    console.error('[Clock-Out Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Error recording clock-out',
    });
  }
});

// GET /api/attendance/my-logs
router.get('/attendance/my-logs', verifyToken, async (req, res) => {
  try {
    const logs = await Attendance.find({ userId: req.user._id })
      .sort({ date: -1, clockIn: -1 })
      .limit(60);

    const today = getTodayDateString();
    const todayRecord = logs.find((log) => log.date === today) || null;

    return res.json({
      success: true,
      today: todayRecord,
      logs,
    });
  } catch (err) {
    console.error('[Attendance Logs Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Error retrieving attendance logs',
    });
  }
});

// GET /api/attendance/all (HR and Managers)
router.get('/attendance/all', verifyToken, requireRoles(['HR', 'Manager']), async (req, res) => {
  try {
    const { date, status, department } = req.query;
    const query = {};

    if (date) {
      query.date = date;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    let records = await Attendance.find(query)
      .populate('userId', 'name email department designation managerId')
      .sort({ date: -1, clockIn: -1 });

    // If Manager, filter by team members or their own department
    if (req.user.role === 'Manager') {
      records = records.filter(
        (rec) =>
          rec.userId &&
          (String(rec.userId.managerId) === String(req.user._id) ||
            String(rec.userId._id) === String(req.user._id) ||
            rec.userId.department === req.user.department)
      );
    }

    // Filter by department if passed
    if (department && department !== 'All') {
      records = records.filter((rec) => rec.userId && rec.userId.department === department);
    }

    return res.json({
      success: true,
      count: records.length,
      records,
    });
  } catch (err) {
    console.error('[All Attendance Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Error retrieving company attendance records',
    });
  }
});

// ==========================================
// 4. LEAVE MANAGEMENT ROUTES
// ==========================================

// POST /api/leaves
router.post('/leaves', verifyToken, async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Leave type, start date, end date, and reason are required',
      });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        success: false,
        error: 'Start date cannot be after end date',
      });
    }

    const leave = new Leave({
      userId: req.user._id,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      status: 'Pending',
    });

    await leave.save();
    const populated = await Leave.findById(leave._id).populate('userId', 'name email department designation');

    return res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      leave: populated,
    });
  } catch (err) {
    console.error('[Submit Leave Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Error submitting leave request',
    });
  }
});

// GET /api/leaves (Self / Team filter)
router.get('/leaves', verifyToken, async (req, res) => {
  try {
    const { scope = 'all', status } = req.query;
    let query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (req.user.role === 'Employee') {
      // Employees can only view their own leaves
      query.userId = req.user._id;
    } else if (req.user.role === 'Manager') {
      // Managers can switch between viewing 'my' leaves and 'team' leaves
      if (scope === 'my') {
        query.userId = req.user._id;
      } else {
        // Find all direct reports
        const directReports = await User.find({ managerId: req.user._id }).select('_id');
        const reportIds = directReports.map((r) => r._id);
        // Include direct reports or own leaves
        query.userId = { $in: [...reportIds, req.user._id] };
      }
    } else if (req.user.role === 'HR') {
      // HR can view all leaves, or filter by 'my'
      if (scope === 'my') {
        query.userId = req.user._id;
      }
      // Otherwise query encompasses all leaves
    }

    const leaves = await Leave.find(query)
      .populate('userId', 'name email department designation managerId')
      .populate('reviewedBy', 'name email designation')
      .sort({ createdAt: -1 });

    // Calculate user's remaining leave balance for current year
    const userLeavesThisYear = await Leave.find({
      userId: req.user._id,
      status: 'Approved',
      startDate: { $gte: new Date(new Date().getFullYear(), 0, 1) },
    });

    const usedCasual = userLeavesThisYear.filter((l) => l.leaveType === 'Casual').length;
    const usedSick = userLeavesThisYear.filter((l) => l.leaveType === 'Sick').length;
    const usedEarned = userLeavesThisYear.filter((l) => l.leaveType === 'Earned').length;

    const balances = {
      Casual: { total: 12, used: usedCasual, remaining: Math.max(0, 12 - usedCasual) },
      Sick: { total: 10, used: usedSick, remaining: Math.max(0, 10 - usedSick) },
      Earned: { total: 15, used: usedEarned, remaining: Math.max(0, 15 - usedEarned) },
    };

    return res.json({
      success: true,
      leaves,
      balances,
    });
  } catch (err) {
    console.error('[Get Leaves Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Error fetching leave records',
    });
  }
});

// PATCH /api/leaves/:id (Approve/Reject by Manager/HR)
router.patch('/leaves/:id', verifyToken, requireRoles(['Manager', 'HR']), async (req, res) => {
  try {
    const { status, comments } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status must be either "Approved" or "Rejected"',
      });
    }

    const leave = await Leave.findById(req.id || req.params.id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        error: 'Leave request not found',
      });
    }

    // Role check: If Manager, verify this employee is in their team or department
    if (req.user.role === 'Manager') {
      const applicant = await User.findById(leave.userId);
      if (
        applicant &&
        String(applicant.managerId) !== String(req.user._id) &&
        applicant.department !== req.user.department
      ) {
        return res.status(403).json({
          success: false,
          error: 'Managers can only approve or reject leaves for their direct reports or team',
        });
      }
    }

    leave.status = status;
    leave.reviewedBy = req.user._id;
    if (comments) leave.comments = comments;

    await leave.save();

    const updated = await Leave.findById(leave._id)
      .populate('userId', 'name email department designation')
      .populate('reviewedBy', 'name email designation');

    return res.json({
      success: true,
      message: `Leave request marked as ${status}`,
      leave: updated,
    });
  } catch (err) {
    console.error('[Update Leave Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Error updating leave status',
    });
  }
});

// ==========================================
// 5. TRAINING & UPSKILLING ROUTES
// ==========================================

// GET /api/training
router.get('/training', verifyToken, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'Employee') {
      // Employees see trainings assigned specifically to them or open to their department
      query = {
        $or: [{ assignedTo: req.user._id }, { department: req.user.department }, { department: 'All' }],
      };
    }

    const trainings = await Training.find(query)
      .populate('assignedTo', 'name email department designation')
      .populate('progress.userId', 'name email')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      trainings,
    });
  } catch (err) {
    console.error('[Get Training Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Error fetching training modules',
    });
  }
});

// POST /api/training (Manager and HR)
router.post('/training', verifyToken, requireRoles(['Manager', 'HR']), async (req, res) => {
  try {
    const { title, description, department, assignedTo } = req.body;

    if (!title || !description || !department) {
      return res.status(400).json({
        success: false,
        error: 'Title, description, and department are required',
      });
    }

    let targetUsers = [];
    if (Array.isArray(assignedTo) && assignedTo.length > 0) {
      targetUsers = assignedTo;
    } else {
      // If department selected and no specific user list, assign to all members in that department
      const deptFilter = department === 'All' ? {} : { department };
      const usersInDept = await User.find(deptFilter).select('_id');
      targetUsers = usersInDept.map((u) => u._id);
    }

    const progressInitial = targetUsers.map((uid) => ({
      userId: uid,
      completed: false,
      completedAt: null,
    }));

    const training = new Training({
      title,
      description,
      department,
      assignedTo: targetUsers,
      progress: progressInitial,
    });

    await training.save();

    const populated = await Training.findById(training._id)
      .populate('assignedTo', 'name email department designation')
      .populate('progress.userId', 'name email');

    return res.status(201).json({
      success: true,
      message: 'Training module created and assigned successfully',
      training: populated,
    });
  } catch (err) {
    console.error('[Create Training Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Error creating training module',
    });
  }
});

// PATCH /api/training/:id/toggle
router.patch('/training/:id/toggle', verifyToken, async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({
        success: false,
        error: 'Training module not found',
      });
    }

    const targetUserId = req.body.userId || req.user._id;

    // Check permission: employees can toggle their own; managers/HR can toggle for anyone
    if (String(targetUserId) !== String(req.user._id) && !['Manager', 'HR'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'You are only permitted to update your own training progress',
      });
    }

    let progItem = training.progress.find((p) => String(p.userId) === String(targetUserId));
    if (progItem) {
      progItem.completed = !progItem.completed;
      progItem.completedAt = progItem.completed ? new Date() : null;
    } else {
      training.progress.push({
        userId: targetUserId,
        completed: true,
        completedAt: new Date(),
      });
      if (!training.assignedTo.some((id) => String(id) === String(targetUserId))) {
        training.assignedTo.push(targetUserId);
      }
    }

    await training.save();

    const updated = await Training.findById(training._id)
      .populate('assignedTo', 'name email department designation')
      .populate('progress.userId', 'name email');

    return res.json({
      success: true,
      message: 'Training progress updated successfully',
      training: updated,
    });
  } catch (err) {
    console.error('[Toggle Training Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Error updating training completion',
    });
  }
});

// ==========================================
// 6. ANNOUNCEMENT ROUTES
// ==========================================

// GET /api/announcements
router.get('/announcements', verifyToken, async (req, res) => {
  try {
    const { priority } = req.query;
    const query = {};

    if (priority && priority !== 'All') {
      query.priority = priority;
    }

    const announcements = await Announcement.find(query)
      .populate('postedBy', 'name email role department')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: announcements.length,
      announcements,
    });
  } catch (err) {
    console.error('[Get Announcements Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Error fetching announcements',
    });
  }
});

// POST /api/announcements (HR only)
router.post('/announcements', verifyToken, requireRoles(['HR']), async (req, res) => {
  try {
    const { title, content, priority = 'Normal' } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required',
      });
    }

    const announcement = new Announcement({
      title,
      content,
      priority,
      postedBy: req.user._id,
    });

    await announcement.save();

    const populated = await Announcement.findById(announcement._id).populate('postedBy', 'name email role department');

    return res.status(201).json({
      success: true,
      message: 'Announcement published successfully',
      announcement: populated,
    });
  } catch (err) {
    console.error('[Create Announcement Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Error posting announcement',
    });
  }
});

// ==========================================
// 7. DASHBOARD OVERVIEW & METRICS
// ==========================================

// GET /api/dashboard/stats
router.get('/dashboard/stats', verifyToken, async (req, res) => {
  try {
    const today = getTodayDateString();

    // 1. Total staff
    const totalStaff = await User.countDocuments();

    // 2. Present Today (all attendance records today)
    const presentTodayCount = await Attendance.countDocuments({
      date: today,
      status: { $in: ['Present', 'Late', 'Half-day'] },
    });

    // 3. Pending Leaves count (role scoped)
    let pendingLeavesQuery = { status: 'Pending' };
    if (req.user.role === 'Employee') {
      pendingLeavesQuery.userId = req.user._id;
    } else if (req.user.role === 'Manager') {
      const reports = await User.find({ managerId: req.user._id }).select('_id');
      pendingLeavesQuery.userId = { $in: reports.map((r) => r._id) };
    }
    const pendingLeavesCount = await Leave.countDocuments(pendingLeavesQuery);

    // 4. Active Announcements count
    const activeAnnouncementsCount = await Announcement.countDocuments();

    // 5. User's personal status today
    const myTodayAttendance = await Attendance.findOne({
      userId: req.user._id,
      date: today,
    });

    // 6. Recent announcements
    const recentAnnouncements = await Announcement.find()
      .populate('postedBy', 'name role department')
      .sort({ createdAt: -1 })
      .limit(3);

    // 7. Department breakdown (for HR & Manager)
    const departmentBreakdown = await User.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // 8. Recent leave requests
    const recentLeaves = await Leave.find(
      req.user.role === 'Employee' ? { userId: req.user._id } : {}
    )
      .populate('userId', 'name department designation')
      .sort({ createdAt: -1 })
      .limit(5);

    return res.json({
      success: true,
      stats: {
        totalStaff,
        presentToday: presentTodayCount,
        pendingLeaves: pendingLeavesCount,
        activeAnnouncements: activeAnnouncementsCount,
      },
      myTodayAttendance,
      recentAnnouncements,
      departmentBreakdown,
      recentLeaves,
    });
  } catch (err) {
    console.error('[Dashboard Stats Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Error fetching dashboard metrics',
    });
  }
});

module.exports = router;
