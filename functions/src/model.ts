import { NonEmptyString } from "io-ts-types/lib/NonEmptyString";

export type TweetURL = NonEmptyString;
export const TweetURL = NonEmptyString;

export const TweetNotFound = "TweetNotFound" as const;

export const InvalidArguments = "InvalidArguments" as const;

export const FailedToGeneratePDF = "FailedToGeneratePDF" as const;

export type TweetURLError = typeof InvalidArguments | typeof TweetNotFound;

export const pattern = /^https:\/\/twitter\.com\/\w{1,15}\/status\/([0-9]+)$/;

export type TweetID = number & { readonly __DegreeBrand: unique symbol };

export type TwitterUser = {
  id: string;
  [K: string]: unknown;
};

export type TwitSettings = {
  consumer_key: string;
  consumer_secret: string;
  access_token: string;
  access_token_secret: string;
};

export type ValidatedTweetURL = TweetURL & {
  readonly __ValidatedTweetURLBrand: unique symbol;
};
