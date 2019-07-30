import puppeteer from 'puppeteer';
import { ValidatedTweetURL } from '../model';
import * as TE from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/pipeable';

const errorHandler = (fallbackErrorMessage: string, reason?: unknown) => {
  // Error | string | unknown
  return reason && reason instanceof Error
    ? reason.message
    : typeof reason === 'string'
    ? reason
    : fallbackErrorMessage;
};

export function generateImage(
  tweetURL: ValidatedTweetURL
): TE.TaskEither<string, Buffer> {
  return pipe(
    TE.tryCatch(
      () =>
        puppeteer.launch({
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
          headless: true
        }),
      reason => errorHandler('puppeteer.launchが例外をthrowしました', reason)
    ),
    TE.chain(browser =>
      TE.tryCatch(
        () => browser.newPage(),
        reason => errorHandler('browser.newPageが例外をthrowしました', reason)
      )
    ),
    TE.chain(page =>
      pipe(
        TE.tryCatch(
          () =>
            page.setViewport({ width: 1920, height: 0, deviceScaleFactor: 2 }),
          reason =>
            errorHandler('page.setViewportが例外をthrowしました', reason)
        ),
        TE.map(() => page)
      )
    ),
    TE.chain(page =>
      pipe(
        TE.tryCatch(
          () =>
            page.goto(
              `data:text/html;charset=UTF-8,${encodeURIComponent(
                generateHTML(tweetURL)
              )}`,
              {
                waitUntil: 'networkidle0'
              }
            ),
          reason => errorHandler('page.gotoが例外をthrowしました', reason)
        ),
        TE.map(() => page)
      )
    ),
    TE.chain(page =>
      pipe(
        TE.tryCatch(
          () => page.$('#twitter-widget-0'),
          reason =>
            errorHandler(
              'page.$(\'#twitter-widget-0\')が例外をthrowしました',
              reason
            )
        ),
        TE.chain(widget =>
          widget
            ? TE.tryCatch(
                () => widget.boundingBox(),
                reason =>
                  errorHandler(
                    'widget.boundingBox()が例外をthrowしました',
                    reason
                  )
              )
            : TE.left('#twitter-widget-0が見つかりませんでした')
        ),
        TE.chain(bb =>
          bb
            ? TE.right(bb)
            : TE.left(
                'page.$(\'#twitter-widget-0\').boundingBox()が例外をthrowしました'
              )
        ),
        TE.map(clip => [page, clip] as const)
      )
    ),
    TE.chain(([page, clip]) =>
      pipe(
        TE.tryCatch(
          () => page.screenshot({ clip }),
          reason =>
            errorHandler(
              'page.screenshot({ clip })が例外をthrowしました',
              reason
            )
        ),
        TE.map(image => [page, image] as const)
      )
    ),
    TE.chain(([page, image]) =>
      pipe(
        TE.tryCatch(
          () => page.close(),
          reason => errorHandler('page.close()が例外をthrowしました', reason)
        ),
        TE.map(() => image)
      )
    )
  );
}

function generateHTML(tweetURL: ValidatedTweetURL): string {
  return `
  <!DOCTYPE html>
  <html>
    <body>
      <script async src="https://platform.twitter.com/widgets.js" charset="utf-8">
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
