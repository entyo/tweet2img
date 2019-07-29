import puppeteer from "puppeteer";
import { ValidatedTweetURL } from "../model";

export async function generatePdf(
  tweetURL: ValidatedTweetURL
): Promise<Buffer> {
  console.info({ tweetURL });
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();
  await page.setContent(generateHTML(tweetURL));
  const buffer = await page.pdf({
    format: "A4"
  });
  await browser.close();
  return buffer;
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
      <blockquote class="twitter-tweet">
        <a href="${tweetURL}"></a>
      </blockquote>
      <script
        async
        src="https://platform.twitter.com/widgets.js"
        charset="utf-8"
      ></script>
    </body>
  </html>
  `;
}
