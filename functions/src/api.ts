import express from "express";
import * as bodyParser from "body-parser";
import cors from "cors";
import { getEnvironmentVariable } from "./environment";
import {
  Status,
  status,
  Middleware,
  StatusOpen,
  ResponseEnded,
  fromTaskEither,
  decodeQuery
} from "hyper-ts";
import { toRequestHandler } from "hyper-ts/lib/express";
import {
  TweetURL,
  TweetURLError,
  InvalidArguments,
  TweetNotFound,
  ValidatedTweetURL,
  FailedToGeneratePDF
} from "./model";
import * as functions from "firebase-functions";
import { panicWithErrorLog } from "./util";
import { isLeft } from "fp-ts/lib/Either";
import { checkIfTheTweetExists } from "./twitter/client";
import { pipe } from "fp-ts/lib/pipeable";
import * as TE from "fp-ts/lib/TaskEither";
import { generatePdf } from "./pdf";
import * as t from "io-ts";

const config = functions.config();
const variablesTE = getEnvironmentVariable(
  config.runtime && config.runtime.env === "production"
    ? "production"
    : "development"
);

const badRequest = (message: string) =>
  status(Status.BadRequest)
    .closeHeaders()
    .send(message);

const notFound = (message: string) =>
  status(Status.NotFound)
    .closeHeaders()
    .send(message);

const serverError = (message: string) =>
  status(Status.NotFound)
    .closeHeaders()
    .send(message);

const sendError = (
  err: TweetURLError | typeof FailedToGeneratePDF
): Middleware<StatusOpen, ResponseEnded, never, void> => {
  switch (err) {
    case "TweetNotFound":
      return notFound("ツイートは存在しませんでした。");
    case "InvalidArguments":
      return badRequest("不正なリクエストです。");
    case "FailedToGeneratePDF":
      return serverError("サーバサイドでエラーが発生しました。");
  }
};

export const app = express();

const variablesE = variablesTE();
if (isLeft(variablesE)) {
  panicWithErrorLog(variablesE.left.message)();
} else {
  const environtVariable = variablesE.right;
  const {
    ORIGIN,
    TWITTER_CONSUMER_KEY,
    TWITTER_CONSUMER_SECRET,
    TWITTER_ACCESS_TOKEN,
    TWITTER_ACCESS_TOKEN_SECRET
  } = environtVariable;

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
  const parseTweetURLFromQueryMiddleware = decodeQuery(
    t.strict({
      tweetURL: TweetURL
    }).decode
  ).mapLeft<TweetURLError | typeof FailedToGeneratePDF>(() => InvalidArguments);

  const checkIfTheTweetExistsMiddleware = (query: {
    tweetURL: TweetURL;
  }): Middleware<StatusOpen, StatusOpen, TweetURLError, ValidatedTweetURL> =>
    fromTaskEither(
      pipe(
        checkIfTheTweetExists(query.tweetURL, {
          consumer_key: TWITTER_CONSUMER_KEY,
          consumer_secret: TWITTER_CONSUMER_SECRET,
          access_token: TWITTER_ACCESS_TOKEN,
          access_token_secret: TWITTER_ACCESS_TOKEN_SECRET
        }),
        TE.chain(exists =>
          exists
            ? TE.right(query.tweetURL as ValidatedTweetURL)
            : TE.left(TweetNotFound)
        )
      )
    );

  const mapTweetURLToPDF = (
    url: ValidatedTweetURL
  ): Middleware<StatusOpen, StatusOpen, typeof FailedToGeneratePDF, Buffer> =>
    fromTaskEither(
      TE.tryCatch(() => generatePdf(url), () => FailedToGeneratePDF)
    );

  const respondWithPdf = (pdfBuffer: Buffer) =>
    status(Status.OK)
      .header("Content-disposition", `inline; filename="${new Date()}.pdf"`)
      .header("Content-type", "application/pdf")
      .closeHeaders()
      .send(pdfBuffer.toString());

  const getPdf = parseTweetURLFromQueryMiddleware
    .ichain(checkIfTheTweetExistsMiddleware)
    .ichain(mapTweetURLToPDF)
    .ichain(respondWithPdf);

  app.get("/pdf", toRequestHandler(getPdf.orElse(sendError)));
}
