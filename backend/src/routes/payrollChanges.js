import express from 'express';
import { requireApiKey } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { payrollChangesSchema } from '../shared/contracts/payroll.js';
import { getPayrollChanges } from '../services/payrollChangesService.js';

const router = express.Router();

// External-supplier endpoint for LGU-HRMS payrollAdapter.sync(): returns payroll
// changes since a timestamp as {entity, action, payload} events, keyed by Bearer
// API key with scope payroll:read (no JWT). Mounted before the JWT-gated /payroll
// router in routes/index.js.
router.post('/', requireApiKey(['payroll:read']), validate(payrollChangesSchema), async (req, res, next) => {
  try {
    const result = await getPayrollChanges(req.body?.since);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;