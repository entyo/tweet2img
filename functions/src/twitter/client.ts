import twit from "twit";
import * as TE from "fp-ts/lib/TaskEither";
import { TweetNotFound } from "../model";
import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/pipeable";

const pattern = /https:\/\/twitter\.com\/\w{1,15}\/status\/([0-9]+)/;

type TweetID = number & { readonly __DegreeBrand: unique symbol };

type TwitterUser = {
  id: string;
  [K: string]: unknown;
};

export function getStatusId(url: string): O.Option<TweetID> {
  return pipe(
    O.fromNullable(pattern.exec(url)),
    O.chain(matches =>
      O.fromNullable(
        matches && matches.length === 2 ? parseInt(matches[1], 10) : null
      )
    ),
    O.chain(idNumber =>
      O.fromNullable(idNumber && idNumber > 0 ? (idNumber as TweetID) : null)
    )
  );
}

export function checkIfTheTweetExists(
  url: string,
  option: twit.Options
): TE.TaskEither<typeof TweetNotFound, boolean> {
  return pipe(
    TE.fromOption<typeof TweetNotFound>(() => TweetNotFound)(getStatusId(url)),
    TE.map(id => String(id)),
    TE.chain(id =>
      pipe(
        TE.tryCatch(
          () => new twit(option).get("statuses/lookup", { id }),
          () => TweetNotFound
        ),
        TE.map(res => [res, id] as const)
      )
    ),
    TE.map(
      ([res, id]) =>
        (res.data as TwitterUser[]).length === 1 &&
        (res.data as TwitterUser[])[0].id === id
    )
  );
}
