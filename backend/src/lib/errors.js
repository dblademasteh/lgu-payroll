export class AppError extends Error {
  constructor(message, status = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function isAppError(err) {
  return err instanceof AppError;
}