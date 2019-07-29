import express from "express";
import * as bodyParser from "body-parser";
import cors from "cors";
import { getEnvironmentVariable } from "./environment";
import * as H from "hyper-ts";
import { toRequestHandler } from "hyper-ts/lib/express";
import {
  TweetURL,
  TweetURLError,
  InvalidArguments,
  TweetNotFound,
  ValidatedTweetURL,
  FailedToGeneratePDF,
  ServerError
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

function badRequest<E = never>(
  message: string
): H.Middleware<H.StatusOpen, H.ResponseEnded, E, void> {
  return pipe(
    H.status(H.Status.BadRequest),
    H.ichain(() => H.closeHeaders()),
    H.ichain(() => H.send(message))
  );
}

function notFound<E = never>(
  message: string
): H.Middleware<H.StatusOpen, H.ResponseEnded, E, void> {
  return pipe(
    H.status(H.Status.NotFound),
    H.ichain(() => H.closeHeaders()),
    H.ichain(() => H.send(message))
  );
}

function serverError<E = never>(
  message: string
): H.Middleware<H.StatusOpen, H.ResponseEnded, E, void> {
  return pipe(
    H.status(H.Status.ServerError),
    H.ichain(() => H.closeHeaders()),
    H.ichain(() => H.send(message))
  );
}

const sendError = (
  err: TweetURLError | typeof FailedToGeneratePDF
): H.Middleware<H.StatusOpen, H.ResponseEnded, never, void> => {
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
  const { ORIGIN, TWITTER_BEARER_TOKEN } = environtVariable;

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
  const m = t.interface({
    tweetURL: TweetURL
  });
  const decoded = H.decodeQuery(m.decode);

  const parseTweetURLFromQueryMiddleware = pipe(
    decoded,
    H.mapLeft<t.Errors, ServerError | TweetURLError>(() => InvalidArguments)
  );

  const checkIfTheTweetExistsMiddleware = (query: {
    tweetURL: TweetURL;
  }): H.Middleware<
    H.StatusOpen,
    H.StatusOpen,
    ServerError | TweetURLError,
    ValidatedTweetURL
  > =>
    H.fromTaskEither(
      pipe(
        checkIfTheTweetExists(query.tweetURL, {
          TWITTER_BEARER_TOKEN
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
  ): H.Middleware<
    H.StatusOpen,
    H.StatusOpen,
    ServerError | TweetURLError,
    Buffer
  > =>
    H.fromTaskEither(
      TE.tryCatch(() => generatePdf(url), () => FailedToGeneratePDF)
    );

  const respondWithPdf = (
    pdfBuffer: Buffer
  ): H.Middleware<
    H.StatusOpen,
    H.ResponseEnded,
    ServerError | TweetURLError,
    void
  > =>
    pipe(
      H.status(H.Status.OK),
      H.ichain(() =>
        H.header("Content-disposition", `inline; filename="${new Date()}.pdf"`)
      ),
      H.ichain(() => H.header("Content-type", "application/pdf")),
      H.ichain(() => H.closeHeaders()),
      H.ichain(() => H.send(pdfBuffer.toString()))
    );

  const getPdf = pipe(
    parseTweetURLFromQueryMiddleware,
    H.ichain(checkIfTheTweetExistsMiddleware),
    H.ichain(mapTweetURLToPDF),
    H.ichain(respondWithPdf)
  );

  app.get(
    "/pdf",
    toRequestHandler(
      pipe(
        getPdf,
        H.orElse(sendError)
      )
    )
  );
}
