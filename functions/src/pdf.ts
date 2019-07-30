import puppeteer from "puppeteer";
import { ValidatedTweetURL } from "../model";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import { readFileSync } from "fs";
import { join } from "path";

const FAILED_TO_LAUNCH_PUPPETEER = "Puppeteerの起動に失敗しました。";
const FAILED_TO_OPEN_NEW_PAGE =
  "Puppeteerで新しいページを開こうとしましたが、失敗しました。";
const FAILED_TO_SET_CONTENT =
  "PuppeteerでHTMLをレンダリングしようとしましたが、失敗しました。";
const FAILED_TO_LOAD_ASSET = "アセットファイルの読み込みに失敗しました。";
const FAILED_TO_GENERATE_PDF =
  "PuppeteerでPDFを生成しようとしましたが、失敗しました。";
const FAILED_TO_GENERATE_WIDGET =
  "ツイートのウィジェットがレンダリングできませんでした。";
const FAILED_TO_CLOSE_PUPPETEER = "Puppeteerが異常終了しました。";

export function generatePdf(
  tweetURL: ValidatedTweetURL
): TE.TaskEither<string, Buffer> {
  return pipe(
    TE.tryCatch(
      () =>
        puppeteer.launch({
          args: ["--no-sandbox", "--disable-setuid-sandbox"]
        }),
      () => FAILED_TO_LAUNCH_PUPPETEER
    ),
    TE.chain(browser =>
      TE.tryCatch(() => browser.newPage(), () => FAILED_TO_OPEN_NEW_PAGE)
    ),
    TE.chain(page =>
      pipe(
        TE.tryCatch(
          () => page.setContent(generateHTML(tweetURL)),
          () => FAILED_TO_SET_CONTENT
        ),
        TE.map(() => page)
      )
    ),
    TE.chain(page =>
      pipe(
        TE.tryCatch(
          () =>
            page.evaluate(
              readFileSync(join(__dirname, "..", "widget.js"), "utf8")
            ),
          () => FAILED_TO_LOAD_ASSET
        ),
        TE.map(() => page)
      )
    ),
    TE.chain(page =>
      pipe(
        TE.tryCatch(
          () => page.waitForSelector("#twitter-widget-0"),
          () => FAILED_TO_GENERATE_WIDGET
        ),
        TE.map(() => page)
      )
    ),
    TE.chain(page =>
      pipe(
        TE.tryCatch(
          () =>
            page.pdf({
              format: "A4"
            }),
          () => FAILED_TO_GENERATE_PDF
        ),
        TE.map(buffer => [page, buffer] as const)
      )
    ),
    TE.chain(([page, buffer]) =>
      pipe(
        TE.tryCatch(() => page.close(), () => FAILED_TO_CLOSE_PUPPETEER),
        TE.map(() => buffer)
      )
    )
  );
}

function generateHTML(tweetURL: ValidatedTweetURL): string {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        body {
          margin: 0px;
        }
  
        #twitter-widget-0 {
          width: 100%;
        }
  
        .container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 1.2rem;
          width: 100vw;
          height: 100vh;
        }
      </style>
    </head>
    <body>
      </script>
      <div class="container">
        <blockquote class="twitter-tweet">
          <a href="${tweetURL}"></a>
        </blockquote>
      </div>
    </body>
  </html>
  `;
}
