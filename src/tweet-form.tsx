import React, { useState, useEffect, ChangeEvent } from "react";
import { Control, Button, Input, Field, Help } from "rbx";
import { Either, left, right, isRight, isLeft } from "fp-ts/lib/Either";
import { pattern, ValidatedTweetURL } from "../functions/src/model";
import api from "./api";

type ValidationResult = Either<Error, ValidatedTweetURL>;

function validateTweetURL(urlLike: string): ValidationResult {
  return pattern.test(urlLike)
    ? right(urlLike as ValidatedTweetURL)
    : left(new Error("不正なURLです"));
}

export function TweetForm() {
  const [userInputUrl, setUserInputUrl] = useState<string | null>(null);

  const [validatedUrl, setValidatedUrl] = useState<ValidatedTweetURL | null>(
    null
  );

  const [validationError, setValidationError] = useState<string | null>(null);

  const onClick = () => {
    if (!userInputUrl) {
      return;
    }
    const validated = validateTweetURL(userInputUrl);
    if (isRight(validated)) {
      setValidatedUrl(validated.right);
    }
  };

  useEffect(() => {
    if (!userInputUrl) {
      return;
    }

    const validated = validateTweetURL(userInputUrl);
    isLeft(validated)
      ? setValidationError(validated.left.message)
      : setValidationError(null);
  }, [userInputUrl]);

  useEffect(() => {
    if (!validatedUrl) {
      return;
    }

    api
      .getPDF(validatedUrl)
      .then(() => console.log("downloaded"), e => console.error(e));
  }, [validatedUrl]);

  return (
    <Field kind="group">
      <Control expanded>
        <Input
          color={validationError ? "danger" : undefined}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setUserInputUrl(e.target.value)
          }
          placeholder="https://twitter.com/e_ntyo/status/1152897532621516800"
        />
        {validationError && <Help color="danger">{validationError}</Help>}
      </Control>
      <Control>
        <Button
          onClick={onClick}
          disabled={Boolean(validationError)}
          color="info"
        >
          PDFファイルを生成
        </Button>
      </Control>
    </Field>
  );
}
