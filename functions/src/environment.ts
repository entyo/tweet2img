import dotenv, { DotenvParseOutput } from "dotenv";
import { join } from "path";
import { IOEither, fromEither } from "fp-ts/lib/IOEither";
import { left, right } from "fp-ts/lib/Either";

export type EnvironmentVariable = {
  ORIGIN: string;
  API_ROOT: string;
  TWITTER_CONSUMER_KEY: string;
  TWITTER_CONSUMER_SECRET: string;
  TWITTER_ACCESS_TOKEN: string;
  TWITTER_ACCESS_TOKEN_SECRET: string;
};

export function getEnvironmentVariable(
  env: "development" | "production"
): IOEither<Error, EnvironmentVariable> {
  const path = join(
    __dirname,
    "..",
    "..",
    env === "production" ? ".env" : ".env.dev"
  );
  const { parsed } = dotenv.config({ path });
  return fromEither(
    isEnvironmentVariable(parsed)
      ? right(parsed)
      : left(new Error(`.envファイル(${path})の読み込みに失敗しました`))
  );
}

function isEnvironmentVariable(
  parsed: undefined | EnvironmentVariable | DotenvParseOutput
): parsed is EnvironmentVariable {
  return (
    parsed !== undefined &&
    typeof (parsed as EnvironmentVariable).ORIGIN === "string" &&
    typeof (parsed as EnvironmentVariable).API_ROOT === "string" &&
    typeof (parsed as EnvironmentVariable).TWITTER_CONSUMER_KEY === "string" &&
    typeof (parsed as EnvironmentVariable).TWITTER_CONSUMER_SECRET ===
      "string" &&
    typeof (parsed as EnvironmentVariable).TWITTER_ACCESS_TOKEN === "string" &&
    typeof (parsed as EnvironmentVariable).TWITTER_ACCESS_TOKEN_SECRET ===
      "string"
  );
}
