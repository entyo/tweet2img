import { IOEither, tryCatch } from "fp-ts/lib/IOEither";
import fs from "fs";

export function readFileSync(path: string): IOEither<Error, string> {
  return tryCatch(
    () => fs.readFileSync(path, "utf8"),
    reason => new Error(`ファイルを読み込めませんでした: ${reason}`)
  );
}
