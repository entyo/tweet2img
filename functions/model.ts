import { NonEmptyString } from 'io-ts-types/lib/NonEmptyString';

export type TweetURL = NonEmptyString;
export const TweetURL = NonEmptyString;

export const TweetNotFound = 'TweetNotFound' as const;

export const InvalidArguments = 'InvalidArguments' as const;

export const FailedToGenerateImage = 'FailedToGenerateImage' as const;

export type ServerError = typeof FailedToGenerateImage;

export type TweetURLError = typeof InvalidArguments | typeof TweetNotFound;

export const pattern = /^https:\/\/twitter\.com\/\w{1,15}\/status\/([0-9]+)$/;

export type TweetID = string & { readonly __DegreeBrand: unique symbol };

export type TwitterUser = {
  id: string;
  [K: string]: unknown;
};

export type TwitSettings = {
  TWITTER_BEARER_TOKEN: string;
};

export type ValidatedTweetURL = TweetURL & {
  readonly __ValidatedTweetURLBrand: unique symbol;
};

export const TweetNotFoundMessage = 'ツイートは存在しませんでした。';
export const InvalidRequestMessage = '不正なリクエストです。';
export const InternalServerErrorMessage =
  'サーバサイドでエラーが発生しました。';

export type ImageErrorMessage =
  | typeof TweetNotFoundMessage
  | typeof InvalidRequestMessage
  | typeof InternalServerErrorMessage;
