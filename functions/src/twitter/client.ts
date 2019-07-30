import axios from 'axios';
import * as TE from 'fp-ts/lib/TaskEither';
import {
  TweetNotFound,
  TweetURL,
  pattern,
  TweetID,
  TwitSettings
} from '../../model';
import * as O from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';

export function getStatusId(url: TweetURL): O.Option<TweetID> {
  return pipe(
    O.fromNullable(pattern.exec(url)),
    O.chain(matches =>
      O.fromNullable(matches && matches.length === 2 ? matches[1] : null)
    ),
    O.chain(id =>
      O.fromNullable(id && parseInt(id, 10) > 0 ? (id as TweetID) : null)
    )
  );
}

function buildTweetLookupURL(id: TweetID) {
  return `https://api.twitter.com/1.1/statuses/lookup.json?id=${id}`;
}

export function checkIfTheTweetExists(
  url: TweetURL,
  settings: TwitSettings
): TE.TaskEither<typeof TweetNotFound, boolean> {
  return pipe(
    TE.fromOption<typeof TweetNotFound>(() => TweetNotFound)(getStatusId(url)),
    TE.chain(id =>
      pipe(
        TE.tryCatch(
          () =>
            axios.get(buildTweetLookupURL(id), {
              headers: {
                Authorization: `bearer ${settings.TWITTER_BEARER_TOKEN}`
              }
            }),
          () => TweetNotFound
        ),
        TE.map(res => [res.data, id] as const)
      )
    ),
    TE.map(([data, id]) => tweetExists(data, id))
  );
}

function tweetExists(data: unknown, id: TweetID): boolean {
  return (
    Array.isArray(data) &&
    data.length === 1 &&
    typeof data[0] === 'object' &&
    data[0]['id_str'] === id
  );
}
