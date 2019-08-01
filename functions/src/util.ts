import * as IO from 'fp-ts/lib/IO';
import { pipe } from 'fp-ts/lib/pipeable';

export const panic = IO.io.of(() => process.exit(1));
export const error = (msg: string) => IO.io.of(() => console.error(msg));
export const panicWithErrorLog = (msg: string) =>
  pipe(
    error(msg),
    panic
  );

export const errorHandler = (
  fallbackErrorMessage: string,
  reason?: unknown
) => {
  // Error | string | unknown
  return reason && reason instanceof Error
    ? reason.message
    : typeof reason === 'string'
    ? reason
    : fallbackErrorMessage;
};
