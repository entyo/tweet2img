import { ValidatedTweetURL } from "../functions/model";
import axios from "axios";

class Api {
  readonly API_ROOT: string;
  constructor() {
    const API_ROOT = process.env.API_ROOT;
    if (!API_ROOT) {
      throw new Error("API_ROOTが設定されていません");
    }
    this.API_ROOT = API_ROOT;
  }

  /**
   *
   * TwitterのStatus URLを取って、対応する画像をArrayBufferで返す
   */
  getImage(tweetURL: ValidatedTweetURL): Promise<ArrayBuffer> {
    return axios
      .get(`${this.API_ROOT}/img?tweetURL=${tweetURL}`, {
        responseType: "arraybuffer"
      })
      .then(res => res.data);
  }
}

export default new Api();
