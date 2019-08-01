import { TaskEither, tryCatch } from 'fp-ts/lib/TaskEither';
import { join } from 'path';
import { exec } from 'child_process';
import { errorHandler } from './util';

export function setFontConfig(): TaskEither<string, void> {
  return tryCatch(
    () =>
      new Promise((resolve, reject) => {
        exec(`fc-cache -v ${join(__dirname, '..', 'fonts')}`, error => {
          if (error) {
            return reject(error);
          }
          resolve();
        });
      }),
    reason => errorHandler('フォントファイルの読み込みに失敗しました', reason)
  );
}
