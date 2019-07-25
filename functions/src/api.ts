import express from "express";
import * as bodyParser from "body-parser";
import cors from "cors";
import { getEnvironmentVariable } from "./environment";
import { Status, status, Middleware, StatusOpen } from "hyper-ts";
import { toRequestHandler } from "hyper-ts/lib/express";
import { decodeParam } from "hyper-ts";
import { TweetURL, TweetURLError, InvalidArguments } from "./model";
import * as functions from "firebase-functions";

const config = functions.config();

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

// returns a middleware validating `req.param.tweetURL`
const parseTweetURLMiddleware = decodeParam(
  "tweetURL",
  TweetURL.decode
).mapLeft<TweetURLError>(() => InvalidArguments);

const checkIfTheTweetExists = (
  tweetURL: TweetURL
): Middleware<StatusOpen, StatusOpen, TweetURLError, TweetURL> =>
  userId === "ab" ? of({ name: "User name..." }) : fromLeft(UserNotFound);

const mapTweetURLToPDF = (url: TweetURL) =>
  toRequestHandler(
    status(Status.OK)
      .header("Content-disposition", `inline; filename="${new Date()}.pdf"`)
      .header("Content-type", "application/pdf") // ok}
      .closeHeaders()
      .send("Hello hyper-ts!")
  );

app.get("/pdf");
