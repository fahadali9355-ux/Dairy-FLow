import Expense from '../models/Expense.js';

// @desc    Get user expenses
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req, res) => {
  const { startDate, endDate } = req.query;
  
  let query = { userId: req.user._id };

  if (startDate && endDate) {
    // Use provided date range, ensuring the end date includes the full day
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    query.date = {
      $gte: new Date(startDate),
      $lte: end
    };
  } else {
    // Default to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    query.date = {
      $gte: firstDay,
      $lte: lastDay
    };
  }

  try {
    const expenses = await Expense.find(query).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add an expense
// @route   POST /api/expenses
// @access  Private
export const addExpense = async (req, res) => {
  const { category, amount, type, date, description } = req.body;

  try {
    const expense = new Expense({
      userId: req.user._id,
      category,
      amount,
      type,
      date: date || new Date(),
      description
    });

    const createdExpense = await expense.save();
    res.status(201).json(createdExpense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id });
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    await expense.deleteOne();
    res.json({ message: 'Expense removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
