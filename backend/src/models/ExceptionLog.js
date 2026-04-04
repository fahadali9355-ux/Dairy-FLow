import mongoose from 'mongoose';

const exceptionLogSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['EXTRA', 'ABSENT'],
    required: true,
  },
  quantity: {
    type: Number,
    required: function() {
      return this.type === 'EXTRA';
    },
    default: 0,
  }
}, { timestamps: true });

const ExceptionLog = mongoose.model('ExceptionLog', exceptionLogSchema);
export default ExceptionLog;
