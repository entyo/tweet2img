import React, { useState, useEffect, ChangeEvent } from "react";
import { Control, Button, Input, Field, Help, Progress, Message } from "rbx";
import { Either, left, right, isRight, isLeft } from "fp-ts/lib/Either";
import { tryCatch } from "fp-ts/lib/TaskEither";
import { pattern, ValidatedTweetURL } from "../functions/model";
import api from "./api";
import {
  PDFErrorMessage,
  TweetNotFoundMessage,
  InvalidRequestMessage,
  InternalServerErrorMessage
} from "../functions/model";

type ValidationResult = Either<Error, ValidatedTweetURL>;

function validateTweetURL(urlLike: string): ValidationResult {
  return pattern.test(urlLike)
    ? right(urlLike as ValidatedTweetURL)
    : left(new Error("不正なURLです"));
}

const UnknownError = "未知のエラーが発生しました。";

export function TweetForm() {
  const [userInputUrl, setUserInputUrl] = useState<string | null>(null);

  const [validatedUrl, setValidatedUrl] = useState<ValidatedTweetURL | null>(
    null
  );

  const [validationError, setValidationError] = useState<string | null>(null);

  const [pdfRequestPending, setPdfRequestPending] = useState(false);

  const [pdfRequestError, setPdfRequestError] = useState<
    PDFErrorMessage | typeof UnknownError | null
  >(null);

  const [pdf, setPdf] = useState<string | null>(null);

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

    (async () => {
      setPdfRequestPending(true);
      const pdfTask = await tryCatch(
        () => api.getPDF(validatedUrl),
        e =>
          typeof e === "string" &&
          [
            TweetNotFoundMessage,
            InvalidRequestMessage,
            InternalServerErrorMessage
          ].includes(e)
            ? (e as PDFErrorMessage)
            : (UnknownError as typeof UnknownError)
      )();
      setPdfRequestPending(false);
      if (isLeft(pdfTask)) {
        setPdfRequestError(pdfTask.left);
      } else {
        setPdf(pdfTask.right);
      }
    })();
  }, [validatedUrl]);

  useEffect(() => {
    if (!pdf) {
      return;
    }
    setPdfRequestError(null);
    // ファイルダウンロード
    const url = window.URL.createObjectURL(
      new Blob([pdf], { type: "application/pdf" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `tweet.pdf`);
    // 1. Append to html page
    document.body.appendChild(link);
    // 2. Force download
    link.click();
    // 3. Clean up and remove the link
    const clieanUp = () => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    };
    return clieanUp;
  }, [pdf]);

  return (
    <>
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
      {pdfRequestPending && <Progress />}
      {pdfRequestError && (
        <Message color="danger">
          <Message.Header>エラー</Message.Header>
          <Message.Body>{pdfRequestError}</Message.Body>
        </Message>
      )}
    </>
  );
}
