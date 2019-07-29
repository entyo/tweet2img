import * as functions from "firebase-functions";
import { app } from "./api";

// https://itnext.io/building-a-serverless-restful-api-with-cloud-functions-firestore-and-express-f917a305d4e6
export const api = functions.region("asia-northeast1").https.onRequest(app);
