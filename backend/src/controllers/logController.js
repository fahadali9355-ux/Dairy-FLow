import ExceptionLog from '../models/ExceptionLog.js';
import Customer from '../models/Customer.js';

// Native start/end of day logic
const toStartOfDay = (dateStr) => {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
};
const toEndOfDay = (dateStr) => {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d;
};

// @desc    Get user's exception logs
// @route   GET /api/logs
// @access  Private
export const getLogs = async (req, res) => {
  try {
    const logs = await ExceptionLog.find({ userId: req.user._id })
      .populate('customerId', 'name phone')
      .sort({ date: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add an exception log (EXTRA or ABSENT)
// @route   POST /api/logs
// @access  Private
export const addDailyLog = async (req, res) => {
  const { customerId, date, type, quantity } = req.body;

  try {
    // 1. Verify customer belongs to user
    const customer = await Customer.findOne({ _id: customerId, userId: req.user._id });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // 2. Check if an exception log already exists for this date and customer
    const start = toStartOfDay(date);
    const end = toEndOfDay(date);

    const existingLog = await ExceptionLog.findOne({
      userId: req.user._id,
      customerId,
      date: { $gte: start, $lte: end }
    });

    if (existingLog) {
      return res.status(400).json({ message: 'An exception log already exists for this customer on this date' });
    }

    // 3. Create new Exception Log
    const log = new ExceptionLog({
      userId: req.user._id,
      customerId,
      date: start,
      type, // 'EXTRA' or 'ABSENT'
      quantity: type === 'EXTRA' ? quantity : undefined
    });

    const createdLog = await log.save();
    res.status(201).json(createdLog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
