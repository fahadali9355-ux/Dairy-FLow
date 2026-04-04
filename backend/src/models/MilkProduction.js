import mongoose from 'mongoose';

const milkProductionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  morningQuantity: {
    type: Number,
    required: true,
    default: 0,
  },
  eveningQuantity: {
    type: Number,
    required: true,
    default: 0,
  }
}, { timestamps: true });

const MilkProduction = mongoose.model('MilkProduction', milkProductionSchema);
export default MilkProduction;
