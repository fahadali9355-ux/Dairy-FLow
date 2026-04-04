import Customer from '../models/Customer.js';
import ExceptionLog from '../models/ExceptionLog.js';

// Native alternative to parseISO and start/end of day
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

// @desc    Generate billing slip for a customer within a date range
// @route   GET /api/billing/generate-slip
// @access  Private
export const generateSlip = async (req, res) => {
  const { customerId, startDate, endDate } = req.query;

  if (!customerId || !startDate || !endDate) {
    return res.status(400).json({ message: 'Missing required parameters: customerId, startDate, endDate' });
  }

  try {
    // 1. Fetch Customer Info
    const customer = await Customer.findOne({ _id: customerId, userId: req.user._id });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const { defaultMilkPerDay, ratePerKg } = customer;

    // 2. Total Days Calculation (Inclusive)
    const start = toStartOfDay(startDate);
    const end = toStartOfDay(endDate);
    const diffTime = Math.abs(end - start);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (totalDays <= 0) {
      return res.status(400).json({ message: 'Invalid date range: startDate must be before or equal to endDate' });
    }

    // 3. Base Milk
    const baseMilk = totalDays * defaultMilkPerDay;

    // 4. Fetch Exception Logs
    const logs = await ExceptionLog.find({
      userId: req.user._id,
      customerId,
      date: { $gte: toStartOfDay(startDate), $lte: toEndOfDay(endDate) }
    });

    // 5. Calculate Extra Milk
    const extraMilkSum = logs
      .filter(log => log.type === 'EXTRA')
      .reduce((sum, log) => sum + (log.quantity || 0), 0);

    // 6. Calculate Absent Count & Deducted Milk
    const absentCount = logs.filter(log => log.type === 'ABSENT').length;
    const deductedMilk = absentCount * defaultMilkPerDay;

    // 7. Final Logic
    const finalTotalKg = baseMilk + extraMilkSum - deductedMilk;
    const totalBillAmount = finalTotalKg * ratePerKg;

    // 8. Return Clean Output
    res.json({
      customerName: customer.name,
      period: { startDate, endDate, totalDays },
      calculations: {
        baseMilk,
        extraMilkSum,
        absentCount,
        deductedMilk,
        finalTotalKg,
        ratePerKg,
        totalBillAmount
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
