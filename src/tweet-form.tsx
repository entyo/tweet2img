import React, { useState, useEffect, ChangeEvent } from "react";
import { Control, Button, Input, Field, Help } from "rbx";
import { Either, left, right, isLeft } from "fp-ts/lib/Either";
import { pattern } from "../functions/src/model";

type ValidationResult = Either<Error, string>;

function validateTweetURL(urlLike: string): ValidationResult {
  return pattern.test(urlLike)
    ? right(urlLike)
    : left(new Error("不正なURLです"));
}

export function TweetForm() {
  const [userInputUrl, setUserInputUrl] = useState<string | null>(null);

  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!userInputUrl) {
      return;
    }

    const validated = validateTweetURL(userInputUrl);
    return isLeft(validated)
      ? setValidationError(validated.left.message)
      : setValidationError(null);
  }, [userInputUrl]);

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
        <Button disabled={Boolean(validationError)} color="info">
          PDFファイルを生成
        </Button>
      </Control>
    </Field>
  );
}
