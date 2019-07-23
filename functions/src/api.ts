import express from "express";
import * as bodyParser from "body-parser";

import cors from "cors";

import { ORIGIN } from "./environment";

export const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(
  cors({
    origin: (origin, callback) => {
      return origin && origin === ORIGIN
        ? callback(null, true)
        : callback(new Error(`This origin (${origin}) is not allowed`));
    },
    credentials: true
  })
);
