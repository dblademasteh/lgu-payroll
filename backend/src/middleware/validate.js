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
      req.body = parsed.body ?? req.body;
      req.query = parsed.query ?? req.query;
      req.params = parsed.params ?? req.params;
      next();
    } catch (e) {
      if (e instanceof ZodError) {
        const messages = e.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join('; ');
        throw new AppError(messages, 400, 'VALIDATION_ERROR');
      }
      throw e;
    }
  };
}

export function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (e) {
      if (e instanceof ZodError) {
        const messages = e.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join('; ');
        throw new AppError(messages, 400, 'VALIDATION_ERROR');
      }
      throw e;
    }
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (e) {
      if (e instanceof ZodError) {
        const messages = e.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join('; ');
        throw new AppError(messages, 400, 'VALIDATION_ERROR');
      }
      throw e;
    }
  };
}

export function validateParams(schema) {
  return (req, res, next) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (e) {
      if (e instanceof ZodError) {
        const messages = e.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join('; ');
        throw new AppError(messages, 400, 'VALIDATION_ERROR');
      }
      throw e;
    }
  };
}