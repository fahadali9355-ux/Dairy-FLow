import mongoose from 'mongoose';
console.log('LOADING CUSTOMER MODEL with defaultMilkPerDay and ratePerKg');

const customerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: false,
  },
  defaultMilkPerDay: {
    type: Number,
    required: true,
    default: 0,
  },
  // Keep the old field name for backward compatibility with cached PWAs
  defaultMilkQuantity: {
    type: Number,
    required: false,
    default: 0,
  },
  ratePerKg: {
    type: Number,
    required: true,
    default: 250,
  }
}, { timestamps: true });

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
