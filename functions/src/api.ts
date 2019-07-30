import express from 'express';
import * as bodyParser from 'body-parser';
import cors from 'cors';
import { getEnvironmentVariable } from './environment';
import * as H from 'hyper-ts';
import { toRequestHandler } from 'hyper-ts/lib/express';
import {
  TweetURL,
  TweetURLError,
  InvalidArguments,
  TweetNotFound,
  ValidatedTweetURL,
  FailedToGenerateImage,
  ServerError,
  TweetNotFoundMessage,
  InvalidRequestMessage,
  InternalServerErrorMessage
} from '../model';
import * as functions from 'firebase-functions';
import { panicWithErrorLog } from './util';
import { isLeft } from 'fp-ts/lib/Either';
import { checkIfTheTweetExists } from './twitter/client';
import { pipe } from 'fp-ts/lib/pipeable';
import * as TE from 'fp-ts/lib/TaskEither';
import { generateImage } from './png';
import * as t from 'io-ts';

const config = functions.config();
const variablesTE = getEnvironmentVariable(
  config.runtime && config.runtime.env === 'production'
    ? 'production'
    : 'development'
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
  err: TweetURLError | typeof FailedToGenerateImage
): H.Middleware<H.StatusOpen, H.ResponseEnded, never, void> => {
  switch (err) {
    case 'TweetNotFound':
      return notFound(TweetNotFoundMessage);
    case 'InvalidArguments':
      return badRequest(InvalidRequestMessage);
    case 'FailedToGenerateImage':
      return serverError(InternalServerErrorMessage);
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
      }
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

  const mapTweetURLToImage = (
    url: ValidatedTweetURL
  ): H.Middleware<
    H.StatusOpen,
    H.StatusOpen,
    ServerError | TweetURLError,
    Buffer
  > =>
    H.fromTaskEither(
      pipe(
        generateImage(url),
        TE.mapLeft(e => {
          console.error(e);
          return FailedToGenerateImage;
        })
      )
    );

  const respondWithImage = (
    imgBuffer: Buffer
  ): H.Middleware<
    H.StatusOpen,
    H.ResponseEnded,
    ServerError | TweetURLError,
    void
  > =>
    pipe(
      H.status(H.Status.OK),
      H.ichain(() =>
        H.header('Content-disposition', `inline; filename="${new Date()}.png"`)
      ),
      H.ichain(() => H.contentType(H.MediaType.imagePNG)),
      H.ichain(() => H.closeHeaders()),
      H.ichain(() => H.send(imgBuffer as any))
    );

  const getImage = pipe(
    parseTweetURLFromQueryMiddleware,
    H.ichain(checkIfTheTweetExistsMiddleware),
    H.ichain(mapTweetURLToImage),
    H.ichain(respondWithImage)
  );

  app.get(
    '/img',
    toRequestHandler(
      pipe(
        getImage,
        H.orElse(sendError)
      )
    )
  );
}
