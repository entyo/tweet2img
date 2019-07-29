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

  getPDF(tweetURL: ValidatedTweetURL): Promise<string> {
    return axios
      .get(`${this.API_ROOT}/pdf?tweetURL=${tweetURL}`)
      .then(res => res.data);
  }
}

export default new Api();
