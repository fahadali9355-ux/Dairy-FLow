import Customer from '../models/Customer.js';

// @desc    Get all customers for a user
// @route   GET /api/customers
// @access  Private
export const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ userId: req.user._id });
    console.log('UNFILTERED CUSTOMERS:', customers);
    
    // Auto-migrate on retrieval if needed (non-persistent but helps UI)
    const migrated = customers.map(c => {
      const obj = c.toObject();
      const val = Number(obj.defaultMilkPerDay) || Number(obj.defaultMilkQuantity) || 0;
      obj.defaultMilkPerDay = val;
      obj.defaultMilkQuantity = val;
      if (!obj.ratePerKg) obj.ratePerKg = 250;
      return obj;
    });
    
    res.json(migrated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a customer
// @route   POST /api/customers
// @access  Private
export const createCustomer = async (req, res) => {
  const { name, phone, defaultMilkPerDay, defaultMilkQuantity, ratePerKg } = req.body;

  try {
    const milkValue = parseFloat(defaultMilkPerDay || defaultMilkQuantity || 0);
    const rateValue = parseFloat(ratePerKg) || 250;

    const customer = new Customer({
      userId: req.user._id,
      name,
      phone,
      defaultMilkPerDay: milkValue,
      defaultMilkQuantity: milkValue,
      ratePerKg: rateValue
    });
    
    const createdCustomer = await customer.save();
    res.status(201).json(createdCustomer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Private
export const updateCustomer = async (req, res) => {
  const { name, phone, defaultMilkPerDay, defaultMilkQuantity, ratePerKg } = req.body;

  try {
    const customer = await Customer.findOne({ _id: req.params.id, userId: req.user._id });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (name) customer.name = name;
    if (phone) customer.phone = phone;
    
    const milkVal = defaultMilkPerDay !== undefined ? defaultMilkPerDay : defaultMilkQuantity;
    if (milkVal !== undefined) {
      const val = parseFloat(milkVal) || 0;
      customer.defaultMilkPerDay = val;
      customer.defaultMilkQuantity = val;
    }
    
    if (ratePerKg !== undefined) {
      customer.ratePerKg = parseFloat(ratePerKg) || 250;
    }

    const updatedCustomer = await customer.save();
    res.json(updatedCustomer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a customer
// @route   DELETE /api/customers/:id
// @access  Private
export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, userId: req.user._id });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    await customer.deleteOne();
    res.json({ message: 'Customer removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
