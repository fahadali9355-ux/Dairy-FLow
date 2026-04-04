import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import logRoutes from './routes/logRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import billingRoutes from './routes/billingRoutes.js';

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/billing', billingRoutes);

app.get('/', (req, res) => {
  res.send('DairyFlow API is running');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
