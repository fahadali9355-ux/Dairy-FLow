import express from 'express';
import { generateSlip } from '../controllers/billingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/generate-slip')
  .get(generateSlip);

export default router;
