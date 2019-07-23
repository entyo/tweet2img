import * as functions from "firebase-functions";
import dotenv from "dotenv";
import { join } from "path";

const config = functions.config();

const variables = getEnvironmentVariable(
  config.runtime && config.runtime.env === "production"
    ? "production"
    : "development"
);

export const ORIGIN = variables.ORIGIN;
export const API_ROOT = variables.API_ROOT;

function getEnvironmentVariable(
  env: "development" | "production"
): { ORIGIN?: string; API_ROOT?: string } {
  const path = join(
    __dirname,
    "..",
    "..",
    env === "production" ? ".env" : ".env.dev"
  );
  const { parsed } = dotenv.config({ path });
  if (!parsed) {
    throw new Error(`.envファイル(${path})の読み込みに失敗しました`);
  }
  return parsed;
}