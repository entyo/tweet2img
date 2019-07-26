import * as IO from "fp-ts/lib/IO";
import { pipe } from "fp-ts/lib/pipeable";

export const panic = IO.io.of(() => process.exit(1));
export const error = (msg: string) => IO.io.of(() => console.error(msg));
export const panicWithErrorLog = (msg: string) =>
  pipe(
    error(msg),
    panic
  );
