import { join, resolve } from "path";

import dotenv from "dotenv";
import HtmlWebpackPlugin from "html-webpack-plugin";
import webpack, { DefinePlugin } from "webpack";

module.exports = (_, argv: webpack.Configuration) => {
  // production -> '.env'
  // test -> '.env.test'
  // development/none -> '.env.dev'
  const MODE = process.env.MODE;
  if (!MODE) {
    throw new Error("環境変数$MODEが未設定です");
  }
  const path = join(
    __dirname,
    MODE === "production" ? ".env" : MODE === "test" ? ".env.test" : ".env.dev"
  );

  const fileEnv = dotenv.config({ path }).parsed;

  const envKeys: { [K in string]: string } = Object.keys(fileEnv).reduce(
    (prev, next) => {
      prev[`process.env.${next}`] = JSON.stringify(fileEnv[next]);
      return prev;
    },
    {}
  );

  return {
    entry: "./src/index.tsx",
    devtool: "inline-source-map",
    output: {
      path: join(__dirname, "public"),
      filename: "bundle.js",
      // 'Cannot GET /hogehoge' 対策
      publicPath: "/"
    },
    module: {
      rules: [
        {
          exclude: /node_modules/,
          test: /\.tsx?$/,
          use: "ts-loader"
        },
        {
          exclude: /node_modules/,
          test: /\.scss$/,
          use: [
            {
              loader: "style-loader" // Creates style nodes from JS strings
            },
            {
              loader: "css-loader" // Translates CSS into CommonJS
            },
            {
              loader: "sass-loader" // Compiles Sass to CSS
            }
          ]
        },
        {
          test: /\.(png|jpg)$/,
          loader: "file-loader"
        },
        {
          test: /\.(ttf|eot|woff|woff2)$/,
          loader: "file-loader"
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./src/index.html"
      }),
      new DefinePlugin(envKeys)
    ],
    resolve: {
      extensions: [".ts", ".tsx", ".js"]
    },
    devServer: {
      inline: true,
      contentBase: resolve(__dirname, "dist"),
      historyApiFallback: true,
      watchContentBase: true,
      hot: true,
      open: true,
      port: 8888
    }
  };
};
