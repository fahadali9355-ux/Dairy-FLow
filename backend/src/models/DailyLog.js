import mongoose from 'mongoose';

const dailyLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  quantityGiven: {
    type: Number,
    required: true,
    default: 0,
  },
  extraMilk: {
    type: Number,
    required: true,
    default: 0,
  },
  isAbsent: {
    type: Boolean,
    required: true,
    default: false,
  },
  ratePerKg: {
    type: Number,
    required: true,
  }
}, { timestamps: true });

const DailyLog = mongoose.model('DailyLog', dailyLogSchema);
export default DailyLog;
