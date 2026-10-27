const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    date: {
      type: String,
      required: [true, 'Date (YYYY-MM-DD) is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD'],
    },
    clockIn: {
      type: Date,
      required: [true, 'Clock-in time is required'],
    },
    clockOut: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['Present', 'Late', 'Half-day'],
        message: '{VALUE} is not a valid attendance status',
      },
      default: 'Present',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure 1 attendance record per user per day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
