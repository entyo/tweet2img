import { NonEmptyString } from "io-ts-types/lib/NonEmptyString";

export type TweetURL = NonEmptyString & {
  readonly __TweetURLBrand: unique symbol;
};
export const TweetURL = NonEmptyString;

export const TweetNotFound = "TweetNotFound" as const;

export const InvalidArguments = "InvalidArguments" as const;

export type TweetURLError = typeof InvalidArguments | typeof TweetNotFound;
