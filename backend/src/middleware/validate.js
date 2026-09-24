import { ZodError } from 'zod';
import { AppError } from '../lib/errors.js';

export function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.query !== undefined) {
        // Express 5 req.query is a getter — assignment throws; defineProperty.
        Object.defineProperty(req, 'query', {
          value: parsed.query,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }
      if (parsed.params !== undefined) req.params = parsed.params;
      next();
    } catch (e) {
      if (e instanceof ZodError) {
        const issues = e.issues || e.errors || [];
        const messages = issues.map((err) => `${err.path.join('.')}: ${err.message}`).join('; ');
        throw new AppError(messages, 400, 'VALIDATION_ERROR');
      }
      throw e;
    }
  };
}