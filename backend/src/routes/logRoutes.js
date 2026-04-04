import express from 'express';
import { getLogs, addDailyLog } from '../controllers/logController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getLogs)
  .post(addDailyLog);

export default router;
